/**
 * Location-Based Access Control (LBAC)
 * Simple business logic: Products and employees are tied to siteId
 */

import { UserRole } from '../types';

/**
 * Roles that can access multiple sites (HQ/Management)
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
const MULTI_SITE_ROLES: UserRole[] = [
    'super_admin',
    'country_managing_director',
    'admin',
    'head_of_operations',
    'operations_head',
    'operations_manager',
    'head_of_supply_chain',
    'supply_chain_head',
    'supply_chain_manager',
    'head_of_finance',
    'finance_head',
    'finance_manager',
    'head_of_hr',
    'hr_head',
    'hr_manager',
    'head_of_procurement',
    'procurement_head',
    'procurement_manager',
    'head_of_merchandising',
    'merchandising_head',
    'merchandising_manager',
    'head_of_audit',
    'audit_head',
    'auditor',
    'head_of_it',
    'it_head',
    'it_support',
    'regional_manager'
];

/**
 * Roles that are restricted to their assigned site (Frontline Branch Workers)
 */
const SINGLE_SITE_ROLES: UserRole[] = [
    // Warehouse workers
    'warehouse_manager',
    'dispatcher',
    'dispatch_manager',
    'picker',
    'packer',
    'receiver',
    'driver',
    'forklift_operator',
    'inventory_specialist',
    'stock_clerk',
    'returns_clerk',

    // Store workers
    'store_manager',
    'assistant_manager',
    'shift_lead',
    'store_supervisor',
    'cashier',
    'sales_associate',
    'pos'
];

/**
 * Check if a role can access multiple sites
 */
export function isMultiSiteRole(role: UserRole): boolean {
    return MULTI_SITE_ROLES.includes(role);
}

/**
 * Check if a role is restricted to a single site
 */
export function isSingleSiteRole(role: UserRole): boolean {
    return SINGLE_SITE_ROLES.includes(role);
}

/**
 * Check if user can access data from a specific site
 * Simple rule: Multi-site roles see all, single-site roles see only their site
 */
export function canAccessSite(userRole: UserRole, userSiteId: string, dataSiteId: string): boolean {
    // Multi-site roles can access all sites
    if (isMultiSiteRole(userRole)) {
        return true;
    }

    // Single-site roles can only access their own site
    return userSiteId === dataSiteId;
}

/**
 * Filter array of items by site access
 * Simple business logic: Filter by siteId
 */
export function filterBySite<T extends { siteId?: string; site_id?: string; destSiteId?: string; dest_site_id?: string }>(
    items: T[],
    userRole: UserRole,
    userSiteId: string
): T[] {
    // Multi-site roles see everything
    if (isMultiSiteRole(userRole)) {
        return items;
    }

    // Single-site roles see only their site (as source OR destination)
    return items.filter(item => {
        const itemSiteId = item.siteId || item.site_id;
        const itemDestSiteId = item.destSiteId || item.dest_site_id;
        return itemSiteId === userSiteId || itemDestSiteId === userSiteId;
    });
}

/**
 * Get user's accessible site IDs
 */
export function getAccessibleSiteIds(userRole: UserRole, userSiteId: string, allSiteIds: string[]): string[] {
    // Multi-site roles can access all sites
    if (isMultiSiteRole(userRole)) {
        return allSiteIds;
    }

    // Single-site roles can only access their site
    return [userSiteId];
}

/**
 * Check if user should see site selector in UI
 */
export function shouldShowSiteSelector(userRole: UserRole): boolean {
    return isMultiSiteRole(userRole);
}
