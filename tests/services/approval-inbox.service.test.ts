import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc } }));
import { approvalInboxService } from '../../services/approval-inbox.service';
beforeEach(() => rpc.mockReset());
describe('scoped approval inbox read', () => {
  it('requests a bounded summary without accepting a client-supplied approver identity', async () => {
    const data = { total: 0, planogramCount: 0, priceCount: 0, productCount: 0, items: [] };
    rpc.mockResolvedValue({ data, error: null });
    expect(await approvalInboxService.productReviews('et')).toEqual(data);
    expect(rpc).toHaveBeenCalledWith('get_my_product_approval_inbox', { p_country_code: 'ET', p_limit: 5 });
  });
  it('preserves permission and network errors instead of reporting zero approvals', async () => {
    const error = new Error('Inbox access denied'); rpc.mockResolvedValue({ data: null, error });
    await expect(approvalInboxService.productReviews('ET')).rejects.toBe(error);
  });
});
