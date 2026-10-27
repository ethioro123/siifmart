// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProductControlProposals } from '../../hooks/useProductControlProposals';
import { initialUnitConfig } from '../../utils/productControlLogic';
import type { Product } from '../../types';
const mocks = vi.hoisted(() => ({ create: vi.fn(), toast: vi.fn(), invalidate: vi.fn() }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ activeRegionCode: 'ET-ADD', sites: [] }) }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { name: 'Requester' }, showToast: mocks.toast }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('../../hooks/useInventoryRequestMutations', () => ({ useCreateInventoryRequestMutation: () => ({ mutateAsync: mocks.create }) }));
vi.mock('../../hooks/useSubmitPriceChanges', () => ({ useSubmitPriceChanges: () => ({ submit: vi.fn() }) }));
const product = { id: 'milk', siteId: 'store', name: 'Milk', sku: 'ETDY001', price: 125, stock: 23, unit: 'UNIT', size: '1L', minStock: 10, maxStock: 50, customAttributes: { physical: { storage: 'Chilled' } } } as Product;
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({ id: 'request' }); });
describe('Product control proposal saves', () => {
    it('submits narrow profile edits as pending and shows completion only after server save', async () => {
        let resolveSave: (value: unknown) => void = () => {};
        mocks.create.mockReturnValue(new Promise(resolve => { resolveSave = resolve; }));
        const { result } = renderHook(() => useProductControlProposals(product, 'ET'));
        let pending: Promise<boolean>;
        act(() => { pending = result.current.saveProfile({ name: 'New Milk', brand: '', description: '' }); });
        expect(result.current.lastSubmitted).toBeNull();
        await act(async () => { resolveSave({ id: 'request' }); await pending; });
        expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', proposedChanges: { name: 'New Milk' }, siteId: 'store', countryCode: 'ET' }));
        expect(result.current.lastSubmitted).toBe('Product profile update');
    });
    it('never announces a failed save as submitted', async () => {
        mocks.create.mockRejectedValue(new Error('Save unavailable'));
        const { result } = renderHook(() => useProductControlProposals(product, 'ET'));
        await act(async () => { expect(await result.current.saveProfile({ name: 'New Milk', brand: '', description: '' })).toBe(false); });
        expect(result.current.lastSubmitted).toBeNull();
        expect(mocks.toast).toHaveBeenCalledWith('Save unavailable', 'error');
    });
    it('unit updates preserve physical metadata and exclude pricing or stock', async () => {
        const { result } = renderHook(() => useProductControlProposals(product, 'ET'));
        await act(async () => { await result.current.saveUnit({ ...initialUnitConfig(product), packOf: '6', caseOf: '4' }); });
        const payload = mocks.create.mock.calls[0][0].proposedChanges;
        expect(payload.customAttributes.physical.storage).toBe('Chilled');
        expect(payload).not.toHaveProperty('price'); expect(payload).not.toHaveProperty('stock');
    });
    it('does not submit empty or inverted stock-policy drafts', async () => {
        const { result } = renderHook(() => useProductControlProposals(product, 'ET'));
        await act(async () => { await result.current.saveStock({ minStock: '', maxStock: '' }); });
        await act(async () => { await result.current.saveStock({ minStock: '60', maxStock: '50' }); });
        expect(mocks.create).not.toHaveBeenCalled();
    });
});
