import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../types';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc } }));
import { submitScopedPriceProposals } from '../../services/scoped-price-proposals.service';
const change = (id: string, sku = 'ET-COF') => ({ product: { id, sku, price: 100, costPrice: 70, siteId: id } as Product,
  proposal: { price: 120, costPrice: 70, isOnSale: false } });
beforeEach(() => rpc.mockReset());
describe('scoped price submissions', () => {
  it('submits 100 site records for the same SKU as one proposal without copying costs', async () => {
    rpc.mockResolvedValue({ data: { requestId: 'group-1', targetCount: 100, financeCount: 2 }, error: null });
    const result = await submitScopedPriceProposals('et', Array.from({ length: 100 }, (_, i) => change(String(i))), 'Country pricing');
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc.mock.calls[0][1].p_changes).toHaveLength(100);
    expect(rpc.mock.calls[0][1].p_changes[0].proposal).toEqual({ price: 120, isOnSale: false });
    expect(result).toMatchObject({ submitted: 100, proposalCount: 1, financeFlagged: 2, failures: [] });
  });
  it('retains every location of a failed SKU for retry while preserving successful SKUs', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error('Cost changed') })
      .mockResolvedValueOnce({ data: { requestId: 'group-2', targetCount: 1, financeCount: 0 }, error: null });
    const result = await submitScopedPriceProposals('ET', [change('a'), change('b'), change('c', 'ET-OIL')], 'Rule');
    expect(result.submittedIds).toEqual(['c']);
    expect(result.failures).toEqual([{ productId: 'a', message: 'Cost changed' }, { productId: 'b', message: 'Cost changed' }]);
  });
  it('treats an idempotent server retry as the same successfully saved proposal', async () => {
    rpc.mockResolvedValue({ data: { requestId: 'original', targetCount: 2, financeCount: 0, reused: true }, error: null });
    const result = await submitScopedPriceProposals('ET', [change('a'), change('b')], 'Retry');
    expect(result).toMatchObject({ submitted: 2, proposalCount: 1, failures: [] });
  });
  it('does not submit a partial SKU when one location has an invalid price', async () => {
    const invalid = change('b'); invalid.proposal.price = 0;
    const result = await submitScopedPriceProposals('ET', [change('a'), invalid], 'Invalid');
    expect(rpc).not.toHaveBeenCalled(); expect(result.failures).toHaveLength(2); expect(result.submitted).toBe(0);
  });
});
