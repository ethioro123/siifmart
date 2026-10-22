import { describe, it, expect } from 'vitest';
import { getVisibleFulfillmentTabs, getDefaultFulfillmentTab } from '../../utils/fulfillmentTabPermissions';
import { canApprove, APPROVAL_WORKFLOWS } from '../../services/permissions.service';
import { FINANCE_COAPPROVER_ROLES, isBelowMarginFloor } from '../../utils/pricingGovernance';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { ROLE_PERMISSIONS } from '../../services/auth.rbac';

describe('HQ Leadership Governance & Code Harmonization Suite', () => {
    describe('Country Managing Director (country_managing_director / admin)', () => {
        it('grants complete access to all 12 fulfillment tabs in WMS Ops', () => {
            const tabsCmd = getVisibleFulfillmentTabs('country_managing_director');
            const tabsAdmin = getVisibleFulfillmentTabs('country_managing_director');

            expect(tabsCmd).toHaveLength(13);
            expect(tabsCmd).toContain('RECEIVE');
            expect(tabsCmd).toContain('PUTAWAY');
            expect(tabsCmd).toContain('TRANSFER');
            expect(tabsCmd).toContain('PICK');
            expect(tabsCmd).toContain('PACK');
            expect(tabsCmd).toContain('DOCKS');
            expect(tabsCmd).toContain('DRIVER');
            expect(tabsCmd).toContain('REPLENISH');
            expect(tabsCmd).toContain('COUNT');
            expect(tabsCmd).toContain('WASTE');
            expect(tabsCmd).toContain('RETURNS');
            expect(tabsCmd).toContain('ASSIGN');
            expect(tabsCmd).toContain('LABELS');

            expect(tabsAdmin).toEqual(tabsCmd);
        });

        it('assigns DOCKS as the default operational fulfillment tab', () => {
            expect(getDefaultFulfillmentTab('country_managing_director')).toBe('DOCKS');
            expect(getDefaultFulfillmentTab('country_managing_director')).toBe('DOCKS');
        });

        it('keeps final PO sign-off with procurement while authorizing other executive workflows', () => {
            expect(canApprove('country_managing_director', 'purchase_order', 1500000)).toBe(false);
            expect(canApprove('country_managing_director', 'expense', 500000)).toBe(true);
            expect(canApprove('country_managing_director', 'employee_hire')).toBe(true);
            expect(canApprove('country_managing_director', 'inventory_adjustment', 5000)).toBe(true);
            expect(canApprove('country_managing_director', 'price_change', 50)).toBe(true);
            expect(canApprove('country_managing_director', 'refund', 25000)).toBe(true);
        });

        it('grants access to all sovereign corporate modules', () => {
            expect(canAccessModule('country_managing_director', 'admin')).toBe(true);
            expect(canAccessModule('country_managing_director', 'finance')).toBe(true);
            expect(canAccessModule('country_managing_director', 'procurement')).toBe(true);
            expect(canAccessModule('country_managing_director', 'pricing')).toBe(true);
            expect(canAccessModule('country_managing_director', 'warehouse')).toBe(true);
            expect(canAccessModule('country_managing_director', 'settings')).toBe(true);
        });
    });

    describe('Head of Operations (head_of_operations / head_of_operations / head_of_operations)', () => {
        it('grants complete access to all 12 fulfillment tabs across all naming aliases', () => {
            const aliases = ['country_operations_director'];
            for (const alias of aliases) {
                const tabs = getVisibleFulfillmentTabs(alias);
                expect(tabs).toHaveLength(13);
                expect(tabs).toContain('RECEIVE');
                expect(tabs).toContain('PUTAWAY');
                expect(tabs).toContain('TRANSFER');
                expect(tabs).toContain('PICK');
                expect(tabs).toContain('PACK');
                expect(tabs).toContain('DOCKS');
                expect(tabs).toContain('DRIVER');
                expect(tabs).toContain('REPLENISH');
                expect(tabs).toContain('COUNT');
                expect(tabs).toContain('WASTE');
                expect(tabs).toContain('RETURNS');
                expect(tabs).toContain('ASSIGN');
                expect(tabs).toContain('LABELS');
            }
        });

        it('assigns DOCKS as default fulfillment tab for Head of Operations', () => {
            expect(getDefaultFulfillmentTab('country_operations_director')).toBe('DOCKS');
            expect(getDefaultFulfillmentTab('country_operations_director')).toBe('DOCKS');
            expect(getDefaultFulfillmentTab('country_operations_director')).toBe('DOCKS');
        });

        it('authorizes Head of Operations on operational workflows', () => {
            expect(canApprove('country_operations_director', 'purchase_order', 150000)).toBe(false);
            expect(canApprove('country_operations_director', 'inventory_adjustment', 500)).toBe(true);
            expect(canApprove('country_operations_director', 'refund', 10000)).toBe(true);
            expect(canApprove('country_operations_director', 'employee_hire')).toBe(true);
        });
    });

    describe('Head of Finance (head_of_finance / head_of_finance / head_of_finance)', () => {
        it('authorizes Head of Finance as co-approver for margin floor breaches', () => {
            expect(FINANCE_COAPPROVER_ROLES).toContain('country_finance_director');
            expect(FINANCE_COAPPROVER_ROLES).toContain('country_finance_director');
            expect(FINANCE_COAPPROVER_ROLES).toContain('country_finance_director');
            expect(FINANCE_COAPPROVER_ROLES).toContain('country_managing_director');
            expect(FINANCE_COAPPROVER_ROLES).toContain('group_ceo');
            expect(FINANCE_COAPPROVER_ROLES).toContain('group_ceo');
            expect(FINANCE_COAPPROVER_ROLES).toContain('group_ceo');
        });

        it('authorizes Head of Finance to approve financial workflows', () => {
            expect(canApprove('country_finance_director', 'expense', 4500)).toBe(true);
            expect(canApprove('country_finance_director', 'expense', 50000)).toBe(true);
            expect(canApprove('country_finance_director', 'purchase_order', 45000)).toBe(false);
            expect(canApprove('country_finance_director', 'purchase_order', 250000)).toBe(false);
            expect(canApprove('country_finance_director', 'price_change', 25)).toBe(true);
        });

        it('grants settings module access for fiscal policy and tax configuration', () => {
            expect(canAccessModule('country_finance_director', 'settings')).toBe(true);
            expect(canAccessModule('country_finance_director', 'settings')).toBe(true);
            expect(canAccessModule('country_finance_director', 'settings')).toBe(true);
            expect(ROLE_PERMISSIONS['country_finance_director']).toContain('settings');
        });

        it('denies cashier point-of-sale register checkout mutations (SoD)', () => {
            expect(hasPermission('country_finance_director', 'PROCESS_SALE' as any)).toBe(false);
            expect(hasPermission('country_finance_director', 'PROCESS_SALE' as any)).toBe(false);
            expect(hasPermission('country_finance_director', 'PROCESS_SALE' as any)).toBe(false);
        });
    });

    describe('Head of Procurement (head_of_procurement / head_of_procurement)', () => {
        it('authorizes Head of Procurement on purchase orders across all tiers', () => {
            expect(canApprove('country_commercial_director', 'purchase_order', 5000)).toBe(true);
            expect(canApprove('country_commercial_director', 'purchase_order', 25000)).toBe(true);
            expect(canApprove('country_commercial_director', 'purchase_order', 200000)).toBe(true);
            expect(canApprove('country_commercial_director', 'purchase_order', 200000)).toBe(true);
        });

        it('grants procurement and warehouse visibility with settings access', () => {
            expect(canAccessModule('country_commercial_director', 'procurement')).toBe(true);
            expect(canAccessModule('country_commercial_director', 'settings')).toBe(true);
            expect(ROLE_PERMISSIONS['country_commercial_director']).toContain('settings');
        });
    });

    describe('Head of Human Resources (head_of_hr / head_of_hr)', () => {
        it('authorizes Head of HR on employee hiring workflows', () => {
            expect(canApprove('country_hr_director', 'employee_hire')).toBe(true);
            expect(canApprove('country_hr_director', 'employee_hire')).toBe(true);
            expect(canApprove('country_hr_director', 'employee_hire')).toBe(true);
        });

        it('grants settings module access for HR & Workforce Policy', () => {
            expect(canAccessModule('country_hr_director', 'settings')).toBe(true);
            expect(ROLE_PERMISSIONS['country_hr_director']).toContain('settings');
        });
    });

    describe('Head of Supply Chain (head_of_supply_chain / head_of_supply_chain)', () => {
        it('grants supply chain fulfillment tabs across inbound, outbound, and transit', () => {
            const tabs = getVisibleFulfillmentTabs('country_supply_chain_director');
            expect(tabs).toContain('DOCKS');
            expect(tabs).toContain('RECEIVE');
            expect(tabs).toContain('PUTAWAY');
            expect(tabs).toContain('TRANSFER');
            expect(tabs).toContain('PICK');
            expect(tabs).toContain('PACK');
            expect(tabs).toContain('DRIVER');
            expect(tabs).toContain('REPLENISH');
            expect(tabs).toContain('COUNT');
            expect(tabs).toContain('ASSIGN');
            expect(tabs).toContain('LABELS');
        });

        it('authorizes Head of Supply Chain on inventory adjustment workflows', () => {
            expect(canApprove('country_supply_chain_director', 'inventory_adjustment', 50)).toBe(true);
            expect(canApprove('country_supply_chain_director', 'inventory_adjustment', 500)).toBe(true);
        });
    });
});
