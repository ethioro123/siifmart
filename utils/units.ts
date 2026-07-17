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
    if (physicalType) {
        return `${product.size} ${physicalType}`.trim();
    }
    if (product.unit) {
        const unitDef = getSellUnit(product.unit);
        if (unitDef.category !== 'count') {
            return `${product.size} ${unitDef.shortLabel}`.trim();
        }
    }
    return `${product.size}`;
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
