import { getSellUnit, formatProductSize, formatPackagingDescription } from './units';
import { getCategorySpecGroup } from '../components/procurement/categoryAttributes';
import { getCategoryStorageDefaults } from '../components/procurement/categoryLogistics';
import { getCategoryPackagingDefaults } from '../components/procurement/categoryPackaging';
import { inferBulkPackaging, isConsumableCategory, isDiscreteGeneralMerch } from '../components/procurement/utils';

export type AttributeTone = 'neutral' | 'accent' | 'green' | 'amber' | 'cyan' | 'blue' | 'purple' | 'rose';

export interface SmartAttributePill {
    key: string;
    label?: string;
    value: string;
    tone: AttributeTone;
}

export interface SmartProductAttributeProfile {
    displayName: string;
    brand: string | null;
    category: string;
    subcategory: string;
    archetypeTitle: string;
    variant: string | null;
    modelOrOrigin: string | null;
    netContent: string | null;
    grossWeight: string | null;
    physicalForm: string | null;
    dimensions: string | null;
    color: string | null;
    colorOrFinish: string | null;
    scent: string | null;
    sellUnitCode: string;
    sellUnitShort: string;
    sellUnitFull: string;
    sellByMode: 'Weight' | 'Volume' | 'Unit';
    isWeighted: boolean;
    isWeightedScale: boolean;
    packageType: string;
    packagingLevel: string;
    packagingLevelLabel: string;
    packagingMaterial: string | null;
    packQty: number;
    unitsPerPackage: number;
    packBadge: string;
    stockBreakdown: string | null;
    unitPriceLabel: string | null;
    unitPriceEquivalent: string | null;
    storageType: string;
    isPerishable: boolean;
    shelfLifeLabel: string | null;
    inboundQcDirective: string | null;
    isColdChain: boolean;
    isDeepFreeze: boolean;
    isHalal: boolean;
    isFragile: boolean;
    isHighValue: boolean;
    requiresBatch: boolean;
    requiresSerial: boolean;
    isSerialTracked: boolean;
    isHazardous: boolean;
    expiryStatus: { label: string; isExpired: boolean; isWarning: boolean } | null;
    domainSpecs: { label: string; value: string }[];
    quickPills: SmartAttributePill[];
}

const SIZE_IN_NAME_REGEX = /\b(\d+(?:\.\d+)?)\s*(kg|g|gr|grams|ml|l|ltr|litres|oz|lb|pk|pcs)\b/i;

function inferBrandFromName(name: string, explicitBrand?: string): string | null {
    if (explicitBrand && explicitBrand.trim()) return explicitBrand.trim();
    const cleaned = (name || '').trim();
    if (!cleaned) return null;
    const words = cleaned.split(/\s+/);
    if (words.length >= 2) {
        const first = words[0].replace(/[^a-zA-Z0-9&-]/g, '');
        const genericStarts = new Set([
            'fresh', 'organic', 'pure', 'whole', 'white', 'brown', 'red', 'green', 'black',
            'local', 'imported', 'premium', 'raw', 'cooked', 'sliced', 'mini', 'large', 'small', 'medium', 'extra'
        ]);
        if (first.length >= 3 && !genericStarts.has(first.toLowerCase()) && !/^\d/.test(first)) {
            return first;
        }
    }
    return null;
}

