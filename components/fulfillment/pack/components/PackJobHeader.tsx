import React from 'react';
import { X, ShieldCheck, Archive, MapPin, Clock } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';

interface PackJobHeaderProps {
    isFullyPacked: boolean;
    job: WMSJob;
    destSite: Site | undefined;
    onClose: () => void;
    t: (key: string) => string;
}

export const PackJobHeader: React.FC<PackJobHeaderProps> = ({
    isFullyPacked,
    job,
    destSite,
    onClose,
    t,
}) => {
    return (
        <div className="relative p-3 sm:p-4 md:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10 overflow-hidden">
            <div className="relative flex justify-between items-start gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center shadow-sm shrink-0 ${
                        isFullyPacked
                            ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                            : 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                    }`}>
                        {isFullyPacked ? <ShieldCheck size={20} className="md:w-7 md:h-7" /> : <Archive size={20} className="md:w-7 md:h-7" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <h2 className="text-sm sm:text-base md:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase leading-none truncate">
                                {isFullyPacked ? t('warehouse.completed') : t('warehouse.packJobTitle')}
                            </h2>
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] sm:text-xs font-mono text-[var(--theme-text-secondary)] shrink-0">
                                #{formatJobId(job)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs font-medium text-[var(--theme-text-secondary)] mt-0.5">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider border shrink-0 ${
                                job.priority === 'Critical' ? 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10' :
                                job.priority === 'High' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                                'border-[var(--theme-border)] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]'
                            }`}>
                                {job.priority}
                            </span>
                            <span className="flex items-center gap-1 text-[var(--theme-text-primary)] font-medium min-w-0 max-w-[170px] sm:max-w-none">
                                <MapPin size={12} className="text-[var(--theme-accent)] shrink-0" />
                                <span className="truncate">
                                    {destSite ? (
                                        <>
                                            {destSite.name} <span className="text-[var(--theme-text-secondary)] font-mono text-[10px] sm:text-[11px]">({destSite.code || destSite.id})</span>
                                        </>
                                    ) : ((job as any).customerName || 'Customer')}
                                </span>
                            </span>
                            <span className="hidden sm:flex items-center gap-1 text-[var(--theme-text-secondary)] text-[11px] shrink-0">
                                <Clock size={12} />
                                {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label={t('warehouse.dismiss')}
                    className="p-2 sm:p-2.5 min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                >
                    <X size={18} className="sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
};
