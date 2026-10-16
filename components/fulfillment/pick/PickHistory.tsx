import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Box, Package, ArrowRight, History as HistoryIcon, User, Undo2, Clock } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';
import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';

/** Returns true when viewport < 768 px (md breakpoint). SSR-safe. */
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

interface PickHistoryProps {
    historicalJobs: WMSJob[];
    resolveOrderRef: (ref?: string) => string;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    employees: any[];
    products: Product[];
    user: any;
    addNotification: (type: string, message: string) => void;
    inventoryRequestsService: any;
    wmsJobsService?: any;
    jobs?: WMSJob[];
    t: (key: string) => string;
}

const ITEMS_PER_PAGE = 12;

export const PickHistory: React.FC<PickHistoryProps> = ({
    historicalJobs,
    resolveOrderRef,
    setSelectedJob,
    setIsDetailsOpen,
    employees,
    products,
    user,
    addNotification,
    inventoryRequestsService,
    wmsJobsService,
    jobs = [],
    t
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);
    const isMobile = useIsMobile();

    const filteredHistory = useMemo(() => {
        const mapped = historicalJobs.filter((j: WMSJob) => j.type === 'PICK').map(j => {
            const rawUserId = j.completedBy || (j as any).completed_by || j.assignedTo || (j as any).assigned_to;
            const worker = resolveFulfillmentWorker({
                userId: rawUserId,
                job: j,
                employees,
                currentUser: user,
                siteId: j.siteId || (j as any).site_id
            });
            const resolvedUser = {
                name: worker.name,
                displayId: worker.code,
                display: worker.display,
                initials: worker.initials
            };

            return {
                ...j,
                resolvedUser
            };
        });

        if (!search) {
            return mapped.sort((a, b) => {
                const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
                return dateB - dateA;
            });
        }

        const q = search.toLowerCase();
        return mapped.filter(j => {
            const cleanJobId = formatJobId(j).toLowerCase();
            const orderRefStr = (j.orderRef || '').toLowerCase();
            const orderRefResolvedStr = resolveOrderRef ? resolveOrderRef(j.orderRef).toLowerCase() : '';
            const workerName = (j.resolvedUser?.name || '').toLowerCase();
            const workerId = (j.resolvedUser?.displayId || '').toLowerCase();
            const noteStr = (j.notes || '').toLowerCase();
            const statusStr = (j.status || '').toLowerCase();
            const jobNum = (j.jobNumber || (j as any).job_number || '').toLowerCase();

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
                orderRefResolvedStr.includes(q) ||
                workerName.includes(q) ||
                workerId.includes(q) ||
                noteStr.includes(q) ||
                statusStr.includes(q) ||
                jobNum.includes(q) ||
                matchesItems
            );
        }).sort((a, b) => {
            const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [historicalJobs, search, resolveOrderRef, employees, user, t]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-[var(--theme-border)] mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h4 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5 uppercase tracking-wide">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                        <HistoryIcon size={16} />
                    </div>
                    {t('warehouse.pickHistory')}
                </h4>

                {/* History Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={16} />
                    <input
                        type="text"
                        placeholder={`${t('warehouse.searchByIdOrOrder')}`}
                        aria-label={t('warehouse.searchByIdOrOrder')}
                        title={t('warehouse.searchByIdOrOrder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] text-xs font-medium focus:outline-none focus:border-[var(--theme-accent)] transition-colors min-h-[44px]"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                        {paginatedHistory.map((job) => {
                            const formattedId = formatJobId(job);
                            let rawItems = job.lineItems || [];
                            if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; } }
                            if (typeof rawItems === 'number') rawItems = [];
                            const itemsArr = Array.isArray(rawItems) ? rawItems : [];
                            const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku || t('warehouse.picking.unknownUser')).filter(Boolean);
                            const isCompleted = (job.status || '').toLowerCase() === 'completed';

                            if (isMobile) {
                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                        className="flex items-center gap-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 transition-colors cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-[var(--theme-text-primary)] font-mono tracking-wide uppercase">{formattedId}</span>
                                                <span className={`text-[11px] px-2 py-0.5 rounded-md uppercase font-semibold ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                    {job.status}
                                                </span>
                                                {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-md uppercase font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                                                        {t('warehouse.picking.returning')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider font-mono">
                                                <span className="flex items-center gap-1">
                                                    <User size={11} />
                                                    {job.resolvedUser?.name} {job.resolvedUser?.displayId && `(${job.resolvedUser.displayId})`}
                                                </span>
                                                <span className="opacity-40">/</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true }).split(',')[1]?.trim() || t('warehouse.picking.justNow')}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-[var(--theme-text-secondary)] shrink-0" />
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                    className="bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 transition-colors cursor-pointer flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                                    <Package size={14} />
                                                </div>
                                                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)]">
                                                    {t('warehouse.pickJobs').split(' ')[0]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-md uppercase font-semibold ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                    {job.status}
                                                </span>
                                                {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-md uppercase font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                                                        {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} {t('warehouse.returned')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <h5 className="text-[var(--theme-text-primary)] font-semibold text-sm break-words font-mono uppercase tracking-tight">
                                                {formattedId}
                                            </h5>
                                            <div className="flex items-center gap-1.5 mt-1.5 font-mono">
                                                <Calendar size={12} className="text-[var(--theme-accent)]" />
                                                <span className="text-[11px] font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md border border-[var(--theme-accent)]/20 uppercase">
                                                    {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product Names Preview */}
                                        {productNames.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-[11px] text-[var(--theme-text-secondary)] line-clamp-2 break-words">
                                                    {productNames.slice(0, 2).join(', ')}
                                                    {productNames.length > 2 && <span className="text-[var(--theme-accent)] font-semibold"> +{productNames.length - 2} {t('warehouse.remaining')}</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-3 mt-auto">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <div className="w-7 h-7 rounded-lg bg-[var(--theme-bg-subtle)] flex items-center justify-center border border-[var(--theme-border)] shrink-0">
                                                <span className="text-[11px] font-bold text-[var(--theme-text-primary)] font-mono">
                                                    {(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider leading-none mb-0.5">
                                                    {isCompleted ? (t('warehouse.completedBy') || 'Completed By') : t('warehouse.picking.by')}
                                                </span>
                                                <span className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-tight leading-tight break-words">
                                                    {job.resolvedUser?.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({job.resolvedUser?.displayId})</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isCompleted && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setReturnJob(job); }}
                                                    className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors min-h-[32px]"
                                                    title={t('warehouse.packing.returnItemsToWarehouse')}
                                                >
                                                    <Undo2 size={11} />
                                                    <span>{t('warehouse.driverHub.return')}</span>
                                                </button>
                                            )}
                                            <div className="flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-lg border border-[var(--theme-border)]">
                                                <Box size={12} className="text-[var(--theme-accent)]" />
                                                <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                                                    {job.items} {job.items === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="records"
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3 text-[var(--theme-text-secondary)]">
                        <HistoryIcon size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider mb-1">{t('warehouse.noHistoryFound')}</h3>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-medium">{t('warehouse.picking.historyLogsEmpty')}</p>
                </div>
            )}

            {/* Return to Warehouse Modal */}
            {returnJob && (
                <ReturnToWarehouseModal
                    job={returnJob}
                    products={products}
                    user={user}
                    onClose={() => setReturnJob(null)}
                    addNotification={addNotification}
                    inventoryRequestsService={inventoryRequestsService}
                    wmsJobsService={wmsJobsService}
                    jobs={jobs}
                />
            )}
        </div>
    );
};
