import React, { useState, useMemo, useEffect } from 'react';
import { History as HistoryIcon, Search, ChevronRight, User, Calendar, Clock, PackageCheck, Box, ArrowRight } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { getSellUnit } from '../../../utils/units';

interface PutawayHistoryProps {
    historicalJobs: WMSJob[];
    resolveOrderRef: (ref?: string) => string;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    employees: any[];
}

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_PAGE_MOBILE = 2;

export const PutawayHistory: React.FC<PutawayHistoryProps> = ({
    historicalJobs,
    resolveOrderRef,
    setSelectedJob,
    setIsDetailsOpen,
    employees
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const perPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE;

    // Map and filter history to match the "Card" format
    const filteredHistory = useMemo(() => {
        const mapped = historicalJobs
            .filter((j: WMSJob) => j.type === 'PUTAWAY' || j.type === 'REPLENISH')
            .map(j => {
                const item = j.lineItems?.[0]; // Usually 1 item per putaway job

                // Resolve User Name
                const userId = j.completedBy || j.assignedTo;
                const userObj = employees.find(e => e.id === userId);
                const displayId = userObj?.code || (userId ? userId.slice(0, 5).toUpperCase() : '');

                const userName = userObj
                    ? `${userObj.name} (${displayId})`
                    : (userId ? `Unknown (${displayId})` : 'System');

                // Robust location resolution:
                // 1. Check all line items for a real destination bay (not generic source)
                // 2. Fall back to job-level location (also filtering generic sources)
                // 3. Default to 'Not Recorded'
                const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown';
                const itemBay = j.lineItems?.find(li => isRealBay(li.location))?.location;
                const jobBay = isRealBay((j as any).location) ? (j as any).location : undefined;
                const resolvedLocation = itemBay || jobBay || 'Not Recorded';

                let displayQty = '';
                if (item) {
                    const baseQty = item.expectedQty || item.quantity || 0;
                    const unitDef = getSellUnit(item.unit);
                    const sizeNum = parseFloat((item as any).size || '') || 0;
                    if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                        displayQty = `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                    } else {
                        displayQty = `${baseQty}${unitDef.code !== 'UNIT' ? ' ' + unitDef.shortLabel.toUpperCase() : ' units'}`;
                    }
                } else {
                    displayQty = `${j.items || 1} items`;
                }

                return {
                    id: j.id,
                    reference: formatJobId(j),
                    type: j.type === 'REPLENISH' ? 'REPLENISH' : 'PUTAWAY',
                    actionType: j.type === 'REPLENISH' ? 'Stock Replenishment' : 'Stock Putaway',
                    status: j.status,
                    subtitle: item?.name || 'Unknown Product',
                    date: j.completedAt || j.updatedAt || j.createdAt || new Date().toISOString(),
                    user: userName,
                    items: j.items || 1,
                    sku: item?.sku,
                    quantity: item?.expectedQty || 0,
                    location: resolvedLocation,
                    rawData: j,
                    displayQty
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return mapped.filter(item => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                item.reference.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                (item.sku && item.sku.toLowerCase().includes(q)) ||
                item.user.toLowerCase().includes(q) ||
                item.location.toLowerCase().includes(q)
            );
        });
    }, [historicalJobs, search]);

    const totalPages = Math.ceil(filteredHistory.length / perPage);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredHistory.slice(start, start + perPage);
    }, [filteredHistory, currentPage, perPage]);

    // Helper to format relative time (Same as ReceiveHistory)
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="border-t border-zinc-300 dark:border-white/10 mt-4 md:mt-8 pt-4 md:pt-8 relative overflow-hidden group/history">
            {/* 🌈 Futuristic Mesh Accent — hidden on mobile */}
            <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />
            <div className="hidden md:block absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-6 mb-4 md:mb-8">
                <h4 className="text-base md:text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 md:gap-3 uppercase tracking-tight">
                    <div className="hidden md:block p-2 bg-zinc-100 dark:bg-blue-500/10 rounded-xl border border-zinc-300 dark:border-blue-500/20 group-hover/history:bg-blue-500/20 transition-colors">
                        <HistoryIcon size={20} className="text-zinc-950 dark:text-blue-400" />
                    </div>
                    Putaway History
                </h4>
                <div className="relative w-full sm:w-72 group">
                    <div className="hidden md:block absolute -inset-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition duration-500"></div>
                    <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-xl focus-within:border-zinc-950 dark:focus-within:border-zinc-500 transition-all shadow-sm">
                        <Search className="absolute left-3 text-zinc-500 dark:text-zinc-600 group-focus-within:text-zinc-950 dark:group-focus-within:text-zinc-200 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by Job ID, SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 md:py-3 text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-widest focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        <AnimatePresence>
                            {paginatedHistory.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        setSelectedJob(item.rawData);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="group relative bg-white dark:bg-black/60 hover:bg-zinc-50 dark:hover:bg-black border border-zinc-200 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-400/50 rounded-xl md:rounded-2xl p-3 md:p-5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-blue-500/10"
                                >
                                    {/* Hover Glow — hidden on mobile */}
                                    <div className="hidden md:block absolute inset-0 bg-zinc-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    {/* Top Row */}
                                    <div className="relative flex justify-between items-start mb-2 md:mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg transition-colors ${item.type === 'REPLENISH' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                                                <PackageCheck size={14} />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-500">
                                                {item.actionType}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase tracking-widest font-mono">
                                            {getRelativeTime(item.date)}
                                        </span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="relative mb-2 md:mb-4">
                                        <h5 className="text-zinc-900 dark:text-zinc-200 font-black text-xs md:text-sm truncate pr-2 group-hover:text-black dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tight">
                                            {item.subtitle}
                                        </h5>
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-600 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                            <span className="bg-zinc-100 dark:bg-blue-500/5 px-1.5 py-0.5 rounded text-zinc-600 dark:text-blue-400 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                                                #{item.reference}
                                            </span>
                                            {item.sku && <span className="hidden md:inline text-zinc-300 dark:text-zinc-800 font-black">| <span className="text-zinc-600 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400">{item.sku}</span></span>}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2 transition-colors">
                                            <ArrowRight size={10} className="text-blue-500/50" />
                                            <span className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded tracking-tighter uppercase transition-all group-hover:bg-blue-500/20">
                                                {item.location}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer: User & Details */}
                                    <div className="relative flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-2 md:pt-3 mt-auto">
                                        <div className="hidden md:flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-blue-950 flex items-center justify-center border border-zinc-300 dark:border-blue-500/30 shadow-inner group-hover/history:scale-110 transition-transform">
                                                <span className="text-[9px] font-black text-zinc-950 dark:text-blue-400">{item.user.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-600 uppercase tracking-widest leading-tight">By</span>
                                                <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-400 uppercase tracking-wider leading-tight">
                                                    {item.user}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-blue-500/5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-blue-500/10 group-hover:border-blue-500/30 transition-all">
                                                <Box size={12} className="text-zinc-950 dark:text-blue-400" />
                                                <span className="text-[10px] font-black text-zinc-950 dark:text-blue-100 tabular-nums">{item.displayQty}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={perPage}
                        onPageChange={setCurrentPage}
                        itemName="records"
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-zinc-100/50 dark:bg-zinc-100/[0.02] rounded-2xl md:rounded-3xl border border-dashed border-zinc-300 dark:border-white/10">
                    <div className="p-4 bg-zinc-100 dark:bg-gray-900 rounded-2xl mb-4 border border-zinc-200 dark:border-white/5 shadow-xl">
                        <HistoryIcon size={32} className="text-zinc-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-widest">No history found</h3>
                    <p className="text-zinc-600 dark:text-gray-500 text-xs uppercase tracking-[0.2em] font-black">History logs empty</p>
                </div>
            )}
        </div>
    );
};
