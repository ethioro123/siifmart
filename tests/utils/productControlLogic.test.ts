import { describe, expect, it } from 'vitest';
import type { Product } from '../../types';
import { initialUnitConfig, unitProposal, stockPolicyPreview, profileProposal, packagingPreview, netContentPreview } from '../../utils/productControlLogic';
const product = { id: 'milk', name: 'Milk 1L', sku: 'ETDY001', unit: 'UNIT', size: '1L', price: 125, stock: 23, minStock: 10, maxStock: 50, customAttributes: { physical: { storage: 'Chilled' }, packaging: { packQty: 6, caseSize: 4 }, commercial: { labelOverride: '' } } } as Product;
describe('Product control tab logic', () => {
    it('reads embedded quantities without assigning an invented physical unit', () => {
        expect(initialUnitConfig(product)).toMatchObject({ physicalQty: '1', physicalUnit: 'L', packOf: '6', caseOf: '4' });
        expect(initialUnitConfig({ ...product, size: '1' }).physicalUnit).toBe('');
    });
    it('proposes only changed packaging fields and preserves unrelated attributes', () => {
        const patch = unitProposal(product, { ...initialUnitConfig(product), caseOf: '5' });
        expect(Object.keys(patch).sort()).toEqual(['customAttributes', 'packQuantity']);
        expect(patch.customAttributes.physical).toEqual({ storage: 'Chilled' });
        expect(patch).not.toHaveProperty('price'); expect(patch).not.toHaveProperty('stock'); expect(patch).not.toHaveProperty('size');
    });
    it('rejects invalid packaging and mode/unit mismatches', () => {
        const cfg = initialUnitConfig(product);
        for (const caseOf of ['0', '-1', '1.5', 'Infinity']) expect(() => unitProposal(product, { ...cfg, caseOf })).toThrow();
        expect(() => unitProposal(product, { ...cfg, sellMode: 'weight', sellUnit: 'UNIT' })).toThrow();
        expect(() => unitProposal(product, { ...cfg, physicalQty: '0' })).toThrow();
    });
    it('keeps a no-change draft empty and calculates case conversions', () => {
        expect(unitProposal(product, initialUnitConfig(product))).toEqual({});
        expect(packagingPreview(initialUnitConfig(product)).unitsPerCase).toBe(24);
        expect(netContentPreview(initialUnitConfig(product))).toEqual({ equivalent: '1,000 ml', pack: '6 L', case: '24 L' });
    });
    it('distinguishes low, excess and unconfigured stock including explicit zero limits', () => {
        expect(stockPolicyPreview(product, { minStock: '24', maxStock: '50' }).state).toBe('Below minimum');
        expect(stockPolicyPreview(product, { minStock: '0', maxStock: '20' }).state).toBe('Above maximum');
        expect(stockPolicyPreview({ ...product, stock: 0 }, { minStock: '0', maxStock: '0' }).state).toBe('Within limits');
        expect(stockPolicyPreview({ ...product, minStock: undefined, maxStock: undefined }, { minStock: '', maxStock: '' }).state).toBe('Not configured');
        expect(stockPolicyPreview(product, { minStock: '', maxStock: '' }).min).toBe(10);
        expect(() => stockPolicyPreview(product, { minStock: '30', maxStock: '20' })).toThrow();
    });
    it('builds narrow profile changes and rejects an empty name', () => {
        expect(profileProposal(product, { name: ' Milk 1L ', brand: ' Brand ', description: '' })).toEqual({ brand: 'Brand' });
        expect(() => profileProposal(product, { name: ' ', brand: '', description: '' })).toThrow('required');
    });
});
