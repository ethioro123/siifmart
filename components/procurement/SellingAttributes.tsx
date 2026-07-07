import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, ChevronDown, Percent } from 'lucide-react';
import { getGroupedUnits, getSellUnit } from '../../utils/units';
import { logger } from '../../utils/logger';

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

    // Handle count-based selling units: bypass physical size
    if (sellCategory === 'count') {
        const packagingUnits = (caseSize > 1) ? (caseSize * packQty) : (packQty > 1 ? packQty : 1);
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
        logger.warn('SellingAttributes', `   ⚠️ Category mismatch or unknown: "${sizeCategory}" vs "${sellCategory}". Cannot compute cost per sell unit.`);
        return null;
    }

    // Calculate how many items are in the package
    const itemsPerPurchaseUnit = (caseSize > 1) ? (caseSize * packQty) : (packQty > 1 ? packQty : 1);
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
    errors, setErrors,
}) => {
    const unitDef = getSellUnit(customItemUnit);
    const showPerUnit = customItemUnit && unitDef.category !== 'count';

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
            <div className="flex items-center gap-2 pb-2 border-b border-[#2C5E3B]/20 dark:border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.4)] dark:shadow-[0_0_8px_rgba(169,203,162,0.4)]" />
                <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-[0.2em]">Selling & Retail</span>
            </div>

            {/* ─── SELL UNIT + RETAIL PRICE ─────────────────── */}
            <div className="relative overflow-hidden rounded-xl p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/10 via-transparent to-[#8C6239]/10 dark:from-[#2C5E3B]/20 dark:via-transparent dark:to-[#8C6239]/20 opacity-30" />
                <div className="relative glass-panel rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-200 dark:border-white/10">
                        <DollarSign size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <h5 className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest">Pricing & Units</h5>
                    </div>

                    <div className="grid grid-cols-6 gap-4">
                        {/* Sell Unit */}
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Sell Unit <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">*</span></label>
                            <div className="relative">
                                <select
                                    title="Sell Unit"
                                    className={`w-full bg-gray-50 dark:bg-black/40 border ${errors.unit ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none appearance-none transition-all font-bold cursor-pointer`}
                                    value={customItemUnit}
                                    onChange={e => {
                                        const code = e.target.value;
                                        setCustomItemUnit(code);
                                        if (errors.unit) setErrors(prev => ({ ...prev, unit: '' }));
                                        const def = getSellUnit(code);
                                        const sellBy = def.category === 'weight' ? 'Weight' : def.category === 'volume' ? 'Volume' : 'Unit';
                                        const isWeighted = def.category === 'weight' || def.category === 'volume';

                                        // Only set default sizeType if current physical sizeType is not already populated
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
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-500">Select unit...</option>
                                    {(() => {
                                        const groups = getGroupedUnits();
                                        return (
                                            <>
                                                <optgroup label="Count" className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-300">
                                                    {groups.count.map(u => <option key={u.code} value={u.code} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{u.label}</option>)}
                                                </optgroup>
                                                <optgroup label="Weight" className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-300">
                                                    {groups.weight.map(u => <option key={u.code} value={u.code} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{u.label}</option>)}
                                                </optgroup>
                                                <optgroup label="Volume" className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-300">
                                                    {groups.volume.map(u => <option key={u.code} value={u.code} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{u.label}</option>)}
                                                </optgroup>
                                            </>
                                        );
                                    })()}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>
                            {customItemUnit && (
                                <span className="text-[9px] text-gray-500 ml-1">
                                    {unitDef.allowDecimal ? 'Decimals allowed at POS' : 'Whole numbers only at POS'}
                                </span>
                            )}
                            {errors.unit && <span className="text-[9px] text-red-500 ml-1">{errors.unit}</span>}
                        </div>

                        {/* Retail Price + Margin — always both visible */}
                        <div className="col-span-4 space-y-1.5">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">
                                Retail Price{showPerUnit ? ` /${unitDef.shortLabel}` : ''} <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">*</span>
                            </label>

                            {/* Cost per sell unit hint */}
                            {costPerSellUnit !== null && (
                                <div className="glass-panel-pushed rounded-lg px-3 py-1 shadow-inner">
                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-tight">Cost/{unitDef.shortLabel}: </span>
                                    <span className="text-[10px] text-gray-900 dark:text-white font-mono font-black">{costPerSellUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                {/* Margin Input — always visible */}
                                <div className="relative">
                                    <label className="text-[8px] text-gray-600 uppercase font-bold ml-1 block mb-0.5">Margin %</label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        max="99.99"
                                        step="0.01"
                                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-sm text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-black focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all text-center shadow-sm"
                                        value={marginPercent}
                                        onChange={e => handleMarginChange(e.target.value)}
                                        placeholder="e.g. 33.5"
                                    />
                                    <Percent size={12} className="absolute right-3 bottom-3.5 text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50" />
                                </div>
                                {/* Retail Price — always visible */}
                                <div>
                                    <label className="text-[8px] text-gray-600 uppercase font-bold ml-1 block mb-0.5">Price</label>
                                    <input
                                        type="number"
                                        className={`w-full bg-gray-50 dark:bg-black/40 border ${errors.retail ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all text-center font-black shadow-sm`}
                                        value={currentRetailPrice || ''}
                                        onChange={e => handleRetailChange(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            {currentRetailPrice > 0 && costPerSellUnit && costPerSellUnit > 0 && (
                                <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2]/70 block text-center font-black uppercase tracking-tight">
                                    Profit: {(currentRetailPrice - costPerSellUnit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{unitDef.shortLabel}
                                </span>
                            )}
                            {errors.retail && <span className="text-[9px] text-red-500 ml-1">{errors.retail}</span>}
                        </div>
                    </div>

                    {/* Sell By, Price Type, Flags */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/5">
                        <div className="col-span-1 space-y-1">
                            <label className="text-[9px] text-gray-500 dark:text-gray-500 uppercase font-black ml-1">Sell By</label>
                            <select title="Sell By" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none appearance-none font-bold cursor-pointer" value={customAttributes.commercial.sellBy} onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, sellBy: e.target.value } }))}>
                                <option value="Unit" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Unit</option>
                                <option value="Weight" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Weight</option>
                                <option value="Volume" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Volume</option>
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[9px] text-gray-500 dark:text-gray-500 uppercase font-black ml-1">Price Type</label>
                            <select title="Price Type" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none appearance-none font-bold cursor-pointer" value={customAttributes.commercial.priceType} onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, priceType: e.target.value } }))}>
                                <option value="Fixed" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Fixed</option>
                                <option value="Variable" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Variable</option>
                            </select>
                        </div>
                        <div className="col-span-2 flex flex-wrap items-center gap-5 pt-1 uppercase tracking-tight">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="peer w-3 h-3 rounded border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-[#2C5E3B] dark:text-[#A9CBA2]" checked={customAttributes.commercial.isReturnable} onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, isReturnable: e.target.checked } }))} />
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors font-black">Returnable</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="peer w-3 h-3 rounded border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-[#2C5E3B] dark:text-[#A9CBA2]" checked={customAttributes.commercial.isBundleEligible} onChange={e => setCustomAttributes((prev: any) => ({ ...prev, commercial: { ...prev.commercial, isBundleEligible: e.target.checked } }))} />
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors font-black">Bundle Eligible</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
