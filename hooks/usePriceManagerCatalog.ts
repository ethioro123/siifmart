import { useQuery } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { priceManagerService, type PriceCatalogInput } from '../services/price-manager.service';

export function usePriceManagerCatalog(input: PriceCatalogInput, enabled: boolean) {
    const { user } = useStore();
    const { activeSite } = useData();
    return useQuery({
        queryKey: ['price_manager_catalog', input.country, user?.id, user?.regionCode, activeSite?.id, input],
        queryFn: () => priceManagerService.getPage(input), enabled: enabled && Boolean(user?.id && input.country),
        staleTime: 15_000,
    });
}
