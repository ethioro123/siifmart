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
    'super_admin',      // CEO - sees everything. The ONLY multi-site role.
];

/**
 * Roles that are restricted to their assigned site (Workers)
 * Note: ALL ROLES except super_admin must go here.
 */
const SINGLE_SITE_ROLES: UserRole[] = [
    // Executive / Management (but still restricted to home base unless CEO)
    'regional_manager',
    'operations_manager',
    'finance_manager',
    'hr_manager',
    'procurement_manager',
    'supply_chain_manager',
    'admin',
    'hr',
    'cs_manager',
    'it_support',
    'auditor',

    // Warehouse workers
    'warehouse_manager',
    'dispatcher',
    'picker',
    'driver',
    'inventory_specialist',

    // Store workers
    'manager',
    'shift_lead',
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
