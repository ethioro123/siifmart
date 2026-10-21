import { describe, expect, it } from 'vitest';
import type { CartItem, Product } from '../../../../types';
import {
    getEffectiveRetailPrice,
    getPriceUpdateTimestamp,
    getRecentPriceUpdates,
    getStaleCartPriceChanges
} from '../../../../components/pos/utils/priceUpdates';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 'product-1',
    siteId: 'site-1',
    name: 'Rice',
    category: 'Food',
    price: 100,
    stock: 20,
    sku: 'RICE-1',
    image: '',
    status: 'active',
    ...overrides
});

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    ...makeProduct(),
    quantity: 1,
    ...overrides
});

describe('POS price update tracking', () => {
    it('uses the active sale price as the price charged at POS', () => {
        expect(getEffectiveRetailPrice(makeProduct({ isOnSale: true, salePrice: 85 }))).toBe(85);
        expect(getEffectiveRetailPrice(makeProduct({ isOnSale: false, salePrice: 85 }))).toBe(100);
    });

    it('requires the dedicated price timestamp and ignores malformed values', () => {
        expect(getPriceUpdateTimestamp({ ...makeProduct(), updatedAt: '2026-10-20T10:00:00Z' } as Product)).toBeNull();
        expect(getPriceUpdateTimestamp(makeProduct({ priceUpdatedAt: 'not-a-date' }))).toBeNull();
    });

    it('only shows recent price updates for the active site', () => {
        const now = Date.parse('2026-10-21T00:00:00Z');
        const updated = makeProduct({ priceUpdatedAt: '2026-10-20T10:00:00Z' });
        const otherSite = makeProduct({ id: 'product-2', siteId: 'site-2', priceUpdatedAt: updated.priceUpdatedAt });
        const genericEdit = { ...makeProduct({ id: 'product-3' }), updatedAt: updated.priceUpdatedAt } as Product;

        expect(getRecentPriceUpdates([updated, otherSite, genericEdit], 'site-1', now).map(product => product.id)).toEqual(['product-1']);
        expect(getRecentPriceUpdates([updated], undefined, now)).toEqual([]);
    });

    it('detects stale cart lines and compares against the current effective price', () => {
        const cart = [makeCartItem({ price: 100 }), makeCartItem({ id: 'product-2', price: 50, name: 'Beans' })];
        const catalog = [makeProduct({ price: 110 }), makeProduct({ id: 'product-2', name: 'Beans', price: 70, isOnSale: true, salePrice: 50 })];

        expect(getStaleCartPriceChanges(cart, catalog)).toEqual([
            { itemId: 'product-1', productName: 'Rice', oldPrice: 100, currentPrice: 110 }
        ]);
    });
});
