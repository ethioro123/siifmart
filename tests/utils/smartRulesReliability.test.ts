import { describe, expect, it } from 'vitest';
import type { Product, PricingRule } from '../../types';
import { matchRuleProduct, detectRuleConflicts, validatePricingRule } from '../../components/merchandising/utils/ruleEvaluator';
import { buildRuleChanges } from '../../components/merchandising/utils/ruleProposal';
import { runMerchandisingSimulation } from '../../components/merchandising/utils/simulationRunner';

const product = { id: 'coffee', name: 'Coffee', category: 'Grocery > Coffee', price: 100, costPrice: 50, stock: 20, salesVelocity: 'Low' } as Product;
const rule: PricingRule = { id: 'r', name: 'Coffee markdown', targetCategory: 'All', condition: 'Stock > X', threshold: 0, action: 'Decrease Price %', value: 10, isActive: true };

describe('Smart Rules reliability', () => {
    it('does not substitute invented demand for missing sales', () => {
        const salesRule = { ...rule, condition: 'Sales < X' as const, threshold: 10 };
        expect(matchRuleProduct(product, salesRule)).toBe(false);
        expect(matchRuleProduct(product, salesRule, { sales30d: NaN })).toBe(false);
        expect(matchRuleProduct(product, salesRule, { sales30d: 0 })).toBe(true);
    });
    it('excludes unknown sales and preserves recorded zero sales', () => {
        const unknown = runMerchandisingSimulation([product], [rule], new Map());
        expect(unknown).toEqual({ rev: 0, margin: null, profitChange: 0, invalidPrices: 0, impactedCount: 0 });
        const zero = runMerchandisingSimulation([{ ...product, unitsSold30d: 0 }], [rule], new Map());
        expect(zero.rev).toBe(0);
        expect(zero.margin).toBeNull();
    });
    it('holds volume constant rather than projecting an unsupported sales lift', () => {
        const result = runMerchandisingSimulation([{ ...product, unitsSold30d: 10 }], [rule], new Map());
        expect(result).toEqual({ rev: -10, margin: -20, profitChange: -100, invalidPrices: 0, impactedCount: 1 });
    });
    it('ignores paused rules in the portfolio scenario', () => {
        expect(runMerchandisingSimulation([{ ...product, unitsSold30d: 10 }], [{ ...rule, isActive: false }], new Map()).impactedCount).toBe(0);
    });
    it('detects parent-category overlap', () => {
        expect(detectRuleConflicts([{ ...rule, targetCategory: 'Grocery' }, { ...rule, id: 'r2', targetCategory: 'Grocery > Coffee' }])).toHaveLength(1);
    });
    it('accepts zero thresholds and rejects unsupported triggers', () => {
        expect(validatePricingRule(rule).isValid).toBe(true);
        expect(validatePricingRule({ ...rule, condition: 'unknown' as PricingRule['condition'] }).isValid).toBe(false);
    });
    it('preserves active sales and models their effective selling price', () => {
        const sale = { ...product, unitsSold30d: 10, isOnSale: true, salePrice: 80 };
        const preview = buildRuleChanges([sale], rule, new Map());
        expect(preview.changes[0].proposal).toMatchObject({ price: 90, salePrice: 80, isOnSale: true });
        expect(runMerchandisingSimulation([sale], [rule], new Map())).toMatchObject({ rev: 0, margin: 0, profitChange: 0, impactedCount: 0 });
    });
    it('excludes invalid sale combinations in both preview and scenario', () => {
        const sale = { ...product, unitsSold30d: 10, isOnSale: true, salePrice: 80 };
        const deepDiscount = { ...rule, value: 30 };
        expect(buildRuleChanges([sale], deepDiscount, new Map())).toMatchObject({ changes: [], invalidPrices: 1 });
        expect(runMerchandisingSimulation([sale], [deepDiscount], new Map())).toMatchObject({ rev: 0, profitChange: 0, invalidPrices: 1 });
    });
    it('reports absolute profit movement for break-even and losing portfolios', () => {
        const increase = { ...rule, action: 'Increase Price %' as const };
        for (const costPrice of [100, 120]) {
            expect(runMerchandisingSimulation([{ ...product, costPrice, unitsSold30d: 10 }], [increase], new Map()))
                .toMatchObject({ margin: null, profitChange: 100 });
        }
    });
    it('counts missing costs only among matching products', () => {
        const marginRule = { ...rule, targetCategory: 'Coffee', action: 'Set to Cost + Margin' as const };
        const products = [
            { ...product, category: 'Dairy', costPrice: undefined },
            { ...product, id: 'match', category: 'Coffee', costPrice: undefined },
            { ...product, id: 'no-stock', category: 'Coffee', costPrice: undefined, stock: 0 },
        ];
        expect(buildRuleChanges(products, marginRule, new Map()).missingCosts).toBe(1);
    });

});
