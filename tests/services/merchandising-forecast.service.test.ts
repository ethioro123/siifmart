import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
import { merchandisingForecastService } from '../../services/merchandising-forecast.service';
import { supabase } from '../../lib/supabase';
beforeEach(() => vi.resetAllMocks());
describe('Forecast snapshot and requests', () => {
    it('loads one scoped atomic aggregate instead of receipt pages', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { products: [], demand: [], incoming: [], awaitingSkus: [], asOf: '2026-10-28', start: '2026-09-28' }, error: null } as never);
        await merchandisingForecastService.get('site-1', 'ET');
        expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('merchandising_forecast_snapshot', { p_site: 'site-1', p_country: 'ET' });
    });
    it('propagates denial and never substitutes cached evidence', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('Denied') } as never);
        await expect(merchandisingForecastService.get('site-1', 'ET')).rejects.toThrow('Denied');
    });
    it('rejects incomplete snapshots', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { products: [] }, error: null } as never);
        await expect(merchandisingForecastService.get('site-1', 'ET')).rejects.toThrow('incomplete');
    });
    it('rejects unscoped reads before calling the server', async () => {
        await expect(merchandisingForecastService.get('All', 'ET')).rejects.toThrow('Select a location');
        expect(supabase.rpc).not.toHaveBeenCalled();
    });
    it('requires server acknowledgement and whole requested quantities', async () => {
        await expect(merchandisingForecastService.request('p1', 2.5)).rejects.toThrow('whole');
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);
        await expect(merchandisingForecastService.request('p1', 2)).rejects.toThrow('confirm');
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { id: 't1', existing: true }, error: null } as never);
        expect(await merchandisingForecastService.request('p1', 2)).toEqual({ id: 't1', existing: true });
    });
});
