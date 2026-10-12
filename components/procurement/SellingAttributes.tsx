import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, ChevronDown, Percent, TrendingUp, Sparkles } from 'lucide-react';
import { getGroupedUnits, getSellUnit } from '../../utils/units';
import { logger } from '../../utils/logger';
import { getCategorySpecGroup } from './categoryAttributes';
import { getCategoryMarginBenchmark } from './categoryLogistics';

/* ─────────── UNIT CONVERSION (size type → sell unit) ────────── */

/**
 * Converts the bulk purchase cost into a cost-per-sell-unit.
 * 
 * Example: Buy a 10kg bag for 14,000 ETB, sell by KG
 *   → costPerSellUnit = 14,000 / 10 = 1,400/kg
 * 
 * Example: Buy a 10kg bag for 14,000 ETB, sell by G
 *   → 10kg = 10,000g → costPerSellUnit = 14,000 / 10,000 = 1.4/g
 * 
 * Example: Buy a 20L container for 26,000 ETB, sell by L
 *   → costPerSellUnit = 26,000 / 20 = 1,300/L
 */
const computeCostPerSellUnit = (
    unitCost: number,
    sizeValue: string,
    sizeType: string,
    sellUnitCode: string,
    packQty: number,
    caseSize: number
): number | null => {
    if (!unitCost || unitCost <= 0 || !sellUnitCode) return null;

    const su = sellUnitCode.toUpperCase().trim();

    // Map sellUnit to base units and category
    let sellCategory = '';
    let sellInBase = 1;

    if (su === 'KG') { sellInBase = 1000; sellCategory = 'weight'; }
    else if (su === 'G') { sellInBase = 1; sellCategory = 'weight'; }
    else if (su === 'L') { sellInBase = 1000; sellCategory = 'volume'; }
    else if (su === 'ML') { sellInBase = 1; sellCategory = 'volume'; }
    else if (['UNIT', 'PACK', 'DOZEN'].includes(su)) { sellInBase = 1; sellCategory = 'count'; }

    if (!sellCategory) return null;

    // Handle count-based selling units: bypass physical size.
    // Mirrors the formula in POItemForm and useReceiving:
    //   hasCases = caseSize >= 1 (any explicit case layer, even 1 pack/case)
    //   hasPacks = packQty > 1 and no case layer
    if (sellCategory === 'count') {
        const hasCases = caseSize >= 1;
        const hasPacks = packQty > 1 && !hasCases;
        const packagingUnits = hasCases ? (caseSize * packQty) : (hasPacks ? packQty : 1);
        let sellUnitsInPackage = packagingUnits;
        if (su === 'DOZEN') {
            sellUnitsInPackage = packagingUnits / 12;
        }
        if (sellUnitsInPackage <= 0) return null;
        return unitCost / sellUnitsInPackage;
    }

    // For weight/volume-based selling: physical size is required for conversion
    const size = parseFloat(sizeValue);
    if (!size || size <= 0 || !sizeType) return null;

    const st = sizeType.trim().toLowerCase();

    // Map sizeType to a base unit category + value in base units
    let sizeInBase = size;
    let sizeCategory = '';

    // Weight
    if (['kg', 'kilogram', 'kilograms', 'kgs'].includes(st)) { sizeInBase = size * 1000; sizeCategory = 'weight'; }
    else if (['g', 'gram', 'grams', 'gr'].includes(st)) { sizeInBase = size; sizeCategory = 'weight'; }
    // Volume
    else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt'].includes(st)) { sizeInBase = size * 1000; sizeCategory = 'volume'; }
    else if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(st)) { sizeInBase = size; sizeCategory = 'volume'; }

    // Can only convert within same category
    if (!sizeCategory || sizeCategory !== sellCategory) {
        logger.warn('SellingAttributes', `Category mismatch or unknown: "${sizeCategory}" vs "${sellCategory}". Cannot compute cost per sell unit.`);
        return null;
    }

    // Calculate how many items are in the package (weight/volume path)
    const hasCases = caseSize >= 1;
    const hasPacks = packQty > 1 && !hasCases;
    const itemsPerPurchaseUnit = hasCases ? (caseSize * packQty) : (hasPacks ? packQty : 1);
    const totalPhysicalInBase = sizeInBase * itemsPerPurchaseUnit;

    const sellUnitsInPackage = totalPhysicalInBase / sellInBase;
    if (sellUnitsInPackage <= 0) return null;

    return unitCost / sellUnitsInPackage;
};

/* ─────────────────────── TYPES ─────────────────────── */

export interface SellingAttributesProps {
    /* Sell Unit */
    customItemUnit: string;
    setCustomItemUnit: (v: string) => void;

    /* Retail */
    currentRetailPrice: number;
    setCurrentRetailPrice: (v: number) => void;

    /* Cost + Size (from buying side, for margin calc) */
    currentCost: number;
    customItemSize: string;
    sizeType: string;

    /* Commercial attributes only */
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;

