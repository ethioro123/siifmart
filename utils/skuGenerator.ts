
/**
 * Live Inventory SKU Generation Utility
 * 
 * Generates unique SKUs by checking the LIVE inventory list.
 * Eliminates risk of localStorage synchronization issues.
 * 
 * Format: [CATEGORY_PREFIX]-[SEQUENTIAL_NUMBER]
 */

// Category to SKU prefix mapping
const CATEGORY_PREFIXES: Record<string, string> = {
    'Electronics': 'EL',
    'Beverages': 'BV',
    'Food': 'FD',
    'Fresh': 'FR',
    'Accessories': 'AC',
    'Clothing': 'CL',
    'Health': 'HL',
    'Beauty': 'BT',
    'Home': 'HM',
    'Sports': 'SP',
    'Toys': 'TY',
    'Books': 'BK',
    'Stationery': 'ST',
    'Furniture': 'FN',
    'Garden': 'GD',
    'Automotive': 'AU',
    'Pet': 'PT',
    'Baby': 'BB',
    'Tools': 'TL',
    'General': 'GN',
    // Fallback for unknown categories
    'Other': 'OT'
};

/**
 * Format number with leading zeros
 */
function padNumber(num: number, width: number = 3): string {
    return num.toString().padStart(width, '0');
}

/**
 * Get category prefix for a given category name
 */
export function getCategoryPrefix(category: string): string {
    // Exact match
    if (CATEGORY_PREFIXES[category]) {
        return CATEGORY_PREFIXES[category];
    }

    // Case-insensitive match
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_PREFIXES)) {
        if (key.toLowerCase() === lowerCategory) {
            return value;
        }
    }

    // Fallback to General or first 2 letters
    if (category && category.length >= 2) {
        return category.substring(0, 2).toUpperCase();
    }

    return 'GN'; // General fallback
}

/**
 * Generate a new SKU based on LIVE product data
 * 
 * @param category - Product category
 * @param existingProducts - Array of ALL existing products to check against
 * @param preferredSku - Optional preferred SKU (e.g. from PO or input)
 */
export function generateSKU(
    category: string = 'General',
    existingProducts: Array<{ sku?: string }> = [],
    preferredSku?: string
): string {
    // 1. Use Preferred/Existing if valid
    if (preferredSku && isValidSKU(preferredSku)) {
        return preferredSku.trim().toUpperCase();
    }

    // 2. Determine Prefix
    const prefix = getCategoryPrefix(category);

    // 3. Find Max Sequence from Live Data
    let maxSequence = 0;

    // Check existing products to find highest number for this prefix
    existingProducts.forEach(p => {
        if (!p.sku) return;
        const normalized = p.sku.trim().toUpperCase();

        // Check if SKU matches current prefix pattern (PREFIX-NUMBER)
        if (normalized.startsWith(prefix + '-')) {
            const parts = normalized.split('-');
            // Ensure format is exactly PREFIX-NUMBER
            if (parts.length === 2 && parts[0] === prefix) {
                const num = parseInt(parts[1], 10);
                if (!isNaN(num) && num > maxSequence) {
                    maxSequence = num;
                }
            }
        }
    });

    // 4. Generate Next (Max + 1)
    return `${prefix}-${padNumber(maxSequence + 1, 3)}`;
}

/**
 * Validate if a SKU has the correct format
 */
export function isValidSKU(sku: string): boolean {
    if (!sku || typeof sku !== 'string') return false;

    const trimmed = sku.trim();
    if (trimmed === '') return false;

    // Accept format: XX-XXX or XXX-XXXX (2-4 letter prefix, 3-5 digit number)
    const skuPattern = /^[A-Z]{2,4}-\d{3,5}$/;
    return skuPattern.test(trimmed);
}

/**
 * Deprecated: No longer needed as we check live inventory.
 * Kept for code compatibility.
 */
export function registerExistingSKU(sku: string): void {
    // No-op
}

/**
 * Helper to extract category from SKU
 */
export function extractCategoryFromSKU(sku: string): string | null {
    if (!isValidSKU(sku)) return null;

    const prefix = sku.split('-')[0];

    // Find matching category
    for (const [category, categoryPrefix] of Object.entries(CATEGORY_PREFIXES)) {
        if (categoryPrefix === prefix) {
            return category;
        }
    }

    return null;
}
