import { Building, Wheat, User, ShoppingBag, Truck } from 'lucide-react';
import { SupplierType } from '../../types';

export const getSupplierIcon = (type: SupplierType) => {
    switch (type) {
        case 'Business': return Building;
        case 'Farmer': return Wheat;
        case 'Individual': return User;
        case 'One-Time': return ShoppingBag;
        default: return Truck;
    }
};

export {
    CATEGORY_ATTRIBUTES,
    getCategoryAttributes,
    PRODUCT_CATEGORIES,
    isConsumableCategory,
    isDiscreteGeneralMerch,
    NET_CONTENT_UNITS,
    getCategorySpecGroup,
    getPOItemCategorySpecsSummary,
    type CategorySpecGroup,
    type CategoryAttributeField,
    type POItemCategorySpecsSummary
} from './categoryAttributes';
import { isDiscreteGeneralMerch, isConsumableCategory } from './categoryAttributes';

// Re-export the new structured unit system
export { SELL_UNITS, getSellUnit, isDecimalAllowed, needsQuantityPrompt, getGroupedUnits, formatQuantityWithUnit, formatPricePerUnit, validateQuantity, normalizeQuantity } from '../../utils/units';
import { SELL_UNITS, getSellUnit } from '../../utils/units';

// Backward compatibility — old code referencing UNIT_TYPES gets the code strings
export const UNIT_TYPES = SELL_UNITS.map(u => u.code);

export const PACKAGE_TYPES = [
    'Bale', 'Carton', 'Case', 'Box', 'Bag', 'Sack', 'Bundle', 'Pouch', 'Bottle', 'Can', 'Jar', 'Multipack', 'Tray', 'Wrap', 'Crate', 'Drum', 'Keg'
];

export const STORAGE_CONDITIONS = [
    'Ambient (Dry)', 'Chilled (Refrigerated)', 'Frozen', 'Heated', 'Hazardous'
];

/**
 * Infers bulk packaging multipliers and package types when packaging metadata
 * is missing from older PO items or unmigrated database records (e.g. Flour bales, Drink cases).
 */
