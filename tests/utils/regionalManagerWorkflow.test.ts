import { describe, it, expect } from 'vitest';
import {
    canAccessModule,
    canViewAllSites,
    canViewAllEmployees,
    shouldFilterBySite,
    hasPermission
} from '../../utils/permissions';
import { getRoleHierarchy, canEmployRole } from '../../utils/roles';
import { canAccessRoute, getAvailableSections } from '../../services/auth.rbac';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';
import { canWorkerPerformJob, getJobAssignmentEligibility } from '../../utils/fulfillmentRoles';

describe('Regional Manager (SOP-MGT-020, Level 2, Rank 95) Full Operational Audit', () => {

    describe('1. Module Access & RBAC Route Protection', () => {
        it('grants full access to all operational modules for regional_manager', () => {
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
                expect(canAccessModule('regional_manager', mod)).toBe(true);
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
                expect(canAccessRoute('regional_manager', route)).toBe(true);
            }
        });

        it('grants critical supervisory permissions in legacy PERMISSIONS mapping', () => {
            expect(hasPermission('regional_manager', 'ACCESS_ADMIN_MODULE')).toBe(true);
            expect(hasPermission('regional_manager', 'VIEW_ADMIN_DASHBOARD')).toBe(true);
            expect(hasPermission('regional_manager', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(hasPermission('regional_manager', 'VIEW_WMS_DASHBOARD')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_INVENTORY')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('regional_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_EMPLOYEES')).toBe(true);
            expect(hasPermission('regional_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_manager', 'MANAGE_SHIFTS')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_WAREHOUSE')).toBe(true);
            expect(hasPermission('regional_manager', 'ACCESS_SETTINGS')).toBe(true);
        });
    });

    describe('2. Site-Type Exemption & Multi-Site Oversight', () => {
        it('never strips warehouse or procurement sections from regional_manager when viewing a Store', () => {
            const storeSections = getAvailableSections('regional_manager', 'Store');
            expect(storeSections).toContain('warehouse');
            expect(storeSections).toContain('procurement');
            expect(storeSections).toContain('pricing');
            expect(storeSections).toContain('admin');
            expect(storeSections).toContain('finance');
        });

        it('never strips pos section from regional_manager when viewing a Warehouse', () => {
            const whSections = getAvailableSections('regional_manager', 'Warehouse');
            expect(whSections).toContain('pos');
            expect(whSections).toContain('pricing');
            expect(whSections).toContain('admin');
            expect(whSections).toContain('finance');
            expect(whSections).toContain('procurement');
        });

        it('confirms regional_manager has multi-site and multi-employee visibility', () => {
            expect(canViewAllSites('regional_manager')).toBe(true);
            expect(canViewAllEmployees('regional_manager')).toBe(true);
            expect(shouldFilterBySite('regional_manager')).toBe(false);
        });
    });

    describe('3. Role Hierarchy & Multi-Tier Hiring Authority', () => {
        it('has Rank 90 hierarchy — territorial director outranking facility leadership', () => {
            expect(getRoleHierarchy('regional_manager')).toBe(90);
            expect(getRoleHierarchy('operations_manager')).toBeGreaterThan(getRoleHierarchy('regional_manager'));
            expect(getRoleHierarchy('regional_manager')).toBeGreaterThan(getRoleHierarchy('finance_manager'));
            expect(getRoleHierarchy('regional_manager')).toBeGreaterThan(getRoleHierarchy('store_manager'));
            expect(getRoleHierarchy('regional_manager')).toBeGreaterThan(getRoleHierarchy('warehouse_manager'));
        });

        it('can employ Level 3 Site Leadership across stores and warehouses', () => {
            const level3Roles = [
                'store_manager',
                'warehouse_manager',
                'logistics_manager',
                'inventory_manager',
                'security_manager',
                'dispatch_manager',
                'assistant_manager',
                'shift_lead'
            ];

            for (const role of level3Roles) {
                expect(canEmployRole('regional_manager', role)).toBe(true);
            }
        });

        it('can employ Level 4 Floor Staff across stores and warehouses', () => {
            const level4Roles = [
                'cashier',
                'sales_associate',
                'stock_clerk',
                'picker',
                'packer',
                'receiver',
                'driver',
                'forklift_operator',
                'customer_service',
                'auditor',
                'buyer',
                'demand_planner'
            ];

            for (const role of level4Roles) {
                expect(canEmployRole('regional_manager', role)).toBe(true);
            }
        });

        it('CANNOT employ CEO, Assistant CEO, or peer corporate directors', () => {
            expect(canEmployRole('regional_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('regional_manager', 'CEO')).toBe(false);
            expect(canEmployRole('regional_manager', 'admin')).toBe(false);
            expect(canEmployRole('regional_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'finance_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'procurement_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'supply_chain_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'regional_manager')).toBe(false);
        });
    });

    describe('4. Approval Thresholds & Strategic Authority', () => {
        it('grants purchase order approval authority to regional_manager', () => {
            const poLevels = APPROVAL_WORKFLOWS.purchase_order.levels;
            const topTier = poLevels[poLevels.length - 1];
            expect(topTier.roles).toContain('regional_manager');
        });

        it('grants hiring approval authority to regional_manager', () => {
            const hireLevels = APPROVAL_WORKFLOWS.employee_hire.levels;
            expect(hireLevels[0].roles).toContain('regional_manager');
        });

        it('grants inventory adjustment approval to regional_manager up to Infinity', () => {
            const invLevels = APPROVAL_WORKFLOWS.inventory_adjustment.levels;
            const topTier = invLevels[invLevels.length - 1];
            expect(topTier.roles).toContain('regional_manager');
        });

        it('grants price change approval to regional_manager up to Infinity', () => {
            const priceLevels = APPROVAL_WORKFLOWS.price_change.levels;
            const topTier = priceLevels[priceLevels.length - 1];
            expect(topTier.roles).toContain('regional_manager');
        });

        it('grants refund approval to regional_manager up to Infinity', () => {
            const refundLevels = APPROVAL_WORKFLOWS.refund.levels;
            const topTier = refundLevels[refundLevels.length - 1];
            expect(topTier.roles).toContain('regional_manager');
        });
    });

    describe('5. Cross-Functional Operations & Delivery Lockdown', () => {
        it('allows regional_manager to perform internal warehouse/store floor jobs if on-site', () => {
            expect(canWorkerPerformJob('regional_manager', 'PICK')).toBe(true);
            expect(canWorkerPerformJob('regional_manager', 'PACK')).toBe(true);
            expect(canWorkerPerformJob('regional_manager', 'COUNT')).toBe(true);
        });

        it('enforces delivery lockdown: floor workers CANNOT perform delivery missions', () => {
            expect(canWorkerPerformJob('picker', 'DELIVERY')).toBe(false);
            expect(canWorkerPerformJob('packer', 'DRIVER')).toBe(false);
            expect(canWorkerPerformJob('receiver', 'DISPATCH')).toBe(false);

            const deliveryEligibility = getJobAssignmentEligibility('picker', 'DELIVERY');
            expect(deliveryEligibility.eligible).toBe(false);
        });
    });
});
