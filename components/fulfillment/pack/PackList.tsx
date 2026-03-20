import React from 'react';
import { Package, AlertTriangle, MapPin, Clock, List, Box, ArrowRight } from 'lucide-react';
import { Pagination } from '../../shared';
import { SortDropdown } from '../FulfillmentShared';
import { WMSJob, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PackListProps {
    filteredPackJobs: WMSJob[];
    paginatedPackJobs: WMSJob[];
    sites: Site[];
    setSelectedPackJob: (job: WMSJob) => void;
    packCurrentPage: number;
    setPackCurrentPage: (page: number) => void;
    packJobsTotalPages: number;
    PACK_ITEMS_PER_PAGE: number;
    packSortBy: 'priority' | 'date' | 'items';
    setPackSortBy: (val: 'priority' | 'date' | 'items') => void;
    isPackSortDropdownOpen: boolean;
    setIsPackSortDropdownOpen: (val: boolean) => void;
    t: (key: string) => string;
}

export const PackList: React.FC<PackListProps> = ({
    filteredPackJobs,
    paginatedPackJobs,
    sites,
    setSelectedPackJob,
    packCurrentPage,
    setPackCurrentPage,
    packJobsTotalPages,
    PACK_ITEMS_PER_PAGE,
    packSortBy,
    setPackSortBy,
    isPackSortDropdownOpen,
    setIsPackSortDropdownOpen,
    t
}) => {
    return (
        <div className="flex flex-col h-full bg-[#0a0a0b] text-white">
            {/* Sort Controls */}
            <div className="flex justify-end px-1 mb-4">
                <SortDropdown
                    label="Sort By"
                    options={[
                        { id: 'priority' as const, label: 'Priority', icon: <AlertTriangle size={12} /> },
                        { id: 'date' as const, label: 'Time', icon: <Clock size={12} /> },
                        { id: 'items' as const, label: 'Size', icon: <List size={12} /> }
                    ]}
                    value={packSortBy}
                    onChange={(val) => setPackSortBy(val)}
                    isOpen={isPackSortDropdownOpen}
                    setIsOpen={setIsPackSortDropdownOpen}
                />
            </div>

            {/* Job Cards Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredPackJobs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
                            {paginatedPackJobs.map(job => {
                                const lineItems = job.lineItems || [];
                                const totalItems = lineItems.length;
                                const packedItems = lineItems.filter(i => i.status === 'Picked' || i.status === 'Completed').length;
                                const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;
                                const destSite = sites.find(s => s.id === job.destSiteId);

                                return (
                                    <React.Fragment key={job.id}>
                                        {/* Mobile Layout (Slim Row) */}
                                        <div
                                            onClick={() => setSelectedPackJob(job)}
                                            className="md:hidden flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl mb-2 active:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Mini Progress Circle */}
                                                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                        <path className="text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                        <path className={progress === 100 ? 'text-green-500' : 'text-cyan-500'} strokeDasharray={`${progress}, 100`} strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                    </svg>
                                                    <span className="absolute text-[8px] font-black">{Math.round(progress)}%</span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-white">{formatJobId(job)}</span>
                                                        {job.priority === 'Critical' && <AlertTriangle size={10} className="text-red-400 fill-current animate-pulse" />}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">
                                                        <span>{totalItems} Items</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span className="truncate max-w-[80px]">{destSite?.name || 'Customer'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {job.status === 'In-Progress' && (
                                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                                )}
                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                                    <ArrowRight size={12} className="text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Layout (Detailed Card) */}
                                        <div
                                            onClick={() => setSelectedPackJob(job)}
                                            className={`hidden md:block group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-all duration-500 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:shadow-cyan-500/10 ${job.priority === 'Critical' ? 'border-red-500/30' : 'hover:border-cyan-500/30'} ${job.status === 'In-Progress' ? 'border-cyan-500/50 shadow-md shadow-cyan-500/10' : ''}`}
                                        >
                                            {job.priority === 'Critical' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />}

                                            <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-black text-white tracking-widest uppercase">{formatJobId(job)}</span>
                                                        {job.priority === 'Critical' && (
                                                            <div className="flex items-center gap-1 bg-red-500/20 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-500/30">
                                                                <AlertTriangle size={8} className="fill-current" />
                                                                Urgent
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                            {totalItems} Items
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[80px]">
                                                            {lineItems[0]?.sku || 'No SKU'}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                            {destSite?.name || 'Customer'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap shrink-0 border uppercase tracking-widest ${job.status === 'In-Progress'
                                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 md:animate-pulse'
                                                    : job.priority === 'High'
                                                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                                        : 'bg-white/5 text-gray-400 border-white/10'
                                                    } `}>
                                                    {job.status === 'In-Progress' ? '● Active' : job.priority}
                                                </span>
                                            </div>

                                            <div className="space-y-4 relative z-10">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    <span>Progress</span>
                                                    <span className={progress === 100 ? 'text-green-400' : 'text-cyan-400'}>{Math.round(progress)}%</span>
                                                </div>

                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        ref={(el) => el?.style.setProperty('--progress-width', `${progress}%`)}
                                                        className={`h-full transition-all w-[var(--progress-width)] duration-1000 ease-out ${progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                                                <div className="flex -space-x-2">
                                                    {lineItems.slice(0, 3).map((item, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0 z-[1] shadow-xl overflow-hidden text-gray-500">
                                                            <Package size={14} />
                                                        </div>
                                                    ))}
                                                    {totalItems > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 z-0 backdrop-blur-sm">
                                                            <span className="text-[10px] font-black text-cyan-400">+{totalItems - 3}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-500 group-hover:text-cyan-400 transition-colors">
                                                    View Mission
                                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <Pagination
                            currentPage={packCurrentPage}
                            totalPages={packJobsTotalPages}
                            totalItems={filteredPackJobs.length}
                            itemsPerPage={PACK_ITEMS_PER_PAGE}
                            onPageChange={setPackCurrentPage}
                            isLoading={false}
                            itemName="missions"
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                        <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center relative">
                            <Box size={40} className="text-gray-600" />
                            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-500/50 animate-ping" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-white tracking-widest uppercase">{t('warehouse.noRecords')}</p>
                            <p className="text-sm font-bold tracking-widest uppercase text-gray-500 mt-2">No packing missions matching your criteria</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