export const inferBulkPackaging = (item: any): { unitsPerOrderUnit: number; packageType: string } => {
    if (!item) return { unitsPerOrderUnit: 1, packageType: '' };

    const name = (item.productName || item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const text = `${name} ${desc}`;
    const unitCost = Number(item.unitCost || item.costPrice || 0);
    const retailPrice = Number(item.retailPrice || item.price || 0);
    const explicitPkgType = (item.packageType || item.package_type || item.customAttributes?.packaging?.packageType || item.custom_attributes?.packaging?.packageType || '').trim();

    // 1. Check explicit package type or text mentions
    if (explicitPkgType === 'Bale' || text.includes('bale')) {
        return { unitsPerOrderUnit: 12, packageType: 'Bale' };
    }

    // 2. Pattern match in name/desc: e.g. "12x1kg", "12 pk", "24 cans", "case of 24", "24x"
    const packPattern = /(?:bale|case|carton|box|pack|crate)\s*(?:of)?\s*(\d+)/i.exec(text) ||
                        /(\d+)\s*(?:x|×|\*)\s*(?:\d+(?:\.\d+)?\s*(?:kg|g|l|ml|pk|pcs|bags|cans|bottles|packets)?)?/i.exec(text) ||
                        /(\d+)\s*(?:pk|pcs|bottles|cans|bags|packets)\b/i.exec(text);

    if (packPattern && parseInt(packPattern[1]) > 1) {
        const inferredUnits = parseInt(packPattern[1]);
        const inferredType = explicitPkgType || (text.includes('bale') ? 'Bale' : text.includes('crate') ? 'Crate' : text.includes('carton') ? 'Carton' : 'Case');
        return { unitsPerOrderUnit: inferredUnits, packageType: inferredType };
    }

    // 3. FMCG grocery heuristic: unitCost >> retailPrice
    // When wholesale unit cost is multiple times higher than the single-unit retail price,
    // the ordered unit is a bulk bundle/bale/case (e.g., Ugali flour cost KSh 4,200 vs retail KSh 400).
    if (unitCost > 0 && retailPrice > 0 && unitCost >= retailPrice * 1.5) {
        const isGrainOrFlour = text.includes('flour') || text.includes('ugali') || text.includes('grain') || text.includes('sugar') || text.includes('maize');
        const isBeverage = text.includes('drink') || text.includes('soda') || text.includes('juice') || text.includes('water') || text.includes('can') || text.includes('bottle');
        const marginFactor = isBeverage ? 0.80 : 0.85;
        const estimatedPacks = Math.round(unitCost / (retailPrice * marginFactor));
        const standardMultiples = isBeverage ? [6, 12, 24, 48] : isGrainOrFlour ? [10, 12, 20, 24] : [6, 10, 12, 20, 24, 48];
        let bestMatch = standardMultiples[0];
        let minDiff = Math.abs(estimatedPacks - bestMatch);
        for (const m of standardMultiples) {
            const diff = Math.abs(estimatedPacks - m);
            if (diff < minDiff) {
                minDiff = diff;
                bestMatch = m;
            }
        }
        if (Math.abs(estimatedPacks - bestMatch) <= 4) {
            const pkgType = isGrainOrFlour ? 'Bale' : isBeverage ? 'Carton' : 'Case';
            return { unitsPerOrderUnit: bestMatch, packageType: pkgType };
        }
    }

    return { unitsPerOrderUnit: 1, packageType: explicitPkgType || '' };
};

/**
 * Converts PO order quantity to sellable units.
 * 
 * Example: Order 12 bales of Juma Ugali Flour (12 packets per bale)
 *   → 12 × 12 = 144 sellable units
 * 
 * Example: Order 5 cases of Coke (24 bottles per case)
 *   → 5 × 24 = 120 sellable units
 */
export const convertToSellableUnits = (orderQty: number, item: any): number => {
    if (!item || !orderQty) return orderQty || 0;

    const attrs = item.customAttributes || item.custom_attributes;
    const packQty = parseInt(attrs?.packaging?.packQty || '0') || item.packQuantity || item.pack_quantity || 0;
    const caseSize = parseInt(attrs?.packaging?.caseSize || '0') || item.caseSize || item.case_size || 0;

    // Step 1: Pack / Case Multipliers (for count-based selling, or general discrete items)
    const hasCases = caseSize >= 1;
    const hasPacks = packQty > 1 && !hasCases;
    let unitsPerOrderUnit = hasCases ? caseSize * (packQty || 1) : hasPacks ? packQty : (item.packQuantity && item.packQuantity > 1 ? item.packQuantity : 1);

    if (unitsPerOrderUnit <= 1) {
        const inferred = inferBulkPackaging(item);
        if (inferred.unitsPerOrderUnit > 1) {
            unitsPerOrderUnit = inferred.unitsPerOrderUnit;
        }
    }

    if (unitsPerOrderUnit > 1) {
        return orderQty * unitsPerOrderUnit;
    }

    // Step 2: Size-based conversion ONLY for products explicitly sold by Weight or Volume (e.g. bulk walnuts sold by kg)
    const sizeValue = parseFloat(item.size || attrs?.packaging?.unitSize || '0');
    const sizeType = (attrs?.physical?.sizeType || attrs?.physical?.unit || '').toLowerCase().trim();
    const sellUnit = (item.unit || attrs?.commercial?.sellUnit || '').toUpperCase().trim();
    const sellBy = attrs?.commercial?.sellBy || (['KG', 'G', 'L', 'ML'].includes(sellUnit) ? (['KG', 'G'].includes(sellUnit) ? 'Weight' : 'Volume') : 'Unit');

    if ((sellBy === 'Weight' || sellBy === 'Volume') && sizeValue > 0 && sizeType) {
        let sizeInBase = sizeValue;
        let sizeCategory = '';
        if (['kg', 'kilogram', 'kilograms', 'kgs'].includes(sizeType)) { sizeInBase = sizeValue * 1000; sizeCategory = 'weight'; }
        else if (['g', 'gram', 'grams', 'gr'].includes(sizeType)) { sizeInBase = sizeValue; sizeCategory = 'weight'; }
        else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt'].includes(sizeType)) { sizeInBase = sizeValue * 1000; sizeCategory = 'volume'; }
        else if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(sizeType)) { sizeInBase = sizeValue; sizeCategory = 'volume'; }

        let sellInBase = 1;
        let sellCategory = '';
        if (sellUnit === 'KG') { sellInBase = 1000; sellCategory = 'weight'; }
        else if (sellUnit === 'G') { sellInBase = 1; sellCategory = 'weight'; }
        else if (sellUnit === 'L') { sellInBase = 1000; sellCategory = 'volume'; }
        else if (sellUnit === 'ML') { sellInBase = 1; sellCategory = 'volume'; }

        if (sizeCategory && sizeCategory === sellCategory && ['KG', 'G', 'L', 'ML'].includes(sellUnit)) {
            const sellUnitsPerPackage = sizeInBase / sellInBase;
            return orderQty * sellUnitsPerPackage;
        }
    }

    return orderQty;
};

