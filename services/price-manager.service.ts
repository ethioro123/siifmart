import { supabase } from '../lib/supabase';
import { _mapProduct } from './products/products-helpers';
import { salesService } from './sales.service';
import { buildCatalogSalesMetricsIndex } from '../utils/merchandisingAnalytics';
import type { Product, SaleRecord } from '../types';
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
    async getRuleSalesMetrics(products: Product[], country: string) {
        const records: SaleRecord[] = [];
        const startDate = new Date(Date.now() - 30 * 86400000).toISOString();
        const siteIds = [...new Set(products.map(product => product.siteId || product.site_id))];
        for (const siteId of siteIds) {
            if (!siteId) throw new Error('A product location is required to evaluate sales.');
            let complete = false;
            for (let offset = 0; offset < 20000; offset += 250) {
                const page = await salesService.getAll(siteId, 250, offset, {
                    forecast: true, startDate, status: 'Completed', includeItems: true, countryCode: country,
                });
                records.push(...page.data);
                if (offset + page.data.length >= page.count) { complete = true; break; }
                if (!page.data.length) throw new Error('Sales changed while loading. Retry the preview.');
            }
            if (!complete) throw new Error('Sales analysis is too large. Narrow the location scope.');
        }
        return buildCatalogSalesMetricsIndex(products, records);
    },
    async getSkuTargets(country: string, sku: string, siteIds?: string[]): Promise<Product[]> {
        if (siteIds && siteIds.length === 0) throw new Error('Select at least one location.');
        return this.getMatchingTargets(country, { sku, sites: siteIds || [] });
    },
    async getMatchingTargets(country: string, filters: PriceCatalogInput['filters']): Promise<Product[]> {
        const targets: Product[] = [];
        let page = 1;
        while (true) {
            const result = await this.getPage({ country, filters, page, pageSize: 100 });
            targets.push(...result.data);
            if (targets.length >= result.count || result.data.length === 0) break;
            page++;
        }
        return targets;
    },
};
