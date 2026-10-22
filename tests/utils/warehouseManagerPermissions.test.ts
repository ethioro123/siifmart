import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, canViewAllSites, canViewAllEmployees, canSwitchCountry } from '../../utils/permissions';
import { canEmployRole, canViewCostPrice } from '../../utils/roles';
import { canWorkerPerformJob } from '../../utils/fulfillmentRoles';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';

describe('Warehouse Manager Role & WMS Fulfillment Engine (SOP-MGT-027)', () => {
    describe('Module & Single-Facility Access Controls', () => {
        it('allows warehouse_manager to access warehouse, inventory, and procurement modules', () => {
            expect(canAccessModule('warehouse_manager', 'warehouse')).toBe(true);
            expect(canAccessModule('warehouse_manager', 'inventory')).toBe(true);
            expect(canAccessModule('warehouse_manager', 'procurement')).toBe(true);
        });

        it('strictly blocks warehouse_manager from administrative, cashier POS, and financial modules', () => {
            expect(canAccessModule('warehouse_manager', 'admin')).toBe(false);
            expect(canAccessModule('warehouse_manager', 'pos')).toBe(false);
            expect(canAccessModule('warehouse_manager', 'finance')).toBe(false);
            expect(canAccessModule('warehouse_manager', 'pricing')).toBe(false);
            expect(canAccessModule('warehouse_manager', 'settings')).toBe(false);
        });

        it('enforces single-facility and invisible tenancy isolation (Zero-Trust)', () => {
            expect(canViewAllSites('warehouse_manager')).toBe(false);
            expect(canViewAllEmployees('warehouse_manager')).toBe(false);
            expect(canViewCostPrice('warehouse_manager')).toBe(false);
            expect(canSwitchCountry({ role: 'warehouse_manager' })).toBe(false);
        });
    });

    describe('WMS Operational & Inventory Custody Permissions', () => {
        it('grants full operational control across warehouse fulfillment tasks', () => {
            expect(authService.checkPermission('warehouse_manager', 'warehouse.view')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'warehouse.receive')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'warehouse.pick')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'warehouse.pack')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'warehouse.dispatch')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'warehouse.putaway')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'warehouse.count')).toBe(true);

            expect(authService.checkPermission('warehouse_manager', 'inventory.view')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'inventory.adjust')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'inventory.count')).toBe(true);
            expect(authService.checkPermission('warehouse_manager', 'inventory.transfer')).toBe(true);
        });

        it('blocks live cashier till operations (Zero Live Till Operation)', () => {
            expect(authService.checkPermission('warehouse_manager', 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission('warehouse_manager', 'pos.void_sale')).toBe(false);
            expect(authService.checkPermission('warehouse_manager', 'pos.refund')).toBe(false);
        });

        it('governs inventory adjustments through approval thresholds', () => {
            const adjWorkflow = APPROVAL_WORKFLOWS.inventory_adjustment;
            const tier1 = adjWorkflow.levels.find(l => l.threshold === 100);
            expect(tier1?.roles).toContain('warehouse_manager');
        });
    });

    describe('Floor Staff Hiring Authority (canEmployRole)', () => {
        it('authorizes warehouse_manager to hire warehouse floor staff strictly below Rank 80', () => {
            expect(canEmployRole('warehouse_manager', 'picker')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'packer')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'receiver')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'forklift_operator')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'inventory_specialist')).toBe(true);
        });

        it('blocks warehouse_manager from hiring peer site managers or superiors', () => {
            expect(canEmployRole('warehouse_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'head_of_operations')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'warehouse_manager')).toBe(false);
        });
    });

    describe('Floor Worker Interchangeability & Delivery Lockdown (Rule 15)', () => {
        it('verifies floor workers cannot perform external delivery missions', () => {
            expect(canWorkerPerformJob('picker', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('packer', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('receiver', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('forklift_operator', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('driver', 'DELIVERY')).toBe(true);
        });

        it('verifies drivers can perform internal floor jobs during loading lulls', () => {
            expect(canWorkerPerformJob('driver', 'PICK')).toBe(true);
            expect(canWorkerPerformJob('driver', 'PACK')).toBe(true);
            expect(canWorkerPerformJob('driver', 'RECEIVE')).toBe(true);
            expect(canWorkerPerformJob('driver', 'PUTAWAY')).toBe(true);
        });
    });
});
