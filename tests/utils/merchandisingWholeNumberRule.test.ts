import { describe, it, expect } from 'vitest';
import { calculateRulePrice, matchRuleProduct } from '../../components/merchandising/utils/ruleEvaluator';
import type { Product, PricingRule } from '../../types';
import fs from 'fs';
import path from 'path';

describe('Merchandising Whole-Number Rule Invariant', () => {
    const mockProduct: Product = {
        id: 'prod-rule-01',
        name: 'Whole Milk 1L',
        sku: 'ET-DY-001',
        category: 'Dairy',
        price: 155, // Odd price that produces fractions when multiplied
        costPrice: 95,
        stock: 45,
        minStock: 10,
        unit: 'piece',
        salesVelocity: 'Low',
        siteId: 'site-et-01',
        image: '',
        status: 'active'
    };

    it('always outputs an integer for Decrease Price % rules even with fractional calculations', () => {
        // 155 * (1 - 0.15) = 131.75 -> must be rounded to 132
        const rule15Pct: PricingRule = {
            id: 'rule-dec-15',
            name: 'Markdown 15%',
            action: 'Decrease Price %',
            value: 15,
            targetCategory: 'Dairy',
            condition: 'Stock > X',
            threshold: 20,
            isActive: true
        };

        const result = calculateRulePrice(mockProduct, rule15Pct);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBe(Math.round(155 * 0.85)); // 132
        expect(result).toBe(132);

        // 155 * (1 - 0.333) = 103.385 -> must be rounded to 103
        const ruleFractional: PricingRule = {
            ...rule15Pct,
            value: 33.3
        };
        const resultFractional = calculateRulePrice(mockProduct, ruleFractional);
        expect(Number.isInteger(resultFractional)).toBe(true);
        expect(resultFractional).toBe(Math.round(155 * (1 - 0.333)));
    });

    it('always outputs an integer for Increase Price % rules even with fractional percentages', () => {
        // 155 * (1 + 0.137) = 176.235 -> must be rounded to 176
        const ruleIncrease: PricingRule = {
            id: 'rule-inc-13',
            name: 'Inflation adjustment',
            action: 'Increase Price %',
            value: 13.7,
            targetCategory: 'Dairy',
            condition: 'Stock > X',
            threshold: 10,
            isActive: true
        };

        const result = calculateRulePrice(mockProduct, ruleIncrease);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBe(Math.round(155 * 1.137));
        expect(result).toBe(176);
    });

    it('always outputs an integer for Set Margin % rules', () => {
        // Cost: 95. Target margin: 27.5% -> 95 / (1 - 0.275) = 131.0344... -> rounded to 131
        const ruleMargin: PricingRule = {
            id: 'rule-margin',
            name: 'Margin 27.5%',
            action: 'Set to Cost + Margin',
            value: 27.5,
            targetCategory: 'Dairy',
            condition: 'Stock > X',
            threshold: 10,
            isActive: true
        };

        const result = calculateRulePrice(mockProduct, ruleMargin);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBe(Math.round(95 / (1 - 0.275)));
        expect(result).toBe(131);
    });

    it('never permits fractional decimals across any arbitrary percentage (1% to 99%)', () => {
        for (let pct = 1; pct <= 99; pct += 0.5) {
            const decRule: PricingRule = {
                id: `dec-${pct}`,
                name: `Dec ${pct}%`,
                action: 'Decrease Price %',
                value: pct,
                targetCategory: 'Dairy',
                condition: 'Stock > X',
                threshold: 5,
                isActive: true
            };
            const incRule: PricingRule = {
                id: `inc-${pct}`,
                name: `Inc ${pct}%`,
                action: 'Increase Price %',
                value: pct,
                targetCategory: 'Dairy',
                condition: 'Stock > X',
                threshold: 5,
                isActive: true
            };

            const decPrice = calculateRulePrice(mockProduct, decRule);
            const incPrice = calculateRulePrice(mockProduct, incRule);

            expect(Number.isInteger(decPrice)).toBe(true);
            expect(Number.isInteger(incPrice)).toBe(true);
            expect(decPrice % 1).toBe(0);
            expect(incPrice % 1).toBe(0);
        }
    });

    it('verifies that whole-number rounding is codified in canonical rule files', () => {
        const rootAgents = fs.readFileSync(path.resolve(__dirname, '../../AGENTS.md'), 'utf-8');
        const dotAgents = fs.readFileSync(path.resolve(__dirname, '../../.agents/AGENTS.md'), 'utf-8');
        const dotAgentRules = fs.readFileSync(path.resolve(__dirname, '../../.agent/RULES.md'), 'utf-8');
        const countryRules = fs.readFileSync(path.resolve(__dirname, '../../.agent/rules/02-country-and-operations.md'), 'utf-8');

        expect(rootAgents).toMatch(/Merchandising Whole-Number Rule/);
        expect(rootAgents).toMatch(/Math\.round/);

        expect(dotAgents).toMatch(/Merchandising Whole-Number Rule/);
        expect(dotAgents).toMatch(/Math\.round/);

        expect(dotAgentRules).toMatch(/Merchandising whole numbers/);
        expect(dotAgentRules).toMatch(/Math\.round/);

        expect(countryRules).toMatch(/Merchandising Whole-Number Rule/);
        expect(countryRules).toMatch(/Math\.round/);
    });
});
