import React, { useMemo, useState } from 'react';
import { History as HistoryIcon, Search } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';

interface ReplenishHistoryProps {
    historicalJobs: WMSJob[];
    REPLENISH_HISTORY_PER_PAGE: number;
    setSelectedJob: (job: WMSJob) => void;
    setIsDetailsOpen: (open: boolean) => void;
}

export const ReplenishHistory: React.FC<ReplenishHistoryProps> = ({
    historicalJobs,
    REPLENISH_HISTORY_PER_PAGE,
    setSelectedJob,
    setIsDetailsOpen
}) => {
    const [replenishHistorySearch, setReplenishHistorySearch] = useState('');
    const [replenishHistoryPage, setReplenishHistoryPage] = useState(1);

    const filteredReplenishHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'REPLENISH' && (
                !replenishHistorySearch ||
                j.id.toLowerCase().includes(replenishHistorySearch.toLowerCase())
            )
        );
    }, [historicalJobs, replenishHistorySearch]);

    const replenishHistoryTotalPages = Math.ceil(filteredReplenishHistory.length / REPLENISH_HISTORY_PER_PAGE);

    const paginatedReplenishHistory = useMemo(() => {
        const start = (replenishHistoryPage - 1) * REPLENISH_HISTORY_PER_PAGE;
        return filteredReplenishHistory.slice(start, start + REPLENISH_HISTORY_PER_PAGE);
    }, [filteredReplenishHistory, replenishHistoryPage]);

    return (
        <div className="border-t border-white/10 mt-10 pt-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-gray-400" />
                        Replenishment History
                    </h4>
                    <p className="text-gray-500 text-[10px]">Recent completed refurbishment and restock jobs</p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={replenishHistorySearch}
                        onChange={(e) => setReplenishHistorySearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                    />
                </div>
            </div>

            {paginatedReplenishHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {paginatedReplenishHistory.map((job: WMSJob) => (
                            <div
                                key={job.id}
                                onClick={() => {
                                    setSelectedJob(job);
                                    setIsDetailsOpen(true);
                                }}
                                className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono text-cyber-primary font-bold">{formatJobId(job)}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-green-500/10 text-green-400">
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-gray-500 truncate max-w-[100px]">
                                            {job.orderRef || 'Internal'}
                                            {job.jobNumber && <span className="text-cyber-primary ml-1">• {job.jobNumber}</span>}
                                        </p>
                                        <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(job.updatedAt || job.createdAt || '')}</p>
                                    </div>
                                    <div className="text-right text-white font-bold text-xs">
                                        {job.items} <span className="text-[9px] text-gray-500 font-normal">units</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={replenishHistoryPage}
                        totalPages={replenishHistoryTotalPages}
                        totalItems={filteredReplenishHistory.length}
                        itemsPerPage={REPLENISH_HISTORY_PER_PAGE}
                        onPageChange={setReplenishHistoryPage}
                        itemName="history"
                    />
                </>
            ) : (
                <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                    <p className="text-gray-500 text-xs">No matching history found</p>
                </div>
            )}
        </div>
    );
};
