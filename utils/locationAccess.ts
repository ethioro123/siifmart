/**
 * Location-Based Access Control (LBAC)
 * Simple business logic: Products and employees are tied to siteId
 */

import { UserRole } from '../types';

/**
 * Roles that can access multiple sites (HQ/Management)
 */
const MULTI_SITE_ROLES: UserRole[] = [
    'super_admin',      // CEO - sees everything
    'procurement_manager', // Centralized purchasing
    'auditor',          // Compliance oversight
    'finance_manager',  // Financial oversight
    'hr',               // HR management
    'it_support',       // Technical support
    'cs_manager'        // Customer service oversight
];

/**
 * Roles that are restricted to their assigned site (Workers)
 */
const SINGLE_SITE_ROLES: UserRole[] = [
    // Warehouse workers
    'warehouse_manager',
    'dispatcher',
    'picker',
    'driver',
    'inventory_specialist',

    // Store workers
    'manager',
    'store_supervisor',
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
export function filterBySite<T extends { siteId?: string; site_id?: string }>(
    items: T[],
    userRole: UserRole,
    userSiteId: string
): T[] {
    // Multi-site roles see everything
    if (isMultiSiteRole(userRole)) {
        return items;
    }

    // Single-site roles see only their site
    return items.filter(item => {
        const itemSiteId = item.siteId || item.site_id;
        return itemSiteId === userSiteId;
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