    /* Sovereign Currency */
    currencySymbol?: string;

    /* Category Scope for Dynamic Margin Intelligence */
    selectedMainCategory?: string;

    /* Errors */
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/* ─────────────────────── COMPONENT ─────────────────── */

export const SellingAttributes: React.FC<SellingAttributesProps> = ({
    customItemUnit, setCustomItemUnit,
    currentRetailPrice, setCurrentRetailPrice,
    currentCost, customItemSize, sizeType,
    customAttributes, setCustomAttributes,
    currencySymbol = 'ETB',
    selectedMainCategory = '',
    errors, setErrors,
}) => {
    const unitDef = getSellUnit(customItemUnit);
    const showPerUnit = customItemUnit && unitDef.category !== 'count';

    // Domain category margin benchmark
    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes?.identity?.subcategory);
    const domainId = specGroup.id;
    const marginBenchmark = getCategoryMarginBenchmark(domainId);

    // Margin state
    const [marginPercent, setMarginPercent] = useState<string>('');

    const packQty = parseInt(customAttributes?.packaging?.packQty) || 1;
    const caseSize = parseInt(customAttributes?.packaging?.caseSize) || 0;

    // Compute cost per sell unit
    const costPerSellUnit = computeCostPerSellUnit(
        currentCost,
        customItemSize,
        sizeType,
        customItemUnit,
        packQty,
        caseSize
    );

    // When margin changes, auto-calculate retail price (rounded to nearest integer)
    const handleMarginChange = useCallback((marginStr: string) => {
        setMarginPercent(marginStr);
        const margin = parseFloat(marginStr);
        if (!margin || margin <= 0 || margin >= 100 || !costPerSellUnit) return;
        // Margin formula: retail = cost / (1 - margin/100)
        const retail = Math.round(costPerSellUnit / (1 - margin / 100));
        setCurrentRetailPrice(retail);
        if (errors.retail) setErrors(prev => ({ ...prev, retail: '' }));
    }, [costPerSellUnit, setCurrentRetailPrice, errors.retail, setErrors]);

    // When retail price changes, round to nearest integer and recalculate margin with decimals
    const handleRetailChange = useCallback((val: number) => {
        const roundedVal = Math.round(val);
        setCurrentRetailPrice(roundedVal);
        if (errors.retail) setErrors(prev => ({ ...prev, retail: '' }));
        if (costPerSellUnit && roundedVal > 0) {
            const margin = ((roundedVal - costPerSellUnit) / roundedVal) * 100;
            if (margin > 0 && margin < 100) {
                setMarginPercent((Math.round(margin * 100) / 100).toString());
            } else {
                setMarginPercent('');
            }
        }
    }, [costPerSellUnit, setCurrentRetailPrice, errors.retail, setErrors]);

    // Recalculate retail when cost/size/unit changes and margin is set (rounded to nearest integer)
    useEffect(() => {
        if (marginPercent && costPerSellUnit) {
            const margin = parseFloat(marginPercent);
            if (margin > 0 && margin < 100) {
                const retail = Math.round(costPerSellUnit / (1 - margin / 100));
                setCurrentRetailPrice(retail);
            }
        }
    }, [costPerSellUnit]);