function inferArchetypeAndSpecs(name: string, category: string, explicitSubcategory?: string): {
    subcategory: string;
    archetypeTitle: string;
    physicalForm: string;
    inferredPackageType?: string;
    inferredPackQty?: number;
    inferredMaterial?: string;
    specs: { label: string; value: string }[];
} {
    const text = `${name} ${category} ${explicitSubcategory || ''}`.toLowerCase();

    if (/ugali|maize\s*meal|flour|wheat|semolina|atta|baking\s*powder/i.test(text)) {
        const grain = /wheat|atta|all[- ]purpose/i.test(text) ? 'Wheat' : /semolina/i.test(text) ? 'Durum Semolina' : 'White Maize';
        return {
            subcategory: explicitSubcategory || 'Flour & Baking',
            archetypeTitle: 'Dry Grocery — Milled Grains & Flour',
            physicalForm: 'Flour / Milled Grain',
            inferredPackageType: 'Bale',
            inferredPackQty: 12,
            inferredMaterial: 'Kraft Paper Packet',
            specs: [
                { label: 'Source Grain', value: grain },
                { label: 'Milling Grade', value: 'Grade 1 Sifted' },
                { label: 'Fortification', value: 'Vitamins & Iron Fortified' }
            ]
        };
    }

    if (/rice|basmati|pishori|pasta|spaghetti|macaroni|noodle|lentil|beans|ndengu|grams/i.test(text)) {
        const isPasta = /pasta|spaghetti|macaroni|noodle/i.test(text);
        return {
            subcategory: explicitSubcategory || (isPasta ? 'Pasta & Noodles' : 'Rice, Pulses & Dry Grains'),
            archetypeTitle: 'Dry Grocery — Staples & Grains',
            physicalForm: isPasta ? 'Extruded Dry Pasta' : 'Whole Dry Grain',
            inferredPackageType: isPasta ? 'Carton' : 'Bag / Bale',
            inferredMaterial: isPasta ? 'Poly-Film Pouch' : 'Woven Poly Sack / Pouch',
            specs: [
                { label: 'Type', value: isPasta ? 'Durum Wheat Pasta' : /basmati|pishori/i.test(text) ? 'Aromatic Long Grain' : 'Dry Staple Grain' },
                { label: 'Preparation', value: 'Boil / Steam' },
                { label: 'Moisture Spec', value: '< 14% Dry Store' }
            ]
        };
    }

    if (/tuna|sardine|salmon|mackerel|canned|baked\s*beans|tomato\s*paste|soup|corned/i.test(text)) {
        const isFish = /tuna|sardine|salmon|mackerel/i.test(text);
        return {
            subcategory: explicitSubcategory || (isFish ? 'Canned Seafood' : 'Canned & Preserved Foods'),
            archetypeTitle: 'Pantry — Hermetically Sealed & Canned',
            physicalForm: isFish ? 'Flaked / Chunk Fillet in Can' : 'Hermetically Sealed Can',
            inferredPackageType: 'Carton',
            inferredPackQty: 24,
            inferredMaterial: 'Tin Can',
            specs: [
                { label: 'Container', value: 'Hermetic Tin Can' },
                { label: 'Preservation', value: 'Retort Sterilized (Ambient)' },
                { label: 'Ready to Eat', value: isFish ? 'Yes (Ready to Serve)' : 'Heat & Serve' }
            ]
        };
    }

    if (/oil|sunflower|vegetable\s*oil|corn\s*oil|olive\s*oil|ghee|margarine|shortening/i.test(text)) {
        return {
            subcategory: explicitSubcategory || 'Cooking Oils & Culinary Fats',
            archetypeTitle: 'Pantry — Edible Oils & Ghee',
            physicalForm: /ghee|margarine|shortening/i.test(text) ? 'Semi-Solid Culinary Fat' : 'Refined Liquid Oil',
            inferredPackageType: 'Carton',
            inferredMaterial: 'Food-Grade HDPE Jerrycan / Bottle',
            specs: [
                { label: 'Refinement', value: 'Triple Refined & Cholesterol-Free' },
                { label: 'Fortification', value: 'Vitamin A & D Enriched' }
            ]
        };
    }

    if (/milk|yogurt|yoghurt|butter|cheese|cream|lassi|dairy/i.test(text)) {
        const isUht = /uht|long\s*life|powder/i.test(text);
        return {
            subcategory: explicitSubcategory || (isUht ? 'UHT & Shelf-Stable Dairy' : 'Milk & Cream'),
            archetypeTitle: 'Dairy & Creamery',
            physicalForm: /powder/i.test(text) ? 'Spray-Dried Milk Powder' : /cheese|butter/i.test(text) ? 'Cultured Dairy Solid' : 'Pasteurized Liquid Dairy',
            inferredPackageType: 'Crate / Tray',
            inferredMaterial: isUht ? 'Tetra Pak Carton' : 'Food-Grade Dairy Pouch / Bottle',
            specs: [
                { label: 'Treatment', value: isUht ? 'UHT Sterilized' : 'Pasteurized & Homogenized' },
                { label: 'Temperature', value: isUht ? 'Ambient (Chilled After Opening)' : 'Chilled 0–4°C' }
            ]
        };
    }

    if (/coffee|tea|majani|cocoa|milo|drinking\s*chocolate|nescafe/i.test(text)) {
        return {
            subcategory: explicitSubcategory || 'Coffee, Tea & Hot Beverages',
            archetypeTitle: 'Beverages — Hot Infusions & Roasts',
            physicalForm: 'Roasted / Granulated Blend',
            inferredPackageType: 'Case',
            inferredMaterial: 'Aroma-Lock Foil / Jar',
            specs: [
                { label: 'Infusion Type', value: /coffee|nescafe/i.test(text) ? 'Roasted Coffee' : /tea|majani/i.test(text) ? 'Black / Loose Leaf Tea' : 'Malt / Cocoa Beverage' }
            ]
        };
    }

    if (/water|juice|soda|cola|fanta|sprite|energy\s*drink|beverage|drink|cordial|squash/i.test(text)) {
        const isSparkling = /soda|cola|fanta|sprite|sparkling|energy/i.test(text);
        return {
            subcategory: explicitSubcategory || (isSparkling ? 'Carbonated Soft Drinks' : 'Water, Juices & Cordials'),
            archetypeTitle: 'Beverages — Ready to Drink',
            physicalForm: 'Liquid Beverage',
            inferredPackageType: 'Crate / Shrink-Wrap',
            inferredPackQty: 12,
            inferredMaterial: 'PET Bottle / Can',
            specs: [
                { label: 'Carbonation', value: isSparkling ? 'Carbonated' : 'Still / Non-Carbonated' }
            ]
        };
    }

    if (/kindle|amazon|phone|iphone|samsung|laptop|tablet|ipad|tv|television|speaker|earbud|headphone|charger|cable|battery|power\s*bank|electronic|appliance|kettle|blender|iron/i.test(text)) {
        return {
            subcategory: explicitSubcategory || 'Consumer Electronics & Appliances',
            archetypeTitle: 'Electronics & High-Value Hardware',
            physicalForm: 'Serialized Hardware / Electronic Device',
            inferredPackageType: 'Retail Box',
            inferredPackQty: 1,
            inferredMaterial: 'Tamper-Sealed Retail Box',
            specs: [
                { label: 'Device Class', value: /kindle|tablet|ipad/i.test(text) ? 'Digital e-Reader / Tablet' : /battery|charger|cable/i.test(text) ? 'Power & Connectivity Accessory' : 'Consumer Electronic Hardware' },
                { label: 'Security', value: 'High-Value / Serial Verification' }
            ]
        };
    }

    const specGroup = getCategorySpecGroup(category, explicitSubcategory);
    return {
        subcategory: explicitSubcategory || category || 'General Grocery',
        archetypeTitle: specGroup.domainTitle || 'Supermarket Merchandising Specs',
        physicalForm: isDiscreteGeneralMerch(category) ? 'Retail Merchandise Unit' : 'Packaged Grocery Item',
        specs: []
    };
}

