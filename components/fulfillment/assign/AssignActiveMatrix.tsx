import React, { useState } from 'react';
import { ClipboardCheck, Layers, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import { Employee, WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useFulfillmentData } from '../FulfillmentDataProvider';

interface AssignActiveMatrixProps {
    employees: Employee[];
    jobAssignments: any[];
    filteredJobs: WMSJob[];
    selectedJob: WMSJob | null;
    setSelectedJob: (j: WMSJob | null) => void;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    PICK:     { bg: 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20',   text: 'text-[#2C5E3B] dark:text-[#A9CBA2]',        border: 'border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20',   dot: 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' },
    PACK:     { bg: 'bg-green-100 dark:bg-green-500/10',        text: 'text-green-700 dark:text-green-400',          border: 'border-green-200 dark:border-green-500/20',       dot: 'bg-green-600 dark:bg-green-400' },
    RECEIVE:  { bg: 'bg-amber-100 dark:bg-amber-500/10',        text: 'text-amber-700 dark:text-amber-400',          border: 'border-amber-200 dark:border-amber-500/20',       dot: 'bg-amber-600 dark:bg-amber-400' },
    PUTAWAY:  { bg: 'bg-[#EAE5D9] dark:bg-[#A9CBA2]/10',       text: 'text-[#2C5E3B] dark:text-[#A9CBA2]',        border: 'border-[#E2DCCE] dark:border-[#A9CBA2]/20',       dot: 'bg-[#2C5E3B]/70 dark:bg-[#A9CBA2]/70' },
    DISPATCH: { bg: 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5',      text: 'text-[#2C5E3B]/80 dark:text-[#A9CBA2]/80',  border: 'border-[#2C5E3B]/10 dark:border-[#A9CBA2]/10',   dot: 'bg-[#2C5E3B]/60 dark:bg-[#A9CBA2]/60' },
    DRIVER:   { bg: 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5',      text: 'text-[#2C5E3B]/80 dark:text-[#A9CBA2]/80',  border: 'border-[#2C5E3B]/10 dark:border-[#A9CBA2]/10',   dot: 'bg-[#2C5E3B]/60 dark:bg-[#A9CBA2]/60' },
    DEFAULT:  { bg: 'bg-[#FAF8F5] dark:bg-[#1C2620]/40',       text: 'text-[#2C5E3B] dark:text-[#A9CBA2]',        border: 'border-[#E2DCCE] dark:border-[#A9CBA2]/10',       dot: 'bg-[#2C5E3B]/50 dark:bg-[#A9CBA2]/50' },
};

const getTypeStyle = (type: string) => TYPE_STYLES[type] || TYPE_STYLES.DEFAULT;

export const AssignActiveMatrix: React.FC<AssignActiveMatrixProps> = ({
    employees,
    jobAssignments,
    filteredJobs,
    selectedJob,
    setSelectedJob
}) => {
    const { unassignJob } = useFulfillmentData();
    const [expandedWorker, setExpandedWorker] = useState<string | null>(null);

    const activeWorkers = employees
        .filter(e => [
            'picker', 'packer', 'dispatcher', 'warehouse_manager', 'driver', 'receiver',
            'inventory_specialist', 'forklift_operator', 'auditor', 'admin',
            'regional_manager', 'operations_manager'
        ].includes((e.role || '').toLowerCase()) && e.status?.toLowerCase() === 'active')
        .map(employee => {
            const employeeAssignments = jobAssignments.filter(
                a => a.employeeId === employee.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
            );
            const employeeJobs = filteredJobs.filter(j =>
                employeeAssignments.some(a => a.jobId === j.id) &&
                !['Completed', 'Cancelled'].includes(j.status || '')
            );
            if (employeeJobs.length === 0) return null;

            // Group jobs by type
            const jobsByType: Record<string, WMSJob[]> = {};
            employeeJobs.forEach(job => {
                const type = job.type || 'OTHER';
                if (!jobsByType[type]) jobsByType[type] = [];
                jobsByType[type].push(job);
            });

            return { employee, employeeJobs, jobsByType, totalJobs: employeeJobs.length };
        })
        .filter(Boolean) as { employee: Employee; employeeJobs: WMSJob[]; jobsByType: Record<string, WMSJob[]>; totalJobs: number }[];

    return (
        <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 blur-[80px] rounded-full pointer-events-none" />

            <h3 className="font-extrabold text-stone-900 dark:text-white mb-5 flex items-center gap-3 text-xl tracking-tight">
                <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 rounded-xl transition-colors">
                    <ClipboardCheck className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={24} />
                </div>
                Live Operations Matrix
                {activeWorkers.length > 0 && (
                    <span className="text-xs font-mono text-stone-400 dark:text-stone-500 ml-auto">{activeWorkers.length} active</span>
                )}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {activeWorkers.map(({ employee, employeeJobs, jobsByType, totalJobs }) => {
                    const isExpanded = expandedWorker === employee.id;

                    return (
                        <div
                            key={employee.id}
                            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                isExpanded
                                    ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 bg-stone-50 dark:bg-black/20 border-[#E2DCCE]/50 dark:border-[#A9CBA2]/20'
                                    : 'bg-stone-50/50 dark:bg-[#1C2620]/30 border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] hover:border-[#CFC6B4]/60 dark:hover:border-[#A9CBA2]/10 hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10'
                            }`}
                        >
                            {/* Compact Header — always visible */}
                            <button
                                onClick={() => setExpandedWorker(isExpanded ? null : employee.id)}
                                className="w-full p-3 flex items-center gap-3 text-left"
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-stone-100 via-stone-50 to-stone-200 dark:from-[#A9CBA2]/10 dark:via-black/20 dark:to-black/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/20 flex items-center justify-center text-sm font-black text-stone-600 dark:text-[#A9CBA2] shadow-sm transition-colors">
                                        {employee.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-full border-2 border-white dark:border-[#18201B]" />
                                </div>

                                {/* Name + Role */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-stone-900 dark:text-white truncate leading-tight transition-colors">{employee.name}</p>
                                    <p className="text-[8px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest mt-0.5 transition-colors">{employee.role}</p>
                                </div>

                                {/* Job count badge */}
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <span className="text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-2 py-0.5 rounded-lg border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 transition-colors">
                                        {totalJobs}
                                    </span>
                                    {isExpanded ? <ChevronUp size={12} className="text-stone-400 dark:text-stone-500" /> : <ChevronDown size={12} className="text-stone-400 dark:text-stone-500" />}
                                </div>
                            </button>

                            {/* Type summary badges — always visible below header */}
                            {!isExpanded && (
                                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                                    {Object.entries(jobsByType).map(([type, jobs]) => {
                                        const style = getTypeStyle(type);
                                        return (
                                            <span
                                                key={type}
                                                className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border} transition-colors`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} transition-colors`} />
                                                {type} {jobs.length}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Expanded: full job details */}
                            {isExpanded && (
                                <div className="px-3 pb-4">
                                    {/* Type summary row */}
                                    <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors">
                                        {Object.entries(jobsByType).map(([type, jobs]) => {
                                            const style = getTypeStyle(type);
                                            return (
                                                <span
                                                    key={type}
                                                    className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${style.bg} ${style.text} border ${style.border} transition-colors`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${style.dot} transition-colors`} />
                                                    {type}: {jobs.length}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* Individual job cards in a compact grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                        {employeeJobs.map(job => {
                                            const style = getTypeStyle(job.type || 'DEFAULT');
                                            const isSelected = selectedJob?.id === job.id;
                                            const jobStatus = job.status?.toLowerCase();
                                            const canReassign = jobStatus === 'pending' || jobStatus === 'in-progress';

                                            return (
                                                <div
                                                    key={job.id}
                                                    className={`p-2.5 bg-stone-50/50 dark:bg-black/20 rounded-xl border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-[#2C5E3B] dark:border-[#A9CBA2] ring-1 ring-[#2C5E3B]/30 dark:ring-[#A9CBA2]/30 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5'
                                                            : 'border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] hover:border-[#CFC6B4]/60 dark:hover:border-[#A9CBA2]/10'
                                                    }`}
                                                    onClick={() => setSelectedJob(isSelected ? null : job)}
                                                >
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md tracking-widest uppercase ${style.bg} ${style.text} border ${style.border} transition-colors`}>
                                                            {job.type}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {canReassign && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                                                    className="p-1 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/20 text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] rounded transition-all transition-colors"
                                                                    title="Reassign"
                                                                >
                                                                    <RefreshCw size={10} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); unassignJob(job.id); }}
                                                                className="p-1 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-stone-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-all transition-colors"
                                                                title="Unassign"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-stone-550 dark:text-stone-400 font-mono font-bold tracking-tighter transition-colors">{formatJobId(job)}</p>
                                                    <p className="text-[8px] text-stone-400 dark:text-stone-500 font-bold flex items-center gap-1 mt-1 transition-colors">
                                                        <Layers size={8} className="text-stone-300 dark:text-stone-600 transition-colors" />
                                                        {job.items} items
                                                    </p>
                                                    {isSelected && (
                                                        <span className="text-[7px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest mt-1 block animate-pulse">Select Worker →</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {activeWorkers.length === 0 && (
                <div className="text-center py-8 text-stone-450 dark:text-stone-500 text-sm transition-colors">
                    No active assignments
                </div>
            )}
        </div>
    );
};
