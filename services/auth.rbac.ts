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
    // ═══ LEVEL 1 - GLOBAL EXECUTIVE BOARD ═══
    group_ceo: ['*'], // Global Group CEO - Full Access to EVERYTHING
    group_coo: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    group_cfo: [
        'dashboard', 'admin', 'finance', 'sales', 'pricing', 'procurement', 'settings', 'profile'
    ],
    group_cco: [
        'dashboard', 'admin', 'procurement', 'pricing', 'inventory', 'sales', 'customers', 'settings', 'profile'
    ],
    group_csco: [
        'dashboard', 'admin', 'warehouse', 'inventory', 'procurement', 'regional-ops', 'sales', 'settings', 'profile'
    ],
    group_chro: [
        'dashboard', 'admin', 'employees', 'finance', 'settings', 'profile'
    ],
    group_cto: [
        'dashboard', 'admin', 'settings', 'employees', 'profile'
    ],
    group_cio: [
        'dashboard', 'admin', 'settings', 'employees', 'sales', 'finance', 'profile'
    ],
    group_clco: [
        'dashboard', 'admin', 'settings', 'finance', 'procurement', 'profile'
    ],
    group_cae: [
        'dashboard', 'admin', 'regional-ops', 'finance', 'sales', 'inventory', 'pos', 'pricing', 'warehouse', 'settings', 'profile'
    ],
    group_cmo: [
        'dashboard', 'admin', 'sales', 'pricing', 'procurement', 'customers', 'settings', 'profile'
    ],
    super_admin: ['*'], // Global CEO / Owner - Full Access to EVERYTHING
    CEO: ['*'],
    ceo: ['*'],

    // ═══ LEVEL 2 - NATIONAL EXECUTIVE BOARD ═══
    country_managing_director: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    admin: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    country_operations_director: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    country_finance_director: [
        'dashboard', 'admin', 'finance', 'sales', 'pricing', 'procurement', 'settings', 'profile'
    ],
    country_commercial_director: [
        'dashboard', 'admin', 'procurement', 'pricing', 'inventory', 'sales', 'customers', 'settings', 'profile'
    ],
    country_supply_chain_director: [
        'dashboard', 'admin', 'warehouse', 'inventory', 'procurement', 'regional-ops', 'sales', 'settings', 'profile'
    ],
    country_hr_director: [
        'dashboard', 'admin', 'employees', 'finance', 'settings', 'profile'
    ],
    country_technology_director: [
        'dashboard', 'admin', 'settings', 'employees', 'profile'
    ],
    country_compliance_manager: [
        'dashboard', 'admin', 'regional-ops', 'finance', 'sales', 'inventory', 'pos', 'pricing', 'settings', 'profile'
    ],

    // ═══ LEVEL 3 - CORPORATE DIRECTORATES (HQ C-SUITE) ═══
    head_of_operations: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    head_of_finance: [
        'dashboard', 'finance', 'sales', 'pricing', 'settings', 'profile'
    ],
    head_of_hr: [
        'dashboard', 'employees', 'finance', 'settings', 'profile'
    ],
    head_of_procurement: [
        'dashboard', 'procurement', 'inventory', 'pricing', 'warehouse', 'settings', 'profile'
    ],
    head_of_supply_chain: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'finance', 'sales', 'profile'
    ],
    head_of_merchandising: [
        'dashboard', 'admin', 'pricing', 'inventory', 'sales', 'procurement', 'profile'
    ],
    head_of_it: [
        'dashboard', 'settings', 'employees', 'profile'
    ],
    head_of_audit: [
        'dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'settings', 'pos', 'profile'
    ],
    auditor: [
        'dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'settings', 'pos', 'profile'
    ],

    // ═══ LEVEL 4 - REGIONAL OPERATIONS MANAGER ═══
    regional_operations_manager: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],
    area_operations_manager: [
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'warehouse', 'sales', 'customers', 'employees', 'pricing', 'finance', 'procurement', 'settings', 'profile'
    ],

    // ═══ LEVEL 5 - REGIONAL DEPARTMENT MANAGERS ═══
    regional_supply_chain_manager: [
        'dashboard', 'admin', 'regional-ops', 'warehouse', 'inventory', 'procurement', 'employees', 'settings', 'profile'
    ],
    regional_procurement_manager: [
        'dashboard', 'regional-ops', 'procurement', 'inventory', 'pricing', 'customers', 'profile'
    ],
    regional_merchandising_manager: [
        'dashboard', 'regional-ops', 'pricing', 'inventory', 'sales', 'profile'
    ],
    regional_finance_manager: [
        'dashboard', 'regional-ops', 'finance', 'sales', 'pos', 'profile'
    ],
    regional_hr_manager: [
        'dashboard', 'regional-ops', 'employees', 'profile'
    ],
    regional_logistics_manager: [
        'dashboard', 'regional-ops', 'warehouse', 'inventory', 'procurement', 'employees', 'profile'
    ],
    regional_security_manager: [
        'dashboard', 'regional-ops', 'settings', 'pos', 'inventory', 'sales', 'employees', 'profile'
    ],
    regional_it_manager: [
        'dashboard', 'regional-ops', 'settings', 'employees', 'profile'
    ],
    regional_compliance_manager: [
        'dashboard', 'regional-ops', 'sales', 'inventory', 'pos', 'pricing', 'settings', 'profile'
    ],

    // ═══ LEVEL 6 - FACILITY CAPTAINS (STORE, WAREHOUSE & DISPATCH GMs) ═══
    store_manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'profile'
    ],
    warehouse_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'employees', 'profile'
    ],
    dispatch_manager: [
        'dashboard', 'warehouse', 'inventory', 'employees', 'profile'
    ],

    // ═══ LEVEL 7 - FUNCTIONAL & DEPARTMENT MANAGERS ═══
    warehouse_operations_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement', 'employees', 'profile'
    ],
    transport_fleet_manager: [
        'dashboard', 'warehouse', 'inventory', 'employees', 'profile'
    ],
    assistant_manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'
    ],
    logistics_manager: ['dashboard', 'regional-ops', 'warehouse', 'inventory', 'employees', 'profile'],
    inventory_manager: ['dashboard', 'regional-ops', 'inventory', 'warehouse', 'profile'],
    security_manager: ['dashboard', 'regional-ops', 'settings', 'employees', 'profile'],
    vendor_relations_manager: ['dashboard', 'regional-ops', 'procurement', 'pricing', 'inventory', 'profile'],
    cs_manager: ['dashboard', 'regional-ops', 'customers', 'sales', 'profile'],

    // ═══ LEVEL 8 - SHIFT LEADS, FLOOR SUPERVISORS & TEAM LEADERS ═══
    assistant_store_manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'profile'
    ],
    shift_supervisor: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'],
    shift_lead: [
        'dashboard', 'pos', 'inventory', 'customers', 'profile'
    ],
    store_supervisor: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'],
    receiving_supervisor: ['dashboard', 'inventory', 'procurement', 'employees', 'profile'],
    stock_control_supervisor: ['dashboard', 'inventory', 'employees', 'profile'],
    pos_supervisor: ['dashboard', 'pos', 'sales', 'customers', 'employees', 'profile'],
    inventory_control_supervisor: ['dashboard', 'inventory', 'warehouse', 'employees', 'profile'],
    putaway_replenishment_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    picking_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    packing_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    dispatch_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    inbound_operations_supervisor: ['dashboard', 'warehouse', 'inventory', 'procurement', 'employees', 'profile'],
    outbound_operations_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    returns_waste_supervisor: ['dashboard', 'warehouse', 'inventory', 'customers', 'sales', 'employees', 'profile'],
    fleet_maintenance_supervisor: ['dashboard', 'warehouse', 'inventory', 'employees', 'profile'],
    receiving_team_leader: ['dashboard', 'warehouse', 'inventory', 'procurement', 'profile'],
    picking_team_leader: ['dashboard', 'warehouse', 'inventory', 'profile'],
    packing_team_leader: ['dashboard', 'warehouse', 'inventory', 'profile'],
    dispatch_team_leader: ['dashboard', 'warehouse', 'inventory', 'profile'],
    dispatcher: ['dashboard', 'inventory', 'warehouse', 'profile'],

    // ═══ LEVEL 9 - SPECIALISTS, ANALYSTS & OFFICERS ═══
    merchandising_specialist: ['dashboard', 'regional-ops', 'pricing', 'inventory', 'sales', 'profile'],
    merchandiser: ['dashboard', 'regional-ops', 'inventory', 'pricing', 'profile'],
    inventory_specialist: ['dashboard', 'inventory', 'warehouse', 'profile'],
    it_support: ['dashboard', 'regional-ops', 'settings', 'employees', 'profile'],
    buyer: ['dashboard', 'regional-ops', 'procurement', 'profile'],
    demand_planner: ['dashboard', 'regional-ops', 'inventory', 'procurement', 'sales', 'profile'],
    replenishment_planner: ['dashboard', 'regional-ops', 'inventory', 'warehouse', 'procurement', 'sales', 'profile'],
    payroll_specialist: ['dashboard', 'regional-ops', 'employees', 'finance', 'profile'],
    talent_recruiter: ['dashboard', 'regional-ops', 'employees', 'profile'],
    hr_generalist: ['dashboard', 'regional-ops', 'employees', 'profile'],
    training_coordinator: ['dashboard', 'regional-ops', 'employees', 'profile'],
    treasury_officer: ['dashboard', 'regional-ops', 'finance', 'pos', 'sales', 'profile'],
    tax_compliance_officer: ['dashboard', 'regional-ops', 'finance', 'sales', 'profile'],
    credit_control_officer: ['dashboard', 'regional-ops', 'finance', 'sales', 'customers', 'procurement', 'profile'],
    accountant: ['dashboard', 'regional-ops', 'finance', 'sales', 'procurement', 'profile'],
    customs_import_specialist: ['dashboard', 'regional-ops', 'procurement', 'inventory', 'profile'],
    inbound_qc_inspector: ['dashboard', 'regional-ops', 'procurement', 'warehouse', 'inventory', 'profile'],
    store_operations_auditor: ['dashboard', 'regional-ops', 'pos', 'inventory', 'pricing', 'sales', 'profile'],
    data_analyst: ['dashboard', 'regional-ops', 'sales', 'inventory', 'finance', 'profile'],
    loss_prevention: ['dashboard', 'inventory', 'sales', 'profile'],
    cash_office_officer: ['dashboard', 'pos', 'finance', 'sales', 'profile'],

    // ═══ LEVEL 10 - FRONTLINE EXECUTION STAFF ═══
    cashier: ['dashboard', 'pos', 'profile'],
    sales_associate: ['dashboard', 'pos', 'customers', 'inventory', 'profile'],
    store_associate: ['dashboard', 'pos', 'customers', 'inventory', 'profile'],
    stock_clerk: ['dashboard', 'warehouse', 'inventory', 'profile'],
    picker: ['dashboard', 'warehouse', 'inventory', 'profile'],
    packer: ['dashboard', 'warehouse', 'inventory', 'profile'],
    receiver: ['dashboard', 'warehouse', 'inventory', 'profile'],
    receiving_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    putaway_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    replenishment_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    inventory_controller: ['dashboard', 'warehouse', 'inventory', 'profile'],
    stock_counter: ['dashboard', 'warehouse', 'inventory', 'profile'],
    dispatch_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    returns_operator: ['dashboard', 'warehouse', 'inventory', 'customers', 'profile'],
    returns_clerk: ['dashboard', 'warehouse', 'inventory', 'customers', 'profile'],
    driver: ['dashboard', 'warehouse', 'inventory', 'profile'],
    forklift_operator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    fleet_mechanic: ['dashboard', 'warehouse', 'inventory', 'profile'],
    warehouse_administrator: ['dashboard', 'warehouse', 'inventory', 'profile'],
    customer_service: ['dashboard', 'customers', 'sales', 'profile'],

    // ═══ LEGACY ALIASES (backwards compatibility) ═══
    manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'profile'],
    hr: ['dashboard', 'regional-ops', 'employees', 'profile'],
    pos: ['dashboard', 'pos', 'profile']
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
    if (basePermissions.includes('*') || [
        'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'group_cmo',
        'admin', 'country_managing_director',
        'country_operations_director', 'country_finance_director', 'country_commercial_director',
        'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager',
        'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager',
        'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager',
        'regional_it_manager', 'regional_compliance_manager',
        'head_of_operations',
        'head_of_finance',
        'head_of_hr',
        'head_of_procurement',
        'head_of_supply_chain',
        'head_of_merchandising',
        'head_of_it',
        'head_of_audit',
    ].includes(userRole)) return basePermissions;
    if (!siteType) return basePermissions;

    if (siteType === 'Store') {
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
 * NO WORKER, NOT EVEN HIGH-LEVEL POSITIONS OR REGIONAL OPERATIONS MANAGERS, ARE ALLOWED
 * MULTI-SITE ACCESS EXCEPT THE CEO.
 * THIS IS A HARD SECURITY REQUIREMENT BY THE OWNER.
 * ============================================================================
 */
export function canAccessSite(userRole: UserRole, userSiteId: string, targetSiteId: string): boolean {
    const multiSiteRoles: UserRole[] = ['super_admin', 'group_ceo'];
    if (multiSiteRoles.includes(userRole)) return true;
    return userSiteId === targetSiteId;
}
