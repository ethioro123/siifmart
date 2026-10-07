import React from 'react';
import { formatPriceValue } from '../../utils/formatting';
import { Info, Package, Scale, Thermometer, Tag, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { formatPackBadge, formatPOItemDescription } from './utils';
import { getSellUnit } from '../../utils/units';
import { getCategorySpecGroup } from './categoryAttributes';

interface ItemPreviewCardProps {
    name: string;
    brand: string;
    size: string;
    unit: string;
    category: string;
    description?: string;
    price?: number;
    cost?: number;
    retailPrice?: number;
    image?: string;
    currencySymbol?: string;
    customAttributes?: any;
    orderUnitName?: string;
    unitsPerOrderUnit?: number;
}

export const ItemPreviewCard: React.FC<ItemPreviewCardProps> = ({
    name,
    brand,
    size,
    unit,
    category,
    description,
    price = 0,
    cost,
    retailPrice,
    image,
    currencySymbol = 'ETB',
    customAttributes,
    orderUnitName = 'Case',
    unitsPerOrderUnit = 1
}) => {
    const effectiveCost = cost !== undefined ? cost : price;
    const effectiveRetail = retailPrice !== undefined ? retailPrice : 0;
    const unitsPerOrder = unitsPerOrderUnit > 1 ? unitsPerOrderUnit : 1;
    const isBulkOrder = unitsPerOrder > 1;
    const costPerSellUnit = effectiveCost > 0 ? effectiveCost / unitsPerOrder : 0;
    const sellUnitDef = getSellUnit(unit);
    const sellUnitLabel = sellUnitDef.shortLabel || 'ea';

    // Margin calculations
    let marginPct: number | null = null;
    let grossProfit: number | null = null;
    if (effectiveRetail > 0 && costPerSellUnit > 0) {
        marginPct = ((effectiveRetail - costPerSellUnit) / effectiveRetail) * 100;
        grossProfit = effectiveRetail - costPerSellUnit;
    }

    const AttrBadge = ({
        label,
        value,
        isAlert,
        icon: Icon
    }: {
        label: string;
        value?: string | number | boolean | null;
        isAlert?: boolean;
        icon?: React.ComponentType<{ size: number; className?: string }>;
    }) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'boolean' && !value) return null;

        const displayValue = typeof value === 'boolean' ? label : value;
        const displayLabel = typeof value === 'boolean' ? '' : label;

        return (
            <div
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${
                    isAlert
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                        : 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'
                }`}
            >
                {Icon && <Icon size={11} className={isAlert ? 'text-rose-600 dark:text-rose-400 shrink-0' : 'text-[var(--theme-text-secondary)] shrink-0'} />}
                {displayLabel && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)]">
                        {displayLabel}
                    </span>
                )}
                <span className="text-[11px] font-bold font-mono tabular-nums leading-none truncate text-[var(--theme-text-primary)]">
                    {displayValue}
                </span>
            </div>
        );
    };

    // Packaging level calculation
    const packagingLevel = customAttributes?.packaging?.packagingLevel ||
        ((parseInt(customAttributes?.packaging?.caseSize) > 0) ? 'two_tier' :
        (customAttributes?.packaging?.packageType === 'Bale') ? 'bale' :
        (parseInt(customAttributes?.packaging?.packQty) > 1) ? 'case' : 'single');

    // Filter active items per group (GS1 / Walmart Item 360 Architecture)
    const packagingAttrs = [
        { label: 'Level', value: packagingLevel === 'single' ? 'Single Unit (1:1)' : packagingLevel === 'two_tier' ? '2-Tier Master Case' : packagingLevel === 'bale' ? 'Bulk Bale' : 'Master Case' },
        { label: 'Container', value: customAttributes?.packaging?.packageType || (packagingLevel === 'single' ? 'Retail Box' : 'Case') },
        { label: 'Multiplier', value: isBulkOrder ? `×${unitsPerOrder} ${sellUnitLabel}` : '1:1 Each' },
        { label: 'Material', value: customAttributes?.packaging?.material },
        { label: 'Breakable', value: customAttributes?.packaging?.isBreakable, isAlert: true, icon: AlertTriangle }
    ].filter(a => a.value !== null && a.value !== undefined && a.value !== '' && a.value !== false);

    const physicalAttrs = [
        { label: 'Net Content', value: customAttributes?.physical?.netWeight ? `${customAttributes.physical.netWeight} ${customAttributes?.physical?.sizeType || unit || ''}`.trim() : null },
        { label: 'Gross Wt', value: customAttributes?.physical?.grossWeight ? (/[a-zA-Z]/.test(customAttributes.physical.grossWeight) ? customAttributes.physical.grossWeight : `${customAttributes.physical.grossWeight} kg`) : null },
        { label: 'Form', value: customAttributes?.physical?.form },
        { label: 'Dimensions', value: customAttributes?.physical?.dims },
        { label: 'Color', value: customAttributes?.physical?.color }
    ].filter(a => a.value !== null && a.value !== undefined && a.value !== '' && a.value !== false);

    // Dynamic category-specific specifications
    const specGroup = getCategorySpecGroup(category, customAttributes?.identity?.subcategory);
    const categorySpecific = customAttributes?.categorySpecific || {};
    const categoryAttrs = specGroup.fields
        .map(f => {
            let val = categorySpecific[f.key];
            if (val === undefined || val === null || val === '') {
                if (f.key === 'modelNumber') val = customAttributes?.identity?.modelNumber;
                if (f.key === 'variantStyle') val = customAttributes?.identity?.variant;
                if (f.key === 'shelfLifeDays') val = customAttributes?.storage?.shelfLifeDays;
                if (f.key === 'scentFragrance') val = customAttributes?.descriptive?.scent;
            }
            return {
                label: f.label.replace(/\s*\(.*\)/, '').replace(/\s*\/.*$/, '').trim(),
                value: val
            };
        })
        .filter(a => a.value !== null && a.value !== undefined && a.value !== '' && a.value !== false);

    const storageAttrs = [
        { label: 'Condition', value: customAttributes?.storage?.type },
        { label: 'Hazard', value: customAttributes?.storage?.isHazardous ? 'Hazardous Material' : null, isAlert: true, icon: AlertTriangle },
        { label: 'Fragile', value: customAttributes?.storage?.isFragile ? 'Fragile' : null, isAlert: true, icon: AlertTriangle },
        { label: 'Light Sensitive', value: customAttributes?.storage?.isLightSensitive ? 'Light Sensitive' : null },
        { label: 'Stack Limit', value: customAttributes?.storage?.stackLimit ? `Max ${customAttributes.storage.stackLimit} high` : null }
    ].filter(a => a.value !== null && a.value !== undefined && a.value !== '' && a.value !== false);

    const commercialAttrs = [
        { label: 'Sell By', value: customAttributes?.commercial?.sellBy },
        { label: 'Price Type', value: customAttributes?.commercial?.priceType },
        { label: 'Returnable', value: customAttributes?.commercial?.isReturnable !== undefined ? (customAttributes.commercial.isReturnable ? 'Returnable' : 'Non-Returnable') : null },
        { label: 'Bundle', value: customAttributes?.commercial?.isBundleEligible ? 'Bundle Eligible' : null },
        { label: 'Weighted', value: customAttributes?.commercial?.isWeighted ? 'Scale Weighted' : null }
    ].filter(a => a.value !== null && a.value !== undefined && a.value !== '' && a.value !== false);

    return (
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col gap-4 shadow-sm">
            {/* ─── Header: Brand, Name & Normalized Pricing ─── */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-[var(--theme-border-subtle)] pb-3.5">
                <div>
                    <h3 className="text-base font-black text-[var(--theme-text-primary)] leading-tight tracking-tight">
                        {brand && <span className="text-[var(--theme-accent)] font-semibold">{brand} </span>}
                        {name || 'Item Name'}
                    </h3>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 font-mono uppercase font-semibold flex items-center gap-1.5 flex-wrap">
                        {customAttributes?.identity?.variant && (
                            <span className="bg-[var(--theme-bg-panel)] px-2 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                                {customAttributes.identity.variant}
                            </span>
                        )}
                        <span>{category || 'Category'}</span>
                        {customAttributes?.identity?.subcategory && (
                            <span>• {customAttributes.identity.subcategory}</span>
                        )}
                    </p>
                </div>

                {/* Normalized Pricing / Margin Block */}
                {(effectiveCost > 0 || effectiveRetail > 0) && (
                    <div className="text-left sm:text-right whitespace-nowrap flex flex-col items-start sm:items-end gap-1 font-mono">
                        {effectiveRetail > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Retail:</span>
                                <span className="text-sm font-black text-[var(--theme-text-primary)] tabular-nums">
                                    {currencySymbol} {formatPriceValue(effectiveRetail)}{' '}
                                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] font-sans">
                                        /{sellUnitLabel}
                                    </span>
                                </span>
                            </div>
                        )}
                        {effectiveCost > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">Unit Cost:</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)] tabular-nums">
                                    {currencySymbol} {formatPriceValue(costPerSellUnit)}{' '}
                                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] font-sans">
                                        /{sellUnitLabel}
                                    </span>
                                </span>
                            </div>
                        )}
                        {isBulkOrder && effectiveCost > 0 && (
                            <div className="text-[10px] text-[var(--theme-text-secondary)] font-mono">
                                Order: {currencySymbol} {formatPriceValue(effectiveCost)}/{orderUnitName.toLowerCase()} ({unitsPerOrder} {sellUnitLabel})
                            </div>
                        )}
                        {marginPct !== null && grossProfit !== null && (
                            <div
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono mt-0.5 border ${
                                    marginPct >= 30
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : marginPct >= 15
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                }`}
                            >
                                <span>+{marginPct.toFixed(1)}% margin</span>
                                <span className="text-[9px] opacity-80">
                                    (+{currencySymbol} {formatPriceValue(grossProfit)}/{sellUnitLabel})
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Structured Attributes Grouped by Domain ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* 1. Category Specs */}
                {categoryAttrs.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <SlidersHorizontal size={12} className="text-[var(--theme-accent)] shrink-0" />
                            <span>{specGroup.badgeLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {categoryAttrs.map((attr, idx) => (
                                <AttrBadge key={idx} label={attr.label} value={attr.value} />
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Packaging & Case */}
                {packagingAttrs.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Package size={12} className="text-amber-500 shrink-0" />
                            <span>Packaging</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {packagingAttrs.map((attr, idx) => (
                                <AttrBadge key={idx} label={attr.label} value={attr.value} isAlert={attr.isAlert} icon={attr.icon} />
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Physical & Specs */}
                {physicalAttrs.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Scale size={12} className="text-blue-500 shrink-0" />
                            <span>Physical Specs</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {physicalAttrs.map((attr, idx) => (
                                <AttrBadge key={idx} label={attr.label} value={attr.value} />
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Storage & Care */}
                {storageAttrs.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Thermometer size={12} className="text-emerald-500 shrink-0" />
                            <span>Storage & Care</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {storageAttrs.map((attr, idx) => (
                                <AttrBadge key={idx} label={attr.label} value={attr.value} isAlert={attr.isAlert} icon={attr.icon} />
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Commercial & POS */}
                {commercialAttrs.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Tag size={12} className="text-purple-500 shrink-0" />
                            <span>Commercial & POS</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {commercialAttrs.map((attr, idx) => (
                                <AttrBadge key={idx} label={attr.label} value={attr.value} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Generated System Description ─── */}
            <div className="p-3 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)]">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Info size={12} className="text-[var(--theme-accent)]" />
                    <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none">
                        System Description
                    </span>
                </div>
                <p className="text-xs text-[var(--theme-text-primary)] font-mono leading-relaxed font-semibold">
                    {formatPOItemDescription({
                        brand,
                        productName: name,
                        category,
                        size,
                        unit,
                        customAttributes
                    }) || 'Item Name'}
                </p>
                {(() => {
                    const badge = formatPackBadge({ customAttributes });
                    return badge ? (
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[10px] font-mono font-semibold uppercase tracking-wider">
                            {badge}
                        </span>
                    ) : null;
                })()}
                {customAttributes?.descriptive?.keyFeatures && (
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium mt-1.5 italic border-t border-[var(--theme-border-subtle)] pt-1.5">
                        Features: {customAttributes.descriptive.keyFeatures}
                    </p>
                )}
            </div>
        </div>
    );
};
