/**
 * Role-Based Access Control (RBAC) helpers
 * Extracted from auth.service.ts to keep file size manageable.
 *
 * ⚠️  SECURITY NOTICE: The canAccessSite multi-site list is intentionally
 * restricted to super_admin only. Do NOT add other roles without explicit
 * authorisation from the system owner.
 */

import type { UserRole } from './auth.service';

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
    // ═══ LEVEL 1 - EXECUTIVE ═══
    super_admin: ['*'], // CEO / Owner - Full Access to EVERYTHING
    country_managing_director: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    admin: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],

    // ═══ LEVEL 2 - REGIONAL/DIRECTORS ═══
    regional_manager: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    head_of_operations: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    operations_head: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    operations_manager: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    head_of_finance: [
        'dashboard', 'finance', 'sales', 'procurement', 'employees', 'pricing', 'profile'
    ],
    finance_head: [
        'dashboard', 'finance', 'sales', 'procurement', 'employees', 'pricing', 'profile'
    ],
    finance_manager: [
        'dashboard', 'finance', 'sales', 'procurement', 'employees', 'pricing', 'profile'
    ],
    head_of_hr: [
        'dashboard', 'employees', 'finance', 'profile'
    ],
    hr_head: [
        'dashboard', 'employees', 'finance', 'profile'
    ],
    hr_manager: [
        'dashboard', 'employees', 'finance', 'profile'
    ],
    head_of_procurement: [
        'dashboard', 'procurement', 'inventory', 'warehouse', 'finance', 'profile'
    ],
    procurement_head: [
        'dashboard', 'procurement', 'inventory', 'warehouse', 'finance', 'profile'
    ],
    procurement_manager: [
        'dashboard', 'procurement', 'inventory', 'warehouse', 'finance', 'profile'
    ],
    head_of_supply_chain: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'finance', 'sales', 'profile'
    ],
    supply_chain_head: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'finance', 'sales', 'profile'
    ],
    supply_chain_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'finance', 'sales', 'profile'
    ],
    head_of_merchandising: [
        'dashboard', 'admin', 'pricing', 'inventory', 'sales', 'procurement', 'profile'
    ],
    merchandising_head: [
        'dashboard', 'admin', 'pricing', 'inventory', 'sales', 'procurement', 'profile'
    ],
    merchandising_manager: [
        'dashboard', 'admin', 'pricing', 'inventory', 'sales', 'procurement', 'profile'
    ],
    head_of_it: [
        'dashboard', 'settings', 'employees', 'profile'
    ],
    it_head: [
        'dashboard', 'settings', 'employees', 'profile'
    ],
    head_of_audit: [
        'dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'settings', 'pos', 'profile'
    ],
    audit_head: [
        'dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'settings', 'pos', 'profile'
    ],
    regional_procurement_lead: [
        'dashboard', 'regional-ops', 'procurement', 'inventory', 'pricing', 'customers', 'profile'
    ],
    regional_finance_officer: [
        'dashboard', 'regional-ops', 'finance', 'sales', 'pos', 'profile'
    ],
    regional_hr_officer: [
        'dashboard', 'regional-ops', 'employees', 'profile'
    ],
    regional_logistics_lead: [
        'dashboard', 'regional-ops', 'warehouse', 'inventory', 'procurement', 'employees', 'profile'
    ],
    regional_security_supervisor: [
        'dashboard', 'regional-ops', 'settings', 'pos', 'inventory', 'sales', 'employees', 'profile'
    ],

    // ═══ LEVEL 3 - SITE MANAGERS ═══
    store_manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'profile'
    ],
    warehouse_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'employees', 'profile'
    ],
    dispatch_manager: [
        'dashboard', 'warehouse', 'inventory', 'employees', 'profile'
    ],
    assistant_manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'
    ],
    shift_lead: [
        'dashboard', 'pos', 'inventory', 'customers', 'profile'
    ],

    // ═══ LEVEL 4 - STAFF ═══
    cashier: ['dashboard', 'pos', 'profile'],
    sales_associate: ['dashboard', 'pos', 'customers', 'inventory', 'profile'],
    stock_clerk: ['dashboard', 'warehouse', 'inventory', 'profile'],
    picker: ['dashboard', 'warehouse', 'inventory', 'profile'],
    packer: ['dashboard', 'warehouse', 'inventory', 'profile'],
    receiver: ['dashboard', 'warehouse', 'inventory', 'profile'],
    driver: ['dashboard', 'warehouse', 'inventory', 'profile'],
    forklift_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    inventory_specialist: ['dashboard', 'inventory', 'warehouse', 'profile'],
    customer_service: ['dashboard', 'customers', 'sales', 'profile'],
    auditor: ['dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'settings', 'profile'],
    it_support: ['dashboard', 'regional-ops', 'settings', 'employees', 'profile'],
    buyer: ['dashboard', 'regional-ops', 'procurement', 'profile'],
    demand_planner: ['dashboard', 'regional-ops', 'inventory', 'procurement', 'sales', 'profile'],
    inventory_manager: ['dashboard', 'regional-ops', 'inventory', 'warehouse', 'profile'],
    logistics_manager: ['dashboard', 'regional-ops', 'warehouse', 'inventory', 'employees', 'profile'],
    security_manager: ['dashboard', 'regional-ops', 'settings', 'employees', 'profile'],
    payroll_specialist: ['dashboard', 'regional-ops', 'employees', 'finance', 'profile'],
    talent_recruiter: ['dashboard', 'regional-ops', 'employees', 'profile'],
    hr_generalist: ['dashboard', 'regional-ops', 'employees', 'profile'],
    treasury_officer: ['dashboard', 'regional-ops', 'finance', 'pos', 'sales', 'profile'],
    tax_compliance_officer: ['dashboard', 'regional-ops', 'finance', 'sales', 'profile'],
    credit_control_officer: ['dashboard', 'regional-ops', 'finance', 'sales', 'customers', 'procurement', 'profile'],
    vendor_relations_manager: ['dashboard', 'regional-ops', 'procurement', 'pricing', 'inventory', 'profile'],
    customs_import_specialist: ['dashboard', 'regional-ops', 'procurement', 'inventory', 'profile'],
    inbound_qc_inspector: ['dashboard', 'regional-ops', 'procurement', 'warehouse', 'inventory', 'profile'],
    store_operations_auditor: ['dashboard', 'regional-ops', 'pos', 'inventory', 'pricing', 'sales', 'profile'],
    replenishment_planner: ['dashboard', 'regional-ops', 'inventory', 'warehouse', 'procurement', 'sales', 'profile'],
    fleet_maintenance_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],

    // ═══ LEGACY ROLES (backwards compatibility) ═══
    manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'],
    hr: ['dashboard', 'regional-ops', 'employees', 'profile'],
    pos: ['dashboard', 'pos', 'profile'],
    dispatcher: ['dashboard', 'inventory', 'warehouse', 'profile'],
    cs_manager: ['dashboard', 'regional-ops', 'customers', 'sales', 'profile'],
    store_supervisor: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'],
    returns_clerk: ['dashboard', 'warehouse', 'inventory', 'customers', 'profile'],
    merchandiser: ['dashboard', 'regional-ops', 'inventory', 'pricing', 'profile'],
    loss_prevention: ['dashboard', 'inventory', 'sales', 'profile'],
    accountant: ['dashboard', 'regional-ops', 'finance', 'sales', 'procurement', 'profile'],
    data_analyst: ['dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'profile'],
    training_coordinator: ['dashboard', 'regional-ops', 'employees', 'profile']
};

