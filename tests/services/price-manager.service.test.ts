import { beforeEach, describe, expect, it, vi } from 'vitest';
import { priceManagerService } from '../../services/price-manager.service';
import { supabase } from '../../lib/supabase';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
describe('Price Manager server catalog', () => {
    beforeEach(() => vi.clearAllMocks());
    it('scopes searches and sorting on the server with bounded pages', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { data: [{ id: 'p', site_id: 'site', cost_price: 70 }], count: 101 }, error: null } as never);
        const result = await priceManagerService.getPage({ country: 'et', page: 2, pageSize: 250, search: 'diaper', filters: { sites: ['site'] }, sort: { key: 'margin', direction: 'desc' } });
        expect(supabase.rpc).toHaveBeenCalledWith('search_price_manager_products', expect.objectContaining({ p_country: 'ET', p_limit: 100, p_offset: 100, p_search: 'diaper', p_filters: { sites: ['site'] }, p_sort: 'margin', p_direction: 'desc' }));
        expect(result.count).toBe(101); expect(result.data[0].costPrice).toBe(70);
    });
    it('requests grouping before server pagination and preserves aggregate metadata', async () => {
        const summary = { locationCount: 100, recordCount: 103, minPrice: 80, maxPrice: 100 };
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { data: [{ id: 'representative', sku: 'SKU', price_group: summary }], count: 1 }, error: null } as never);
        const result = await priceManagerService.getPage({ country: 'ET', grouped: true, filters: { sites: ['site'] } });
        expect(supabase.rpc).toHaveBeenCalledWith('search_price_manager_products', expect.objectContaining({ p_filters: { sites: ['site'], groupBySku: true }, p_limit: 25 }));
        expect(result.data).toHaveLength(1); expect(result.count).toBe(1);
        expect(result.data[0]).toHaveProperty('price_group', summary);
    });
    it('expands a selected product to matching location records without grouped writes', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { data: [{ id: 'location-a', site_id: 'a', sku: 'SKU' }, { id: 'location-b', site_id: 'b', sku: 'SKU' }], count: 2 }, error: null } as never);
        const records = await priceManagerService.getGroupTargets('ET', [{ id: 'representative', sku: 'SKU' }] as never, { sites: ['a', 'b'], onSale: true });
        expect(records.map(record => record.id)).toEqual(['location-a', 'location-b']);
        expect(supabase.rpc).toHaveBeenCalledWith('search_price_manager_products', expect.objectContaining({ p_filters: { sku: 'SKU', sites: ['a', 'b'], onSale: true } }));
    });
    it('loads every authorized SKU target beyond the first page without inventing costs', async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { data: [{ id: 'a', cost_price: null }], count: 2 }, error: null } as never)
            .mockResolvedValueOnce({ data: { data: [{ id: 'b', cost_price: 80 }], count: 2 }, error: null } as never);
        const targets = await priceManagerService.getSkuTargets('ET', 'SKU', ['site']);
        expect(targets.map(p => p.id)).toEqual(['a', 'b']); expect(targets[0].costPrice).toBeUndefined();
        expect(vi.mocked(supabase.rpc).mock.calls[1][1]).toMatchObject({ p_offset: 100, p_filters: { sku: 'SKU', sites: ['site'] } });
    });
    it('propagates read failures instead of presenting an empty successful catalog', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Denied' } } as never);
        await expect(priceManagerService.getPage({ country: 'ET' })).rejects.toMatchObject({ message: 'Denied' });
    });
});
