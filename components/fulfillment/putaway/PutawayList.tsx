import React from 'react';
import { Box, Zap, UserIcon, Lock, RefreshCw, Play, Info, Archive, Clock, Package, MapPin, User, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { WMSJob, Employee } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { isUUID } from '../FulfillmentShared';
import Protected from '../../Protected';
import { useFulfillment } from '../FulfillmentContext';

interface PutawayListProps {
    sortedPutawayJobs: WMSJob[];
    paginatedPutawayJobs: WMSJob[];
    putawayCurrentPage: number;
    putawayTotalPages: number;
    setPutawayCurrentPage: (page: number) => void;
    putawayItemsPerPage: number;
    resolveOrderRef: (ref?: string) => string;
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    employees: Employee[];
    user: any;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    handleStartJob: (job: WMSJob) => void;
    onShowDetails: (job: WMSJob) => void;
}

export const PutawayList: React.FC<PutawayListProps> = ({
    sortedPutawayJobs,
    paginatedPutawayJobs,
    putawayCurrentPage,
    putawayTotalPages,
    setPutawayCurrentPage,
    putawayItemsPerPage,
    resolveOrderRef,
    selectedJob,
    setSelectedJob,
    employees,
    user,
    isSubmitting,
    setIsSubmitting,
    handleStartJob,
    onShowDetails
}) => {
    const { deleteJob } = useFulfillment();

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to permanently delete this job?')) {
            await deleteJob(jobId);
        }
    };

    if (sortedPutawayJobs.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4 glass-panel-pushed rounded-3xl border border-dashed border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 shadow-sm transition-all">
                <div className="p-6 md:p-8 bg-[#FAF8F5]/30 dark:bg-white/[0.05] rounded-full border border-gray-100 dark:border-white/5 shadow-inner">
                    <Box size={48} className="text-gray-300 dark:text-gray-600" />
                </div>
                <div>
                    <p className="text-gray-900 dark:text-white font-black uppercase tracking-[0.2em] text-sm">No Jobs Found</p>
                    <p className="text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest text-[9px] mt-2">No jobs found matching your filters.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPutawayJobs.map(job => {
                    const completedItems = job.lineItems?.filter(item => item.status === 'Completed').length || 0;
                    const progress = job.lineItems ? (completedItems / job.lineItems.length) * 100 : 0;
                    const isCritical = job.priority === 'Critical';

                    return (
                        <React.Fragment key={job.id}>
                            {/* ── MOBILE: Compact tappable row ── */}
                            <div
                                className={`md:hidden flex items-center gap-3 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 border rounded-xl p-4 active:bg-stone-50 dark:active:bg-white/5 transition-all cursor-pointer shadow-sm ${isCritical ? 'border-red-500/50' : 'border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10'}`}
                                onClick={() => onShowDetails(job)}
                            >
                                {/* Progress circle */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 border transition-all ${
                                    progress >= 100 ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2]'
                                } shadow-sm`}>
                                    {Math.round(progress)}%
                                </div>
                                {/* Job info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase">{formatJobId(job)}</span>
                                        {isCritical && (
                                            <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase animate-pulse shadow-lg shadow-red-500/20">!</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest mt-1">{job.items} Inventory Items</p>
                                </div>
                                <div className="p-2 bg-stone-50 dark:bg-white/5 rounded-lg border border-[#E2DCCE]/30 dark:border-white/5">
                                    <ChevronRight size={18} className="text-slate-400 dark:text-zinc-600 flex-shrink-0" />
                                </div>
                            </div>

                            {/* ── DESKTOP: Full card ── */}
                            <div className={`hidden md:block group glass-panel hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 p-6 relative overflow-hidden active:scale-[0.99] ${isCritical ? 'border-red-500/30 dark:border-red-500/20' : ''}`}>
                                {isCritical && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />}
                                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-base font-black text-gray-900 dark:text-white tracking-widest uppercase drop-shadow-sm">{formatJobId(job)}</span>
                                            {job.orderRef && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black border-l border-[#E2DCCE]/60 dark:border-white/10 pl-3 uppercase tracking-widest font-mono">
                                                    Ref: {resolveOrderRef(job.orderRef)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 font-mono">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-100 dark:border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.4)]" />
                                                <span className="text-[9px] text-gray-550 dark:text-gray-450 font-black uppercase tracking-widest">
                                                    {job.items} Items
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-100 dark:border-white/5">
                                                <MapPin size={10} className="text-gray-400 dark:text-gray-500" />
                                                <span className="text-[9px] text-gray-550 dark:text-gray-450 font-black uppercase tracking-widest truncate max-w-[120px]">
                                                    {(() => {
                                                        const loc = (job as any).zone || job.location;
                                                        if (!loc) return 'UNASSIGNED';
                                                        if (loc.toLowerCase().startsWith('zone')) return loc.toUpperCase();
                                                        return `ZONE ${loc}`.toUpperCase();
                                                    })()}
                                                </span>
                                            </div>
                                            {isCritical && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider animate-pulse shadow-lg shadow-red-500/20">
                                                    <Zap size={10} className="fill-current" />
                                                    Critical
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Protected permission="ASSIGN_TASKS">
                                            <button
                                                onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-md ${selectedJob?.id === job.id
                                                    ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] border-[#2C5E3B] dark:border-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-110'
                                                    : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white'
                                                    }`}
                                                aria-label="Assign User"
                                            >
                                                <UserIcon size={16} />
                                            </button>
                                        </Protected>
                                        {['super_admin', 'warehouse_manager'].includes(user?.role) && (
                                            <button
                                                onClick={(e) => handleDelete(e, job.id)}
                                                disabled={isSubmitting}
                                                className="w-10 h-10 rounded-xl border bg-white/80 dark:bg-[#18201B]/70 border-[#E2DCCE] dark:border-emerald-950/20 text-rose-500 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all flex items-center justify-center disabled:opacity-50 shadow-md"
                                                title="Delete Job"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Processing Status</p>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>{Math.round(progress)}% COMPLETED</p>
                                    </div>

                                    <div className="w-full h-2 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-stone-200/50 dark:border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out relative ${progress >= 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_15px_rgba(44,94,59,0.4)]'}`}
                                            ref={(el) => { if (el) el.style.width = `${Math.round(progress)}%`; }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 glass-panel-pushed shadow-inner">
                                        <div className="flex items-center gap-3">
                                            {job.assignedTo ? (
                                                (() => {
                                                    const employee = employees.find(e => e.id === job.assignedTo || e.name === job.assignedTo || e.email === job.assignedTo);
                                                    const displayName = employee?.name || (isUUID(job.assignedTo) ? job.assignedTo.slice(-4).toUpperCase() : job.assignedTo);
                                                    const displayInitial = displayName.charAt(0).toUpperCase();

                                                    return (
                                                        <>
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2C5E3B] to-[#1E3B24] dark:from-[#A9CBA2] dark:to-[#FAF8F5] flex items-center justify-center shadow-lg border border-white/20">
                                                                <span className="text-xs font-black text-white dark:text-[#1E3B24]">{displayInitial}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Assigned To</p>
                                                                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate max-w-[120px]">{displayName}</p>
                                                            </div>
                                                        </>
                                                    );
                                                })()
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-white/5 flex items-center justify-center border border-stone-300 dark:border-white/10">
                                                        <User size={18} className="text-gray-400 dark:text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Assigned To</p>
                                                        <p className="text-[10px] font-black text-stone-400 dark:text-gray-800 uppercase italic">Unassigned</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Registered</p>
                                            <div className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                                                <Clock size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                <span className="text-[10px] font-black font-mono">
                                                    {(() => {
                                                        const date = new Date(job.createdAt || '');
                                                        const now = new Date();
                                                        const diffInMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                                                        if (diffInMins < 1) return 'JUST NOW';
                                                        if (diffInMins < 60) return `${diffInMins}M AGO`;
                                                        const diffInHours = Math.floor(diffInMins / 60);
                                                        if (diffInHours < 24) return `${diffInHours}H AGO`;
                                                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onShowDetails(job)}
                                        disabled={isSubmitting}
                                        className="woody-btn-primary w-full h-14 text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-[0.98] group"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                View Job Details
                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="col-span-full pt-8 border-t border-[#E2DCCE]/60 dark:border-white/5">
                <Pagination
                    currentPage={putawayCurrentPage}
                    totalPages={putawayTotalPages}
                    totalItems={sortedPutawayJobs.length}
                    itemsPerPage={putawayItemsPerPage}
                    onPageChange={setPutawayCurrentPage}
                    itemName="putaway jobs"
                    className="col-span-full"
                />
            </div>
        </>
    );
};
