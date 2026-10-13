
/**
 * Live Inventory SKU Generation Utility
 * 
 * Generates unique SKUs by checking the LIVE inventory list.
 * Eliminates risk of localStorage synchronization issues.
 * 
 * Format: [CATEGORY_PREFIX][SEQUENTIAL_NUMBER] (e.g. GN019, BV003)
 */

import type { Country } from './localization';

// Category to SKU prefix mapping
const CATEGORY_PREFIXES: Record<string, string> = {
    // Fresh Food & Deli
    'Fruit & Vegetables': 'FR',
    'Dairy, Eggs & Fridge': 'DY',
    'Meat & Poultry': 'MT',
    'Seafood': 'SF',
    'Bakery & Bread': 'BK',
    'Deli & Prepared Meals': 'DL',

    // Pantry & Groceries
    'Snacks & Confectionery': 'SN',
    'Baking & Dessert Needs': 'BA',
    'Grains, Pasta & Rice': 'GR',
    'Sauces, Oils & Condiments': 'SA',
    'Canned Food & Soups': 'CN',
    'Breakfast & Cereals': 'BF',
    'Tea, Coffee & Cocoa': 'TE',
    'Drinks & Beverages': 'BV',

    // Frozen Food
    'Frozen Meals & Sides': 'FZ',
    'Frozen Vegetables & Fruit': 'FZ',
    'Ice Cream & Desserts': 'IC',

    // Baby & Toddler
    'Baby Food & Formula': 'BB',
    'Nappies, Wipes & Toiletries': 'BB',

    // Health & Beauty
    'Dental & Oral Care': 'DN',
    'Hair & Body Care': 'HB',
    'Cosmetics & Skin Care': 'CS',
    'Vitamins & Supplements': 'VT',
    'Pharmacy & First Aid': 'PH',

    // Household & Cleaning
    'Laundry & Dishwashing': 'LD',
    'Cleaning Products & Tools': 'CL',
    'Tissues, Paper & Foils': 'TS',
    'Pest Control & Garden Care': 'GD',

    // Pet Supplies
    'Dog Food & Accessories': 'PT',
    'Cat Food & Accessories': 'PT',
    'Small Pet Supplies': 'PT',

    // General Merchandise & Apparel
    'Stationery, Office & Books': 'ST',
    'Electronics & Batteries': 'EL',
    'Homewares, Kitchen & Dining': 'HM',
    'Clothing & Accessories': 'CG',
    'Toys & Recreation': 'TY',

    // Fallbacks & legacy
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
 * @param country - Optional country code (e.g. 'ET', 'KE', 'UG') for country-prefixed SKU
 */
export function generateSKU(
    category: string = 'General',
    existingProducts: Array<{ sku?: string; country?: string }> = [],
    preferredSku?: string,
    country?: Country
): string {
    // 1. Use Preferred/Existing if valid
    if (preferredSku && isValidSKU(preferredSku)) {
        return preferredSku.trim().toUpperCase().replace(/[-\s]/g, '');
    }

    // 2. Determine Category and Country Prefix (Clean unhyphenated format, e.g. KECN or ETCN)
    const catPrefix = getCategoryPrefix(category);
    const countryPrefix = country ? `${country.toUpperCase()}` : '';
    const fullPrefix = `${countryPrefix}${catPrefix}`;

    // 3. Find Max Sequence from Live Data (normalizing both unhyphenated & legacy hyphenated)
    let maxSequence = 0;

    existingProducts.forEach(p => {
        if (!p.sku) return;
        const normalized = p.sku.trim().toUpperCase().replace(/[-\s]/g, '');

        if (fullPrefix && normalized.startsWith(fullPrefix)) {
            const remainder = normalized.slice(fullPrefix.length);
            const num = parseInt(remainder, 10);
            if (!isNaN(num) && num > maxSequence) {
                maxSequence = num;
            }
        } else if (!country && normalized.startsWith(catPrefix)) {
            const remainder = normalized.slice(catPrefix.length);
            const num = parseInt(remainder, 10);
            if (!isNaN(num) && num > maxSequence) {
                maxSequence = num;
            }
        }
    });

    // 4. Generate Next (Max + 1)
    return `${fullPrefix}${padNumber(maxSequence + 1, 3)}`;
}

/**
 * Validate if a SKU has the correct format
 * Supports both clean sovereign format (KECN001, ETFR001, FR001) and legacy hyphenated format
 */
export function isValidSKU(sku: string): boolean {
    if (!sku || typeof sku !== 'string') return false;

    const trimmed = sku.trim().toUpperCase();
    if (trimmed === '') return false;

    // Accept: [OPTIONAL_COUNTRY_PREFIX][CATEGORY_PREFIX][DIGITS] or legacy hyphenated
    const skuPattern = /^([A-Z]{2,3}-?)?[A-Z]{2,4}-?\d{3,5}$/;
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
 * Helper to extract category from SKU (stripping country prefix and hyphens)
 */
export function extractCategoryFromSKU(sku: string): string | null {
    if (!isValidSKU(sku)) return null;

    let cleaned = sku.trim().toUpperCase().replace(/[-\s]/g, '');

    // Check if starts with a known country prefix (ET, KE, UG, RW, TZ, SO, SS, DJ)
    const countryPrefixes = ['ET', 'KE', 'UG', 'RW', 'TZ', 'SO', 'SS', 'DJ'];
    for (const cp of countryPrefixes) {
        if (cleaned.startsWith(cp) && cleaned.length >= 4) {
            const potentialPrefix = cleaned.substring(cp.length, cp.length + 2);
            for (const [category, categoryPrefix] of Object.entries(CATEGORY_PREFIXES)) {
                if (categoryPrefix === potentialPrefix) {
                    return category;
                }
            }
        }
    }

    // Direct 2-letter category prefix (e.g. FR001)
    const prefix = cleaned.substring(0, 2);
    for (const [category, categoryPrefix] of Object.entries(CATEGORY_PREFIXES)) {
        if (categoryPrefix === prefix) {
            return category;
        }
    }

    return null;
}

/**
 * Async sequential SKU generator.
 * Uses atomic server-side RPC next_sku() to eliminate race conditions and collisions across concurrent users.
 * Gracefully falls back to client-side generation if offline or RPC is unavailable.
 */
export async function generateSequentialSKU(
    category: string = 'General',
    existingProducts?: Array<{ sku?: string; country?: string }>,
    country?: Country
): Promise<string> {
    const catPrefix = getCategoryPrefix(category);

    // 1. Primary: Use atomic server sequence if country is defined
    if (country) {
        try {
            const { issueSku } = await import('../services/products/product-master.service');
            const atomicSku = await issueSku(country, catPrefix);
            if (atomicSku) return atomicSku;
        } catch {
            // Fallback to client sequence if RPC fails or migration not applied
        }
    }

    // 2. Fallback: If products already provided in memory, compute next client-side
    if (existingProducts && existingProducts.length > 0) {
        return generateSKU(category, existingProducts, undefined, country);
    }

    // 3. Fallback: Fetch latest matching SKUs from Supabase
    try {
        const { supabase } = await import('../lib/supabase');
        const countryPrefix = country ? country.toUpperCase() : '';
        const searchPrefix = `${countryPrefix}${catPrefix}`;
        const { data } = await supabase
            .from('products')
            .select('sku')
            .or(`sku.ilike.${searchPrefix}%,sku.ilike.${catPrefix}%`)
            .order('sku', { ascending: false })
            .limit(100);

        return generateSKU(category, (data || []) as Array<{ sku?: string }>, undefined, country);
    } catch {
        // Ultimate fallback: generate initial 001
        return generateSKU(category, [], undefined, country);
    }
}
