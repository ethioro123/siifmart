import type { PricingRule, Product } from '../../../types';
import { normalizePriceProposal } from '../../../utils/priceManager';
import type { PriceProposal } from '../../../utils/pricingGovernance';
import { calculateRulePrice, matchRuleProduct } from './ruleEvaluator';

/** Preserve active promotions. An invalid regular/sale combination is never staged. */
export function rulePriceProposal(product: Product, rule: PricingRule): PriceProposal {
    return normalizePriceProposal({
        price: calculateRulePrice(product, rule), costPrice: product.costPrice,
        salePrice: product.salePrice, isOnSale: product.isOnSale,
    });
}

export function buildRuleChanges(products: Product[], rule: PricingRule, sales: Map<string, { unitsSold30d: number }>) {
    const changes: Array<{ product: Product; proposal: PriceProposal }> = [];
    let missingCosts = 0;
    let invalidPrices = 0;
    for (const product of products) {
        if (!matchRuleProduct(product, rule, { sales30d: sales.get(product.id)?.unitsSold30d })) continue;
        if (rule.action === 'Set to Cost + Margin' && (!Number.isFinite(product.costPrice) || (product.costPrice ?? 0) <= 0)) {
            missingCosts++;
            continue;
        }
        try {
            const proposal = rulePriceProposal(product, rule);
            if (proposal.price !== product.price) changes.push({ product, proposal });
        } catch {
            invalidPrices++;
        }
    }
    return { changes, missingCosts, invalidPrices };
}
