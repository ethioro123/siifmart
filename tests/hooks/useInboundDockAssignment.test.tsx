// @vitest-environment jsdom
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useInboundDockAssignment } from '../../hooks/useInboundDockAssignment';
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import type { PurchaseOrder } from '../../types';

vi.mock('../../services/purchase-orders.service', () => ({ purchaseOrdersService: { update: vi.fn() } }));
const order = { id: 'po-1', siteId: 'destination', status: 'Partially Received', lineItems: [{ quantity: 10, receivedQty: 4 }] } as PurchaseOrder;
function setup() {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const refresh = vi.fn().mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return { ...renderHook(() => useInboundDockAssignment('destination', refresh), { wrapper }), refresh };
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(purchaseOrdersService.update).mockResolvedValue(order); });
describe('persistent inbound docks', () => {
    it('saves only the dock slot while partial receipts remain outstanding', async () => {
        const { result, refresh } = setup();
        await act(async () => { await result.current.mutateAsync({ order, dock: 'D2' }); });
        expect(purchaseOrdersService.update).toHaveBeenCalledWith(order.id, { dockSlot: 'D2' });
        expect(refresh).toHaveBeenCalledTimes(1);
    });
    it('allows clearing an optional bay without recording a receipt', async () => {
        const { result } = setup();
        await act(async () => { await result.current.mutateAsync({ order, dock: '' }); });
        expect(purchaseOrdersService.update).toHaveBeenCalledWith(order.id, { dockSlot: '' });
    });
    it('rejects completed receipts, foreign sites, and unknown docks', async () => {
        const { result } = setup();
        await act(async () => {
            await expect(result.current.mutateAsync({ order: { ...order, status: 'Received' }, dock: 'D2' })).rejects.toThrow();
            await expect(result.current.mutateAsync({ order: { ...order, siteId: 'another-site' }, dock: 'D2' })).rejects.toThrow();
            await expect(result.current.mutateAsync({ order, dock: 'D99' })).rejects.toThrow();
        });
        expect(purchaseOrdersService.update).not.toHaveBeenCalled();
    });
});

 it('keeps confirmed saves successful when the subsequent refresh fails', async () => {
    const { result, refresh } = setup();
    refresh.mockRejectedValueOnce(new Error('Refresh unavailable'));
    await act(async () => {
        await expect(result.current.mutateAsync({ order, dock: 'D2' })).resolves.toBeDefined();
    });
    expect(purchaseOrdersService.update).toHaveBeenCalledTimes(1);
 });

 it('rejects a simultaneous dock save before a second persistence call', async () => {
    let release: (value: PurchaseOrder) => void = () => {};
    vi.mocked(purchaseOrdersService.update).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const { result } = setup();
    await act(async () => {
        const first = result.current.mutateAsync({ order, dock: 'D1' });
        await vi.waitFor(() => expect(purchaseOrdersService.update).toHaveBeenCalledTimes(1));
        await expect(result.current.mutateAsync({ order, dock: 'D2' })).rejects.toThrow('already being saved');
        release(order);
        await first;
    });
    expect(purchaseOrdersService.update).toHaveBeenCalledTimes(1);
 });
