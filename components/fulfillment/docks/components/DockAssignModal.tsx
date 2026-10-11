import React from 'react';
import { Package, X, ArrowRight, Box } from 'lucide-react';
import { WMSJob, Site, User } from '../../../../types';

interface DockAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetDock: string | null;
    stagingJobs: WMSJob[];
    sites: Site[];
    employees: User[];
    formatJobId: (job: WMSJob) => string;
    onAssignJobToDock: (jobId: string, dockName: string) => Promise<void>;
    isSubmitting?: boolean;
}

export const DockAssignModal: React.FC<DockAssignModalProps> = ({
    isOpen,
    onClose,
    targetDock,
    stagingJobs,
    sites,
    formatJobId,
    onAssignJobToDock,
    isSubmitting = false,
}) => {
    if (!isOpen || !targetDock) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)]">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                Dock Loading Bay
                            </span>
                            <span className="text-xs font-mono font-medium text-[var(--theme-text-primary)]">
                                {targetDock}
                            </span>
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-tight">
                            Select Shipment for {targetDock}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors touch-manipulation"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
                    {stagingJobs.length === 0 ? (
                        <div className="py-12 text-center">
                            <Box size={36} className="text-[var(--theme-text-muted)] mx-auto mb-2.5" />
                            <p className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                No Shipments Currently in Staging
                            </p>
                            <p className="text-[11px] text-[var(--theme-text-muted)] mt-1">
                                Pack jobs first to send them to outbound staging.
                            </p>
                        </div>
                    ) : (
                        stagingJobs.map((job) => {
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            const unitsCount = job.lineItems?.length || job.items || 0;

                            return (
                                <div
                                    key={job.id}
                                    className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] transition-colors flex items-center justify-between gap-3 group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                            <Package size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-mono font-medium text-[var(--theme-text-primary)] uppercase tracking-wider truncate">
                                                    {formatJobId(job)}
                                                </p>
                                                <span className="text-[11px] font-mono font-medium text-[var(--theme-text-muted)] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded-full tabular-nums">
                                                    {unitsCount} Units
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase truncate mt-0.5">
                                                To: {destSite ? destSite.name : 'Unknown Destination'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={async () => {
                                            await onAssignJobToDock(job.id, targetDock);
                                            onClose();
                                        }}
                                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 shadow-sm disabled:opacity-50 active:scale-[0.98] touch-manipulation"
                                    >
                                        <span>Load {targetDock}</span>
                                        <ArrowRight size={13} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
