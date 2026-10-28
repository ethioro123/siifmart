import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Package, Box, Calendar, ChevronRight, User } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, TransferRecord } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface TransferHistoryProps {
    transfers: TransferRecord[];
    jobs: WMSJob[];
    sites: Site[];
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    t: (key: string) => string;
    employees?: any[];
}

const HISTORY_ITEMS_PER_PAGE = 12;

export const TransferHistory: React.FC<TransferHistoryProps> = ({
    transfers,
    jobs,
    sites,
    setSelectedJob,
    setIsDetailsOpen,
    t,
    employees
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const getWorkerDisplay = (job: any) => {
        const rawUserId = job.completedBy || (job as any).completed_by || job.receiverName || (job as any).receiver_name || job.assignedTo || (job as any).assigned_to;
        const resolved = resolveFulfillmentWorker({
            userId: rawUserId,
            job,
            employees: employees || [],
            sites,
            siteId: job.siteId || (job as any).site_id || job.sourceSiteId || (job as any).source_site_id
        });
        return resolved.code ? `${resolved.name} (${resolved.code})` : resolved.name;
    };

    const filteredHistory = useMemo(() => {
        // 1. Get completed transfers from wms_jobs (parent job)
        const completedJobs = jobs.filter(t => {
            if (t.type !== 'TRANSFER') return false;

            const childDispatch = jobs.find(d =>
                d.type === 'DISPATCH' &&
                (d.orderRef === t.id || d.orderRef === t.jobNumber) &&
                d.status !== 'Cancelled'
            );
            const effStatus = childDispatch?.transferStatus || t.transferStatus || 'Requested';

            return t.status === 'Completed' ||
                t.status === 'Cancelled' ||
                (t.status as any) === 'Received' ||
                t.transferStatus === 'Received' ||
                t.transferStatus === 'Delivered' ||
                effStatus === 'Received' ||
                effStatus === 'Delivered';
        });

        // 2. Get completed transfers from transfers table
        const completedTransfersTable = (transfers || []).filter((t: any) =>
            t.status === 'Completed' ||
            t.status === 'Cancelled' ||
            t.transferStatus === 'Received'
        );

        // 3. Merge them, avoiding duplicates
        const mergedTransfers = [...completedJobs];
        completedTransfersTable.forEach(ct => {
            const hasDuplicate = mergedTransfers.some(mj =>
                mj.id === ct.id ||
                (mj.jobNumber && ct.jobNumber && mj.jobNumber === ct.jobNumber) ||
                (mj.orderRef && ct.id && mj.orderRef === ct.id)
            );
            if (!hasDuplicate) {
                mergedTransfers.push(ct as any);
            }
        });

        return mergedTransfers.filter((t: any) => {
            const destSite = sites.find(s => s.id === t.destSiteId);
            const sourceSite = sites.find(s => s.id === t.sourceSiteId);
            if (!search) return true;

            const q = search.toLowerCase();
            const cleanJobId = formatJobId(t).toLowerCase();
            const destSiteName = (destSite?.name || '').toLowerCase();
            const sourceSiteName = (sourceSite?.name || '').toLowerCase();
            const jobNum = (t.jobNumber || t.job_number || '').toLowerCase();
            const noteStr = (t.notes || '').toLowerCase();
            const statusStr = (t.status || '').toLowerCase();
            const transferStatusStr = (t.transferStatus || '').toLowerCase();
            const worker = getWorkerDisplay(t).toLowerCase();

            // Search product names and SKUs
            let itemsArr = t.lineItems || t.line_items || [];
            if (typeof itemsArr === 'string') { try { itemsArr = JSON.parse(itemsArr); } catch { itemsArr = []; } }
            const productsList = Array.isArray(itemsArr) ? itemsArr : [];
            const matchesItems = productsList.some((item: any) =>
                (item.name || '').toLowerCase().includes(q) ||
                (item.productName || '').toLowerCase().includes(q) ||
                (item.sku || '').toLowerCase().includes(q)
            );

            return (
                cleanJobId.includes(q) ||
                t.id.toLowerCase().includes(q) ||
                destSiteName.includes(q) ||
                sourceSiteName.includes(q) ||
                jobNum.includes(q) ||
                noteStr.includes(q) ||
                statusStr.includes(q) ||
                transferStatusStr.includes(q) ||
                worker.includes(q) ||
                matchesItems
            );
        });
    }, [transfers, jobs, search, sites, employees]);

    const sortedHistory = useMemo(() => {
        return [...filteredHistory].sort((a: any, b: any) =>
            new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
        );
    }, [filteredHistory]);

    const totalPages = Math.ceil(sortedHistory.length / HISTORY_ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * HISTORY_ITEMS_PER_PAGE;
        return sortedHistory.slice(start, start + HISTORY_ITEMS_PER_PAGE);
    }, [sortedHistory, currentPage]);

    return (
        <div className="pt-2 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5 uppercase tracking-tight">
                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)]">
                            <HistoryIcon size={18} />
                        </div>
                        <span>{t('warehouse.transferHistory')}</span>
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-0.5">{t('warehouse.completedAndFinalizedShipments')}</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                    <input
                        type="text"
                        placeholder={`${t('warehouse.searchHistoryPlaceholder')}`}
                        aria-label={t('warehouse.searchHistoryPlaceholder')}
                        title={t('warehouse.searchHistoryPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/50 outline-none transition-colors min-h-[44px]"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {paginatedHistory.map((transfer: any) => {
                            const formattedId = formatJobId(transfer);
                            const totalItems = Array.isArray(transfer.items) ? transfer.items.length : (transfer.lineItems?.length || 0);

                            let itemsArr = transfer.lineItems || [];
                            if (typeof itemsArr === 'string') { try { itemsArr = JSON.parse(itemsArr); } catch { itemsArr = []; } }
                            const products = Array.isArray(itemsArr) ? itemsArr : [];
                            const productNames = products.map((p: any) => p.name || p.productName || p.sku).filter(Boolean);

                            const isCancelled = transfer.status === 'Cancelled';
                            const isReceived = transfer.status === 'Completed' || transfer.transferStatus === 'Received';

                            return (
                                <div
                                    key={transfer.id}
                                    onClick={() => {
                                        setSelectedJob(transfer);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-2xl p-4 transition-colors cursor-pointer shadow-sm flex flex-col justify-between gap-3"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Package size={14} className="text-[var(--theme-accent)] shrink-0" />
                                                <span className="text-[11px] uppercase font-semibold text-[var(--theme-text-secondary)]">
                                                    {t('warehouse.interSiteTransfers').split(' ')[0]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {(transfer.isInterRegion || (transfer.sourceRegionCode && transfer.destRegionCode && transfer.sourceRegionCode !== transfer.destRegionCode)) && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                                                        {t('warehouse.interRegionBadge')}
                                                    </span>
                                                )}
                                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase font-semibold border ${
                                                    isCancelled
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : isReceived
                                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-accent)] border-[var(--theme-border)]'
                                                }`}>
                                                    {transfer.transferStatus === 'Received' ? t('warehouse.received') : isCancelled ? t('warehouse.cancelled') : (transfer.transferStatus || transfer.status)}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="text-[var(--theme-text-primary)] font-semibold text-sm break-words uppercase tracking-tight">
                                                {formattedId}
                                            </h5>
                                            <div className="flex flex-col gap-1 mt-1.5">
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <span className="text-[var(--theme-text-secondary)] font-medium">REF:</span>
                                                    <span className="font-mono tabular-nums text-[var(--theme-text-primary)] font-medium">
                                                        {formattedId}
                                                        {transfer.jobNumber && transfer.jobNumber !== formattedId && (
                                                            <span className="text-[var(--theme-text-secondary)]"> • {transfer.jobNumber}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                                    <Calendar size={12} className="shrink-0" />
                                                    <span>{formatDateTime((transfer as any).date || (transfer as any).createdAt)}</span>
                                                </div>
                                                {/* Completed By Attribution */}
                                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                                    <User size={12} className="text-[var(--theme-accent)] shrink-0" />
                                                    <span className="font-semibold text-[var(--theme-text-primary)]">{t('warehouse.completedByLabel')}:</span>
                                                    <span className="break-words leading-tight">{getWorkerDisplay(transfer)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {productNames.length > 0 && (
                                            <div className="mt-2 text-[11px] text-[var(--theme-text-secondary)] line-clamp-2 break-words">
                                                <span>{productNames.slice(0, 2).join(', ')}</span>
                                                {productNames.length > 2 && (
                                                    <span className="text-[var(--theme-accent)] font-medium ml-1">
                                                        +{productNames.length - 2} {t('warehouse.remaining')}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-2.5 mt-auto">
                                        <div className="flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-lg border border-[var(--theme-border)] text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                            <Box size={12} />
                                            <span>{totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-subtle)] flex items-center justify-center border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="pt-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredHistory.length}
                            itemsPerPage={HISTORY_ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                            itemName="history records"
                        />
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm">
                    <HistoryIcon size={32} className="text-[var(--theme-text-secondary)]/40 mb-3" />
                    <p className="text-[var(--theme-text-secondary)] font-medium text-xs uppercase tracking-wider">{t('warehouse.noHistoryFound')}</p>
                </div>
            )}
        </div>
    );
};

export default TransferHistory;
