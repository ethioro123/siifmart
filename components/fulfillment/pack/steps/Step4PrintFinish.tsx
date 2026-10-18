import React from 'react';
import { Printer, AlertTriangle, Box, Scale, MapPin, Hash, ShieldCheck, Tag, Snowflake, Lock } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';
import { BoxSizeType, PackingMaterialsState } from './Step2BoxPrep';

interface Step4PrintFinishProps {
    job: WMSJob;
    destSite: Site | undefined;
    boxSize: BoxSizeType;
    scaleWeight: string;
    expectedWeightKg: number;
    packingMaterials: PackingMaterialsState;
    sealSerialNumber: string;
    hasIcePack: boolean;
    hasColdItems: boolean | undefined;
    hasFragileItems: boolean | undefined;
    isSubmitting: boolean;
    onPrintLabel: () => void;
    onFlagDiscrepancy?: () => void;
    t: (key: string) => string;
}

export const Step4PrintFinish: React.FC<Step4PrintFinishProps> = ({
    job,
    destSite,
    boxSize,
    scaleWeight,
    expectedWeightKg,
    packingMaterials,
    sealSerialNumber,
    hasIcePack,
    hasColdItems,
    hasFragileItems,
    isSubmitting,
    onPrintLabel,
    onFlagDiscrepancy,
    t,
}) => {
    const finalWeight = parseFloat(scaleWeight) || expectedWeightKg;
    const totalItems = job.lineItems?.length || 0;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Package Manifest Summary Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold uppercase tracking-tight text-[var(--theme-text-primary)]">
                                Package Ready for Dispatch
                            </h3>
                            <span className="text-xs text-[var(--theme-text-secondary)]">
                                Verification complete · All items accounted for
                            </span>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-mono font-bold text-xs uppercase">
                        {totalItems} Items Packed
                    </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Destination */}
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Destination
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate">
                            <MapPin size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="truncate">{destSite?.name || (job as any).customerName || 'Customer'}</span>
                        </div>
                    </div>

                    {/* Container */}
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Container
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate">
                            <Box size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="truncate">{boxSize}</span>
                        </div>
                    </div>

                    {/* Verified Gross Weight */}
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Gross Weight
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate font-mono">
                            <Scale size={13} className="text-green-600 dark:text-green-400 shrink-0" />
                            <span>{finalWeight.toFixed(2)} kg</span>
                        </div>
                    </div>

                    {/* Tracking Reference */}
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Tracking #
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-accent)] truncate font-mono">
                            <Hash size={13} className="shrink-0" />
                            <span className="truncate">{job.trackingNumber || 'Auto-Generate'}</span>
                        </div>
                    </div>
                </div>

                {/* Directives Badges */}
                <div className="pt-2 border-t border-[var(--theme-border)] flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase mr-1">
                        Applied Directives:
                    </span>
                    {packingMaterials.fragileStickers && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase flex items-center gap-1">
                            <Tag size={12} /> Fragile
                        </span>
                    )}
                    {packingMaterials.bubbleWrap && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase">
                            Bubble Wrapped
                        </span>
                    )}
                    {packingMaterials.thisSideUp && (
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-[11px] font-bold uppercase">
                            This Side Up
                        </span>
                    )}
                    {(hasIcePack || boxSize === 'Thermal Cool Box') && (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[11px] font-bold uppercase flex items-center gap-1">
                            <Snowflake size={12} /> Cold Chain
                        </span>
                    )}
                    {packingMaterials.securitySeal && (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-bold font-mono uppercase flex items-center gap-1">
                            <Lock size={12} /> Seal: {sealSerialNumber || 'Standard'}
                        </span>
                    )}
                    {!packingMaterials.fragileStickers && !packingMaterials.bubbleWrap && !hasIcePack && !packingMaterials.securitySeal && (
                        <span className="text-xs text-[var(--theme-text-secondary)] italic">
                            Standard Packaging
                        </span>
                    )}
                </div>
            </div>

            {/* Print & Completion Actions Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    Final Station Handover Actions
                </h4>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Print Label Button */}
                    <button
                        type="button"
                        onClick={onPrintLabel}
                        disabled={isSubmitting}
                        className="flex-1 min-h-[52px] px-6 py-3 rounded-2xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 text-[var(--theme-text-primary)] font-bold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
                    >
                        <Printer size={18} className="text-[var(--theme-accent)]" />
                        <span>{t('warehouse.printLabel') || 'Print Shipping Label'}</span>
                    </button>

                </div>

                {/* Flag Discrepancy Link */}
                {onFlagDiscrepancy && job.status !== 'Completed' && (
                    <div className="pt-2 flex justify-center">
                        <button
                            type="button"
                            onClick={onFlagDiscrepancy}
                            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1.5 cursor-pointer touch-manipulation"
                        >
                            <AlertTriangle size={14} />
                            <span>{t('warehouse.packing.flagCountIssue') || 'Flag item discrepancy or damaged cargo'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
