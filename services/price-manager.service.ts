import { supabase } from '../lib/supabase';
import { _mapProduct } from './products/products-helpers';
import type { Product } from '../types';
import type { MerchandisingFilters } from '../components/merchandising/MerchandisingContext';

export interface PriceCatalogInput {
    country: string; search?: string; filters?: Partial<MerchandisingFilters> & { sku?: string };
    sort?: { key: string; direction: 'asc' | 'desc' }; page?: number; pageSize?: number;
}
export const priceManagerService = {
    async getPage(input: PriceCatalogInput): Promise<{ data: Product[]; count: number }> {
        const pageSize = Math.max(1, Math.min(input.pageSize || 25, 100));
        const { data, error } = await supabase.rpc('search_price_manager_products', {
            p_country: input.country.toUpperCase(), p_filters: input.filters || {}, p_search: input.search || '',
            p_sort: input.sort?.key || 'name', p_direction: input.sort?.direction || 'asc',
            p_limit: pageSize, p_offset: Math.max(0, (input.page || 1) - 1) * pageSize,
        });
        if (error) throw error;
        return { data: (data?.data || []).map(_mapProduct), count: data?.count || 0 };
    },
    async getSkuTargets(country: string, sku: string, siteIds?: string[]): Promise<Product[]> {
        if (siteIds && siteIds.length === 0) throw new Error('Select at least one location.');
        const targets: Product[] = [];
        let page = 1;
        while (true) {
            const result = await this.getPage({ country, filters: { sku, sites: siteIds || [] }, page, pageSize: 100 });
            targets.push(...result.data);
            if (targets.length >= result.count || result.data.length === 0) break;
            page++;
        }
        return targets;
    },
};
