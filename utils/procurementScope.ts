import { isHqFacilitySite, isRegionalAdminFacilitySite } from './roleSegregation';

interface ProcurementActor {
    role?: string;
    siteId?: string;
    site_id?: string;
    regionCode?: string;
    region_code?: string;
    scopeLevel?: string;
    scope_level?: string;
}
interface ProcurementSite {
    id: string;
    code?: string;
    name?: string;
    type?: string;
    country?: string;
    regionCode?: string;
    region_code?: string;
}

/** Assignment defines the maximum scope; a missing assignment never widens it. */
export function getProcurementScope(actor: ProcurementActor | null | undefined, sites: readonly ProcurementSite[]) {
    const siteId = actor?.siteId || actor?.site_id;
    const home = sites.find(site => site.id === siteId);
    const regionCode = actor?.regionCode || actor?.region_code || null;
    const role = actor?.role || '';
    const kind = role.startsWith('group_') ? 'global'
        : !home ? 'none'
        : isHqFacilitySite(home) && !regionCode && !role.startsWith('regional_') && (actor?.scopeLevel || actor?.scope_level) !== 'REGIONAL' ? 'country'
        : isRegionalAdminFacilitySite(home) && regionCode && regionCode === (home.regionCode || home.region_code) ? 'regional'
        : ['Store', 'Warehouse', 'Distribution Center'].includes(home.type || '') ? 'site' : 'none';
    return { kind, regionCode, siteId, country: home?.country };
}

export function filterProcurementSites<T extends ProcurementSite>(
    sites: readonly T[], country: string, scope: ReturnType<typeof getProcurementScope>
): T[] {
    return sites.filter(site => site.country === country && (
        scope.kind === 'global' || (scope.country === country && (
            scope.kind === 'country' ||
            (scope.kind === 'regional' && (site.regionCode || site.region_code) === scope.regionCode) ||
            (scope.kind === 'site' && site.id === scope.siteId)
        ))
    ));
}
