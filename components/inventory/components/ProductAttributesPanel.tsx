import React from 'react';
import { Box } from 'lucide-react';
import { Product } from '../../../types';

// ── Compact Attribute Badge ──
const AttrBadge = ({ label, value, color }: { label: string; value?: string | number | boolean | null; color?: string }) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean' && !value) return null;

    const displayValue = typeof value === 'boolean' ? label : value;
    const displayLabel = typeof value === 'boolean' ? '' : label;

    const colorMap: Record<string, string> = {
        red: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
        cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
        green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
        yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
        pink: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400',
    };
    const colorClasses = color && colorMap[color] ? colorMap[color] : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300';

    return (
        <div className={`flex items-center gap-1.5 ${colorClasses} border rounded px-2 py-1 min-w-0`}>
            {displayLabel && <span className="text-[9px] opacity-70 uppercase tracking-tighter font-bold">{displayLabel}</span>}
            <span className="text-[10px] font-black leading-none truncate">{displayValue}</span>
        </div>
    );
};

interface ProductAttributesPanelProps {
    product: Product;
}

export const ProductAttributesPanel: React.FC<ProductAttributesPanelProps> = ({ product }) => {
    const customAttrs = product.customAttributes || (product as any).custom_attributes;

    const hasPhysical = !!(customAttrs?.physical?.netWeight || customAttrs?.physical?.grossWeight || customAttrs?.physical?.form || customAttrs?.physical?.color || customAttrs?.physical?.texture || customAttrs?.physical?.dims);
    const hasPackaging = !!(customAttrs?.packaging?.packQty || customAttrs?.packaging?.caseSize || customAttrs?.packaging?.packagingLevel || customAttrs?.packaging?.packageType || customAttrs?.packaging?.material || customAttrs?.packaging?.isBreakable);
    const hasStorage = !!(customAttrs?.storage?.type || customAttrs?.storage?.isPerishable || customAttrs?.storage?.isHazardous || customAttrs?.storage?.isFragile || customAttrs?.storage?.isLightSensitive || customAttrs?.storage?.stackLimit);
    const hasCommercial = !!(customAttrs?.commercial?.sellBy || customAttrs?.commercial?.priceType || customAttrs?.commercial?.isWeighted || customAttrs?.commercial?.isReturnable || customAttrs?.commercial?.isBundleEligible);
    const hasDescriptive = !!(customAttrs?.descriptive?.usage || customAttrs?.descriptive?.audience || customAttrs?.descriptive?.scent || customAttrs?.descriptive?.flavor || customAttrs?.descriptive?.strength);

    const hasAnyAttributes = hasPhysical || hasPackaging || hasStorage || hasCommercial || hasDescriptive;

    if (!hasAnyAttributes) return null;

    return (
        <div className="p-5 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Product Attributes</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {/* Physical */}
                <AttrBadge label="Net" value={customAttrs?.physical?.netWeight ? `${customAttrs.physical.netWeight}${customAttrs?.physical?.sizeType || product.unit || ''}` : null} />
                <AttrBadge label="Gross" value={customAttrs?.physical?.grossWeight ? `${customAttrs.physical.grossWeight}kg` : null} />
                <AttrBadge label="Form" value={customAttrs?.physical?.form} />
                <AttrBadge label="Color" value={customAttrs?.physical?.color} />
                <AttrBadge label="Texture" value={customAttrs?.physical?.texture} />
                <AttrBadge label="Dims" value={customAttrs?.physical?.dims} />

                {/* Packaging */}
                <AttrBadge label="Pack" value={customAttrs?.packaging?.packQty ? `×${customAttrs.packaging.packQty}` : null} />
                <AttrBadge label="Case" value={customAttrs?.packaging?.caseSize ? `×${customAttrs.packaging.caseSize}` : null} />
                <AttrBadge label="Level" value={customAttrs?.packaging?.packagingLevel} />
                <AttrBadge label="Type" value={customAttrs?.packaging?.packageType} />
                <AttrBadge label="Mat" value={customAttrs?.packaging?.material} />
                <AttrBadge label="Breakable" value={customAttrs?.packaging?.isBreakable} color="red" />

                {/* Storage */}
                <AttrBadge label="Storage" value={customAttrs?.storage?.type} color={customAttrs?.storage?.type === 'Frozen' ? 'blue' : customAttrs?.storage?.type === 'Chilled' ? 'cyan' : undefined} />
                <AttrBadge label="Perishable" value={customAttrs?.storage?.isPerishable} color="orange" />
                <AttrBadge label="Hazardous" value={customAttrs?.storage?.isHazardous} color="red" />
                <AttrBadge label="Fragile" value={customAttrs?.storage?.isFragile} color="orange" />
                <AttrBadge label="Light Sensitive" value={customAttrs?.storage?.isLightSensitive} color="yellow" />
                <AttrBadge label="Stack" value={customAttrs?.storage?.stackLimit ? `Max ${customAttrs.storage.stackLimit}` : null} />

                {/* Commercial */}
                <AttrBadge label="Sell By" value={customAttrs?.commercial?.sellBy} />
                <AttrBadge label="Price" value={customAttrs?.commercial?.priceType} />
                <AttrBadge label="Weighted" value={customAttrs?.commercial?.isWeighted} color="purple" />
                <AttrBadge label="Returnable" value={customAttrs?.commercial?.isReturnable} color="green" />
                <AttrBadge label="Bundle" value={customAttrs?.commercial?.isBundleEligible} color="blue" />

                {/* Descriptive */}
                <AttrBadge label="Use" value={customAttrs?.descriptive?.usage} />
                <AttrBadge label="Target" value={customAttrs?.descriptive?.audience} />
                <AttrBadge label="Scent" value={customAttrs?.descriptive?.scent} color="pink" />
                <AttrBadge label="Flavor" value={customAttrs?.descriptive?.flavor} color="orange" />
                <AttrBadge label="Strength" value={customAttrs?.descriptive?.strength} />
            </div>
        </div>
    );
};
