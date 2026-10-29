import React from 'react';
import { Package, Layers, ShieldCheck, Tag, Info, Sparkles } from 'lucide-react';
import { Product } from '../../../types';
import { getPOItemPhysicalSummary } from '../../procurement/physicalUtils';
import { resolveSmartProductAttributes } from '../../../utils/groceryAttributes';

const AttrBadge = ({ label, value, color }: { label: string; value?: string | number | boolean | null; color?: string }) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean' && !value) return null;

    const displayValue = typeof value === 'boolean' ? label : value;
    const displayLabel = typeof value === 'boolean' ? '' : label;

    const colorMap: Record<string, string> = {
        red: 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]',
        blue: 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]',
        cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
        green: 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]',
        yellow: 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
        pink: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400',
    };
    const colorClasses = color && colorMap[color] ? colorMap[color] : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]';

    return (
        <div className={`flex items-center gap-1.5 ${colorClasses} border rounded-lg px-2.5 py-1 min-w-0 font-medium`}>
            {displayLabel && <span className="text-[11px] opacity-75 uppercase tracking-tight font-semibold">{displayLabel}</span>}
            <span className="text-[11px] font-bold leading-none truncate font-mono text-[var(--theme-text-primary)]">{displayValue}</span>
        </div>
    );
};

interface ProductAttributesPanelProps {
    product: Product;
    currencySymbol?: string;
}

