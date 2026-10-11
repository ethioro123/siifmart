import React from 'react';
import { 
    Cpu, 
    Shirt, 
    Apple, 
    ShieldCheck, 
    Milk, 
    Coffee, 
    Layers, 
    Sparkles, 
    Baby, 
    Car, 
    Tag, 
    Cookie,
    UtensilsCrossed,
    Snowflake,
    PawPrint,
    BookOpen,
    Scale,
    Thermometer,
    Package,
    AlertTriangle,
    SlidersHorizontal
} from 'lucide-react';
import { getPOItemCategorySpecsSummary } from './categoryAttributes';

interface POItemExpandedDetailsProps {
    item: any;
}

const getDomainIcon = (iconType: string) => {
    switch (iconType) {
        case 'cpu': return Cpu;
        case 'shirt': return Shirt;
        case 'apple': return Apple;
        case 'shield-check': return ShieldCheck;
        case 'milk': return Milk;
        case 'coffee': return Coffee;
        case 'layers': return Layers;
        case 'sparkles': return Sparkles;
        case 'baby': return Baby;
        case 'car': return Car;
        case 'cookie': return Cookie;
        case 'sandwich': return UtensilsCrossed;
        case 'snowflake': return Snowflake;
        case 'dog': return PawPrint;
        case 'book-open': return BookOpen;
        case 'tag':
        default: return Tag;
    }
};

export const POItemExpandedDetails: React.FC<POItemExpandedDetailsProps> = ({ item }) => {
    const summary = getPOItemCategorySpecsSummary(item);
    const DomainIcon = getDomainIcon(summary.iconType);
    const attrs = item.customAttributes || item.custom_attributes || {};

    const physical = attrs.physical || {};
    const storage = attrs.storage || {};
    const packaging = attrs.packaging || {};
    const commercial = attrs.commercial || {};
    const descriptive = attrs.descriptive || {};

    const hasPhysical = !!(physical.netWeight || physical.grossWeight || physical.form || physical.dims || physical.color);
    const hasStorage = !!(storage.type || storage.isPerishable || storage.isHazardous || storage.isFragile || storage.stackLimit || storage.isLightSensitive);
    const hasPackaging = !!(packaging.packageType || packaging.packQty || packaging.caseSize || packaging.material);
    const hasCommercial = !!(commercial.sellBy || commercial.priceType || commercial.isWeighted || commercial.isReturnable !== undefined);
    const hasDescriptive = !!(descriptive.scent || descriptive.flavor || descriptive.usage || descriptive.keyFeatures);

    return (
        <div className="space-y-3.5 py-1">
            {/* Category Domain Specs Section */}
            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center">
                            <DomainIcon size={12} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            {summary.domainTitle}
                        </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <SlidersHorizontal size={10} className="text-[var(--theme-accent)]" /> {summary.badgeLabel}
                    </span>
                </div>

                {summary.specs.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                        {summary.specs.map((spec, idx) => (
                            <div key={idx} className="bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-2 flex flex-col justify-between">
                                <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-tight">
                                    {spec.label}
                                </span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)] mt-0.5 truncate">
                                    {spec.value}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[var(--theme-text-secondary)] italic">
                        Standard specifications apply.
                    </p>
                )}
            </div>

            {/* GS1 Secondary Attribute Layers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Physical Specifications */}
                {hasPhysical && (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            <Scale size={11} className="text-emerald-500" />
                            <span>Physical Specifications</span>
                        </div>
                        <div className="space-y-1 text-xs">
                            {physical.netWeight && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Net Weight:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{physical.netWeight} {physical.sizeType || physical.unit || ''}</span>
                                </div>
                            )}
                            {physical.grossWeight && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Gross Weight:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{physical.grossWeight}</span>
                                </div>
                            )}
                            {physical.form && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Form:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{physical.form}</span>
                                </div>
                            )}
                            {physical.dims && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Dimensions:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{physical.dims}</span>
                                </div>
                            )}
                            {physical.color && (
                                <div className="flex justify-between">
                                    <span className="text-[var(--theme-text-secondary)]">Color:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{physical.color}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Storage & Cold Chain Protocols */}
                {hasStorage && (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            <Thermometer size={11} className="text-cyan-500" />
                            <span>Storage & Handling</span>
                        </div>
                        <div className="space-y-1 text-xs">
                            {storage.type && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Storage Mode:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{storage.type}</span>
                                </div>
                            )}
                            {storage.isPerishable && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Perishable:</span>
                                    <span className="font-bold text-amber-500">Yes ({storage.shelfLifeDays ? `${storage.shelfLifeDays} days` : 'Cold Chain'})</span>
                                </div>
                            )}
                            {storage.isHazardous && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Hazard Class:</span>
                                    <span className="font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={11} /> Hazardous</span>
                                </div>
                            )}
                            {storage.isFragile && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Fragile:</span>
                                    <span className="font-bold text-amber-500">Handle With Care</span>
                                </div>
                            )}
                            {storage.stackLimit && (
                                <div className="flex justify-between">
                                    <span className="text-[var(--theme-text-secondary)]">Stack Limit:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">Max {storage.stackLimit} High</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Packaging & Hierarchy */}
                {hasPackaging && (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            <Package size={11} className="text-amber-500" />
                            <span>Packaging Architecture</span>
                        </div>
                        <div className="space-y-1 text-xs">
                            {packaging.packageType && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Package Type:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{packaging.packageType}</span>
                                </div>
                            )}
                            {packaging.packQty && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Pack Qty:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{packaging.packQty} units</span>
                                </div>
                            )}
                            {packaging.caseSize && (
                                <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                    <span className="text-[var(--theme-text-secondary)]">Case Size:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{packaging.caseSize} packs/case</span>
                                </div>
                            )}
                            {packaging.material && (
                                <div className="flex justify-between">
                                    <span className="text-[var(--theme-text-secondary)]">Material:</span>
                                    <span className="font-semibold text-[var(--theme-text-primary)]">{packaging.material}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
