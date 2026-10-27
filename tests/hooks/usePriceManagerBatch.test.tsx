// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePriceManagerBatch } from '../../hooks/usePriceManagerBatch';
import type { Product } from '../../types';
const products = ['a', 'b'].map(id => ({ id, price: 100, costPrice: 70 } as Product));
describe('Price Manager preview and selection scope', () => {
    it('clears hidden selections and previews when scope changes', async () => {
        const setSelectedIds = vi.fn();
        const { result, rerender } = renderHook(({ scopeKey }) => usePriceManagerBatch({ products, selectedIds: new Set(['a']), setSelectedIds, scopeKey, setIsSubmitting: vi.fn(), submit: vi.fn() }), { initialProps: { scopeKey: 'page1' } });
        act(() => result.current.stageDiscount(10)); expect(result.current.priceBatch?.changes).toHaveLength(1);
        rerender({ scopeKey: 'new-filter' });
        await waitFor(() => expect(result.current.priceBatch).toBeNull());
        expect(setSelectedIds).toHaveBeenLastCalledWith(new Set());
    });
    it('retains only failed records in the preview and retry selection', async () => {
        const setSelectedIds = vi.fn();
        const submit = vi.fn().mockResolvedValue({ submitted: 1, submittedIds: ['a'], financeFlagged: 0, failures: [{ productId: 'b', message: 'Denied' }] });
        const { result } = renderHook(() => usePriceManagerBatch({ products, selectedIds: new Set(['a', 'b']), setSelectedIds, scopeKey: 'page1', setIsSubmitting: vi.fn(), submit }));
        act(() => result.current.stageDiscount(10));
        await act(() => result.current.confirmPriceBatch());
        expect(result.current.priceBatch?.changes.map(change => change.product.id)).toEqual(['b']);
        expect(setSelectedIds).toHaveBeenLastCalledWith(new Set(['b']));
    });
});
