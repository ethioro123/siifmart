import React from 'react';
import { Package, Layers, ShieldCheck, Tag, Info, Sparkles } from 'lucide-react';
import { Product } from '../../../types';
import { getCategorySpecGroup } from '../../procurement/categoryAttributes';
import { getPOItemPhysicalSummary } from '../../procurement/physicalUtils';
import { getCategoryStorageDefaults } from '../../procurement/categoryLogistics';
import { getCategoryPackagingDefaults } from '../../procurement/categoryPackaging';

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
        <div className={`flex items-center gap-1.5 ${colorClasses} border rounded-lg px-2.5 py-1 min-w-0 font-medium`}>
            {displayLabel && <span className="text-[11px] opacity-75 uppercase tracking-tight font-semibold">{displayLabel}</span>}
            <span className="text-[11px] font-bold leading-none truncate font-mono">{displayValue}</span>
        </div>
    );
};

interface ProductAttributesPanelProps {
    product: Product;
}

export const ProductAttributesPanel: React.FC<ProductAttributesPanelProps> = ({ product }) => {
    const customAttrs = product.customAttributes || (product as any).custom_attributes;
    const category = product.category || '';
    const storageDefaults = category ? getCategoryStorageDefaults(category) : null;
    const pkgDefaults = category ? getCategoryPackagingDefaults(category) : null;
    const physSummary = getPOItemPhysicalSummary(product);

    const hasIdentity = !!(customAttrs?.identity?.variant || customAttrs?.identity?.modelNumber || customAttrs?.identity?.subcategory);
    const hasPhysical = !!(physSummary.specBadge || customAttrs?.physical?.netWeight || customAttrs?.physical?.grossWeight || customAttrs?.physical?.form || customAttrs?.physical?.color || customAttrs?.physical?.texture || customAttrs?.physical?.dims);

    // Inbound QC & Storage resolution
    const inboundQc = customAttrs?.storage?.inboundQcDirective || storageDefaults?.inboundDirectives?.[0] || null;
    const storageType = customAttrs?.storage?.type || storageDefaults?.defaultStorage || null;
    const isPerishable = customAttrs?.storage?.isPerishable ?? storageDefaults?.defaultPerishable ?? false;
    const shelfLife = customAttrs?.storage?.shelfLifeDays || storageDefaults?.defaultShelfLife || null;
    const isColdChain = customAttrs?.storage?.coldChain || (storageType && /chilled|cold/i.test(storageType));
    const isDeepFreeze = customAttrs?.storage?.deepFreeze || (storageType && /freeze|frozen/i.test(storageType));
    const isHighValue = customAttrs?.storage?.highTheft || customAttrs?.storage?.highValueCage;
    const isFragile = customAttrs?.storage?.isFragile || customAttrs?.packaging?.isBreakable;
    const isAntiStatic = customAttrs?.storage?.antiStatic;
    const isHalal = customAttrs?.storage?.halalVerified || customAttrs?.categorySpecific?.halalCertified === 'Yes';
    const isSerialTracked = customAttrs?.storage?.serialTracked || customAttrs?.categorySpecific?.serialNumberTracking;

    const hasStorage = !!(inboundQc || storageType || isPerishable || customAttrs?.storage?.isHazardous || isFragile || isHighValue || isAntiStatic || isHalal || isSerialTracked);

    // Packaging resolution
    const packageType = customAttrs?.packaging?.packageType || pkgDefaults?.containers?.[0] || null;
    const packagingLevel = customAttrs?.packaging?.packagingLevel || pkgDefaults?.defaultLevel || null;
    const packQty = customAttrs?.packaging?.packQty || pkgDefaults?.defaultPackQty || null;
    const packagingMaterial = customAttrs?.packaging?.material || pkgDefaults?.defaultMaterial || null;

    const hasPackaging = !!(packageType || packagingLevel || packQty || customAttrs?.packaging?.caseSize || packagingMaterial || customAttrs?.packaging?.isBreakable);
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
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
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
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Package size={12} className="text-blue-500 shrink-0" />
                        <span>Packaging & Outer Casing (GS1 Logistics)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Container" value={packageType} color="blue" />
                        <AttrBadge label="Level" value={packagingLevel} />
                        <AttrBadge label="Pack Qty" value={packQty ? `×${packQty}` : null} />
                        <AttrBadge label="Case Size" value={customAttrs?.packaging?.caseSize ? `×${customAttrs.packaging.caseSize}` : null} />
                        <AttrBadge label="Material" value={packagingMaterial} />
                        <AttrBadge label="Breakable" value={customAttrs?.packaging?.isBreakable} color="red" />
                    </div>
                </div>
            )}

            {/* 3. Physical Specs Domain */}
            {hasPhysical && (
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            <Layers size={12} className="text-amber-500 shrink-0" />
                            <span>Physical Specifications</span>
                        </div>
                        {physSummary.specBadge && (
                            <span className="text-[10px] font-mono font-semibold text-[var(--theme-accent)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full truncate max-w-[220px]">
                                {physSummary.specBadge}
                            </span>
                        )}
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
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                        <span>Storage & Inbound QC Directives</span>
                    </div>
                    {inboundQc && (
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                            <ShieldCheck size={13} className="shrink-0" />
                            <span>Inbound QC: {inboundQc}</span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                        <AttrBadge label="Storage" value={storageType} color={isDeepFreeze ? 'blue' : isColdChain ? 'cyan' : undefined} />
                        <AttrBadge label="Perishable" value={isPerishable ? (shelfLife ? `Yes (${shelfLife}d)` : 'Yes') : null} color="orange" />
                        <AttrBadge label="Cold Chain" value={isColdChain ? 'Strict Cold Chain' : null} color="cyan" />
                        <AttrBadge label="High Value" value={isHighValue ? 'Secure Cage' : null} color="red" />
                        <AttrBadge label="Anti-Static" value={isAntiStatic ? 'ESD Sensitive' : null} color="purple" />
                        <AttrBadge label="Serial Tracked" value={isSerialTracked ? 'Serial Scan Required' : null} color="blue" />
                        <AttrBadge label="Halal" value={isHalal ? 'Halal Certified' : null} color="green" />
                        <AttrBadge label="Hazardous" value={customAttrs?.storage?.isHazardous} color="red" />
                        <AttrBadge label="Fragile" value={isFragile} color="orange" />
                        <AttrBadge label="Stack Limit" value={customAttrs?.storage?.stackLimit ? `Max ${customAttrs.storage.stackLimit}` : null} />
                    </div>
                </div>
            )}

            {/* 5. Commercial & POS Domain */}
            {hasCommercial && (
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
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
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
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
            {hasCategorySpecific && (() => {
                const specGroup = getCategorySpecGroup(product.category, customAttrs?.identity?.subcategory);
                const renderedKeys = new Set<string>();
                const specsList: { key: string; label: string; value: string }[] = [];

                for (const field of specGroup.fields) {
                    const val = categorySpecific[field.key];
                    if (val !== undefined && val !== null && val !== '') {
                        renderedKeys.add(field.key);
                        specsList.push({
                            key: field.key,
                            label: field.label.replace(/\s*\(.*\)/, '').replace(/\s*\/.*$/, '').trim(),
                            value: String(val)
                        });
                    }
                }

                for (const key of categorySpecificKeys) {
                    if (!renderedKeys.has(key)) {
                        specsList.push({
                            key,
                            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                            value: String(categorySpecific[key])
                        });
                    }
                }

                return (
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                <Sparkles size={12} className="text-[var(--theme-accent)] shrink-0" />
                                <span>{specGroup.domainTitle}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full">
                                {specGroup.badgeLabel}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {specsList.map(spec => (
                                <AttrBadge
                                    key={spec.key}
                                    label={spec.label}
                                    value={spec.value}
                                />
                            ))}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
