import { describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('../../services/products.service', () => ({ productsService: {} }));
vi.mock('../../services/sales.service', () => ({ salesService: {} }));
vi.mock('../../services/purchase-orders.service', () => ({ purchaseOrdersService: {} }));
import { collectForecastPages, merchandisingForecastService } from '../../services/merchandising-forecast.service';
import { supabase } from '../../lib/supabase';

describe('Forecast evidence loading', () => {
    it('reads beyond the first page without losing records', async () => {
        const read = vi.fn(async (offset: number, limit: number) => ({ data: Array.from({ length: Math.min(limit, 601 - offset) }, (_, i) => offset + i), count: 601 }));
        expect(await collectForecastPages(read)).toHaveLength(601);
        expect(read.mock.calls.map(call => call[0])).toEqual([0, 250, 500]);
    });
    it('propagates a failed subsequent page instead of returning a partial forecast', async () => {
        const read = vi.fn().mockResolvedValueOnce({ data: [1], count: 300 }).mockRejectedValueOnce(new Error('Denied'));
        await expect(collectForecastPages(read)).rejects.toThrow('Denied');
    });
    it('rejects incomplete datasets when a later page unexpectedly disappears', async () => {
        const read = vi.fn().mockResolvedValueOnce({ data: [1], count: 300 }).mockResolvedValueOnce({ data: [], count: 300 });
        await expect(collectForecastPages(read)).rejects.toThrow('changed while loading');
    });
    it('does not fall back to country-wide reads when no location is selected', async () => {
        await expect(merchandisingForecastService.get('All', 'ET')).rejects.toThrow('Select a location');
        expect(supabase.from).not.toHaveBeenCalled();
    });
    it('verifies the location country before reading business evidence', async () => {
        const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: new Error('Denied') }) };
        vi.mocked(supabase.from).mockReturnValue(query as never);
        await expect(merchandisingForecastService.get('site-1', 'ET')).rejects.toThrow('Denied');
        expect(query.eq).toHaveBeenCalledWith('id', 'site-1');
        expect(query.eq).toHaveBeenCalledWith('country', 'ET');
    });
});
