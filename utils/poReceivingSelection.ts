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
