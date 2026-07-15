import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Clock, User as UserIcon, Upload, ArrowRight } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, User } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

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
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter for Completed/Shipped Dispatch Jobs
    const filteredHistory = useMemo(() => {
        const historyJobs = jobs.filter(job => {
            if (job.type !== 'DISPATCH') return false;
            // Consider "History" as Shipped, Completed, or Cancelled
            return job.status === 'Completed' || job.status === 'Cancelled' || job.transferStatus === 'Shipped';
        });

        const mapped = historyJobs.map(job => {
            const userId = job.completedBy || job.assignedTo;
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            let userObj = employees?.find(e => 
                e.id === userId || 
                (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
                (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
                (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
            );
            const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
            const resolvedUser = {
                name: userObj?.name || (userId ? userId : 'System'),
                displayId: displayId || ''
            };

            return {
                ...job,
                resolvedUser
            };
        });

        if (!search) {
            return mapped.sort((a, b) => new Date(b.updatedAt || b.createdAt || new Date()).getTime() - new Date(a.updatedAt || a.createdAt || new Date()).getTime());
        }

        const q = search.toLowerCase();
        return mapped.filter(job => {
            const destSite = sites.find(s => s.id === job.destSiteId)?.name || '';
            const cleanJobId = formatJobId(job).toLowerCase();
            const orderRefStr = (job.orderRef || '').toLowerCase();
            const workerName = (job.resolvedUser?.name || '').toLowerCase();
            const workerId = (job.resolvedUser?.displayId || '').toLowerCase();
            const noteStr = (job.notes || '').toLowerCase();
            const statusStr = (job.status || '').toLowerCase();
            const jobNum = (job.jobNumber || (job as any).job_number || '').toLowerCase();

            // Search product names and SKUs
            const items = job.lineItems || (job as any).line_items || [];
            const matchesItems = items.some((item: any) => 
                (item.name || '').toLowerCase().includes(q) ||
                (item.productName || '').toLowerCase().includes(q) ||
                (item.sku || '').toLowerCase().includes(q)
            );

            return (
                cleanJobId.includes(q) ||
                job.id.toLowerCase().includes(q) ||
                destSite.toLowerCase().includes(q) ||
                orderRefStr.includes(q) ||
                workerName.includes(q) ||
                workerId.includes(q) ||
                noteStr.includes(q) ||
                statusStr.includes(q) ||
                jobNum.includes(q) ||
                matchesItems
            );
        }).sort((a, b) => new Date(b.updatedAt || b.createdAt || new Date()).getTime() - new Date(a.updatedAt || a.createdAt || new Date()).getTime());
    }, [jobs, sites, search, employees, formatJobId]);

    const totalPages = Math.ceil(filteredHistory.length / HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="glass-panel p-8 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
                    <div className="p-2 bg-[#2C5E3B]/20 rounded-xl">
                        <HistoryIcon className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                    </div>
                    {t('warehouse.docks.outboundSchedule')}
                </h3>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Shipment, Site..."
                            aria-label="Search Shipment or Site"
                            title="Search Shipment or Site"
                            className="woody-input w-64 !pl-11 pr-4 text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E2DCCE]/60 dark:border-white/5">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Shipped At</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Job ID</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Destination</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Driver</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Dispatcher</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Items</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE]/30 dark:divide-white/5">
                        {paginatedHistory.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold">
                                    {t('warehouse.noHistoryFound')}
                                </td>
                            </tr>
                        ) : (
                            paginatedHistory.map((job) => {
                                const destSite = sites.find(s => s.id === job.destSiteId);
                                const carrier = employees.find(e => e.id === job.assignedTo);

                                return (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-[#FAF8F5]/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
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
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{formatJobId(job)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-400">{destSite ? `${destSite.name} (${destSite.code || destSite.id})` : 'Unknown'}</span>
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
                                                <span className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-tight">
                                                    {job.assignedBy || 'System'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-gray-400">{job.items || job.lineItems?.length || 0} items</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${job.status === 'Completed' || job.transferStatus === 'Shipped' ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20' :
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
