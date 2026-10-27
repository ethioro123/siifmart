import { describe, expect, it } from 'vitest';
import type { Product, PricingRule } from '../../types';
import { matchRuleProduct, detectRuleConflicts, validatePricingRule } from '../../components/merchandising/utils/ruleEvaluator';
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
        expect(unknown).toEqual({ rev: 0, margin: 0, impactedCount: 0 });
        const zero = runMerchandisingSimulation([{ ...product, unitsSold30d: 0 }], [rule], new Map());
        expect(zero.rev).toBe(0);
        expect(zero.margin).toBe(0);
    });
    it('holds volume constant rather than projecting an unsupported sales lift', () => {
        const result = runMerchandisingSimulation([{ ...product, unitsSold30d: 10 }], [rule], new Map());
        expect(result).toEqual({ rev: -10, margin: -20, impactedCount: 1 });
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
});
