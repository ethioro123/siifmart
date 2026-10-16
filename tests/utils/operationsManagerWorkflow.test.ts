import { describe, it, expect } from 'vitest';
import {
    canAccessModule,
    canViewAllSites,
    canViewAllEmployees,
    shouldFilterBySite,
    hasPermission
} from '../../utils/permissions';
import { getRoleHierarchy, canEmployRole, canViewCostPrice } from '../../utils/roles';
import { canAccessRoute, getAvailableSections } from '../../services/auth.rbac';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';
import { canWorkerPerformJob, getJobAssignmentEligibility } from '../../utils/fulfillmentRoles';

describe('Operations Manager (SOP-MGT-021, Level 2, Rank 90) Full Operational Audit', () => {

    describe('1. Module Access & RBAC Route Protection', () => {
        it('grants full access to all operational modules for operations_manager', () => {
            const modules = [
                'dashboard',
                'admin',
                'pos',
                'inventory',
                'warehouse',
                'sales',
                'customers',
                'employees',
                'pricing',
                'finance',
                'procurement',
                'settings',
                'profile'
            ];

            for (const mod of modules) {
                expect(canAccessModule('operations_manager', mod)).toBe(true);
            }
        });

        it('allows navigation across all operational routes in canAccessRoute', () => {
            const routes = [
                '/admin',
                '/pos-dashboard',
                '/inventory',
                '/wms-ops',
                '/wms-dashboard',
                '/pricing',
                '/finance',
                '/procurement',
                '/employees',
                '/sales',
                '/customers',
                '/settings'
            ];

            for (const route of routes) {
                expect(canAccessRoute('operations_manager', route)).toBe(true);
            }
        });

        it('grants critical supervisory permissions in legacy PERMISSIONS mapping', () => {
            expect(hasPermission('operations_manager', 'VIEW_ADMIN_DASHBOARD')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_ADMIN_MODULE')).toBe(true);
            expect(hasPermission('operations_manager', 'VIEW_WMS_DASHBOARD')).toBe(true);
            expect(hasPermission('operations_manager', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_INVENTORY')).toBe(true);
            expect(hasPermission('operations_manager', 'ADJUST_STOCK')).toBe(true);
            expect(hasPermission('operations_manager', 'TRANSFER_STOCK')).toBe(true);
            expect(hasPermission('operations_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('operations_manager', 'ACCESS_SETTINGS')).toBe(true);
            expect(hasPermission('operations_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('operations_manager', 'VIEW_COST_PRICE')).toBe(true);
        });
    });

    describe('2. Multi-Site Executive Exemption & Navigation Resilience', () => {
        it('preserves all sections regardless of active site type (exempt from section stripping)', () => {
            const warehouseSections = getAvailableSections('operations_manager', 'Warehouse');
            expect(warehouseSections).toContain('admin');
            expect(warehouseSections).toContain('pos');
            expect(warehouseSections).toContain('pricing');
            expect(warehouseSections).toContain('finance');
            expect(warehouseSections).toContain('settings');

            const storeSections = getAvailableSections('operations_manager', 'Store');
            expect(storeSections).toContain('admin');
            expect(storeSections).toContain('warehouse');
            expect(storeSections).toContain('pricing');
            expect(storeSections).toContain('finance');
            expect(storeSections).toContain('settings');
        });

        it('is recognized as a multi-site role with cross-site view permissions', () => {
            expect(canViewAllSites('operations_manager')).toBe(true);
            expect(canViewAllEmployees('operations_manager')).toBe(true);
            expect(shouldFilterBySite('operations_manager')).toBe(false);
        });
    });

    describe('3. Role Hierarchy & Employment Authority (canEmployRole)', () => {
        it('has Level 2 Hierarchy Rank of 95', () => {
            expect(getRoleHierarchy('operations_manager')).toBe(95);
        });

        it('can hire Level 3 managers and Level 4 operational personnel', () => {
            const hireableRoles = [
                'store_manager',
                'warehouse_manager',
                'assistant_manager',
                'shift_lead',
                'dispatcher',
                'picker',
                'packer',
                'driver',
                'receiver',
                'inventory_specialist',
                'forklift_operator',
                'cashier',
                'pos'
            ];

            for (const r of hireableRoles) {
                expect(canEmployRole('operations_manager', r as any)).toBe(true);
            }
        });

        it('cannot hire Level 2 peers or executives with higher/equal rank', () => {
            const nonHireableRoles = [
                'CEO',
                'ceo',
                'super_admin',
                'regional_manager',
                'operations_manager'
            ];

            for (const r of nonHireableRoles) {
                expect(canEmployRole('operations_manager', r as any)).toBe(false);
            }
        });
    });

    describe('4. Approval Workflows & Dual-Control Thresholds', () => {
        it('participates in Purchase Order approval workflows', () => {
            const poRoles = APPROVAL_WORKFLOWS.purchase_order.levels.flatMap(l => l.roles);
            expect(poRoles).toContain('operations_manager');
        });

        it('participates in Employee Hire approval workflows', () => {
            const hireRoles = APPROVAL_WORKFLOWS.employee_hire.levels.flatMap(l => l.roles);
            expect(hireRoles).toContain('operations_manager');
        });

        it('participates in Inventory Adjustment approval workflows', () => {
            const invRoles = APPROVAL_WORKFLOWS.inventory_adjustment.levels.flatMap(l => l.roles);
            expect(invRoles).toContain('operations_manager');
        });

        it('participates in Refund approval workflows', () => {
            const refundRoles = APPROVAL_WORKFLOWS.refund.levels.flatMap(l => l.roles);
            expect(refundRoles).toContain('operations_manager');
        });
    });

    describe('5. Delivery Lockdown & Cross-Functional Interchangeability (Rule 15)', () => {
        it('allows operations_manager to perform internal warehouse jobs', () => {
            const internalJobs: Array<'PICK' | 'PACK' | 'RECEIVE' | 'PUTAWAY' | 'COUNT' | 'TRANSFER' | 'REPLENISH' | 'WASTE' | 'RETURNS' | 'LABELS'> = [
                'PICK', 'PACK', 'RECEIVE', 'PUTAWAY', 'COUNT', 'TRANSFER', 'REPLENISH', 'WASTE', 'RETURNS', 'LABELS'
            ];

            for (const job of internalJobs) {
                expect(canWorkerPerformJob('operations_manager', job)).toBe(true);
            }
        });

        it('strictly locks delivery missions to verified drivers (Rule 15)', () => {
            expect(canWorkerPerformJob('picker', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('packer', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('receiver', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('inventory_specialist', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('driver', 'DELIVERY')).toBe(true);

            const deliveryElig = getJobAssignmentEligibility('picker', 'DELIVERY');
            expect(deliveryElig.eligible).toBe(false);
            expect(deliveryElig.reason).toMatch(/Only verified drivers can perform deliveries/i);
        });
    });

    describe('6. Cost Price Visibility (SOP-MGT-021 §2.5)', () => {
        it('allows operations_manager full visibility of landed cost and gross margins', () => {
            expect(canViewCostPrice('operations_manager')).toBe(true);
        });
    });

    describe('7. Central Operations Team Hierarchy & Employment (SOP-MGT-021 §1.3)', () => {
        it('allows operations_manager to employ all Central Operations team roles', () => {
            const centralOpsRoles = [
                'data_analyst',
                'security_manager',
                'cs_manager',
                'customer_service',
                'store_operations_auditor',
                'store_manager',
                'warehouse_manager'
            ];

            for (const r of centralOpsRoles) {
                expect(canEmployRole('operations_manager', r as any)).toBe(true);
            }
        });

        it('verifies hierarchy ranks for Central Operations Team', () => {
            expect(getRoleHierarchy('operations_manager')).toBe(95);
            expect(getRoleHierarchy('security_manager')).toBe(75);
            expect(getRoleHierarchy('cs_manager')).toBe(60);
            expect(getRoleHierarchy('store_operations_auditor')).toBe(45);
            expect(getRoleHierarchy('data_analyst')).toBe(35);
            expect(getRoleHierarchy('customer_service')).toBe(25);
        });
    });

    describe('8. Store Operations Auditor Remit & Rule 15 Compliance', () => {
        it('allows store_operations_auditor to view all sites for unannounced audits', () => {
            expect(canViewAllSites('store_operations_auditor')).toBe(true);
        });

        it('grants required operational modules for store audits', () => {
            expect(canAccessModule('store_operations_auditor', 'pos')).toBe(true);
            expect(canAccessModule('store_operations_auditor', 'inventory')).toBe(true);
            expect(canAccessModule('store_operations_auditor', 'pricing')).toBe(true);
            expect(canAccessModule('store_operations_auditor', 'sales')).toBe(true);
        });

        it('enforces delivery lockdown on store_operations_auditor (Rule 15)', () => {
            expect(canWorkerPerformJob('store_operations_auditor', 'DELIVERY')).toBe(false);
            const deliveryElig = getJobAssignmentEligibility('store_operations_auditor', 'DELIVERY');
            expect(deliveryElig.eligible).toBe(false);
            expect(deliveryElig.reason).toMatch(/not authorized to perform 'DELIVERY'|Only verified drivers can perform deliveries/i);
        });
    });
});