export interface POItemPackagingSummary {
    /** Total quantity in sellable consumer units (e.g. 144 packets, 12 kg) */
    sellableQty: number;
    /** Sellable unit definition (shortLabel like "pk", "kg", "ea", "L") */
    sellUnitLabel: string;
    /** Full sellable unit label (e.g. "Pack / Packet", "Kilogram") */
    sellUnitFullName: string;
    /** Manifest order quantity (e.g. 12) */
    manifestQty: number;
    /** Manifest order unit name (e.g. "Cases", "Bales", "Packs", "Units") */
    manifestUnitName: string;
    /** Formatted packaging description badge, e.g. "12 pk/Bale", "24 cans/case (Carton)", "1kg Bag" */
    packBadge: string | null;
    /** Detailed side text, e.g. "12 Bales × 12 pk" */
    packDetail: string;
    /** True if packaging multiplier > 1 (e.g. ordered in cases/bales/packs) */
    hasMultiplier: boolean;
    /** Units per manifest order unit (e.g. 12 or 24) */
    unitsPerOrderUnit: number;
    /** Effective cost per sellable unit */
    costPerSellableUnit: number;
}

export const getPOItemPackagingSummary = (item: any, allProducts?: any[]): POItemPackagingSummary => {
    const matchedProduct = allProducts?.find(p => (item.productId && p.id === item.productId) || (item.sku && p.sku === item.sku) || (item.productName && p.name === item.productName));
    const attrs = item.customAttributes || item.custom_attributes || matchedProduct?.customAttributes || (matchedProduct as any)?.custom_attributes;
    
    let packQty = parseInt(attrs?.packaging?.packQty || '0') || item.packQuantity || item.pack_quantity || matchedProduct?.packQuantity || (matchedProduct as any)?.pack_quantity || 0;
    const caseSize = parseInt(attrs?.packaging?.caseSize || '0') || item.caseSize || item.case_size || 0;
    let packageType = (attrs?.packaging?.packageType || item.packageType || item.package_type || '').trim();

    // Heuristic inference when packaging is missing:
    if (packQty <= 1 && caseSize <= 0) {
        const inferred = inferBulkPackaging(item);
        if (inferred.unitsPerOrderUnit > 1) {
            packQty = inferred.unitsPerOrderUnit;
            if (!packageType) packageType = inferred.packageType;
        }
    }

    if (!packageType) {
        packageType = caseSize >= 1 ? 'Case' : packQty > 1 ? 'Pack' : '';
    }
    
    const unitCode = item.unit || attrs?.commercial?.sellUnit || matchedProduct?.unit || 'UNIT';
    const sellUnitObj = getSellUnit(unitCode);
    const sellUnitLabel = sellUnitObj.shortLabel || 'ea';
    const sellUnitFullName = sellUnitObj.label || 'Unit';

    const hasCases = caseSize >= 1;
    const hasPacks = packQty > 1 && !hasCases;
    const unitsPerOrderUnit = hasCases ? caseSize * (packQty || 1) : hasPacks ? packQty : (item.packQuantity && item.packQuantity > 1 ? item.packQuantity : 1);
    const hasMultiplier = unitsPerOrderUnit > 1;

    const manifestQty = item.quantity || 0;
    const sellableQty = convertToSellableUnits(manifestQty, item);

    // Determine human-readable manifest unit name
    let manifestUnitName = 'Units';
    if (packageType) {
        manifestUnitName = manifestQty === 1 ? packageType : `${packageType}s`;
    } else if (hasCases) {
        manifestUnitName = manifestQty === 1 ? 'Case' : 'Cases';
    } else if (hasPacks) {
        manifestUnitName = manifestQty === 1 ? 'Pack' : 'Packs';
    }

    // Determine packBadge (e.g. "12 pk/Bale", "24 cans/case (Carton)", "Single Unit (1 ea)")
    let packBadge: string | null = null;
    if (packageType && packQty > 1 && caseSize >= 1) {
        packBadge = `${packQty} ${sellUnitLabel} × ${caseSize} pk/${packageType}`;
    } else if (packageType && unitsPerOrderUnit > 1) {
        packBadge = `${unitsPerOrderUnit} ${sellUnitLabel}/${packageType}`;
    } else if (unitsPerOrderUnit > 1) {
        packBadge = `${unitsPerOrderUnit} ${sellUnitLabel}/pack`;
    } else {
        // Multiplier is 1 (Single Consumer Unit / Each)
        const category = item.category || attrs?.identity?.category || matchedProduct?.category || '';
        const isConsumable = isConsumableCategory(category);
        const rawSize = (item.size || attrs?.physical?.netWeight || matchedProduct?.size || '').toString().trim();
        const sizeUnit = (attrs?.physical?.sizeType || attrs?.physical?.unit || '').toString().trim();
        const hasExplicitUnit = /[a-zA-Z]/.test(rawSize) || Boolean(sizeUnit);

        if (packageType && isConsumable && hasExplicitUnit) {
            const formattedSize = /[a-zA-Z]/.test(rawSize) ? rawSize : `${rawSize}${sizeUnit}`;
            packBadge = `${formattedSize} ${packageType}`;
        } else if (packageType) {
            packBadge = `${packageType} (1 ${sellUnitLabel})`;
        } else {
            packBadge = `Single Unit (1 ${sellUnitLabel})`;
        }
    }

    // Determine detailed side text (e.g. "12 Bales × 12 pk" or "100 Units (1 ea each)")
    let packDetail = '';
    if (hasCases && packQty > 1) {
        packDetail = `${manifestQty} ${manifestUnitName} (${caseSize} packs × ${packQty} ${sellUnitLabel})`;
    } else if (hasMultiplier) {
        packDetail = `${manifestQty} ${manifestUnitName} (${unitsPerOrderUnit} ${sellUnitLabel}/${manifestUnitName.replace(/s$/, '').toLowerCase()})`;
    } else {
        packDetail = `${manifestQty} ${manifestUnitName} (1 ${sellUnitLabel} each)`;
    }

    const costPerSellableUnit = unitsPerOrderUnit > 1 && item.unitCost
        ? item.unitCost / unitsPerOrderUnit
        : (item.unitCost || 0);

    return {
        sellableQty,
        sellUnitLabel,
        sellUnitFullName,
        manifestQty,
        manifestUnitName,
        packBadge,
        packDetail,
        hasMultiplier,
        unitsPerOrderUnit,
        costPerSellableUnit
    };
};

