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
        <div className="relative p-4 md:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10">
            <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-3.5 md:gap-4">
                    <div className={`w-11 h-11 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center shadow-sm shrink-0 ${
                        isFullyPacked
                            ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                            : 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                    }`}>
                        {isFullyPacked ? <ShieldCheck size={22} className="md:w-7 md:h-7" /> : <Archive size={22} className="md:w-7 md:h-7" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase leading-none">
                                {isFullyPacked ? t('warehouse.completed') : t('warehouse.packJobTitle')}
                            </h2>
                            <span className="px-2.5 py-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-mono text-[var(--theme-text-secondary)]">
                                #{formatJobId(job)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-medium text-[var(--theme-text-secondary)] mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] uppercase font-semibold tracking-wider border ${
                                job.priority === 'Critical' ? 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10' :
                                job.priority === 'High' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                                'border-[var(--theme-border)] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]'
                            }`}>
                                {job.priority}
                            </span>
                            <span className="flex items-center gap-1 text-[var(--theme-text-primary)] font-medium">
                                <MapPin size={13} className="text-[var(--theme-accent)] shrink-0" />
                                <span className="truncate max-w-[160px] sm:max-w-none">
                                    {destSite ? (
                                        <>
                                            {destSite.name} <span className="text-[var(--theme-text-secondary)] font-mono text-[11px]">({destSite.code || destSite.id})</span>
                                        </>
                                    ) : ((job as any).customerName || 'Customer')}
                                </span>
                            </span>
                            <span className="hidden sm:flex items-center gap-1 text-[var(--theme-text-secondary)] text-[11px]">
                                <Clock size={13} />
                                {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label={t('warehouse.dismiss')}
                    className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
