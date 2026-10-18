import { extractSkuFromScan } from './locationEncoder';

const normalizePickCode = (value: string): string => value.trim().toUpperCase();

/** Accept a scan only when it resolves exactly to the current line's SKU or barcode. */
export const matchesExpectedPickItemScan = (
    scan: string,
    expectedSku?: string | null,
    expectedBarcode?: string | null
): boolean => {
    const scannedCode = extractSkuFromScan(scan);
    if (!scannedCode) return false;

    const normalizedScan = normalizePickCode(scannedCode);
    return [expectedSku, expectedBarcode].some(expected =>
        typeof expected === 'string' && expected.trim().length > 0 && normalizePickCode(expected) === normalizedScan
    );
};
