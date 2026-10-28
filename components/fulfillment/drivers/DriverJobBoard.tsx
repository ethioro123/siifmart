import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import type { WMSJob, Site } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getShipmentPhase, getShipmentUnits } from '../../../utils/shipmentWorkflow';
import { useLanguage } from '../../../contexts/LanguageContext';

interface DriverJobBoardProps {
    filteredJobs: WMSJob[];
    sites: Site[];
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (open: boolean) => void;
    globalSearch: string;
}

/** Dispatch owns allocation and departure. Drivers inspect their staged manifest here. */
export const DriverJobBoard: React.FC<DriverJobBoardProps> = ({ filteredJobs, sites, setSelectedJob, setIsDetailsOpen, globalSearch }) => {
    const { t } = useLanguage();
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState(true);
    const query = globalSearch.trim().toLowerCase();
    const jobs = filteredJobs.filter(job => getShipmentPhase(job) === 'ready' && (!query ||
        [formatJobId(job), job.trackingNumber, sites.find(site => site.id === job.destSiteId)?.name]
            .some(value => value?.toLowerCase().includes(query))));
    const pages = Math.max(1, Math.ceil(jobs.length / 6));
    useEffect(() => setPage(1), [globalSearch]);
    useEffect(() => setPage(previous => Math.min(previous, pages)), [pages]);

    return <section className="space-y-2">
        <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}
            className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-xs font-semibold text-[var(--theme-text-primary)]">
            <span>{t('warehouse.driverHub.awaitingDispatchRelease', { count: jobs.length })}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && <>
            <p className="px-1 text-xs text-[var(--theme-text-secondary)]">{t('warehouse.driverHub.dispatchNotice')}</p>
            {jobs.length === 0 && <p className="p-4 text-xs text-[var(--theme-text-secondary)]">{t('warehouse.driverHub.noStagedDeliveries')}</p>}
            {jobs.slice((page - 1) * 6, page * 6).map(job => <button key={job.id} type="button"
                onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 text-left text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-primary)]">
                <Truck size={18} className="shrink-0 text-[var(--theme-primary)]" />
                <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs font-semibold">#{formatJobId(job)} · {getShipmentUnits(job)} units</span>
                    <span className="block truncate text-xs text-[var(--theme-text-secondary)]">{sites.find(site => site.id === job.destSiteId)?.name || 'Customer'} · {job.location || 'Staging'}</span>
                </span>
                <ArrowRight size={16} className="shrink-0" />
            </button>)}
            {jobs.length > 6 && <Pagination currentPage={page} totalPages={pages} totalItems={jobs.length} itemsPerPage={6} onPageChange={setPage} itemName="shipments" />}
        </>}
    </section>;
};