export {
    getPOItemPhysicalSummary,
    type POItemPhysicalSummary
} from './physicalUtils';

export const formatPOItemDescription = (item: any) => {
    const rawBrand = (item.brand || item.customAttributes?.identity?.brand || '').trim();
    const rawName = (item.productName || item.name || '').trim();
    const variant = (item.customAttributes?.identity?.variant || item.custom_attributes?.identity?.variant || '').trim();
    const category = (item.category || item.customAttributes?.identity?.category || '').trim();

    // Check if category is non-consumable / discrete merchandise where net weight is a physical spec, not product title
    const isDiscrete = isDiscreteGeneralMerch(category);

    const physicalWeight = item.customAttributes?.physical?.netWeight || item.custom_attributes?.physical?.netWeight || item.size;
    const physicalType = item.customAttributes?.physical?.sizeType || item.custom_attributes?.physical?.sizeType ||
                         item.customAttributes?.physical?.unit || item.custom_attributes?.physical?.unit ||
                         (item.unit && !['UNIT', 'PACK', 'DOZEN', 'EA', 'PCS'].includes(item.unit.toUpperCase().trim()) ? item.unit : '');

    const parts: string[] = [];
    if (rawBrand && !rawName.toLowerCase().startsWith(rawBrand.toLowerCase())) {
        parts.push(rawBrand);
    }
    parts.push(rawName);

    if (variant) {
        parts.push(variant);
    }

    // Only append physical weight for food/beverages/consumables where size distinguishes SKU,
    // and ONLY if not already in the name and not discrete general merchandise (like Kindle, Phones, Electronics)
    if (physicalWeight && !isDiscrete) {
        const sizeUnit = `${physicalWeight}${physicalType}`;
        const normalizedName = rawName.replace(/\s+/g, '').toLowerCase();
        const normalizedSizeUnit = sizeUnit.replace(/\s+/g, '').toLowerCase();
        if (!normalizedName.includes(normalizedSizeUnit)) {
            parts.push(sizeUnit);
        }
    }

    // NOTE: Pack/case info is intentionally NOT appended to the name string.
    // Use formatPackBadge() to render pack size as a separate UI chip/badge.
    return parts.filter(Boolean).join(' ');
};