function computeUnitPriceEquivalent(
    price: number,
    netContent: string | null,
    sellUnitShort: string,
    currencySymbol: string = ''
): string | null {
    if (!price || price <= 0) return null;
    const prefix = currencySymbol ? `${currencySymbol} ` : '';

    if (netContent) {
        const match = /(\d+(?:\.\d+)?)\s*(kg|g|gr|grams|ml|l|ltr|litres)/i.exec(netContent);
        if (match) {
            const val = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            if (val > 0) {
                if (unit === 'kg') {
                    const perKg = Math.round(price / val);
                    return `${prefix}${perKg.toLocaleString()}/kg`;
                }
                if (unit === 'g' || unit === 'gr' || unit === 'grams') {
                    if (val >= 500) {
                        const perKg = Math.round((price / val) * 1000);
                        return `${prefix}${perKg.toLocaleString()}/kg`;
                    }
                    const per100g = Math.round((price / val) * 100);
                    return `${prefix}${per100g.toLocaleString()}/100g`;
                }
                if (unit === 'l' || unit === 'ltr' || unit === 'litres') {
                    const perL = Math.round(price / val);
                    return `${prefix}${perL.toLocaleString()}/L`;
                }
                if (unit === 'ml') {
                    if (val >= 500) {
                        const perL = Math.round((price / val) * 1000);
                        return `${prefix}${perL.toLocaleString()}/L`;
                    }
                    const per100ml = Math.round((price / val) * 100);
                    return `${prefix}${per100ml.toLocaleString()}/100ml`;
                }
            }
        }
    }

    return `${prefix}${Math.round(price).toLocaleString()}/${sellUnitShort || 'ea'}`;
}

