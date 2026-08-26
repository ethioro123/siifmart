/**
 * Barcode Validation & GS1 / UPC / EAN Checksum Engine
 */

export interface BarcodeValidationResult {
    isValid: boolean;
    format: 'EAN-13' | 'UPC-A' | 'EAN-8' | 'ITF-14' | 'CODE-128' | 'CUSTOM';
    warning?: string;
    error?: string;
}

/**
 * Calculates standard GS1 Mod-10 Check Digit for numeric barcode sequences.
 */
export function calculateGS1CheckDigit(digitsWithoutCheck: string): number {
    const digits = digitsWithoutCheck.split('').map(d => parseInt(d, 10));
    let sum = 0;
    
    // Process from right to left with alternating weights 3 and 1
    let weight = 3;
    for (let i = digits.length - 1; i >= 0; i--) {
        sum += digits[i] * weight;
        weight = weight === 3 ? 1 : 3;
    }
    
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates whether a barcode string is structurally valid and follows GS1/standard specs.
 */
export function validateBarcodeFormat(barcodeStr: string): BarcodeValidationResult {
    if (!barcodeStr || typeof barcodeStr !== 'string') {
        return { isValid: false, format: 'CUSTOM', error: 'Barcode cannot be empty.' };
    }

    const clean = barcodeStr.trim();

    if (clean.length < 3) {
        return { isValid: false, format: 'CUSTOM', error: 'Barcode is too short (min 3 characters).' };
    }

    if (clean.length > 48) {
        return { isValid: false, format: 'CUSTOM', error: 'Barcode exceeds maximum standard length (48).' };
    }

    // Check pure numeric formats (EAN-13, UPC-A, EAN-8, ITF-14)
    if (/^\d+$/.test(clean)) {
        if (clean.length === 13) {
            const checkDigit = parseInt(clean[12], 10);
            const expected = calculateGS1CheckDigit(clean.slice(0, 12));
            if (checkDigit !== expected) {
                return {
                    isValid: false,
                    format: 'EAN-13',
                    error: `Invalid EAN-13 checksum (expected digit ${expected}, received ${checkDigit}).`
                };
            }
            return { isValid: true, format: 'EAN-13' };
        }

        if (clean.length === 12) {
            const checkDigit = parseInt(clean[11], 10);
            const expected = calculateGS1CheckDigit(clean.slice(0, 11));
            if (checkDigit !== expected) {
                return {
                    isValid: false,
                    format: 'UPC-A',
                    error: `Invalid UPC-A checksum (expected digit ${expected}, received ${checkDigit}).`
                };
            }
            return { isValid: true, format: 'UPC-A' };
        }

        if (clean.length === 8) {
            const checkDigit = parseInt(clean[7], 10);
            const expected = calculateGS1CheckDigit(clean.slice(0, 7));
            if (checkDigit !== expected) {
                return {
                    isValid: false,
                    format: 'EAN-8',
                    error: `Invalid EAN-8 checksum (expected digit ${expected}, received ${checkDigit}).`
                };
            }
            return { isValid: true, format: 'EAN-8' };
        }

        if (clean.length === 14) {
            const checkDigit = parseInt(clean[13], 10);
            const expected = calculateGS1CheckDigit(clean.slice(0, 13));
            if (checkDigit !== expected) {
                return {
                    isValid: false,
                    format: 'ITF-14',
                    error: `Invalid ITF-14 checksum (expected digit ${expected}, received ${checkDigit}).`
                };
            }
            return { isValid: true, format: 'ITF-14' };
        }
    }

    // Alphanumeric Code 128 / Code 39
    if (/^[A-Za-z0-9\-_./+$%* ]+$/.test(clean)) {
        return { isValid: true, format: 'CODE-128' };
    }

    return {
        isValid: false,
        format: 'CUSTOM',
        error: 'Barcode contains unsupported special characters.'
    };
}
