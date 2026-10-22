import { describe, it, expect } from 'vitest';
import { canEmployRole, getRoleHierarchy, SYSTEM_ROLES } from '../../utils/roles';

describe('Role Hierarchy Hiring Rules (canEmployRole)', () => {
    describe('Group CEO and Global Executive (Level 1, Rank 100)', () => {
        it('can employ subordinate roles across the enterprise', () => {
            expect(canEmployRole('group_ceo', 'country_managing_director')).toBe(true);
            expect(canEmployRole('group_ceo', 'head_of_operations')).toBe(true);
            expect(canEmployRole('group_ceo', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('group_ceo', 'store_manager')).toBe(true);
            expect(canEmployRole('group_ceo', 'cashier')).toBe(true);
        });

        it('cannot employ another Group CEO or Super Admin', () => {
            expect(canEmployRole('group_ceo', 'group_ceo')).toBe(false);
            expect(canEmployRole('group_ceo', 'super_admin')).toBe(false);
            expect(canEmployRole('super_admin', 'group_ceo')).toBe(false);
        });
    });

    describe('HR and Head of Human Resources (Level 2, Rank 85)', () => {
        it('cannot employ CEO (super_admin or group_ceo, Level 1)', () => {
            expect(canEmployRole('head_of_hr', 'group_ceo')).toBe(false);
            expect(canEmployRole('head_of_hr', 'super_admin')).toBe(false);
            expect(canEmployRole('hr', 'group_ceo')).toBe(false);
            expect(canEmployRole('hr', 'super_admin')).toBe(false);
        });

        it('cannot employ Level 2 superiors (regional_operations_manager, head_of_operations)', () => {
            expect(canEmployRole('head_of_hr', 'regional_operations_manager')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_operations')).toBe(false);
            expect(canEmployRole('hr', 'regional_operations_manager')).toBe(false);
            expect(canEmployRole('hr', 'head_of_operations')).toBe(false);
        });

        it('cannot employ their own level peers (head_of_hr, hr, head_of_finance, head_of_procurement, head_of_supply_chain)', () => {
            expect(canEmployRole('head_of_hr', 'head_of_hr')).toBe(false);
            expect(canEmployRole('head_of_hr', 'hr')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_finance')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_procurement')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_supply_chain')).toBe(false);
            expect(canEmployRole('hr', 'head_of_hr')).toBe(false);
            expect(canEmployRole('hr', 'hr')).toBe(false);
        });

        it('can only employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)', () => {
            // Level 3 Site Managers (rank 80 < 85)
            expect(canEmployRole('head_of_hr', 'store_manager')).toBe(true);
            expect(canEmployRole('head_of_hr', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('head_of_hr', 'logistics_manager')).toBe(true);
            expect(canEmployRole('head_of_hr', 'inventory_manager')).toBe(true);
            expect(canEmployRole('head_of_hr', 'assistant_manager')).toBe(true);
            expect(canEmployRole('head_of_hr', 'shift_lead')).toBe(true);

            // Level 4 Staff
            expect(canEmployRole('head_of_hr', 'cashier')).toBe(true);
            expect(canEmployRole('head_of_hr', 'picker')).toBe(true);
            expect(canEmployRole('head_of_hr', 'packer')).toBe(true);
            expect(canEmployRole('head_of_hr', 'driver')).toBe(true);
            expect(canEmployRole('head_of_hr', 'sales_associate')).toBe(true);
            expect(canEmployRole('head_of_hr', 'stock_clerk')).toBe(true);
        });
    });

    describe('Head of Operations (Level 2, Rank 90)', () => {
        it('cannot employ CEO or superior Level 2 (super_admin, regional_operations_manager)', () => {
            expect(canEmployRole('head_of_operations', 'super_admin')).toBe(false);
            expect(canEmployRole('head_of_operations', 'regional_operations_manager')).toBe(false);
        });

        it('cannot employ their own level or peers (head_of_operations, head_of_hr, head_of_finance)', () => {
            expect(canEmployRole('head_of_operations', 'head_of_operations')).toBe(false);
            expect(canEmployRole('head_of_operations', 'head_of_hr')).toBe(false);
            expect(canEmployRole('head_of_operations', 'head_of_finance')).toBe(false);
            expect(canEmployRole('head_of_operations', 'head_of_procurement')).toBe(false);
        });

        it('can only employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)', () => {
            expect(canEmployRole('head_of_operations', 'store_manager')).toBe(true);
            expect(canEmployRole('head_of_operations', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('head_of_operations', 'dispatch_manager')).toBe(true);
            expect(canEmployRole('head_of_operations', 'assistant_manager')).toBe(true);
            expect(canEmployRole('head_of_operations', 'shift_lead')).toBe(true);
            expect(canEmployRole('head_of_operations', 'cashier')).toBe(true);
            expect(canEmployRole('head_of_operations', 'driver')).toBe(true);
            expect(canEmployRole('head_of_operations', 'picker')).toBe(true);
        });
    });

    describe('Regional Manager (Level 2, Rank 95)', () => {
        it('cannot employ CEO or peer Level 2 directors', () => {
            expect(canEmployRole('regional_operations_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('regional_operations_manager', 'regional_operations_manager')).toBe(false);
            expect(canEmployRole('regional_operations_manager', 'head_of_operations')).toBe(false);
            expect(canEmployRole('regional_operations_manager', 'head_of_hr')).toBe(false);
            expect(canEmployRole('regional_operations_manager', 'head_of_finance')).toBe(false);
        });

        it('can only employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)', () => {
            expect(canEmployRole('regional_operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'cashier')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'driver')).toBe(true);
        });
    });

    describe('CEO / Super Admin (Level 1, Rank 100)', () => {
        it('cannot employ another CEO (super_admin)', () => {
            expect(canEmployRole('super_admin', 'super_admin')).toBe(false);
        });

        it('can employ Country Managing Director (admin) and anyone across Level 2, Level 3, and Level 4', () => {
            expect(canEmployRole('super_admin', 'admin')).toBe(true);
            expect(canEmployRole('super_admin', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'head_of_operations')).toBe(true);
            expect(canEmployRole('super_admin', 'head_of_hr')).toBe(true);
            expect(canEmployRole('super_admin', 'store_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'cashier')).toBe(true);
        });
    });

    describe('Country Managing Director (admin, Level 1, Rank 98)', () => {
        it('cannot employ Global CEO (super_admin) or another Country Managing Director (admin)', () => {
            expect(getRoleHierarchy('admin')).toBe(98);
            expect(canEmployRole('admin', 'super_admin')).toBe(false);
            expect(canEmployRole('admin', 'admin')).toBe(false);
        });

        it('can employ all Level 2 Directors, Level 3 Site Managers, and Level 4 Staff in their country', () => {
            expect(canEmployRole('admin', 'head_of_operations')).toBe(true);
            expect(canEmployRole('admin', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('admin', 'head_of_finance')).toBe(true);
            expect(canEmployRole('admin', 'head_of_hr')).toBe(true);
            expect(canEmployRole('admin', 'head_of_procurement')).toBe(true);
            expect(canEmployRole('admin', 'head_of_supply_chain')).toBe(true);
            expect(canEmployRole('admin', 'head_of_merchandising')).toBe(true);
            expect(canEmployRole('admin', 'store_manager')).toBe(true);
            expect(canEmployRole('admin', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('admin', 'cashier')).toBe(true);
            expect(canEmployRole('admin', 'picker')).toBe(true);
        });
    });

    describe('Site Managers (Level 3, Rank 80)', () => {
        it('cannot employ their own level or superiors', () => {
            expect(canEmployRole('store_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('store_manager', 'head_of_operations')).toBe(false);
            expect(canEmployRole('store_manager', 'head_of_hr')).toBe(false);
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
            expect(canEmployRole('warehouse_manager', 'head_of_operations')).toBe(false);
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
            expect(canEmployRole('head_of_hr', 'store_manager')).toBe(true);
            expect(canEmployRole('hr', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'store_manager')).toBe(true);
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