export function canAccessRoute(userRole: UserRole, route: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;
    if (permissions.includes('*')) return true;
    const lowerRoute = route.toLowerCase();
    return permissions.some(permission => {
        const lowerPerm = permission.toLowerCase();
        if (lowerPerm === 'warehouse' && (lowerRoute.includes('warehouse') || lowerRoute.includes('wms'))) return true;
        if (lowerPerm === 'pos' && lowerRoute.includes('pos')) return true;
        return lowerRoute.includes(lowerPerm);
    });
}

/**
 * Get available sections filtered by site type.
 * Prevents warehouse workers at stores from seeing warehouse sections and vice versa.
 */
export function getAvailableSections(userRole: UserRole, siteType?: string): string[] {
    const basePermissions = ROLE_PERMISSIONS[userRole] || [];
    if (basePermissions.includes('*') || ['admin', 'regional_manager', 'operations_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor'].includes(userRole)) return basePermissions;
    if (!siteType) return basePermissions;

    if (siteType === 'Store' || siteType === 'Dark Store') {
        return basePermissions.filter(p => p !== 'warehouse' && p !== 'procurement');
    }
    if (siteType === 'Warehouse' || siteType === 'Distribution Center') {
        return basePermissions.filter(p => p !== 'pos');
    }
    return basePermissions;
}

/**
 * Check if user can access a specific site.
 * Enforces site-level data isolation.
 *
 * ============================================================================
 * 🛑 CRITICAL DIRECTIVE FOR FUTURE AI ASSISTANTS 🛑
 * ============================================================================
 * DO NOT MODIFY THIS LIST TO ADD ANY OTHER ROLES!
 * MULTI-SITE ACCESS (SWITCHING SITES) IS STRICTLY RESTRICTED TO THE CEO.
 * NO WORKER, NOT EVEN HIGH-LEVEL POSITIONS OR REGIONAL MANAGERS, ARE ALLOWED
 * MULTI-SITE ACCESS EXCEPT THE CEO.
 * THIS IS A HARD SECURITY REQUIREMENT BY THE OWNER.
 * ============================================================================
 */
export function canAccessSite(userRole: UserRole, userSiteId: string, targetSiteId: string): boolean {
    const multiSiteRoles: UserRole[] = ['super_admin'];
    if (multiSiteRoles.includes(userRole)) return true;
    return userSiteId === targetSiteId;
}
