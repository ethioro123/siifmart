import { describe, it, expect } from 'vitest';
import { checkRequiresFinanceSignoff, requiresFinanceCoApproval } from '../../utils/pricingGovernance';
import type { PendingInventoryChange, Product } from '../../types';

describe('Merchandising Baseline Margin Governance (Issue 2)', () => {
    const mockBaselineProduct: Partial<Product> = {
        id: 'prod-001',
        name: 'Sunflower Oil 5L',
        sku: 'ET-OIL-01',
        price: 1000,
        costPrice: 900, // Baseline COGS
        salePrice: undefined,
        isOnSale: false
    };

    it('requires Finance signoff when a partial price proposal creates a margin below 15% using existing baseline cost', () => {
        // Proposed new price is 1000 -> 950. No costPrice in proposal.
        // Effective margin with baseline cost 900: (950 - 900) / 950 = 5.26% (< 15% floor)
        const partialProposal = { price: 950 };
        const result = checkRequiresFinanceSignoff(partialProposal, mockBaselineProduct);

        expect(result.requiresFinance).toBe(true);
        expect(result.effectiveSellingPrice).toBe(950);
        expect(result.effectiveCostPrice).toBe(900);
        expect(result.effectiveMarginPct).toBeCloseTo(5.26, 1);
    });

    it('does not require Finance signoff when a partial price proposal maintains margin >= 15%', () => {
        // Proposed new price is 1200. Cost price is 900.
        // Effective margin: (1200 - 900) / 1200 = 25% (>= 15% floor)
        const partialProposal = { price: 1200 };
        const result = checkRequiresFinanceSignoff(partialProposal, mockBaselineProduct);

        expect(result.requiresFinance).toBe(false);
        expect(result.effectiveSellingPrice).toBe(1200);
        expect(result.effectiveCostPrice).toBe(900);
        expect(result.effectiveMarginPct).toBe(25);
    });

    it('requires Finance signoff when a partial salePrice proposal dips below margin floor', () => {
        // Product on sale at 920 with baseline cost 900: (920 - 900) / 920 = 2.17%
        const saleProposal = { salePrice: 920, isOnSale: true };
        const result = checkRequiresFinanceSignoff(saleProposal, mockBaselineProduct);

        expect(result.requiresFinance).toBe(true);
        expect(result.effectiveSellingPrice).toBe(920);
        expect(result.effectiveMarginPct).toBeCloseTo(2.17, 1);
    });

    it('ignores non-pricing proposals even if existing product margin is below floor', () => {
        // Current product margin is below floor, but proposal only changes product description
        const lowMarginProduct: Partial<Product> = {
            id: 'prod-002',
            price: 100,
            costPrice: 95 // 5% margin
        };
        const descriptionProposal = { description: 'Updated packaging formula' };
        const result = checkRequiresFinanceSignoff(descriptionProposal, lowMarginProduct);

        expect(result.requiresFinance).toBe(false);
    });

    it('requiresFinanceCoApproval helper correctly identifies below-floor price change requests', () => {
        const changeRequest: PendingInventoryChange = {
            id: 'req-01',
            productId: 'prod-001',
            productName: 'Sunflower Oil 5L',
            productSku: 'ET-OIL-01',
            siteId: 'ET-ADD-STR-01',
            countryCode: 'ET',
            changeType: 'edit',
            requestedBy: 'Merchandiser Abebe',
            requestedAt: new Date().toISOString(),
            status: 'pending',
            adjustmentReason: 'PRICE_CHANGE: Ramadan Promo',
            proposedChanges: { price: 950 } // No costPrice provided!
        };

        const needsFinance = requiresFinanceCoApproval(changeRequest, mockBaselineProduct);
        expect(needsFinance).toBe(true);
    });
});
