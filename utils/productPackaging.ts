function normalizeSellUnitCode(rawCode: string): string {
    const upper = (rawCode || '').toUpperCase().trim();
    if (upper === 'EA' || upper === 'EACH' || upper === 'PCS' || upper === 'PC') return 'UNIT';
    if (upper === 'PK') return 'PACK';
    if (upper === 'DOZ') return 'DOZEN';
    return upper;
}

export function resolveOrderUnitLabels(
    packagingLevel: string,
    hasCases: boolean,
    hasPacks: boolean,
    caseSize: number,
    packQty: number
): { orderUnitName: string; unitSuffix: string } {
    if (packagingLevel === 'two_tier' || hasCases) {
        const effCase = Math.max(1, caseSize || 1);
        const effPack = Math.max(1, packQty || 1);
        return {
            orderUnitName: 'Master Case',
            unitSuffix: `(master cases — ${effCase} inner pack${effCase !== 1 ? 's' : ''} × ${effPack} unit${effPack !== 1 ? 's' : ''} = ${effCase * effPack} units/case)`,
        };
    }
    if (packagingLevel === 'bale') {
        const effPack = Math.max(2, packQty || 12);
        return {
            orderUnitName: 'Bale',
            unitSuffix: `(bales of ${effPack} units)`,
        };
    }
    if (packagingLevel === 'case' || hasPacks) {
        const effPack = Math.max(2, packQty || 24);
        return {
            orderUnitName: 'Case',
            unitSuffix: `(cases of ${effPack} units)`,
        };
    }
    return {
        orderUnitName: 'Unit',
        unitSuffix: '(1:1 individual units)',
    };
}

/**
 * Computes how many sellable units are contained in a single order unit (case/pack/bulk).
 * Handles both count-based units (UNIT, PACK, DOZEN) and physical weight/volume conversions (KG, G, L, ML).
 */
export function computeSellUnitsPerOrderUnit(
    sizeValue: string,
    sizeType: string,
    sellUnitCode: string,
    packQty: number,
    caseSize: number
): number {
    const hasCases = caseSize >= 1;
    const hasPacks = packQty > 1 && !hasCases;
    const packagingUnits = hasCases ? (caseSize * packQty) : (hasPacks ? packQty : 1);

    if (!sellUnitCode) return Math.max(1, packagingUnits);
    const su = normalizeSellUnitCode(sellUnitCode);

    let sellCategory = '';
    let sellInBase = 1;

    if (su === 'KG') { sellInBase = 1000; sellCategory = 'weight'; }
    else if (su === 'G') { sellInBase = 1; sellCategory = 'weight'; }
    else if (su === 'L') { sellInBase = 1000; sellCategory = 'volume'; }
    else if (su === 'ML') { sellInBase = 1; sellCategory = 'volume'; }
    else if (['UNIT', 'PACK', 'DOZEN'].includes(su)) { sellInBase = 1; sellCategory = 'count'; }

    if (!sellCategory || sellCategory === 'count') {
        if (su === 'DOZEN') {
            return packagingUnits / 12;
        }
        return Math.max(1, packagingUnits);
    }

    const size = parseFloat(sizeValue);
    if (!size || size <= 0 || !sizeType) return Math.max(1, packagingUnits);

    const st = sizeType.trim().toLowerCase();
    let sizeInBase = size;
    let sizeCategory = '';

    if (['kg', 'kilogram', 'kilograms', 'kgs'].includes(st)) { sizeInBase = size * 1000; sizeCategory = 'weight'; }
    else if (['g', 'gram', 'grams', 'gr'].includes(st)) { sizeInBase = size; sizeCategory = 'weight'; }
    else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt'].includes(st)) { sizeInBase = size * 1000; sizeCategory = 'volume'; }
    else if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(st)) { sizeInBase = size; sizeCategory = 'volume'; }

    if (!sizeCategory || sizeCategory !== sellCategory) {
        return Math.max(1, packagingUnits);
    }

    const totalPhysicalInBase = sizeInBase * packagingUnits;
    const sellUnitsInPackage = totalPhysicalInBase / sellInBase;
    return sellUnitsInPackage > 0 ? sellUnitsInPackage : Math.max(1, packagingUnits);
}

/**
 * Converts the bulk purchase cost (order-unit cost) into a cost-per-sell-unit.
 */
export function computeCostPerSellUnit(
    unitCost: number,
    sizeValue: string,
    sizeType: string,
    sellUnitCode: string,
    packQty: number,
    caseSize: number
): number | null {
    if (!unitCost || unitCost <= 0 || !sellUnitCode) return null;

    const su = normalizeSellUnitCode(sellUnitCode);
    let sellCategory = '';
    if (su === 'KG' || su === 'G') sellCategory = 'weight';
    else if (su === 'L' || su === 'ML') sellCategory = 'volume';
    else if (['UNIT', 'PACK', 'DOZEN'].includes(su)) sellCategory = 'count';

    if (!sellCategory) return null;

    if (sellCategory !== 'count') {
        const size = parseFloat(sizeValue);
        if (!size || size <= 0 || !sizeType) return null;
        const st = sizeType.trim().toLowerCase();
        let sizeCategory = '';
        if (['kg', 'kilogram', 'kilograms', 'kgs', 'g', 'gram', 'grams', 'gr'].includes(st)) sizeCategory = 'weight';
        else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt', 'ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(st)) sizeCategory = 'volume';
        if (!sizeCategory || sizeCategory !== sellCategory) return null;
    }

    const sellUnitsInPackage = computeSellUnitsPerOrderUnit(sizeValue, sizeType, su, packQty, caseSize);
    if (sellUnitsInPackage <= 0) return null;
    return unitCost / sellUnitsInPackage;
}

