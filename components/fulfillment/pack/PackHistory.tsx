import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Box, Package, Printer, History as HistoryIcon, Barcode, Undo2 } from 'lucide-react';
import { Pagination } from '../../shared';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';


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
    addNotification,
    inventoryRequestsService,
    wmsJobsService,
    jobs = [],
    onJobSelect,
    formatJobIdFn = formatJobId,
    onReturn,
    t
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [openPrintMenuId, setOpenPrintMenuId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const filteredHistory = useMemo(() => {
        const mapped = historicalJobs.filter((j: WMSJob) => j.type === 'PACK').map(j => {
            const userId = j.completedBy || j.assignedTo;
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            let userObj = employees?.find(e => 
                e.id === userId || 
                (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
                (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
                (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
            );
            if (!userObj && user && userId && (
                userId.toLowerCase() === user.id?.toLowerCase() || 
                userId.toLowerCase() === user.email?.toLowerCase() || 
                userId.toLowerCase() === user.name?.toLowerCase() || 
                userId.toLowerCase() === user.employeeId?.toLowerCase()
            )) {
                userObj = employees?.find(e => 
                    (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
                    (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase()) || 
                    e.id === user.employeeId
                );
            }
            const displayId = (userObj?.code ? formatDisplayEmployeeId(userObj.code) : '') || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
            const resolvedUser = {
                name: userObj?.name || (userId ? userId : 'System'),
                displayId: displayId || ''
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
                (j.trackingNumber || '').toLowerCase().includes(q) ||
                matchesItems
            );
        }).sort((a, b) => {
            const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [historicalJobs, search, resolveOrderRef, employees, user]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-[var(--theme-border)] mt-8 pt-8 relative overflow-hidden group/history">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h4 className="text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] text-[var(--theme-accent)]">
                        <HistoryIcon size={20} />
                    </div>
                    {t('warehouse.history') || 'History'}
                </h4>

                {/* History Search */}
                <div className="relative w-full sm:w-80">
                    <div className="relative flex items-center bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl focus-within:border-[var(--theme-accent)] transition-colors shadow-sm min-h-[44px]">
                        <Search className="absolute left-3.5 text-[var(--theme-text-secondary)] pointer-events-none" size={16} />
                        <input
                            type="text"
                            placeholder={t('warehouse.searchByIdOrOrder') || 'Search ID, order, worker...'}
                            aria-label={t('warehouse.searchByIdOrOrder')}
                            title={t('warehouse.searchByIdOrOrder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium focus:outline-none placeholder:text-[var(--theme-text-secondary)]"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className={`grid pb-12 ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
                        {paginatedHistory.map((job) => {
                            const formattedId = formatJobIdFn(job);
                            const totalItems = job.items || job.lineItems?.length || 0;
                            let rawItems = job.lineItems || [];
                            if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; } }
                            if (typeof rawItems === 'number') rawItems = [];
                            const itemsArr = Array.isArray(rawItems) ? rawItems : [];
                            const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku || 'Unknown').filter(Boolean);

                            if (isMobile) {
                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => onJobSelect && onJobSelect(job)}
                                        className="bg-[var(--theme-bg-card)] hover:border-[var(--theme-accent)]/40 border border-[var(--theme-border)] rounded-2xl p-3.5 transition-colors overflow-hidden cursor-pointer active:scale-[0.99] shadow-sm touch-manipulation"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] flex items-center justify-center shrink-0 border border-[var(--theme-border)] text-[var(--theme-accent)]">
                                                    <Package size={18} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">{formattedId}</span>
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full uppercase font-semibold tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)] mt-0.5 font-medium truncate">
                                                        <span>{formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}</span>
                                                        <span className="w-1 h-1 rounded-full bg-[var(--theme-text-secondary)]/40" />
                                                        <span className="font-mono tabular-nums">{totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)]/10 flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                                                <span className="text-[11px] font-semibold text-[var(--theme-accent)]">{(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => onJobSelect && onJobSelect(job)}
                                    className="bg-[var(--theme-bg-card)] hover:border-[var(--theme-accent)] border border-[var(--theme-border)] rounded-2xl p-4.5 transition-all cursor-pointer overflow-hidden shadow-sm active:scale-[0.99] touch-manipulation"
                                >
                                    <div className="flex justify-between items-start mb-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">
                                                <Package size={14} />
                                            </div>
                                            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)]">
                                                {t('warehouse.tabs.pack')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full uppercase font-semibold tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                {job.status}
                                            </span>
                                            {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-full uppercase font-semibold tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                                    {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} {t('warehouse.packing.returned')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3.5">
                                        <h5 className="text-[var(--theme-text-primary)] font-semibold font-mono text-sm truncate pr-2 tracking-tight">
                                            {formattedId}
                                        </h5>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)]">
                                                <Calendar size={12} className="text-[var(--theme-accent)]" />
                                                <span className="font-mono tabular-nums">
                                                    {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                                </span>
                                            </div>
                                            {job.trackingNumber && (
                                                <div className="flex items-center gap-1.5">
                                                    <Barcode size={12} className="text-[var(--theme-text-secondary)]" />
                                                    <span className="text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                        {job.trackingNumber}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {productNames.length > 0 && (
                                        <div className="mb-3.5">
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] truncate leading-relaxed">
                                                {productNames.slice(0, 2).join(', ')}
                                                {productNames.length > 2 && <span className="text-[var(--theme-accent)]"> +{productNames.length - 2} {t('warehouse.remaining')}</span>}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-3.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-[var(--theme-bg-subtle)] flex items-center justify-center border border-[var(--theme-border)] shrink-0">
                                                <span className="text-[11px] font-semibold text-[var(--theme-accent)]">{(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider leading-tight">
                                                    {t('warehouse.completedBy') || 'Completed By'}
                                                </span>
                                                <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate leading-tight">
                                                    {job.resolvedUser?.name} <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({job.resolvedUser?.displayId})</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-xl border border-[var(--theme-border)]">
                                                <Box size={12} className="text-[var(--theme-accent)]" />
                                                <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] tabular-nums font-mono">{totalItems}</span>
                                            </div>
                                            {job.status === 'Completed' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onReturn?.(job); }}
                                                    className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400 min-h-[36px] transition-colors"
                                                    title={t('warehouse.packing.returnItemsToWarehouse')}
                                                >
                                                    <Undo2 size={12} />
                                                    <span className="text-[11px] font-semibold uppercase tracking-wider">{t('warehouse.driverHub.return')}</span>
                                                </button>
                                            )}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenPrintMenuId(openPrintMenuId === job.id ? null : job.id);
                                                    }}
                                                    className={`w-9 h-9 min-h-[36px] min-w-[36px] rounded-xl transition-colors border flex items-center justify-center ${openPrintMenuId === job.id ? 'bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] text-[var(--theme-accent)]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border-[var(--theme-border)]'}`}
                                                    title={t('warehouse.packing.reprintPackLabel')}
                                                >
                                                    <Printer size={14} />
                                                </button>
                                                {openPrintMenuId === job.id && (
                                                    <div
                                                        className="absolute bottom-[calc(100%+8px)] right-0 w-36 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-1.5 shadow-xl z-[100] flex flex-col gap-1"
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                    >
                                                        <div className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider px-2 py-1 border-b border-[var(--theme-border)]">{t('warehouse.labelSize')}</div>
                                                        {(['Small', 'Medium', 'Large', 'XL'] as const).map(size => (
                                                            <button
                                                                key={size}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onReprintLabel) onReprintLabel(job as WMSJob, size);
                                                                    setOpenPrintMenuId(null);
                                                                }}
                                                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors"
                                                            >
                                                                {size}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
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
                        isLoading={false}
                        itemName={t('warehouse.packing.records')}
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
                    <HistoryIcon size={32} className="mb-3 opacity-40 text-[var(--theme-accent)]" />
                    <p className="font-semibold tracking-wider uppercase text-xs">{t('warehouse.noHistoryFound')}</p>
                </div>
            )}
        </div>
    );
};
