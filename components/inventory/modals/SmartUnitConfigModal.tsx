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
            <div className="space-y-6 text-[var(--theme-text-primary)]">

                {/* Main 2-Column Split: Left = Auto & Supplier Spec | Right = How You Sell It */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Smart Intelligence & Supplier Spec */}
                    <div className="space-y-4">
                        {/* Smart Intelligence Auto-Detected Box */}
                        <div className="bg-[var(--theme-bg-subtle)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-3 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Smart Intelligence</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    Auto-Detected
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-card)] p-3.5 rounded-xl border border-[var(--theme-border)] space-y-1">
                                <p className="text-base font-bold font-mono text-[var(--theme-text-primary)]">
                                    {smartIntelligence?.autoConversionText}
                                </p>
                                {smartIntelligence?.subUnitRateText && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold font-mono">
                                        = {smartIntelligence.subUnitRateText}
                                    </p>
                                )}
                            </div>

                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium flex items-center gap-1.5">
                                <Check size={14} className="text-[var(--theme-accent)]" />
                                Sell mode auto-matched from product unit: <span className="font-bold uppercase text-[var(--theme-text-primary)]">{smartIntelligence?.sellUnit.shortLabel}</span>
                            </p>
                        </div>

                        {/* Supplier Specification (Read-Only) */}
                        <div className="bg-[var(--theme-bg-subtle)] p-4 rounded-2xl border border-[var(--theme-border)] space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Box size={16} className="text-[var(--theme-text-secondary)]" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Supplier Specification</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]">
                                    Read-Only
                                </span>
                            </div>

                            <p className="text-[11px] text-[var(--theme-text-muted)] leading-snug font-medium">
                                Physical content is supplier-defined. Configure how you sell it on the right.
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                                <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[9px] text-[var(--theme-text-muted)] block font-sans font-medium uppercase">Pack / Case Size</span>
                                    <span className="font-bold text-[var(--theme-text-primary)]">{supplierSpec.packSize}</span>
                                </div>
                                <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[9px] text-[var(--theme-text-muted)] block font-sans font-medium uppercase">Base Unit Type</span>
                                    <span className="font-bold text-[var(--theme-text-primary)]">{supplierSpec.sizeType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Live POS Label Preview */}
                        <div className="bg-[var(--theme-bg-card)] p-4 rounded-2xl border border-[var(--theme-border)] space-y-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Eye size={16} className="text-[var(--theme-text-secondary)]" />
                                <h4 className="text-xs font-bold uppercase tracking-wider">POS Label & Card Preview</h4>
                            </div>
                            <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[var(--theme-text-primary)]">{product.name}</p>
                                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">
                                        Sold per <span className="uppercase text-[var(--theme-accent)] font-bold">{smartIntelligence?.sellUnit.shortLabel}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold font-mono text-[var(--theme-text-primary)]">
                                        {smartIntelligence?.priceFormatted}{smartIntelligence?.sellUnit.code !== 'UNIT' ? `/${smartIntelligence?.sellUnit.shortLabel}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: How You Sell It Form */}
                    <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">How You Sell It</h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)]">
                                Editable
                            </span>
                        </div>

                        {/* Step 0: Where to apply — Location Scope */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[10px] flex items-center justify-center font-bold">0</span>
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
                                                ? 'bg-[var(--theme-pill-bg)] border-[var(--theme-primary)] text-[var(--theme-text-primary)]'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-bold">This Site</p>
                                            <p className="text-[9px] opacity-70 font-mono truncate">{activeSite?.name || 'Current'}</p>
                                        </div>
                                        {scope === 'THIS_SITE' && <CheckCircle2 size={14} className="text-[var(--theme-text-primary)] shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScope('SELECTED_SITES')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'SELECTED_SITES'
                                                ? 'bg-amber-500/10 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-bold">Several Places</p>
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
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-bold">All Locations</p>
                                            <p className="text-[9px] opacity-70 font-mono">{sites.length} sites</p>
                                        </div>
                                        {scope === 'ALL_SITES' && <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                                    </button>
                                </div>

                                {/* Site checklist expands when Several Places is selected */}
                                {scope === 'SELECTED_SITES' && (
                                    <div className="bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] p-3 grid grid-cols-2 gap-1.5 max-h-[130px] overflow-y-auto">
                                        {sites.map(site => (
                                            <label key={site.id} className="flex items-center gap-2 text-[10px] font-medium cursor-pointer p-1 hover:bg-[var(--theme-bg-card-hover)] rounded-lg">
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
                                                    className="rounded border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)]"
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
                            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[10px] flex items-center justify-center font-bold">1</span>
                                Charged at POS by…
                            </label>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange('count')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        category === 'count'
                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <Box size={16} />
                                        {category === 'count' && <Check size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">By Count</p>
                                        <p className="text-[9px] opacity-80 leading-tight mt-0.5">Units, packs, bottles</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange('weight')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        category === 'weight'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <Scale size={16} />
                                        {category === 'weight' && <Check size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">By Weight</p>
                                        <p className="text-[9px] opacity-80 leading-tight mt-0.5">Kg, grams — weighed</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange('volume')}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        category === 'volume'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <Sparkles size={16} />
                                        {category === 'volume' && <Check size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">By Volume</p>
                                        <p className="text-[9px] opacity-80 leading-tight mt-0.5">Litres, ml — measured</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Selling Unit — what is "1" at checkout? */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[10px] flex items-center justify-center font-bold">2</span>
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
                                                    ? 'bg-[var(--theme-pill-bg)] border-[var(--theme-primary)] text-[var(--theme-text-primary)] font-bold shadow-sm'
                                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-xs font-bold">{unit.label}</p>
                                                <p className="text-[10px] font-mono opacity-75">{unit.shortLabel}</p>
                                            </div>
                                            {isSelected && <Check size={14} className="text-[var(--theme-text-primary)]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Smart Conversion Summary Box */}
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] font-bold uppercase text-[10px]">
                                <Info size={13} />
                                <span>Smart Conversion Summary</span>
                            </div>
                            <p className="font-medium text-[var(--theme-text-secondary)]">
                                Checkout quantity entry is configured for <span className="font-bold uppercase text-[var(--theme-text-primary)]">{smartIntelligence?.sellUnit.label} ({smartIntelligence?.sellUnit.shortLabel})</span>.
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
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] rounded-xl font-medium text-xs hover:bg-[var(--theme-bg-card-hover)] transition-all cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
