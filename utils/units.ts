// ══════════════════════════════════════════════════════════════════
// UNIT-OF-MEASURE SYSTEM
// Standardized selling units for grocery/retail operations
// ══════════════════════════════════════════════════════════════════

import { SELL_UNITS, legacyMap, SellUnit } from './units/unitDefinitions';

export { SELL_UNITS, legacyMap };
export type { SellUnit };

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
    const mapped = legacyMap[normalized] || normalized;
    return SELL_UNITS.find(u => u.code === mapped) || SELL_UNITS[0];
};

/** Check if a unit code allows decimal quantities */
export const isDecimalAllowed = (code?: string | null): boolean => {
    return getSellUnit(code).allowDecimal;
};

/** Check if a unit allows decimal quantities */
export const allowsDecimal = (code?: string | null): boolean => {
    return getSellUnit(code).allowDecimal;
};

/** Check if a unit is weight-based (sold by weight like kg, lb) */
export const isWeightBased = (code?: string | null): boolean => {
    return getSellUnit(code).category === 'weight';
};

/** Check if a unit is volume-based (sold by volume like L, ml, gal) */
export const isVolumeBased = (code?: string | null): boolean => {
    return getSellUnit(code).category === 'volume';
};

/** Check if a unit needs a manual quantity prompt (weight or volume) */
export const needsQuantityPrompt = (code?: string | null): boolean => {
    const unit = getSellUnit(code);
    return unit.allowDecimal; // Any decimal unit needs manual entry
};

/** Get the appropriate input step attribute for a unit */
export const getUnitStep = (code?: string | null): number => {
    return getSellUnit(code).step;
};

/**
 * Format a quantity with its unit for display.
 * e.g., formatQuantityWithUnit(1.25, 'KG') → "1.25 kg"
 */
export const formatQuantityWithUnit = (qty: number, code?: string | null): string => {
    const unit = getSellUnit(code);
    const formatted = unit.allowDecimal
        ? qty % 1 === 0 ? qty.toString() : qty.toFixed(2)
        : Math.floor(qty).toString();

    if (unit.code === 'UNIT') return formatted;
    return `${formatted} ${unit.shortLabel}`;
};

/** Format a quantity with its unit label */
export const formatUnitQty = (
    qty: number,
    unitCode?: string | null,
    options?: { showShortLabel?: boolean; formatDecimals?: boolean }
): string => {
    const unit = getSellUnit(unitCode);
    const label = options?.showShortLabel ? unit.shortLabel : unit.label;

    if (!unit.allowDecimal) {
        return `${Math.round(qty)} ${label}`;
    }

    if (options?.formatDecimals !== false) {
        const formatted = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
        return `${formatted} ${label}`;
    }

    return `${qty} ${label}`;
};

/** Format a price with its unit for display */
export const formatPricePerUnit = (price: number, code?: string | null, currency?: string): string => {
    const unit = getSellUnit(code);
    const prefix = currency ? `${currency} ` : '';
    if (unit.code === 'UNIT') return `${prefix}${price.toLocaleString()}`;
    return `${prefix}${price.toLocaleString()}/${unit.shortLabel}`;
};

/** Validate a quantity against its unit rules */
export const validateQuantity = (qty: number, code?: string | null): string | null => {
    const unit = getSellUnit(code);
    if (qty <= 0) return 'Quantity must be greater than 0';
    if (!unit.allowDecimal && qty !== Math.floor(qty)) {
        return `${unit.label} must be a whole number`;
    }
    return null;
};

/** Normalize/round quantity based on decimal permissions */
export const normalizeQuantity = (qty: number, code?: string | null): number => {
    const unit = getSellUnit(code);
    if (!unit.allowDecimal) return Math.max(1, Math.floor(qty));
    return Math.max(unit.step, Math.round(qty * 100) / 100);
};

/** Get grouped units for dropdown menus */
export const getGroupedUnits = () => ({
    count: SELL_UNITS.filter(u => u.category === 'count'),
    weight: SELL_UNITS.filter(u => u.category === 'weight'),
    volume: SELL_UNITS.filter(u => u.category === 'volume'),
});

/** Format a product size display string */
export const formatProductSize = (product?: { size?: string | number; unit?: string; customAttributes?: any; custom_attributes?: any } | null): string => {
    if (!product || product.size === undefined || product.size === null || product.size === '') return '';
    const customAttrs = product.customAttributes || product.custom_attributes;
    const physicalType = customAttrs?.physical?.sizeType || customAttrs?.physical?.unit || '';
    const sizeStr = String(product.size).trim();

    if (physicalType) {
        return sizeStr.toLowerCase().endsWith(physicalType.toLowerCase()) ? sizeStr : `${sizeStr}${physicalType}`.trim();
    }
    if (product.unit) {
        const unitDef = getSellUnit(product.unit);
        if (unitDef.category !== 'count') {
            return sizeStr.toLowerCase().endsWith(unitDef.shortLabel.toLowerCase()) ? sizeStr : `${sizeStr}${unitDef.shortLabel}`.trim();
        }
    }
    return sizeStr;
};

