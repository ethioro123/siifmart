import React from 'react';
import { Package, Layers, ShieldCheck, Tag, Info, Sparkles } from 'lucide-react';
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
        green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        yellow: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
        pink: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400',
    };
    const colorClasses = color && colorMap[color] ? colorMap[color] : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]';

    return (
        <div className={`flex items-center gap-1.5 ${colorClasses} border rounded-lg px-2 py-1 min-w-0 font-medium`}>
            {displayLabel && <span className="text-[9px] opacity-70 uppercase tracking-tighter font-semibold">{displayLabel}</span>}
            <span className="text-[10px] font-bold leading-none truncate font-mono">{displayValue}</span>
        </div>
    );
};

interface ProductAttributesPanelProps {
    product: Product;
}

export const ProductAttributesPanel: React.FC<ProductAttributesPanelProps> = ({ product }) => {
    const customAttrs = product.customAttributes || (product as any).custom_attributes;

    const hasIdentity = !!(customAttrs?.identity?.variant || customAttrs?.identity?.modelNumber || customAttrs?.identity?.subcategory);
    const hasPhysical = !!(customAttrs?.physical?.netWeight || customAttrs?.physical?.grossWeight || customAttrs?.physical?.form || customAttrs?.physical?.color || customAttrs?.physical?.texture || customAttrs?.physical?.dims);
    const hasPackaging = !!(customAttrs?.packaging?.packQty || customAttrs?.packaging?.caseSize || customAttrs?.packaging?.packagingLevel || customAttrs?.packaging?.packageType || customAttrs?.packaging?.material || customAttrs?.packaging?.isBreakable);
    const hasStorage = !!(customAttrs?.storage?.type || customAttrs?.storage?.isPerishable || customAttrs?.storage?.isHazardous || customAttrs?.storage?.isFragile || customAttrs?.storage?.isLightSensitive || customAttrs?.storage?.stackLimit);
    const hasCommercial = !!(customAttrs?.commercial?.sellBy || customAttrs?.commercial?.priceType || customAttrs?.commercial?.isWeighted || customAttrs?.commercial?.isReturnable || customAttrs?.commercial?.isBundleEligible);
    const hasDescriptive = !!(customAttrs?.descriptive?.usage || customAttrs?.descriptive?.audience || customAttrs?.descriptive?.scent || customAttrs?.descriptive?.flavor || customAttrs?.descriptive?.strength);

    const categorySpecific = customAttrs?.categorySpecific || {};
    const categorySpecificKeys = Object.keys(categorySpecific).filter(k => categorySpecific[k] !== undefined && categorySpecific[k] !== null && categorySpecific[k] !== '');
    const hasCategorySpecific = categorySpecificKeys.length > 0;

    const hasAnyAttributes = hasIdentity || hasPhysical || hasPackaging || hasStorage || hasCommercial || hasDescriptive || hasCategorySpecific;

    if (!hasAnyAttributes) return null;

    return (
        <div className="space-y-3">
            {/* 1. Identity & Variant Domain */}
            {hasIdentity && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Tag size={12} className="text-indigo-500 shrink-0" />
                        <span>Identity & Variant Specs</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Variant" value={customAttrs?.identity?.variant} color="blue" />
                        <AttrBadge label="Model" value={customAttrs?.identity?.modelNumber} />
                        <AttrBadge label="Subcategory" value={customAttrs?.identity?.subcategory} />
                    </div>
                </div>
            )}

            {/* 2. Packaging Domain */}
            {hasPackaging && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Package size={12} className="text-blue-500 shrink-0" />
                        <span>Packaging & Outer Casing</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Pack Qty" value={customAttrs?.packaging?.packQty ? `×${customAttrs.packaging.packQty}` : null} />
                        <AttrBadge label="Case Size" value={customAttrs?.packaging?.caseSize ? `×${customAttrs.packaging.caseSize}` : null} />
                        <AttrBadge label="Type" value={customAttrs?.packaging?.packageType} />
                        <AttrBadge label="Level" value={customAttrs?.packaging?.packagingLevel} />
                        <AttrBadge label="Material" value={customAttrs?.packaging?.material} />
                        <AttrBadge label="Breakable" value={customAttrs?.packaging?.isBreakable} color="red" />
                    </div>
                </div>
            )}

            {/* 3. Physical Specs Domain */}
            {hasPhysical && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Layers size={12} className="text-amber-500 shrink-0" />
                        <span>Physical Specifications</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Net Weight" value={customAttrs?.physical?.netWeight ? `${customAttrs.physical.netWeight}${customAttrs?.physical?.sizeType || product.unit || ''}` : null} />
                        <AttrBadge label="Gross" value={customAttrs?.physical?.grossWeight ? `${customAttrs.physical.grossWeight}kg` : null} />
                        <AttrBadge label="Form" value={customAttrs?.physical?.form} />
                        <AttrBadge label="Color" value={customAttrs?.physical?.color} />
                        <AttrBadge label="Texture" value={customAttrs?.physical?.texture} />
                        <AttrBadge label="Dims" value={customAttrs?.physical?.dims} />
                    </div>
                </div>
            )}

            {/* 4. Storage & Care Domain */}
            {hasStorage && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                        <span>Storage & Care Conditions</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Storage" value={customAttrs?.storage?.type} color={customAttrs?.storage?.type === 'Frozen' ? 'blue' : customAttrs?.storage?.type === 'Chilled' ? 'cyan' : undefined} />
                        <AttrBadge label="Perishable" value={customAttrs?.storage?.isPerishable} color="orange" />
                        <AttrBadge label="Hazardous" value={customAttrs?.storage?.isHazardous} color="red" />
                        <AttrBadge label="Fragile" value={customAttrs?.storage?.isFragile} color="orange" />
                        <AttrBadge label="Light Sensitive" value={customAttrs?.storage?.isLightSensitive} color="yellow" />
                        <AttrBadge label="Stack Limit" value={customAttrs?.storage?.stackLimit ? `Max ${customAttrs.storage.stackLimit}` : null} />
                    </div>
                </div>
            )}

            {/* 5. Commercial & POS Domain */}
            {hasCommercial && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Tag size={12} className="text-purple-500 shrink-0" />
                        <span>Commercial & POS Policies</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Sell By" value={customAttrs?.commercial?.sellBy} />
                        <AttrBadge label="Price Type" value={customAttrs?.commercial?.priceType} />
                        <AttrBadge label="Weighted" value={customAttrs?.commercial?.isWeighted} color="purple" />
                        <AttrBadge label="Returnable" value={customAttrs?.commercial?.isReturnable} color="green" />
                        <AttrBadge label="Bundle Eligible" value={customAttrs?.commercial?.isBundleEligible} color="blue" />
                    </div>
                </div>
            )}

            {/* 6. Sensory & Usage Domain */}
            {hasDescriptive && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Info size={12} className="text-slate-500 shrink-0" />
                        <span>Usage & Sensory Attributes</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Use" value={customAttrs?.descriptive?.usage} />
                        <AttrBadge label="Audience" value={customAttrs?.descriptive?.audience} />
                        <AttrBadge label="Scent" value={customAttrs?.descriptive?.scent} color="pink" />
                        <AttrBadge label="Flavor" value={customAttrs?.descriptive?.flavor} color="orange" />
                        <AttrBadge label="Strength" value={customAttrs?.descriptive?.strength} />
                    </div>
                </div>
            )}

            {/* 7. Category-Specific Specifications */}
            {hasCategorySpecific && (
                <div className="p-3.5 bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Sparkles size={12} className="text-amber-500 shrink-0" />
                        <span>Category Specifications</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {categorySpecificKeys.map(key => (
                            <AttrBadge
                                key={key}
                                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                value={String(categorySpecific[key])}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
