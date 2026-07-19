import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, MapPin, Clock, List, ArrowRight, ChevronRight, Trash2 } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { SortDropdown, isUUID } from '../FulfillmentShared';
import { WMSJob, Employee, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useFulfillment } from '../FulfillmentContext';
import { useStore } from '../../../contexts/CentralStore';

/** Returns true when viewport < 768 px (md breakpoint). SSR-safe. */
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

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
    const { deleteJob } = useFulfillment();
    const { user } = useStore();
    const isMobile = useIsMobile();

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm(t('warehouse.picking.jobDeleteConfirmPrompt'))) {
            await deleteJob(jobId);
        }
    };

    return (
        <>
            {/* Sort Controls */}
            <div className="flex justify-end px-1">
                <SortDropdown
                    label={t('warehouse.sortByLabel')}
                    options={[
                        { id: 'priority' as const, label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> },
                        { id: 'site' as const, label: t('warehouse.storeSort'), icon: <MapPin size={12} /> },
                        { id: 'date' as const, label: t('warehouse.timeSort'), icon: <Clock size={12} /> },
                        { id: 'items' as const, label: t('warehouse.sizeSort'), icon: <List size={12} /> }
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

                                // ── Conditional render: only mount what the viewport needs ──
                                if (isMobile) {
                                    return (
                                        <div
                                            key={job.id}
                                            className={`flex items-center gap-3 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 border rounded-xl p-3 active:bg-stone-50 dark:active:bg-white/5 transition-colors cursor-pointer ${job.priority === 'Critical' ? 'border-red-500/30' : 'border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10'}`}
                                            onClick={() => handleStartJob(job)}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
                                                progress >= 100 ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2]'
                                            }}`}>
                                                {Math.round(progress)}%
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase">{formatJobId(job)}</span>
                                                    {job.priority === 'Critical' && (
                                                        <span className="bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">!</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest">{totalItems} {t('warehouse.itemPlural')}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-400 dark:text-gray-600 flex-shrink-0" />
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => handleStartJob(job)}
                                        className={`group glass-panel hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 p-6 relative overflow-hidden cursor-pointer active:scale-[0.99] ${job.priority === 'Critical' ? 'border-red-500/30 dark:border-red-500/20 shadow-red-500/5' : ''} ${job.status === 'In-Progress' ? 'border-[#2C5E3B]/50 dark:border-[#A9CBA2]/50 shadow-md' : ''}`}
                                    >
                                        {job.priority === 'Critical' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />}

                                        <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                                            <div className="flex-1 pr-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">{formatJobId(job)}</span>
                                                    {job.priority === 'Critical' && (
                                                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-500 text-red-700 dark:text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-500/20 dark:border-transparent">
                                                            <AlertTriangle size={8} className="fill-current" />
                                                            {t('warehouse.urgentLabel')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2 font-mono">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-100 dark:border-white/5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-sm" />
                                                        <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-widest">
                                                            {totalItems} {t('warehouse.itemPlural')}
                                                        </span>
                                                    </div>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest truncate max-w-[80px]">
                                                        {lineItems[0]?.sku || t('warehouse.picking.noSKU')}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                                    <span className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                                        {(() => {
                                                            const loc = (job as any).zone || job.location;
                                                            if (!loc) return t('warehouse.unassigned');
                                                            if (loc.toLowerCase().startsWith('zone')) return loc;
                                                            return `${t('warehouse.zonePrefix')} ${loc}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-xl font-black whitespace-nowrap shrink-0 border uppercase tracking-widest shadow-sm ${job.status === 'In-Progress'
                                                ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30 animate-pulse'
                                                : job.priority === 'High'
                                                    ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/30'
                                                    : 'bg-[#FAF8F5]/80 dark:bg-white/5 text-slate-500 dark:text-gray-400 border-[#E2DCCE]/60 dark:border-white/10'
                                                } `}>
                                                {job.status === 'In-Progress' ? `● ${t('warehouse.activeLabel')}` : job.priority}
                                            </span>
                                            {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                <button
                                                    onClick={(e) => handleDelete(e, job.id)}
                                                    className="w-8 h-6 ml-2 rounded border bg-white/5 border-white/10 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors flex items-center justify-center shrink-0"
                                                    title="Delete Job"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400">
                                                <span>{t('warehouse.putaway.progress')}</span>
                                                <span className={progress === 100 ? 'text-green-600 dark:text-green-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}>{Math.round(progress)}%</span>
                                            </div>

                                            <div className="w-full h-1.5 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-sm transition-[width] duration-700"
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
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2C5E3B] to-[#1E3B24] dark:from-[#A9CBA2] dark:to-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm border border-white/20">
                                                                        <span className="text-[10px] font-bold text-white dark:text-[#1E3B24]">{displayInitial}</span>
                                                                    </div>
                                                                    <span className="text-xs text-zinc-655 dark:text-gray-400 font-bold">{displayName}</span>
                                                                </>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 dark:text-gray-650 italic font-bold">{t('warehouse.unassigned')}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 mt-4">
                                                <button className="woody-btn-primary w-full h-12 text-[10px]">
                                                    {job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}
                                                    <ArrowRight size={14} className="inline ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                    <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4 glass-panel-pushed rounded-3xl border border-dashed border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 shadow-sm transition-all m-4">
                        <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/[0.05] rounded-full border border-slate-100 dark:border-white/5 shadow-inner">
                            <Package size={48} className="text-slate-300 dark:text-zinc-750" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-sm">{t('warehouse.noPendingJobs')}</p>
                            <p className="text-slate-500 dark:text-zinc-550 font-black uppercase tracking-widest text-[9px] mt-2">
                                {t('warehouse.jobsAppearAfterReceive')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
