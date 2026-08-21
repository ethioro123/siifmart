import React from 'react';
import {
    Check, Lock, Tag, Ruler, Package, Layers, Weight, AlertTriangle,
    ShoppingCart, Save, RefreshCw, Scale, Sparkles, Zap, Info, Building2, Globe, SlidersHorizontal
} from 'lucide-react';
import { Product, Site } from '../../../types';
import { getSellUnit, SELL_UNITS, getSmartUnitAttributes } from '../../../utils/units';

export type SellMode = 'count' | 'weight' | 'volume';
export type UnitScope = 'single' | 'custom' | 'all';

export interface UnitConfig {
    sellMode: SellMode;
    sellUnit: string;
    physicalQty: string;
    physicalUnit: string;
    packOf: string;
    caseOf: string;
    label: string;
    scope?: UnitScope;
    selectedSiteIds?: string[];
}

interface Props {
    product: Product;
    unitCfg: UnitConfig;
    setUnitCfg: React.Dispatch<React.SetStateAction<UnitConfig>>;
    handleSaveUnit: () => Promise<void>;
    isSaving: boolean;
    canDirectEdit: boolean;
    inputCls: string;
    sites?: Site[];
}

const SELL_MODE_OPTIONS: { id: SellMode; label: string; icon: any; desc: string }[] = [
    { id: 'count', label: 'By Count', icon: ShoppingCart, desc: 'Units, packs, bottles — whole items' },
    { id: 'weight', label: 'By Weight', icon: Weight, desc: 'Kg, grams — weighed at sale' },
    { id: 'volume', label: 'By Volume', icon: Scale, desc: 'Litres, ml — measured at sale' },
];

const COUNT_UNITS = SELL_UNITS.filter(u => u.category === 'count');
const WEIGHT_UNITS = SELL_UNITS.filter(u => u.category === 'weight');
const VOLUME_UNITS = SELL_UNITS.filter(u => u.category === 'volume');

export function buildPreview(cfg: UnitConfig): string {
    const unitDef = getSellUnit(cfg.sellUnit);
    const unitLabel = cfg.label.trim() || unitDef.label;
    if (cfg.sellMode === 'weight' || cfg.sellMode === 'volume') {
        return `Sold per ${unitDef.shortLabel}`;
    }
    const parts: string[] = [];
    if (cfg.caseOf && parseInt(cfg.caseOf) > 1) parts.push(`Case of ${cfg.caseOf} packs`);
    if (cfg.packOf && parseInt(cfg.packOf) > 1) parts.push(`Pack of ${cfg.packOf}`);
    parts.push(unitLabel);
    if (cfg.physicalQty && cfg.physicalUnit) parts.push(`(${cfg.physicalQty}${cfg.physicalUnit} each)`);
    return parts.join(' · ');
}

interface SmartInsight {
    lines: string[];
    mode: SellMode;
    confidence: 'high' | 'medium' | 'inferred';
}

/** Derive human-readable smart insights from product attributes */
function buildSmartInsights(product: Product, unitCfg: UnitConfig): SmartInsight | null {
    const smart = getSmartUnitAttributes(product);
    if (!smart || smart.inferredMode === 'count' && !smart.formattedNet) return null;

    const lines: string[] = [];
    const packOf = parseInt(unitCfg.packOf) || 0;
    const caseOf = parseInt(unitCfg.caseOf) || 0;

    if (smart.inferredMode === 'weight') {
        const kg = smart.inKilos;
        const g = kg != null ? kg * 1000 : null;
        if (kg != null) {
            lines.push(`1 unit = ${kg < 1 ? `${g!}g` : `${kg} kg`}`);
            lines.push(`= ${kg >= 1 ? `${g} g` : `${kg} kg`}`);
            if (packOf > 1) {
                const totalKg = kg * packOf;
                lines.push(`1 pack (${packOf} units) = ${totalKg % 1 === 0 ? totalKg : totalKg.toFixed(3)} kg`);
            }
            if (caseOf > 1 && packOf > 1) {
                const totalKg = kg * packOf * caseOf;
                lines.push(`1 case (${caseOf} packs) = ${totalKg % 1 === 0 ? totalKg : totalKg.toFixed(2)} kg`);
            }
        }
        return { lines, mode: 'weight', confidence: 'high' };
    }

    if (smart.inferredMode === 'volume') {
        const L = smart.inLiters;
        const ml = L != null ? L * 1000 : null;
        if (L != null) {
            lines.push(`1 unit = ${L < 1 ? `${ml!} ml` : `${L} L`}`);
            lines.push(`= ${L >= 1 ? `${ml} ml` : `${L} L`}`);
            if (packOf > 1) {
                const totalL = L * packOf;
                lines.push(`1 pack (${packOf} units) = ${totalL % 1 === 0 ? totalL : totalL.toFixed(3)} L`);
            }
            if (caseOf > 1 && packOf > 1) {
                const totalL = L * packOf * caseOf;
                lines.push(`1 case (${caseOf} packs) = ${totalL % 1 === 0 ? totalL : totalL.toFixed(2)} L`);
            }
        }
        return { lines, mode: 'volume', confidence: 'high' };
    }

    // Count mode with physical size
    if (smart.inferredMode === 'count' && smart.formattedNet) {
        lines.push(`Physical content: ${smart.formattedNet}`);
        if (packOf > 1 && smart.inKilos != null) {
            lines.push(`1 pack (${packOf} items) = ${(smart.inKilos * packOf).toFixed(3)} kg`);
        } else if (packOf > 1 && smart.inLiters != null) {
            lines.push(`1 pack (${packOf} items) = ${(smart.inLiters * packOf).toFixed(3)} L`);
        }
        return { lines, mode: 'count', confidence: 'medium' };
    }

    return null;
}

