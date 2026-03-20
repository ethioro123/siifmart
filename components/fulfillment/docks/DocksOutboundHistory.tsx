import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Clock, User as UserIcon, Upload, ArrowRight } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, User } from '../../../types';

interface DocksOutboundHistoryProps {
    jobs: WMSJob[];
    sites: Site[];
    employees: User[];
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    formatJobId: (job: WMSJob) => string;
}

const HISTORY_PER_PAGE = 12;

export const DocksOutboundHistory: React.FC<DocksOutboundHistoryProps> = ({
    jobs,
    sites,
    employees,
    setSelectedJob,
    setIsDetailsOpen,
    formatJobId
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter for Completed/Shipped Dispatch Jobs
    const filteredHistory = useMemo(() => {
        return jobs.filter(job => {
            if (job.type !== 'DISPATCH') return false;
            // Consider "History" as Shipped, Completed, or Cancelled
            const isHistory = job.status === 'Completed' || job.status === 'Cancelled' || job.transferStatus === 'Shipped';
            if (!isHistory) return false;

            const destSite = sites.find(s => s.id === job.destSiteId)?.name || '';
            const matchesSearch = !search ||
                job.id.toLowerCase().includes(search.toLowerCase()) ||
                destSite.toLowerCase().includes(search.toLowerCase()) ||
                (job.orderRef && job.orderRef.toLowerCase().includes(search.toLowerCase()));

            return matchesSearch;
        }).sort((a, b) => new Date(b.updatedAt || b.createdAt || new Date()).getTime() - new Date(a.updatedAt || a.createdAt || new Date()).getTime());
    }, [jobs, sites, search]);

    const totalPages = Math.ceil(filteredHistory.length / HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-xl">
                        <HistoryIcon className="text-purple-400" size={20} />
                    </div>
                    Outbound History
                </h3>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Shipment, Site..."
                            className="w-64 bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Shipped At</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Job ID</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Destination</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Driver</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Dispatcher</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Items</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedHistory.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold">
                                    No outbound history found.
                                </td>
                            </tr>
                        ) : (
                            paginatedHistory.map((job) => {
                                const destSite = sites.find(s => s.id === job.destSiteId);
                                const carrier = employees.find(e => e.id === job.assignedTo);

                                return (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            setSelectedJob(job);
                                            setIsDetailsOpen(true);
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-gray-600" />
                                                <span className="text-xs font-mono font-bold text-gray-400">
                                                    {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-white">{formatJobId(job)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-400">{destSite?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    {job.deliveryMethod === 'External' ? (job.externalCarrierName || 'Unlabeled External') : (carrier?.name || 'Unassigned')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                                                    {job.assignedBy || 'System'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-gray-400">{job.items || job.lineItems?.length || 0} items</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${job.status === 'Completed' || job.transferStatus === 'Shipped' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                job.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                }`}>
                                                {job.transferStatus || job.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={HISTORY_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="history"
                    />
                </div>
            )}
        </div>
    );
};