export function resolveSmartProductAttributes(
    item: any,
    allProducts?: any[],
    currencySymbol: string = ''
): SmartProductAttributeProfile {
    const matchedProduct = allProducts?.find(p =>
        (item?.productId && p.id === item.productId) ||
        (item?.id && p.id === item.id) ||
        (item?.sku && p.sku === item.sku) ||
        (item?.productName && p.name === item.productName)
    );

    const rawName = (item?.productName || item?.name || matchedProduct?.name || 'Unnamed Product').toString().trim();
    const category = (item?.category || item?.customAttributes?.identity?.category || matchedProduct?.category || 'General Grocery').toString().trim();
    const attrs = item?.customAttributes || item?.custom_attributes || matchedProduct?.customAttributes || (matchedProduct as any)?.custom_attributes || {};

    const identity = attrs.identity || {};
    const physical = attrs.physical || {};
    const packaging = attrs.packaging || {};
    const storage = attrs.storage || {};
    const commercial = attrs.commercial || {};
    const descriptive = attrs.descriptive || {};
    const categorySpecific = attrs.categorySpecific || {};

    const brand = inferBrandFromName(rawName, item?.brand || identity.brand || matchedProduct?.brand);
    const archetype = inferArchetypeAndSpecs(rawName, category, item?.subcategory || identity.subcategory || matchedProduct?.subcategory);
    const isDiscrete = isDiscreteGeneralMerch(category) || /kindle|electronic|appliance|hardware/i.test(`${rawName} ${category}`);

    let netContent: string | null = formatProductSize({ ...matchedProduct, ...item, category, customAttributes: attrs });
    if (!netContent && !isDiscrete) {
        const nameSizeMatch = SIZE_IN_NAME_REGEX.exec(rawName);
        if (nameSizeMatch) netContent = `${nameSizeMatch[1]}${nameSizeMatch[2].toLowerCase()}`;
    }

    const physicalForm = physical.form || archetype.physicalForm || null;
    const dimensions = physical.dims || null;
    const colorOrFinish = physical.color || categorySpecific.color || null;
    const grossWeight = physical.grossWeight || null;
    const scent = descriptive.scent || null;
    const variant = identity.variant || descriptive.flavor || descriptive.scent || null;
    const modelOrOrigin = identity.modelNumber || categorySpecific.countryOfOrigin || categorySpecific.origin || null;

    const unitCode = (item?.unit || commercial.sellUnit || matchedProduct?.unit || 'UNIT').toString();
    const sellUnitObj = getSellUnit(unitCode);
    const sellUnitShort = sellUnitObj.shortLabel || 'ea';
    const sellUnitFull = sellUnitObj.label || 'Unit / Each';
    const isWeightedScale = Boolean(commercial.isWeighted || sellUnitObj.allowDecimal || sellUnitObj.category === 'weight' || sellUnitObj.category === 'volume');
    const sellByMode: 'Weight' | 'Volume' | 'Unit' = commercial.sellBy || (sellUnitObj.category === 'weight' ? 'Weight' : sellUnitObj.category === 'volume' ? 'Volume' : 'Unit');

    const pkgDefaults = getCategoryPackagingDefaults(category);
    const inferredBulk = inferBulkPackaging({ ...matchedProduct, ...item, customAttributes: attrs });
    const rawPackQty =
        parseInt(packaging.packQty || '0', 10) ||
        Number(item?.packQuantity || item?.pack_quantity || matchedProduct?.packQuantity || (matchedProduct as any)?.pack_quantity || 0) ||
        (inferredBulk.unitsPerOrderUnit > 1 ? inferredBulk.unitsPerOrderUnit : 0) ||
        (archetype.inferredPackQty && !isDiscrete ? archetype.inferredPackQty : 1);
    const caseSize = parseInt(packaging.caseSize || '0', 10) || Number(item?.caseSize || item?.case_size || 0);
    const unitsPerPackage = caseSize >= 1 ? caseSize * Math.max(1, rawPackQty) : Math.max(1, rawPackQty);

    const packageType =
        packaging.packageType || item?.packageType || item?.package_type ||
        inferredBulk.packageType || archetype.inferredPackageType ||
        pkgDefaults?.containers?.[0] || (unitsPerPackage > 1 ? 'Case' : 'Retail Unit');

    const packagingMaterial = packaging.material || archetype.inferredMaterial || null;
    const packagingLevelLabel =
        caseSize >= 1 ? `2-Tier Master ${packageType}` :
        unitsPerPackage > 1 ? `${packageType} (×${unitsPerPackage} ${sellUnitShort})` :
        `Single Unit (1 ${sellUnitShort})`;

    const packBadge =
        caseSize >= 1 && rawPackQty > 1 ? `${rawPackQty} ${sellUnitShort} × ${caseSize} pk/${packageType}` :
        unitsPerPackage > 1 ? `${unitsPerPackage} ${sellUnitShort}/${packageType}` :
        netContent && !isDiscrete ? `${netContent} ${packageType}` : `1 ${sellUnitShort} (${packageType})`;

    const stockVal = Number(item?.stock ?? matchedProduct?.stock ?? 0);
    const stockBreakdown = stockVal > 0
        ? formatPackagingDescription(
            {
                ...matchedProduct,
                ...item,
                packQuantity: unitsPerPackage,
                customAttributes: { ...attrs, packaging: { ...packaging, packageType, packQty: String(unitsPerPackage) } }
            },
            stockVal
        )
        : null;

    const storageDefaults = getCategoryStorageDefaults(category);
    const isFreshDairyOrMeat = /fresh\s*whole\s*milk|fresh\s*milk|yogurt|yoghurt|cheese|butter|meat|chicken|fish/i.test(rawName) && !/uht|powder|canned|tuna|sardine/i.test(`${rawName} ${category}`);
    const storageType = storage.type || (isFreshDairyOrMeat ? 'Chilled (0-4°C)' : storageDefaults?.defaultStorage || 'Ambient (Dry)');
    const isPerishable = !isDiscrete && Boolean(storage.isPerishable || isFreshDairyOrMeat || storageDefaults?.defaultPerishable || isConsumableCategory(category));
    const shelfLifeDays = storage.shelfLifeDays || storageDefaults?.defaultShelfLife || null;
    const shelfLifeLabel = shelfLifeDays ? `${shelfLifeDays} days` : isPerishable ? 'FEFO Rotation' : null;
    const inboundQcDirective = storage.inboundQcDirective || (isFreshDairyOrMeat ? 'Verify Cold Chain (0–4°C) & Seal Integrity' : storageDefaults?.inboundDirectives?.[0] || null);
    const isColdChain = Boolean(storage.coldChain || /chilled|cold|refrigerated/i.test(storageType));
    const isDeepFreeze = Boolean(storage.deepFreeze || /freeze|frozen/i.test(storageType));
    const isHalal = !isDiscrete && Boolean(
        storage.halalVerified || categorySpecific.halalCertified === 'Yes' ||
        isConsumableCategory(category) || /flour|tuna|grain|rice|milk|meat|food|oil|beverage|coffee|tea|snack/i.test(`${rawName} ${category}`)
    );
    const isFragile = Boolean(storage.isFragile || packaging.isBreakable);
    const isHighValue = Boolean(storage.highTheft || storage.highValueCage || /kindle|phone|laptop|tablet|electronics/i.test(`${rawName} ${category}`));
    const isSerialTracked = Boolean(storage.serialTracked || commercial.requiresSerialTracking || categorySpecific.serialNumberTracking || /kindle|phone|laptop|tablet|electronic/i.test(`${rawName} ${category}`));
    const requiresBatch = Boolean(commercial.requiresBatchTracking ?? isPerishable);
    const isHazardous = Boolean(storage.isHazardous || /bleach|acid|flammable|insecticide/i.test(rawName));

    let expiryStatus: { label: string; isExpired: boolean; isWarning: boolean } | null = null;
    const expiryDate = item?.expiryDate || item?.expiry_date || matchedProduct?.expiryDate || (matchedProduct as any)?.expiry_date;
    if (expiryDate) {
        const daysDiff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
        if (!isNaN(daysDiff)) {
            if (daysDiff < 0) expiryStatus = { label: `Expired ${Math.abs(daysDiff)}d ago`, isExpired: true, isWarning: false };
            else if (daysDiff <= 30) expiryStatus = { label: `Expires in ${daysDiff}d`, isExpired: false, isWarning: true };
            else expiryStatus = { label: `Exp ${new Date(expiryDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}`, isExpired: false, isWarning: false };
        }
    }

    const specGroup = getCategorySpecGroup(category, archetype.subcategory);
    const domainSpecs: { label: string; value: string }[] = [];
    const seenLabels = new Set<string>();
    for (const field of specGroup.fields) {
        const val = categorySpecific[field.key];
        if (val !== undefined && val !== null && val !== '') {
            const cleanLabel = field.label.replace(/\s*\(.*\)/, '').replace(/\s*\/.*$/, '').trim();
            seenLabels.add(cleanLabel.toLowerCase());
            domainSpecs.push({ label: cleanLabel, value: String(val) });
        }
    }
    for (const inferred of archetype.specs) {
        if (!seenLabels.has(inferred.label.toLowerCase())) {
            seenLabels.add(inferred.label.toLowerCase());
            domainSpecs.push(inferred);
        }
    }

    const nameParts: string[] = [];
    if (brand && !rawName.toLowerCase().startsWith(brand.toLowerCase())) nameParts.push(brand);
    nameParts.push(rawName);
    if (variant && !rawName.toLowerCase().includes(variant.toLowerCase())) nameParts.push(variant);
    if (netContent && !isDiscrete && !rawName.replace(/\s+/g, '').toLowerCase().includes(netContent.replace(/\s+/g, '').toLowerCase())) {
        nameParts.push(netContent);
    }
    const displayName = nameParts.join(' ');

    const retailPrice = Number(item?.retailPrice ?? item?.price ?? matchedProduct?.price ?? 0);
    const unitPriceEquivalent = computeUnitPriceEquivalent(retailPrice, netContent, sellUnitShort, currencySymbol);

    const quickPills: SmartAttributePill[] = [];
    if (brand) quickPills.push({ key: 'brand', label: 'Brand', value: brand, tone: 'neutral' });
    if (archetype.subcategory && archetype.subcategory.toLowerCase() !== category.toLowerCase()) {
        quickPills.push({ key: 'subcategory', value: archetype.subcategory, tone: 'accent' });
    }
    if (netContent && !isDiscrete) quickPills.push({ key: 'size', label: 'Net', value: netContent, tone: 'green' });
    else if (dimensions) quickPills.push({ key: 'dims', label: 'Dims', value: dimensions, tone: 'neutral' });
    if (unitsPerPackage > 1) quickPills.push({ key: 'pack', value: `${unitsPerPackage} ${sellUnitShort}/${packageType}`, tone: 'amber' });
    else if (packageType && packageType !== 'Retail Unit') quickPills.push({ key: 'pkg', value: packageType, tone: 'neutral' });
    if (variant) quickPills.push({ key: 'variant', value: variant, tone: 'purple' });
    else if (physicalForm) quickPills.push({ key: 'form', value: physicalForm, tone: 'neutral' });
    if (isDeepFreeze) quickPills.push({ key: 'freeze', value: 'Frozen -18°C', tone: 'blue' });
    else if (isColdChain) quickPills.push({ key: 'cold', value: 'Chilled 0–4°C', tone: 'cyan' });
    if (isWeightedScale) quickPills.push({ key: 'scale', value: `Scale (${sellUnitShort})`, tone: 'cyan' });
    if (isHighValue || isSerialTracked) {
        quickPills.push({ key: 'security', label: isSerialTracked ? 'Serial Tracked' : 'High Value', value: isSerialTracked ? 'Serial Tracked' : 'High Value', tone: 'rose' });
    } else if (isHalal && isConsumableCategory(category)) {
        quickPills.push({ key: 'halal', value: 'Halal', tone: 'green' });
    }
    if (expiryStatus && (expiryStatus.isExpired || expiryStatus.isWarning)) {
        quickPills.push({ key: 'expiry', value: expiryStatus.label, tone: expiryStatus.isExpired ? 'rose' : 'amber' });
    }

    return {
        displayName,
        brand,
        category,
        subcategory: archetype.subcategory,
        archetypeTitle: archetype.archetypeTitle,
        variant,
        modelOrOrigin,
        netContent,
        grossWeight,
        physicalForm,
        dimensions,
        color: colorOrFinish,
        colorOrFinish,
        scent,
        sellUnitCode: sellUnitObj.code,
        sellUnitShort,
        sellUnitFull,
        sellByMode,
        isWeighted: isWeightedScale,
        isWeightedScale,
        packageType,
        packagingLevel: packagingLevelLabel,
        packagingLevelLabel,
        packagingMaterial,
        packQty: unitsPerPackage,
        unitsPerPackage,
        packBadge,
        stockBreakdown,
        unitPriceLabel: unitPriceEquivalent,
        unitPriceEquivalent,
        storageType,
        isPerishable,
        shelfLifeLabel,
        inboundQcDirective,
        isColdChain,
        isDeepFreeze,
        isHalal,
        isFragile,
        isHighValue,
        requiresBatch,
        requiresSerial: isSerialTracked,
        isSerialTracked,
        isHazardous,
        expiryStatus,
        domainSpecs,
        quickPills
    };
}
