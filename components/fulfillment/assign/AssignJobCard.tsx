import React from 'react';
import { WMSJob, Site, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

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

export const AssignJobCard: React.FC<AssignJobCardProps> = ({ job, isAssigned, isSelected, bestMatchEmployee, setSelectedJob, setIsDetailsOpen, sites, employees }) => {
    const worker = employees.find(e => e.id === job.assignedTo);
    const destination = sites.find(site => site.id === job.destSiteId);
    return <article className={`rounded-xl border transition-colors ${isSelected ? 'border-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] ring-1 ring-[var(--theme-accent)]' : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)]'}`}>
        <div className="flex items-start gap-2 p-3">
            <button type="button" aria-pressed={isSelected} aria-label={`Select job ${formatJobId(job)}`} onClick={() => { setSelectedJob(job); setIsDetailsOpen(false); }} className="min-h-[44px] min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] rounded-lg">
                <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-base text-[var(--theme-text-primary)]">{formatJobId(job)}</span><span className="text-xs text-[var(--theme-text-secondary)]">{job.type} · {job.items} items</span><span className={`ml-auto rounded-full px-2 py-1 text-[11px] ${isAssigned ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]' : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)]'}`}>{isAssigned ? job.status === 'Pending' ? 'Assigned' : job.status : 'Unassigned'}</span></div>
                <p className="mt-1 text-xs text-[var(--theme-text-secondary)] break-words">{destination?.name || sites.find(site => site.id === (job.sourceSiteId || job.siteId))?.name || 'Facility unavailable'}{job.priority !== 'Normal' ? ` · ${job.priority} priority` : ''}</p>
                <p className="mt-2 text-xs text-[var(--theme-text-secondary)] break-words">{isAssigned ? `Assigned to ${worker?.name || job.assignedTo || 'a team member'}` : bestMatchEmployee ? `Suggested: ${bestMatchEmployee.employee.name} · ${bestMatchEmployee.workload} active jobs` : 'Choose a team member to assign this job'}</p>
            </button>
            <button type="button" aria-label={`Details for job ${formatJobId(job)}`} onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className="min-h-[44px] shrink-0 rounded-lg px-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Details</button>
        </div>
        {isSelected && <button type="button" onClick={() => document.getElementById('assignment-team')?.scrollIntoView({ block: 'start' })} className="xl:hidden flex min-h-[44px] items-center px-3 pb-2 text-xs font-semibold text-[var(--theme-accent)]">Choose a team member →</button>}
    </article>;
};
