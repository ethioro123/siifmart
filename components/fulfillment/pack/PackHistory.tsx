import React, { useState, useMemo } from 'react';
import { Search, Calendar, Box, Package, Printer, History as HistoryIcon, Barcode, Undo2, ChevronRight, MapPin, X, User as UserIcon } from 'lucide-react';
import { Pagination } from '../../shared';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface PackHistoryProps {
    historicalJobs: WMSJob[];
    resolveOrderRef?: (ref?: string) => string;
    sites: Site[];
    onReprintLabel?: (job: WMSJob, labelSize: string) => void;
    employees?: any[];
    products?: Product[];
    user?: any;
    addNotification?: (type: string, message: string) => void;
    inventoryRequestsService?: any;
    wmsJobsService?: any;
    jobs?: WMSJob[];
    onJobSelect?: (job: WMSJob) => void;
    formatJobIdFn?: (job: WMSJob) => string;
    onReturn?: (job: WMSJob) => void;
    t: (key: string) => string;
}

const ITEMS_PER_PAGE = 12;

export const PackHistory: React.FC<PackHistoryProps> = ({
    historicalJobs = [],
    resolveOrderRef,
    sites,
    onReprintLabel,
    employees = [],
    products,
    user,
    onJobSelect,
    formatJobIdFn = formatJobId,
    onReturn,
    t
}) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'returned'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [openPrintJob, setOpenPrintJob] = useState<WMSJob | null>(null);

    const filteredHistory = useMemo(() => {
        const mapped = historicalJobs.filter((j: WMSJob) => j.type === 'PACK').map(j => {
            const rawUserId = j.completedBy || (j as any).completed_by || j.assignedTo || (j as any).assigned_to;
            const resolvedWorker = resolveFulfillmentWorker({
                userId: rawUserId,
                job: j,
                employees,
                sites,
                currentUser: user,
                siteId: j.siteId || (j as any).site_id
            });

            const rawItems = j.lineItems || (j as any).line_items || [];
            let itemsArr: any[] = [];
            if (Array.isArray(rawItems)) itemsArr = rawItems;
            else if (typeof rawItems === 'string') {
                try { itemsArr = JSON.parse(rawItems); } catch { itemsArr = []; }
            }

            const hasReturns = itemsArr.some((li: any) => (li.returnedQty || 0) > 0);
            const destSite = sites.find(s => s.id === (j.destSiteId || (j as any).dest_site_id));
            const customerName = (j as any).customerName || (j as any).customer_name;
            const destName = destSite?.name || customerName || '';

            return {
                ...j,
                resolvedUser: {
                    name: resolvedWorker.name,
                    displayId: resolvedWorker.code || resolvedWorker.displayId
                },
                parsedLineItems: itemsArr,
                hasReturns,
                destName
            };
        });

        const statusFiltered = mapped.filter(j => {
            if (statusFilter === 'completed') return j.status === 'Completed';
            if (statusFilter === 'returned') return j.hasReturns;
            return true;
        });

        if (!search) {
            return statusFiltered.sort((a, b) => {
                const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
                return dateB - dateA;
            });
        }

        const q = search.toLowerCase();
        return statusFiltered.filter(j => {
            const cleanJobId = formatJobId(j).toLowerCase();
            const orderRefStr = (j.orderRef || '').toLowerCase();
            const orderRefResolvedStr = resolveOrderRef ? resolveOrderRef(j.orderRef).toLowerCase() : '';
            const workerName = (j.resolvedUser?.name || '').toLowerCase();
            const workerId = (j.resolvedUser?.displayId || '').toLowerCase();
            const noteStr = (j.notes || '').toLowerCase();
            const statusStr = (j.status || '').toLowerCase();
            const jobNum = (j.jobNumber || (j as any).job_number || '').toLowerCase();
            const destStr = j.destName.toLowerCase();
            const trackingStr = (j.trackingNumber || '').toLowerCase();

            const matchesItems = j.parsedLineItems.some((item: any) =>
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
                destStr.includes(q) ||
                trackingStr.includes(q) ||
                matchesItems
            );
        }).sort((a, b) => {
            const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [historicalJobs, search, statusFilter, resolveOrderRef, employees, user, sites]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    const completedCount = useMemo(() =>
        historicalJobs.filter((j: WMSJob) => j.type === 'PACK' && j.status === 'Completed').length,
        [historicalJobs]
    );

    const returnedCount = useMemo(() =>
        historicalJobs.filter((j: WMSJob) => {
            if (j.type !== 'PACK') return false;
            const items = j.lineItems || (j as any).line_items || [];
            return Array.isArray(items) && items.some((li: any) => (li.returnedQty || 0) > 0);
        }).length,
        [historicalJobs]
    );

    return (
        <div className="flex flex-col h-full bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] transition-colors duration-200 overflow-hidden">
            {/* Header, Search & Filter Controls */}
            <div className="shrink-0 p-2 sm:p-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] space-y-2.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-[var(--theme-accent)]">
                            <HistoryIcon size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm sm:text-base font-bold uppercase tracking-tight leading-tight">
                                {t('warehouse.history') || 'Pack History'}
                            </h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={15} />
                        <input
                            type="text"
                            placeholder={t('warehouse.searchByIdOrOrder') || 'Search ID, order, worker, SKU...'}
                            aria-label={t('warehouse.searchByIdOrOrder')}
                            title={t('warehouse.searchByIdOrOrder')}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--theme-text-primary)] font-medium focus:outline-none placeholder:text-[var(--theme-text-secondary)] min-h-[40px] transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                    <button
                        type="button"
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all min-h-[34px] shrink-0 border ${
                            statusFilter === 'all'
                                ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]'
                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        All ({historicalJobs.filter((j: WMSJob) => j.type === 'PACK').length})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setStatusFilter('completed'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all min-h-[34px] shrink-0 border ${
                            statusFilter === 'completed'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-[var(--theme-bg-subtle)] text-emerald-600 dark:text-emerald-400 border-[var(--theme-border)] hover:border-emerald-500/30'
                        }`}
                    >
                        Completed ({completedCount})
                    </button>
                    {returnedCount > 0 && (
                        <button
                            type="button"
                            onClick={() => { setStatusFilter('returned'); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all min-h-[34px] shrink-0 border ${
                                statusFilter === 'returned'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-[var(--theme-bg-subtle)] text-red-600 dark:text-red-400 border-[var(--theme-border)] hover:border-red-500/30'
                            }`}
                        >
                            With Returns ({returnedCount})
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable History List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 sm:p-4">
                {paginatedHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pb-6">
                        {paginatedHistory.map((job) => {
                            const formattedId = formatJobIdFn(job);
                            const itemsArr = job.parsedLineItems || [];
                            const totalItems = job.items || itemsArr.length || 0;
                            const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku).filter(Boolean);
                            const isCompleted = (job.status || '').toLowerCase() === 'completed';
                            const orderRef = resolveOrderRef ? resolveOrderRef(job.orderRef) : job.orderRef;

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => onJobSelect && onJobSelect(job)}
                                    className="bg-[var(--theme-bg-card)] hover:border-[var(--theme-accent)]/50 border border-[var(--theme-border)] rounded-2xl p-3 sm:p-4 transition-all overflow-hidden cursor-pointer active:scale-[0.99] shadow-xs touch-manipulation flex flex-col justify-between gap-2.5"
                                >
                                    {/* Top Row: Icon, Job ID, Statuses, Chevron */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                                <Package size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-xs sm:text-sm font-bold font-mono text-[var(--theme-text-primary)] uppercase tracking-wide truncate block">
                                                    {formattedId}
                                                </span>
                                                {orderRef && (
                                                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono truncate block">
                                                        Ref: {orderRef}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border ${
                                                isCompleted
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                            }`}>
                                                {job.status}
                                            </span>
                                            {job.hasReturns && (
                                                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                                    Returned
                                                </span>
                                            )}
                                            <ChevronRight size={16} className="text-[var(--theme-text-secondary)] sm:hidden" />
                                        </div>
                                    </div>

                                    {/* Middle Row: Meta details */}
                                    <div className="space-y-1.5 text-xs text-[var(--theme-text-secondary)]">
                                        {job.destName && (
                                            <div className="flex items-center gap-1.5 font-medium truncate text-[var(--theme-text-primary)]">
                                                <MapPin size={12} className="text-[var(--theme-accent)] shrink-0" />
                                                <span className="truncate">To: {job.destName}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} className="text-[var(--theme-accent)]" />
                                                {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                            </span>
                                            <span className="opacity-40">•</span>
                                            <span className="flex items-center gap-1">
                                                <Box size={11} className="text-[var(--theme-accent)]" />
                                                {totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}
                                            </span>
                                        </div>

                                        {job.trackingNumber && (
                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                <Barcode size={12} className="text-[var(--theme-text-secondary)] shrink-0" />
                                                <span className="text-[10px] font-mono font-semibold text-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] break-all">
                                                    {job.trackingNumber}
                                                </span>
                                            </div>
                                        )}

                                        {productNames.length > 0 && (
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] line-clamp-1 break-words pt-0.5">
                                                {productNames.slice(0, 2).join(', ')}
                                                {productNames.length > 2 && <span className="text-[var(--theme-accent)] font-semibold"> +{productNames.length - 2} more</span>}
                                            </p>
                                        )}
                                    </div>

                                    {/* Bottom Row: Worker Info & Mobile Action Buttons */}
                                    <div className="flex items-center justify-between border-t border-[var(--theme-border)]/60 pt-2.5 mt-1 gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[10px] font-bold text-[var(--theme-accent)] shrink-0">
                                                {(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium truncate">
                                                {job.resolvedUser?.name || 'Staff'} {job.resolvedUser?.displayId && <span className="font-mono opacity-80">({job.resolvedUser.displayId})</span>}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            {isCompleted && onReturn && (
                                                <button
                                                    type="button"
                                                    onClick={() => onReturn(job)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 min-h-[36px] transition-colors active:scale-95 touch-manipulation"
                                                    title={t('warehouse.packing.returnItemsToWarehouse') || 'Return to warehouse'}
                                                >
                                                    <Undo2 size={12} />
                                                    <span className="hidden sm:inline">Return</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setOpenPrintJob(job)}
                                                className="px-2.5 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1 min-h-[36px] transition-colors active:scale-95 touch-manipulation"
                                                title={t('warehouse.packing.reprintPackLabel') || 'Reprint Shipping Label'}
                                            >
                                                <Printer size={13} className="text-[var(--theme-accent)]" />
                                                <span className="hidden sm:inline">Print</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-6 text-center space-y-2">
                        <HistoryIcon size={32} className="opacity-40 text-[var(--theme-accent)]" />
                        <p className="font-bold tracking-wider uppercase text-xs">{t('warehouse.noHistoryFound') || 'No Pack History Found'}</p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="text-xs text-[var(--theme-accent)] font-semibold uppercase tracking-wider hover:underline pt-1"
                            >
                                Clear search query
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredHistory.length > ITEMS_PER_PAGE && (
                <div className="shrink-0 p-2 sm:p-3 bg-[var(--theme-bg-card)] border-t border-[var(--theme-border)]">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        isLoading={false}
                        itemName={t('warehouse.packing.records') || 'pack jobs'}
                    />
                </div>
            )}

            {/* Mobile-Friendly Label Size Selector Modal */}
            {openPrintJob && (
                <div
                    className="fixed inset-0 z-[300] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
                    onClick={() => setOpenPrintJob(null)}
                >
                    <div
                        className="w-full sm:max-w-xs bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5 pb-[max(env(safe-area-inset-bottom),1rem)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)] block">
                                    {t('warehouse.reprintPackLabel') || 'Reprint Shipping Label'}
                                </span>
                                <span className="text-[11px] font-mono text-[var(--theme-accent)]">
                                    {formatJobIdFn(openPrintJob)}
                                </span>
                            </div>
                            <button
                                onClick={() => setOpenPrintJob(null)}
                                className="p-1.5 rounded-lg bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                            {(['XL', 'Large', 'Medium', 'Small'] as const).map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                        if (onReprintLabel) onReprintLabel(openPrintJob, size);
                                        setOpenPrintJob(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-accent)]/10 hover:text-[var(--theme-accent)] active:scale-[0.98] transition-all min-h-[44px] flex items-center justify-between border border-[var(--theme-border)]"
                                >
                                    <span>{size} {size === 'XL' ? '(4 × 6 Standard)' : ''}</span>
                                    <Printer size={14} className="text-[var(--theme-accent)]" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackHistory;
