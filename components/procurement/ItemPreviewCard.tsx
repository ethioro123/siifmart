import React from 'react';
import { CURRENCY_SYMBOL } from '../../constants';
import { Info } from 'lucide-react';

interface ItemPreviewCardProps {
    name: string;
    brand: string;
    size: string;
    unit: string;
    category: string;
    description: string;
    price: number;
    image: string;
    customAttributes?: any;
}

export const ItemPreviewCard: React.FC<ItemPreviewCardProps> = ({
    name,
    brand,
    size,
    unit,
    category,
    description,
    price,
    image,
    customAttributes
}) => {
    // Helper to render attribute badge (Ultra Compact)
    const AttrBadge = ({ label, value, color, icon: Icon }: { label: string, value?: string | number | boolean | null, color?: string, icon?: any }) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'boolean' && !value) return null;

        const displayValue = typeof value === 'boolean' ? label : value;
        const displayLabel = typeof value === 'boolean' ? '' : label;

        return (
            <div className={`flex items-center gap-1.5 ${color ? `bg-${color}-500/10 border-${color}-500/30` : 'bg-white/5 border-white/5'} border rounded px-1.5 py-1 min-w-0`}>
                {Icon && <Icon size={10} className={color ? `text-${color}-400` : 'text-gray-400'} />}
                {displayLabel && <span className={`text-[9px] ${color ? `text-${color}-400` : 'text-gray-500'} uppercase tracking-tighter`}>{displayLabel}</span>}
                <span className={`text-[10px] ${color ? `text-${color}-200` : 'text-gray-200'} font-medium leading-none truncate`}>{displayValue}</span>
            </div>
        );
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 h-auto flex flex-col gap-3">
            {/* Header */}
            <div className="flex justify-between items-start gap-2 border-b border-white/5 pb-2">
                <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                        {brand && <span className="text-cyber-primary">{brand} </span>}
                        {name || "Item Name"}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                        {customAttributes?.identity?.variant ? `${customAttributes.identity.variant} • ` : ''}
                        {size ? `${size}${unit}` : "Size"} • {category || "Category"}
                        {customAttributes?.identity?.subcategory ? ` • ${customAttributes.identity.subcategory}` : ''}
                    </p>
                </div>
                {(price > 0) && (
                    <div className="text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-emerald-400">{CURRENCY_SYMBOL}{price.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Dense Attribute Grid - Auto-fits available space */}
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
                <AttrBadge label="Storage" value={customAttributes?.storage?.type} color={customAttributes?.storage?.type === 'Frozen' ? 'blue' : customAttributes?.storage?.type === 'Chilled' ? 'cyan' : undefined} />
                <AttrBadge label="Hazard" value={customAttributes?.storage?.isHazardous} color="red" />
                <AttrBadge label="Stack" value={customAttributes?.storage?.stackLimit ? `Max ${customAttributes.storage.stackLimit}` : null} />
                <AttrBadge label="Light Sensitive" value={customAttributes?.storage?.isLightSensitive} color="yellow" />
                <AttrBadge label="Fragile" value={customAttributes?.storage?.isFragile} color="orange" />

                {/* Commercial */}
                <AttrBadge label="Sell By" value={customAttributes?.commercial?.sellBy} />
                <AttrBadge label="Price" value={customAttributes?.commercial?.priceType} />
                <AttrBadge label="Weighted" value={customAttributes?.commercial?.isWeighted} color="purple" />
                <AttrBadge label="Returnable" value={customAttributes?.commercial?.isReturnable} color="green" />
                <AttrBadge label="Bundle" value={customAttributes?.commercial?.isBundleEligible} color="blue" />

                {/* Descriptive */}
                <AttrBadge label="Use" value={customAttributes?.descriptive?.usage} />
                <AttrBadge label="Target" value={customAttributes?.descriptive?.audience} />
                <AttrBadge label="Scent" value={customAttributes?.descriptive?.scent} color="pink" />
                <AttrBadge label="Flavor" value={customAttributes?.descriptive?.flavor} color="orange" />
                <AttrBadge label="Strength" value={customAttributes?.descriptive?.strength} />
            </div>

            {/* Generated Description Preview */}
            <div className="bg-white/5 rounded px-2 py-2 mt-1 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Info size={12} className="text-cyber-primary" />
                    <span className="text-[10px] text-cyber-primary uppercase font-bold tracking-wider">System Description</span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono leading-relaxed">
                    {[
                        brand,
                        name,
                        customAttributes?.identity?.variant,
                        // Weight/Size Logic
                        (customAttributes?.physical?.netWeight)
                            ? `${customAttributes.physical.netWeight}${customAttributes?.physical?.sizeType || unit || ''}`
                            : (size && unit ? `${size}${unit}` : ''),
                    ].filter(Boolean).join(' ') + (
                            // Packaging Logic - Explicit "Pack of X" format
                            (customAttributes?.packaging?.packQty && parseInt(customAttributes.packaging.packQty) > 1)
                                ? ` – Pack of ${customAttributes.packaging.packQty}`
                                : ''
                        ) + (
                            // Additional Packaging Details (Type/Level) - Optional, kept subtle if needed
                            (customAttributes?.packaging?.packageType)
                                ? ` (${customAttributes.packaging.packageType})`
                                : ''
                        )}
                </p>
                {customAttributes?.descriptive?.keyFeatures && (
                    <p className="text-[10px] text-gray-500 mt-1 italic border-t border-white/5 pt-1">
                        Features: {customAttributes.descriptive.keyFeatures}
                    </p>
                )}
            </div>

            {/* Fallback description if provided manually */}
            {description && !customAttributes?.physical?.netWeight && (
                <div className="bg-white/5 rounded px-2 py-1 mt-1">
                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed line-clamp-2">
                        {description}
                    </p>
                </div>
            )}
        </div>
    );
};
