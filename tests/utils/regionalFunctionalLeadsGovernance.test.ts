import { describe, it, expect } from 'vitest';
import { canAccessModule, canSwitchCountry, hasPermission } from '../../utils/permissions';
import { getRoleDashboardRoute } from '../../utils/roleDashboard';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';

describe('Regional Functional Leads Operational Governance Engine', () => {
    describe('Regional Procurement Lead (regional_procurement_lead)', () => {
        it('allows access to procurement and regional command decks', () => {
            expect(canAccessModule('regional_procurement_lead', 'procurement')).toBe(true);
            expect(canAccessModule('regional_procurement_lead', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till POS, central finance, and system settings', () => {
            expect(canAccessModule('regional_procurement_lead', 'pos')).toBe(false);
            expect(canAccessModule('regional_procurement_lead', 'finance')).toBe(false);
            expect(canAccessModule('regional_procurement_lead', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_procurement_lead')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_procurement_lead' })).toBe(false);
        });
    });

    describe('Regional Merchandising Lead (regional_merchandising_lead)', () => {
        it('allows access to pricing/merchandising and regional command decks', () => {
            expect(canAccessModule('regional_merchandising_lead', 'pricing')).toBe(true);
            expect(canAccessModule('regional_merchandising_lead', 'regional-ops')).toBe(true);
        });

        it('has promotion creation and price change approval authority', () => {
            expect(hasPermission('regional_merchandising_lead', 'ACCESS_REGIONAL_OPS')).toBe(true);
            expect(hasPermission('regional_merchandising_lead', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('regional_merchandising_lead', 'CREATE_PROMOTION')).toBe(true);
            expect(hasPermission('regional_merchandising_lead', 'APPROVE_PRICE_CHANGE')).toBe(true);
        });

        it('strictly blocks POS till, procurement, warehouse, and system settings', () => {
            expect(canAccessModule('regional_merchandising_lead', 'pos')).toBe(false);
            expect(canAccessModule('regional_merchandising_lead', 'procurement')).toBe(false);
            expect(canAccessModule('regional_merchandising_lead', 'warehouse')).toBe(false);
            expect(canAccessModule('regional_merchandising_lead', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_merchandising_lead')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_merchandising_lead' })).toBe(false);
        });
    });

    describe('Regional Finance Officer (regional_finance_officer)', () => {
        it('allows access to financials, sales history, and regional command decks', () => {
            expect(canAccessModule('regional_finance_officer', 'finance')).toBe(true);
            expect(canAccessModule('regional_finance_officer', 'sales')).toBe(true);
            expect(canAccessModule('regional_finance_officer', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till checkout mutations, physical warehouse fulfillment scanning, and system settings', () => {
            expect(hasPermission('regional_finance_officer', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_finance_officer', 'VOID_SALE')).toBe(false);
            expect(canAccessModule('regional_finance_officer', 'warehouse')).toBe(false);
            expect(canAccessModule('regional_finance_officer', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_finance_officer')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_finance_officer' })).toBe(false);
        });
    });

    describe('Regional HR Officer (regional_hr_officer)', () => {
        it('allows access to employee human capital and regional command decks', () => {
            expect(canAccessModule('regional_hr_officer', 'employees')).toBe(true);
            expect(canAccessModule('regional_hr_officer', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till POS, procurement, pricing, and physical warehouse scanning', () => {
            expect(canAccessModule('regional_hr_officer', 'pos')).toBe(false);
            expect(canAccessModule('regional_hr_officer', 'procurement')).toBe(false);
            expect(canAccessModule('regional_hr_officer', 'pricing')).toBe(false);
            expect(canAccessModule('regional_hr_officer', 'warehouse')).toBe(false);
            expect(canAccessModule('regional_hr_officer', 'settings')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_hr_officer')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_hr_officer' })).toBe(false);
        });
    });

    describe('Regional Security Supervisor (regional_security_supervisor)', () => {
        it('allows access to system audit logs, sales history, and regional command decks', () => {
            expect(canAccessModule('regional_security_supervisor', 'settings')).toBe(true);
            expect(canAccessModule('regional_security_supervisor', 'sales')).toBe(true);
            expect(canAccessModule('regional_security_supervisor', 'regional-ops')).toBe(true);
        });

        it('strictly blocks retail till checkout mutations, procurement, and merchandising pricing', () => {
            expect(hasPermission('regional_security_supervisor', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_security_supervisor', 'VOID_SALE')).toBe(false);
            expect(canAccessModule('regional_security_supervisor', 'procurement')).toBe(false);
            expect(canAccessModule('regional_security_supervisor', 'pricing')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_security_supervisor')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_security_supervisor' })).toBe(false);
        });
    });

    describe('Regional Logistics Lead (regional_logistics_lead)', () => {
        it('allows supervisory access to warehouse freight operations and regional command decks', () => {
            expect(canAccessModule('regional_logistics_lead', 'warehouse')).toBe(true);
            expect(canAccessModule('regional_logistics_lead', 'regional-ops')).toBe(true);
        });

        it('confines fulfillment tabs to macro-logistics: DOCKS, DRIVER, RECEIVE, and TRANSFER', () => {
            const tabs = getVisibleFulfillmentTabs('regional_logistics_lead');
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
            expect(canAccessModule('regional_logistics_lead', 'pos')).toBe(false);
            expect(canAccessModule('regional_logistics_lead', 'finance')).toBe(false);
            expect(canAccessModule('regional_logistics_lead', 'pricing')).toBe(false);
        });

        it('routes by default to /regional-ops command center', () => {
            expect(getRoleDashboardRoute('regional_logistics_lead')).toBe('/regional-ops');
        });

        it('locks sovereign country switching to CEO and Country Managing Director', () => {
            expect(canSwitchCountry({ role: 'regional_logistics_lead' })).toBe(false);
        });
    });
});
