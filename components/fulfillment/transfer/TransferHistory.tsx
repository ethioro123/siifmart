import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Package, Box, Calendar, ChevronRight } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, TransferRecord } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';

interface TransferHistoryProps {
    transfers: TransferRecord[];
    jobs: WMSJob[];
    sites: Site[];
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
}

const HISTORY_ITEMS_PER_PAGE = 12;

export const TransferHistory: React.FC<TransferHistoryProps> = ({
    transfers,
    jobs,
    sites,
    setSelectedJob,
    setIsDetailsOpen
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredHistory = useMemo(() => {
        // Merge strategy: Use transfers if they explicitly exist and have length, otherwise extract from jobs
        const completedTransfers = (transfers && transfers.length > 0) ? transfers : jobs.filter(t =>
            t.type === 'TRANSFER' &&
            ((t as any).status === 'Received' ||
                t.status === 'Cancelled' ||
                t.status === 'Completed' ||
                t.transferStatus === 'Received')
        );

        return completedTransfers.filter((t: any) => {
            const destSite = sites.find(s => s.id === t.destSiteId);
            const sourceSite = sites.find(s => s.id === t.sourceSiteId);
            return !search ||
                formatJobId(t).toLowerCase().includes(search.toLowerCase()) ||
                (t.jobNumber && t.jobNumber.toLowerCase().includes(search.toLowerCase())) ||
                (destSite?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (sourceSite?.name || '').toLowerCase().includes(search.toLowerCase());
        });
    }, [transfers, jobs, search, sites]);

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
        <div className="border-t border-white/10 mt-10 pt-8 relative overflow-hidden group/history">
            {/* Mesh Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h4 className="text-xl font-black text-cyan-100 flex items-center gap-3 uppercase tracking-tight">
                        <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover/history:bg-cyan-500/20 transition-colors">
                            <HistoryIcon size={20} className="text-cyan-400" />
                        </div>
                        Transfer History
                    </h4>
                    <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-black">Recent completed or received transfers</p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <div className="absolute -inset-0.5 bg-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl focus-within:border-cyan-500 transition-all shadow-sm">
                        <Search className="absolute left-3 text-gray-600 group-focus-within:text-cyan-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none placeholder:text-gray-600 font-bold uppercase tracking-wider"
                        />
                    </div>
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                        <AnimatePresence>
                            {paginatedHistory.map((transfer: any, index) => {
                                const formattedId = formatJobId(transfer);
                                const totalItems = Array.isArray(transfer.items) ? transfer.items.length : (transfer.lineItems?.length || 0);
                                
                                // Product names preview
                                let itemsArr = transfer.lineItems || [];
                                if (typeof itemsArr === 'string') { try { itemsArr = JSON.parse(itemsArr); } catch { itemsArr = []; } }
                                const products = Array.isArray(itemsArr) ? itemsArr : [];
                                const productNames = products.map((p: any) => p.name || p.productName || p.sku).filter(Boolean);

                                return (
                                    <motion.div
                                        key={transfer.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => {
                                            setSelectedJob(transfer);
                                            setIsDetailsOpen(true);
                                        }}
                                        className="group relative bg-black/40 hover:bg-black/60 border border-white/5 hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                                                    <Package size={14} />
                                                </div>
                                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                                                    Transfer
                                                </span>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${
                                                transfer.status === 'Cancelled' 
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                                : transfer.status === 'Completed' || transfer.transferStatus === 'Received'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                            }`}>
                                                {transfer.transferStatus || transfer.status}
                                            </span>
                                        </div>

                                        <div className="relative mb-4">
                                            <h5 className="text-white font-black text-sm truncate group-hover:text-cyan-100 transition-colors uppercase tracking-tight">
                                                {formattedId}
                                            </h5>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">REF:</span>
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">
                                                        {formattedId}
                                                        {transfer.jobNumber && transfer.jobNumber !== formattedId && (
                                                            <> <span className="text-cyan-500/50 mr-1">•</span> {transfer.jobNumber}</>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={10} className="text-gray-600" />
                                                    <span className="text-[10px] font-bold text-gray-500">
                                                        {formatDateTime((transfer as any).date || (transfer as any).createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview items */}
                                        {productNames.length > 0 && (
                                            <div className="relative mb-4">
                                                <p className="text-[10px] text-gray-600 truncate">
                                                    {productNames.slice(0, 2).join(', ')}
                                                    {productNames.length > 2 && <span className="text-cyan-500/60 ml-1">+{productNames.length - 2} more</span>}
                                                </p>
                                            </div>
                                        )}

                                        <div className="relative flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                                            <div className="flex items-center gap-2 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                                                <Box size={12} className="text-gray-500" />
                                                <span className="text-[10px] font-black text-gray-400">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors border border-white/10 group-hover:border-cyan-500/30">
                                                <ChevronRight size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={HISTORY_ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="history"
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                    <HistoryIcon size={32} className="text-gray-700 mb-4" />
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">No matching history found</p>
                </div>
            )}
        </div>
    );
};
