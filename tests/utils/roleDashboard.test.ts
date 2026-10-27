import { afterEach, describe, it, expect, vi } from 'vitest';
import { native } from '../../utils/native';

import { getRoleDashboardRoute } from '../../utils/roleDashboard';

afterEach(() => vi.restoreAllMocks());

describe('getRoleDashboardRoute Sovereign Navigation', () => {
  it('routes Oscar Kennedy (head_of_procurement) strictly to /procurement and never /admin', () => {
    // When active site is Administration HQ
    const adminSiteRoute = getRoleDashboardRoute('country_commercial_director', 'Administration');
    expect(adminSiteRoute).toBe('/procurement');

    // When active site is unassigned or null
    const unassignedRoute = getRoleDashboardRoute('country_commercial_director', undefined);
    expect(unassignedRoute).toBe('/procurement');

    // Guaranteed to never route to /admin
    expect(adminSiteRoute).not.toBe('/admin');
  });

  it('routes Specialized Level 2 Directors to their sovereign domain', () => {
    expect(getRoleDashboardRoute('country_finance_director', 'Administration')).toBe('/finance');
    expect(getRoleDashboardRoute('country_finance_director', 'Administration')).toBe('/finance');
    expect(getRoleDashboardRoute('country_hr_director', 'Administration')).toBe('/employees');
    expect(getRoleDashboardRoute('country_hr_director', 'Administration')).toBe('/employees');
    expect(getRoleDashboardRoute('hr_generalist', 'Administration')).toBe('/employees');
    expect(getRoleDashboardRoute('merchandising_specialist', 'Administration')).toBe('/pricing');
    expect(getRoleDashboardRoute('merchandiser', 'Administration')).toBe('/pricing');
    expect(getRoleDashboardRoute('country_technology_director', 'Administration')).toBe('/settings');
    expect(getRoleDashboardRoute('it_support', 'Administration')).toBe('/settings');
    expect(getRoleDashboardRoute('regional_security_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('country_supply_chain_director', 'Administration')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('country_supply_chain_director', 'Administration')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('country_commercial_director', 'Administration')).toBe('/procurement');
    expect(getRoleDashboardRoute('buyer', 'Administration')).toBe('/procurement');
    expect(getRoleDashboardRoute('country_compliance_manager', 'Administration')).toBe('/finance');
    expect(getRoleDashboardRoute('auditor', 'Administration')).toBe('/finance');
  });

  it('routes Executive Leadership to Central Operations (/admin) unless scoped to a physical site', () => {
    expect(getRoleDashboardRoute('group_ceo', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('group_ceo', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('country_managing_director', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('country_managing_director', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('country_operations_director', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('regional_operations_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('country_operations_director', 'Administration')).toBe('/admin');

    // Executive scoped to a Warehouse moves to WMS ops
    expect(getRoleDashboardRoute('group_ceo', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('country_operations_director', 'Distribution Center')).toBe('/wms-ops');

    // Executive scoped to a Store moves to POS command
    expect(getRoleDashboardRoute('group_ceo', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('regional_operations_manager', 'Retail')).toBe('/regional-ops');
  });

  it('routes Warehouse and Floor Operations workers to their specific role landing tab on /wms-ops', () => {
    expect(getRoleDashboardRoute('warehouse_manager', 'Warehouse')).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('regional_supply_chain_manager', 'Warehouse')).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('regional_supply_chain_manager', 'Distribution Center')).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('regional_supply_chain_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_supply_chain_manager', 'Store')).toBe('/inventory');
    expect(getRoleDashboardRoute('regional_procurement_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_procurement_manager', 'Warehouse')).toBe('/procurement');
    expect(getRoleDashboardRoute('regional_procurement_manager', 'Store')).toBe('/procurement');
    expect(getRoleDashboardRoute('regional_logistics_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_logistics_manager', 'Warehouse')).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('regional_logistics_manager', 'Store')).toBe('/inventory');
    expect(getRoleDashboardRoute('regional_finance_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_finance_manager', 'Warehouse')).toBe('/finance');
    expect(getRoleDashboardRoute('regional_finance_manager', 'Store')).toBe('/finance');
    expect(getRoleDashboardRoute('regional_merchandising_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_merchandising_manager', 'Warehouse')).toBe('/pricing');
    expect(getRoleDashboardRoute('regional_merchandising_manager', 'Store')).toBe('/pricing');
    expect(getRoleDashboardRoute('regional_hr_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_hr_manager', 'Warehouse')).toBe('/employees');
    expect(getRoleDashboardRoute('regional_hr_manager', 'Store')).toBe('/employees');
    expect(getRoleDashboardRoute('regional_security_manager', 'Administration')).toBe('/regional-ops');
    expect(getRoleDashboardRoute('regional_security_manager', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('regional_security_manager', 'Warehouse')).toBe('/settings');
    expect(getRoleDashboardRoute('dispatch_supervisor', 'Warehouse')).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('picker', 'Warehouse')).toBe('/wms-ops?tab=PICK');
    expect(getRoleDashboardRoute('packer', 'Warehouse')).toBe('/wms-ops?tab=PACK');
    expect(getRoleDashboardRoute('receiver', 'Warehouse')).toBe('/wms-ops?tab=RECEIVE');
    expect(getRoleDashboardRoute('driver', 'Warehouse')).toBe('/wms-ops?tab=DRIVER');
    expect(getRoleDashboardRoute('forklift_operator', 'Warehouse')).toBe('/wms-ops?tab=PUTAWAY');
    expect(getRoleDashboardRoute('inventory_specialist', 'Warehouse')).toBe('/wms-ops?tab=COUNT');
    expect(getRoleDashboardRoute('stock_clerk', 'Warehouse')).toBe('/wms-ops?tab=COUNT');
    expect(getRoleDashboardRoute('returns_clerk', 'Warehouse')).toBe('/wms-ops?tab=RETURNS');
    expect(getRoleDashboardRoute('inbound_qc_inspector', 'Warehouse')).toBe('/wms-ops?tab=RECEIVE');
    expect(getRoleDashboardRoute('replenishment_planner', 'Warehouse')).toBe('/wms-ops?tab=REPLENISH');
  });

  it('routes Store Operations staff to POS or POS Dashboard', () => {
    expect(getRoleDashboardRoute('store_manager', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('assistant_store_manager', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('shift_supervisor', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('shift_supervisor', 'Store')).toBe('/pos-dashboard');

    expect(getRoleDashboardRoute('cashier', 'Store')).toBe('/pos');
    expect(getRoleDashboardRoute('sales_associate', 'Store')).toBe('/pos');
    expect(getRoleDashboardRoute('cashier', 'Store')).toBe('/pos');
  });

  it('falls back safely to /profile for unknown or missing roles without infinite loops', () => {
    expect(getRoleDashboardRoute(undefined, undefined)).toBe('/profile');
    expect(getRoleDashboardRoute('', undefined)).toBe('/profile');
    // Completely unrecognized role falls back to safe universal route
    expect(getRoleDashboardRoute('non_existent_role_xyz', undefined)).toBe('/profile');
    expect(getRoleDashboardRoute('non_existent_role_xyz', undefined)).not.toBe('/admin');
  });
});


describe('clean mobile role routing while the site loads', () => {
  it('routes warehouse workers to fulfillment role tab without assuming POS', () => {
    vi.spyOn(native, 'isCleanMobileMode').mockReturnValue(true);
    expect(getRoleDashboardRoute('warehouse_manager', undefined)).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('picker', undefined)).toBe('/wms-ops?tab=PICK');
    expect(getRoleDashboardRoute('packer', undefined)).toBe('/wms-ops?tab=PACK');
    expect(getRoleDashboardRoute('receiver', undefined)).toBe('/wms-ops?tab=RECEIVE');
    expect(getRoleDashboardRoute('driver', undefined)).toBe('/wms-ops?tab=DRIVER');

    expect(getRoleDashboardRoute('warehouse_manager', 'Warehouse')).toBe('/wms-ops?tab=DOCKS');
    expect(getRoleDashboardRoute('picker', 'Warehouse')).toBe('/wms-ops?tab=PICK');
    expect(getRoleDashboardRoute('packer', 'Warehouse')).toBe('/wms-ops?tab=PACK');
    expect(getRoleDashboardRoute('receiver', 'Warehouse')).toBe('/wms-ops?tab=RECEIVE');
    expect(getRoleDashboardRoute('driver', 'Warehouse')).toBe('/wms-ops?tab=DRIVER');

    expect(getRoleDashboardRoute('cashier', undefined)).toBe('/pos');
  });

  it('does not route a warehouse worker to POS at a store or grant operations to unknown roles', () => {
    vi.spyOn(native, 'isCleanMobileMode').mockReturnValue(true);
    expect(getRoleDashboardRoute('warehouse_manager', 'Store')).toBe('/profile');
    expect(getRoleDashboardRoute('unknown_role', undefined)).toBe('/profile');
  });
});
