import React from 'react';
import { Package, AlertTriangle, MapPin, Clock, List, ArrowRight, ChevronRight } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { SortDropdown, isUUID } from '../FulfillmentShared';
import { WMSJob, Employee, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PickListProps {
    filteredPickJobs: WMSJob[];
    paginatedPickJobs: WMSJob[];
    pickSortBy: 'priority' | 'date' | 'items' | 'site';
    setPickSortBy: (val: 'priority' | 'date' | 'items' | 'site') => void;
    isPickSortDropdownOpen: boolean;
    setIsPickSortDropdownOpen: (val: boolean) => void;
    pickCurrentPage: number;
    setPickCurrentPage: (val: number) => void;
    pickJobsTotalPages: number;
    PICK_ITEMS_PER_PAGE: number;
    handleStartJob: (job: WMSJob) => void;
    sites: Site[];
    employees: Employee[];
    t: (key: string) => string;
}

export const PickList: React.FC<PickListProps> = ({
    filteredPickJobs,
    paginatedPickJobs,
    pickSortBy,
    setPickSortBy,
    isPickSortDropdownOpen,
    setIsPickSortDropdownOpen,
    pickCurrentPage,
    setPickCurrentPage,
    pickJobsTotalPages,
    PICK_ITEMS_PER_PAGE,
    handleStartJob,
    sites,
    employees,
    t
}) => {
    return (
        <>
            {/* Sort Controls */}
            <div className="flex justify-end px-1">
                <SortDropdown
                    label="Sort By"
                    options={[
                        { id: 'priority' as const, label: 'Priority', icon: <AlertTriangle size={12} /> },
                        { id: 'site' as const, label: 'Store', icon: <MapPin size={12} /> },
                        { id: 'date' as const, label: 'Time', icon: <Clock size={12} /> },
                        { id: 'items' as const, label: 'Size', icon: <List size={12} /> }
                    ]}
                    value={pickSortBy}
                    onChange={(val) => setPickSortBy(val)}
                    isOpen={isPickSortDropdownOpen}
                    setIsOpen={setIsPickSortDropdownOpen}
                />
            </div>

            {/* Job Cards Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredPickJobs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
                            {paginatedPickJobs.sort((a, b) => {
                                switch (pickSortBy) {
                                    case 'priority':
                                        const p: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 1, 'Low': 0 };
                                        return (p[b.priority] || 1) - (p[a.priority] || 1);
                                    case 'date':
                                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                                    case 'items':
                                        return (b.lineItems?.length || 0) - (a.lineItems?.length || 0);
                                    case 'site':
                                        const siteA = sites.find(s => s.id === a.destSiteId)?.name || '';
                                        const siteB = sites.find(s => s.id === b.destSiteId)?.name || '';
                                        return siteA.localeCompare(siteB);
                                    default:
                                        return 0;
                                }
                            }).map(job => {
                                const lineItems = job.lineItems || (job as any).line_items || [];
                                const totalItems = lineItems.length;
                                const pickedItems = lineItems.filter((i: any) => i.status === 'Picked').length;
                                const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;

                                return (
                                    <React.Fragment key={job.id}>
                                        {/* ── MOBILE: Compact tappable row ── */}
                                        <div
                                            className={`md:hidden flex items-center gap-3 bg-white/5 border rounded-xl p-3 active:bg-white/10 transition-all cursor-pointer ${job.priority === 'Critical' ? 'border-red-500/30' : 'border-zinc-200 dark:border-white/10'}`}
                                            onClick={() => handleStartJob(job)}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
                                                progress >= 100 ? 'bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400' : 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400'
                                            }`}>
                                                {Math.round(progress)}%
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-zinc-900 dark:text-white tracking-wider uppercase">{formatJobId(job)}</span>
                                                    {job.priority === 'Critical' && (
                                                        <span className="bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase animate-pulse">!</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest">{totalItems} items</span>
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-400 dark:text-gray-600 flex-shrink-0" />
                                        </div>

                                        {/* ── DESKTOP: Full card ── */}
                                        <div
                                            onClick={() => handleStartJob(job)}
                                            className={`hidden md:block group bg-white border border-zinc-200 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 rounded-3xl p-5 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all duration-500 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:shadow-purple-500/10 ${job.priority === 'Critical' ? 'dark:border-red-500/20 border-red-500/30' : 'hover:border-purple-500/30 dark:hover:border-purple-500/30'} ${job.status === 'In-Progress' ? 'border-purple-500/50 shadow-md shadow-purple-500/10' : ''}`}
                                        >
                                        {job.priority === 'Critical' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />}

                                        <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                                            <div className="flex-1 pr-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-black text-zinc-900 dark:text-white tracking-widest uppercase">{formatJobId(job)}</span>
                                                    {job.priority === 'Critical' && (
                                                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-500 text-red-700 dark:text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-500/20 dark:border-transparent">
                                                            <AlertTriangle size={8} className="fill-current" />
                                                            Urgent
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                                        {totalItems} Items
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest truncate max-w-[80px]">
                                                        {lineItems[0]?.sku || 'No SKU'}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                                        {(() => {
                                                            const loc = (job as any).zone || job.location;
                                                            if (!loc) return 'Unassigned';
                                                            if (loc.toLowerCase().startsWith('zone')) return loc;
                                                            return `Zone ${loc}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap shrink-0 border uppercase tracking-widest ${job.status === 'In-Progress'
                                                ? 'bg-purple-100/50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 md:animate-pulse'
                                                : job.priority === 'High'
                                                    ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30'
                                                    : 'bg-zinc-100 dark:bg-gray-500/20 text-zinc-600 dark:text-gray-400 border-zinc-200 dark:border-gray-500/30'
                                                } `}>
                                                {job.status === 'In-Progress' ? '● Active' : job.priority}
                                            </span>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400">
                                                <span>Progress</span>
                                                <span className={progress === 100 ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}>{Math.round(progress)}%</span>
                                            </div>

                                            <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-700"
                                                    ref={(el) => { if (el) el.style.width = `${Math.round(progress)}%`; }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between mt-2 mb-4">
                                                <div className="flex items-center gap-2">
                                                    {job.assignedTo ? (
                                                        (() => {
                                                            const employee = employees.find(e => e.id === job.assignedTo || e.name === job.assignedTo || e.email === job.assignedTo);
                                                            const displayId = employee?.code || (isUUID(job.assignedTo) ? job.assignedTo.slice(-4).toUpperCase() : '');
                                                            const displayName = employee?.name ? `${employee.name} (${displayId})` : (isUUID(job.assignedTo) ? `User (${displayId})` : `${job.assignedTo} (${displayId})`);
                                                            const displayInitial = (employee?.name || job.assignedTo).charAt(0).toUpperCase();

                                                            return (
                                                                <>
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm border border-purple-500/20">
                                                                        <span className="text-[10px] font-bold text-white">{displayInitial}</span>
                                                                    </div>
                                                                    <span className="text-xs text-zinc-600 dark:text-gray-400 font-bold">{displayName}</span>
                                                                </>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 dark:text-gray-600 italic font-bold">Unassigned</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-2 mt-4">
                                                <button className="w-full py-3 md:py-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-400 font-black rounded-xl text-[10px] transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] border border-purple-500/20 active:scale-[0.98]">
                                                    {job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        {/* PICK Pagination Controls */}
                        <Pagination
                            currentPage={pickCurrentPage}
                            totalPages={pickJobsTotalPages}
                            totalItems={filteredPickJobs.length}
                            itemsPerPage={PICK_ITEMS_PER_PAGE}
                            onPageChange={setPickCurrentPage}
                            itemName="jobs"
                        />
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6 border border-white/5">
                            <Package size={32} className="text-gray-600" />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">{t('warehouse.noPendingJobs')}</h4>
                        <p className="text-gray-500 text-sm text-center max-w-sm">
                            {t('warehouse.jobsAppearAfterReceive')}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};
