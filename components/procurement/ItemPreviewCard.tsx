import React from 'react';
import { formatPriceValue } from '../../utils/formatting';
import { Info } from 'lucide-react';
import { formatPackBadge } from './utils';

interface ItemPreviewCardProps {
    name: string;
    brand: string;
    size: string;
    unit: string;
    category: string;
    description: string;
    price?: number;
    cost?: number;
    retailPrice?: number;
    image: string;
    currencySymbol?: string;
    customAttributes?: any;
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
    customAttributes
}) => {
    const effectiveCost = cost !== undefined ? cost : price;
    const effectiveRetail = retailPrice !== undefined ? retailPrice : 0;

    const AttrBadge = ({ label, value, color, icon: Icon }: { label: string, value?: string | number | boolean | null, color?: string, icon?: any }) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'boolean' && !value) return null;

        const displayValue = typeof value === 'boolean' ? label : value;
        const displayLabel = typeof value === 'boolean' ? '' : label;

        return (
            <div className="flex items-center gap-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-lg px-2 py-1 min-w-0">
                {Icon && <Icon size={10} className="text-[var(--theme-text-muted)]" />}
                {displayLabel && <span className="text-[9px] text-[var(--theme-text-muted)] uppercase tracking-wider font-semibold">{displayLabel}</span>}
                <span className="text-[10px] text-[var(--theme-text-primary)] font-bold font-mono leading-none truncate">{displayValue}</span>
            </div>
        );
    };

    return (
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col gap-3 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start gap-2 border-b border-[var(--theme-border-subtle)] pb-2.5">
                <div>
                    <h3 className="text-sm font-bold text-[var(--theme-text-primary)] leading-tight">
                        {brand && <span className="text-[var(--theme-accent)] font-semibold">{brand} </span>}
                        {name || "Item Name"}
                    </h3>
                    <p className="text-[10px] text-[var(--theme-text-muted)] mt-0.5 font-mono uppercase font-medium">
                        {customAttributes?.identity?.variant ? `${customAttributes.identity.variant} • ` : ''}
                        {(() => {
                            const physicalWeight = customAttributes?.physical?.netWeight || size;
                            const physicalType = customAttributes?.physical?.sizeType || customAttributes?.physical?.unit || 
                                                 (unit && !['UNIT', 'PACK', 'DOZEN'].includes(unit.toUpperCase().trim()) ? unit : '');
                            return physicalWeight ? `${physicalWeight}${physicalType}` : "Size";
                        })()} • {category || "Category"}
                        {customAttributes?.identity?.subcategory ? ` • ${customAttributes.identity.subcategory}` : ''}
                    </p>
                </div>
                {(effectiveCost > 0 || effectiveRetail > 0) && (
                    <div className="text-right whitespace-nowrap flex flex-col items-end gap-0.5 font-mono">
                        {effectiveRetail > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] uppercase font-semibold text-[var(--theme-text-muted)]">Retail:</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)] tabular-nums">{currencySymbol} {formatPriceValue(effectiveRetail)}</span>
                            </div>
                        )}
                        {effectiveCost > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] uppercase font-semibold text-[var(--theme-text-muted)]">Cost:</span>
                                <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] tabular-nums">{currencySymbol} {formatPriceValue(effectiveCost)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dense Attribute Grid */}
            <div className="flex flex-wrap gap-1.5">
                {/* Physical */}
                <AttrBadge label="Net" value={customAttributes?.physical?.netWeight ? `${customAttributes.physical.netWeight}${customAttributes?.physical?.sizeType || unit || 'kg'}` : null} />
                <AttrBadge label="Gross" value={customAttributes?.physical?.grossWeight ? `${customAttributes.physical.grossWeight}kg` : null} />
                <AttrBadge label="Form" value={customAttributes?.physical?.form} />
                <AttrBadge label="Color" value={customAttributes?.physical?.color} />
                <AttrBadge label="Dims" value={customAttributes?.physical?.dims} />

                {/* Packaging */}
                <AttrBadge label="Pack" value={customAttributes?.packaging?.packQty ? `x${customAttributes.packaging.packQty}` : null} />
                <AttrBadge label="Level" value={customAttributes?.packaging?.packagingLevel} />
                <AttrBadge label="Type" value={customAttributes?.packaging?.packageType} />
                <AttrBadge label="Mat" value={customAttributes?.packaging?.material} />
                <AttrBadge label="Breakable" value={customAttributes?.packaging?.isBreakable} color="red" />

                {/* Storage */}
                <AttrBadge label="Storage" value={customAttributes?.storage?.type} />
                <AttrBadge label="Hazard" value={customAttributes?.storage?.isHazardous} color="red" />
                <AttrBadge label="Stack" value={customAttributes?.storage?.stackLimit ? `Max ${customAttributes.storage.stackLimit}` : null} />
                <AttrBadge label="Light Sensitive" value={customAttributes?.storage?.isLightSensitive} />
                <AttrBadge label="Fragile" value={customAttributes?.storage?.isFragile} />

                {/* Commercial */}
                <AttrBadge label="Sell By" value={customAttributes?.commercial?.sellBy} />
                <AttrBadge label="Price" value={customAttributes?.commercial?.priceType} />
                <AttrBadge label="Weighted" value={customAttributes?.commercial?.isWeighted} />
                <AttrBadge label="Returnable" value={customAttributes?.commercial?.isReturnable} />
                <AttrBadge label="Bundle" value={customAttributes?.commercial?.isBundleEligible} />

                {/* Descriptive */}
                <AttrBadge label="Use" value={customAttributes?.descriptive?.usage} />
                <AttrBadge label="Target" value={customAttributes?.descriptive?.audience} />
                <AttrBadge label="Scent" value={customAttributes?.descriptive?.scent} />
                <AttrBadge label="Flavor" value={customAttributes?.descriptive?.flavor} />
                <AttrBadge label="Strength" value={customAttributes?.descriptive?.strength} />
            </div>

            {/* Generated Description Preview */}
            <div className="p-3 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)]">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Info size={12} className="text-[var(--theme-accent)]" />
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider leading-none">System Description</span>
                </div>
                <p className="text-xs text-[var(--theme-text-primary)] font-mono leading-relaxed font-semibold">
                    {[
                        brand,
                        name,
                        customAttributes?.identity?.variant,
                        (() => {
                            const physicalWeight = customAttributes?.physical?.netWeight || size;
                            const physicalType = customAttributes?.physical?.sizeType || customAttributes?.physical?.unit ||
                                                 (unit && !['UNIT', 'PACK', 'DOZEN'].includes(unit.toUpperCase().trim()) ? unit : '');
                            return physicalWeight ? `${physicalWeight}${physicalType}` : '';
                        })(),
                    ].filter(Boolean).join(' ')}
                </p>
                {(() => {
                    const badge = formatPackBadge({ customAttributes });
                    return badge ? (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[10px] font-mono font-semibold uppercase tracking-wider">
                            {badge}
                        </span>
                    ) : null;
                })()}
                {customAttributes?.descriptive?.keyFeatures && (
                    <p className="text-[10px] text-[var(--theme-text-muted)] mt-1.5 italic border-t border-[var(--theme-border-subtle)] pt-1.5">
                        Features: {customAttributes.descriptive.keyFeatures}
                    </p>
                )}
            </div>
        </div>
    );
};
