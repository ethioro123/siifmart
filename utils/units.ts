// ══════════════════════════════════════════════════════════════════
// UNIT-OF-MEASURE SYSTEM
// Standardized selling units for grocery/retail operations
// ══════════════════════════════════════════════════════════════════

export interface SellUnit {
    code: string;
    label: string;
    shortLabel: string; // Compact label for POS/cart display
    allowDecimal: boolean;
    step: number; // Input step value (1 for integer, 0.01 for decimal)
    category: 'count' | 'weight' | 'volume';
    conversionBase?: string; // Base unit for auto-conversion (e.g., G -> KG)
    conversionFactor?: number; // e.g., 1000 (1000g = 1kg)
}

/**
 * Master list of selling units.
 * These are the units a product can be SOLD in at the point of sale.
 */
export const SELL_UNITS: SellUnit[] = [
    // ── COUNT-BASED (no decimals) ──
    {
        code: 'UNIT',
        label: 'Unit (Each)',
        shortLabel: 'ea',
        allowDecimal: false,
        step: 1,
        category: 'count',
    },
    {
        code: 'PACK',
        label: 'Pack',
        shortLabel: 'pk',
        allowDecimal: false,
        step: 1,
        category: 'count',
    },
    {
        code: 'DOZEN',
        label: 'Dozen',
        shortLabel: 'dz',
        allowDecimal: false,
        step: 1,
        category: 'count',
    },

    // ── WEIGHT-BASED (decimals allowed) ──
    {
        code: 'KG',
        label: 'Kilogram',
        shortLabel: 'kg',
        allowDecimal: true,
        step: 0.01,
        category: 'weight',
    },
    {
        code: 'G',
        label: 'Gram',
        shortLabel: 'g',
        allowDecimal: true,
        step: 1,
        category: 'weight',
        conversionBase: 'KG',
        conversionFactor: 1000,
    },

    // ── VOLUME-BASED (decimals allowed) ──
    {
        code: 'L',
        label: 'Litre',
        shortLabel: 'L',
        allowDecimal: true,
        step: 0.01,
        category: 'volume',
    },
    {
        code: 'ML',
        label: 'Millilitre',
        shortLabel: 'ml',
        allowDecimal: true,
        step: 1,
        category: 'volume',
        conversionBase: 'L',
        conversionFactor: 1000,
    },
];

/** All unit codes as a type */
export type SellUnitCode = typeof SELL_UNITS[number]['code'];

/** All valid unit code strings */
export const SELL_UNIT_CODES = SELL_UNITS.map(u => u.code);

/** Default unit when none is specified */
export const DEFAULT_UNIT: SellUnitCode = 'UNIT';

// ── Lookup Helpers ──

/** Get a SellUnit by its code. Falls back to UNIT if not found. */
export const getSellUnit = (code?: string | null): SellUnit => {
    if (!code) return SELL_UNITS[0];
    const normalized = code.toUpperCase().trim();
    // Handle legacy values from the old system
    const legacyMap: Record<string, string> = {
        'PCS': 'UNIT',
        'EA': 'UNIT',
        'EACH': 'UNIT',
        'PIECE': 'UNIT',
        'PIECES': 'UNIT',
        'KILOGRAM': 'KG',
        'KILOGRAMS': 'KG',
        'GRAM': 'G',
        'GRAMS': 'G',
        'LITRE': 'L',
        'LITER': 'L',
        'LITRES': 'L',
        'LITERS': 'L',
        'MILLILITRE': 'ML',
        'MILLILITER': 'ML',
        'MILLILITRES': 'ML',
        'MILLILITERS': 'ML',
        'CL': 'ML', // centilitres → ml (approximate for simplicity)
        'MG': 'G',  // milligrams → g (approximate for simplicity)
        'M': 'UNIT', // meters not relevant, default
        'CM': 'UNIT',
        'MM': 'UNIT',
    };
    const mapped = legacyMap[normalized] || normalized;
    return SELL_UNITS.find(u => u.code === mapped) || SELL_UNITS[0];
};

/** Check if a unit code allows decimal quantities */
export const isDecimalAllowed = (code?: string | null): boolean => {
    return getSellUnit(code).allowDecimal;
};

/** Check if a unit is weight-based (needs scale input at POS) */
export const isWeightBased = (code?: string | null): boolean => {
    return getSellUnit(code).category === 'weight';
};

/** Check if a unit is volume-based */
export const isVolumeBased = (code?: string | null): boolean => {
    return getSellUnit(code).category === 'volume';
};

/** Check if a unit needs a manual quantity prompt (weight or volume) */
export const needsQuantityPrompt = (code?: string | null): boolean => {
    const unit = getSellUnit(code);
    return unit.allowDecimal; // Any decimal unit needs manual entry
};

/**
 * Format a quantity with its unit for display.
 * e.g., formatQuantityWithUnit(1.25, 'KG') → "1.25 kg"
 * e.g., formatQuantityWithUnit(3, 'UNIT') → "3"
 * e.g., formatQuantityWithUnit(2, 'PACK') → "2 pk"
 */
export const formatQuantityWithUnit = (qty: number, code?: string | null): string => {
    const unit = getSellUnit(code);
    const formatted = unit.allowDecimal
        ? qty % 1 === 0 ? qty.toString() : qty.toFixed(2)
        : Math.floor(qty).toString();

    if (unit.code === 'UNIT') return formatted;
    return `${formatted} ${unit.shortLabel}`;
};

/**
 * Format a price with its unit for display.
 * e.g., formatPricePerUnit(355, 'KG', 'ETB') → "ETB 355/kg"
 * e.g., formatPricePerUnit(50, 'UNIT', 'ETB') → "ETB 50"
 */
export const formatPricePerUnit = (price: number, code?: string | null, currency?: string): string => {
    const unit = getSellUnit(code);
    const prefix = currency ? `${currency} ` : '';
    if (unit.code === 'UNIT') return `${prefix}${price.toLocaleString()}`;
    return `${prefix}${price.toLocaleString()}/${unit.shortLabel}`;
};

/**
 * Validate a quantity against its unit rules.
 * Returns null if valid, or an error message string.
 */
export const validateQuantity = (qty: number, code?: string | null): string | null => {
    const unit = getSellUnit(code);
    if (qty <= 0) return 'Quantity must be greater than 0';
    if (!unit.allowDecimal && qty !== Math.floor(qty)) {
        return `${unit.label} must be a whole number`;
    }
    return null;
};

/**
 * Clamp/round a quantity to match the unit's rules.
 * Decimal units get rounded to 2 decimal places.
 * Integer units get floored.
 */
export const normalizeQuantity = (qty: number, code?: string | null): number => {
    const unit = getSellUnit(code);
    if (!unit.allowDecimal) return Math.max(1, Math.floor(qty));
    return Math.max(unit.step, Math.round(qty * 100) / 100);
};

/**
 * Get grouped units for organized dropdowns.
 */
export const getGroupedUnits = () => ({
    count: SELL_UNITS.filter(u => u.category === 'count'),
    weight: SELL_UNITS.filter(u => u.category === 'weight'),
    volume: SELL_UNITS.filter(u => u.category === 'volume'),
});
