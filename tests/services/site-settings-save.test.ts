import { beforeEach, expect, it, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc } }));
import { sitesService } from '../../services/sites.service';
beforeEach(() => { rpc.mockReset(); });
it('saves site changes and source replacement in one transaction and clears an unassigned zone', async () => {
    rpc.mockResolvedValue({ data: { id: 'site', code: 'ADD-ST-01', country: 'ET', currency: 'ETB', logistics_zone_id: null }, error: null });
    await sitesService.update('site', { logisticsZoneId: '', replenishmentSourceIds: ['warehouse'] });
    expect(rpc).toHaveBeenCalledWith('save_site_configuration', {
        p_site_id: 'site', p_changes: { logistics_zone_id: null, replenishment_source_id: 'warehouse' }, p_source_ids: ['warehouse']
    });
});
it('propagates a rejected atomic save', async () => {
    const error = new Error('Source update denied'); rpc.mockResolvedValue({ data: null, error });
    await expect(sitesService.update('site', { name: 'Changed', replenishmentSourceIds: [] })).rejects.toBe(error);
});
