/**
 * Location Barcode Encoder/Decoder (GS1-Style 15-Digit Format)
 * 
 * Format: PPP-ZZ-AA-BB-UUUU-C
 * PPPP: Prefix (Site ID) - Default 8888
 * ZZ:  Zone (01=A, 02=B ... 10=J)
 * AA:  Aisle (01-99)
 * BB:  Bay (01-99)
 * UUUU: Unique/Reserved (Default 0000)
 * C:   Check Digit (Luhn Algorithm)
 */

const PREFIX = '8888';
const RESERVED = '0000';

/**
 * Extracts a strict 4-digit prefix from a site code.
 * SITE-0004 -> 0004
 * S-123 -> 0123
 * null -> 8888
 */
export const extractSitePrefix = (siteCode?: string): string => {
    if (!siteCode) return PREFIX;

    // Check for SITE-XXXX format
    const siteMatch = siteCode.match(/SITE-(\d+)/i);
    if (siteMatch) {
        return (parseInt(siteMatch[1]) % 10000).toString().padStart(4, '0');
    }

    // Fallback: Deterministic Hash to avoid collisions (e.g. WH-A vs WH-B)
    // Sum char codes and mod to 4 digits
    let hash = 0;
    for (let i = 0; i < siteCode.length; i++) {
        hash = ((hash << 5) - hash) + siteCode.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const safeHash = Math.abs(hash) % 10000;
    return safeHash.toString().padStart(4, '0');
};

// Zone Mapping (A=1, B=2, ..., Z=26)
const getZoneNumber = (zone: string): string => {
    const code = zone.toUpperCase().charCodeAt(0) - 64;
    return code.toString().padStart(2, '0');
};

const getZoneLetter = (num: string): string => {
    const code = parseInt(num, 10) + 64;
    return String.fromCharCode(code);
};

// Modified Luhn Algorithm for Alphanumeric Input
const generateCheckDigit = (input: string): string => {
    let sum = 0;
    let isEven = false;

    // Loop through characters from right to left
    for (let i = input.length - 1; i >= 0; i--) {
        const charCode = input.charCodeAt(i);
        let value = 0;

        // Map characters to values: 0-9 use value, A-Z use ASCII-55 (A=10, etc.)
        if (charCode >= 48 && charCode <= 57) { // 0-9
            value = charCode - 48;
        } else if (charCode >= 65 && charCode <= 90) { // A-Z
            value = charCode - 55;
        } else {
            // Fallback for other chars (e.g. lowercase) -> just use mod 10 of code to be safe
            value = charCode % 10;
        }

        if (isEven) {
            value *= 2;
            if (value > 9) {
                value -= 9;
            }
        }

        sum += value;
        isEven = !isEven;
    }

    return ((10 - (sum % 10)) % 10).toString();
};

/**
 * Generate a 14-digit (or 15-digit) barcode from a location string (e.g., "A-01-01")
 * 3-digit prefix -> 14 digit barcode
 * 4-digit prefix -> 15 digit barcode
 */
export const encodeLocation = (location: string, prefix: string = PREFIX): string | null => {
    // 1. Parse Input
    // Supports: A-01-01, A 01 01, A0101
    const clean = location.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Basic validation before strict parsing
    if (clean.length < 3) return null;

    const zone = clean[0];
    let aisle = '';
    let bay = '';

    // Extract numbers based on length context
    if (clean.length === 5) { // A0101
        aisle = clean.substring(1, 3);
        bay = clean.substring(3, 5);
    } else if (clean.length === 3) { // A11
        aisle = '0' + clean[1];
        bay = '0' + clean[2];
    } else {
        // Fallback to regex for separated formats
        const match = location.match(/([A-Z])[\s-]*(\d{1,2})[\s-]*(\d{1,2})/i);
        if (match) {
            aisle = match[2].padStart(2, '0');
            bay = match[3].padStart(2, '0');
        } else {
            return null;
        }
    }

    // 2. Build Payload
    const zoneNum = getZoneNumber(zone);
    // Build Payload: Strictly enforce 4-digit prefix
    const usePrefix = (prefix.length === 4) ? prefix : PREFIX;
    const payload = `${usePrefix}${zoneNum}${aisle}${bay}${RESERVED}`;

    // 3. Add Check Digit
    const checkDigit = generateCheckDigit(payload);
    return `${payload}${checkDigit}`;
};

/**
 * Decode a 14/15-digit barcode back to human-readable format
 * Returns null if invalid or checksum fails.
 */
export const decodeLocation = (barcode: string): string | null => {
    if (!barcode || (barcode.length !== 14 && barcode.length !== 15)) return null;

    // 1. Verify Checksum
    const payload = barcode.substring(0, barcode.length - 1);
    const check = barcode.substring(barcode.length - 1);
    if (generateCheckDigit(payload) !== check) {
        console.warn('Invalid Checksum for Location Barcode', barcode);
        return null;
    }

    // 2. Extract Components based on length
    // 14 digits: PPP ZZ AA BB UUUU C (Prefix 3)
    // 15 digits: PPPP ZZ AA BB UUUU C (Prefix 4)

    let zoneNum, aisle, bay;

    if (barcode.length === 15) {
        // 4-digit prefix
        zoneNum = barcode.substring(4, 6);
        aisle = barcode.substring(6, 8);
        bay = barcode.substring(8, 10);
    } else {
        // 14 digits (standard 3-digit prefix)
        zoneNum = barcode.substring(3, 5);
        aisle = barcode.substring(5, 7);
        bay = barcode.substring(7, 9);
    }

    const zoneLetter = getZoneLetter(zoneNum);

    return `${zoneLetter}-${aisle}-${bay}`;
};

/**
 * Extract the site prefix from a 14/15-digit barcode
 */
export const extractPrefixFromBarcode = (barcode: string): string | null => {
    if (!barcode || (barcode.length !== 14 && barcode.length !== 15)) return null;
    return barcode.length === 15 ? barcode.substring(0, 4) : barcode.substring(0, 3);
};

/**
 * Check if a scanned string looks like our location barcode
 */
export const isLocationBarcode = (scan: string): boolean => {
    // Verify 14 or 15 characters (alphanumeric) and valid checksum
    if (!/^[A-Z0-9]{14,15}$/.test(scan)) return false;
    const payload = scan.substring(0, scan.length - 1);
    const check = scan.substring(scan.length - 1);
    return generateCheckDigit(payload) === check;
};
