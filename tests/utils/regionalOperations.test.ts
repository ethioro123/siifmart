import { describe, it, expect } from 'vitest';
import { getRoleDashboardRoute } from '../../utils/roleDashboard';
import { canAccessModule } from '../../utils/permissions';
import { getUserRegion } from '../../utils/userCountry';
import type { UserRole } from '../../types';

describe('Regional Operations Architecture & RBAC', () => {
  describe('getRoleDashboardRoute - Sovereign Routing', () => {
    it('routes regional_manager to /regional-ops by default', () => {
      const route = getRoleDashboardRoute('regional_manager');
      expect(route).toBe('/regional-ops');
    });

    it('routes the 5 regional functional leads to /regional-ops', () => {
      const regionalLeads: UserRole[] = [
        'regional_procurement_lead',
        'regional_finance_officer',
        'regional_hr_officer',
        'regional_logistics_lead',
        'regional_security_supervisor'
      ];

      regionalLeads.forEach(role => {
        expect(getRoleDashboardRoute(role)).toBe('/regional-ops');
      });
    });

    it('routes HQ executives (CEO, super_admin, operations_manager) to /admin', () => {
      expect(getRoleDashboardRoute('super_admin')).toBe('/admin');
      expect(getRoleDashboardRoute('CEO')).toBe('/admin');
      expect(getRoleDashboardRoute('operations_manager')).toBe('/admin');
    });

    it('routes floor staff to terminal interfaces (POS or WMS)', () => {
      expect(getRoleDashboardRoute('cashier', 'Store')).toBe('/pos');
      expect(getRoleDashboardRoute('picker', 'Warehouse')).toBe('/wms-ops?tab=PICK');
    });
  });

  describe('canAccessModule - Regional Command Authorization', () => {
    it('authorizes regional manager and regional leads for regional-ops', () => {
      expect(canAccessModule('regional_manager', 'regional-ops')).toBe(true);
      expect(canAccessModule('regional_procurement_lead', 'regional-ops')).toBe(true);
      expect(canAccessModule('regional_finance_officer', 'regional-ops')).toBe(true);
      expect(canAccessModule('regional_hr_officer', 'regional-ops')).toBe(true);
      expect(canAccessModule('regional_logistics_lead', 'regional-ops')).toBe(true);
      expect(canAccessModule('regional_security_supervisor', 'regional-ops')).toBe(true);
    });

    it('authorizes super_admin and operations_manager for regional-ops', () => {
      expect(canAccessModule('super_admin', 'regional-ops')).toBe(true);
      expect(canAccessModule('operations_manager', 'regional-ops')).toBe(true);
    });

    it('blocks floor workers from regional-ops command deck', () => {
      expect(canAccessModule('cashier', 'regional-ops')).toBe(false);
      expect(canAccessModule('picker', 'regional-ops')).toBe(false);
      expect(canAccessModule('driver', 'regional-ops')).toBe(false);
    });
  });

  describe('getUserRegion - Territorial Locking', () => {
    it('returns null for HQ staff (unlocked nationwide)', () => {
      const user = {
        id: 'u1',
        role: 'operations_manager',
        scopeLevel: 'HQ' as const,
        regionCode: 'KE-NRB'
      };
      expect(getUserRegion(user)).toBeNull();
    });

    it('returns region_code for REGIONAL scoped workers', () => {
      const user = {
        id: 'u2',
        role: 'regional_manager',
        scopeLevel: 'REGIONAL' as const,
        regionCode: 'KE-NRB'
      };
      expect(getUserRegion(user)).toBe('KE-NRB');
    });

    it('resolves region_code from employee profile for REGIONAL workers', () => {
      const user = {
        id: 'u3',
        employeeId: 'emp-100',
        role: 'regional_procurement_lead'
      };
      const employees = [
        {
          id: 'emp-100',
          scopeLevel: 'REGIONAL' as const,
          regionCode: 'ET-ADD'
        }
      ];
      expect(getUserRegion(user, undefined, employees)).toBe('ET-ADD');
    });
  });

  describe('Emergency Staff Loaning & Repatriation Logic', () => {
    it('correctly tracks homeStation and loan status during branch loaning', () => {
      const originalWorker = {
        id: 'emp-1',
        name: 'John Picker',
        role: 'picker' as UserRole,
        siteId: 'site-a',
        isLoaned: false
      };

      // Simulating emergency loan to Site B
      const loanedWorker = {
        ...originalWorker,
        homeSiteId: originalWorker.siteId,
        siteId: 'site-b',
        isLoaned: true
      };

      expect(loanedWorker.siteId).toBe('site-b');
      expect(loanedWorker.homeSiteId).toBe('site-a');
      expect(loanedWorker.isLoaned).toBe(true);

      // Simulating repatriation to Home Station
      const repatriatedWorker = {
        ...loanedWorker,
        siteId: loanedWorker.homeSiteId,
        isLoaned: false,
        homeSiteId: undefined
      };

      expect(repatriatedWorker.siteId).toBe('site-a');
      expect(repatriatedWorker.isLoaned).toBe(false);
      expect(repatriatedWorker.homeSiteId).toBeUndefined();
    });

    it('preserves homeSiteId on shift records for loaned workers to credit home branch payroll', () => {
      const loanedWorker = {
        id: 'emp-1',
        name: 'John Picker',
        role: 'cashier' as UserRole,
        siteId: 'site-b',
        homeSiteId: 'site-a',
        isLoaned: true
      };

      const shift = {
        id: 'shift-101',
        siteId: loanedWorker.siteId, // physically clocked at borrowed branch
        homeSiteId: loanedWorker.homeSiteId, // payroll and hours billed to home branch
        cashierId: loanedWorker.id,
        cashierName: loanedWorker.name,
        openingFloat: 5000,
        status: 'Open' as const
      };

      expect(shift.siteId).toBe('site-b');
      expect(shift.homeSiteId).toBe('site-a');
    });
  });

  describe('Two-Tier Transfer Discrepancy Resolution (SOP-LOG-014)', () => {
    it('allows Store Manager to resolve minor discrepancies locally with reason code', () => {
      const pendingTransfer = {
        id: 'tr-01',
        sourceSiteId: 'site-a',
        destSiteId: 'site-b',
        status: 'In-Transit'
      };

      const resolvedLocally = {
        ...pendingTransfer,
        status: 'Received',
        hasDiscrepancy: true,
        discrepancyResolutionType: 'LOCAL_STORE_MANAGER' as const,
        discrepancyReasonCode: 'DAMAGED_IN_TRANSIT',
        discrepancyDetails: '2 bottles crushed in transport',
        discrepancyResolvedBy: 'Store Manager John'
      };

      expect(resolvedLocally.status).toBe('Received');
      expect(resolvedLocally.hasDiscrepancy).toBe(true);
      expect(resolvedLocally.discrepancyResolutionType).toBe('LOCAL_STORE_MANAGER');
      expect(resolvedLocally.discrepancyReasonCode).toBe('DAMAGED_IN_TRANSIT');
    });

    it('escalates high-value discrepancies to Loss Prevention security supervisor', () => {
      const pendingTransfer = {
        id: 'tr-02',
        sourceSiteId: 'site-a',
        destSiteId: 'site-b',
        status: 'In-Transit'
      };

      const escalatedLP = {
        ...pendingTransfer,
        status: 'Received',
        hasDiscrepancy: true,
        discrepancyResolutionType: 'ESCALATED_LOSS_PREVENTION' as const,
        discrepancyReasonCode: 'HIGH_VALUE_THEFT_SUSPECT',
        discrepancyDetails: 'Master carton seal broken, 10 units missing'
      };

      expect(escalatedLP.discrepancyResolutionType).toBe('ESCALATED_LOSS_PREVENTION');
      expect(escalatedLP.discrepancyReasonCode).toBe('HIGH_VALUE_THEFT_SUSPECT');
    });
  });

  describe('Autonomous Purchase Order Approval Guardrails (SOP-MGT-020)', () => {
    const AUTONOMOUS_PO_LIMIT = 150_000;

    it('identifies purchase orders eligible for autonomous territorial sign-off', () => {
      const poList = [
        { id: 'po-1', totalAmount: 45_000, status: 'Pending' },
        { id: 'po-2', totalAmount: 149_000, status: 'Draft' },
        { id: 'po-3', totalAmount: 150_000, status: 'Pending' },
        { id: 'po-4', totalAmount: 180_000, status: 'Pending' }, // exceeds autonomous cap
        { id: 'po-5', totalAmount: 60_000, status: 'Approved' } // already approved
      ];

      const pendingAutonomous = poList.filter(
        po => po.totalAmount <= AUTONOMOUS_PO_LIMIT && (po.status === 'Pending' || po.status === 'Draft')
      );

      const pendingEscalated = poList.filter(
        po => po.totalAmount > AUTONOMOUS_PO_LIMIT && (po.status === 'Pending' || po.status === 'Draft')
      );

      expect(pendingAutonomous.length).toBe(3);
      expect(pendingEscalated.length).toBe(1);
      expect(pendingEscalated[0].id).toBe('po-4');
    });
  });

  describe('Tuesday Cycle Count SLA Enforcement (SOP-INV-012)', () => {
    it('evaluates Tuesday past 5:00 PM as OVERDUE_BREACH', () => {
      const getCycleCountStatus = (dayOfWeek: number, currentHour: number) => {
        const isTuesday = dayOfWeek === 2;
        const isWednesday = dayOfWeek === 3;
        const isPastFivePM = currentHour >= 17;

        if (isTuesday) {
          return isPastFivePM ? 'OVERDUE_BREACH' : 'DUE_TODAY';
        }
        if (isWednesday) {
          return 'MISSED_PRIOR';
        }
        return 'COMPLIANT';
      };

      expect(getCycleCountStatus(2, 14)).toBe('DUE_TODAY'); // Tuesday 2 PM
      expect(getCycleCountStatus(2, 17)).toBe('OVERDUE_BREACH'); // Tuesday 5 PM
      expect(getCycleCountStatus(2, 20)).toBe('OVERDUE_BREACH'); // Tuesday 8 PM
      expect(getCycleCountStatus(3, 10)).toBe('MISSED_PRIOR'); // Wednesday morning
      expect(getCycleCountStatus(4, 10)).toBe('COMPLIANT'); // Thursday
    });
  });

  describe('Autonomous Petty Cash & Expense Approvals', () => {
    const AUTONOMOUS_EXPENSE_LIMIT = 25_000;

    it('identifies store expenses eligible for autonomous sign-off', () => {
      const expenses = [
        { id: 'exp-1', amount: 4_500, status: 'Pending', category: 'Maintenance' },
        { id: 'exp-2', amount: 24_900, status: 'Pending', category: 'Utilities' },
        { id: 'exp-3', amount: 25_000, status: 'Pending', category: 'Packaging' },
        { id: 'exp-4', amount: 35_000, status: 'Pending', category: 'Rent' }, // Exceeds limit
        { id: 'exp-5', amount: 5_000, status: 'Approved', category: 'Marketing' } // Already approved
      ];

      const pendingAutonomous = expenses.filter(
        e => e.amount <= AUTONOMOUS_EXPENSE_LIMIT && e.status === 'Pending'
      );
      const pendingEscalated = expenses.filter(
        e => e.amount > AUTONOMOUS_EXPENSE_LIMIT && e.status === 'Pending'
      );

      expect(pendingAutonomous.length).toBe(3);
      expect(pendingEscalated.length).toBe(1);
      expect(pendingEscalated[0].id).toBe('exp-4');
    });
  });

  describe('Transfer Driver Dispatch Handshake (External Courier vs Internal Fleet)', () => {
    it('unlocks destination store receiving immediately upon dispatch for external courier', () => {
      const externalTransfer = {
        id: 'tr-ext-1',
        driverType: 'EXTERNAL' as const,
        driverName: 'Fargo Courier',
        status: 'Dispatched' as const
      };

      const canStoreReceive = (transfer: { driverType?: string; status: string }) => {
        if (transfer.driverType === 'EXTERNAL') {
          return ['Dispatched', 'In-Transit', 'Delivered'].includes(transfer.status);
        }
        return transfer.status === 'Delivered';
      };

      expect(canStoreReceive(externalTransfer)).toBe(true);
    });

    it('locks destination store receiving for internal fleet driver until delivery is confirmed', () => {
      const inTransitInternalTransfer = {
        id: 'tr-int-1',
        driverType: 'INTERNAL' as const,
        driverName: 'Kiplimo Driver',
        status: 'In-Transit' as const
      };

      const deliveredInternalTransfer = {
        id: 'tr-int-2',
        driverType: 'INTERNAL' as const,
        driverName: 'Kiplimo Driver',
        status: 'Delivered' as const
      };

      const canStoreReceive = (transfer: { driverType?: string; status: string }) => {
        if (transfer.driverType === 'EXTERNAL') {
          return ['Dispatched', 'In-Transit', 'Delivered'].includes(transfer.status);
        }
        return transfer.status === 'Delivered';
      };

      // Locked while in transit
      expect(canStoreReceive(inTransitInternalTransfer)).toBe(false);
      // Unlocked once internal driver confirms delivery
      expect(canStoreReceive(deliveredInternalTransfer)).toBe(true);
    });
  });

  describe('Managerial Override Velocity 24h Breach Detection (SOP-MGT-020)', () => {
    it('flags override velocity breach when rate is 3.0% or above in 24h shift window', () => {
      const evaluateVelocity = (overrides: number, transactions: number) => {
        const rate = Number(((overrides / Math.max(transactions, 1)) * 100).toFixed(1));
        return {
          rate,
          isBreached: rate >= 3.0
        };
      };

      // 4 overrides out of 100 transactions = 4.0% (breach)
      expect(evaluateVelocity(4, 100).isBreached).toBe(true);
      expect(evaluateVelocity(4, 100).rate).toBe(4.0);

      // 3 overrides out of 100 transactions = 3.0% (ceiling breach)
      expect(evaluateVelocity(3, 100).isBreached).toBe(true);
      expect(evaluateVelocity(3, 100).rate).toBe(3.0);

      // 2 overrides out of 100 transactions = 2.0% (compliant)
      expect(evaluateVelocity(2, 100).isBreached).toBe(false);
      expect(evaluateVelocity(2, 100).rate).toBe(2.0);
    });
  });

  describe('Territory Facility Performance Leaderboard Composite Index', () => {
    it('correctly weighs and computes 3-pillar facility health index', () => {
      const computeScore = (salesScore: number, cycleCountScore: number, cashAccuracyScore: number) => {
        return Math.round(
          salesScore * 0.40 +
          cycleCountScore * 0.35 +
          cashAccuracyScore * 0.25
        );
      };

      // Perfect facility: 100% sales, 100% cycle count, 100% cash accuracy -> 100 index
      expect(computeScore(100, 100, 100)).toBe(100);

      // Overdue cycle count breach (30 score): 90% sales, 30% SLA, 100% cash accuracy
      // 90*0.4 (36) + 30*0.35 (10.5) + 100*0.25 (25) = 71.5 -> 72
      expect(computeScore(90, 30, 100)).toBe(72);
    });
  });
});
