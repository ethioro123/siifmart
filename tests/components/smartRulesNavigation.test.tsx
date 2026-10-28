// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PricingRule, Product } from '../../types';
const mocks = vi.hoisted(() => ({ targets: vi.fn() }));
vi.mock('../../services/price-manager.service', () => ({ priceManagerService: { getMatchingTargets: mocks.targets } }));
vi.mock('../../services/pricing-rules.service', () => ({ pricingRulesService: {} }));
import { usePricingRulesActions } from '../../components/merchandising/hooks/usePricingRulesActions';

describe('Smart Rules navigation', () => {
    it('does not resurrect a preview after navigation while catalog loading is pending', async () => {
        let resolve!: (products: Product[]) => void;
        mocks.targets.mockReturnValue(new Promise<Product[]>(done => { resolve = done; }));
        const stagePriceBatch = vi.fn();
        const props = {
            activeCountry: 'ET' as const, sites: [], salesMetricsIndex: new Map(),
            createRule: { mutateAsync: vi.fn(), isPending: false },
            toggleRule: { mutate: vi.fn() }, deleteRule: { mutate: vi.fn() }, pricingRules: [],
            batch: { stagePriceBatch }, setIsSubmitting: vi.fn(), addNotification: vi.fn(),
        };
        const { result, rerender } = renderHook(({ workspaceScope }) => usePricingRulesActions({ ...props, workspaceScope }), {
            initialProps: { workspaceScope: 'rules' },
        });
        const rule: PricingRule = { id: 'r', name: 'Coffee discount', targetCategory: 'All', condition: 'Stock > X', threshold: 0, action: 'Decrease Price %', value: 10, isActive: true };
        let pending!: Promise<void>;
        act(() => { pending = result.current.runPricingRule(rule); });
        rerender({ workspaceScope: 'pricing' });
        await act(async () => {
            resolve([{ id: 'p', price: 100, stock: 10, costPrice: 50 } as Product]);
            await pending;
        });
        expect(stagePriceBatch).not.toHaveBeenCalled();
        expect(props.addNotification).not.toHaveBeenCalled();
    });
});
