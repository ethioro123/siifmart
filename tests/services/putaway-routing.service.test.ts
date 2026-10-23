import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { putawayRoutingService } from '../../services/putaway-routing.service';
vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }));
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), site_id: 'et-dc', sku: 'ET001', stock: 2, location: 'A-01-01' }));
function setup(pages: unknown[][], error: unknown = null) {
    const range = vi.fn(); pages.forEach(data => range.mockResolvedValueOnce({ data, error }));
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range, limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
    vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);
    return query;
}
describe('live site Putaway routing snapshot', () => {
    beforeEach(() => vi.clearAllMocks());
    it('loads every bounded stock page with a site filter and explicit projection', async () => {
        const query = setup([rows(250), rows(1)]);
        expect((await putawayRoutingService.load('et-dc')).stock).toHaveLength(251);
        expect(query.range).toHaveBeenNthCalledWith(1, 0, 249);
        expect(query.range).toHaveBeenNthCalledWith(2, 250, 499);
        expect(query.eq).toHaveBeenCalledWith('site_id', 'et-dc');
        expect(query.select).not.toHaveBeenCalledWith('*');
        expect(query.gt).toHaveBeenCalledWith('stock', 0);
    });
    it('fails closed rather than recommending from a partial failed snapshot', async () => {
        setup([[]], { message: 'Access denied' });
        await expect(putawayRoutingService.load('et-dc')).rejects.toEqual({ message: 'Access denied' });
    });
    it('requires a facility before sending any query', async () => {
        await expect(putawayRoutingService.load('')).rejects.toThrow('warehouse');
        expect(supabase.from).not.toHaveBeenCalled();
    });
});
