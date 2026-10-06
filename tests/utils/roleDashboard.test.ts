import { describe, it, expect, vi } from 'vitest';
import { getRoleDashboardRoute } from '../../utils/roleDashboard';

describe('getRoleDashboardRoute Sovereign Navigation', () => {
  it('routes Oscar Kennedy (procurement_manager) strictly to /procurement and never /admin', () => {
    // When active site is Administration HQ
    const adminSiteRoute = getRoleDashboardRoute('procurement_manager', 'Administration');
    expect(adminSiteRoute).toBe('/procurement');

    // When active site is unassigned or null
    const unassignedRoute = getRoleDashboardRoute('procurement_manager', undefined);
    expect(unassignedRoute).toBe('/procurement');

    // Guaranteed to never route to /admin
    expect(adminSiteRoute).not.toBe('/admin');
  });

  it('routes Specialized Level 2 Directors to their sovereign domain', () => {
    expect(getRoleDashboardRoute('finance_manager', 'Administration')).toBe('/finance');
    expect(getRoleDashboardRoute('hr_manager', 'Administration')).toBe('/employees');
    expect(getRoleDashboardRoute('hr', 'Administration')).toBe('/employees');
    expect(getRoleDashboardRoute('merchandising_manager', 'Administration')).toBe('/pricing');
    expect(getRoleDashboardRoute('it_support', 'Administration')).toBe('/settings');
    expect(getRoleDashboardRoute('security_manager', 'Administration')).toBe('/settings');
    expect(getRoleDashboardRoute('supply_chain_manager', 'Administration')).toBe('/procurement');
    expect(getRoleDashboardRoute('buyer', 'Administration')).toBe('/procurement');
    expect(getRoleDashboardRoute('auditor', 'Administration')).toBe('/finance');
  });

  it('routes Executive Leadership to Central Operations (/admin) unless scoped to a physical site', () => {
    expect(getRoleDashboardRoute('super_admin', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('CEO', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('regional_manager', 'Administration')).toBe('/admin');
    expect(getRoleDashboardRoute('operations_manager', 'Administration')).toBe('/admin');

    // Executive scoped to a Warehouse moves to WMS ops
    expect(getRoleDashboardRoute('super_admin', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('operations_manager', 'Distribution Center')).toBe('/wms-ops');

    // Executive scoped to a Store moves to POS command
    expect(getRoleDashboardRoute('super_admin', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('regional_manager', 'Retail')).toBe('/pos-dashboard');
  });

  it('routes Warehouse and Floor Operations workers to /wms-ops', () => {
    expect(getRoleDashboardRoute('warehouse_manager', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('logistics_manager', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('dispatch_manager', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('picker', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('packer', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('receiver', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('driver', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('forklift_operator', 'Warehouse')).toBe('/wms-ops');
    expect(getRoleDashboardRoute('inventory_specialist', 'Warehouse')).toBe('/wms-ops');
  });

  it('routes Store Operations staff to POS or POS Dashboard', () => {
    expect(getRoleDashboardRoute('store_manager', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('assistant_manager', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('shift_lead', 'Store')).toBe('/pos-dashboard');
    expect(getRoleDashboardRoute('store_supervisor', 'Store')).toBe('/pos-dashboard');

    expect(getRoleDashboardRoute('cashier', 'Store')).toBe('/pos');
    expect(getRoleDashboardRoute('sales_associate', 'Store')).toBe('/pos');
    expect(getRoleDashboardRoute('pos', 'Store')).toBe('/pos');
  });

  it('falls back safely to /profile for unknown or missing roles without infinite loops', () => {
    expect(getRoleDashboardRoute(undefined, undefined)).toBe('/profile');
    expect(getRoleDashboardRoute('', undefined)).toBe('/profile');
    // Completely unrecognized role falls back to safe universal route
    expect(getRoleDashboardRoute('non_existent_role_xyz', undefined)).toBe('/profile');
    expect(getRoleDashboardRoute('non_existent_role_xyz', undefined)).not.toBe('/admin');
  });
});
