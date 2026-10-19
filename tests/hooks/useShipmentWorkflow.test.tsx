// @vitest-environment jsdom
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useShipmentWorkflow } from '../../hooks/useShipmentWorkflow';
import { wmsJobsService } from '../../services/wms-jobs.service';
import type { WMSJob } from '../../types';

vi.mock('../../services/wms-jobs.service', () => ({ wmsJobsService: { update: vi.fn() } }));
const base: WMSJob = { id: 'dispatch-1', type: 'DISPATCH', status: 'In-Progress', priority: 'Normal', siteId: 'source',
    sourceSiteId: 'source', destSiteId: 'dest', assignedTo: 'driver-1', transferStatus: 'Shipped', location: 'In-Transit',
    orderRef: 'parent-transfer', items: 10, lineItems: [{ productId: 'p1', sku: 'KE-FR001', name: 'Carrots', expectedQty: 10, pickedQty: 0, status: 'Pending' }] };
function setup() {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const refresh = vi.fn().mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return { ...renderHook(() => useShipmentWorkflow(refresh), { wrapper }), refresh };
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(wmsJobsService.update).mockResolvedValue(base); });

describe('shipment mutations', () => {
    it('records a partial arrival without recording receipt or changing inventory', async () => {
        const { result, refresh } = setup();
        await act(async () => { await result.current.mutateAsync({ job: base, action: { type: 'arrive', delivered: [6], note: 'Four units damaged in transit' } }); });
        const update = vi.mocked(wmsJobsService.update).mock.calls[0][1];
        expect(update).toMatchObject({ status: 'Completed', transferStatus: 'Partially Delivered', hasDiscrepancy: true });
        expect(update.lineItems?.[0]).toMatchObject({ expectedQty: 10, deliveredQty: 6, undeliveredQty: 4 });
        expect(update).not.toHaveProperty('receivedBy');
        expect(update.lineItems?.[0]).not.toHaveProperty('receivedQty');
        expect(wmsJobsService.update).toHaveBeenCalledTimes(1);
        expect(refresh).toHaveBeenCalledTimes(1);
    });
    it.each([{ delivered: [-1] }, { delivered: [11] }, { delivered: [Number.NaN] }, { delivered: [] }])('rejects invalid arrival quantities $delivered', async ({ delivered }) => {
        const { result } = setup();
        await act(async () => { await expect(result.current.mutateAsync({ job: base, action: { type: 'arrive', delivered, note: 'Issue' } })).rejects.toThrow(); });
        expect(wmsJobsService.update).not.toHaveBeenCalled();
    });
    it('rejects arrival before departure and partial arrival without a reason', async () => {
        const { result } = setup();
        await act(async () => {
            await expect(result.current.mutateAsync({ job: { ...base, transferStatus: 'Packed' }, action: { type: 'arrive', delivered: [10], note: '' } })).rejects.toThrow('departure');
            await expect(result.current.mutateAsync({ job: base, action: { type: 'arrive', delivered: [5], note: '' } })).rejects.toThrow('Explain');
        });
        expect(wmsJobsService.update).not.toHaveBeenCalled();
    });
    it('releases a packed, loaded shipment without setting delivery or receipt', async () => {
        const { result } = setup();
        await act(async () => { await result.current.mutateAsync({ job: { ...base, transferStatus: 'Packed', location: 'Dock D1' }, action: { type: 'depart' } }); });
        expect(wmsJobsService.update).toHaveBeenCalledWith(base.id, expect.objectContaining({ transferStatus: 'Shipped', location: 'In-Transit', status: 'In-Progress' }));
        expect(vi.mocked(wmsJobsService.update).mock.calls[0][1]).not.toHaveProperty('deliveredAt');
    });
});
