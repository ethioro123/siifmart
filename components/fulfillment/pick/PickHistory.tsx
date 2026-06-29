import React, { useState, useMemo } from 'react';
import { Search, Calendar, Box, Package, ArrowRight, History as HistoryIcon, User, Undo2, Clock } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';
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

    const filteredHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'PICK' && (
                !search ||
                j.id.toLowerCase().includes(search.toLowerCase()) ||
                (j.orderRef && (j.orderRef.toLowerCase().includes(search.toLowerCase()) || resolveOrderRef(j.orderRef).toLowerCase().includes(search.toLowerCase())))
            )
        ).map(j => {
            // Resolve User - completedBy stores auth user ID, not employee record ID
            const userId = j.completedBy || j.assignedTo;
            const userObj = employees?.find(e => e.id === userId || e.name === userId);
            // Also check against the currently logged-in user (auth ID match)
            const isCurrentUser = user && userId === user.id;
            const resolvedName = userObj?.name || (isCurrentUser ? user.name : null);
            const displayId = userObj?.code || (isCurrentUser ? (user.name?.slice(0, 3).toUpperCase() || '') : (userId && userId.length > 20 ? userId.slice(0, 5).toUpperCase() : userId));
            const resolvedUser = {
                name: resolvedName || (userId ? t('warehouse.picking.unknownUser') : t('warehouse.picking.systemUser')),
                displayId: displayId || ''
            };

            return {
                ...j,
                resolvedUser
            };
        }).sort((a, b) => {
            const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [historicalJobs, search, resolveOrderRef, employees]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-[#E2DCCE]/60 dark:border-white/10 mt-8 pt-8 relative overflow-hidden group/history">
            {/* 🌈 Futuristic Mesh Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />
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
                            className="woody-input w-full pl-10 pr-4 py-3 text-xs"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                        <AnimatePresence>
                            {paginatedHistory.map((job, index) => {
                                const formattedId = formatJobId(job);
                                // Parse items for product name preview
                                let rawItems = job.lineItems || [];
                                if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; } }
                                if (typeof rawItems === 'number') rawItems = [];
                                const itemsArr = Array.isArray(rawItems) ? rawItems : [];
                                const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku || t('warehouse.picking.unknownUser')).filter(Boolean);

                                return (
                                    <React.Fragment key={job.id}>
                                        {/* ── MOBILE: Compact tappable row ── */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                            className={`md:hidden flex items-center gap-3 bg-[#FAF8F5]/80 dark:bg-white/5 border rounded-xl p-3 active:bg-[#FAF8F5]/90 dark:active:bg-white/10 transition-all cursor-pointer ${(job.status || '').toLowerCase() === 'completed' ? 'border-[#E2DCCE]/60 dark:border-white/10' : 'border-red-500/30'}`}
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
                                                        {((job as any).user || t('warehouse.picking.systemUser')).split(' ')[0]}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true }).split(',')[1]?.trim() || t('warehouse.picking.justNow')}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-zinc-400 dark:text-gray-600 flex-shrink-0" />
                                        </motion.div>

                                        {/* ── DESKTOP: Full card ── */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                            className="hidden md:block group relative bg-[#FAF8F5]/30 dark:bg-black/60 hover:bg-stone-50 dark:hover:bg-black border-2 border-[#E2DCCE]/60 dark:border-white/5 hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm"
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
                                            <h5 className="text-zinc-900 dark:text-zinc-200 font-black text-sm truncate pr-2 group-hover:text-black dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tight">
                                                {formattedId}
                                            </h5>
                                            <div className="flex items-center gap-1.5 mt-2 transition-colors">
                                                <Calendar size={10} className="text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50" />
                                                <span className="text-[10px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-1.5 py-0.5 rounded tracking-tighter uppercase transition-all group-hover:bg-[#2C5E3B]/20">
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
                                                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center border border-[#E2DCCE]/60 dark:border-white/10 shadow-inner group-hover/history:scale-110 transition-transform">
                                                    <span className="text-[9px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{(job.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-655 uppercase tracking-widest leading-tight">{t('warehouse.picking.by')}</span>
                                                    <span className="text-[9px] font-black text-zinc-905 dark:text-zinc-400 uppercase tracking-wider leading-tight">
                                                        {job.resolvedUser?.name} <span className="text-zinc-550 dark:text-zinc-655 font-normal lowercase">({job.resolvedUser?.displayId})</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(job.status || '').toLowerCase() === 'completed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReturnJob(job); }}
                                                        className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/5 dark:hover:bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-500/10 hover:border-amber-400 dark:hover:border-amber-500/30 transition-all text-amber-800 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                                                        title={t('warehouse.packing.returnItemsToWarehouse')}
                                                    >
                                                        <Undo2 size={10} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{t('warehouse.driverHub.return')}</span>
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-white/5 px-2 py-1 rounded-lg border border-[#E2DCCE]/60 dark:border-white/10 group-hover:border-[#2C5E3B]/30 transition-all">
                                                    <Box size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                    <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] tabular-nums">{job.items} {job.items === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        </motion.div>
                                    </React.Fragment>
                                );
                            })}
                        </AnimatePresence>
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
