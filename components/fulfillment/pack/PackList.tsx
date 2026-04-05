import React from 'react';
import { Package, AlertTriangle, Clock, List, Box, ArrowRight, Trash2 } from 'lucide-react';
import { Pagination } from '../../shared';
import { SortDropdown } from '../FulfillmentShared';
import { WMSJob, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useFulfillment } from '../FulfillmentContext';
import { useStore } from '../../../contexts/CentralStore';

interface PackListProps {
    filteredPackJobs: WMSJob[]; paginatedPackJobs: WMSJob[];
    sites: Site[]; setSelectedPackJob: (job: WMSJob) => void;
    packCurrentPage: number; setPackCurrentPage: (page: number) => void;
    packJobsTotalPages: number; PACK_ITEMS_PER_PAGE: number;
    packSortBy: 'priority' | 'date' | 'items'; setPackSortBy: (val: 'priority' | 'date' | 'items') => void;
    isPackSortDropdownOpen: boolean; setIsPackSortDropdownOpen: (val: boolean) => void;
    t: (key: string) => string;
}

export const PackList: React.FC<PackListProps> = ({
    filteredPackJobs, paginatedPackJobs, sites, setSelectedPackJob, packCurrentPage, setPackCurrentPage, packJobsTotalPages, PACK_ITEMS_PER_PAGE, packSortBy, setPackSortBy, isPackSortDropdownOpen, setIsPackSortDropdownOpen, t
}) => {
    const { deleteJob } = useFulfillment(); const { user } = useStore();
    const handleDelete = async (e: React.MouseEvent, jobId: string) => { e.stopPropagation(); if (window.confirm('Delete job?')) await deleteJob(jobId); };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black text-gray-900 dark:text-white px-1 transition-colors duration-500">
            <div className="flex justify-end mb-6">
                <SortDropdown label="Sort Missions" options={[{ id: 'priority' as const, label: 'Priority', icon: <AlertTriangle size={12} /> }, { id: 'date' as const, label: 'Time', icon: <Clock size={12} /> }, { id: 'items' as const, label: 'Size', icon: <List size={12} /> }]} value={packSortBy} onChange={setPackSortBy} isOpen={isPackSortDropdownOpen} setIsOpen={setIsPackSortDropdownOpen} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {filteredPackJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 md:pb-8">
                        {paginatedPackJobs.map(job => {
                            const lineItems = job.lineItems || []; const totalItems = lineItems.length; const packedItems = lineItems.filter(i => i.status === 'Picked' || i.status === 'Completed').length; const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0; const destSite = sites.find(s => s.id === job.destSiteId);
                            return (
                                <div key={job.id} onClick={() => setSelectedPackJob(job)} className={`group relative bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-6 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl ${job.priority === 'Critical' ? 'border-red-500/30' : 'hover:border-cyan-500/30'} ${job.status === 'In-Progress' ? 'border-cyan-500/50 shadow-md shadow-cyan-500/10' : ''}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5"><span className="text-sm font-black text-gray-900 dark:text-white tracking-widest uppercase italic">{formatJobId(job)}</span>{job.priority === 'Critical' && <div className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse border border-red-500/30">Urgent</div>}</div>
                                            <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest leading-none"><span>{totalItems} Items</span><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-800" /><span>{destSite?.name || 'Customer'}</span></div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border ${job.status === 'In-Progress' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 animate-pulse' : 'bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-white/10'}`}>{job.status === 'In-Progress' ? 'Active' : job.priority}</span>
                                            {['super_admin', 'warehouse_manager'].includes(user?.role as string) && <button aria-label="Delete Job" title="Delete Job" onClick={(e) => handleDelete(e, job.id)} className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-inner"><Trash2 size={12} /></button>}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500"><span>Progress</span><span className={progress === 100 ? 'text-green-600 dark:text-green-400' : 'text-cyan-600 dark:text-cyan-400'}>{Math.round(progress)}% Full</span></div>
                                        <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                                            <div ref={(el) => { if (el) el.style.width = `${progress}%`; }} className={`h-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'}`} />
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-5 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                                        <div className="flex -space-x-3">{lineItems.slice(0, 4).map((_, i) => <div key={i} className="w-9 h-9 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-white/20 shadow-lg overflow-hidden"><Package size={16} /></div>)}{totalItems > 4 && <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center z-10 backdrop-blur-sm shadow-lg"><span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400">+{totalItems - 4}</span></div>}</div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-all">Open Mission <ArrowRight size={14} /></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-12 space-y-6">
                        <div className="w-28 h-28 rounded-full bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center relative shadow-inner"><Box size={44} className="text-gray-300 dark:text-gray-600" /><div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-cyan-500/40 animate-ping" /></div>
                        <div><p className="text-2xl font-black text-gray-300 dark:text-white tracking-[0.3em] uppercase italic">{t('warehouse.noRecords')}</p><p className="text-xs font-bold tracking-widest uppercase text-gray-500 mt-3 max-w-[200px] leading-relaxed">No packing missions matching your criteria</p></div>
                    </div>
                )}
            </div>
            <Pagination currentPage={packCurrentPage} totalPages={packJobsTotalPages} totalItems={filteredPackJobs.length} itemsPerPage={PACK_ITEMS_PER_PAGE} onPageChange={setPackCurrentPage} isLoading={false} itemName="missions" />
        </div>
    );
};
