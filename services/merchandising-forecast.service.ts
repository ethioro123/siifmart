import { supabase } from '../lib/supabase';
import { productsService } from './products.service';
import { salesService } from './sales.service';
import { purchaseOrdersService } from './purchase-orders.service';
import type { Product, PurchaseOrder, SaleRecord } from '../types';
import type { TransferRecord } from '../types/infrastructure';

/** Every page must succeed. Never substitute an incomplete cache for forecast evidence. */
export async function collectForecastPages<T>(read: (offset: number, limit: number) => Promise<{ data: T[]; count: number }>): Promise<T[]> {
    const result: T[] = [];
    const size = 250;
    for (let offset = 0; offset < 20000; offset += size) {
        const page = await read(offset, size);
        result.push(...page.data);
        if (result.length >= page.count) return result;
        if (!page.data.length) throw new Error('Forecast dataset changed while loading. Refresh to retry.');
    }
    throw new Error('Forecast exceeds the supported analysis size. Narrow the location scope.');
}

export const merchandisingForecastService = {
    async get(siteId: string, country: string) {
        if (!siteId || siteId === 'All' || !country) throw new Error('Select a location to evaluate demand.');
        const { data: site, error } = await supabase.from('sites').select('id,country').eq('id', siteId).eq('country', country).single();
        if (error) throw error;
        if (!site) throw new Error('Location is unavailable in the selected country.');
        const asOf = new Date().toISOString();
        const start = new Date(Date.parse(asOf) - 30 * 86400000).toISOString();
        const [products, sales30d, openPOs, openTransfers] = await Promise.all([
            collectForecastPages<Product>((offset, limit) => productsService.getAll(siteId, limit, offset, undefined, { key: 'id', direction: 'asc' })),
            collectForecastPages<SaleRecord>((offset, limit) => salesService.getAll(siteId, limit, offset, {
                startDate: start, status: 'Completed', includeItems: true, countryCode: country,
            })),
            collectForecastPages<PurchaseOrder>((offset, limit) => purchaseOrdersService.getAll(siteId, limit, offset, { includeItems: true, countryCode: country })),
            collectForecastPages<TransferRecord>(async (offset, limit) => {
                const { data, count, error: transferError } = await supabase.from('transfers')
                    .select('id,dest_site_id,status,transfer_status,items,country_code', { count: 'exact' })
                    .eq('dest_site_id', siteId).eq('country_code', country)
                    .order('id').range(offset, offset + limit - 1);
                if (transferError) throw transferError;
                return { count: count || 0, data: (data || []).map(row => ({
                    id: row.id, destSiteId: row.dest_site_id, status: row.transfer_status || row.status,
                    items: row.items, countryCode: row.country_code,
                } as TransferRecord)) };
            }),
        ]);
        return { products, sales30d, openPOs, openTransfers, asOf, start };
    },
};
