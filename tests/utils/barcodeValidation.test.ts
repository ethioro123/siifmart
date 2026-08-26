import { describe, it, expect } from 'vitest';
import { validateBarcodeFormat, calculateGS1CheckDigit } from '../../utils/barcodeValidation';

describe('barcodeValidation', () => {
    it('calculates correct GS1 Mod-10 check digit for standard EAN-13', () => {
        // Example: 935843203364 -> check digit should be 8 (9358432033648)
        const checkDigit = calculateGS1CheckDigit('935843203364');
        expect(checkDigit).toBe(8);
    });

    it('validates genuine EAN-13 barcodes', () => {
        const res = validateBarcodeFormat('9358432033648');
        expect(res.isValid).toBe(true);
        expect(res.format).toBe('EAN-13');
    });

    it('rejects tampered EAN-13 barcode with invalid checksum', () => {
        const res = validateBarcodeFormat('9358432033649'); // ending in 9 instead of 8
        expect(res.isValid).toBe(false);
        expect(res.format).toBe('EAN-13');
        expect(res.error).toContain('Invalid EAN-13 checksum');
    });

    it('validates genuine UPC-A barcodes', () => {
        // 01234567890 -> check digit 5
        const checkDigit = calculateGS1CheckDigit('01234567890');
        expect(checkDigit).toBe(5);
        const res = validateBarcodeFormat('012345678905');
        expect(res.isValid).toBe(true);
        expect(res.format).toBe('UPC-A');
    });

    it('validates alphanumeric Code-128 and warehouse barcodes', () => {
        const res = validateBarcodeFormat('GN025-PKG-01');
        expect(res.isValid).toBe(true);
        expect(res.format).toBe('CODE-128');
    });

    it('rejects empty or excessively short barcodes', () => {
        expect(validateBarcodeFormat('').isValid).toBe(false);
        expect(validateBarcodeFormat('A').isValid).toBe(false);
    });
});