export const UnitTab: React.FC<Props> = ({
    product,
    unitCfg,
    setUnitCfg,
    handleSaveUnit,
    isSaving,
    canDirectEdit,
    inputCls,
    sites
}) => {
    const preview = buildPreview(unitCfg);
    const unitDef = getSellUnit(unitCfg.sellUnit);
    const availableUnits = unitCfg.sellMode === 'weight' ? WEIGHT_UNITS : unitCfg.sellMode === 'volume' ? VOLUME_UNITS : COUNT_UNITS;
    const smartAttrs = getSmartUnitAttributes(product);
    const smartInsights = buildSmartInsights(product, unitCfg);
    const isAutoDetected = smartAttrs.inferredMode === unitCfg.sellMode;

    const ca = product.customAttributes || (product as any).custom_attributes;
    const phys = ca?.physical || {};
    const pkg = ca?.packaging || {};
    const suppSize = product.size || phys.netWeight || phys.volume;
    const suppUnit = phys.sizeType || phys.unit;
    const suppBrand = product.brand;
    const caseSize = pkg.caseSize;
    const packQty = pkg.packQty || (product.packQuantity && product.packQuantity > 1 ? String(product.packQuantity) : undefined);
    const hasData = suppSize || suppUnit || suppBrand || caseSize || phys.grossWeight;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN (lg:col-span-5): Supplier Specs & POS Preview ── */}
            <div className="lg:col-span-5 space-y-4">

                {/* Smart Intelligence Panel */}
                {smartInsights && (
                    <div className="rounded-2xl border-2 border-violet-300/60 dark:border-violet-500/40 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200/60 dark:border-violet-500/30">
                            <Sparkles size={14} className="text-violet-600 dark:text-violet-400 flex-shrink-0" />
                            <p className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">Smart Intelligence</p>
                            <span className={`ml-auto text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                smartInsights.confidence === 'high'
                                    ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}>
                                {smartInsights.confidence === 'high' ? 'Auto-Detected' : 'Inferred'}
                            </span>
                        </div>
                        <div className="p-4 space-y-2">
                            {smartInsights.lines.map((line, i) => (
                                <div key={i} className={`flex items-center gap-2 ${i === 0 ? '' : 'pl-2 border-l-2 border-violet-200 dark:border-violet-700'}`}>
                                    {i === 0 && <Zap size={13} className="text-violet-500 flex-shrink-0" />}
                                    <p className={`font-mono ${i === 0 ? 'text-sm font-black text-violet-900 dark:text-violet-100' : 'text-xs font-bold text-violet-700 dark:text-violet-300'}`}>
                                        {line}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {isAutoDetected && (
                            <div className="px-4 pb-3">
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-violet-500/10 rounded-lg">
                                    <Info size={12} className="text-violet-500 flex-shrink-0" />
                                    <p className="text-[11px] text-violet-700 dark:text-violet-300 font-semibold">
                                        Sell mode auto-matched from product unit: <span className="font-black uppercase">{product.unit}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Supplier / Manufacturer Spec */}
                <div className="rounded-2xl border-2 border-stone-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-100 dark:bg-black/30 border-b border-stone-200 dark:border-white/10">
                        <Lock size={15} className="text-stone-500 flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-200">Supplier Specification</p>
                        <span className="ml-auto text-[10px] font-black uppercase px-2 py-0.5 bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-stone-400 rounded-md">Read-Only</span>
                    </div>
                    <div className="p-4">
                        {hasData ? (
                            <div className="grid grid-cols-2 gap-3.5">
                                {suppBrand && (
                                    <div className="flex items-start gap-2">
                                        <Tag size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Brand</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{suppBrand}</p>
                                        </div>
                                    </div>
                                )}
                                {suppSize && (
                                    <div className="flex items-start gap-2">
                                        <Ruler size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Net Content</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white font-mono mt-0.5">
                                                {suppSize}{suppUnit ? ` ${suppUnit}` : ''}
                                            </p>
                                            {smartAttrs.formattedNet && (
                                                <span className="text-[11px] font-black px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md inline-block mt-1 border border-green-500/20">
                                                    ≡ {smartAttrs.formattedNet}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {caseSize && (
                                    <div className="flex items-start gap-2">
                                        <Package size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Case Size</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white font-mono mt-0.5">{caseSize}</p>
                                        </div>
                                    </div>
                                )}
                                {packQty && (
                                    <div className="flex items-start gap-2">
                                        <Layers size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Units / Case</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white font-mono mt-0.5">{packQty}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-stone-500 font-semibold italic">No supplier spec on record. Captured from POs on stock receipt.</p>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-300/60 dark:border-amber-500/30 rounded-xl">
                            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-snug">
                                Physical content is supplier-defined. Configure how you sell it on the right.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Live POS Label Preview */}
                <div className="p-4 bg-[#2C5E3B]/10 border-2 border-[#2C5E3B]/30 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#2C5E3B] flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                        <Check size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">POS Label Preview</p>
                        <p className="text-sm font-black text-stone-900 dark:text-white truncate mt-0.5">{product.name} · {preview}</p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT COLUMN (lg:col-span-7): How You Sell It (EDITABLE) ── */}
            <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl border-2 border-[#2C5E3B]/30 dark:border-[#A9CBA2]/25 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-b border-[#2C5E3B]/20 dark:border-[#A9CBA2]/15">
                        <ShoppingCart size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2] flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-wider text-[#2C5E3B] dark:text-[#A9CBA2]">How You Sell It</p>
                        <span className="ml-auto text-[10px] font-black uppercase px-2 py-0.5 bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-md">Editable</span>
                    </div>
                    <div className="p-5 space-y-5">

                        {/* Step 0: Location Scope Application */}
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#2C5E3B] text-white text-[11px] flex items-center justify-center font-black flex-shrink-0 shadow-sm">0</span>
                                Apply to Location(s)
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setUnitCfg(c => ({ ...c, scope: 'single' }))}
                                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${ (unitCfg.scope || 'single') === 'single' ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-md' : 'bg-stone-50 dark:bg-black/20 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-[#2C5E3B]/50' }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-black uppercase">Certain Location</p>
                                        {(unitCfg.scope || 'single') === 'single' && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className={`text-[10px] leading-tight ${ (unitCfg.scope || 'single') === 'single' ? 'text-white/80' : 'text-stone-400' }`}>This store only</p>
                                </button>
                                <button type="button" onClick={() => setUnitCfg(c => ({ ...c, scope: 'custom', selectedSiteIds: c.selectedSiteIds?.length ? c.selectedSiteIds : (sites || []).map(s => s.id) }))}
                                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${ unitCfg.scope === 'custom' ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-stone-50 dark:bg-black/20 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-amber-600/50' }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-black uppercase">Several Places</p>
                                        {unitCfg.scope === 'custom' && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className={`text-[10px] leading-tight ${ unitCfg.scope === 'custom' ? 'text-white/80' : 'text-stone-400' }`}>{(unitCfg.selectedSiteIds || []).length} site(s) selected</p>
                                </button>
                                <button type="button" onClick={() => setUnitCfg(c => ({ ...c, scope: 'all' }))}
                                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${ unitCfg.scope === 'all' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-stone-50 dark:bg-black/20 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-blue-600/50' }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-black uppercase">All Locations</p>
                                        {unitCfg.scope === 'all' && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className={`text-[10px] leading-tight ${ unitCfg.scope === 'all' ? 'text-white/80' : 'text-stone-400' }`}>Global network</p>
                                </button>
                            </div>
                            {unitCfg.scope === 'custom' && sites && sites.length > 0 && (
                                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-xl grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                                    {sites.map(site => (
                                        <label key={site.id} className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer p-1 hover:bg-amber-100/50 dark:hover:bg-white/5 rounded-lg">
                                            <input type="checkbox" checked={(unitCfg.selectedSiteIds || []).includes(site.id)}
                                                onChange={e => {
                                                    const cur = unitCfg.selectedSiteIds || [];
                                                    setUnitCfg(c => ({ ...c, selectedSiteIds: e.target.checked ? [...cur, site.id] : cur.filter(id => id !== site.id) }));
                                                }} className="rounded border-stone-300 text-amber-600 focus:ring-amber-500" />
                                            <span className="truncate">{site.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Step 1: Selling mode */}
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2.5 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#2C5E3B] text-white text-xs flex items-center justify-center font-black flex-shrink-0 shadow-sm">1</span>
                                Charged at POS by…
                            </p>
                            <div className="grid grid-cols-3 gap-2.5">
                                {SELL_MODE_OPTIONS.map(opt => {
                                    const isActive = unitCfg.sellMode === opt.id;
                                    const isAutoMatch = smartAttrs.inferredMode === opt.id;
                                    return (
                                        <button key={opt.id} type="button"
                                            onClick={() => {
                                                const def = opt.id === 'weight' ? 'KG' : opt.id === 'volume' ? 'L' : 'UNIT';
                                                setUnitCfg(c => ({ ...c, sellMode: opt.id, sellUnit: def }));
                                            }}
                                            className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                isActive
                                                    ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-md'
                                                    : 'bg-stone-50 dark:bg-black/20 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-[#2C5E3B]/50'
                                            }`}>
                                            {isAutoMatch && !isActive && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-violet-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-sm">
                                                    Auto
                                                </span>
                                            )}
                                            {isAutoMatch && isActive && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-white text-[#2C5E3B] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-sm">
                                                    ✓ Auto
                                                </span>
                                            )}
                                            <opt.icon size={16} className="mb-1" />
                                            <p className="text-xs font-black uppercase">{opt.label}</p>
                                            <p className={`text-[11px] mt-0.5 leading-snug font-medium ${isActive ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>{opt.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 2: Selling unit */}
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2.5 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#2C5E3B] text-white text-xs flex items-center justify-center font-black flex-shrink-0 shadow-sm">2</span>
                                Selling unit — what is "1" at checkout?
                            </p>
                            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                                {availableUnits.map(u => (
                                    <button key={u.code} type="button"
                                        onClick={() => setUnitCfg(c => ({ ...c, sellUnit: u.code }))}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                            unitCfg.sellUnit === u.code
                                                ? 'bg-[#2C5E3B]/15 border-[#2C5E3B] text-[#2C5E3B] dark:text-[#A9CBA2] font-black'
                                                : 'bg-stone-50 dark:bg-black/20 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-[#2C5E3B]/30'
                                        }`}>
                                        <p className="text-xs font-bold truncate">{u.label}</p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">{u.shortLabel}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Pack & Case Multipliers */}
                        {unitCfg.sellMode === 'count' && (
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2.5 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-black flex-shrink-0 shadow-sm">3</span>
                                    Pack &amp; Case Multipliers <span className="font-normal normal-case text-stone-500">(supplier units per pack/case)</span>
                                </p>
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="text-xs text-stone-600 dark:text-stone-300 font-bold uppercase block mb-1">Units per Pack</label>
                                        <input type="number" min="1" value={unitCfg.packOf}
                                            aria-label="Units per Pack"
                                            title="Units per Pack"
                                            onChange={e => setUnitCfg(c => ({ ...c, packOf: e.target.value }))}
                                            placeholder="e.g. 6"
                                            className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-600 dark:text-stone-300 font-bold uppercase block mb-1">Packs per Case</label>
                                        <input type="number" min="1" value={unitCfg.caseOf}
                                            aria-label="Packs per Case"
                                            title="Packs per Case"
                                            onChange={e => setUnitCfg(c => ({ ...c, caseOf: e.target.value }))}
                                            placeholder="e.g. 4"
                                            className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-600 dark:text-stone-300 font-bold uppercase block mb-1">Label Override</label>
                                        <input type="text" value={unitCfg.label}
                                            aria-label="Display Label Override"
                                            title="Display Label Override"
                                            onChange={e => setUnitCfg(c => ({ ...c, label: e.target.value }))}
                                            placeholder={unitDef.label}
                                            className={inputCls} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3 (weight/volume): Quantity definition */}
                        {(unitCfg.sellMode === 'weight' || unitCfg.sellMode === 'volume') && smartInsights && (
                            <div className="p-3.5 bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-700/50 rounded-xl">
                                <p className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
                                    <Sparkles size={12} /> Smart Conversion Summary
                                </p>
                                <div className="space-y-1">
                                    {smartInsights.lines.map((line, i) => (
                                        <p key={i} className={`font-mono ${i === 0 ? 'text-sm font-black text-violet-900 dark:text-violet-100' : 'text-xs font-bold text-violet-600 dark:text-violet-400'}`}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {!canDirectEdit && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Selling config changes require CEO approval. Your save will submit a change request.</p>
                    </div>
                )}

                <button onClick={handleSaveUnit} disabled={isSaving}
                    className="w-full py-3.5 bg-[#2C5E3B] hover:bg-[#1B3520] text-white rounded-xl font-black text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? 'Saving...' : 'Save Selling Configuration'}
                </button>
            </div>
        </div>
    );
};
