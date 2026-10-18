import { decodeLocation, extractLocationBarcodeFromScan, extractPrefixFromBarcode, extractSkuFromScan } from './locationEncoder';
import { normalizeLocation } from './locationTracking';

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

/** Accept a location label only when it resolves to the current line's bay and site. */
export const matchesExpectedPickLocationScan = (
    scan: string,
    expectedLocation?: string | null,
    expectedPrefix?: string | null
): boolean => {
    if (!expectedLocation?.trim()) return false;
    const barcode = extractLocationBarcodeFromScan(scan);
    if (!barcode) return false;
    if (expectedPrefix?.trim() && extractPrefixFromBarcode(barcode) !== expectedPrefix.trim()) return false;

    const decodedLocation = decodeLocation(barcode);
    const normalizedExpected = normalizeLocation(expectedLocation) || expectedLocation.trim().toUpperCase();
    return decodedLocation === normalizedExpected;
};
