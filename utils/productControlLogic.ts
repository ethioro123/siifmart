import { isLocationBarcode } from './locationEncoder';
import { computeSellUnitsPerOrderUnit } from './productPackaging';
import type { Product } from '../types';
import type { UnitConfig, StockConfig, ProfileConfig } from '../types/product-control';
import { getSellUnit, SELL_UNITS } from './units';
import { validateStockThresholds } from './productDetailLogic';

export function initialUnitConfig(product: Product): UnitConfig {
    const attributes = product.customAttributes || product.custom_attributes || {};
    const physical = attributes.physical || {};
    const packaging = attributes.packaging || {};
    const embedded = String(product.size || '').match(/^([\d.]+)\s*(kg|g|ml|l|pcs)$/i);
    const rawUnit = embedded?.[2] || physical.unit || physical.sizeType || '';
    return {
        sellMode: getSellUnit(product.unit).category, sellUnit: getSellUnit(product.unit).code,
        physicalQty: String(embedded?.[1] || product.size || physical.netWeight || physical.volume || ''),
        physicalUnit: rawUnit.toLowerCase() === 'l' ? 'L' : rawUnit.toLowerCase(),
        packOf: String(packaging.packQty ?? (product.packQuantity && product.packQuantity > 1 ? product.packQuantity : '')),
        caseOf: String(packaging.caseSize ?? product.caseSize ?? ''), label: attributes.commercial?.labelOverride || '', scope: 'single', selectedSiteIds: [],
    };
}
export function unitProposal(product: Product, cfg: UnitConfig): Partial<Product> {
    const before = initialUnitConfig(product);
    const patch: Partial<Product> = {};
    if (!SELL_UNITS.some(unit => unit.code === cfg.sellUnit)) throw new Error('Select a supported selling unit.');
    if (getSellUnit(cfg.sellUnit).category !== cfg.sellMode) throw new Error('Select a selling unit that matches the charging method.');
    for (const [label, raw] of [['Units per pack', cfg.packOf], ['Packs per case', cfg.caseOf]]) {
        if (raw !== '' && (!Number.isSafeInteger(Number(raw)) || Number(raw) <= 0)) throw new Error(`${label} must be a positive whole number.`);
    }
    if (cfg.label.length > 100) throw new Error('Keep the receipt label within 100 characters.');
    const attrs = product.customAttributes || product.custom_attributes || {};
    let attributesChanged = false;
    const next = { ...attrs };
    if (cfg.sellUnit !== before.sellUnit || cfg.sellMode !== before.sellMode || cfg.label !== before.label) {
        patch.unit = cfg.sellUnit;
        next.commercial = { ...(attrs.commercial || {}), sellBy: cfg.sellMode === 'weight' ? 'Weight' : cfg.sellMode === 'volume' ? 'Volume' : 'Count', sellUnit: cfg.sellUnit, labelOverride: cfg.label.trim() };
        attributesChanged = true;
    }
    if (cfg.physicalQty !== before.physicalQty || cfg.physicalUnit !== before.physicalUnit) {
        if (!Number.isFinite(Number(cfg.physicalQty)) || Number(cfg.physicalQty) <= 0 || !['g', 'kg', 'ml', 'L', 'pcs'].includes(cfg.physicalUnit)) throw new Error('Enter a positive net quantity and its measurement unit.');
        patch.size = cfg.physicalQty;
        next.physical = { ...(attrs.physical || {}), unit: cfg.physicalUnit, sizeType: cfg.physicalUnit, netWeight: cfg.physicalQty };
        attributesChanged = true;
    }
    if (cfg.packOf !== before.packOf || cfg.caseOf !== before.caseOf) {
        patch.packQuantity = cfg.packOf === '' ? 1 : Number(cfg.packOf);
        next.packaging = { ...(attrs.packaging || {}), packQty: cfg.packOf || '', caseSize: cfg.caseOf || '', packagingLevel: cfg.caseOf && Number(cfg.caseOf) > 0 ? 'two_tier' : cfg.packOf && Number(cfg.packOf) > 1 ? ((attrs.packaging?.packageType === 'Bale') ? 'bale' : 'case') : 'single' };
        attributesChanged = true;
    }
    if (attributesChanged) patch.customAttributes = next;
    return patch;
}
export function stockPolicyPreview(product: Product, cfg: StockConfig) {
    const min = cfg.minStock === '' ? product.minStock ?? undefined : Number(cfg.minStock);
    const max = cfg.maxStock === '' ? product.maxStock ?? undefined : Number(cfg.maxStock);
    validateStockThresholds(min, max);
    if ([min, max].some(value => value !== undefined && !Number.isSafeInteger(value))) throw new Error('Stock thresholds must be whole numbers.');
    const state = min === undefined && max === undefined ? 'Not configured' : min !== undefined && product.stock < min ? 'Below minimum' : max !== undefined && product.stock > max ? 'Above maximum' : 'Within limits';
    return { min, max, state, gap: max === undefined ? null : Math.max(0, max - product.stock), fill: max && max > 0 ? Math.max(0, Math.min(100, product.stock / max * 100)) : null };
}
export function profileProposal(product: Product, cfg: ProfileConfig): Partial<Product> {
    if (!cfg.name.trim()) throw new Error('Product name is required.');
    if (cfg.name.trim().length > 200 || cfg.brand.trim().length > 200 || cfg.description.trim().length > 4000) throw new Error('Product name or description exceeds the allowed length.');
    const patch: Partial<Product> = {};
    if (cfg.name.trim() !== product.name) patch.name = cfg.name.trim();
    if (cfg.brand.trim() !== (product.brand || '')) patch.brand = cfg.brand.trim();
    if (cfg.description.trim() !== (product.description || '')) patch.description = cfg.description.trim();
    return patch;
}
export function packagingPreview(cfg: UnitConfig) {
    const perPack = cfg.packOf === '' ? 1 : Number(cfg.packOf);
    const packsPerCase = cfg.caseOf === '' ? null : Number(cfg.caseOf);
    return { perPack, packsPerCase, unitsPerCase: packsPerCase === null ? null : perPack * packsPerCase };
}

