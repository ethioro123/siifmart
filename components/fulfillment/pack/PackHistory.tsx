import React, { useState, useMemo } from 'react';
import { Archive, Search, Calendar, Box, Package, Printer, History as HistoryIcon, Barcode, Undo2 } from 'lucide-react';
import { Pagination } from '../../shared';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';
import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';

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
    onReturn
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [openPrintMenuId, setOpenPrintMenuId] = useState<string | null>(null);

    const filteredHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'PACK' && (
                !search ||
                j.id.toLowerCase().includes(search.toLowerCase()) ||
                (j.orderRef && resolveOrderRef && (j.orderRef.toLowerCase().includes(search.toLowerCase()) || resolveOrderRef(j.orderRef).toLowerCase().includes(search.toLowerCase())))
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
        });
    }, [historicalJobs, search, resolveOrderRef, employees]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="border-t border-white/10 mt-8 pt-8 relative overflow-hidden group/history">
            {/* 🌈 Futuristic Mesh Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <h4 className="text-xl font-black text-cyan-100 flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover/history:bg-cyan-500/20 transition-colors">
                        <HistoryIcon size={20} className="text-cyan-400" />
                    </div>
                    Pack History
                </h4>

                {/* History Search */}
                <div className="relative w-full sm:w-72 group">
                    <div className="absolute -inset-0.5 bg-cyan-100 rounded-xl blur opacity-0 group-hover:opacity-5 transition duration-500"></div>
                    <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl focus-within:border-cyan-500 transition-all shadow-sm">
                        <Search className="absolute left-3 text-gray-600 group-focus-within:text-cyan-200 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID or Order..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-3 text-xs text-cyan-200 font-black uppercase tracking-widest focus:outline-none placeholder:text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                        <AnimatePresence>
                            {paginatedHistory.map((job, index) => {
                                const formattedId = formatJobIdFn(job);
                                const destSite = sites.find(s => s.id === job.destSiteId);
                                const totalItems = job.items || job.lineItems?.length || 0;
                                // Parse items for product name preview
                                let rawItems = job.lineItems || [];
                                if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; } }
                                if (typeof rawItems === 'number') rawItems = [];
                                const itemsArr = Array.isArray(rawItems) ? rawItems : [];
                                const productNames = itemsArr.map((li: any) => li.name || li.product?.name || li.sku || 'Unknown').filter(Boolean);

                                return (
                                    <React.Fragment key={job.id}>
                                        {/* Mobile Layout (Slim Row) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => onJobSelect && onJobSelect(job)}
                                            className="md:hidden group relative bg-black/60 hover:bg-black border border-white/10 rounded-xl p-3 transition-all duration-300 overflow-hidden cursor-pointer active:bg-white/5 mb-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                                                        <Archive size={14} className="text-cyan-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-gray-200">{formattedId}</span>
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                                                {job.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">
                                                            <span>{formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                            <span>{totalItems} Items</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="w-6 h-6 rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-500/30">
                                                        <span className="text-[8px] font-black text-cyan-400">{((job as any).user || 'S').charAt(0).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Desktop Layout (Detailed Card) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => onJobSelect && onJobSelect(job)}
                                            className="hidden md:block group relative bg-black/60 hover:bg-black border-2 border-white/5 hover:border-cyan-400/50 rounded-2xl p-5 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
                                        >
                                            {/* Hover Glow */}
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            <div className="relative flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg transition-colors bg-cyan-500/10 text-cyan-400">
                                                        <Archive size={14} />
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-widest font-black text-gray-500">
                                                        Pack Finished
                                                    </span>
                                                </div>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                                    {job.status}
                                                </span>
                                                {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                                                        {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} Returned
                                                    </span>
                                                )}
                                            </div>

                                            <div className="relative mb-4">
                                                <h5 className="text-gray-200 font-black text-sm truncate pr-2 group-hover:text-white transition-colors uppercase tracking-tight">
                                                    {formattedId}
                                                </h5>
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <div className="flex items-center gap-1.5 transition-colors">
                                                        <Calendar size={10} className="text-cyan-500/50" />
                                                        <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded tracking-tighter uppercase transition-all group-hover:bg-cyan-500/20">
                                                            {formatDateTime(job.updatedAt || job.createdAt || '', { showTime: true })}
                                                        </span>
                                                    </div>
                                                    {job.trackingNumber && (
                                                        <div className="flex items-center gap-1.5 transition-colors">
                                                            <Barcode size={10} className="text-cyan-500/40 group-hover:text-cyan-400" />
                                                            <span className="text-[10px] font-mono font-black text-gray-400 bg-white/5 px-1.5 py-0.5 rounded tracking-widest uppercase transition-all group-hover:text-cyan-100 group-hover:bg-cyan-900/40 border border-transparent group-hover:border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0)] group-hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                                                {job.trackingNumber}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Names Preview */}
                                            {productNames.length > 0 && (
                                                <div className="relative mb-3 px-0.5">
                                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
                                                        {productNames.slice(0, 2).join(', ')}
                                                        {productNames.length > 2 && <span className="text-cyan-500 dark:text-cyan-400"> +{productNames.length - 2} more</span>}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="relative flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-500/30 shadow-inner group-hover/history:scale-110 transition-transform">
                                                        <span className="text-[9px] font-black text-cyan-400">{((job as any).user || 'S').charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-tight">By</span>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-tight">
                                                            {(job as any).user || 'System'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 bg-cyan-500/5 px-2 py-1 rounded-lg border border-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
                                                        <Box size={12} className="text-cyan-400" />
                                                        <span className="text-[10px] font-black text-cyan-100 tabular-nums">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
                                                    </div>
                                                    {job.status === 'Completed' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onReturn?.(job); }}
                                                            className="flex items-center gap-1.5 bg-amber-500/5 hover:bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-all text-amber-400 hover:text-amber-300"
                                                            title="Return items to warehouse"
                                                        >
                                                            <Undo2 size={10} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Return</span>
                                                        </button>
                                                    )}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenPrintMenuId(openPrintMenuId === job.id ? null : job.id);
                                                            }}
                                                            className={`p-1.5 rounded-lg transition-colors border flex items-center justify-center ${openPrintMenuId === job.id ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'hover:bg-cyan-500/20 text-cyan-500 border-transparent hover:border-cyan-500/30'}`}
                                                            title="Reprint Label"
                                                        >
                                                            <Printer size={12} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {openPrintMenuId === job.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                    className="absolute bottom-[calc(100%+8px)] right-0 w-32 bg-black/95 border border-cyan-500/30 rounded-xl p-2 shadow-xl shadow-cyan-900/20 z-[100] flex flex-col gap-1 backdrop-blur-md"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="text-[9px] font-black text-cyan-500/50 uppercase tracking-widest px-2 pb-1 border-b border-white/5 mb-1">Select Size</div>
                                                                    {(['Small', 'Medium', 'Large', 'XL'] as const).map(size => (
                                                                        <button
                                                                            key={size}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (onReprintLabel) onReprintLabel(job as WMSJob, size);
                                                                                setOpenPrintMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-cyan-500/20 transition-colors"
                                                                        >
                                                                            {size}
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
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
                        isLoading={false}
                        itemName="records"
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                    <HistoryIcon size={32} className="mb-4 opacity-50 dark:text-cyan-500" />
                    <p className="font-bold tracking-widest uppercase text-sm">No historical records found.</p>
                </div>
            )}
        </div>
    );
};
