import type { Product } from '../types';
import { computeMarginPct, effectivePrice, type PriceProposal } from './pricingGovernance';

export interface PriceChangeInput { product: Product; proposal: PriceProposal }
export interface PriceBatch { source: string; changes: PriceChangeInput[] }
export interface PriceBatchResult {
    submitted: number; proposalCount?: number; financeFlagged: number; submittedIds: string[];
    failures: Array<{ productId: string; message: string }>;
}
export function sellingMargin(product: Partial<Product>): number | null {
    return computeMarginPct(effectivePrice(product), product.costPrice);
}
export function normalizePriceProposal(proposal: PriceProposal): PriceProposal {
    if (!Number.isFinite(proposal.price) || proposal.price <= 0 || Math.round(proposal.price) <= 0) {
        throw new Error('Enter a positive selling price.');
    }
    if (proposal.costPrice !== undefined && (!Number.isFinite(proposal.costPrice) || proposal.costPrice < 0)) {
        throw new Error('Recorded cost is invalid.');
    }
    const price = Math.round(proposal.price);
    const salePrice = proposal.salePrice === undefined ? undefined : Math.round(proposal.salePrice);
    if (proposal.isOnSale && (salePrice === undefined || !Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
        throw new Error('Sale price must round to a positive whole number below the regular price.');
    }
    return { ...proposal, price, salePrice };
}
export function discountedProposal(product: Product, percent: number): PriceProposal {
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) throw new Error('Discount must be greater than 0% and less than 100%.');
    return normalizePriceProposal({ price: product.price, costPrice: product.costPrice, isOnSale: true, salePrice: Math.round(product.price * (1 - percent / 100)) });
}
export function productSiteName(product: Product, sites: Array<{ id: string; name: string }>): string {
    return sites.find(site => site.id === (product.siteId || product.site_id))?.name ||
        (product as Product & { site_name?: string }).site_name || 'Location unavailable';
}
/** Every item is attempted; successful items are never included in a retry batch. */
export async function submitPriceBatch(
    changes: PriceChangeInput[], submit: (change: PriceChangeInput) => Promise<void>,
    needsFinance: (proposal: PriceProposal) => boolean,
): Promise<PriceBatchResult> {
    const result: PriceBatchResult = { submitted: 0, financeFlagged: 0, submittedIds: [], failures: [] };
    for (const change of changes) {
        try {
            const proposal = normalizePriceProposal(change.proposal);
            await submit({ ...change, proposal });
            result.submitted++; result.submittedIds.push(change.product.id);
            if (needsFinance(proposal)) result.financeFlagged++;
        } catch (error) {
            result.failures.push({ productId: change.product.id, message: error instanceof Error ? error.message : String((error as { message?: string })?.message || 'Submission failed') });
        }
    }
    return result;
}
