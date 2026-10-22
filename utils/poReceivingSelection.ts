/** Preserve explicit destinations; otherwise default only to the user's own eligible hub. */
export function resolvePOReceivingSelection(
    eligibleSites: readonly { id: string }[],
    userSiteId?: string,
    savedSiteIds?: readonly string[]
): string[] {
    const eligibleIds = new Set(eligibleSites.map(site => site.id));
    if (savedSiteIds?.length) return savedSiteIds.filter(id => eligibleIds.has(id));
    return userSiteId && eligibleIds.has(userSiteId) ? [userSiteId] : [];
}

/** Describe the receiving facilities' regions without substituting a country/HQ label. */
export function getPOReceivingRegionLabel(sites: readonly {
    region?: string; regionCode?: string; region_code?: string;
}[], assignedRegionCode?: string | null): string {
    if (assignedRegionCode) {
        const assignedSite = sites.find(site => (site.regionCode || site.region_code) === assignedRegionCode);
        return assignedSite?.region || assignedRegionCode;
    }
    const regions = new Map<string, string>();
    for (const site of sites) {
        const code = site.regionCode || site.region_code;
        const label = site.region || code;
        if (label) regions.set(code || label, label);
    }
    return regions.size > 1 ? 'Multiple regions' : [...regions.values()][0] || '';
}