/**
 * Normalizes and extracts the effective package size multiplier.
 * E.g., if unit is 'KG' and size is '1000' (meaning 1000g), returns 1 (1 KG).
 */
export const getEffectivePackageSize = (unit?: string | null, rawSize?: string | number | null): number => {
    if (!rawSize) return 1;
    const parsed = typeof rawSize === 'number' ? rawSize : parseFloat(rawSize as string);
    if (isNaN(parsed) || parsed <= 0) return 1;

    const sellUnit = getSellUnit(unit);
    if ((sellUnit.code === 'KG' || sellUnit.code === 'L' || sellUnit.code === 'TON' || sellUnit.code === 'QTL' || sellUnit.code === 'GAL') && parsed >= 100) {
        return parsed / 1000;
    }

    return parsed;
};

// ── Stock Display Formatting ──

/**
 * The SINGLE authoritative function for formatting stock display across the entire app.
 *
 * RULE: Stock is ALWAYS a count of discrete items (ea, pk, case, box, etc.).
 * Physical size (400g, 5kg, 500ml) is shown in parentheses as a descriptor.
 * We NEVER display stock as raw weight/volume (e.g. "8,000 g" is WRONG for 20 packs of 400g).
 *
 * Examples:
 *   Buna Tea 400g   → "20 ea (400g)"
 *   Dalo Sugar 5kg  → "20 ea (5kg)"
 *   Vera Oil 1L     → "210 ea (1L)"
 *   Sha Onions KG   → "105 ea"         (no size attribute = just ea)
 *   Symphony Tissue  → "13 ea"          (no size = just ea)
 *   Case of 24 Coke  → "5 case"         (pack_quantity handled separately)
 */
export const formatStockDisplay = (
    stock: number,
    product?: { size?: string | number; unit?: string; packQuantity?: number; customAttributes?: any; custom_attributes?: any } | null,
    options?: { compact?: boolean }
): string => {
    const stockStr = stock.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (!product) return stockStr;

    const unitObj = getSellUnit(product.unit);
    const customAttrs = product.customAttributes || product.custom_attributes;
    const sellBy = customAttrs?.commercial?.sellBy || '';

    // Check if the product is sold as a loose bulk item (Weight/Volume without case pack size multiplier)
    const isLooseBulk = (unitObj.category === 'weight' || unitObj.category === 'volume') &&
        (!product.size || String(product.size) === '1' || String(product.size) === '0' || sellBy === 'Weight' || sellBy === 'Volume');

    if (isLooseBulk) {
        // Displays directly in volume/weight: e.g. "184.5 kg", "210 L", "42.1 kg"
        return `${stockStr} ${unitObj.shortLabel}`;
    }

    // Packaged / Case Pack Item (display as count + unit size in parentheses)
    const physSize = formatProductSize(product);
    let countLabel = 'ea';
    if (unitObj.category === 'count' && unitObj.code !== 'UNIT') {
        countLabel = unitObj.shortLabel;
    } else if (product.packQuantity && product.packQuantity > 1) {
        countLabel = 'pk';
    }

    if (options?.compact) {
        return `${stockStr} ${countLabel}`;
    }

    if (physSize && physSize.toLowerCase() !== countLabel.toLowerCase()) {
        return `${stockStr} ${countLabel} (${physSize})`;
    }
    return `${stockStr} ${countLabel}`;
};

// ── Smart Attribute Intelligence ──

export interface SmartUnitAttributes {
    inferredMode: 'count' | 'weight' | 'volume';
    baseQty: number;
    baseUnit: string;
    formattedNet: string;
    inKilos?: number;
    inLiters?: number;
    /** true when the sell unit itself IS the measurement (e.g. product.unit = "KG") */
    isLooseBulkUnit: boolean;
}

/** Round to at most 4 significant figures, stripping trailing zeros */
function smartRound(n: number): string {
    if (n === 0) return '0';
    if (Number.isInteger(n)) return String(n);
    const s = n.toPrecision(4).replace(/\.?0+$/, '');
    return s;
}

/**
 * Smartly infers and calculates unit weight/volume specifications from raw supplier product attributes.
 * Handles:
 *  - Embedded unit strings:  "400g" → 400 g → 0.4 kg
 *  - Explicit size + unit:   size=400, physUnit="G" → 0.4 kg
 *  - Loose bulk sell units:  unit="KG" → 1 unit = 1 kg = 1000 g
 *  - Volume:                 "500ml" → 0.5 L;  "1.5L" → 1500 ml
 */
