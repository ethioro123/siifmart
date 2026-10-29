import React from 'react';
import {
    Tag, Package, Layers, Scale, Snowflake, Thermometer,
    ShieldCheck, Lock, AlertTriangle, Sparkles
} from 'lucide-react';
import { resolveSmartProductAttributes, type AttributeTone } from '../utils/groceryAttributes';

interface SmartProductAttributeStripProps {
    item: any;
    allProducts?: any[];
    catalogProducts?: any[];
    currencySymbol?: string;
    maxPills?: number;
    showDomainSpecs?: boolean;
    showInboundQc?: boolean;
    showUnitPrice?: boolean;
    className?: string;
}

const TONE_CLASSES: Record<AttributeTone, string> = {
    neutral: 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]',
    accent: 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20',
    green: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
    amber: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
    cyan: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]',
    blue: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]',
    purple: 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border-[var(--theme-border-accent)]',
    rose: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
};

function getPillIcon(key: string) {
    switch (key) {
        case 'brand':
        case 'subcategory':
            return Tag;
        case 'pack':
        case 'pkg':
            return Package;
        case 'size':
        case 'dims':
        case 'form':
            return Layers;
        case 'scale':
            return Scale;
        case 'freeze':
            return Snowflake;
        case 'cold':
            return Thermometer;
        case 'halal':
            return ShieldCheck;
        case 'security':
            return Lock;
        case 'expiry':
            return AlertTriangle;
        default:
            return Sparkles;
    }
}

export const SmartProductAttributeStrip: React.FC<SmartProductAttributeStripProps> = ({
    item,
    allProducts,
    catalogProducts,
    currencySymbol = '',
    maxPills = 6,
    showDomainSpecs = true,
    showInboundQc = false,
    showUnitPrice = false,
    className = ''
}) => {
    if (!item) return null;

    const profile = resolveSmartProductAttributes(item, allProducts || catalogProducts, currencySymbol);
    const visiblePills = profile.quickPills.slice(0, maxPills);
    const topDomainSpecs = showDomainSpecs ? profile.domainSpecs.slice(0, 2) : [];

    if (visiblePills.length === 0 && topDomainSpecs.length === 0 && (!showUnitPrice || !profile.unitPriceLabel)) return null;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {visiblePills.map((pill) => {
                const Icon = getPillIcon(pill.key);
                const showLabel = pill.label && pill.label !== pill.value;
                return (
                    <span
                        key={pill.key}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border leading-tight ${TONE_CLASSES[pill.tone]}`}
                    >
                        <Icon size={11} className="shrink-0 opacity-80" />
                        {showLabel && (
                            <span className="opacity-75 font-semibold">{pill.label}:</span>
                        )}
                        <span className="font-semibold font-mono truncate max-w-[160px]">{pill.value}</span>
                    </span>
                );
            })}

            {showUnitPrice && profile.unitPriceLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] leading-tight font-mono">
                    <span>{profile.unitPriceLabel}</span>
                </span>
            )}

            {topDomainSpecs.map((spec) => (
                <span
                    key={spec.label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] leading-tight"
                >
                    <span className="opacity-75">{spec.label}:</span>
                    <span className="font-semibold text-[var(--theme-text-primary)] truncate max-w-[150px]">{spec.value}</span>
                </span>
            ))}

            {showInboundQc && profile.inboundQcDirective && (
                <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] leading-tight"
                    title={profile.inboundQcDirective}
                >
                    <ShieldCheck size={11} className="shrink-0" />
                    <span className="truncate max-w-[200px]">QC: {profile.inboundQcDirective}</span>
                </span>
            )}
        </div>
    );
};
