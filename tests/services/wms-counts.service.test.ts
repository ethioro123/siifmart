import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { wmsCountsService } from '../../services/wms-counts.service';

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));

describe('wmsCountsService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('records a blind physical quantity through the scoped database function', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
            data: { productId: 'product-1', hasVariance: true, status: 'Recount Required', countedQty: 7, recountsDone: 0, canCount: false },
            error: null,
        } as never);

        const result = await wmsCountsService.recordCount('session-1', 'product-1', 7);

        expect(supabase.rpc).toHaveBeenCalledWith('record_wms_count', {
            p_session_id: 'session-1', p_product_id: 'product-1', p_count_qty: 7,
        });
        expect(result.hasVariance).toBe(true);
        expect(result.status).toBe('Recount Required');
    });

    it('propagates database authorization errors without falling back to client counts', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
            data: null,
            error: { message: 'A different authenticated employee must perform the recount' },
        } as never);

        await expect(wmsCountsService.recordCount('session-1', 'product-1', 7))
            .rejects.toThrow('A different authenticated employee must perform the recount');
    });
});
