import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Clock, User as UserIcon } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, User } from '../../../types';
import { isShipment } from '../../../utils/shipmentWorkflow';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface DocksOutboundHistoryProps {
    jobs: WMSJob[];
    sites: Site[];
    employees: User[];
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    formatJobId: (job: WMSJob) => string;
}

const HISTORY_PER_PAGE = 12;

export const DocksOutboundHistory: React.FC<DocksOutboundHistoryProps> = ({
    jobs,
    sites,
    employees,
    setSelectedJob,
    setIsDetailsOpen,
    formatJobId
}) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter for Completed/Shipped Dispatch Jobs
    const filteredHistory = useMemo(() => {
        const historyJobs = jobs.filter(job => {
            if (!isShipment(job)) return false;
            // Consider "History" as Shipped, Completed, or Cancelled
            return job.status === 'Completed' || job.status === 'Cancelled' || job.transferStatus === 'Received';
        });

        const mapped = historyJobs.map(job => {
            const rawUserId = job.completedBy || (job as any).completed_by || job.assignedTo || (job as any).assigned_to;
            const resolvedWorker = resolveFulfillmentWorker({
                userId: rawUserId,
                job,
                employees: employees as any[],
                sites,
                siteId: job.siteId || (job as any).site_id
            });

            return {
                ...job,
                resolvedUser: {
                    name: resolvedWorker.name,
                    displayId: resolvedWorker.code || resolvedWorker.displayId
                }
            };
        });

        if (!search) {
            return mapped.sort((a, b) => new Date(b.updatedAt || b.createdAt || new Date()).getTime() - new Date(a.updatedAt || a.createdAt || new Date()).getTime());
        }

        const q = search.toLowerCase();
        return mapped.filter(job => {
            const destSite = sites.find(s => s.id === job.destSiteId)?.name || '';
            const cleanJobId = formatJobId(job).toLowerCase();
            const orderRefStr = (job.orderRef || '').toLowerCase();
            const workerName = (job.resolvedUser?.name || '').toLowerCase();
            const workerId = (job.resolvedUser?.displayId || '').toLowerCase();
            const noteStr = (job.notes || '').toLowerCase();
            const statusStr = (job.status || '').toLowerCase();
            const jobNum = (job.jobNumber || (job as any).job_number || '').toLowerCase();

            // Search product names and SKUs
            const items = job.lineItems || (job as any).line_items || [];
            const matchesItems = items.some((item: any) =>
                (item.name || '').toLowerCase().includes(q) ||
                (item.productName || '').toLowerCase().includes(q) ||
                (item.sku || '').toLowerCase().includes(q)
            );

            return (
                cleanJobId.includes(q) ||
                job.id.toLowerCase().includes(q) ||
                destSite.toLowerCase().includes(q) ||
                orderRefStr.includes(q) ||
                workerName.includes(q) ||
                workerId.includes(q) ||
                noteStr.includes(q) ||
                statusStr.includes(q) ||
                jobNum.includes(q) ||
                matchesItems
            );
        }).sort((a, b) => new Date(b.updatedAt || b.createdAt || new Date()).getTime() - new Date(a.updatedAt || a.createdAt || new Date()).getTime());
    }, [jobs, sites, search, employees, formatJobId]);

    const totalPages = Math.ceil(filteredHistory.length / HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                        <HistoryIcon className="text-primary" size={18} />
                    </div>
                    {t('warehouse.docks.outboundSchedule')}
                </h3>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search Shipment, Site..."
                        aria-label="Search Shipment or Site"
                        title="Search Shipment or Site"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-3.5 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)]">
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Shipped At</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Job ID</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Destination</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Driver</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Dispatcher</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Items</th>
                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {paginatedHistory.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-[var(--theme-text-muted)] text-xs font-semibold">
                                    {t('warehouse.noHistoryFound')}
                                </td>
                            </tr>
                        ) : (
                            paginatedHistory.map((job) => {
                                const destSite = sites.find(s => s.id === job.destSiteId);
                                const resolvedCarrier = resolveFulfillmentWorker({
                                    userId: job.assignedTo,
                                    job,
                                    employees: employees as any[],
                                    sites,
                                    siteId: job.siteId || (job as any).site_id
                                });
                                const resolvedDispatcher = resolveFulfillmentWorker({
                                    userId: job.assignedBy,
                                    job,
                                    employees: employees as any[],
                                    sites,
                                    siteId: job.siteId || (job as any).site_id
                                });

                                return (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-[var(--theme-bg-subtle)] transition-colors group cursor-pointer touch-manipulation"
                                        onClick={() => {
                                            setSelectedJob(job);
                                            setIsDetailsOpen(true);
                                        }}
                                    >
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-[var(--theme-text-muted)]">
                                                <Clock size={12} />
                                                <span className="text-[11px] font-mono tabular-nums">
                                                    {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-mono font-semibold text-[var(--theme-text-primary)]">{formatJobId(job)}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{destSite ? `${destSite.name} (${destSite.code || destSite.id})` : 'Unknown'}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                                {job.deliveryMethod === 'External' ? (job.externalCarrierName || 'Unlabeled External') : `${resolvedCarrier.name} (${resolvedCarrier.code || resolvedCarrier.displayId})`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-semibold text-primary uppercase tracking-tight">
                                                {resolvedDispatcher.name} {resolvedDispatcher.code ? `(${resolvedDispatcher.code})` : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-mono tabular-nums text-[var(--theme-text-muted)]">{job.items || job.lineItems?.length || 0} items</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                                                job.status === 'Completed' || job.transferStatus === 'Shipped' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                job.status === 'Cancelled' ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]' :
                                                'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]'
                                            }`}>
                                                {job.transferStatus || job.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={HISTORY_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="history"
                    />
                </div>
            )}
        </div>
    );
};