export const ProductAttributesPanel: React.FC<ProductAttributesPanelProps> = ({ product, currencySymbol = '' }) => {
    const customAttrs = product.customAttributes || (product as any).custom_attributes || {};
    const physSummary = getPOItemPhysicalSummary(product);
    const smart = resolveSmartProductAttributes(product, undefined, currencySymbol);

    const packagingMaterial = customAttrs?.packaging?.material || null;
    const hasDescriptive = !!(
        customAttrs?.descriptive?.usage ||
        customAttrs?.descriptive?.audience ||
        customAttrs?.descriptive?.scent ||
        customAttrs?.descriptive?.flavor ||
        customAttrs?.descriptive?.strength
    );

    return (
        <div className="space-y-3">
            {/* 1. Identity, Brand & Grocery Department Domain */}
            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Tag size={12} className="text-[var(--theme-accent)] shrink-0" />
                        <span>Brand, Department & Identity</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--theme-accent)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full">
                        {smart.archetypeTitle}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <AttrBadge label="Brand" value={smart.brand || 'House / Standard'} color="blue" />
                    <AttrBadge label="Department" value={smart.category} />
                    <AttrBadge label="Subcategory" value={smart.subcategory} color="cyan" />
                    <AttrBadge label="Variant" value={smart.variant} color="purple" />
                    <AttrBadge label="Model / Origin" value={smart.modelOrOrigin} />
                    {smart.isHalal && <AttrBadge label="Halal Certified" value={true} color="green" />}
                </div>
            </div>

            {/* 2. Packaging & Wholesale Case Hierarchy (GS1 Logistics) */}
            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Package size={12} className="text-[var(--theme-status-info-text)] shrink-0" />
                        <span>Packaging & Case Hierarchy (GS1 Logistics)</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] px-2.5 py-0.5 rounded-full">
                        {smart.packBadge}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <AttrBadge label="Container" value={smart.packageType} color="blue" />
                    <AttrBadge label="Hierarchy" value={smart.packagingLevelLabel} />
                    <AttrBadge label="Units / Pack" value={smart.unitsPerPackage > 1 ? `×${smart.unitsPerPackage} ${smart.sellUnitShort}` : `1 ${smart.sellUnitShort} (Each)`} color="yellow" />
                    {smart.stockBreakdown && <AttrBadge label="On-Hand Breakdown" value={smart.stockBreakdown} color="green" />}
                    <AttrBadge label="Case Size" value={customAttrs?.packaging?.caseSize ? `×${customAttrs.packaging.caseSize}` : null} />
                    <AttrBadge label="Material" value={packagingMaterial} />
                    <AttrBadge label="Breakable" value={smart.isFragile} color="red" />
                </div>
            </div>

            {/* 3. Physical & Net Content Specifications */}
            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Layers size={12} className="text-[var(--theme-status-warning-text)] shrink-0" />
                        <span>Physical & Net Content Specifications</span>
                    </div>
                    {(physSummary.specBadge || smart.netContent) && (
                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-accent)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full truncate max-w-[240px]">
                            {physSummary.specBadge || smart.netContent}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <AttrBadge label="Net Content" value={smart.netContent} color="green" />
                    <AttrBadge label="Physical Form" value={smart.physicalForm} />
                    <AttrBadge label="Gross Weight" value={customAttrs?.physical?.grossWeight ? `${customAttrs.physical.grossWeight} kg` : null} />
                    <AttrBadge label="Color / Finish" value={smart.colorOrFinish} />
                    <AttrBadge label="Texture" value={customAttrs?.physical?.texture} />
                    <AttrBadge label="Dimensions" value={smart.dimensions} />
                </div>
            </div>

            {/* 4. Storage, Cold Chain & Inbound QC Directives */}
            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                    <ShieldCheck size={12} className="text-[var(--theme-status-success-text)] shrink-0" />
                    <span>Storage, Cold Chain & Inbound QC Directives</span>
                </div>
                {smart.inboundQcDirective && (
                    <div className="p-2 rounded-xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] text-xs font-semibold flex items-center gap-2">
                        <ShieldCheck size={13} className="shrink-0" />
                        <span>Inbound QC: {smart.inboundQcDirective}</span>
                    </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                    <AttrBadge label="Storage" value={smart.storageType} color={smart.isDeepFreeze ? 'blue' : smart.isColdChain ? 'cyan' : undefined} />
                    <AttrBadge label="Rotation / Shelf Life" value={smart.shelfLifeLabel} color={smart.isPerishable ? 'orange' : undefined} />
                    <AttrBadge label="Cold Chain" value={smart.isColdChain ? 'Chilled 2°C–8°C' : null} color="cyan" />
                    <AttrBadge label="Deep Freeze" value={smart.isDeepFreeze ? 'Frozen -18°C' : null} color="blue" />
                    <AttrBadge label="High Value" value={smart.isHighValue ? 'Secure Merchandising' : null} color="red" />
                    <AttrBadge label="Serial Tracked" value={smart.isSerialTracked ? 'Serial Scan Required' : null} color="blue" />
                    <AttrBadge label="Hazardous" value={smart.isHazardous} color="red" />
                    <AttrBadge label="Stack Limit" value={customAttrs?.storage?.stackLimit ? `Max ${customAttrs.storage.stackLimit}` : null} />
                </div>
            </div>

            {/* 5. Commercial & POS Shelf Rules */}
            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                    <Tag size={12} className="text-purple-500 shrink-0" />
                    <span>POS Checkout & Shelf Pricing Rules</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <AttrBadge label="Sell Unit" value={`${smart.sellUnitFull} (${smart.sellUnitShort})`} color="blue" />
                    <AttrBadge label="Sold By" value={smart.sellByMode} />
                    <AttrBadge label="Shelf Unit Rate" value={smart.unitPriceEquivalent} color="green" />
                    <AttrBadge label="Scale / Weighted" value={smart.isWeightedScale ? 'Yes (Decimal Qty)' : 'Discrete Count'} color={smart.isWeightedScale ? 'purple' : undefined} />
                    <AttrBadge label="Price Type" value={customAttrs?.commercial?.priceType || 'Fixed Shelf Price'} />
                    <AttrBadge label="Returnable" value={customAttrs?.commercial?.isReturnable !== false ? 'Eligible' : 'Final Sale'} color="green" />
                </div>
            </div>

            {/* 6. Sensory & Usage Domain (when present) */}
            {hasDescriptive && (
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Info size={12} className="text-[var(--theme-text-secondary)] shrink-0" />
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

            {/* 7. Supermarket Category-Specific Specifications */}
            {smart.domainSpecs.length > 0 && (
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                            <Sparkles size={12} className="text-[var(--theme-accent)] shrink-0" />
                            <span>{smart.archetypeTitle}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full">
                            {smart.subcategory}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {smart.domainSpecs.map(spec => (
                            <AttrBadge
                                key={spec.label}
                                label={spec.label}
                                value={spec.value}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
