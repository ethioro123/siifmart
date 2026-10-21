import { describe, it, expect } from 'vitest';
import { canAccessModule, canViewAllSites, canSwitchCountry, hasPermission, PERMISSIONS } from '../../utils/permissions';
import { getRoleDashboardRoute } from '../../utils/roleDashboard';
import { getVisibleFulfillmentTabs, getDefaultFulfillmentTab } from '../../utils/fulfillmentTabPermissions';

describe('Returns Specialist and Stock Clerk Governance (Floor Roles)', () => {
    describe('Returns Specialist (returns_clerk)', () => {
        it('allows access to warehouse fulfillment module and locks administrative/financial modules', () => {
            expect(canAccessModule('returns_clerk', 'warehouse')).toBe(true);
            expect(canAccessModule('returns_clerk', 'pos')).toBe(false);
            expect(canAccessModule('returns_clerk', 'finance')).toBe(false);
            expect(canAccessModule('returns_clerk', 'procurement')).toBe(false);
            expect(canAccessModule('returns_clerk', 'admin')).toBe(false);
            expect(canAccessModule('returns_clerk', 'settings')).toBe(false);
        });

        it('has PROCESS_RETURNS, ACCESS_WAREHOUSE, and COMPLETE_TASKS permissions', () => {
            expect(hasPermission('returns_clerk', 'ACCESS_WAREHOUSE')).toBe(true);
            expect(hasPermission('returns_clerk', 'PROCESS_RETURNS')).toBe(true);
            expect(hasPermission('returns_clerk', 'COMPLETE_TASKS')).toBe(true);
            expect(hasPermission('returns_clerk', 'VIEW_SALARY')).toBe(false);
            expect(hasPermission('returns_clerk', 'MANAGE_ROLES')).toBe(false);
        });

        it('routes by default to /wms-ops?tab=RETURNS', () => {
            expect(getRoleDashboardRoute('returns_clerk')).toBe('/wms-ops?tab=RETURNS');
            expect(getDefaultFulfillmentTab('returns_clerk')).toBe('RETURNS');
        });

        it('confines visible tabs to core floor operations plus RETURNS', () => {
            const tabs = getVisibleFulfillmentTabs('returns_clerk');
            expect(tabs).toContain('RECEIVE');
            expect(tabs).toContain('PUTAWAY');
            expect(tabs).toContain('PICK');
            expect(tabs).toContain('PACK');
            expect(tabs).toContain('RETURNS');

            expect(tabs).not.toContain('DOCKS');
            expect(tabs).not.toContain('DRIVER');
            expect(tabs).not.toContain('COUNT');
            expect(tabs).not.toContain('WASTE');
            expect(tabs).not.toContain('ASSIGN');
        });

        it('strictly binds to local branch and locks sovereign country switching', () => {
            expect(canViewAllSites('returns_clerk')).toBe(false);
            expect(canSwitchCountry({ role: 'returns_clerk' })).toBe(false);
        });
    });

    describe('Warehouse Stock Clerk (stock_clerk)', () => {
        it('allows access to warehouse fulfillment module and locks retail/administrative modules', () => {
            expect(canAccessModule('stock_clerk', 'warehouse')).toBe(true);
            expect(canAccessModule('stock_clerk', 'pos')).toBe(false);
            expect(canAccessModule('stock_clerk', 'finance')).toBe(false);
            expect(canAccessModule('stock_clerk', 'admin')).toBe(false);
            expect(canAccessModule('stock_clerk', 'settings')).toBe(false);
        });

        it('has INVENTORY_COUNT, MANAGE_REPLENISHMENT, and COMPLETE_TASKS permissions', () => {
            expect(hasPermission('stock_clerk', 'ACCESS_WAREHOUSE')).toBe(true);
            expect(hasPermission('stock_clerk', 'INVENTORY_COUNT')).toBe(true);
            expect(hasPermission('stock_clerk', 'MANAGE_REPLENISHMENT')).toBe(true);
            expect(hasPermission('stock_clerk', 'COMPLETE_TASKS')).toBe(true);
            expect(hasPermission('stock_clerk', 'VIEW_SALARY')).toBe(false);
            expect(hasPermission('stock_clerk', 'EDIT_PRICE')).toBe(false);
        });

        it('routes by default to /wms-ops?tab=COUNT', () => {
            expect(getRoleDashboardRoute('stock_clerk')).toBe('/wms-ops?tab=COUNT');
            expect(getDefaultFulfillmentTab('stock_clerk')).toBe('COUNT');
        });

        it('confines visible tabs to core floor operations plus COUNT, REPLENISH, and LABELS', () => {
            const tabs = getVisibleFulfillmentTabs('stock_clerk');
            expect(tabs).toContain('RECEIVE');
            expect(tabs).toContain('PUTAWAY');
            expect(tabs).toContain('PICK');
            expect(tabs).toContain('PACK');
            expect(tabs).toContain('COUNT');
            expect(tabs).toContain('REPLENISH');
            expect(tabs).toContain('LABELS');

            expect(tabs).not.toContain('DOCKS');
            expect(tabs).not.toContain('DRIVER');
            expect(tabs).not.toContain('WASTE');
            expect(tabs).not.toContain('RETURNS');
            expect(tabs).not.toContain('ASSIGN');
        });

        it('strictly binds to local branch and locks sovereign country switching', () => {
            expect(canViewAllSites('stock_clerk')).toBe(false);
            expect(canSwitchCountry({ role: 'stock_clerk' })).toBe(false);
        });
    });

    describe('Forklift Operator (forklift_operator)', () => {
        it('routes by default to /wms-ops?tab=PUTAWAY', () => {
            expect(getRoleDashboardRoute('forklift_operator')).toBe('/wms-ops?tab=PUTAWAY');
            expect(getDefaultFulfillmentTab('forklift_operator')).toBe('PUTAWAY');
        });

        it('has COMPLETE_TASKS permission and locks managerial tabs', () => {
            expect(hasPermission('forklift_operator', 'ACCESS_WAREHOUSE')).toBe(true);
            expect(hasPermission('forklift_operator', 'COMPLETE_TASKS')).toBe(true);

            const tabs = getVisibleFulfillmentTabs('forklift_operator');
            expect(tabs).toContain('RECEIVE');
            expect(tabs).toContain('PUTAWAY');
            expect(tabs).toContain('PICK');
            expect(tabs).toContain('PACK');

            expect(tabs).not.toContain('DOCKS');
            expect(tabs).not.toContain('DRIVER');
            expect(tabs).not.toContain('RETURNS');
            expect(tabs).not.toContain('COUNT');
            expect(tabs).not.toContain('WASTE');
            expect(tabs).not.toContain('ASSIGN');
        });
    });
});
