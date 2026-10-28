import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../types';
const { getAll } = vi.hoisted(() => ({ getAll: vi.fn() }));
vi.mock('../../services/sales.service', () => ({ salesService: { getAll } }));
vi.mock('../../lib/supabase', () => ({ supabase: {} }));
import { priceManagerService } from '../../services/price-manager.service';
const product = { id: 'p', sku: 'ET-COFFEE', siteId: 's', price: 100, stock: 5 } as Product;
describe('Smart Rules sales coverage', () => {
    beforeEach(() => { getAll.mockReset(); vi.restoreAllMocks(); });
    it('requests completed country/site-scoped sales with items and accepts verified zero sales', async () => {
        getAll.mockResolvedValue({ data: [], count: 0 });
        const result = await priceManagerService.getRuleSalesMetrics([product], 'ET');
        expect(getAll).toHaveBeenCalledWith('s', 250, 0, expect.objectContaining({ countryCode: 'ET', includeItems: true, status: 'Completed' }));
        expect(result.get('p')?.unitsSold30d).toBe(0);
    });
    it('fails instead of evaluating an incomplete sales dataset', async () => {
        getAll.mockResolvedValue({ data: [], count: 10 });
        await expect(priceManagerService.getRuleSalesMetrics([product], 'ET')).rejects.toThrow('Sales changed');
    });
    it('propagates read errors instead of substituting cached zero sales', async () => {
        getAll.mockRejectedValue(new Error('Unavailable'));
        await expect(priceManagerService.getRuleSalesMetrics([product], 'ET')).rejects.toThrow('Unavailable');
    });
    it('rejects an empty catalog page before the reported count is reached', async () => {
        vi.spyOn(priceManagerService, 'getPage')
            .mockResolvedValueOnce({ data: [product], count: 2 })
            .mockResolvedValueOnce({ data: [], count: 2 });
        await expect(priceManagerService.getMatchingTargets('ET', {})).rejects.toThrow('Catalog changed');
    });

});
