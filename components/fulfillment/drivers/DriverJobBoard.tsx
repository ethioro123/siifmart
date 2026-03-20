import React, { useMemo, useState, useEffect } from 'react';
import { Shield, RefreshCw, Zap } from 'lucide-react';
import { WMSJob, Site, User } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface DriverJobBoardProps {
    filteredJobs: WMSJob[];
    sites: Site[];
    employees: any[];
    user: User | null;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    processingJobIds: Set<string>;
    setProcessingJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    wmsJobsService: any;
    refreshData: () => Promise<void>;
    addNotification: (type: string, message: string) => void;
}

export const DriverJobBoard: React.FC<DriverJobBoardProps> = ({
    filteredJobs,
    sites,
    employees,
    user,
    setSelectedJob,
    setIsDetailsOpen,
    processingJobIds,
    setProcessingJobIds,
    wmsJobsService,
    refreshData,
    addNotification
}) => {
    // Local State
    const [dispatchCurrentPage, setDispatchCurrentPage] = useState(1);
    const DISPATCH_ITEMS_PER_PAGE = 6;

    // Filter Logic
    const filteredDispatchJobs = useMemo(() => {
        return filteredJobs.filter(j =>
            j.type === 'DISPATCH' &&
            j.status === 'Pending' &&
            !j.assignedTo
        );
    }, [filteredJobs]);

    const dispatchTotalPages = Math.ceil(filteredDispatchJobs.length / DISPATCH_ITEMS_PER_PAGE);
    const paginatedDispatchJobs = useMemo(() => {
        const start = (dispatchCurrentPage - 1) * DISPATCH_ITEMS_PER_PAGE;
        return filteredDispatchJobs.slice(start, start + DISPATCH_ITEMS_PER_PAGE);
    }, [filteredDispatchJobs, dispatchCurrentPage]);

    // Reset dispatch page if list changes drastically
    useEffect(() => {
        setDispatchCurrentPage(prev => Math.min(prev, Math.max(1, dispatchTotalPages)));
    }, [dispatchTotalPages]);

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308] animate-pulse" />
                        Job Board
                        <span className="text-yellow-500/40 ml-2 font-mono">[{filteredDispatchJobs.length} AVAILABLE]</span>
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-5 opacity-60">Available delivery assignments</p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/20 via-white/5 to-transparent mx-8 hidden lg:block" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {paginatedDispatchJobs.length === 0 ? (
                    <div className="col-span-full bg-white/[0.02] backdrop-blur-md rounded-[2.5rem] p-8 lg:p-20 border border-dashed border-white/10 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                            <Shield size={48} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Jobs Available</h3>
                        <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Check back later for new assignments...</p>
                    </div>
                ) : (
                    paginatedDispatchJobs.map(job => {
                        const dest = sites.find(s => s.id === job.destSiteId);
                        const source = sites.find(s => s.id === job.sourceSiteId || s.id === job.siteId);
                        const isCritical = job.priority === 'Critical';

                        return (
                            <div
                                key={job.id}
                                onClick={() => {
                                    setSelectedJob(job);
                                    setIsDetailsOpen(true);
                                }}
                                className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] border ${isCritical ? 'border-red-500/20 hover:border-red-500/50' : 'border-white/10 hover:border-yellow-500/40'} rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 transition-all duration-500 flex flex-col h-full cursor-pointer overflow-hidden shadow-2xl hover:-translate-y-2`}
                            >
                                {/* Card Accents */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-4 right-4 flex gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
                                    <div className="w-1 h-3 bg-white/20 rounded-full" />
                                    <div className="w-1 h-3 bg-white/20 rounded-full" />
                                </div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`} />
                                            <p className="text-[10px] font-mono text-gray-400 font-bold tracking-tighter uppercase">REF: {formatJobId(job)}</p>
                                        </div>
                                        <h5 className="font-black text-white text-2xl leading-none uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">{dest?.name || 'Local Hub'}</h5>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isCritical ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                        job.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-cyan-500/20 text-cyan-400'
                                        }`}>
                                        {job.priority}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 mb-8 relative z-10">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 group-hover:border-white/10 transition-colors">
                                            <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">Items</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-white leading-none">{job.items || 0}</span>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase">Units</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-2">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2 h-2 rounded-full border border-gray-600" />
                                                <div className="w-[1px] h-8 bg-gradient-to-b from-gray-600 to-yellow-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="mb-3">
                                                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Origin</p>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase truncate">{source?.name || 'Unknown Origin'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-yellow-500 font-black uppercase tracking-widest mb-0.5">Destination</p>
                                                    <p className="text-[13px] text-white font-black uppercase truncate tracking-tight">{dest?.name || 'Unknown Destination'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const currentEmployee = employees.find(e => e.email === user?.email);
                                        if (!currentEmployee) return;
                                        const isInternal = !currentEmployee?.driverType || currentEmployee?.driverType === 'internal';
                                        setProcessingJobIds(prev => new Set(prev).add(job.id));
                                        try {
                                            await wmsJobsService.update(job.id, { assignedTo: currentEmployee.id, status: isInternal ? 'In-Progress' : 'Pending' });
                                            await refreshData();
                                            addNotification('success', 'Job successfully accepted.');
                                        } catch (err) { addNotification('alert', 'Failed to accept job.'); } finally {
                                            setProcessingJobIds(prev => {
                                                const next = new Set(prev);
                                                next.delete(job.id);
                                                return next;
                                            });
                                        }
                                    }}
                                    className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden flex items-center justify-center gap-3
                                    ${isCritical ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white hover:bg-yellow-400 text-black'}
                                    group/btn hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95`}
                                >
                                    {processingJobIds.has(job.id) ? (
                                        <RefreshCw className="animate-spin" size={16} />
                                    ) : (
                                        <>
                                            <Zap size={14} className={isCritical ? 'text-white' : 'text-black'} />
                                            ACCEPT JOB
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {filteredDispatchJobs.length > 0 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={dispatchCurrentPage}
                        totalPages={dispatchTotalPages}
                        totalItems={filteredDispatchJobs.length}
                        itemsPerPage={DISPATCH_ITEMS_PER_PAGE}
                        onPageChange={setDispatchCurrentPage}
                        isLoading={false}
                        itemName="requests"
                    />
                </div>
            )}
        </div>
    );
};
