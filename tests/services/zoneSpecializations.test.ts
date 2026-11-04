import { beforeEach, expect, it, vi } from 'vitest';
import { warehouseZonesService } from '../../services/zones.service';
const state = vi.hoisted(() => ({ error: null as null | { code: string; message: string }, calls: [] as Record<string, unknown>[] }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: () => ({
    update: (payload: Record<string, unknown>) => {
        state.calls.push(payload);
        return { eq: async () => ({ error: state.error }) };
    },
    select: () => ({ eq: () => ({ order: async () => ({
        error: null, data: [{ id: 'z', site_id: 'site', specialization: 'Produce', aisle_specializations: { '01': 'Greens' } }]
    }) }) })
}) } }));
beforeEach(() => { state.error = null; state.calls = []; });
it('persists optional descriptions without modifying the location name or movement flags', async () => {
    await warehouseZonesService.update('z', { specialization: ' Produce ', aisleSpecializations: { '01': 'Greens' } });
    expect(state.calls).toEqual([{ specialization: 'Produce', aisle_specializations: { '01': 'Greens' } }]);
    await warehouseZonesService.update('z', { specialization: '', aisleSpecializations: {} });
    expect(state.calls[1]).toEqual({ specialization: null, aisle_specializations: {} });
});
it('never reports a successful partial save when specialization columns are unavailable', async () => {
    state.error = { code: '42703', message: 'column specialization does not exist' };
    await expect(warehouseZonesService.update('z', { specialization: 'Produce' })).rejects.toEqual(state.error);
    expect(state.calls).toHaveLength(1);
});
it('maps both descriptions back when loading a facility', async () => {
    const zones = await warehouseZonesService.getAll('site');
    expect(zones[0]).toMatchObject({ siteId: 'site', specialization: 'Produce', aisleSpecializations: { '01': 'Greens' } });
});
