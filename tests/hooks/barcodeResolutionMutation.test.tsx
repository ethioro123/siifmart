// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../types';
const { create, uploadEvidence } = vi.hoisted(() => ({ create: vi.fn(), uploadEvidence: vi.fn() }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'actor' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ activeSite: { id: 'store', country: 'KE' }, effectiveCountry: 'KE' }) }));
vi.mock('../../services/barcode-approvals.service', () => ({ barcodeApprovalsService: { create, uploadEvidence } }));
import { useBarcodeResolutionMutation } from '../../hooks/useBarcodeResolutionMutation';
const product = { id: 'coffee', siteId: 'store', barcodes: [] } as unknown as Product;
const imageFile = new File(['photo'], 'label.jpg', { type: 'image/jpeg' });
function mount() {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return renderHook(() => useBarcodeResolutionMutation(), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); uploadEvidence.mockResolvedValue('evidence-url'); create.mockResolvedValue({ id: 'request', status: 'pending' }); });
describe('shared barcode review submission', () => {
    it('submits scoped evidence as pending without activating the barcode', async () => {
        const { result } = mount();
        await act(async () => { await result.current.mutateAsync({ product, barcode: ' COFFEE123 ', imageFile }); });
        expect(create).toHaveBeenCalledWith({ product_id: 'coffee', barcode: 'COFFEE123', image_url: 'evidence-url', site_id: 'store', country_code: 'KE', created_by: 'actor' });
    });
    it.each([
        { product: { ...product, siteId: 'other' }, barcode: 'COFFEE123', imageFile },
        { product, barcode: 'COFFEE123', imageFile: null },
        { product, barcode: 'x', imageFile },
        { product: { ...product, barcodes: ['COFFEE123'] }, barcode: 'COFFEE123', imageFile }
    ])('rejects invalid, unscoped or already active mappings before upload', async input => {
        const { result } = mount();
        await act(async () => { await expect(result.current.mutateAsync(input)).rejects.toThrow(); });
        expect(uploadEvidence).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled();
    });
    it('does not report success when the server does not confirm pending storage', async () => {
        create.mockResolvedValue({ id: 'request', status: 'approved' });
        const { result } = mount();
        await act(async () => { await expect(result.current.mutateAsync({ product, barcode: 'COFFEE123', imageFile })).rejects.toThrow('not confirmed'); });
    });
});
