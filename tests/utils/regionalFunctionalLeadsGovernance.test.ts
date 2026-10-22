import { describe, it, expect } from 'vitest';
import { canAccessModule, canSwitchCountry, hasPermission } from '../../utils/permissions';
import { getRoleDashboardRoute } from '../../utils/roleDashboard';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';

describe('Regional Department Managers Operational Governance Engine', () => {
    describe('Regional Procurement Manager (regional_procurement_manager)', () => {
        it('allows access to procurement and regional command decks', () => {
            expect(canAccessModule('regional_procurement_manager', 'procurement')).toBe(true);
            expect(canAccessModule('regional_procurement_manager', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till POS, central finance, and system settings', () => {
            expect(canAccessModule('regional_procurement_manager', 'pos')).toBe(false);
            expect(canAccessModule('regional_procurement_manager', 'finance')).toBe(false);
            expect(canAccessModule('regional_procurement_manager', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_procurement_manager')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_procurement_manager' })).toBe(false);
        });
    });

    describe('Regional Merchandising Manager (regional_merchandising_manager)', () => {
        it('allows access to pricing/merchandising and regional command decks', () => {
            expect(canAccessModule('regional_merchandising_manager', 'pricing')).toBe(true);
            expect(canAccessModule('regional_merchandising_manager', 'regional-ops')).toBe(true);
        });

        it('has promotion creation and price change approval authority', () => {
            expect(hasPermission('regional_merchandising_manager', 'ACCESS_REGIONAL_OPS')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'CREATE_PROMOTION')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'APPROVE_PRICE_CHANGE')).toBe(true);
        });

        it('strictly blocks POS till, procurement, warehouse, and system settings', () => {
            expect(canAccessModule('regional_merchandising_manager', 'pos')).toBe(false);
            expect(canAccessModule('regional_merchandising_manager', 'procurement')).toBe(false);
            expect(canAccessModule('regional_merchandising_manager', 'warehouse')).toBe(false);
            expect(canAccessModule('regional_merchandising_manager', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_merchandising_manager')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_merchandising_manager' })).toBe(false);
        });
    });

    describe('Regional Finance Manager (regional_finance_manager)', () => {
        it('allows access to financials, sales history, and regional command decks', () => {
            expect(canAccessModule('regional_finance_manager', 'finance')).toBe(true);
            expect(canAccessModule('regional_finance_manager', 'sales')).toBe(true);
            expect(canAccessModule('regional_finance_manager', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till checkout mutations, physical warehouse fulfillment scanning, and system settings', () => {
            expect(hasPermission('regional_finance_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_finance_manager', 'VOID_SALE')).toBe(false);
            expect(canAccessModule('regional_finance_manager', 'warehouse')).toBe(false);
            expect(canAccessModule('regional_finance_manager', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_finance_manager')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_finance_manager' })).toBe(false);
        });
    });

    describe('Regional HR Manager (regional_hr_manager)', () => {
        it('allows access to employee human capital and regional command decks', () => {
            expect(canAccessModule('regional_hr_manager', 'employees')).toBe(true);
            expect(canAccessModule('regional_hr_manager', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till POS, procurement, pricing, and physical warehouse scanning', () => {
            expect(canAccessModule('regional_hr_manager', 'pos')).toBe(false);
            expect(canAccessModule('regional_hr_manager', 'procurement')).toBe(false);
            expect(canAccessModule('regional_hr_manager', 'pricing')).toBe(false);
            expect(canAccessModule('regional_hr_manager', 'warehouse')).toBe(false);
            expect(canAccessModule('regional_hr_manager', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_hr_manager')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_hr_manager' })).toBe(false);
        });
    });

    describe('Regional Security Manager (regional_security_manager)', () => {
        it('allows access to system audit logs, sales history, and regional command decks', () => {
            expect(canAccessModule('regional_security_manager', 'settings')).toBe(true);
            expect(canAccessModule('regional_security_manager', 'sales')).toBe(true);
            expect(canAccessModule('regional_security_manager', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till checkout mutations, procurement, and merchandising pricing', () => {
            expect(hasPermission('regional_security_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_security_manager', 'VOID_SALE')).toBe(false);
            expect(canAccessModule('regional_security_manager', 'procurement')).toBe(false);
            expect(canAccessModule('regional_security_manager', 'pricing')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_security_manager')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_security_manager' })).toBe(false);
        });
    });

    describe('Regional Logistics Manager (regional_logistics_manager)', () => {
        it('allows supervisory access to warehouse freight operations and regional command decks', () => {
            expect(canAccessModule('regional_logistics_manager', 'warehouse')).toBe(true);
            expect(canAccessModule('regional_logistics_manager', 'regional-ops')).toBe(true);
        });

        it('confines fulfillment tabs to macro-logistics: DOCKS, DRIVER, RECEIVE, and TRANSFER', () => {
            const tabs = getVisibleFulfillmentTabs('regional_logistics_manager');
            expect(tabs).toContain('DOCKS');
            expect(tabs).toContain('DRIVER');
            expect(tabs).toContain('RECEIVE');
            expect(tabs).toContain('TRANSFER');

            expect(tabs).not.toContain('PICK');
            expect(tabs).not.toContain('PACK');
            expect(tabs).not.toContain('PUTAWAY');
            expect(tabs).not.toContain('COUNT');
            expect(tabs).not.toContain('WASTE');
            expect(tabs).not.toContain('RETURNS');
            expect(tabs).not.toContain('ASSIGN');
        });

        it('strictly blocks retail till POS, central finance, and merchandising pricing', () => {
            expect(canAccessModule('regional_logistics_manager', 'pos')).toBe(false);
            expect(canAccessModule('regional_logistics_manager', 'finance')).toBe(false);
            expect(canAccessModule('regional_logistics_manager', 'pricing')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_logistics_manager')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_logistics_manager' })).toBe(false);
        });
    });
});
