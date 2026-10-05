import { Country } from '../types';

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
    user: { role?: string; title?: string; siteId?: string; id?: string; employeeId?: string } | null | undefined,
    sites: Array<{ id: string; country?: string; currency?: string }>,
    employees?: Array<{ id: string; siteId?: string; site_id?: string; country?: string }>
): Country {
    if (!user) return 'ET';
    
    // 1. Look up site and country from employee profile
    let targetSiteId = user.siteId;
    if (employees && employees.length > 0) {
        const emp = employees.find(e => e.id === user.employeeId || e.id === user.id);
        if (emp) {
            if (emp.country) return emp.country as Country;
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
