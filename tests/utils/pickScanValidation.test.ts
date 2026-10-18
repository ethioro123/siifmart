import { describe, expect, it } from 'vitest';
import { encodeLocation, extractLocationBarcodeFromScan, isLocationBarcode } from '../../utils/locationEncoder';
import { matchesExpectedPickItemScan, matchesExpectedPickLocationScan } from '../../utils/pickScanValidation';

describe('picking scanner accepted values', () => {
    it('accepts only the active pick line SKU or catalog barcode', () => {
        expect(matchesExpectedPickItemScan('SKU-123', 'SKU-123', '0012345678905')).toBe(true);
        expect(matchesExpectedPickItemScan('0012345678905', 'SKU-123', '0012345678905')).toBe(true);
        expect(matchesExpectedPickItemScan('sku-123', 'SKU-123', '0012345678905')).toBe(true);
        expect(matchesExpectedPickItemScan('SKU123', 'SKU-123', '0012345678905')).toBe(false);
        expect(matchesExpectedPickItemScan('OTHER-123', 'SKU-123', '0012345678905')).toBe(false);
        expect(matchesExpectedPickItemScan('https://example.com/SKU-123', 'SKU-123')).toBe(false);
    });

    it('allows a QR item payload only when its code matches the active line', () => {
        expect(matchesExpectedPickItemScan('{"sku":"SKU-123"}', 'SKU-123')).toBe(true);
        expect(matchesExpectedPickItemScan('{"sku":123}', 'SKU-123')).toBe(false);
        expect(matchesExpectedPickItemScan('{"sku":"OTHER-123"}', 'SKU-123')).toBe(false);
    });

    it('accepts valid raw and app-generated QR location barcodes', () => {
        const barcode = encodeLocation('A-01-05', '1234')!;
        expect(isLocationBarcode(barcode)).toBe(true);
        expect(extractLocationBarcodeFromScan(barcode)).toBe(barcode);
        expect(extractLocationBarcodeFromScan(JSON.stringify({ loc: 'A-01-05', code: barcode }))).toBe(barcode);
        expect(extractLocationBarcodeFromScan(`https://ops.siifmart.com/locations/${barcode}/audit`)).toBe(barcode);
        expect(matchesExpectedPickLocationScan(barcode, 'A-01-05', '1234')).toBe(true);
        expect(matchesExpectedPickLocationScan(JSON.stringify({ loc: 'A-01-05', code: barcode }), 'A-01-05', '1234')).toBe(true);
    });

    it('rejects malformed, unchecked, and unrelated location scans', () => {
        const barcode = encodeLocation('A-01-05', '1234')!;
        const wrongCheckDigit = `${barcode.slice(0, -1)}${(Number(barcode.slice(-1)) + 1) % 10}`;
        expect(isLocationBarcode('ABCDEFGHIJKLMNO')).toBe(false);
        expect(extractLocationBarcodeFromScan(wrongCheckDigit)).toBeNull();
        expect(extractLocationBarcodeFromScan('{"loc":"A-01-05"}')).toBeNull();
        expect(extractLocationBarcodeFromScan(`https://example.com/locations/${barcode}/audit`)).toBeNull();
        expect(extractLocationBarcodeFromScan('NOT A LOCATION')).toBeNull();
        expect(matchesExpectedPickLocationScan(barcode, 'A-01-06', '1234')).toBe(false);
        expect(matchesExpectedPickLocationScan(barcode, 'A-01-05', '9999')).toBe(false);
    });
});
