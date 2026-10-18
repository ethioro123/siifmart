import { UserRole } from '../types';
import { RoleSegregationRule, ROLE_SEGREGATION_RULES } from './roleSegregationRules';

export type { RoleSegregationRule };
export { ROLE_SEGREGATION_RULES };

export const REGIONAL_WORKFORCE_ROLES = [
    'regional_manager',
    'regional_procurement_lead',
    'regional_finance_officer',
    'regional_hr_officer',
    'regional_logistics_lead',
    'regional_security_supervisor'
] as const;

export function isRegionalWorkforceRole(role?: string | null): boolean {
    return REGIONAL_WORKFORCE_ROLES.includes(
        (role || '').trim().toLowerCase() as typeof REGIONAL_WORKFORCE_ROLES[number]
    );
}

export function resolveEmployeeScopeLevel(
    role?: string | null,
    siteRegionCode?: string | null
): 'HQ' | 'REGIONAL' {
    if (isRegionalWorkforceRole(role)) return 'REGIONAL';

    const normalizedRole = (role || '').trim().toLowerCase();
    if (['super_admin', 'ceo', 'admin', 'operations_manager'].includes(normalizedRole)) {
        return 'HQ';
    }

    return siteRegionCode ? 'REGIONAL' : 'HQ';
}

export function isHqFacilitySite(
    site?: { code?: string; name?: string; type?: string; regionCode?: string; region_code?: string } | null
): boolean {
    if (!site) return false;
    const code = (site.code || '').trim().toUpperCase();
    if (code.endsWith('-HQ') || code === 'HQ' || code === 'HQ-GLOBAL') return true;
    const nameLower = (site.name || '').trim().toLowerCase();
    if (nameLower.includes('regional')) return false;
    if (/^(ET|KE)-(ADD|NRB|ORO|AMH|TIG|SOM|SID|MSA|KSM|NAK)$/.test(code)) return false;
    const hasRegion = Boolean(site.regionCode || site.region_code);
    return !hasRegion && ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations'].includes(site.type || '');
}

export function isRegionalAdminFacilitySite(
    site?: { code?: string; name?: string; type?: string; regionCode?: string; region_code?: string } | null
): boolean {
    if (!site || isHqFacilitySite(site)) return false;
    const isAdminType = ['Administration', 'Administrative', 'Regional Administration'].includes(site.type || '');
    if (!isAdminType) return false;
    const hasRegion = Boolean(site.regionCode || site.region_code);
    const nameLower = (site.name || '').trim().toLowerCase();
    const code = (site.code || '').trim().toUpperCase();
    return hasRegion || nameLower.includes('regional') || /^(ET|KE)-[A-Z]{3}$/.test(code);
}

export function isOperationFacilitySite(
    site?: { code?: string; name?: string; type?: string; regionCode?: string; region_code?: string } | null
): boolean {
    if (!site || isHqFacilitySite(site) || isRegionalAdminFacilitySite(site)) return false;
    return ['Store', 'Warehouse', 'Distribution Center', 'Dark Store', 'Online Store'].includes(site.type || '');
}

export function isFacilityTierOrTypeFilter(filterSite?: string): boolean {
    if (!filterSite) return false;
    return filterSite.startsWith('TIER:') || filterSite.startsWith('TYPE:');
}

export function matchesFacilityFilter(
    site: { id: string; code?: string; name?: string; type?: string; regionCode?: string; region_code?: string },
    filterSite: string
): boolean {
    if (!filterSite || filterSite === 'All') return true;
    if (filterSite === 'TIER:HQ') return isHqFacilitySite(site);
    if (filterSite === 'TIER:REGIONAL') return isRegionalAdminFacilitySite(site);
    if (filterSite === 'TIER:OPS' || filterSite === 'TIER:OPERATIONS') return isOperationFacilitySite(site);
    if (filterSite === 'TYPE:Store') return site.type === 'Store';
    if (filterSite === 'TYPE:Warehouse') return site.type === 'Warehouse';
    if (filterSite === 'TYPE:Distribution Center') return site.type === 'Distribution Center';
    if (filterSite === 'TYPE:Online Store') return site.type === 'Dark Store' || site.type === 'Online Store';
    return site.id === filterSite;
}

/**
 * AUTOMATIC ROLE SEGREGATION SYSTEM
 * 
 * This utility ensures employees are automatically assigned to the correct site
 * based on their role when they are hired/created.
 */

/**
 * Get the required site type for a given role
 */
export function getRequiredSiteType(role: UserRole): 'Administration' | 'Warehouse' | 'Store' | 'Any' {
    const rule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
    return rule?.siteType || 'Any';
}

