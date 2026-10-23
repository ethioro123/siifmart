import React from 'react';
import { CheckCircle, MapPin, Box, ArrowRight, ShieldCheck, Loader2, Package, Tag } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';

interface Step3PickStagingProps {
    job: WMSJob;
    sourceSite: Site | undefined;
    totalItems: number;
    completedItems: number;
    isSubmitting: boolean;
    onCompleteJob: (job: WMSJob) => void;
    resolveOrderRef: (ref?: string) => string;
    t: (key: string) => string;
}

export const Step3PickStaging: React.FC<Step3PickStagingProps> = ({
    job,
    sourceSite,
    totalItems,
    completedItems,
    isSubmitting,
    onCompleteJob,
    resolveOrderRef,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Handover Summary Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-3 items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold uppercase tracking-tight text-[var(--theme-text-primary)]">
                                Picking review
                            </h3>
                            <span className="text-xs text-[var(--theme-text-secondary)]">
                                Review verified quantities and shortages before completion
                            </span>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-mono font-bold text-xs uppercase">
                        {completedItems} / {totalItems} Lines Verified
                    </span>
                </div>

                {/* Staging Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Target Drop-Off Zone
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate">
                            <MapPin size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span>Packing Station 01</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Source Warehouse
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate">
                            <Box size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="truncate">{sourceSite?.name || 'Central Warehouse'}</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] col-span-2 md:col-span-1">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Order Reference
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-accent)] truncate font-mono">
                            <Tag size={13} className="shrink-0" />
                            <span className="truncate">{resolveOrderRef(job.orderRef) || formatJobId(job)}</span>
                        </div>
                    </div>
                </div>

                {/* Staging Directive Instructions */}
                <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Package size={16} />
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Only picked quantities go to packing. If all lines are short, no packing job is created and the order needs supervisor review.
                    </p>
                </div>
            </div>


        </div>
    );
};
