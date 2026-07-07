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

    // ═══ LEVEL 2 - REGIONAL/DIRECTORS ═══
    regional_manager: [
        'dashboard', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'finance', 'procurement', 'settings', 'profile'
    ],
    operations_manager: [
        'dashboard', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'finance', 'procurement', 'settings', 'profile'
    ],
    finance_manager: [
        'dashboard', 'finance', 'sales', 'procurement', 'employees', 'profile'
    ],
    hr_manager: [
        'dashboard', 'employees', 'finance', 'profile'
    ],
    procurement_manager: [
        'dashboard', 'procurement', 'inventory', 'warehouse', 'finance', 'profile'
    ],
    supply_chain_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'finance', 'profile'
    ],

    // ═══ LEVEL 3 - SITE MANAGERS ═══
    store_manager: [
        'dashboard', 'pos', 'inventory', 'procurement', 'sales', 'customers', 'employees', 'profile'
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
    stock_clerk: ['dashboard', 'inventory', 'profile'],
    picker: ['dashboard', 'warehouse', 'inventory', 'profile'],
    packer: ['dashboard', 'warehouse', 'inventory', 'profile'],
    receiver: ['dashboard', 'warehouse', 'inventory', 'profile'],
    driver: ['dashboard', 'warehouse', 'inventory', 'profile'],
    forklift_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    inventory_specialist: ['dashboard', 'inventory', 'warehouse', 'profile'],
    customer_service: ['dashboard', 'customers', 'sales', 'profile'],
    auditor: ['dashboard', 'sales', 'inventory', 'finance', 'profile'],
    it_support: ['dashboard', 'settings', 'employees', 'profile'],
    buyer: ['dashboard', 'procurement', 'profile'],
    demand_planner: ['dashboard', 'inventory', 'procurement', 'sales', 'profile'],
    inventory_manager: ['dashboard', 'inventory', 'warehouse', 'profile'],
    logistics_manager: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    security_manager: ['dashboard', 'settings', 'employees', 'profile'],

    // ═══ LEGACY ROLES (backwards compatibility) ═══
    // admin: stripped to read-only — no active users should have this role.
    // Use super_admin (CEO) or regional_manager instead.
    admin: ['dashboard', 'profile'],
    manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'pricing', 'profile'],
    hr: ['dashboard', 'employees', 'finance', 'profile'],
    pos: ['dashboard', 'pos', 'customers', 'inventory', 'profile'],
    dispatcher: ['dashboard', 'inventory', 'warehouse', 'profile'],
    cs_manager: ['dashboard', 'customers', 'sales', 'profile'],
    store_supervisor: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'],
    returns_clerk: ['dashboard', 'warehouse', 'inventory', 'customers', 'profile'],
    merchandiser: ['dashboard', 'inventory', 'pricing', 'profile'],
    loss_prevention: ['dashboard', 'inventory', 'sales', 'profile'],
    accountant: ['dashboard', 'finance', 'sales', 'profile'],
    data_analyst: ['dashboard', 'sales', 'inventory', 'finance', 'profile'],
    training_coordinator: ['dashboard', 'employees', 'profile']
};

export function canAccessRoute(userRole: UserRole, route: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (permissions.includes('*')) return true;
    return permissions.some(permission =>
        route.toLowerCase().includes(permission.toLowerCase())
    );
}

/**
 * Get available sections filtered by site type.
 * Prevents warehouse workers at stores from seeing warehouse sections and vice versa.
 */
export function getAvailableSections(userRole: UserRole, siteType?: string): string[] {
    const basePermissions = ROLE_PERMISSIONS[userRole];
    if (basePermissions.includes('*')) return basePermissions;
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
