// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useProductChanges } from '../../hooks/useProductChanges';
import type { Product } from '../../types';
const mocks = vi.hoisted(() => ({ requests: vi.fn(), prices: vi.fn(), approve: vi.fn() }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'reviewer' } }) }));
vi.mock('../../services/inventory-requests.service', () => ({ inventoryRequestsService: { getMerchandisingRequests: mocks.requests, approveProductEdit: mocks.approve } }));
vi.mock('../../services/product-price-history.service', () => ({ productPriceHistoryService: { listByProduct: mocks.prices } }));
describe('Product-specific change history', () => {
    it('loads a pending summary first, then product/site/country-scoped paged history on demand', async () => {
        mocks.requests.mockResolvedValue({ data: [], totalCount: 0 }); mocks.prices.mockResolvedValue([]);
        const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
        const product = { id: 'milk', siteId: 'store' } as Product;
        const { result, rerender } = renderHook(({ enabled }) => useProductChanges(product, 'ET', 2, enabled), { wrapper, initialProps: { enabled: false } });
        await waitFor(() => expect(result.current.pending.isSuccess).toBe(true));
        expect(mocks.prices).not.toHaveBeenCalled();
        expect(mocks.requests).toHaveBeenCalledWith('ET', expect.objectContaining({ siteId: 'store', productId: 'milk', status: 'pending' }));
        rerender({ enabled: true });
        await waitFor(() => expect(result.current.prices.isSuccess).toBe(true));
        expect(mocks.prices).toHaveBeenCalledWith('store', 'ET', 'milk', 10, 10,expect.objectContaining({since:expect.any(String),search:''}));
        expect(mocks.requests).toHaveBeenCalledWith('ET', expect.objectContaining({ page: 2, limit: 10, productId: 'milk', siteId: 'store', status: 'all' }));
        await act(async()=>result.current.setHistoryWindow('all'));
        await waitFor(()=>expect(mocks.prices).toHaveBeenLastCalledWith('store','ET','milk',10,10,{since:null,search:''}));
        await act(async()=>result.current.setHistorySearch('Director'));
        await waitFor(()=>expect(mocks.prices).toHaveBeenLastCalledWith('store','ET','milk',10,10,{since:null,search:'Director'}));
        mocks.approve.mockResolvedValue({ applied: true, approvalCount: 3 });
        const invalidate = vi.spyOn(cache, 'invalidateQueries');
        await act(async () => { await result.current.decision.mutateAsync({ id: 'request', action: 'approve' }); });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['product_workspace_record'] });
    });
});
