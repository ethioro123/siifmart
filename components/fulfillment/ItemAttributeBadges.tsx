import React from 'react';
import {
    Thermometer,
    ShieldCheck,
    Layers,
    Package,
    AlertTriangle,
    Lock,
    Zap,
    Snowflake,
    Sparkles
} from 'lucide-react';
import { getPOItemPhysicalSummary } from '../procurement/physicalUtils';
import { getCategoryStorageDefaults } from '../procurement/categoryLogistics';
import { getCategoryPackagingDefaults } from '../procurement/categoryPackaging';

export interface ItemAttributeBadgesProps {
    item: any;
    allProducts?: any[];
    showPhysical?: boolean;
    showInboundQc?: boolean;
    showStorage?: boolean;
    showPackaging?: boolean;
    showFlags?: boolean;
    compact?: boolean;
    className?: string;
}

export const ItemAttributeBadges: React.FC<ItemAttributeBadgesProps> = ({
    item,
    allProducts,
    showPhysical = true,
    showInboundQc = true,
    showStorage = true,
    showPackaging = true,
    showFlags = true,
    compact = false,
    className = ''
}) => {
    if (!item) return null;

    const matchedProduct = allProducts?.find(p =>
        (item.productId && p.id === item.productId) ||
        (item.sku && p.sku === item.sku) ||
        (item.productName && p.name === item.productName)
    );

    const attrs = item.customAttributes ||
        item.custom_attributes ||
        matchedProduct?.customAttributes ||
        (matchedProduct as any)?.custom_attributes ||
        {};

    const category = (item.category || attrs.identity?.category || matchedProduct?.category || '').toString();
    const storageAttrs = attrs.storage || {};
    const packagingAttrs = attrs.packaging || {};

    // 1. Resolve Storage & Inbound QC Defaults
    const storageDefaults = category ? getCategoryStorageDefaults(category) : null;
    const inboundQc = storageAttrs.inboundQcDirective || storageDefaults?.inboundDirectives?.[0] || null;
    const storageType = storageAttrs.type || storageDefaults?.defaultStorage || null;
    const isPerishable = storageAttrs.isPerishable ?? storageDefaults?.defaultPerishable ?? false;
    const shelfLife = storageAttrs.shelfLifeDays || storageDefaults?.defaultShelfLife || null;

    // 2. Resolve Packaging & Container Type
    const pkgDefaults = category ? getCategoryPackagingDefaults(category) : null;
    const packageType = packagingAttrs.packageType || item.packageType || pkgDefaults?.containers?.[0] || null;
    const packagingLevel = packagingAttrs.packagingLevel || item.packagingLevel || pkgDefaults?.defaultLevel || null;
    const packQty = packagingAttrs.packQty || item.packQuantity || pkgDefaults?.defaultPackQty || null;

    // 3. Resolve Physical Specs Summary Badge
    const physSummary = getPOItemPhysicalSummary(item, allProducts);
    const specBadge = physSummary.specBadge;

    // 4. Resolve Active Risk / Handling Flags
    const isColdChain = storageAttrs.coldChain || (storageType && /chilled|cold/i.test(storageType));
    const isDeepFreeze = storageAttrs.deepFreeze || (storageType && /freeze|frozen/i.test(storageType));
    const isHighValue = storageAttrs.highTheft || storageAttrs.highValueCage;
    const isFragile = storageAttrs.isFragile || packagingAttrs.isBreakable;
    const isAntiStatic = storageAttrs.antiStatic;
    const isHalal = storageAttrs.halalVerified || attrs.categorySpecific?.halalCertified === 'Yes';
    const isSerialTracked = storageAttrs.serialTracked || attrs.categorySpecific?.serialNumberTracking;

    const hasAnyContent = (showPhysical && specBadge) ||
        (showInboundQc && inboundQc) ||
        (showStorage && storageType) ||
        (showPackaging && packageType) ||
        (showFlags && (isColdChain || isDeepFreeze || isHighValue || isFragile || isAntiStatic || isHalal || isSerialTracked));

    if (!hasAnyContent) return null;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {/* Inbound QC Receiving Directive */}
            {showInboundQc && inboundQc && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] max-w-full truncate" title={inboundQc}>
                    <ShieldCheck size={11} className="shrink-0" />
                    <span className="truncate">QC: {inboundQc}</span>
                </span>
            )}

            {/* Storage Mode & Temperature */}
            {showStorage && storageType && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    isDeepFreeze
                        ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
                        : isColdChain
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                }`}>
                    {isDeepFreeze ? (
                        <Snowflake size={11} className="shrink-0" />
                    ) : (
                        <Thermometer size={11} className="shrink-0" />
                    )}
                    <span>{storageType}</span>
                    {isPerishable && shelfLife && (
                        <span className="opacity-75 font-mono text-[9px]">({shelfLife}d)</span>
                    )}
                </span>
            )}

            {/* Packaging Architecture & Container Type */}
            {showPackaging && packageType && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                    <Package size={11} className="shrink-0 text-[var(--theme-status-warning-text)]" />
                    <span className="truncate max-w-[140px]">{packageType}</span>
                    {packQty && Number(packQty) > 1 && (
                        <span className="font-mono text-[9px] text-[var(--theme-accent)] font-semibold">×{packQty}</span>
                    )}
                </span>
            )}

            {/* Dynamic Physical Specs Badge */}
            {showPhysical && specBadge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                    <Layers size={11} className="shrink-0 text-[var(--theme-accent)]" />
                    <span className="truncate max-w-[200px]">{specBadge}</span>
                </span>
            )}

            {/* Handling Alerts & Security Flags */}
            {showFlags && isHighValue && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                    <Lock size={10} className="shrink-0" />
                    <span>Cage</span>
                </span>
            )}
            {showFlags && isSerialTracked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]">
                    <Zap size={10} className="shrink-0" />
                    <span>Serial</span>
                </span>
            )}
            {showFlags && isFragile && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                    <AlertTriangle size={10} className="shrink-0" />
                    <span>Fragile</span>
                </span>
            )}
            {showFlags && isHalal && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                    <Sparkles size={10} className="shrink-0" />
                    <span>Halal</span>
                </span>
            )}
        </div>
    );
};
