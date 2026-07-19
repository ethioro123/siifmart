import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Box, Package, ArrowRight, History as HistoryIcon, User, Undo2, Clock } from 'lucide-react';

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
import Pagination from '../../shared/Pagination';
import { WMSJob, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';

import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';

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
                name: userObj?.name || (userId ? userId : t('warehouse.picking.systemUser')),
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
    }, [historicalJobs, search, resolveOrderRef, employees, user, t]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-[#E2DCCE]/60 dark:border-white/10 mt-8 pt-8 relative overflow-hidden group/history">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 group-hover/history:bg-[#2C5E3B]/20 transition-colors">
                        <HistoryIcon size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    </div>
                    {t('warehouse.putaway.history')}
                </h4>

                {/* History Search */}
                <div className="relative w-full sm:w-72 group">
                    <div className="relative flex items-center rounded-xl focus-within:border-zinc-500 transition-all shadow-sm">
                        <Search className="absolute left-3 text-zinc-550 dark:text-zinc-655 group-focus-within:text-zinc-950 dark:group-focus-within:text-zinc-200 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={`${t('warehouse.searchByIdOrOrder')}`}
                            aria-label={t('warehouse.searchByIdOrOrder')}
                            title={t('warehouse.searchByIdOrOrder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="woody-input w-full !pl-10 pr-4 py-3 text-xs"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                        <>
                            {paginatedHistory.map((job, index) => {
                                const formattedId = formatJobId(job);
                                // Parse items for product name preview
                                let rawItems = job.lineItems || [];
                                if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; } }
                                if (typeof rawItems === 'number') rawItems = [];
                                const itemsArr = Array.isArray(rawItems) ? rawItems : [];
                                const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku || t('warehouse.picking.unknownUser')).filter(Boolean);

                                if (isMobile) {
                                    return (
                                        <div
                                            key={job.id}
                                            onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                            className={`flex items-center gap-3 bg-[#FAF8F5]/80 dark:bg-white/5 border rounded-xl p-3 active:bg-[#FAF8F5]/90 dark:active:bg-white/10 transition-colors cursor-pointer ${(job.status || '').toLowerCase() === 'completed' ? 'border-[#E2DCCE]/60 dark:border-white/10' : 'border-red-500/30'}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-black text-zinc-900 dark:text-white tracking-wider uppercase">{formatJobId(job)}</span>
                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${(job.status || '').toLowerCase() === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                                        {job.status}
                                                    </span>
                                                    {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-500/20 text-red-600 dark:text-red-400">
                                                            {t('warehouse.picking.returning')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-550 dark:text-gray-400 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">
                                                        <User size={10} />
                                                        {job.resolvedUser?.name} {job.resolvedUser?.displayId && `(${job.resolvedUser.displayId})`}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true }).split(',')[1]?.trim() || t('warehouse.picking.justNow')}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-zinc-400 dark:text-gray-600 flex-shrink-0" />
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                        className="group relative bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 hover:bg-[#FAF8F5] dark:hover:bg-[#1C2620] border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 rounded-[2rem] p-5 transition-colors cursor-pointer overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98]"
                                    >
                                        {/* Hover Glow */}
                                        <div className="absolute inset-0 bg-zinc-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="relative flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg transition-colors bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2]">
                                                    <Package size={14} />
                                                </div>
                                                <span className="text-[10px] uppercase tracking-widest font-black text-zinc-550 dark:text-zinc-500">
                                                    {t('warehouse.pickJobs').split(' ')[0]}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${(job.status || '').toLowerCase() === 'completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-transparent dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-transparent dark:border-red-500/20'}`}>
                                                {job.status}
                                            </span>
                                            {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-transparent dark:border-red-500/20">
                                                    {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} {t('warehouse.returned')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="relative mb-4">
                                            <h5 className="text-gray-900 dark:text-white font-black text-sm truncate pr-2 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase tracking-tight leading-tight">
                                                {formattedId}
                                            </h5>
                                            <div className="flex items-center gap-1.5 mt-2 transition-colors">
                                                <Calendar size={10} className="text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50" />
                                                <span className="text-[10px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-1.5 py-0.5 rounded tracking-tighter uppercase transition-colors group-hover:bg-[#2C5E3B]/20">
                                                    {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product Names Preview */}
                                        {productNames.length > 0 && (
                                            <div className="relative mb-3 px-0.5">
                                                <p className="text-[10px] text-zinc-550 dark:text-zinc-500 truncate leading-relaxed">
                                                    {productNames.slice(0, 2).join(', ')}
                                                    {productNames.length > 2 && <span className="text-[#2C5E3B] dark:text-[#A9CBA2]"> +{productNames.length - 2} {t('warehouse.remaining')}</span>}
                                                </p>
                                            </div>
                                        )}

                                        <div className="relative flex items-center justify-between border-t border-[#E2DCCE]/60 dark:border-white/5 pt-3 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center border border-stone-200 dark:border-white/10 shadow-inner group-hover/history:scale-110 transition-transform">
                                                    <span className="text-[9px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-tight">{t('warehouse.picking.by')}</span>
                                                    <span className="text-[9px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-wider leading-tight">
                                                        {job.resolvedUser?.name} <span className="text-gray-450 dark:text-gray-600 font-normal">({job.resolvedUser?.displayId})</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-stone-50 dark:bg-white/5 px-2 py-1 rounded-lg border border-stone-200 dark:border-white/5 group-hover:border-[#2C5E3B]/20 transition-colors shadow-inner">
                                                {(job.status || '').toLowerCase() === 'completed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReturnJob(job); }}
                                                        className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/5 dark:hover:bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-500/10 hover:border-amber-400 dark:hover:border-amber-500/30 transition-colors text-amber-800 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                                                        title={t('warehouse.packing.returnItemsToWarehouse')}
                                                    >
                                                        <Undo2 size={10} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{t('warehouse.driverHub.return')}</span>
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-white/5 px-2 py-1 rounded-lg border border-[#E2DCCE]/60 dark:border-white/10 group-hover:border-[#2C5E3B]/30 transition-colors">
                                                    <Box size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                    <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] tabular-nums">{job.items} {job.items === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
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
                <div className="flex flex-col items-center justify-center py-20 bg-[#FAF8F5]/30 dark:bg-zinc-100/[0.02] rounded-3xl border border-dashed border-[#E2DCCE]/60 dark:border-white/10">
                    <div className="p-4 bg-[#FAF8F5] dark:bg-gray-900 rounded-2xl mb-4 border border-[#E2DCCE]/60 dark:border-white/5 shadow-xl">
                        <HistoryIcon size={32} className="text-zinc-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-widest">{t('warehouse.noHistoryFound')}</h3>
                    <p className="text-[#2C5E3B] dark:text-gray-500 text-xs uppercase tracking-[0.2em] font-black">{t('warehouse.picking.historyLogsEmpty')}</p>
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
