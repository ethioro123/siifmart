/**
 * Sequential SKU Generator with Category Prefix
 * 
 * Generates unique, never-repeating SKUs in the format: [CATEGORY]-[NUMBER]
 * Examples: BK-0001 (Bakery), GN-0002 (General), DY-0003 (Dairy)
 * 
 * The generator queries the database for the highest existing SKU per category
 * and increments from there.
 */

import { supabase } from '../lib/supabase';

/**
 * Category prefix mapping
 * Maps category names to 2-letter prefixes
 */
const CATEGORY_PREFIXES: Record<string, string> = {
    // Food & Grocery
    'Bakery': 'BK',
    'Dairy': 'DY',
    'Meat': 'MT',
    'Seafood': 'SF',
    'Fruits': 'FR',
    'Vegetables': 'VG',
    'Frozen': 'FZ',
    'Beverages': 'BV',
    'Snacks': 'SN',
    'Condiments': 'CD',
    'Canned Goods': 'CN',
    'Pasta & Rice': 'PR',
    'Cereals': 'CR',
    'Baby Food': 'BB',
    'Pet Food': 'PF',

    // Household
    'Cleaning': 'CL',
    'Laundry': 'LR',
    'Paper Products': 'PP',
    'Kitchen': 'KT',
    'Storage': 'ST',

    // Personal Care
    'Health': 'HL',
    'Beauty': 'BT',
    'Personal Care': 'PC',
    'Oral Care': 'OC',

    // Other
    'Electronics': 'EL',
    'Office': 'OF',
    'Seasonal': 'SS',
    'General': 'GN',
    'Miscellaneous': 'MS',
};

/**
 * Get the 2-letter prefix for a category
 */
export function getCategoryPrefix(category: string): string {
    // Check direct match
    if (CATEGORY_PREFIXES[category]) {
        return CATEGORY_PREFIXES[category];
    }

    // Check case-insensitive match
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_PREFIXES)) {
        if (key.toLowerCase() === lowerCategory) {
            return value;
        }
    }

    // Generate prefix from first 2 letters of category
    const cleanCategory = category.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return cleanCategory.substring(0, 2) || 'GN';
}

/**
 * Parse a category-based SKU into its components
 */
function parseSKU(sku: string): { prefix: string; number: number } | null {
    // Match format: XX-0001 or XX0001
    const match = sku.match(/^([A-Z]{2})-?(\d{4,})$/);
    if (!match) return null;
    return {
        prefix: match[1],
        number: parseInt(match[2], 10)
    };
}

/**
 * Get the highest existing SKU number for a category prefix
 */
async function getHighestSKUForPrefix(prefix: string): Promise<number> {
    try {
        // Query all SKUs that start with this prefix
        const { data, error } = await supabase
            .from('products')
            .select('sku')
            .ilike('sku', `${prefix}-%`)
            .order('sku', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching SKUs:', error);
            return 0;
        }

        // Find the highest number
        let maxNumber = 0;
        for (const row of data || []) {
            const parsed = parseSKU(row.sku);
            if (parsed && parsed.prefix === prefix && parsed.number > maxNumber) {
                maxNumber = parsed.number;
            }
        }

        return maxNumber;
    } catch (err) {
        console.error('Failed to get highest SKU:', err);
        return 0;
    }
}

/**
 * Generate a new unique sequential SKU for a category
 * 
 * @param category - The product category (e.g., "Bakery", "General")
 * @returns Promise<string> - The next SKU in sequence (e.g., "BK-0001", "GN-0042")
 */
export async function generateSequentialSKU(category: string = 'General'): Promise<string> {
    const prefix = getCategoryPrefix(category);
    const highestNumber = await getHighestSKUForPrefix(prefix);
    const nextNumber = highestNumber + 1;

    const newSku = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
    console.log(`📦 Generated SKU: ${newSku} (category: ${category})`);

    return newSku;
}

/**
 * Validate if a string is a valid category-based SKU
 */
export function isValidSequentialSKU(sku: string): boolean {
    return parseSKU(sku) !== null;
}

/**
 * Get or generate SKU for a product
 * - If product has an existing valid SKU, return it
 * - Otherwise, generate a new sequential SKU for the category
 */
export async function getOrGenerateSKU(
    category: string = 'General',
    existingProduct?: { sku?: string }
): Promise<string> {
    if (existingProduct?.sku && existingProduct.sku.trim() !== '' &&
        existingProduct.sku !== 'MISC' && existingProduct.sku !== 'N/A') {
        // Use existing SKU
        return existingProduct.sku;
    }

    // Generate new sequential SKU with category prefix
    return generateSequentialSKU(category);
}
