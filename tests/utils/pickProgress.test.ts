import { describe, expect, it } from 'vitest';
import { isPickLineResolved, remainingPickQuantity, validatePickQuantity, resolvePickProduct } from '../../utils/pickProgress';

describe('pick progress', () => {
    it('advances past confirmed shortages and discontinued lines', () => {
        for (const status of ['Picked', 'Completed', 'Short', 'Discontinued', 'short']) {
            expect(isPickLineResolved({ status })).toBe(true);
        }
        expect(isPickLineResolved({ status: 'In-Progress' })).toBe(false);
    });
    it('limits resumed picking to the outstanding quantity, including explicit zero', () => {
        expect(remainingPickQuantity({ expectedQty: 10, pickedQty: 4 })).toBe(6);
        expect(remainingPickQuantity({ expectedQty: 0 })).toBe(0);
        expect(remainingPickQuantity({ expectedQty: 10, pickedQty: 12 })).toBe(0);
        expect(() => validatePickQuantity(7, 6)).toThrow();
        expect(() => validatePickQuantity(6, 6)).not.toThrow();
    });
    it('rejects non-finite and non-positive quantities before saving', () => {
        for (const quantity of [NaN, Infinity, -1, 0]) {
            expect(() => validatePickQuantity(quantity, 10)).toThrow();
        }
        expect(() => validatePickQuantity(1.25, 2)).not.toThrow();
    });
});

it('resolves the manifest lot before another bin holding the same SKU', () => {
    const products = [
        {id:'wrong-country',sku:'SKU',siteId:'other',location:'A-01-01'},
        {id:'lot1',sku:'SKU',siteId:'dc',location:'A-01-01'},
        {id:'lot2',sku:'SKU',siteId:'dc',location:'B-01-01'},
    ];
    expect(resolvePickProduct(products,{productId:'lot2',sku:'SKU'},'dc')?.id).toBe('lot2');
    expect(resolvePickProduct(products,{sku:'SKU',location:'B-01-01'},'dc')?.id).toBe('lot2');
    expect(resolvePickProduct(products,{sku:'SKU'},'unknown')).toBeUndefined();
});
