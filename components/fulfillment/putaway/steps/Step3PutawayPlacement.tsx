import React from 'react';
import { CheckCircle, MapPin, Box, ShieldCheck, Loader2, Tag, Layers } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';

interface Step3PutawayPlacementProps {
    job: WMSJob;
    sourceSite: Site | undefined;
    totalItems: number;
    completedItems: number;
    isSubmitting: boolean;
    onCompleteJob: (job: WMSJob) => void;
    resolveOrderRef: (ref?: string) => string;
    t: (key: string) => string;
}

export const Step3PutawayPlacement: React.FC<Step3PutawayPlacementProps> = ({
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
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold uppercase tracking-tight text-[var(--theme-text-primary)]">
                                Storage Slotting Verified
                            </h3>
                            <span className="text-xs text-[var(--theme-text-secondary)]">
                                All stock slotted to designated aisle, rack, and bin locations
                            </span>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-mono font-bold text-xs uppercase">
                        {completedItems} / {totalItems} Items Verified
                    </span>
                </div>

                {/* Staging Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Facility / Site
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate">
                            <MapPin size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span>{sourceSite?.name || 'Warehouse Floor'}</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Job Reference
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-text-primary)] truncate font-mono break-all">
                            <Box size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="truncate">#{formatJobId(job)}</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] col-span-2 md:col-span-1">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Origin / PO Ref
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[var(--theme-accent)] truncate font-mono break-all">
                            <Tag size={13} className="shrink-0" />
                            <span className="truncate">{resolveOrderRef(job.orderRef) || 'Direct Intake'}</span>
                        </div>
                    </div>
                </div>

                {/* Inventory Live Notification */}
                <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Layers size={16} />
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Review the recorded placements. Stock is updated when each placement is saved; completing the job closes its workflow.
                    </p>
                </div>
            </div>


        </div>
    );
};
