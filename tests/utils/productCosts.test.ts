import { describe, expect, it } from 'vitest';
import { purchaseAmount, orderCostFromSellUnit } from '../../utils/productCosts';
import { productOrderUnits, initialUnitConfig, unitProposal } from '../../utils/productControlLogic';
import { computeSellUnitsPerOrderUnit as procurementUnits } from '../../components/procurement/createPOHelpers';
import { computeSellUnitsPerOrderUnit } from '../../utils/productPackaging';
import type { Product } from '../../types';
describe('Shared buying and selling specification', () => {
    it('uses exactly the same canonical conversion in Procurement and Product Workspace', () => {
        expect(procurementUnits).toBe(computeSellUnitsPerOrderUnit);
        const product = { unit: 'UNIT', size: '1L', customAttributes: { packaging: { packQty: '6', caseSize: '4', packagingLevel: 'two_tier' } } } as Product;
        expect(productOrderUnits(product)).toBe(24);
        expect(productOrderUnits({ ...product, unit: 'L' })).toBe(24);
        expect(productOrderUnits({ ...product, customAttributes: { packaging: { packQty: 6, packagingLevel: 'single' } } })).toBe(1);
    });
    it('retains cents when converting unit costs to case costs including costs above retail', () => {
        expect(orderCostFromSellUnit(10.23, 24)).toBe(245.52);
        expect(orderCostFromSellUnit(150.75, 6)).toBe(904.5);
        expect(purchaseAmount(10.23 * 3)).toBe(30.69);
        expect(purchaseAmount(1.005)).toBe(1.01);
    });
    it('updates the Procurement packaging level when units/cases change', () => {
        const product = { unit: 'UNIT', customAttributes: { packaging: { packagingLevel: 'single' } } } as Product;
        const patch = unitProposal(product, { ...initialUnitConfig(product), packOf: '6', caseOf: '4' });
        expect(patch.customAttributes.packaging.packagingLevel).toBe('two_tier');
        expect(productOrderUnits({ ...product, ...patch } as Product)).toBe(24);
    });
});
