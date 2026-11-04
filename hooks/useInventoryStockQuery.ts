import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
export function useInventoryStockQuery(site: string | undefined, country: string, user: string | undefined, page: number, size: number, filters: Record<string, unknown>, sort: { key: string; direction: 'asc' | 'desc' } | null, enabled: boolean) {
 return useQuery({queryKey:['inventory-stock-summary',country,site,user,page,size,filters,sort],
  enabled: enabled && Boolean(user && country),
  queryFn:()=>productsService.getInventory(site,country,size,(page-1)*size,filters,sort||undefined),staleTime:15000});
}
