import React, { useMemo, useState } from 'react';
import { History as HistoryIcon, Search, User } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ReplenishHistoryProps {
    historicalJobs: WMSJob[];
    REPLENISH_HISTORY_PER_PAGE: number;
    setSelectedJob: (job: WMSJob) => void;
    setIsDetailsOpen: (open: boolean) => void;
    employees?: any[];
}

export const ReplenishHistory: React.FC<ReplenishHistoryProps> = ({
    historicalJobs,
    REPLENISH_HISTORY_PER_PAGE,
    setSelectedJob,
    setIsDetailsOpen,
    employees
}) => {
    const { t } = useLanguage();
    const [replenishHistorySearch, setReplenishHistorySearch] = useState('');
    const [replenishHistoryPage, setReplenishHistoryPage] = useState(1);

    const getWorkerDisplay = (job: WMSJob) => {
        const rawUserId = job.completedBy || (job as any).completed_by || job.assignedTo || (job as any).assigned_to;
        const resolved = resolveFulfillmentWorker({
            userId: rawUserId,
            job,
            employees: employees || [],
            sites: [],
            siteId: job.siteId || (job as any).site_id
        });
        return resolved.code ? `${resolved.name} (${resolved.code})` : resolved.name;
    };

    const filteredReplenishHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) => {
            if (j.type !== 'REPLENISH') return false;
            if (!replenishHistorySearch) return true;

            const q = replenishHistorySearch.toLowerCase();
            const cleanJobId = formatJobId(j).toLowerCase();
            const orderRefStr = (j.orderRef || '').toLowerCase();
            const noteStr = (j.notes || '').toLowerCase();
            const statusStr = (j.status || '').toLowerCase();
            const jobNum = (j.jobNumber || (j as any).job_number || '').toLowerCase();
            const worker = getWorkerDisplay(j).toLowerCase();

            // Search product names and SKUs
            const items = j.lineItems || (j as any).line_items || [];
            const matchesItems = items.some((item: any) =>
                (item.name || '').toLowerCase().includes(q) ||
                (item.productName || '').toLowerCase().includes(q) ||
                (item.sku || '').toLowerCase().includes(q)
            );

            return (
                cleanJobId.includes(q) ||
                j.id.toLowerCase().includes(q) ||
                orderRefStr.includes(q) ||
                noteStr.includes(q) ||
                statusStr.includes(q) ||
                jobNum.includes(q) ||
                worker.includes(q) ||
                matchesItems
            );
        });
    }, [historicalJobs, replenishHistorySearch, employees]);

    const replenishHistoryTotalPages = Math.ceil(filteredReplenishHistory.length / REPLENISH_HISTORY_PER_PAGE);

    const paginatedReplenishHistory = useMemo(() => {
        const start = (replenishHistoryPage - 1) * REPLENISH_HISTORY_PER_PAGE;
        return filteredReplenishHistory.slice(start, start + REPLENISH_HISTORY_PER_PAGE);
    }, [filteredReplenishHistory, replenishHistoryPage]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-[var(--theme-text-secondary)]" />
                        {t('warehouse.replenishHistory')}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">
                        {t('warehouse.replenishHistorySubtitle')}
                    </p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={14} />
                    <input
                        type="text"
                        placeholder={t('warehouse.searchHistoryPlaceholder')}
                        aria-label={t('warehouse.searchReplenishHistory')}
                        title={t('warehouse.searchReplenishHistory')}
                        value={replenishHistorySearch}
                        onChange={(e) => setReplenishHistorySearch(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 pl-9 pr-3 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/50 outline-none transition-colors min-h-[44px]"
                    />
                </div>
            </div>

            {paginatedReplenishHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {paginatedReplenishHistory.map((job: WMSJob) => (
                            <div
                                key={job.id}
                                onClick={() => {
                                    setSelectedJob(job);
                                    setIsDetailsOpen(true);
                                }}
                                className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 hover:border-[var(--theme-accent)]/40 transition-colors shadow-sm cursor-pointer flex flex-col justify-between gap-3"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <span className="text-xs font-mono tabular-nums text-[var(--theme-accent)] font-semibold block">
                                            {formatJobId(job)}
                                        </span>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium break-words mt-0.5">
                                            {job.orderRef || t('warehouse.internal')}
                                            {job.jobNumber && <span className="text-[var(--theme-text-primary)] ml-1 font-mono">• {job.jobNumber}</span>}
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 uppercase shrink-0">
                                        {job.status}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-[var(--theme-border)] flex flex-col gap-1.5">
                                    {/* Completed By Attribution */}
                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                        <User size={13} className="text-[var(--theme-accent)] shrink-0" />
                                        <span className="font-semibold text-[var(--theme-text-primary)]">{t('warehouse.completedByColon')}</span>
                                        <span className="break-words leading-tight">{getWorkerDisplay(job)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                        <span>{formatDateTime(job.updatedAt || job.createdAt || '')}</span>
                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                            {job.items || 1} <span className="text-[11px] text-[var(--theme-text-secondary)] font-normal">{t('warehouse.unitsWord')}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <Pagination
                            currentPage={replenishHistoryPage}
                            totalPages={replenishHistoryTotalPages}
                            totalItems={filteredReplenishHistory.length}
                            itemsPerPage={REPLENISH_HISTORY_PER_PAGE}
                            onPageChange={setReplenishHistoryPage}
                            itemName={t('warehouse.historyRecordsWord') || 'history records'}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center py-12 px-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm">
                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        {t('warehouse.noMatchingHistoryFound')}
                    </p>
                </div>
            )}
        </div>
    );
};
