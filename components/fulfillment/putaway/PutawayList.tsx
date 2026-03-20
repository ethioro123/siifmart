import React from 'react';
import { Box, Zap, UserIcon, Lock, RefreshCw, Play, Info, Archive, Clock, Package, MapPin, User, ChevronRight, Loader2 } from 'lucide-react';
import { WMSJob, Employee } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { isUUID } from '../FulfillmentShared';
import Protected from '../../Protected';

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
    if (sortedPutawayJobs.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-6 bg-white/5 rounded-full border border-white/10">
                    <Box size={48} className="text-gray-600" />
                </div>
                <div>
                    <p className="text-gray-300 font-black uppercase tracking-widest text-sm">Storage Queue Empty</p>
                    <p className="text-gray-500 text-xs mt-1">No pending putaway jobs matching current filters.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {paginatedPutawayJobs.map(job => {
                const completedItems = job.lineItems?.filter(item => item.status === 'Completed').length || 0;
                const progress = job.lineItems ? (completedItems / job.lineItems.length) * 100 : 0;
                const isCritical = job.priority === 'Critical';

                return (
                    <React.Fragment key={job.id}>
                        {/* ── MOBILE: Compact tappable row ── */}
                        <div
                            className={`md:hidden flex items-center gap-3 bg-white/5 border rounded-xl p-3 active:bg-white/10 transition-all cursor-pointer ${isCritical ? 'border-red-500/30' : 'border-white/10'}`}
                            onClick={() => onShowDetails(job)}
                        >
                            {/* Progress circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
                                progress >= 100 ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                            }`}>
                                {Math.round(progress)}%
                            </div>
                            {/* Job info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-white tracking-wider uppercase">{formatJobId(job)}</span>
                                    {isCritical && (
                                        <span className="bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase animate-pulse">!</span>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{job.items} items</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-600 flex-shrink-0" />
                        </div>

                        {/* ── DESKTOP: Full card (unchanged) ── */}
                        <div className={`hidden md:block group bg-white/5 backdrop-blur-sm border rounded-3xl p-5 hover:bg-white/10 transition-all duration-500 relative overflow-hidden ${isCritical ? 'border-red-500/20' : 'border-white/10 hover:border-blue-500/30'}`}>
                            {isCritical && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />}

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-white tracking-widest uppercase">{formatJobId(job)}</span>
                                        {job.orderRef && (
                                            <span className="text-[10px] text-gray-400 font-bold border-l border-white/10 pl-2 uppercase tracking-widest">
                                                PO: {resolveOrderRef(job.orderRef)}
                                            </span>
                                        )}
                                        {isCritical && (
                                            <div className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                                <Zap size={8} className="fill-current" />
                                                Critical
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {job.items} Items
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {(job.lineItems || [])[0]?.sku || 'No SKU'}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {(() => {
                                                const loc = (job as any).zone || job.location;
                                                if (!loc) return 'Unassigned';
                                                if (loc.toLowerCase().startsWith('zone')) return loc;
                                                return `Zone ${loc}`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                <Protected permission="ASSIGN_TASKS">
                                    <div className="relative group/user">
                                        <button
                                            onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${selectedJob?.id === job.id
                                                ? 'bg-blue-500 border-blue-400 text-white shadow-lg scale-110'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                                }`}
                                            aria-label="Assign User"
                                        >
                                            <UserIcon size={14} />
                                        </button>
                                    </div>
                                </Protected>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>Progress</span>
                                    <span className={progress === 100 ? 'text-green-400' : 'text-blue-400'}>{Math.round(progress)}%</span>
                                </div>

                                {job.status === 'In-Progress' && (
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-700"
                                            ref={(el) => { if (el) el.style.width = `${Math.round(progress)}%`; }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        {job.assignedTo ? (
                                            (() => {
                                                const employee = employees.find(e => e.id === job.assignedTo || e.name === job.assignedTo || e.email === job.assignedTo);
                                                const displayName = employee?.name || (isUUID(job.assignedTo) ? job.assignedTo.slice(-4).toUpperCase() : job.assignedTo);
                                                const displayInitial = displayName.charAt(0).toUpperCase();

                                                return (
                                                    <>
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                                                            <span className="text-[9px] font-bold text-white">{displayInitial}</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{displayName}</span>
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-[10px] text-gray-600 italic">Unassigned</span>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                        {Math.round(progress)}% Complete
                                    </div>
                                </div>

                                {(() => {
                                    return (
                                        <div className="flex">
                                            <button
                                                onClick={() => onShowDetails(job)}
                                                disabled={isSubmitting}
                                                className="w-full h-12 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-black rounded-xl text-[10px] transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] border border-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        Open Mission Checklist <ChevronRight size={16} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Standardized PUTAWAY Pagination */}
            <Pagination
                currentPage={putawayCurrentPage}
                totalPages={putawayTotalPages}
                totalItems={sortedPutawayJobs.length}
                itemsPerPage={putawayItemsPerPage}
                onPageChange={setPutawayCurrentPage}
                itemName="jobs"
                className="col-span-full"
            />
        </>
    );
};
