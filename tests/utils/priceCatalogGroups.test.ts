import { describe, expect, it } from 'vitest';
import { priceCatalogGroup, wholeRange } from '../../utils/priceCatalogGroups';
import type { Product } from '../../types';
describe('Price catalog group display', () => {
    it('uses distinct locations separately from lot records', () => {
        const product = { price_group: { locationCount: 100, recordCount: 140 } } as unknown as Product;
        expect(priceCatalogGroup(product)?.locationCount).toBe(100);
        expect(priceCatalogGroup(product)?.recordCount).toBe(140);
    });
    it('shows whole ranges without fabricated unknown margins', () => {
        expect(wholeRange(null, null, '%')).toBe('Unavailable');
        expect(wholeRange(15.2, 21.8, '%')).toBe('15–22%');
        expect(wholeRange(100, 100)).toBe('100');
    });
});
