import React from 'react';
import { Package, ChevronRight, X } from 'lucide-react';
import { WMSJob, Site } from '../../../types';

interface ScannerJobListProps {
    myScannerJobs: WMSJob[];
    sites: Site[];
    formatJobId: (job: WMSJob) => string;
    setSelectedJob: (job: WMSJob | null) => void;
    setScannerStep: (step: 'NAV' | 'SCAN' | 'CONFIRM') => void;
    setIsScannerMode: (isOpen: boolean) => void;
    t: (key: string) => string;
}

export const ScannerJobList: React.FC<ScannerJobListProps> = ({
    myScannerJobs,
    sites,
    formatJobId,
    setSelectedJob,
    setScannerStep,
    setIsScannerMode,
    t
}) => {
    return (
        <div className="fixed inset-0 z-[150] bg-[var(--theme-bg-app)] flex flex-col">
            <div className="p-4 bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] flex justify-between items-center">
                <h2 className="text-lg font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">{t('warehouse.selectJob')}</h2>
                <button
                    onClick={() => setIsScannerMode(false)}
                    aria-label="Close Scanner"
                    className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                >
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {myScannerJobs.length === 0 ? (
                    <div className="text-center text-[var(--theme-text-muted)] mt-20">
                        <Package size={48} className="mx-auto mb-4 opacity-50 text-primary" />
                        <p className="text-sm font-medium">{t('warehouse.noJobsAvailable')}</p>
                    </div>
                ) : (
                    myScannerJobs.map((job: any) => (
                        <div
                            key={job.id}
                            onClick={() => {
                                setSelectedJob(job);
                                setScannerStep('NAV');
                            }}
                            className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 hover:bg-[var(--theme-bg-subtle)] cursor-pointer group transition-colors touch-manipulation"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold text-[11px] uppercase">
                                            {job.type}
                                        </span>
                                        <span className="text-[var(--theme-text-primary)] font-mono tabular-nums font-bold text-base">{formatJobId(job)}</span>
                                    </div>
                                    <p className="text-xs text-[var(--theme-text-muted)] mt-1">To: {job.assignedTo || 'Unassigned'}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${job.priority === 'High' || job.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20'} `}>
                                        {job.priority}
                                    </span>
                                    <div className="mt-2 text-[var(--theme-text-muted)] text-xs font-mono tabular-nums">
                                        {job.items || job.lineItems?.length} items
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-[var(--theme-border)] flex justify-between items-center">
                                <span className="text-xs text-[var(--theme-text-secondary)]">{job.sourceSiteId ? `From: ${sites.find(s => s.id === job.sourceSiteId)?.name} ` : ''}</span>
                                <ChevronRight size={16} className="text-[var(--theme-text-muted)] group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
