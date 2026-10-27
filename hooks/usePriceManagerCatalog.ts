import { useQuery } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { priceManagerService, type PriceCatalogInput } from '../services/price-manager.service';

export function usePriceManagerCatalog(input: PriceCatalogInput, enabled: boolean) {
    const { user } = useStore();
    const { activeSite, activeRegionCode, sites } = useData();
    const regionalSiteIds = sites.filter(site => !activeRegionCode || (site.regionCode || site.region_code) === activeRegionCode).map(site => site.id);
    const matchingSiteIds = input.filters?.sites?.length ? input.filters.sites.filter(id => regionalSiteIds.includes(id)) : regionalSiteIds;
    const scopedInput = activeRegionCode ? {
        ...input, filters: { ...input.filters, sites: matchingSiteIds.length ? matchingSiteIds : ['no-matching-regional-sites'] },
    } : input;
    return useQuery({
        queryKey: ['price_manager_catalog', input.country, user?.id, user?.regionCode, activeSite?.id, activeRegionCode, scopedInput],
        queryFn: () => priceManagerService.getPage(scopedInput), enabled: enabled && Boolean(user?.id && input.country),
        staleTime: 15_000,
    });
}
