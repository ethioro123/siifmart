import React from 'react';
import { ArrowRight, Eye, Clock, Trash2 } from 'lucide-react';
import { WMSJob, Site, Employee, Product } from '../../../types';
import { formatJobId, formatOrderRef } from '../../../utils/jobIdFormatter';
import { useFulfillment } from '../FulfillmentContext';
import { useStore } from '../../../contexts/CentralStore';

interface AssignPendingJobsProps {
    filteredJobs: WMSJob[];
    assignJobFilter: string;
    dispatchPriorityFilter: string;
    dispatchSearch: string;
    assignSortBy: string;
    employees: Employee[];
    jobAssignments: any[];
    sites: Site[];
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    t: (key: string) => string;
}

export const AssignPendingJobs: React.FC<AssignPendingJobsProps> = ({
    filteredJobs,
    assignJobFilter,
    dispatchPriorityFilter,
    dispatchSearch,
    assignSortBy,
    employees,
    jobAssignments,
    sites,
    selectedJob,
    setSelectedJob,
    setIsDetailsOpen,
    t
}) => {
    const { deleteJob } = useFulfillment();
    const { user } = useStore();

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to permanently delete this job?')) {
            await deleteJob(jobId);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-xl transition-colors duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 font-black text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-widest flex justify-between items-center transition-colors">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyber-primary animate-pulse" />
                    <span>{t('warehouse.pendingJobs')}</span>
                    <span className="bg-cyan-500/10 dark:bg-cyber-primary/10 text-cyan-600 dark:text-cyber-primary px-2 py-0.5 rounded-full border border-cyan-500/20 dark:border-cyber-primary/20 ml-1">
                        {(() => {
                            const nonCompleted = ['pending', 'in-progress', 'assigned', 'accepted'];
                            let filtered = filteredJobs.filter(j => 
                                nonCompleted.includes(j.status?.toLowerCase() || '') && 
                                j.type !== 'TRANSFER' &&
                                ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH'].includes(j.type?.toUpperCase() || '')
                            );
                            if (assignJobFilter !== 'ALL') {
                                filtered = filtered.filter(j => {
                                    const jobType = j.type?.toUpperCase();
                                    const filterType = assignJobFilter.toUpperCase();
                                    if (filterType === 'DRIVER' || filterType === 'DISPATCH') {
                                        return jobType === 'DRIVER' || jobType === 'DISPATCH';
                                    }
                                    return jobType === filterType;
                                });
                            }
                            if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
                            if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));
                            return filtered.length;
                        })()}
                    </span>
                </div>
                {!selectedJob && filteredJobs.filter(j => j.status?.toLowerCase() === 'pending').length > 0 && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400/60 normal-case font-medium flex items-center gap-1">
                        <ArrowRight size={10} /> {t('warehouse.selectJobToAssign')}
                    </span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {(() => {
                    const nonCompleted = ['pending', 'in-progress', 'assigned', 'accepted'];
                    let filtered = filteredJobs.filter(j => 
                        nonCompleted.includes(j.status?.toLowerCase() || '') && 
                        j.type !== 'TRANSFER' &&
                        ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH'].includes(j.type?.toUpperCase() || '')
                    );
                    if (assignJobFilter !== 'ALL') {
                        filtered = filtered.filter(j => {
                            const jobType = j.type?.toUpperCase();
                            const filterType = assignJobFilter.toUpperCase();
                            if (filterType === 'DRIVER' || filterType === 'DISPATCH') {
                                return jobType === 'DRIVER' || jobType === 'DISPATCH';
                            }
                            return jobType === filterType;
                        });
                    }
                    if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
                    if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));

                    // Sort based on selected sort option
                    filtered.sort((a, b) => {
                        if (assignSortBy === 'priority') {
                            const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                            return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
                        } else if (assignSortBy === 'date') {
                            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                        } else if (assignSortBy === 'items') {
                            return (b.items || 0) - (a.items || 0);
                        }
                        return 0;
                    });

                    return filtered.map(job => {
                        // Calculate estimated duration
                        let estimatedDuration = 15;
                        if (job.type === 'PICK') estimatedDuration = Math.max(15, job.items * 3);
                        else if (job.type === 'PACK') estimatedDuration = Math.max(10, job.items * 2);
                        else if (job.type === 'PUTAWAY') estimatedDuration = Math.max(20, job.items * 4);

                        // Find best match employee
                        const bestMatchEmployee = employees
                            .filter(e => {
                                const role = e.role?.toLowerCase();
                                // DO NOT suggest the CEO (super_admin)
                                if (role === 'super_admin') return false;

                                if (!['picker', 'packer', 'dispatcher', 'driver', 'warehouse_manager', 'receiver', 'inventory_specialist', 'admin', 'manager', 'regional_manager', 'operations_manager'].includes(role)) return false;
                                if (e.status !== 'Active') return false;

                                // Executive / Admin roles can be suggested for ANY job (except CEO)
                                if (['admin', 'manager', 'regional_manager', 'operations_manager'].includes(role)) return true;

                                // Role match
                                if (job.type === 'PICK' && role !== 'picker' && role !== 'dispatcher' && role !== 'warehouse_manager') return false;
                                if (job.type === 'PACK' && role !== 'packer' && role !== 'picker' && role !== 'dispatcher' && role !== 'warehouse_manager') return false;
                                if (job.type === 'PUTAWAY' && role !== 'dispatcher' && role !== 'warehouse_manager' && role !== 'inventory_specialist' && role !== 'picker') return false;
                                if (job.type === 'RECEIVE' && role !== 'receiver' && role !== 'dispatcher' && role !== 'warehouse_manager' && role !== 'inventory_specialist' && role !== 'picker') return false;
                                if ((job.type === 'DISPATCH' || job.type === 'DRIVER') && role !== 'dispatcher' && role !== 'driver' && role !== 'warehouse_manager') return false;
                                return true;
                            })
                            .map(e => {
                                const activeAssignments = jobAssignments.filter(
                                    a => a.employeeId === e.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                );
                                return { employee: e, workload: activeAssignments.length };
                            })
                            .sort((a, b) => a.workload - b.workload)[0];

                        return (
                            <div
                                key={job.id}
                                onClick={() => {
                                    setSelectedJob(job);
                                    setIsDetailsOpen(false);
                                }}
                                className={`p-4 rounded-2xl border transition-all duration-300 ${selectedJob?.id === job.id
                                    ? 'bg-cyan-500/5 dark:bg-cyber-primary/10 border-cyan-500 dark:border-cyber-primary shadow-lg shadow-cyan-500/10 dark:shadow-[0_0_20px_rgba(0,255,157,0.15)] scale-[1.02]'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/[0.08] hover:scale-[1.01] cursor-pointer'
                                    } `}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded shadow-sm tracking-tighter uppercase ${job.type === 'PICK' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' :
                                                job.type === 'PACK' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' :
                                                    job.type === 'RECEIVE' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                                                        (job.type === 'DRIVER' || job.type === 'DISPATCH') ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30' :
                                                            'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30'} `}>
                                                {job.type}
                                            </span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-tighter uppercase border ${job.priority === 'Critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' :
                                                job.priority === 'High' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' :
                                                    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400/60 border-slate-100 dark:border-white/5'
                                                } `}>
                                                {job.priority}
                                            </span>
                                            {job.status?.toLowerCase() !== 'pending' && (
                                                <span className="text-[8px] px-2 py-0.5 rounded font-black tracking-tighter uppercase bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                                                    {job.status}
                                                </span>
                                            )}
                                        </div>
                                        {job.assignedTo && (() => {
                                            const assignee = employees.find(e => e.id === job.assignedTo);
                                            return assignee ? (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="w-4 h-4 rounded-md bg-cyan-100 dark:bg-cyber-primary/20 border border-cyan-200 dark:border-cyber-primary/30 flex items-center justify-center text-[8px] font-black text-cyan-600 dark:text-cyber-primary">
                                                        {assignee.name?.charAt(0)}
                                                    </div>
                                                    <span className="text-[9px] text-slate-500 dark:text-gray-400 font-bold">{assignee.name}</span>
                                                </div>
                                            ) : null;
                                        })()}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-cyan-600 dark:text-cyber-primary font-mono font-black tracking-widest">{formatJobId(job)}</span>
                                            {job.orderRef && job.type !== 'PICK' && (
                                                <span className="text-[9px] text-slate-400 dark:text-gray-500 font-bold border-l border-slate-200 dark:border-white/10 pl-2">
                                                    PO: {formatOrderRef(job.orderRef)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {bestMatchEmployee && (
                                            <div className="flex items-center justify-center p-1.5 bg-green-100 dark:bg-green-500/20 rounded-lg border border-green-200 dark:border-green-500/30 shadow-md shadow-green-200/20 dark:shadow-[0_0_10px_rgba(34,197,94,0.2)] animate-pulse" title={`${t('warehouse.suggested')}: ${bestMatchEmployee.employee.name} `}>
                                                <span className="text-[10px]">💡</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedJob(job);
                                                setIsDetailsOpen(true);
                                            }}
                                            className="p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-transparent"
                                            title="View Details"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                            <button
                                                onClick={(e) => handleDelete(e, job.id)}
                                                className="p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-red-500 hover:text-white hover:border-red-500 border border-slate-200 dark:border-white/10 text-red-500 dark:text-red-500 rounded-lg transition-colors shadow-sm"
                                                title="Delete Job"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Information Row */}
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{job.items}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-tight">{t('warehouse.itemsLabel')}</span>
                                        </div>

                                        {/* Site Path Indicators */}
                                        <div className="flex items-center gap-1.5 pt-1">
                                            {job.sourceSiteId && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                    <span className="text-[9px] text-slate-500 dark:text-gray-400 uppercase font-black">{sites.find(s => s.id === job.sourceSiteId)?.name.split(' ')[0] || job.sourceSiteId}</span>
                                                </div>
                                            )}
                                            {(job.sourceSiteId && job.destSiteId) && <ArrowRight size={8} className="text-slate-300 dark:text-gray-700" />}
                                            {job.destSiteId && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                                    <span className="text-[9px] text-slate-500 dark:text-gray-400 uppercase font-black">{sites.find(s => s.id === job.destSiteId)?.name.split(' ')[0] || job.destSiteId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1 text-slate-400 dark:text-gray-500 mb-0.5">
                                            <Clock size={10} />
                                            <span className="text-[10px] font-black uppercase">ETA</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400">{estimatedDuration}m</span>
                                    </div>
                                </div>
                            </div>
                        );
                    });
                })()}
                {(() => {
                    const nonCompleted = ['pending', 'in-progress', 'assigned', 'accepted'];
                    let filtered = filteredJobs.filter(j => 
                        nonCompleted.includes(j.status?.toLowerCase() || '') && 
                        j.type !== 'TRANSFER' &&
                        ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH'].includes(j.type?.toUpperCase() || '')
                    );
                    if (assignJobFilter !== 'ALL') filtered = filtered.filter(j => j.type?.toLowerCase() === assignJobFilter.toLowerCase());
                    if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
                    if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));
                    return filtered.length === 0;
                })() && (
                        <div className="text-center py-8 text-slate-400 dark:text-gray-500 text-sm">{t('warehouse.noPendingJobsMatch')}</div>
                    )}
            </div>
        </div>
    );
};
