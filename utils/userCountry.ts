import { Country } from '../types';
import { isCorporateHqDirectorateRole, isSharedHqRegionalRole } from './roleSegregation';

/**
 * Check if user is CEO / Super Admin who can access and switch between both country instances.
 * Branch managers and regular staff are strictly locked to their single country.
 */
export function canSwitchCountry(user: { role?: string; title?: string } | null | undefined): boolean {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    const title = (user.title || '').toLowerCase();
    return role === 'ceo' || role === 'super_admin' || title === 'ceo' || title.includes('chief executive');
}

/**
 * Resolve effective country for non-CEO staff based on assigned site / employee record.
 * Defaults all existing/unassigned data to 'ET' (Ethiopia).
 */
export function getUserCountry(
    user: { role?: string; title?: string; siteId?: string; id?: string; employeeId?: string; code?: string; email?: string } | null | undefined,
    sites: Array<{ id: string; country?: string; currency?: string }>,
    employees?: Array<{ id: string; siteId?: string; site_id?: string; country?: string; code?: string; email?: string }>
): Country {
    if (!user) return 'ET';

    // 0. Sovereign country prefix detection (immune to asynchronous site fetch latency)
    const userCode = user.code?.toUpperCase();
    const userEmail = (user as any).email?.toLowerCase();
    if (userCode?.startsWith('KE-') || userEmail?.startsWith('ke-')) return 'KE';
    if (userCode?.startsWith('ET-') || userEmail?.startsWith('et-')) return 'ET';
    if (userCode?.startsWith('UG-') || userEmail?.startsWith('ug-')) return 'UG';
    if (userCode?.startsWith('RW-') || userEmail?.startsWith('rw-')) return 'RW';
    if (userCode?.startsWith('TZ-') || userEmail?.startsWith('tz-')) return 'TZ';
    
    // 1. Look up site and country from employee profile
    let targetSiteId = user.siteId;
    if (employees && employees.length > 0) {
        const emp = employees.find(e => e.id === user.employeeId || e.id === user.id);
        if (emp) {
            if (emp.country) return emp.country as Country;
            const empCode = emp.code?.toUpperCase();
            const empEmail = emp.email?.toLowerCase();
            if (empCode?.startsWith('KE-') || empEmail?.startsWith('ke-')) return 'KE';
            if (empCode?.startsWith('ET-') || empEmail?.startsWith('et-')) return 'ET';
            targetSiteId = targetSiteId || emp.siteId || emp.site_id;
        }
    }

    // 2. Look up site assigned to user/employee
    if (targetSiteId && sites && sites.length > 0) {
        const site = sites.find(s => s.id === targetSiteId || (s as any).code === targetSiteId);
        if (site) {
            if (site.country) return site.country as Country;
            if (site.currency === 'KES' || site.currency === 'KSh') return 'KE';
            if (site.currency === 'UGX' || site.currency === 'USh') return 'UG';
            if (site.currency === 'RWF') return 'RW';
            if (site.currency === 'TZS' || site.currency === 'TSh') return 'TZ';
        }
    }

    // Baseline rule: All existing/unassigned employees and sites belong to Ethiopia
    return 'ET';
}

/**
 * Check if user is an HQ Executive / Administrator who can switch regional lenses.
 * Regional managers, regional leads, and regional-scoped shared roles are locked to their own region.
 */
export function canSwitchRegion(
    user: { role?: string; title?: string; regionCode?: string; region_code?: string; scopeLevel?: string; scope_level?: string; siteId?: string; id?: string; employeeId?: string } | null | undefined,
    sites?: Array<{ id: string; regionCode?: string; region_code?: string; code?: string }>,
    employees?: Array<{ id: string; regionCode?: string; region_code?: string; scopeLevel?: string; scope_level?: string; siteId?: string; site_id?: string; role?: string }>
): boolean {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    const title = (user.title || '').toLowerCase();

    // 1. Level 1 & Level 2 Corporate HQ Directorate roles always have country-wide regional lens switching
    if (
        isCorporateHqDirectorateRole(role) ||
        title.includes('ceo') ||
        title.includes('chief executive') ||
        title.includes('managing director') ||
        title.includes('head of')
    ) {
        return true;
    }

    // 2. Shared general roles (Accountants, Buyers, HR, IT Support, Auditors, Planners, etc.)
    // can switch regional lenses ONLY when assigned to Corporate HQ (no regional lock).
    // When assigned to Regional Administration or a facility in a region, they are locked to that region.
    if (isSharedHqRegionalRole(role)) {
        const emp = employees?.find(e => e.id === user.employeeId || e.id === user.id);
        const explicitScope = user.scopeLevel || user.scope_level || emp?.scopeLevel || emp?.scope_level;
        if (explicitScope === 'REGIONAL') return false;

        const hasDirectRegion = Boolean(
            user.regionCode || user.region_code || emp?.regionCode || emp?.region_code
        );
        if (hasDirectRegion) return false;

        const siteId = user.siteId || emp?.siteId || emp?.site_id;
        if (siteId && sites && sites.length > 0) {
            const site = sites.find(s => s.id === siteId || s.code === siteId);
            if (site?.regionCode || site?.region_code) return false;
        }

        return true;
    }

    return false;
}

/**
 * Resolve user's regional lock. HQ Executive roles with country-wide authority return null.
 * Regional and branch floor staff are locked to their region or site's region.
 */
export function getUserRegion(
    user: { role?: string; title?: string; regionCode?: string; region_code?: string; scopeLevel?: string; scope_level?: string; siteId?: string; id?: string; employeeId?: string } | null | undefined,
    sites?: Array<{ id: string; regionCode?: string; region_code?: string; code?: string }>,
    employees?: Array<{ id: string; regionCode?: string; region_code?: string; scopeLevel?: string; scope_level?: string; siteId?: string; site_id?: string; role?: string }>
): string | null {
    if (!user) return null;

    // HQ Executive & HQ-scoped shared roles have country-wide authority and are never locked to a single region
    if (canSwitchRegion(user, sites, employees)) return null;

    const emp = employees?.find(e => e.id === user.employeeId || e.id === user.id);

    // 1. Employee profile region_code
    const empRegion = emp?.regionCode || emp?.region_code;
    if (empRegion) return empRegion;

    // 2. Direct property on user object
    const userRegion = user.regionCode || user.region_code;
    if (userRegion) return userRegion;

    // 3. Fallback to user's assigned site's region
    const siteId = user.siteId || emp?.siteId || emp?.site_id;
    if (siteId && sites && sites.length > 0) {
        const site = sites.find(s => s.id === siteId || s.code === siteId);
        const siteRegion = site?.regionCode || site?.region_code;
        if (siteRegion) return siteRegion;
    }

    return null;
}