/**
 * Returns a compact pack/case label for rendering as a badge/chip, e.g.:
 *   "12 pk/Bale"
 *   "6 units/pack"
 *   "4 packs/case"
 *   "6 units × 4 packs"
 */
export const formatPackBadge = (item: {
    packQuantity?: number;
    pack_quantity?: number;
    caseSize?: number;
    case_size?: number;
    packageType?: string;
    package_type?: string;
    customAttributes?: any;
    custom_attributes?: any;
}): string | null => {
    const attrs = item.customAttributes || item.custom_attributes;
    const packQty = item.packQuantity || item.pack_quantity ||
        parseInt(attrs?.packaging?.packQty || '0') || 0;
    const caseSize = item.caseSize || item.case_size || parseInt(attrs?.packaging?.caseSize || '0') || 0;
    const packageType = item.packageType || item.package_type || attrs?.packaging?.packageType || '';

    if (caseSize >= 1 && packQty > 1) {
        return `${packQty} units × ${caseSize} packs${packageType ? ` (${packageType})` : ''}`;
    }
    if (caseSize >= 1) {
        return `${caseSize} packs/case${packageType ? ` (${packageType})` : ''}`;
    }
    if (packQty > 1) {
        return packageType ? `${packQty} pk/${packageType}` : `${packQty} units/pack`;
    }
    return null;
};

/**
 * Format a Product name for display (Inventory, POS, etc.)
 * Mirrors formatPOItemDescription but works with Product objects that use `name` instead of `productName`.
 */
export const formatProductDisplayName = (product: { name: string; brand?: string; size?: string; unit?: string; packQuantity?: number; customAttributes?: any }) => {
    const parts: string[] = [];

    if (product.brand && !product.name.toLowerCase().startsWith(product.brand.toLowerCase())) {
        parts.push(product.brand);
    }
    parts.push(product.name);

    const category = (product as any).category || product.customAttributes?.identity?.category || '';
    const isDiscrete = isDiscreteGeneralMerch(category);

    const physicalWeight = product.customAttributes?.physical?.netWeight || product.size;
    const physicalType = product.customAttributes?.physical?.sizeType || product.customAttributes?.physical?.unit ||
                         (product.unit && !['UNIT', 'PACK', 'DOZEN'].includes(product.unit.toUpperCase().trim()) ? product.unit : '');

    if (physicalWeight && !isDiscrete) {
        const sizeUnit = `${physicalWeight}${physicalType}`;
        const normalizedName = product.name.replace(/\s+/g, '').toLowerCase();
        const normalizedSizeUnit = sizeUnit.replace(/\s+/g, '').toLowerCase();
        if (!normalizedName.includes(normalizedSizeUnit)) {
            parts.push(sizeUnit);
        }
    }

    // NOTE: Pack/case info is intentionally NOT appended to the name string.
    // Use formatPackBadge() to render pack size as a separate UI chip/badge.
    return parts.filter(Boolean).join(' ');
};
