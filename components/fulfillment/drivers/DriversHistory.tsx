
import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Package, Archive, CheckCircle, Undo2 } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';

interface DriversHistoryProps {
    historicalJobs: WMSJob[];
    sites: Site[];
    resolveOrderRef: (ref: string | undefined) => string;
    setSelectedJob: (job: WMSJob) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    products: Product[];
    user: any;
    addNotification: (type: string, message: string) => void;
    inventoryRequestsService: any;
    wmsJobsService?: any;
    jobs?: WMSJob[];
}

const ITEMS_PER_PAGE = 20;

export const DriversHistory: React.FC<DriversHistoryProps> = ({
    historicalJobs,
    sites,
    resolveOrderRef,
    setSelectedJob,
    setIsDetailsOpen,
    products,
    user,
    addNotification,
    inventoryRequestsService,
    wmsJobsService,
    jobs = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);

    // Filter History
    const filteredHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            (j.type === 'DISPATCH' || j.type === 'DRIVER') && (
                !searchQuery ||
                formatJobId(j).toLowerCase().includes(searchQuery.toLowerCase()) ||
                (j.orderRef && (j.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) || resolveOrderRef(j.orderRef).toLowerCase().includes(searchQuery.toLowerCase())))
            )
        );
    }, [historicalJobs, searchQuery, resolveOrderRef]);

    // Pagination
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-[1.5rem] lg:rounded-[2.5rem] p-5 lg:p-10 shadow-2xl relative overflow-hidden group/log">
            {/* Scanline effect for log aesthetic */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20" />

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <HistoryIcon size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Job History</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em]">Past assignment records</p>
                        </div>
                    </div>
                </div>

                <div className="relative w-full xl:w-96 group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="SEARCH HISTORY..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono uppercase tracking-widest placeholder:text-gray-700 shadow-inner"
                    />
                </div>
            </div>

            <div className="relative z-10">
                {paginatedHistory.length > 0 ? (
                    <div className="space-y-4">
                        {paginatedHistory.map((job: any) => {
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            return (
                                <div
                                    key={job.id}
                                    onClick={() => {
                                        setSelectedJob(job);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="flex flex-col md:flex-row items-center gap-4 md:gap-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 rounded-2xl lg:rounded-3xl p-4 lg:p-6 transition-all group/item cursor-pointer shadow-lg hover:shadow-cyan-500/5"
                                >
                                    <div className="w-full md:w-32 flex flex-col justify-center">
                                        <span className="text-[10px] font-mono text-cyan-500/50 group-hover/item:text-cyan-400 transition-colors font-bold uppercase tracking-tighter">REF: {formatJobId(job)}</span>
                                        <p className="text-[9px] text-gray-600 font-mono mt-1 font-bold">{formatDateTime(job.updatedAt || job.createdAt)}</p>
                                    </div>

                                    <div className="h-10 w-px bg-white/5 hidden md:block" />

                                    <div className="flex-1 flex items-center gap-4 min-w-0 w-full">
                                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                            <Package size={18} className="text-gray-500 group-hover/item:text-white transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Destination</p>
                                            <h6 className="text-lg font-black text-white uppercase tracking-tighter truncate">{destSite?.name || 'Unknown Hub'}</h6>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
                                        <div className="text-right">
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Item Count</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-white font-black text-lg">{job.items}</span>
                                                <span className="text-[10px] text-gray-600 font-black uppercase">Qty</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-green-500/5 px-4 py-2 rounded-2xl border border-green-500/10">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                            <span className="text-[10px] text-green-400 uppercase font-black tracking-widest">COMPLETED</span>
                                        </div>

                                        {(job.lineItems || []).some((li: any) => li.returnedQty > 0) && (
                                            <div className="flex items-center gap-2 bg-red-500/5 px-3 py-2 rounded-2xl border border-red-500/10">
                                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                                                <span className="text-[10px] text-red-400 uppercase font-black tracking-widest">
                                                    {(job.lineItems || []).filter((li: any) => li.returnedQty > 0).length} RETURNED
                                                </span>
                                            </div>
                                        )}

                                        {job.status === 'Completed' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setReturnJob(job); }}
                                                className="flex items-center gap-1.5 bg-amber-500/5 hover:bg-amber-500/15 px-3 py-2 rounded-2xl border border-amber-500/10 hover:border-amber-500/30 transition-all text-amber-400 hover:text-amber-300"
                                                title="Return items to warehouse"
                                            >
                                                <Undo2 size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-10" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="p-6 bg-white/5 rounded-full mb-6 border border-white/5">
                                <Archive className="text-gray-700" size={48} />
                            </div>
                            <h3 className="text-xl font-black text-gray-500 uppercase tracking-[0.3em]">No Log Data Found</h3>
                            <p className="text-gray-700 font-bold uppercase tracking-widest text-[10px] mt-2">Archive contains no matching relay records</p>
                        </div>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-10 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredHistory.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                            isLoading={false}
                            itemName="HISTORY"
                        />
                    </div>
                )}
            </div>

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
