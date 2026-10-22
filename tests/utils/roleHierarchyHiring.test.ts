import { describe, it, expect } from 'vitest';
import { canEmployRole, getRoleHierarchy, SYSTEM_ROLES } from '../../utils/roles';

describe('Role Hierarchy Hiring Rules (canEmployRole)', () => {
    describe('Group CEO and Global Executive (Level 1, Rank 100)', () => {
        it('can employ subordinate roles across the enterprise', () => {
            expect(canEmployRole('group_ceo', 'group_coo')).toBe(true);
            expect(canEmployRole('group_ceo', 'group_cfo')).toBe(true);
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

    describe('Group COO (Level 1, Rank 99)', () => {
        it('can employ country managing directors, operations heads, and subordinate staff', () => {
            expect(canEmployRole('group_coo', 'country_managing_director')).toBe(true);
            expect(canEmployRole('group_coo', 'country_operations_director')).toBe(true);
            expect(canEmployRole('group_coo', 'head_of_operations')).toBe(true);
            expect(canEmployRole('group_coo', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('group_coo', 'store_manager')).toBe(true);
            expect(canEmployRole('group_coo', 'cashier')).toBe(true);
        });

        it('cannot employ Group CEO, Super Admin, or another Group COO', () => {
            expect(canEmployRole('group_coo', 'group_ceo')).toBe(false);
            expect(canEmployRole('group_coo', 'super_admin')).toBe(false);
            expect(canEmployRole('group_coo', 'group_coo')).toBe(false);
        });
    });

    describe('Level 2 Country Leadership Directors (Rank 97-98)', () => {
        it('country_managing_director (Rank 98) can employ country directors and subordinates', () => {
            expect(canEmployRole('country_managing_director', 'country_operations_director')).toBe(true);
            expect(canEmployRole('country_managing_director', 'country_finance_director')).toBe(true);
            expect(canEmployRole('country_managing_director', 'head_of_operations')).toBe(true);
            expect(canEmployRole('country_managing_director', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('country_managing_director', 'store_manager')).toBe(true);
            expect(canEmployRole('country_managing_director', 'cashier')).toBe(true);
            expect(canEmployRole('country_managing_director', 'group_ceo')).toBe(false);
            expect(canEmployRole('country_managing_director', 'group_coo')).toBe(false);
        });

        it('country functional directors (Rank 97) can employ regional managers and facility staff', () => {
            expect(canEmployRole('country_operations_director', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('country_operations_director', 'area_operations_manager')).toBe(true);
            expect(canEmployRole('country_operations_director', 'store_manager')).toBe(true);
            expect(canEmployRole('country_operations_director', 'cashier')).toBe(true);
            expect(canEmployRole('country_operations_director', 'country_managing_director')).toBe(false);
            expect(canEmployRole('country_operations_director', 'country_operations_director')).toBe(false);

            expect(canEmployRole('country_supply_chain_director', 'regional_supply_chain_manager')).toBe(true);
            expect(canEmployRole('country_supply_chain_director', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('country_supply_chain_director', 'picker')).toBe(true);

            expect(canEmployRole('country_finance_director', 'regional_finance_manager')).toBe(true);
            expect(canEmployRole('country_finance_director', 'accountant')).toBe(true);

            expect(canEmployRole('country_hr_director', 'regional_hr_manager')).toBe(true);
            expect(canEmployRole('country_hr_director', 'hr_generalist')).toBe(true);
        });

        it('regional and area operations managers (Rank 88-90) have scoped hiring authority', () => {
            expect(canEmployRole('regional_operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'cashier')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'country_operations_director')).toBe(false);

            expect(canEmployRole('area_operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('area_operations_manager', 'cashier')).toBe(true);
            expect(canEmployRole('area_operations_manager', 'regional_operations_manager')).toBe(false);
            expect(canEmployRole('area_operations_manager', 'country_operations_director')).toBe(false);

            expect(canEmployRole('regional_supply_chain_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('regional_supply_chain_manager', 'picker')).toBe(true);
            expect(canEmployRole('regional_supply_chain_manager', 'country_supply_chain_director')).toBe(false);
        });
    });

    describe('Group CFO (Level 1, Rank 99)', () => {
        it('can employ finance heads, regional managers, and subordinate staff', () => {
            expect(canEmployRole('group_cfo', 'country_managing_director')).toBe(true);
            expect(canEmployRole('group_cfo', 'head_of_finance')).toBe(true);
            expect(canEmployRole('group_cfo', 'regional_finance_manager')).toBe(true);
            expect(canEmployRole('group_cfo', 'accountant')).toBe(true);
            expect(canEmployRole('group_cfo', 'treasury_officer')).toBe(true);
            expect(canEmployRole('group_cfo', 'cashier')).toBe(true);
        });

        it('cannot employ Group CEO, Super Admin, Group COO, or another Group CFO', () => {
            expect(canEmployRole('group_cfo', 'group_ceo')).toBe(false);
            expect(canEmployRole('group_cfo', 'super_admin')).toBe(false);
            expect(canEmployRole('group_cfo', 'group_coo')).toBe(false);
            expect(canEmployRole('group_cfo', 'group_cfo')).toBe(false);
        });
    });

    describe('Remaining Level 1 Global Executives (group_cco, group_csco, group_chro, etc.)', () => {
        it('group_cco can employ procurement/merchandising leaders and subordinate staff', () => {
            expect(canEmployRole('group_cco', 'head_of_procurement')).toBe(true);
            expect(canEmployRole('group_cco', 'head_of_merchandising')).toBe(true);
            expect(canEmployRole('group_cco', 'buyer')).toBe(true);
            expect(canEmployRole('group_cco', 'group_ceo')).toBe(false);
            expect(canEmployRole('group_cco', 'group_coo')).toBe(false);
        });

        it('group_csco can employ supply chain directors, warehouse managers, and logistics staff', () => {
            expect(canEmployRole('group_csco', 'head_of_supply_chain')).toBe(true);
            expect(canEmployRole('group_csco', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('group_csco', 'picker')).toBe(true);
            expect(canEmployRole('group_csco', 'group_ceo')).toBe(false);
        });

        it('group_chro can employ HR leadership and people operations specialists', () => {
            expect(canEmployRole('group_chro', 'head_of_hr')).toBe(true);
            expect(canEmployRole('group_chro', 'hr_generalist')).toBe(true);
            expect(canEmployRole('group_chro', 'talent_recruiter')).toBe(true);
            expect(canEmployRole('group_chro', 'group_ceo')).toBe(false);
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
            expect(canEmployRole('store_manager', 'area_operations_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'warehouse_manager')).toBe(false);
        });

        it('can employ subordinate store leadership and frontline retail staff', () => {
            expect(canEmployRole('store_manager', 'assistant_store_manager')).toBe(true);
            expect(canEmployRole('store_manager', 'assistant_manager')).toBe(true);
            expect(canEmployRole('store_manager', 'shift_supervisor')).toBe(true);
            expect(canEmployRole('store_manager', 'pos_supervisor')).toBe(true);
            expect(canEmployRole('store_manager', 'stock_control_supervisor')).toBe(true);
            expect(canEmployRole('store_manager', 'store_supervisor')).toBe(true);
            expect(canEmployRole('store_manager', 'shift_lead')).toBe(true);
            expect(canEmployRole('store_manager', 'cashier')).toBe(true);
            expect(canEmployRole('store_manager', 'sales_associate')).toBe(true);
            expect(canEmployRole('store_manager', 'store_associate')).toBe(true);
            expect(canEmployRole('store_manager', 'merchandiser')).toBe(true);
            expect(canEmployRole('store_manager', 'stock_clerk')).toBe(true);
            expect(canEmployRole('store_manager', 'returns_clerk')).toBe(true);
        });
    });

    describe('Assistant Store Managers & Retail Supervisors (Level 8)', () => {
        it('assistant_store_manager can hire frontline floor staff', () => {
            expect(canEmployRole('assistant_store_manager', 'cashier')).toBe(true);
            expect(canEmployRole('assistant_store_manager', 'store_associate')).toBe(true);
            expect(canEmployRole('assistant_store_manager', 'sales_associate')).toBe(true);
            expect(canEmployRole('assistant_store_manager', 'stock_clerk')).toBe(true);
            expect(canEmployRole('assistant_store_manager', 'merchandiser')).toBe(true);
            expect(canEmployRole('assistant_store_manager', 'returns_clerk')).toBe(true);
        });

        it('assistant_store_manager cannot hire supervisors, store managers or superiors', () => {
            expect(canEmployRole('assistant_store_manager', 'shift_supervisor')).toBe(false);
            expect(canEmployRole('assistant_store_manager', 'pos_supervisor')).toBe(false);
            expect(canEmployRole('assistant_store_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('assistant_store_manager', 'area_operations_manager')).toBe(false);
        });

        it('retail supervisors (shift_supervisor, pos_supervisor, etc.) have no hiring authority', () => {
            expect(canEmployRole('shift_supervisor', 'cashier')).toBe(false);
            expect(canEmployRole('shift_supervisor', 'store_associate')).toBe(false);
            expect(canEmployRole('pos_supervisor', 'cashier')).toBe(false);
            expect(canEmployRole('stock_control_supervisor', 'stock_clerk')).toBe(false);
            expect(canEmployRole('store_supervisor', 'merchandiser')).toBe(false);
            expect(canEmployRole('shift_lead', 'cashier')).toBe(false);
        });
    });

    describe('Warehouse & Fulfillment Leadership (Level 6 & 7)', () => {
        it('warehouse_manager cannot employ peer site managers or superiors', () => {
            expect(canEmployRole('warehouse_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'country_supply_chain_director')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'regional_supply_chain_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'head_of_operations')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'store_manager')).toBe(false);
        });

        it('warehouse_manager can employ department managers, supervisors, and frontline fulfillment staff', () => {
            expect(canEmployRole('warehouse_manager', 'warehouse_operations_manager')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'transport_fleet_manager')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'receiving_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'inventory_control_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'putaway_replenishment_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'picking_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'packing_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'dispatch_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'returns_waste_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'picker')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'packer')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'forklift_operator')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'receiver')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'driver')).toBe(true);
        });

        it('warehouse supervisors (picking_supervisor, dispatch_supervisor, etc.) have no hiring authority', () => {
            expect(canEmployRole('receiving_supervisor', 'receiver')).toBe(false);
            expect(canEmployRole('picking_supervisor', 'picker')).toBe(false);
            expect(canEmployRole('packing_supervisor', 'packer')).toBe(false);
            expect(canEmployRole('dispatch_supervisor', 'driver')).toBe(false);
            expect(canEmployRole('inventory_control_supervisor', 'stock_counter')).toBe(false);
            expect(canEmployRole('fleet_maintenance_supervisor', 'fleet_mechanic')).toBe(false);
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
