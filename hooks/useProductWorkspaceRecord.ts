import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { useStore } from '../contexts/CentralStore';
import type { Product } from '../types';
export function useProductWorkspaceRecord(product: Product | null, country: string, open: boolean) {
    const { user } = useStore();
    const site = product?.siteId || product?.site_id || '';
    return useQuery({ queryKey: ['product_workspace_record', country, site, user?.id, product?.id],
        enabled: open && Boolean(user?.id && product?.id && site),
        queryFn: () => productsService.getById(product!.id, site), initialData: product || undefined, initialDataUpdatedAt: 0, staleTime: 15_000,
    });
}