export const getSmartUnitAttributes = (product?: { size?: string | number; unit?: string; customAttributes?: any; custom_attributes?: any } | null): SmartUnitAttributes => {
    if (!product) {
        return { inferredMode: 'count', baseQty: 1, baseUnit: 'ea', formattedNet: '', isLooseBulkUnit: false };
    }

    const customAttrs = product.customAttributes || product.custom_attributes;
    const phys = customAttrs?.physical || {};

    // ── Attempt to parse embedded unit from size string (e.g. "400g", "1.5L", "500ml") ──
    const rawSizeStr = String(product.size || phys.netWeight || phys.volume || '').trim();
    const embeddedMatch = rawSizeStr.match(/^([\d.,]+)\s*([a-zA-Z]+)$/);
    let parsedQty: number | null = null;
    let parsedUnit: string | null = null;
    if (embeddedMatch) {
        parsedQty = parseFloat(embeddedMatch[1].replace(',', '.'));
        parsedUnit = embeddedMatch[2].toUpperCase();
    }

    // ── Resolve the measurement unit (priority: embedded > phys.sizeType/unit > product.unit) ──
    const physUnit = (phys.sizeType || phys.unit || '').toUpperCase().trim();
    let rawUnit = (parsedUnit || physUnit || (product.unit || '').toUpperCase()).trim();
    const rawQty = parsedQty ?? (parseFloat(rawSizeStr) || 0);

    // When size is absent but the sell unit is a weight/volume unit, treat qty = 1 of that unit
    const sellUnitCode = (product.unit || '').toUpperCase().trim();
    const sellUnitDef = getSellUnit(sellUnitCode);
    const isLooseBulkUnit = !rawQty && (sellUnitDef.category === 'weight' || sellUnitDef.category === 'volume');
    const effectiveQty = isLooseBulkUnit ? 1 : rawQty || 1;
    const effectiveUnit = isLooseBulkUnit ? sellUnitCode : (rawUnit || sellUnitCode);

    const unitDef = getSellUnit(effectiveUnit);

    let inferredMode: 'count' | 'weight' | 'volume' = 'count';
    if (unitDef.category === 'weight' || ['KG', 'G', 'MG', 'LB', 'QTL'].includes(effectiveUnit)) {
        inferredMode = 'weight';
    } else if (unitDef.category === 'volume' || ['L', 'ML', 'GAL', 'OZ'].includes(effectiveUnit)) {
        inferredMode = 'volume';
    }

    let formattedNet = '';
    let inKilos: number | undefined;
    let inLiters: number | undefined;

    if (inferredMode === 'weight') {
        if (effectiveUnit === 'G') {
            inKilos = effectiveQty / 1000;
            formattedNet = `${effectiveQty} g = ${smartRound(inKilos)} kg`;
        } else if (effectiveUnit === 'KG') {
            inKilos = effectiveQty;
            formattedNet = `${smartRound(effectiveQty)} kg = ${smartRound(effectiveQty * 1000)} g`;
        } else if (effectiveUnit === 'MG') {
            inKilos = effectiveQty / 1_000_000;
            formattedNet = `${effectiveQty} mg = ${smartRound(effectiveQty / 1000)} g`;
        } else if (effectiveUnit === 'LB') {
            inKilos = effectiveQty * 0.453592;
            formattedNet = `${effectiveQty} lb = ${smartRound(inKilos)} kg`;
        } else {
            formattedNet = `${effectiveQty} ${effectiveUnit.toLowerCase()}`;
        }
    } else if (inferredMode === 'volume') {
        if (effectiveUnit === 'ML') {
            inLiters = effectiveQty / 1000;
            formattedNet = `${effectiveQty} ml = ${smartRound(inLiters)} L`;
        } else if (effectiveUnit === 'L') {
            inLiters = effectiveQty;
            formattedNet = `${smartRound(effectiveQty)} L = ${smartRound(effectiveQty * 1000)} ml`;
        } else if (effectiveUnit === 'GAL') {
            inLiters = effectiveQty * 3.78541;
            formattedNet = `${effectiveQty} gal = ${smartRound(inLiters)} L`;
        } else {
            formattedNet = `${effectiveQty} ${effectiveUnit.toLowerCase()}`;
        }
    }

    return {
        inferredMode,
        baseQty: effectiveQty,
        baseUnit: effectiveUnit || 'ea',
        formattedNet,
        inKilos,
        inLiters,
        isLooseBulkUnit,
    };
};
