import { describe, it, expect } from 'vitest';
import { ProductSchema } from '../schemas/inventory.schema';

describe('ProductSchema Validation', () => {
    it('should validate a correct product object', () => {
        const validProduct = {
            id: 'prod_123',
            siteId: 'site_1',
            name: 'Energy Drink',
            category: 'Beverages',
            price: 2.50,
            stock: 100,
            sku: 'ED-001',
            barcodes: ['123456789'],
            image: 'https://example.com/item.png',
            status: 'active'
        };

        const result = ProductSchema.safeParse(validProduct);
        expect(result.success).toBe(true);
    });

    it('should fail validation if name is missing', () => {
        const invalidProduct = {
            id: 'prod_123',
            siteId: 'site_1',
            price: 2.50,
            stock: 100,
            sku: 'ED-001'
        };

        const result = ProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
    });

    it('should fail validation if price is negative', () => {
        const invalidProduct = {
            id: 'prod_123',
            siteId: 'site_1',
            name: 'Wrong Price',
            category: 'Test',
            price: -5,
            stock: 10,
            sku: 'WP-001'
        };

        const result = ProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
    });
});