/**
 * Get the recommended department for a given role
 */
export function getRecommendedDepartment(role: UserRole): string {
    const rule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
    return rule?.department || 'Management';
}

/**
 * Get the description for a role's location requirements
 */
export function getRoleLocationDescription(role: UserRole): string {
    const rule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
    return rule?.description || 'No specific location requirement';
}

/**
 * Check if a role can be assigned to a specific site type
 */
export function canRoleBeAtSiteType(role: UserRole, siteType: string): boolean {
    const requiredType = getRequiredSiteType(role);

    if (requiredType === 'Any') return true;

    // Normalize site types
    const normalizedSiteType = normalizeSiteType(siteType);

    return requiredType === normalizedSiteType;
}

/**
 * Normalize site type names to standard categories
 */
function normalizeSiteType(siteType: string): 'Administration' | 'Warehouse' | 'Store' | 'Any' {
    const lower = siteType.toLowerCase();

    // Check for HQ/Headquarters/Administrative/Administration/Central Operations
    if (lower === 'hq' || lower.includes('headquarters') || lower.includes('admin') || lower.includes('central operations')) {
        return 'Administration';
    }

    if (lower.includes('warehouse') || lower.includes('logistics') || lower.includes('storage') || lower.includes('distribution center')) {
        return 'Warehouse';
    }

    if (lower.includes('store') || lower.includes('retail') || lower.includes('market') || lower.includes('grocery') || lower.includes('dark store')) {
        return 'Store';
    }

    return 'Any';
}

/**
 * Get validation message if role-site assignment is invalid
 */
export function validateRoleSiteAssignment(role: UserRole, siteType: string): string | null {
    const requiredType = getRequiredSiteType(role);
    const normalizedSiteType = normalizeSiteType(siteType);

    if (requiredType === 'Any') return null;

    if (requiredType !== normalizedSiteType) {
        const roleRule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
        return `⚠️ Role Segregation Error:\n\n${roleRule?.description || role} must be assigned to a ${requiredType} location.\n\nCurrent site type: ${siteType}\nRequired site type: ${requiredType}`;
    }

    return null;
}

/**
 * Get all roles that can be assigned to a specific site type
 */
export function getRolesForSiteType(siteType: string): UserRole[] {
    const normalizedType = normalizeSiteType(siteType);

    return ROLE_SEGREGATION_RULES
        .filter(rule => rule.siteType === normalizedType || rule.siteType === 'Any')
        .map(rule => rule.role);
}

/**
 * Get role segregation summary for display
 */
export function getRoleSegregationSummary(): {
    hqRoles: UserRole[];
    warehouseRoles: UserRole[];
    storeRoles: UserRole[];
    flexibleRoles: UserRole[];
} {
    return {
        hqRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Administration').map(r => r.role),
        warehouseRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Warehouse').map(r => r.role),
        storeRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Store').map(r => r.role),
        flexibleRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Any').map(r => r.role)
    };
}

/**
 * Auto-select the correct site for a role
 * Returns the site ID that matches the role's requirements
 */
export function autoSelectSiteForRole(
    role: UserRole,
    sites: Array<{ id: string; name: string; type: string }>
): string | null {
    const requiredType = getRequiredSiteType(role);

    if (requiredType === 'Any') {
        // For flexible roles, we should return null so it doesn't 
        // forcibly overwrite the user's previously selected site!
        return null;
    }

    // Find a site that matches the required type
    const matchingSite = sites.find(site => {
        const normalizedType = normalizeSiteType(site.type);
        return normalizedType === requiredType;
    });

    return matchingSite?.id || null;
}

/**
 * Validate that an employee assignment respects the creator's regional boundary
 */
export function validateRegionalBoundary(
    creatorRole: string | undefined,
    creatorRegionCode: string | undefined,
    targetSite: { regionCode?: string; region_code?: string } | undefined
): string | null {
    if (!creatorRole || !creatorRegionCode) return null;
    const isRegional = isRegionalWorkforceRole(creatorRole);
    if (!isRegional) return null;

    if (!targetSite) {
        return `Regional Boundary Error: Target facility not found. You can only assign staff to a facility within your region (${creatorRegionCode}).`;
    }

    const siteRegion = targetSite.regionCode || targetSite.region_code;
    if (siteRegion && siteRegion !== creatorRegionCode) {
        return `Regional Boundary Error: Unauthorized facility assignment. You are restricted to region "${creatorRegionCode}", but the chosen facility belongs to "${siteRegion}".`;
    }

    return null;
}
