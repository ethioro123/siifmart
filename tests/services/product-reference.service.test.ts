import { describe, expect, it, vi } from 'vitest';
import { productReferenceService } from '../../services/product-reference.service';
import { supabase } from '../../lib/supabase';
vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }));
describe('Country product master reference', () => {
    it('reads a narrow reference by country and SKU without reading master costs', async () => {
        const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { sku: 'ETDY001' }, error: null }) };
        vi.mocked(supabase.from).mockReturnValue(query as never);
        await productReferenceService.get('et', 'ETDY001');
        expect(query.eq).toHaveBeenCalledWith('country_code', 'ET'); expect(query.eq).toHaveBeenCalledWith('sku', 'ETDY001');
        expect(query.select.mock.calls[0][0]).not.toContain('cost');
    });
    it('propagates denied or unavailable reads', async () => {
        const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Unavailable' } }) };
        vi.mocked(supabase.from).mockReturnValue(query as never);
        await expect(productReferenceService.get('ET', 'ETDY001')).rejects.toMatchObject({ message: 'Unavailable' });
    });
});
