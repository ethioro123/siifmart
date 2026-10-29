import React from 'react';
import { Sparkles, Box, Check, Eye } from 'lucide-react';
import { Product } from '../../../../types';
import { SellUnit } from '../../../../utils/units';

interface SmartUnitIntelligencePanelProps {
    product: Product;
    smartIntelligence: {
        sellUnit: SellUnit;
        autoConversionText: string;
        subUnitRateText: string;
        priceFormatted: string;
    } | null;
    supplierSpec: {
        packSize: string | number;
        sizeType: string;
        poRef: string;
        vendorName: string;
    };
}

export const SmartUnitIntelligencePanel: React.FC<SmartUnitIntelligencePanelProps> = ({
    product,
    smartIntelligence,
    supplierSpec,
}) => {
    return (
        <div className="space-y-4">
            {/* Smart Intelligence Auto-Detected Box */}
            <div className="bg-[var(--theme-bg-subtle)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[var(--theme-status-warning-text)] animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Smart Intelligence</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                        Auto-Detected
                    </span>
                </div>

                <div className="bg-[var(--theme-bg-card)] p-3.5 rounded-xl border border-[var(--theme-border)] space-y-1 shadow-xs">
                    <p className="text-base font-bold font-mono text-[var(--theme-text-primary)]">
                        {smartIntelligence?.autoConversionText}
                    </p>
                    {smartIntelligence?.subUnitRateText && (
                        <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-bold font-mono">
                            = {smartIntelligence.subUnitRateText}
                        </p>
                    )}
                </div>

                <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium flex items-center gap-1.5">
                    <Check size={14} className="text-[var(--theme-accent)]" />
                    Sell mode auto-matched from product unit: <span className="font-bold uppercase text-[var(--theme-text-primary)]">{smartIntelligence?.sellUnit.shortLabel}</span>
                </p>
            </div>

            {/* Supplier Specification (Read-Only) */}
            <div className="bg-[var(--theme-bg-subtle)] p-4 rounded-2xl border border-[var(--theme-border)] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Box size={16} className="text-[var(--theme-text-secondary)]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Supplier Specification</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]">
                        Read-Only
                    </span>
                </div>

                <p className="text-[11px] text-[var(--theme-text-muted)] leading-snug font-medium">
                    Physical content is supplier-defined. Configure how you sell it on the right.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[11px] text-[var(--theme-text-muted)] block font-sans font-medium uppercase">Pack / Case Size</span>
                        <span className="font-bold text-[var(--theme-text-primary)] text-sm">{supplierSpec.packSize}</span>
                    </div>
                    <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[11px] text-[var(--theme-text-muted)] block font-sans font-medium uppercase">Base Unit Type</span>
                        <span className="font-bold text-[var(--theme-text-primary)] text-sm">{supplierSpec.sizeType}</span>
                    </div>
                </div>
            </div>

            {/* Live POS Label Preview */}
            <div className="bg-[var(--theme-bg-card)] p-4 rounded-2xl border border-[var(--theme-border)] space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                    <Eye size={16} className="text-[var(--theme-text-secondary)]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">POS Label & Card Preview</h4>
                </div>
                <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)]">{product.name}</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            Sold per <span className="uppercase text-[var(--theme-accent)] font-bold">{smartIntelligence?.sellUnit.shortLabel}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold font-mono text-[var(--theme-text-primary)]">
                            {smartIntelligence?.priceFormatted}{smartIntelligence?.sellUnit.code !== 'UNIT' ? `/${smartIntelligence?.sellUnit.shortLabel}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