export function netContentPreview(cfg: UnitConfig): { equivalent: string; pack: string; case: string | null } | null {
    const amount = Number(cfg.physicalQty);
    if (!Number.isFinite(amount) || amount <= 0 || !['g','kg','ml','L','pcs'].includes(cfg.physicalUnit)) return null;
    const packageQty = packagingPreview(cfg);
    if (!Number.isSafeInteger(packageQty.perPack) || packageQty.perPack <= 0 || (packageQty.packsPerCase !== null && (!Number.isSafeInteger(packageQty.packsPerCase) || packageQty.packsPerCase <= 0))) return null;
    const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    const equivalent = cfg.physicalUnit === 'g' ? `${format(amount / 1000)} kg` : cfg.physicalUnit === 'kg' ? `${format(amount * 1000)} g` : cfg.physicalUnit === 'ml' ? `${format(amount / 1000)} L` : cfg.physicalUnit === 'L' ? `${format(amount * 1000)} ml` : `${format(amount)} items`;
    return { equivalent, pack: `${format(amount * packageQty.perPack)} ${cfg.physicalUnit}`, case: packageQty.unitsPerCase === null ? null : `${format(amount * packageQty.unitsPerCase)} ${cfg.physicalUnit}` };
}

/** Canonical buying quantity: sellable units in one supplier order unit. */
export function productOrderUnits(product: Product): number {
    const cfg = initialUnitConfig(product);
    const packaging = packagingPreview(cfg);
    const attrs = product.customAttributes || product.custom_attributes || {};
    const isSingle = attrs.packaging?.packagingLevel === 'single';
    return computeSellUnitsPerOrderUnit(cfg.physicalQty, cfg.physicalUnit, cfg.sellUnit, isSingle ? 1 : packaging.perPack, isSingle ? 0 : packaging.packsPerCase || 0);
}

export function productBarcodes(product: Product): string[] {
    return [...new Set([product.barcode, ...(product.barcodes || [])].map(value => value?.trim()).filter((value): value is string => Boolean(value) && !isLocationBarcode(value!)))];
}
