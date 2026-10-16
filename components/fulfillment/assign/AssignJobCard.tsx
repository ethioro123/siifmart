import React from 'react';
import { ArrowRight, Eye, Clock, Sparkles } from 'lucide-react';
import { WMSJob, Site, Employee } from '../../../types';
import { formatJobId, formatOrderRef } from '../../../utils/jobIdFormatter';
import { useStore } from '../../../contexts/CentralStore';

interface AssignJobCardProps {
    job: WMSJob;
    isAssigned: boolean;
    isSelected: boolean;
    bestMatchEmployee?: { employee: Employee; workload: number };
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    sites: Site[];
    employees: Employee[];
    t: (key: string) => string;
}

export const AssignJobCard: React.FC<AssignJobCardProps> = ({
    job,
    isAssigned,
    isSelected,
    bestMatchEmployee,
    setSelectedJob,
    setIsDetailsOpen,
    sites,
    employees,
    t
}) => {
    const { user } = useStore();

    // Calculate estimated duration
    let estimatedDuration = 15;
    if (job.type === 'PICK') estimatedDuration = Math.max(15, job.items * 3);
    else if (job.type === 'PACK') estimatedDuration = Math.max(10, job.items * 2);
    else if (job.type === 'PUTAWAY') estimatedDuration = Math.max(20, job.items * 4);

    let cardClass = '';
    if (isAssigned) {
        if (isSelected) {
            cardClass = 'bg-[var(--theme-bg-subtle)] border-primary shadow-sm';
        } else {
            cardClass = 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] opacity-80 hover:opacity-100 cursor-pointer';
        }
    } else {
        if (isSelected) {
            cardClass = 'bg-[var(--theme-bg-card)] border-primary shadow-sm';
        } else {
            cardClass = 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-primary/40 cursor-pointer';
        }
    }

    const assignee = job.assignedTo ? employees.find(e => e.id === job.assignedTo) : null;

    return (
        <div
            onClick={() => {
                setSelectedJob(job);
                setIsDetailsOpen(false);
            }}
            className={`p-3.5 sm:p-4 rounded-xl border transition-colors touch-manipulation ${cardClass}`}
        >
            <div className="flex justify-between items-start mb-2.5">
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            {job.type}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${
                            job.priority === 'Critical'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                : job.priority === 'High'
                                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'
                        }`}>
                            {job.priority}
                        </span>
                        {job.status?.toLowerCase() !== 'pending' && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {job.status}
                            </span>
                        )}
                    </div>
                    {assignee && (
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary">
                                {assignee.name?.charAt(0)}
                            </div>
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium truncate">{assignee.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-mono font-medium tracking-wider">{formatJobId(job)}</span>
                        {job.orderRef && job.type !== 'PICK' && (
                            <span className="text-[11px] text-[var(--theme-text-muted)] font-mono border-l border-[var(--theme-border)] pl-2 truncate">
                                PO: {formatOrderRef(job.orderRef)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!isAssigned && bestMatchEmployee && (
                        <div className="flex items-center justify-center p-1.5 bg-green-500/10 rounded-lg border border-green-500/20" title={`${t('warehouse.suggested')}: ${bestMatchEmployee.employee.name}`}>
                            <Sparkles size={13} className="text-green-600 dark:text-green-400" />
                        </div>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                            setIsDetailsOpen(true);
                        }}
                        className="w-8 h-8 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center justify-center touch-manipulation"
                        title="View Details"
                    >
                        <Eye size={14} />
                    </button>
                </div>
            </div>

            {/* Information Row */}
            <div className="flex items-end justify-between pt-2 border-t border-[var(--theme-border)]">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{job.items}</span>
                        <span className="text-[11px] text-[var(--theme-text-muted)] uppercase font-medium tracking-wider">{t('warehouse.itemsLabel')}</span>
                    </div>

                    {/* Site Path Indicators */}
                    <div className="flex items-center gap-1.5">
                        {job.sourceSiteId && (
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[11px] text-[var(--theme-text-muted)] uppercase font-medium">
                                    {sites.find(s => s.id === job.sourceSiteId)?.name.split(' ')[0] || job.sourceSiteId}
                                </span>
                            </div>
                        )}
                        {(job.sourceSiteId && job.destSiteId) && <ArrowRight size={10} className="text-[var(--theme-text-muted)]" />}
                        {job.destSiteId && (
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[11px] text-[var(--theme-text-muted)] uppercase font-medium">
                                    {sites.find(s => s.id === job.destSiteId)?.name.split(' ')[0] || job.destSiteId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-[var(--theme-text-muted)] mb-0.5">
                        <Clock size={11} />
                        <span className="text-[11px] font-medium uppercase tracking-wider">ETA</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)]">{estimatedDuration}m</span>
                </div>
            </div>
        </div>
    );
};
