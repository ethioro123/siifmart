import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
    MARGIN_FLOOR_PCT,
    computeMarginPct,
    isBelowMarginFloor,
    buildPriceChangeRequest,
    requiresFinanceCoApproval,
    canApproveBelowFloor,
    isPriceChangeRequest
} from '../../utils/pricingGovernance';
import type { PendingInventoryChange, Product } from '../../types';

const product = { id: 'p1', name: 'Cooking Oil 5L', sku: 'ET-OIL-001', siteId: 's1', price: 100, costPrice: 80, isOnSale: false } as Product;
const root = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf-8');

describe('price governance helpers (SOP-MER-037)', () => {
    it('computes margin and floor', () => {
        expect(computeMarginPct(100, 80)).toBeCloseTo(20);
        expect(computeMarginPct(0, 80)).toBeNull();
        expect(isBelowMarginFloor({ price: 100, costPrice: 90 })).toBe(true);
        expect(isBelowMarginFloor({ price: 100, costPrice: 80 })).toBe(false);
        expect(MARGIN_FLOOR_PCT).toBe(15);
    });

    it('uses sale price when evaluating margin', () => {
        expect(isBelowMarginFloor({ price: 100, costPrice: 80, isOnSale: true, salePrice: 85 })).toBe(true);
    });

    it('builds a tagged, country-scoped edit request that always carries cost', () => {
        const req = buildPriceChangeRequest({
            product, proposal: { price: 90, costPrice: undefined, salePrice: undefined, isOnSale: false },
            requestedBy: 'Merch', countryCode: 'ke', source: 'Manual'
        });
        expect(req.changeType).toBe('edit');
        expect(req.countryCode).toBe('KE');
        expect(req.proposedChanges?.costPrice).toBe(80);
        expect(isPriceChangeRequest(req)).toBe(true);
        expect(req.adjustmentReason).toContain('Finance co-approval');
    });

    it('requires Finance/CEO only for below-floor price requests', () => {
        const low = { ...buildPriceChangeRequest({ product, proposal: { price: 90, costPrice: 80 }, requestedBy: 'm', countryCode: 'ET', source: 'x' }), id: 'r1' } as PendingInventoryChange;
        const ok = { ...buildPriceChangeRequest({ product, proposal: { price: 120, costPrice: 80 }, requestedBy: 'm', countryCode: 'ET', source: 'x' }), id: 'r2' } as PendingInventoryChange;
        expect(requiresFinanceCoApproval(low)).toBe(true);
        expect(requiresFinanceCoApproval(ok)).toBe(false);
        expect(canApproveBelowFloor('country_finance_director')).toBe(true);
        expect(canApproveBelowFloor('group_ceo')).toBe(true);
        expect(canApproveBelowFloor('country_operations_director')).toBe(false);
    });
});

describe('merchandising no longer writes prices directly', () => {
    it('state hook has no direct updateProduct price writes or mock rules', () => {
        const src = read('components/merchandising/useMerchandisingState.ts');
        expect(src).not.toContain('MOCK_PRICING_RULES');
        expect(src).not.toMatch(/updateProduct\(\{\s*\.\.\.p, (price|isOnSale)/);
        expect(src).not.toContain('updatePricesBySKU(product.sku');
        expect(src).toContain('submitPriceChanges');
        expect(src).toContain('usePricingRules');
    });

    it('markdown tab submits for approval', () => {
        const src = read('components/merchandising/MarkdownTab.tsx');
        expect(src).not.toContain('updateProduct(');
        expect(src).toContain('useMarkdownProposal');
        const hook = read('hooks/useMarkdownProposal.ts');
        expect(hook).toContain('markdownPlanningService.submit');
        expect(hook).not.toContain('updateProduct(');
    });

    it('migration enforces country-scoped RLS and the margin floor trigger', () => {
        const sql = read('migrations/20261011_pricing_rules_and_price_governance.sql');
        expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
        expect(sql).toContain('country_code');
        expect(sql).toContain('enforce_price_change_margin_floor');
        expect(sql).toContain("'country_finance_director', 'group_ceo'");
    });

    it('rules service is country scoped and paginated to 25', () => {
        const src = read('services/pricing-rules.service.ts');
        expect(src).toContain(".eq('country_code'");
        expect(src).toContain('.limit(25)');
        expect(src).not.toContain("select('*')");
    });
});
