import React, { useState, useMemo } from 'react';
import { Archive, Search, Calendar, Box, Package, ArrowRight, History as HistoryIcon, User, Undo2, Clock } from 'lucide-react';
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
    jobs = []
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
            const userName = resolvedName
                ? `${resolvedName} (${displayId})`
                : (userId ? `Unknown (${displayId})` : 'System');

            return {
                ...j,
                user: userName
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
        <div className="border-t border-zinc-300 dark:border-white/10 mt-8 pt-8 relative overflow-hidden group/history">
            {/* 🌈 Futuristic Mesh Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-2 bg-zinc-100 dark:bg-purple-500/10 rounded-xl border border-zinc-300 dark:border-purple-500/20 group-hover/history:bg-purple-500/20 transition-colors">
                        <HistoryIcon size={20} className="text-zinc-950 dark:text-purple-400" />
                    </div>
                    Pick History
                </h4>

                {/* History Search */}
                <div className="relative w-full sm:w-72 group">
                    <div className="absolute -inset-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition duration-500"></div>
                    <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-xl focus-within:border-zinc-950 dark:focus-within:border-zinc-500 transition-all shadow-sm">
                        <Search className="absolute left-3 text-zinc-500 dark:text-zinc-600 group-focus-within:text-zinc-950 dark:group-focus-within:text-zinc-200 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID or Order..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-3 text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-widest focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
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
                                const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku || 'Unknown').filter(Boolean);

                                return (
                                    <React.Fragment key={job.id}>
                                        {/* ── MOBILE: Compact tappable row ── */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                            className={`md:hidden flex items-center gap-3 bg-white/5 border rounded-xl p-3 active:bg-white/10 transition-all cursor-pointer ${job.status === 'Completed' ? 'border-zinc-200 dark:border-white/10' : 'border-red-500/30'}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-black text-zinc-900 dark:text-white tracking-wider uppercase">{formatJobId(job)}</span>
                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${job.status === 'Completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                                        {job.status}
                                                    </span>
                                                    {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-500/20 text-red-600 dark:text-red-400">
                                                            Returning
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">
                                                        <User size={10} />
                                                        {((job as any).user || 'System').split(' ')[0]}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true }).split(',')[1]?.trim() || 'Just now'}
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
                                            className="hidden md:block group relative bg-white dark:bg-black/60 hover:bg-zinc-50 dark:hover:bg-black border-2 border-zinc-200 dark:border-white/5 hover:border-purple-500/50 dark:hover:border-purple-400/50 rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-purple-500/10"
                                        >
                                        {/* Hover Glow */}
                                        <div className="absolute inset-0 bg-zinc-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="relative flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg transition-colors bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                                                    <Package size={14} />
                                                </div>
                                                <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-500">
                                                    Order Pick
                                                </span>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${job.status === 'Completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-transparent dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-transparent dark:border-red-500/20'}`}>
                                                {job.status}
                                            </span>
                                            {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-transparent dark:border-red-500/20">
                                                    {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} Returned
                                                </span>
                                            )}
                                        </div>

                                        <div className="relative mb-4">
                                            <h5 className="text-zinc-900 dark:text-zinc-200 font-black text-sm truncate pr-2 group-hover:text-black dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tight">
                                                {formattedId}
                                            </h5>
                                            <div className="flex items-center gap-1.5 mt-2 transition-colors">
                                                <Calendar size={10} className="text-purple-500/50" />
                                                <span className="text-[10px] font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded tracking-tighter uppercase transition-all group-hover:bg-purple-500/20">
                                                    {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product Names Preview */}
                                        {productNames.length > 0 && (
                                            <div className="relative mb-3 px-0.5">
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate leading-relaxed">
                                                    {productNames.slice(0, 2).join(', ')}
                                                    {productNames.length > 2 && <span className="text-purple-500 dark:text-purple-400"> +{productNames.length - 2} more</span>}
                                                </p>
                                            </div>
                                        )}

                                        <div className="relative flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-3 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-purple-950 flex items-center justify-center border border-zinc-300 dark:border-purple-500/30 shadow-inner group-hover/history:scale-110 transition-transform">
                                                    <span className="text-[9px] font-black text-zinc-950 dark:text-purple-400">{((job as any).user || 'S').charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-600 uppercase tracking-widest leading-tight">By</span>
                                                    <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-400 uppercase tracking-wider leading-tight">
                                                        {(job as any).user || 'System'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {job.status === 'Completed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReturnJob(job); }}
                                                        className="flex items-center gap-1.5 bg-amber-500/5 hover:bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-all text-amber-400 hover:text-amber-300"
                                                        title="Return items to warehouse"
                                                    >
                                                        <Undo2 size={10} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Return</span>
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-purple-500/5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-purple-500/10 group-hover:border-purple-500/30 transition-all">
                                                    <Box size={12} className="text-zinc-950 dark:text-purple-400" />
                                                    <span className="text-[10px] font-black text-zinc-950 dark:text-purple-100 tabular-nums">{job.items} {job.items === 1 ? 'Item' : 'Items'}</span>
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
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-100/50 dark:bg-zinc-100/[0.02] rounded-3xl border border-dashed border-zinc-300 dark:border-white/10">
                    <div className="p-4 bg-zinc-100 dark:bg-gray-900 rounded-2xl mb-4 border border-zinc-200 dark:border-white/5 shadow-xl">
                        <HistoryIcon size={32} className="text-zinc-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-widest">No history found</h3>
                    <p className="text-zinc-600 dark:text-gray-500 text-xs uppercase tracking-[0.2em] font-black">History logs empty</p>
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
