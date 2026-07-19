import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Box, Package, Printer, History as HistoryIcon, Barcode, Undo2 } from 'lucide-react';
import { Pagination } from '../../shared';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';


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
            const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
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
        <div className="border-t border-[#E2DCCE] dark:border-[#A9CBA2]/10 mt-8 pt-8 relative overflow-hidden group/history">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#A9CBA2]/10 to-transparent" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <h4 className="text-xl font-black text-gray-700 dark:text-[#EAE5D9] flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-2 bg-[#E2DCCE] dark:bg-[#2C5E3B]/10 rounded-xl border border-[#E2DCCE] dark:border-[#2C5E3B]/20 group-hover/history:bg-[#E2DCCE] dark:group-hover/history:bg-[#2C5E3B]/20 transition-colors">
                        <HistoryIcon size={20} className="text-gray-500 dark:text-[#A9CBA2]" />
                    </div>
                    {t('warehouse.history') || 'History'}
                </h4>

                {/* History Search */}
                <div className="relative w-full sm:w-72 group">
                    <div className="absolute -inset-0.5 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-xl blur opacity-0 group-hover:opacity-5 transition duration-500"></div>
                    <div className="relative flex items-center bg-[#FAF8F5] dark:bg-[#1C2620]/40 border border-[#E2DCCE] dark:border-[#A9CBA2]/10 rounded-xl focus-within:border-[#2C5E3B] transition-all shadow-sm">
                        <Search className="absolute left-3 text-gray-400 dark:text-[#A9CBA2]/40 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={`${t('warehouse.searchByIdOrOrder')}`}
                            aria-label={t('warehouse.searchByIdOrOrder')}
                            title={t('warehouse.searchByIdOrOrder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-3 text-xs text-gray-700 dark:text-[#EAE5D9] font-black uppercase tracking-widest focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#A9CBA2]/30"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className={`grid pb-12 ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
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
                                        className="group relative bg-gray-50 dark:bg-black/60 hover:bg-white dark:hover:bg-black border border-gray-100 dark:border-white/10 rounded-xl p-3 transition-colors overflow-hidden cursor-pointer active:bg-gray-100 dark:active:bg-white/5 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#E2DCCE] dark:bg-[#2C5E3B]/10 flex items-center justify-center shrink-0 border border-[#E2DCCE] dark:border-[#2C5E3B]/20">
                                                    <Package size={14} className="text-gray-500 dark:text-[#A9CBA2]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-gray-700 dark:text-gray-200">{formattedId}</span>
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">
                                                        <span>{formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                                                        <span>{totalItems} {t('warehouse.itemPlural')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-[#2C5E3B]/20 flex items-center justify-center border border-[#2C5E3B]/30 shrink-0">
                                                <span className="text-[8px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => onJobSelect && onJobSelect(job)}
                                    className="group relative bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 hover:bg-[#FAF8F5] dark:hover:bg-[#1C2620] border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 rounded-[2rem] p-5 transition-colors cursor-pointer overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                                                <Package size={14} />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-500">
                                                {t('warehouse.tabs.pack')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                                {job.status}
                                            </span>
                                            {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                                                    {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} {t('warehouse.packing.returned')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative mb-4">
                                        <h5 className="text-gray-900 dark:text-white font-black text-sm truncate pr-2 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase tracking-tight leading-tight">
                                            {formattedId}
                                        </h5>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={10} className="text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50" />
                                                <span className="text-[10px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-1.5 py-0.5 rounded tracking-tighter uppercase group-hover:bg-[#2C5E3B]/20 transition-all">
                                                    {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                                </span>
                                            </div>
                                            {job.trackingNumber && (
                                                <div className="flex items-center gap-1.5">
                                                    <Barcode size={10} className="text-[#2C5E3B]/40 dark:text-[#A9CBA2]/40" />
                                                    <span className="text-[10px] font-mono font-black text-gray-500 dark:text-gray-400 bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 rounded tracking-widest uppercase border border-stone-200 dark:border-white/5 shadow-sm">
                                                        {job.trackingNumber}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {productNames.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
                                                {productNames.slice(0, 2).join(', ')}
                                                {productNames.length > 2 && <span className="text-[#2C5E3B] dark:text-[#A9CBA2]"> +{productNames.length - 2} {t('warehouse.remaining')}</span>}
                                            </p>
                                        </div>
                                    )}

                                    <div className="relative flex items-center justify-between border-t border-[#E2DCCE]/60 dark:border-white/5 pt-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center border border-stone-200 dark:border-white/10 shadow-inner">
                                                <span className="text-[9px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-tight">{t('warehouse.packing.by')}</span>
                                                <span className="text-[9px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-wider leading-tight">
                                                    {job.resolvedUser?.name} <span className="text-gray-400 dark:text-gray-600 font-normal">({job.resolvedUser?.displayId})</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-stone-50 dark:bg-white/5 px-2 py-1 rounded-lg border border-stone-200 dark:border-white/5 group-hover:border-[#2C5E3B]/20 transition-all">
                                                <Box size={11} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                <span className="text-[10px] font-black text-gray-900 dark:text-[#EAE5D9] tabular-nums font-mono">{totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                            </div>
                                            {job.status === 'Completed' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onReturn?.(job); }}
                                                    className="flex items-center gap-1 bg-amber-500/5 hover:bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-all text-amber-400"
                                                    title={t('warehouse.packing.returnItemsToWarehouse')}
                                                >
                                                    <Undo2 size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{t('warehouse.driverHub.return')}</span>
                                                </button>
                                            )}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenPrintMenuId(openPrintMenuId === job.id ? null : job.id);
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-colors border flex items-center justify-center ${openPrintMenuId === job.id ? 'bg-[#2C5E3B]/20 border-[#2C5E3B]/50 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border-transparent hover:border-[#2C5E3B]/30'}`}
                                                    title={t('warehouse.packing.reprintPackLabel')}
                                                >
                                                    <Printer size={12} />
                                                </button>
                                                {openPrintMenuId === job.id && (
                                                    <div
                                                        className="absolute bottom-[calc(100%+8px)] right-0 w-32 bg-white dark:bg-[#1C2620] border border-gray-200 dark:border-[#2C5E3B]/30 rounded-xl p-2 shadow-xl z-[100] flex flex-col gap-1"
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                    >
                                                        <div className="text-[9px] font-black text-gray-400 dark:text-[#A9CBA2]/50 uppercase tracking-widest px-2 pb-1 border-b border-gray-100 dark:border-white/5 mb-1">{t('warehouse.labelSize')}</div>
                                                        {(['Small', 'Medium', 'Large', 'XL'] as const).map(size => (
                                                            <button
                                                                key={size}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onReprintLabel) onReprintLabel(job as WMSJob, size);
                                                                    setOpenPrintMenuId(null);
                                                                }}
                                                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-[#2C5E3B]/20 transition-colors"
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
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-[#A9CBA2]/40 glass-panel-pushed rounded-2xl border border-dashed">
                    <HistoryIcon size={32} className="mb-4 opacity-50 dark:text-[#A9CBA2]" />
                    <p className="font-bold tracking-widest uppercase text-sm">{t('warehouse.noHistoryFound')}</p>
                </div>
            )}
        </div>
    );
};
