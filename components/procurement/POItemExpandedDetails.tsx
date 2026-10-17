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
import { getPOItemPhysicalSummary } from './physicalUtils';
import { resolveSmartProductAttributes } from '../../utils/groceryAttributes';
import { Product } from '../../types';

interface POItemExpandedDetailsProps {
    item: any;
    allProducts?: Product[];
    currencySymbol?: string;
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

export const POItemExpandedDetails: React.FC<POItemExpandedDetailsProps> = ({
    item,
    allProducts,
    currencySymbol = 'ETB'
}) => {
    const smart = resolveSmartProductAttributes(item, allProducts, currencySymbol);
    const summary = getPOItemCategorySpecsSummary({
        ...item,
        category: smart.category,
        subcategory: smart.subcategory
    });
    const DomainIcon = getDomainIcon(summary.iconType);
    const attrs = item.customAttributes || item.custom_attributes || {};

    const physical = attrs.physical || {};
    const storage = attrs.storage || {};
    const packaging = attrs.packaging || {};

    const physSummary = getPOItemPhysicalSummary(item);
    const domainId = physSummary.domainId;

    const getPhysicalSpecsRows = () => {
        if (domainId === 'apparel') {
            return {
                title: 'Garment & Fitment',
                icon: Shirt,
                colorClass: 'text-indigo-500',
                rows: [
                    { label: 'Size / Fitment:', value: physSummary.sizeOrVolume || attrs.categorySpecific?.apparelSize || smart.netContent },
                    { label: 'Colorway:', value: physical.color || physSummary.colorOrFinish || smart.color },
                    { label: 'Material / Fiber:', value: physSummary.materialOrContainer || physical.form || smart.physicalForm },
                    { label: 'Garment Wt:', value: physical.netWeight ? `${physical.netWeight} ${physical.sizeType || 'g'}` : null },
                    { label: 'Dimensions:', value: physical.dims || smart.dimensions }
                ].filter(r => r.value)
            };
        }
        if (domainId === 'beverages') {
            return {
                title: 'Liquid & Container',
                icon: Coffee,
                colorClass: 'text-cyan-500',
                rows: [
                    { label: 'Net Volume:', value: physical.netWeight ? `${physical.netWeight} ${physical.sizeType || 'ml'}` : smart.netContent },
                    { label: 'Container:', value: physSummary.materialOrContainer || smart.packagingMaterial || physical.form },
                    { label: 'Gross Wt:', value: physical.grossWeight ? (/[a-zA-Z]/.test(physical.grossWeight) ? physical.grossWeight : `${physical.grossWeight} kg`) : smart.grossWeight },
                    { label: 'Bottle Height:', value: physical.dims || smart.dimensions }
                ].filter(r => r.value)
            };
        }
        if (domainId === 'electronics') {
            return {
                title: 'Hardware & Dimensions',
                icon: Cpu,
                colorClass: 'text-sky-500',
                rows: [
                    { label: 'Dimensions:', value: physical.dims || smart.dimensions },
                    { label: 'Device Wt:', value: physical.netWeight ? `${physical.netWeight} ${physical.sizeType || 'g'}` : smart.netContent },
                    { label: 'Color / Finish:', value: physical.color || smart.color },
                    { label: 'Gross Wt:', value: physical.grossWeight ? (/[a-zA-Z]/.test(physical.grossWeight) ? physical.grossWeight : `${physical.grossWeight} kg`) : smart.grossWeight }
                ].filter(r => r.value)
            };
        }
        if (domainId === 'homewares_kitchen') {
            return {
                title: 'Dimensions & Material',
                icon: UtensilsCrossed,
                colorClass: 'text-amber-500',
                rows: [
                    { label: 'Dimensions:', value: physical.dims || smart.dimensions },
                    { label: 'Capacity:', value: physSummary.sizeOrVolume || physical.capacity || smart.netContent },
                    { label: 'Material:', value: physSummary.materialOrContainer || physical.material || smart.packagingMaterial || physical.form },
                    { label: 'Item Weight:', value: physical.netWeight ? `${physical.netWeight} ${physical.sizeType || 'g'}` : null }
                ].filter(r => r.value)
            };
        }
        return {
            title: 'Physical Specifications',
            icon: Scale,
            colorClass: 'text-emerald-500',
            rows: [
                { label: 'Net Content:', value: physical.netWeight ? `${physical.netWeight} ${physical.sizeType || physical.unit || ''}` : smart.netContent },
                { label: 'Gross Weight:', value: physical.grossWeight ? (/[a-zA-Z]/.test(physical.grossWeight) ? physical.grossWeight : `${physical.grossWeight} kg`) : smart.grossWeight },
                { label: 'Form:', value: physical.form || smart.physicalForm },
                { label: 'Dimensions:', value: physical.dims || smart.dimensions },
                { label: 'Color:', value: physical.color || smart.color }
            ].filter(r => r.value)
        };
    };

    const physicalGroup = getPhysicalSpecsRows();
    const mergedSpecs = [
        ...(smart.brand ? [{ label: 'Brand', value: smart.brand }] : []),
        ...(smart.subcategory ? [{ label: 'Subcategory', value: smart.subcategory }] : []),
        ...(smart.variant ? [{ label: 'Variant', value: smart.variant }] : []),
        ...(smart.unitPriceLabel ? [{ label: 'Unit Price Equiv.', value: smart.unitPriceLabel }] : []),
        ...smart.domainSpecs
    ];

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
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <SlidersHorizontal size={10} className="text-[var(--theme-accent)]" /> {summary.badgeLabel}
                    </span>
                </div>

                {mergedSpecs.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                        {mergedSpecs.map((spec, idx) => (
                            <div key={idx} className="bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-2 flex flex-col justify-between">
                                <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-tight">
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
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <physicalGroup.icon size={11} className={physicalGroup.colorClass} />
                        <span>{physicalGroup.title}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        {physicalGroup.rows.map((row, idx) => (
                            <div key={idx} className={`flex justify-between ${idx < physicalGroup.rows.length - 1 ? 'border-b border-[var(--theme-border-subtle)] pb-0.5' : ''}`}>
                                <span className="text-[var(--theme-text-secondary)]">{row.label}</span>
                                <span className="font-semibold text-[var(--theme-text-primary)]">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Storage & Cold Chain Protocols */}
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Thermometer size={11} className="text-cyan-500" />
                        <span>Storage & Handling</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                            <span className="text-[var(--theme-text-secondary)]">Storage Mode:</span>
                            <span className="font-semibold text-[var(--theme-text-primary)]">{storage.type || smart.storageType}</span>
                        </div>
                        {(storage.inboundQcDirective || smart.inboundQcDirective) && (
                            <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                <span className="text-[var(--theme-text-secondary)]">Inbound QC:</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[160px]" title={storage.inboundQcDirective || smart.inboundQcDirective || ''}>
                                    {storage.inboundQcDirective || smart.inboundQcDirective}
                                </span>
                            </div>
                        )}
                        {(storage.isPerishable ?? smart.isPerishable) && (
                            <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                <span className="text-[var(--theme-text-secondary)]">Perishable:</span>
                                <span className="font-bold text-amber-500">Yes ({storage.shelfLifeDays ? `${storage.shelfLifeDays} days` : 'FEFO Tracked'})</span>
                            </div>
                        )}
                        {(storage.isHazardous ?? smart.isHazardous) && (
                            <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                                <span className="text-[var(--theme-text-secondary)]">Hazard Class:</span>
                                <span className="font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={11} /> Hazardous</span>
                            </div>
                        )}
                        {(storage.isFragile ?? smart.isFragile) && (
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

                {/* Packaging & Hierarchy */}
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        <Package size={11} className="text-amber-500" />
                        <span>Packaging Architecture</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                            <span className="text-[var(--theme-text-secondary)]">Hierarchy:</span>
                            <span className="font-semibold text-[var(--theme-text-primary)]">{smart.packagingLevel}</span>
                        </div>
                        <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                            <span className="text-[var(--theme-text-secondary)]">Container:</span>
                            <span className="font-semibold text-[var(--theme-text-primary)]">{packaging.packageType || smart.packageType}</span>
                        </div>
                        <div className="flex justify-between border-b border-[var(--theme-border-subtle)] pb-0.5">
                            <span className="text-[var(--theme-text-secondary)]">Multiplier:</span>
                            <span className="font-semibold text-[var(--theme-text-primary)] font-mono">{smart.packBadge}</span>
                        </div>
                        {(packaging.material || smart.packagingMaterial) && (
                            <div className="flex justify-between">
                                <span className="text-[var(--theme-text-secondary)]">Material:</span>
                                <span className="font-semibold text-[var(--theme-text-primary)]">{packaging.material || smart.packagingMaterial}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

