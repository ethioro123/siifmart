import { describe, expect, it, vi } from 'vitest';
import { buildPOItem } from '../../components/procurement/buildPOItem';
import type { Product } from '../../types';
vi.mock('../../utils/skuGenerator', () => ({ generateSequentialSKU: vi.fn().mockResolvedValue('ET-TEST-001') }));
const input: Parameters<typeof buildPOItem>[0] = {
    products: [], existingItems: [], editingItem: null, country: 'ET', productType: 'new', currentProductToAdd: '',
    currentQty: 10, currentCost: 25, currentRetailPrice: 0, customItemName: 'Plain notebook', customItemBrand: '',
    selectedMainCategory: 'Stationery & Office', customItemSize: '', customItemUnit: 'UNIT', customItemImage: '', caseSize: 0, pkgType: 'Case',
    customAttributes: { identity: { unbranded: true }, physical: {}, packaging: { packagingLevel: 'case', packQty: '24' }, storage: { type: 'Ambient', isPerishable: false, requirementsConfirmed: true }, commercial: {}, descriptive: {} }
};
describe('PO item preparation', () => {
    it('allows explicitly unbranded products without a retail price', async () => {
        const result = await buildPOItem(input);
        expect(result.errors).toBeUndefined();
        expect(result.item).toMatchObject({ retailPrice: 0, brand: '', unitCost: 25, totalCost: 250 });
    });
    it('preserves decimal supplier costs and line totals', async () => {
        const result = await buildPOItem({ ...input, currentCost: 25.23, currentQty: 3 });
        expect(result.item).toMatchObject({ unitCost: 25.23, totalCost: 75.69 });
    });
    it('requires a brand or an explicit unbranded choice', async () => {
        const result = await buildPOItem({ ...input, customAttributes: { ...input.customAttributes, identity: {} } });
        expect(result.errors?.brand).toBeTruthy();
    });
    it('requires confirmation and whole-number pack sizes', async () => {
        const result = await buildPOItem({ ...input, customAttributes: { ...input.customAttributes, storage: {}, packaging: { packagingLevel: 'case', packQty: '2.5' } } });
        expect(result.errors?.storageConfirmation).toBeTruthy();
        expect(result.errors?.packQty).toBeTruthy();
    });
    it('rejects malformed total shelf life for a perishable item', async () => {
        const result = await buildPOItem({ ...input, customAttributes: { ...input.customAttributes, storage: { requirementsConfirmed: true, isPerishable: true, shelfLifeDays: '2.5' } } });
        expect(result.errors?.shelfLifeDays).toBeTruthy();
    });
    it('reuses catalog attributes and approved retail instead of edited values', async () => {
        const product = { id: 'catalog-product', name: 'Approved item', sku: 'ET-CAT-01', price: 42, category: 'Stationery', brand: 'Approved brand', image: '', customAttributes: { storage: { type: 'Ambient' } } } as Product;
        const result = await buildPOItem({ ...input, productType: 'catalog', currentProductToAdd: product.id, products: [product], currentRetailPrice: 999 });
        expect(result.item?.retailPrice).toBe(42);
        expect(result.item?.customAttributes).toEqual(product.customAttributes);
    });
});