    return (
        <div className="space-y-4">
            {/* ─── SECTION HEADER ───────────────────────────── */}
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
                <span className="text-[10px] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={13} className="text-[var(--theme-accent)]" /> Selling & Retail Margin
                </span>
            </div>

            {/* ─── SELL UNIT + RETAIL PRICE ─────────────────── */}
            <div className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-6 gap-4">
                    {/* Sell Unit */}
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            Sell Unit <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                title="Sell Unit"
                                className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.unit ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-2xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none transition-all font-semibold cursor-pointer`}
                                value={customItemUnit}
                                onChange={e => {
                                    const code = e.target.value;
                                    setCustomItemUnit(code);
                                    if (errors.unit) setErrors(prev => ({ ...prev, unit: '' }));
                                    const def = getSellUnit(code);
                                    const sellBy = def.category === 'weight' ? 'Weight' : def.category === 'volume' ? 'Volume' : 'Unit';
                                    const isWeighted = def.category === 'weight' || def.category === 'volume';

                                    const sizeTypeMap: Record<string, string> = {
                                        'KG': 'kg', 'G': 'g', 'L': 'L', 'ML': 'ml',
                                        'UNIT': 'pcs', 'PACK': 'pk', 'DOZEN': 'pcs'
                                    };
                                    const currentSizeType = customAttributes.physical?.sizeType || '';
                                    const newSizeType = currentSizeType || sizeTypeMap[code] || '';

                                    setCustomAttributes((prev: any) => ({
                                        ...prev,
                                        commercial: { ...prev.commercial, sellBy, isWeighted },
                                        physical: { ...prev.physical, sizeType: newSizeType }
                                    }));
                                }}
                            >
                                <option value="" className="text-[var(--theme-text-secondary)] bg-[var(--theme-bg-panel)]">Select unit...</option>
                                {(() => {
                                    const groups = getGroupedUnits();
                                    return (
                                        <>
                                            <optgroup label="Count" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                                {groups.count.map(u => <option key={u.code} value={u.code} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{u.label}</option>)}
                                            </optgroup>
                                            <optgroup label="Weight" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                                {groups.weight.map(u => <option key={u.code} value={u.code} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{u.label}</option>)}
                                            </optgroup>
                                            <optgroup label="Volume" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                                {groups.volume.map(u => <option key={u.code} value={u.code} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{u.label}</option>)}
                                            </optgroup>
                                        </>
                                    );
                                })()}
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                        {customItemUnit && (
                            <span className="text-[10px] text-[var(--theme-text-secondary)] ml-1 font-medium">
                                {unitDef.allowDecimal ? 'Decimals allowed at POS' : 'Whole units only at POS'}
                            </span>
                        )}
                        {errors.unit && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.unit}</span>}
                    </div>

                    {/* Retail Price + Margin */}
                    <div className="col-span-4 space-y-1.5">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            Retail Price{showPerUnit ? ` /${unitDef.shortLabel}` : ''} <span className="text-rose-500">*</span>
                        </label>

                        {/* Cost per sell unit hint */}
                        {costPerSellUnit !== null && (
                            <div className="rounded-xl px-3 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                                <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-tight">Cost/{unitDef.shortLabel}: </span>
                                <span className="text-[11px] text-[var(--theme-text-primary)] font-mono font-bold tabular-nums">{currencySymbol} {costPerSellUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* Margin Input with Category Target Benchmark */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-0.5">
                                    <label className="text-[9px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Margin %</label>
                                    <button
                                        type="button"
                                        onClick={() => handleMarginChange(marginBenchmark.benchmarkPct.toString())}
                                        className="text-[9px] text-[var(--theme-accent)] hover:underline font-mono font-bold cursor-pointer"
                                        title={`Apply category target of ${marginBenchmark.benchmarkPct}%`}
                                    >
                                        Target: {marginBenchmark.benchmarkPct}%
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0.1"
                                        max="99.99"
                                        step="0.01"
                                        className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl pl-3 pr-8 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all text-center tabular-nums"
                                        value={marginPercent}
                                        onChange={e => handleMarginChange(e.target.value)}
                                        placeholder={`e.g. ${marginBenchmark.benchmarkPct}`}
                                    />
                                    <Percent size={12} className="absolute right-3.5 bottom-3.5 text-[var(--theme-text-secondary)] pointer-events-none" />
                                </div>
                                <span className="text-[8px] text-[var(--theme-text-secondary)] block ml-1 mt-0.5 truncate" title={marginBenchmark.benchmarkLabel}>
                                    {marginBenchmark.benchmarkLabel}
                                </span>
                            </div>
                            {/* Retail Price */}
                            <div>
                                <label className="text-[9px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block mb-0.5">Shelf Price</label>
                                <input
                                    type="number"
                                    className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.retail ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-2xl text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] outline-none transition-all text-center font-bold tabular-nums`}
                                    value={currentRetailPrice || ''}
                                    onChange={e => handleRetailChange(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {currentRetailPrice > 0 && costPerSellUnit && costPerSellUnit > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block text-center font-mono font-semibold">
                                Margin Gross: {currencySymbol} {(currentRetailPrice - costPerSellUnit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{unitDef.shortLabel}
                            </span>
                        )}
                        {errors.retail && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.retail}</span>}
                    </div>
                </div>

                {/* Sell By, Price Type, Flags */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <div className="col-span-1 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Sell By</label>
                        <select
                            title="Sell By"
                            className="w-full h-9 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer"
                            value={customAttributes.commercial.sellBy}
                            onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, sellBy: e.target.value } }))}
                        >
                            <option value="Unit" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Unit</option>
                            <option value="Weight" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Weight</option>
                            <option value="Volume" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Volume</option>
                        </select>
                    </div>
                    <div className="col-span-1 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Price Type</label>
                        <select
                            title="Price Type"
                            className="w-full h-9 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer"
                            value={customAttributes.commercial.priceType}
                            onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, priceType: e.target.value } }))}
                        >
                            <option value="Fixed" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Fixed</option>
                            <option value="Variable" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Variable</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-5 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={customAttributes.commercial.isReturnable}
                                onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, isReturnable: e.target.checked } }))}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Returnable</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={customAttributes.commercial.isBundleEligible}
                                onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, isBundleEligible: e.target.checked } }))}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Bundle Eligible</span>
                        </label>
                    </div>

                    {marginBenchmark.commercialNotes && (
                        <div className="col-span-2 md:col-span-4 mt-2 px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] flex items-center gap-2">
                            <TrendingUp size={12} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="text-[10px] text-[var(--theme-text-secondary)] leading-tight">
                                <strong className="text-[var(--theme-text-primary)]">{specGroup.domainTitle} Commercial Note:</strong> {marginBenchmark.commercialNotes}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
