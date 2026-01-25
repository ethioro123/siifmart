import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/supabase.service';
import { ProductSchema } from '../schemas/inventory.schema';
import { Product } from '../types';

interface UseProductsOptions {
    siteId?: string;
    limit?: number;
    offset?: number;
    sort?: { key: string, direction: 'asc' | 'desc' };
    enabled?: boolean;
}

export function useProductsQuery(options: UseProductsOptions = {}) {
    const { siteId, limit = 5000, offset = 0, sort, enabled = true } = options;

    return useQuery({
        queryKey: ['products', siteId, limit, offset, sort],
        queryFn: async () => {
            const { data } = await productsService.getAll(siteId, limit, offset, undefined, sort);

            if (!data) return [];

            // Accuracy: Validate each product with Zod
            return data.map(raw => {
                const result = ProductSchema.safeParse(raw);
                if (!result.success) {
                    console.warn('⚠️ Product Schema Validation Failed:', {
                        id: raw.id,
                        errors: result.error.format()
                    });
                    // In a strict app, we might throw here. 
                    // For now, we return the raw data but log the issues.
                    return raw as Product;
                }
                return result.data as Product;
            });
        },
        enabled: enabled && !!siteId,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}
