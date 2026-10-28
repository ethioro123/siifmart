import { supabase } from '../lib/supabase';
import { normalizePriceProposal, type PriceChangeInput, type PriceBatchResult } from '../utils/priceManager';

/** A SKU is one atomic review unit, even when it exists in hundreds of locations. */
export async function submitScopedPriceProposals(country: string, changes: PriceChangeInput[], source: string): Promise<PriceBatchResult> {
  const result: PriceBatchResult = { submitted: 0, proposalCount: 0, financeFlagged: 0, submittedIds: [], failures: [] };
  const groups = new Map<string, PriceChangeInput[]>();
  for (const change of changes) {
    const key = change.product.sku || change.product.id;
    groups.set(key, [...(groups.get(key) || []), change]);
  }
  for (const group of groups.values()) {
    try {
      const payload = group.map(({ product, proposal }) => {
        const normalized = normalizePriceProposal(proposal);
        return { productId: product.id, proposal: { price: normalized.price,
          ...(normalized.salePrice !== undefined ? { salePrice: normalized.salePrice } : {}),
          ...(normalized.isOnSale !== undefined ? { isOnSale: normalized.isOnSale } : {}) } };
      });
      const { data, error } = await supabase.rpc('submit_price_proposal_group', {
        p_country: country.toUpperCase(), p_changes: payload, p_source: source,
      });
      if (error) throw error;
      if (!data?.requestId || data.targetCount !== group.length) throw new Error('Scoped proposal submission returned incomplete confirmation.');
      result.submitted += group.length;
      result.proposalCount = (result.proposalCount || 0) + 1;
      result.financeFlagged += data.financeCount || 0;
      result.submittedIds.push(...group.map(change => change.product.id));
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Scoped proposal submission failed';
      result.failures.push(...group.map(change => ({ productId: change.product.id, message })));
    }
  }
  return result;
}

export interface ScopedPriceTarget {
  productId: string; siteId: string; siteCode: string; siteName: string; regionCode: string;
  baseline: { price: number; cost_price: number; sale_price: number | null; is_on_sale: boolean };
  proposal: { price: number; salePrice?: number; isOnSale?: boolean };
}
export async function getScopedPriceTargets(requestId: string, offset: number): Promise<ScopedPriceTarget[]> {
  const { data, error } = await supabase.rpc('list_price_proposal_targets', {
    p_request_id: requestId, p_offset: Math.max(0, offset), p_limit: 25,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Location evidence could not be loaded.');
  return data;
}
