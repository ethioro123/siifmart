import type { Site, User } from '../types';
export interface StoreAllocation { storeId: string; quantity: number }
const ZONE_OVERRIDE_ROLES = new Set(['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_supply_chain_director']);
/** Candidate destinations only; the transfer service still enforces authorization when saving. */
export function eligibleDistributionStores(sites: Site[], source: Site | undefined, enforceZoning: boolean, role?: User['role']): Site[] {
    if (!source?.country) return [];
    const sourceCountry = source.country.toUpperCase();
    return sites.filter(site => site.type === 'Store' && site.id !== source.id &&
        site.country?.toUpperCase() === sourceCountry &&
        (!site.status || site.status.toLowerCase() === 'active') &&
        (!enforceZoning || ZONE_OVERRIDE_ROLES.has(role || '') || (site.logisticsZoneId || '') === (source.logisticsZoneId || '')));
}
/** Deselection removes the allocation and its quantity; reselection always starts at zero. */
export function toggleDistributionStore(allocations: StoreAllocation[], storeId: string, selected: boolean): StoreAllocation[] {
    if (!selected) return allocations.filter(a => a.storeId !== storeId);
    return allocations.some(a => a.storeId === storeId) ? allocations : [...allocations, { storeId, quantity: 0 }];
}
