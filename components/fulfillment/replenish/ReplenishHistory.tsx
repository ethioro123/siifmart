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
        <div className="border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] mt-10 pt-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-stone-500 dark:text-stone-400" />
                        Replenishment History
                    </h4>
                    <p className="text-stone-500 dark:text-stone-400 text-[10px]">Recent completed refurbishment and restock jobs</p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        aria-label="Search replenishment history"
                        title="Search replenishment history"
                        value={replenishHistorySearch}
                        onChange={(e) => setReplenishHistorySearch(e.target.value)}
                        className="woody-input pl-9 text-xs py-2"
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
                                className="glass-panel rounded-2xl p-3 hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{formatJobId(job)}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2]">
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[100px]">
                                            {job.orderRef || 'Internal'}
                                            {job.jobNumber && <span className="text-[#2C5E3B] dark:text-[#A9CBA2] ml-1">• {job.jobNumber}</span>}
                                        </p>
                                        <p className="text-[9px] text-stone-400 dark:text-stone-500 mt-0.5">{formatDateTime(job.updatedAt || job.createdAt || '')}</p>
                                    </div>
                                    <div className="text-right text-stone-900 dark:text-stone-100 font-bold text-xs">
                                        {job.items} <span className="text-[9px] text-stone-500 dark:text-stone-400 font-normal">units</span>
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
                <div className="text-center py-10 bg-stone-50/10 dark:bg-[#1C2620]/10 rounded-2xl border border-dashed border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]">
                    <p className="text-stone-500 dark:text-stone-400 text-xs">No matching history found</p>
                </div>
            )}
        </div>
    );
};
