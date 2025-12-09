import { describe, it, expect } from 'vitest';
import { generateUniqueSKU, isSKUUnique } from '../../../utils/skuUtils';
import { Product } from '../../../types';

describe('SKU Utilities', () => {
    const mockProducts: Product[] = [
        { id: '1', sku: 'SM-ADM-ELE-1234', name: 'Existing Product', price: 10, stock: 5, category: 'Electronics', siteId: '1', location: 'A-01', status: 'active', image: '', expiryDate: '' },
        { id: '2', sku: 'SM-ADM-ELE-5678', name: 'Another Product', price: 20, stock: 10, category: 'Electronics', siteId: '1', location: 'A-02', status: 'active', image: '', expiryDate: '' }
    ];

    describe('generateUniqueSKU', () => {
        it('should generate a SKU with correct format', () => {
            const sku = generateUniqueSKU('Headquarters', 'Electronics', mockProducts);
            expect(sku).toMatch(/^SM-HEA-ELE-\d{4}$/);
        });

        it('should generate a unique SKU not in the existing list', () => {
            const sku = generateUniqueSKU('Headquarters', 'Electronics', mockProducts);
            expect(mockProducts.some(p => p.sku === sku)).toBe(false);
        });

        it('should handle multi-word site names correctly', () => {
            const sku = generateUniqueSKU('New York Branch', 'Food', []);
            expect(sku).toMatch(/^SM-NYB-FOO-\d{4}$/);
        });

        it('should handle short category names correctly', () => {
            const sku = generateUniqueSKU('Administration', 'TV', []);
            expect(sku).toMatch(/^SM-ADM-TVX-\d{4}$/);
        });
    });

    describe('isSKUUnique', () => {
        it('should return true for a new unique SKU', () => {
            expect(isSKUUnique('SM-ADM-ELE-9999', mockProducts)).toBe(true);
        });

        it('should return false for an existing SKU', () => {
            expect(isSKUUnique('SM-ADM-ELE-1234', mockProducts)).toBe(false);
        });

        it('should return true if the SKU belongs to the product being edited', () => {
            expect(isSKUUnique('SM-ADM-ELE-1234', mockProducts, '1')).toBe(true);
        });

        it('should return false if the SKU belongs to a different product', () => {
            expect(isSKUUnique('SM-ADM-ELE-1234', mockProducts, '2')).toBe(false);
        });
    });
});
