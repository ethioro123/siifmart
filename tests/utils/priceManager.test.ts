import { describe, expect, it, vi } from 'vitest';
import { discountedProposal, normalizePriceProposal, sellingMargin, submitPriceBatch } from '../../utils/priceManager';
import { matchRuleProduct, calculateRulePrice } from '../../components/merchandising/utils/ruleEvaluator';
import type { Product, PricingRule } from '../../types';
const product = { id: 'a', name: 'Diapers', sku: 'SKU', siteId: 'site', price: 100, costPrice: 70, category: 'Baby', stock: 5 } as Product;
const rule = (patch: Record<string, unknown>) => ({ targetCategory: 'Baby', threshold: 10, ...patch } as PricingRule);
describe('Price Manager governance and whole-number pricing', () => {
    it('preserves intentional whole-number rounding and exact recorded cost', () => {
        expect(discountedProposal({ ...product, price: 19.95, costPrice: 10.23 }, 10)).toMatchObject({ price: 20, salePrice: 18, costPrice: 10.23 });
        expect(normalizePriceProposal({ price: 100.6, costPrice: 70.22 })).toMatchObject({ price: 101, costPrice: 70.22 });
    });
    it('rejects invalid discounts and zero or ineffective rounded sale prices', () => {
        for (const percent of [-1, 0, 100, 110, NaN]) expect(() => discountedProposal(product, percent)).toThrow();
        expect(() => discountedProposal({ ...product, price: 1 }, 90)).toThrow();
        expect(() => discountedProposal({ ...product, price: 1 }, 1)).toThrow();
    });
    it('uses sale margins and represents missing or zero costs as unavailable', () => {
        expect(sellingMargin({ price: 100, costPrice: 70, isOnSale: true, salePrice: 75 })).toBeCloseTo(6.6667);
        expect(sellingMargin({ price: 100 })).toBeNull();
        expect(sellingMargin({ price: 100, costPrice: 0 })).toBeNull();
    });
    it('attempts remaining products after a failure and reports precise retry IDs', async () => {
        const submit = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Denied')).mockResolvedValueOnce(undefined);
        const result = await submitPriceBatch(['a', 'b', 'c'].map(id => ({ product: { ...product, id }, proposal: { price: 120, costPrice: 70 } })), submit, () => false);
        expect(submit).toHaveBeenCalledTimes(3);
        expect(result.submittedIds).toEqual(['a', 'c']);
        expect(result.failures).toEqual([{ productId: 'b', message: 'Denied' }]);
    });
    it('does not match unknown expiry, expired dates, unknown rules or missing categories', () => {
        expect(matchRuleProduct(product, rule({ condition: 'Expiry < X Days' }))).toBe(false);
        expect(matchRuleProduct({ ...product, expiryDate: '2020-01-01' }, rule({ condition: 'Expiry < X Days' }))).toBe(false);
        expect(matchRuleProduct(product, rule({ condition: 'Unknown' }))).toBe(false);
        expect(matchRuleProduct({ ...product, stock: 50, category: '' }, rule({ condition: 'Stock > X' }))).toBe(false);
    });
    it('includes goods expiring today without including already expired goods', () => {
        expect(matchRuleProduct({ ...product, expiryDate: '2026-10-28' }, rule({ condition: 'Expiry < X Days', threshold: 1 }), new Date('2026-10-28T12:00:00').getTime())).toBe(true);
    });
    it('never invents costs for target-margin rules and keeps rule outputs whole', () => {
        expect(calculateRulePrice({ ...product, costPrice: undefined }, rule({ action: 'Set to Cost + Margin', value: 50 }))).toBe(product.price);
        expect(calculateRulePrice(product, rule({ action: 'Increase Price %', value: 3.7 }))).toBe(104);
    });
});
