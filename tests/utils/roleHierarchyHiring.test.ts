import { describe, it, expect } from 'vitest';
import { canEmployRole, getRoleHierarchy, SYSTEM_ROLES } from '../../utils/roles';

describe('Role Hierarchy Hiring Rules (canEmployRole)', () => {
    describe('HR and HR Manager (Level 2, Rank 85)', () => {
        it('cannot employ CEO (super_admin, Level 1)', () => {
            expect(canEmployRole('hr_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('hr', 'super_admin')).toBe(false);
        });

        it('cannot employ Level 2 superiors (regional_manager, operations_manager)', () => {
            expect(canEmployRole('hr_manager', 'regional_manager')).toBe(false);
            expect(canEmployRole('hr_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('hr', 'regional_manager')).toBe(false);
            expect(canEmployRole('hr', 'operations_manager')).toBe(false);
        });

        it('cannot employ their own level peers (hr_manager, hr, finance_manager, procurement_manager, supply_chain_manager)', () => {
            expect(canEmployRole('hr_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('hr_manager', 'hr')).toBe(false);
            expect(canEmployRole('hr_manager', 'finance_manager')).toBe(false);
            expect(canEmployRole('hr_manager', 'procurement_manager')).toBe(false);
            expect(canEmployRole('hr_manager', 'supply_chain_manager')).toBe(false);
            expect(canEmployRole('hr', 'hr_manager')).toBe(false);
            expect(canEmployRole('hr', 'hr')).toBe(false);
        });

        it('can only employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)', () => {
            // Level 3 Site Managers (rank 80 < 85)
            expect(canEmployRole('hr_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('hr_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('hr_manager', 'logistics_manager')).toBe(true);
            expect(canEmployRole('hr_manager', 'inventory_manager')).toBe(true);
            expect(canEmployRole('hr_manager', 'assistant_manager')).toBe(true);
            expect(canEmployRole('hr_manager', 'shift_lead')).toBe(true);

            // Level 4 Staff
            expect(canEmployRole('hr_manager', 'cashier')).toBe(true);
            expect(canEmployRole('hr_manager', 'picker')).toBe(true);
            expect(canEmployRole('hr_manager', 'packer')).toBe(true);
            expect(canEmployRole('hr_manager', 'driver')).toBe(true);
            expect(canEmployRole('hr_manager', 'sales_associate')).toBe(true);
            expect(canEmployRole('hr_manager', 'stock_clerk')).toBe(true);
        });
    });

    describe('Operations Manager (Level 2, Rank 90)', () => {
        it('cannot employ CEO or superior Level 2 (super_admin, regional_manager)', () => {
            expect(canEmployRole('operations_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('operations_manager', 'regional_manager')).toBe(false);
        });

        it('cannot employ their own level or peers (operations_manager, hr_manager, finance_manager)', () => {
            expect(canEmployRole('operations_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('operations_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('operations_manager', 'finance_manager')).toBe(false);
            expect(canEmployRole('operations_manager', 'procurement_manager')).toBe(false);
        });

        it('can only employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)', () => {
            expect(canEmployRole('operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('operations_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('operations_manager', 'dispatch_manager')).toBe(true);
            expect(canEmployRole('operations_manager', 'assistant_manager')).toBe(true);
            expect(canEmployRole('operations_manager', 'shift_lead')).toBe(true);
            expect(canEmployRole('operations_manager', 'cashier')).toBe(true);
            expect(canEmployRole('operations_manager', 'driver')).toBe(true);
            expect(canEmployRole('operations_manager', 'picker')).toBe(true);
        });
    });

    describe('Regional Manager (Level 2, Rank 95)', () => {
        it('cannot employ CEO or peer Level 2 directors', () => {
            expect(canEmployRole('regional_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('regional_manager', 'regional_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('regional_manager', 'finance_manager')).toBe(false);
        });

        it('can only employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)', () => {
            expect(canEmployRole('regional_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('regional_manager', 'cashier')).toBe(true);
            expect(canEmployRole('regional_manager', 'driver')).toBe(true);
        });
    });

    describe('CEO / Super Admin (Level 1, Rank 100)', () => {
        it('cannot employ another CEO (super_admin)', () => {
            expect(canEmployRole('super_admin', 'super_admin')).toBe(false);
        });

        it('can employ anyone below CEO across Level 2, Level 3, and Level 4', () => {
            expect(canEmployRole('super_admin', 'regional_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'operations_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'hr_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'store_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'cashier')).toBe(true);
        });
    });

    describe('Site Managers (Level 3, Rank 80)', () => {
        it('cannot employ their own level or superiors', () => {
            expect(canEmployRole('store_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('store_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'hr_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'warehouse_manager')).toBe(false);
        });

        it('can only employ Level 4 roles below them', () => {
            expect(canEmployRole('store_manager', 'assistant_manager')).toBe(true);
            expect(canEmployRole('store_manager', 'shift_lead')).toBe(true);
            expect(canEmployRole('store_manager', 'cashier')).toBe(true);
            expect(canEmployRole('store_manager', 'sales_associate')).toBe(true);
        });
    });

    describe('Other Domain Managers (Level 3)', () => {
        it('warehouse_manager cannot employ peer site managers or superiors', () => {
            expect(canEmployRole('warehouse_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'store_manager')).toBe(false);
        });

        it('warehouse_manager can employ subordinate warehouse staff', () => {
            expect(canEmployRole('warehouse_manager', 'picker')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'packer')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'forklift_operator')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'receiver')).toBe(true);
        });

        it('security_manager can only employ loss prevention staff', () => {
            expect(canEmployRole('security_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('security_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('security_manager', 'loss_prevention')).toBe(true);
        });
    });

    describe('Staff (Level 4)', () => {
        it('cannot employ anyone', () => {
            expect(canEmployRole('cashier', 'cashier')).toBe(false);
            expect(canEmployRole('cashier', 'driver')).toBe(false);
            expect(canEmployRole('driver', 'picker')).toBe(false);
            expect(canEmployRole('picker', 'packer')).toBe(false);
        });
    });

    describe('Edge Cases & Defensive Validation', () => {
        it('returns false when userRole is undefined or empty', () => {
            expect(canEmployRole(undefined, 'cashier')).toBe(false);
            expect(canEmployRole('', 'cashier')).toBe(false);
        });

        it('supports legacy roles (hr, admin)', () => {
            expect(canEmployRole('hr', 'super_admin')).toBe(false);
            expect(canEmployRole('hr', 'store_manager')).toBe(true);
            expect(canEmployRole('admin', 'super_admin')).toBe(false);
            expect(canEmployRole('admin', 'store_manager')).toBe(true);
        });
    });

    describe('Pending Onboarding Approval Authorization (e.g. Makena Benson, Store Manager)', () => {
        it('allows Super Admin, Admin, and HR to approve Store Manager pending recruits', () => {
            expect(canEmployRole('super_admin', 'store_manager')).toBe(true);
            expect(canEmployRole('admin', 'store_manager')).toBe(true);
            expect(canEmployRole('hr_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('hr', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_manager', 'store_manager')).toBe(true);
        });

        it('forbids peer Store Managers, lower managers, or subordinate staff from approving Store Manager', () => {
            expect(canEmployRole('store_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('assistant_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('shift_lead', 'store_manager')).toBe(false);
            expect(canEmployRole('cashier', 'store_manager')).toBe(false);
            expect(canEmployRole('picker', 'store_manager')).toBe(false);
        });
    });
});
