import { describe, expect, it, vi, beforeEach } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
import { supabase } from '../../lib/supabase';
import { poFinanceReviewService } from '../../services/po-finance-review.service';
beforeEach(() => vi.clearAllMocks());
describe('finance approval queue reads', () => {
 it('requests a bounded page in the current country', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: { data: [], count: 0 }, error: null } as never);
  await expect(poFinanceReviewService.getQueue('ET', 2)).resolves.toEqual({ data: [], count: 0 });
  expect(supabase.rpc).toHaveBeenCalledWith('get_po_finance_review_queue', { p_country: 'ET', p_limit: 20, p_offset: 20 });
 });
 it('rejects missing scope and invalid pagination before querying', async () => {
  await expect(poFinanceReviewService.getQueue('', 1)).rejects.toThrow('Valid country');
  await expect(poFinanceReviewService.getQueue('KE', 0)).rejects.toThrow('Valid country');
  expect(supabase.rpc).not.toHaveBeenCalled();
 });
 it('propagates server errors instead of reporting an empty approval queue', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('Access denied') } as never);
  await expect(poFinanceReviewService.getQueue('KE', 1)).rejects.toThrow('Access denied');
 });
});
