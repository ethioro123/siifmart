import { describe, expect, it } from 'vitest';
import { isExactPackQuantity, matchesPackItemScan } from '../../utils/packScanValidation';

describe('matchesPackItemScan', () => {
    const item = { sku: 'ET-MILK-001' };
    const product = { sku: 'ET-MILK-001', barcode: '6001000001016' };

    it('accepts only the scanned job line SKU or its matching catalog barcode', () => {
        expect(matchesPackItemScan('ET-MILK-001', item, product)).toBe(true);
        expect(matchesPackItemScan('6001000001016', item, product)).toBe(true);
        expect(matchesPackItemScan('6001000001099', item, { ...product, barcodes: ['6001000001099'] })).toBe(true);
        expect(matchesPackItemScan('UNRELATED-ITEM', item, product)).toBe(false);
    });

    it('normalizes scanner separators and rejects empty or missing-line scans', () => {
        expect(matchesPackItemScan('et milk/001', item, product)).toBe(true);
        expect(matchesPackItemScan('', item, product)).toBe(false);
        expect(matchesPackItemScan('ET-MILK-001', null, product)).toBe(false);
    });
});

describe('isExactPackQuantity', () => {
    it('accepts the required quantity and rejects short, excess, zero, and invalid quantities', () => {
        expect(isExactPackQuantity(12, 12)).toBe(true);
        expect(isExactPackQuantity(11, 12)).toBe(false);
        expect(isExactPackQuantity(13, 12)).toBe(false);
        expect(isExactPackQuantity(0, 12)).toBe(false);
        expect(isExactPackQuantity(12.0001, 12)).toBe(false);
        expect(isExactPackQuantity(11.9999, 12)).toBe(false);
        expect(isExactPackQuantity(Number.NaN, 12)).toBe(false);
    });
});
