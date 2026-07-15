import React from 'react';
import { ArrowRight, Eye, Clock, Trash2 } from 'lucide-react';
import { WMSJob, Site, Employee } from '../../../types';
import { formatJobId, formatOrderRef } from '../../../utils/jobIdFormatter';
import { useFulfillment } from '../FulfillmentContext';
import { useStore } from '../../../contexts/CentralStore';

interface AssignJobCardProps {
    job: WMSJob;
    isAssigned: boolean;
    isSelected: boolean;
    bestMatchEmployee?: { employee: Employee; workload: number };
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    sites: Site[];
    employees: Employee[];
    t: (key: string) => string;
}

export const AssignJobCard: React.FC<AssignJobCardProps> = ({
    job,
    isAssigned,
    isSelected,
    bestMatchEmployee,
    setSelectedJob,
    setIsDetailsOpen,
    sites,
    employees,
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

    // Calculate estimated duration
    let estimatedDuration = 15;
    if (job.type === 'PICK') estimatedDuration = Math.max(15, job.items * 3);
    else if (job.type === 'PACK') estimatedDuration = Math.max(10, job.items * 2);
    else if (job.type === 'PUTAWAY') estimatedDuration = Math.max(20, job.items * 4);

    let cardClass = '';
    if (isAssigned) {
        if (isSelected) {
            cardClass = 'bg-stone-200 dark:bg-zinc-700/80 border-stone-400 dark:border-zinc-650 border-l-4 border-l-stone-500 dark:border-l-zinc-500 shadow-sm';
        } else {
            cardClass = 'bg-stone-100 dark:bg-zinc-800/40 border-stone-200 dark:border-zinc-800/40 border-l-4 border-l-stone-300 dark:border-l-zinc-600 hover:bg-stone-200/50 dark:hover:bg-zinc-800/60 cursor-pointer';
        }
    } else {
        if (isSelected) {
            cardClass = 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/10 border-[#2C5E3B] dark:border-[#A9CBA2] border-l-4 border-l-[#2C5E3B] dark:border-l-[#A9CBA2] shadow-sm scale-[1.01]';
        } else {
            cardClass = 'bg-[#FAFDFB] dark:bg-[#152319]/40 border-emerald-100 dark:border-[#2C5E3B]/10 border-l-4 border-l-[#2C5E3B] dark:border-l-[#A9CBA2] hover:border-emerald-250 dark:hover:border-[#A9CBA2]/25 hover:bg-[#2C5E3B]/5 dark:hover:bg-[#2C5E3B]/5 hover:scale-[1.01] cursor-pointer';
        }
    }

    const assignee = job.assignedTo ? employees.find(e => e.id === job.assignedTo) : null;

    return (
        <div
            onClick={() => {
                setSelectedJob(job);
                setIsDetailsOpen(false);
            }}
            className={`p-4 rounded-2xl border transition-all duration-300 ${cardClass}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded shadow-sm tracking-tighter uppercase ${
                            isAssigned
                                ? 'bg-stone-200/60 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-300 dark:border-zinc-700'
                                : job.type === 'PICK' ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20' :
                                  job.type === 'PACK' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-500/30' :
                                  job.type === 'RECEIVE' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                                  (job.type === 'DRIVER' || job.type === 'DISPATCH') ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 text-[#2C5E3B]/80 dark:text-[#A9CBA2]/80 border border-[#2C5E3B]/10 dark:border-[#A9CBA2]/10' :
                                  'bg-[#FAF8F5] dark:bg-[#1C2620]/40 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-[#A9CBA2]/10'} `}>
                            {job.type}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-tighter uppercase border ${
                            isAssigned
                                ? 'bg-stone-200/40 dark:bg-zinc-800/40 text-stone-500 dark:text-stone-550 border-stone-300/40 dark:border-zinc-700/60'
                                : job.priority === 'Critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' :
                                  job.priority === 'High' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' :
                                  'bg-[#EAE5D9] dark:bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]/60 border-[#E2DCCE] dark:border-[#A9CBA2]/10'
                        } `}>
                            {job.priority}
                        </span>
                        {job.status?.toLowerCase() !== 'pending' && (
                            <span className="text-[8px] px-2 py-0.5 rounded font-black tracking-tighter uppercase bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                                {job.status}
                            </span>
                        )}
                    </div>
                    {assignee && (
                        <div className="flex items-center gap-1.5 mt-0.5 mb-1">
                            <div className="w-4 h-4 rounded-md bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30 flex items-center justify-center text-[8px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">
                                {assignee.name?.charAt(0)}
                            </div>
                            <span className="text-[9px] text-stone-550 dark:text-stone-400 font-bold">{assignee.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-black tracking-widest">{formatJobId(job)}</span>
                        {job.orderRef && job.type !== 'PICK' && (
                            <span className="text-[9px] text-stone-400 dark:text-stone-500 font-bold border-l border-[#E2DCCE]/30 dark:border-emerald-950/20 pl-2">
                                PO: {formatOrderRef(job.orderRef)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isAssigned && bestMatchEmployee && (
                        <div className="flex items-center justify-center p-1.5 bg-green-100 dark:bg-green-500/20 rounded-lg border border-green-200 dark:border-green-500/30 shadow-md shadow-green-200/20 dark:shadow-[0_0_10px_rgba(34,197,94,0.2)] animate-pulse" title={`${t('warehouse.suggested')}: ${bestMatchEmployee.employee.name}`}>
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
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B]/50" />
                                <span className="text-[9px] text-slate-550 dark:text-gray-400 uppercase font-black">
                                    {sites.find(s => s.id === job.sourceSiteId)?.name.split(' ')[0] || job.sourceSiteId}
                                </span>
                            </div>
                        )}
                        {(job.sourceSiteId && job.destSiteId) && <ArrowRight size={8} className="text-slate-300 dark:text-gray-700" />}
                        {job.destSiteId && (
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                <span className="text-[9px] text-slate-550 dark:text-gray-400 uppercase font-black">
                                    {sites.find(s => s.id === job.destSiteId)?.name.split(' ')[0] || job.destSiteId}
                                </span>
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
};
