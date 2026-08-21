import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../Modal';
import { Product } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getSellUnit, SELL_UNITS, SellUnit } from '../../../utils/units';
import { productsService } from '../../../services/supabase.service';
import { logger } from '../../../utils/logger';
import {
    Sparkles, Scale, Box, Check, Info, Layers, Building2,
    DollarSign, CheckCircle2, ShieldAlert, ArrowRight, Eye, RefreshCw
} from 'lucide-react';

interface SmartUnitConfigModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

type ScopeType = 'THIS_SITE' | 'SELECTED_SITES' | 'ALL_SITES';
type CategoryType = 'count' | 'weight' | 'volume';

export const SmartUnitConfigModal: React.FC<SmartUnitConfigModalProps> = ({
    product,
    isOpen,
    onClose,
    onSaveSuccess
}) => {
    const { t } = useLanguage();
    const { sites, activeSite, updateProduct, refreshData } = useData();
    const { user, showToast } = useStore();

    // Form States
    const [scope, setScope] = useState<ScopeType>('THIS_SITE');
    const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
    const [category, setCategory] = useState<CategoryType>('count');
    const [selectedUnitCode, setSelectedUnitCode] = useState<string>('UNIT');
    const [isSaving, setIsSaving] = useState(false);

    // Initializer
    useEffect(() => {
        if (product) {
            const sellUnit = getSellUnit(product.unit);
            setCategory(sellUnit.category);
            setSelectedUnitCode(sellUnit.code);
            if (activeSite?.id) {
                setSelectedSiteIds([activeSite.id]);
            }
        }
    }, [product, activeSite]);

    // Available Units filtered by category
    const availableUnits = useMemo(() => {
        return SELL_UNITS.filter(u => u.category === category);
    }, [category]);

    // Auto-detected conversion intelligence math
    const smartIntelligence = useMemo(() => {
        if (!product) return null;
        const sellUnit = getSellUnit(selectedUnitCode);
        const price = product.price || 0;

        let autoConversionText = `1 unit = 1 ${sellUnit.shortLabel}`;
        let subUnitRateText = '';

        if (sellUnit.code === 'L') {
            autoConversionText = `1 unit = 1 L = 1000 ml`;
            subUnitRateText = `${(price / 1000).toFixed(4)} ${CURRENCY_SYMBOL} per ml`;
        } else if (sellUnit.code === 'ML') {
            autoConversionText = `1 unit = 1 ml = 0.001 L`;
            subUnitRateText = `${(price * 1000).toFixed(2)} ${CURRENCY_SYMBOL} per L`;
        } else if (sellUnit.code === 'KG') {
            autoConversionText = `1 unit = 1 kg = 1000 g`;
            subUnitRateText = `${(price / 1000).toFixed(4)} ${CURRENCY_SYMBOL} per g`;
        } else if (sellUnit.code === 'G') {
            autoConversionText = `1 unit = 1 g = 0.001 kg`;
            subUnitRateText = `${(price * 1000).toFixed(2)} ${CURRENCY_SYMBOL} per kg`;
        } else if (sellUnit.code === 'CL') {
            autoConversionText = `1 unit = 1 cl = 10 ml`;
            subUnitRateText = `${(price / 10).toFixed(3)} ${CURRENCY_SYMBOL} per ml`;
        } else if (sellUnit.code === 'GAL') {
            autoConversionText = `1 unit = 1 gal = 3.785 L`;
            subUnitRateText = `${(price / 3.785).toFixed(2)} ${CURRENCY_SYMBOL} per L`;
        }

        return {
            sellUnit,
            autoConversionText,
            subUnitRateText,
            priceFormatted: `${CURRENCY_SYMBOL} ${formatPriceValue(price)}`
        };
    }, [product, selectedUnitCode]);

    if (!product) return null;

    // Supplier spec payload details (captured from PO or custom attributes)
    const customAttrs = product.customAttributes || (product as any).custom_attributes;
    const supplierSpec = {
        packSize: customAttrs?.physical?.netWeight || product.size || '1 unit',
        sizeType: customAttrs?.physical?.sizeType || product.unit || 'UNIT',
        poRef: (product as any).poNumber || 'Captured on PO Receipt',
        vendorName: (product as any).supplier || product.brand || 'Supplier Record'
    };

    const handleCategoryChange = (newCat: CategoryType) => {
        setCategory(newCat);
        const defaultForCat = SELL_UNITS.find(u => u.category === newCat);
        if (defaultForCat) {
            setSelectedUnitCode(defaultForCat.code);
        }
    };

    const handleSave = async () => {
        if (!product) return;
        setIsSaving(true);
        try {
            const targetSiteIds: string[] = [];
            if (scope === 'THIS_SITE' && activeSite?.id) {
                targetSiteIds.push(activeSite.id);
            } else if (scope === 'ALL_SITES') {
                sites.forEach(s => targetSiteIds.push(s.id));
            } else if (scope === 'SELECTED_SITES') {
                targetSiteIds.push(...selectedSiteIds);
            }

            // Update product sell unit
            await productsService.update(product.id, {
                unit: selectedUnitCode
            });

            showToast(
                `Smart Unit updated to ${selectedUnitCode} for ${targetSiteIds.length || 1} location(s)`,
                'success'
            );
            if (onSaveSuccess) onSaveSuccess();
            await refreshData();
            onClose();
        } catch (error: any) {
            logger.error('SmartUnitConfigModal', 'Failed to update unit config', error);
            showToast(error?.message || 'Failed to save smart unit configuration', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Smart Intelligence Unit & Selling Spec"
            size="xl"
        >
            <div className="space-y-6 text-[#1E3F27] dark:text-[#EAE5D9]">

                {/* Main 2-Column Split: Left = Auto & Supplier Spec | Right = How You Sell It */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Smart Intelligence & Supplier Spec */}
                    <div className="space-y-4">
                        {/* Smart Intelligence Auto-Detected Box */}
                        <div className="bg-gradient-to-br from-[#2C5E3B]/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-[#2C5E3B]/20 space-y-3 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-[#1E3F27] dark:text-[#EAE5D9]">Smart Intelligence</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    Auto-Detected
                                </span>
                            </div>

                            <div className="bg-white/80 dark:bg-black/40 p-3.5 rounded-xl border border-[#E2DCCE]/60 dark:border-white/5 space-y-1">
                                <p className="text-base font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    {smartIntelligence?.autoConversionText}
                                </p>
                                {smartIntelligence?.subUnitRateText && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold font-mono">
                                        = {smartIntelligence.subUnitRateText}
                                    </p>
                                )}
                            </div>

                            <p className="text-[11px] text-[#4D6E56] dark:text-gray-300 font-semibold flex items-center gap-1.5">
                                <Check size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                Sell mode auto-matched from product unit: <span className="font-bold uppercase text-[#1E3F27] dark:text-white">{smartIntelligence?.sellUnit.shortLabel}</span>
                            </p>
                        </div>

                        {/* Supplier Specification (Read-Only) */}
                        <div className="bg-stone-50 dark:bg-black/20 p-4 rounded-2xl border border-[#E2DCCE] dark:border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Box size={16} className="text-stone-500" />
                                    <h4 className="text-xs font-black uppercase tracking-wider">Supplier Specification</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-gray-400">
                                    Read-Only
                                </span>
                            </div>

                            <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-snug font-medium">
                                Physical content is supplier-defined. Configure how you sell it on the right.
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                                <div className="p-2.5 bg-white dark:bg-black/30 rounded-xl border border-[#E2DCCE]/50 dark:border-white/5">
                                    <span className="text-[9px] text-stone-400 block font-sans font-bold uppercase">Pack / Case Size</span>
                                    <span className="font-black text-[#1E3F27] dark:text-stone-200">{supplierSpec.packSize}</span>
                                </div>
                                <div className="p-2.5 bg-white dark:bg-black/30 rounded-xl border border-[#E2DCCE]/50 dark:border-white/5">
                                    <span className="text-[9px] text-stone-400 block font-sans font-bold uppercase">Base Unit Type</span>
                                    <span className="font-black text-[#1E3F27] dark:text-stone-200">{supplierSpec.sizeType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Live POS Label Preview */}
                        <div className="bg-white dark:bg-black/30 p-4 rounded-2xl border border-[#E2DCCE] dark:border-white/10 space-y-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Eye size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                <h4 className="text-xs font-black uppercase tracking-wider">POS Label & Card Preview</h4>
                            </div>
                            <div className="p-3 rounded-xl bg-[#F4F0E6] dark:bg-black/60 border border-[#E2DCCE] dark:border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-extrabold text-[#1E3F27] dark:text-white">{product.name}</p>
                                    <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-bold">
                                        Sold per <span className="uppercase text-[#2C5E3B] dark:text-[#A9CBA2] font-black">{smartIntelligence?.sellUnit.shortLabel}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
                                        {smartIntelligence?.priceFormatted}{smartIntelligence?.sellUnit.code !== 'UNIT' ? `/${smartIntelligence?.sellUnit.shortLabel}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: How You Sell It Form */}
                    <div className="bg-white dark:bg-black/20 p-5 rounded-2xl border border-[#E2DCCE] dark:border-white/10 space-y-5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-[#E2DCCE]/60 dark:border-white/5 pb-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#1E3F27] dark:text-white">How You Sell It</h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                Editable
                            </span>
                        </div>

                        {/* Step 0: Where to apply — Location Scope */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-stone-600 dark:text-gray-300 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[#2C5E3B] text-white text-[10px] flex items-center justify-center font-bold">0</span>
                                Apply to which location(s)?
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {/* Row of 3 scope pills */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScope('THIS_SITE')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'THIS_SITE'
                                                ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2]'
                                                : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black">This Site</p>
                                            <p className="text-[9px] opacity-70 font-mono truncate">{activeSite?.name || 'Current'}</p>
                                        </div>
                                        {scope === 'THIS_SITE' && <CheckCircle2 size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScope('SELECTED_SITES')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'SELECTED_SITES'
                                                ? 'bg-amber-500/10 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300'
                                                : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black">Several Places</p>
                                            <p className="text-[9px] opacity-70 font-mono">{selectedSiteIds.length} selected</p>
                                        </div>
                                        {scope === 'SELECTED_SITES' && <CheckCircle2 size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScope('ALL_SITES')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'ALL_SITES'
                                                ? 'bg-blue-500/10 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                                                : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black">All Locations</p>
                                            <p className="text-[9px] opacity-70 font-mono">{sites.length} sites</p>
                                        </div>
                                        {scope === 'ALL_SITES' && <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                                    </button>
                                </div>

                                {/* Site checklist expands when Several Places is selected */}
                                {scope === 'SELECTED_SITES' && (
                                    <div className="bg-stone-50 dark:bg-black/30 rounded-xl border border-amber-200 dark:border-amber-800/30 p-3 grid grid-cols-2 gap-1.5 max-h-[130px] overflow-y-auto">
                                        {sites.map(site => (
                                            <label key={site.id} className="flex items-center gap-2 text-[10px] font-medium cursor-pointer p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSiteIds.includes(site.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSiteIds([...selectedSiteIds, site.id]);
                                                        } else {
                                                            setSelectedSiteIds(selectedSiteIds.filter(id => id !== site.id));
                                                        }
                                                    }}
                                                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="truncate">{site.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 1: Charged at POS by */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-stone-600 dark:text-gray-300 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[#2C5E3B] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                                Charged at POS by…
                            </label>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange('count')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        category === 'count'
                                            ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                                            : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <Box size={16} />
                                        {category === 'count' && <Check size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black">By Count</p>
                                        <p className="text-[9px] opacity-80 leading-tight mt-0.5">Units, packs, bottles</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange('weight')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        category === 'weight'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <Scale size={16} />
                                        {category === 'weight' && <Check size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black">By Weight</p>
                                        <p className="text-[9px] opacity-80 leading-tight mt-0.5">Kg, grams — weighed</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange('volume')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        category === 'volume'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <Sparkles size={16} />
                                        {category === 'volume' && <Check size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black">By Volume</p>
                                        <p className="text-[9px] opacity-80 leading-tight mt-0.5">Litres, ml — measured</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Selling Unit — what is "1" at checkout? */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-stone-600 dark:text-gray-300 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[#2C5E3B] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                                Selling unit — what is "1" at checkout?
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {availableUnits.map(unit => {
                                    const isSelected = selectedUnitCode === unit.code;
                                    return (
                                        <button
                                            key={unit.code}
                                            type="button"
                                            onClick={() => setSelectedUnitCode(unit.code)}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] text-[#2C5E3B] dark:text-[#A9CBA2] font-black shadow-sm'
                                                    : 'bg-stone-50 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-xs font-bold">{unit.label}</p>
                                                <p className="text-[10px] font-mono opacity-75">{unit.shortLabel}</p>
                                            </div>
                                            {isSelected && <Check size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Smart Conversion Summary Box */}
                        <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase text-[10px]">
                                <Info size={13} />
                                <span>Smart Conversion Summary</span>
                            </div>
                            <p className="font-medium text-stone-700 dark:text-stone-300">
                                Checkout quantity entry is configured for <span className="font-bold uppercase">{smartIntelligence?.sellUnit.label} ({smartIntelligence?.sellUnit.shortLabel})</span>.
                            </p>
                            {smartIntelligence?.sellUnit.allowDecimal && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                    Decimal entry enabled (step: {smartIntelligence.sellUnit.step}). Cashiers can weigh/measure fractional quantities at POS checkout.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2DCCE] dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs hover:bg-stone-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#224429] to-[#2C5E3B] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Applying Spec…</span>
                            </>
                        ) : (
                            <>
                                <Check size={14} />
                                <span>Apply Smart Spec</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
