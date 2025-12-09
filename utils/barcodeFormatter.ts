/**
 * Format a value for CODE128 barcode
 * CODE128 is the industry standard for warehouse and logistics
 * Supports full ASCII character set (0-127)
 */
export const formatForCODE128 = (value: string): string => {
    // CODE128 supports alphanumeric and special characters
    // Remove any characters that might cause issues
    const cleaned = value.replace(/[^\x20-\x7E]/g, ''); // Keep only printable ASCII

    // If empty, use a default
    if (cleaned.length === 0) {
        return 'UNKNOWN';
    }

    // CODE128 works best with 6-20 characters for optimal scanning
    // Truncate if too long
    if (cleaned.length > 20) {
        return cleaned.substring(0, 20);
    }

    return cleaned;
};

/**
 * Generate a unique CODE128 barcode from SKU and unit number
 * Format: SKU-UNIT (e.g., "PROD123-001")
 */
export const generateCODE128FromSKU = (sku: string, unitNumber: number = 1): string => {
    // Clean the SKU
    const cleanSKU = sku.replace(/[^\x20-\x7E]/g, '').substring(0, 12);

    // Format unit number with leading zeros
    const unitPart = unitNumber.toString().padStart(3, '0');

    // Combine: SKU-UNIT
    return `${cleanSKU}-${unitPart}`;
};
