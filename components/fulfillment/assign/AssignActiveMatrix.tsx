import React, { useState } from 'react';
import { ClipboardCheck, Layers, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import { Employee, WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getEmployeeJobTitle } from '../../../utils/roles';
import { useFulfillmentData } from '../FulfillmentDataProvider';

interface AssignActiveMatrixProps {
    employees: Employee[];
    jobAssignments: any[];
    filteredJobs: WMSJob[];
    selectedJob: WMSJob | null;
    setSelectedJob: (j: WMSJob | null) => void;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    PICK:     { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', dot: 'bg-primary' },
    PACK:     { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-600 dark:bg-emerald-400' },
    RECEIVE:  { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-600 dark:bg-amber-400' },
    PUTAWAY:  { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-600 dark:bg-blue-400' },
    DISPATCH: { bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-600 dark:bg-purple-400' },
    DRIVER:   { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-600 dark:bg-cyan-400' },
    DEFAULT:  { bg: 'bg-[var(--theme-bg-subtle)]', text: 'text-[var(--theme-text-secondary)]', border: 'border-[var(--theme-border)]', dot: 'bg-[var(--theme-text-muted)]' },
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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 relative overflow-hidden group">
            <h3 className="font-semibold text-[var(--theme-text-primary)] mb-4 flex items-center gap-3 text-lg tracking-tight">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <ClipboardCheck className="text-primary" size={20} />
                </div>
                Live Operations Matrix
                {activeWorkers.length > 0 && (
                    <span className="text-[11px] font-mono tabular-nums text-[var(--theme-text-muted)] ml-auto">{activeWorkers.length} active</span>
                )}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {activeWorkers.map(({ employee, employeeJobs, jobsByType, totalJobs }) => {
                    const isExpanded = expandedWorker === employee.id;

                    return (
                        <div
                            key={employee.id}
                            className={`rounded-2xl border transition-colors overflow-hidden ${
                                isExpanded
                                    ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)]'
                            }`}
                        >
                            {/* Compact Header — always visible */}
                            <button
                                onClick={() => setExpandedWorker(isExpanded ? null : employee.id)}
                                className="w-full p-3 min-h-[44px] flex items-center gap-3 text-left touch-manipulation"
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-xs font-semibold text-[var(--theme-text-primary)]">
                                        {employee.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[var(--theme-bg-card)]" />
                                </div>

                                {/* Name + Role */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate leading-tight">{employee.name}</p>
                                    <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider mt-0.5">{getEmployeeJobTitle(employee)}</p>
                                </div>

                                {/* Job count badge */}
                                <div className="flex-shrink-0 flex items-center gap-1.5">
                                    <span className="text-[11px] font-mono tabular-nums font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                        {totalJobs}
                                    </span>
                                    {isExpanded ? <ChevronUp size={14} className="text-[var(--theme-text-muted)]" /> : <ChevronDown size={14} className="text-[var(--theme-text-muted)]" />}
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
                                                className={`inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
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
                                    <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-[var(--theme-border)]">
                                        {Object.entries(jobsByType).map(([type, jobs]) => {
                                            const style = getTypeStyle(type);
                                            return (
                                                <span
                                                    key={type}
                                                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${style.bg} ${style.text} border ${style.border}`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
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
                                                    className={`p-3 bg-[var(--theme-bg-card)] rounded-xl border transition-colors cursor-pointer touch-manipulation ${
                                                        isSelected
                                                            ? 'border-primary ring-1 ring-primary/30 bg-primary/5'
                                                            : 'border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)]'
                                                    }`}
                                                    onClick={() => setSelectedJob(isSelected ? null : job)}
                                                >
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md tracking-wider uppercase ${style.bg} ${style.text} border ${style.border}`}>
                                                            {job.type}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {canReassign && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-primary/10 text-[var(--theme-text-muted)] hover:text-primary rounded-xl transition-colors touch-manipulation"
                                                                    title="Reassign"
                                                                    aria-label="Reassign job"
                                                                >
                                                                    <RefreshCw size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); unassignJob(job.id); }}
                                                                className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-red-500/10 text-[var(--theme-text-muted)] hover:text-red-500 rounded-xl transition-colors touch-manipulation"
                                                                title="Unassign"
                                                                aria-label="Unassign job"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums font-medium">{formatJobId(job)}</p>
                                                    <p className="text-[11px] text-[var(--theme-text-muted)] font-mono tabular-nums flex items-center gap-1 mt-1">
                                                        <Layers size={12} className="text-[var(--theme-text-muted)]" />
                                                        {job.items} items
                                                    </p>
                                                    {isSelected && (
                                                        <span className="text-[11px] text-primary font-semibold uppercase tracking-wider mt-1 block">Select Worker →</span>
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
                <div className="text-center py-8 text-[var(--theme-text-muted)] text-sm">
                    No active assignments
                </div>
            )}
        </div>
    );
};
