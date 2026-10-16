import React, { useState } from 'react';
import { ArrowRight, SlidersHorizontal, RotateCcw, ArrowUpDown, Building2, Search, AlertTriangle, List, Check } from 'lucide-react';
import { WMSJob, Site, Employee } from '../../../types';
import { AssignJobCard } from './AssignJobCard';
import { canWorkerPerformJob } from '../../../utils/fulfillmentRoles';

interface AssignPendingJobsProps {
    filteredJobs: WMSJob[];
    historicalJobs: WMSJob[];
    assignJobFilter: string;
    setAssignJobFilter: (val: string) => void;
    dispatchPriorityFilter: string;
    setDispatchPriorityFilter: (val: string) => void;
    dispatchSearch: string;
    setDispatchSearch: (val: string) => void;
    assignSortBy: string;
    setAssignSortBy: (val: string) => void;
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
    historicalJobs,
    assignJobFilter,
    setAssignJobFilter,
    dispatchPriorityFilter,
    setDispatchPriorityFilter,
    dispatchSearch,
    setDispatchSearch,
    assignSortBy,
    setAssignSortBy,
    employees,
    jobAssignments,
    sites,
    selectedJob,
    setSelectedJob,
    setIsDetailsOpen,
    t
}) => {
    // Local filter and sorting states
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');
    const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
    const [jobSizeFilter, setJobSizeFilter] = useState<'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE'>('ALL');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Helper to check if a date matches today in local timezone
    const isToday = (dateStr?: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const today = new Date();
        return d.getFullYear() === today.getFullYear() &&
               d.getMonth() === today.getMonth() &&
               d.getDate() === today.getDate();
    };

    const activeJobsToday = filteredJobs;
    const historicalJobsToday = (historicalJobs || []).filter(j => isToday(j.completedAt || j.completed_at || j.createdAt || j.created_at));

    const wmsJobTypes = ['ALL', 'PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH', 'DISPATCH'];
    const nonCompleted = ['pending', 'in-progress', 'assigned', 'accepted'];

    // 1. Get raw WMS active jobs
    const baseWmsJobs = activeJobsToday.filter(j => 
        nonCompleted.includes(j.status?.toLowerCase() || '') &&
        j.type !== 'TRANSFER' &&
        ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH', 'DISPATCH'].includes(j.type?.toUpperCase() || '')
    );

    // Helper to count jobs for each tab under current active filters
    const getJobTypeCount = (type: string) => {
        let list = baseWmsJobs;
        if (type !== 'ALL') {
            list = list.filter(j => j.type?.toUpperCase() === type.toUpperCase());
        }
        if (dispatchPriorityFilter !== 'ALL') {
            list = list.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
        }
        if (dispatchSearch) {
            const query = dispatchSearch.toLowerCase();
            list = list.filter(j => 
                j.id.toLowerCase().includes(query) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(query)) ||
                (j.poNumber && j.poNumber.toLowerCase().includes(query))
            );
        }
        if (selectedSiteId !== 'ALL') {
            list = list.filter(j => j.sourceSiteId === selectedSiteId || j.destSiteId === selectedSiteId || j.siteId === selectedSiteId);
        }
        if (assignmentFilter === 'UNASSIGNED') {
            list = list.filter(j => !j.assignedTo && j.status?.toLowerCase() === 'pending');
        } else if (assignmentFilter === 'ASSIGNED') {
            list = list.filter(j => !!j.assignedTo || !['pending'].includes(j.status?.toLowerCase() || ''));
        }
        if (jobSizeFilter === 'SMALL') {
            list = list.filter(j => j.items < 5);
        } else if (jobSizeFilter === 'MEDIUM') {
            list = list.filter(j => j.items >= 5 && j.items <= 10);
        } else if (jobSizeFilter === 'LARGE') {
            list = list.filter(j => j.items > 10);
        }
        return list.length;
    };

    // Calculate completed WMS jobs
    let completedWmsJobs = historicalJobsToday.filter(j => 
        j.status?.toLowerCase() === 'completed' && 
        j.type !== 'TRANSFER' &&
        ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH', 'DISPATCH'].includes(j.type?.toUpperCase() || '')
    );

    if (assignJobFilter !== 'ALL') {
        completedWmsJobs = completedWmsJobs.filter(j => j.type?.toUpperCase() === assignJobFilter.toUpperCase());
    }
    if (dispatchPriorityFilter !== 'ALL') {
        completedWmsJobs = completedWmsJobs.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
    }
    if (dispatchSearch) {
        const query = dispatchSearch.toLowerCase();
        completedWmsJobs = completedWmsJobs.filter(j => 
            j.id.toLowerCase().includes(query) ||
            (j.orderRef && j.orderRef.toLowerCase().includes(query)) ||
            (j.poNumber && j.poNumber.toLowerCase().includes(query))
        );
    }
    if (selectedSiteId !== 'ALL') {
        completedWmsJobs = completedWmsJobs.filter(j => j.sourceSiteId === selectedSiteId || j.destSiteId === selectedSiteId || j.siteId === selectedSiteId);
    }

    // Apply filters to active jobs list
    let filteredActiveJobs = baseWmsJobs;
    if (assignJobFilter !== 'ALL') {
        filteredActiveJobs = filteredActiveJobs.filter(j => j.type?.toUpperCase() === assignJobFilter.toUpperCase());
    }
    if (dispatchPriorityFilter !== 'ALL') {
        filteredActiveJobs = filteredActiveJobs.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
    }
    if (dispatchSearch) {
        const query = dispatchSearch.toLowerCase();
        filteredActiveJobs = filteredActiveJobs.filter(j => 
            j.id.toLowerCase().includes(query) ||
            (j.orderRef && j.orderRef.toLowerCase().includes(query)) ||
            (j.poNumber && j.poNumber.toLowerCase().includes(query))
        );
    }
    if (selectedSiteId !== 'ALL') {
        filteredActiveJobs = filteredActiveJobs.filter(j => j.sourceSiteId === selectedSiteId || j.destSiteId === selectedSiteId || j.siteId === selectedSiteId);
    }
    if (assignmentFilter === 'UNASSIGNED') {
        filteredActiveJobs = filteredActiveJobs.filter(j => !j.assignedTo && j.status?.toLowerCase() === 'pending');
    } else if (assignmentFilter === 'ASSIGNED') {
        filteredActiveJobs = filteredActiveJobs.filter(j => !!j.assignedTo || !['pending'].includes(j.status?.toLowerCase() || ''));
    }
    if (jobSizeFilter === 'SMALL') {
        filteredActiveJobs = filteredActiveJobs.filter(j => j.items < 5);
    } else if (jobSizeFilter === 'MEDIUM') {
        filteredActiveJobs = filteredActiveJobs.filter(j => j.items >= 5 && j.items <= 10);
    } else if (jobSizeFilter === 'LARGE') {
        filteredActiveJobs = filteredActiveJobs.filter(j => j.items > 10);
    }

    // Sort jobs
    filteredActiveJobs.sort((a, b) => {
        let comparison = 0;
        if (assignSortBy === 'priority') {
            const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
            comparison = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
        } else if (assignSortBy === 'date') {
            comparison = new Date(a.createdAt || a.created_at || 0).getTime() - new Date(b.createdAt || b.created_at || 0).getTime();
        } else if (assignSortBy === 'items') {
            comparison = (a.items || 0) - (b.items || 0);
        } else if (assignSortBy === 'eta') {
            const etaA = a.type === 'PICK' ? Math.max(15, a.items * 3) : a.type === 'PACK' ? Math.max(10, a.items * 2) : Math.max(20, a.items * 4);
            const etaB = b.type === 'PICK' ? Math.max(15, b.items * 3) : b.type === 'PACK' ? Math.max(10, b.items * 2) : Math.max(20, b.items * 4);
            comparison = etaA - etaB;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const unassignedCount = filteredActiveJobs.filter(j => !j.assignedTo && j.status?.toLowerCase() === 'pending').length;
    const assignedCount = filteredActiveJobs.filter(j => !!j.assignedTo || !['pending'].includes(j.status?.toLowerCase() || '')).length;
    const totalCount = filteredActiveJobs.length + completedWmsJobs.length;

    const handleClearFilters = () => {
        setAssignJobFilter('ALL');
        setDispatchPriorityFilter('ALL');
        setDispatchSearch('');
        setSelectedSiteId('ALL');
        setAssignmentFilter('ALL');
        setJobSizeFilter('ALL');
        setAssignSortBy('priority');
        setSortDirection('asc');
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex flex-col overflow-hidden h-[800px]">
            {/* Header section */}
            <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-semibold text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.pendingJobs')}</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 ml-1 font-mono tabular-nums text-xs font-semibold">
                        {filteredActiveJobs.length}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {!selectedJob && filteredActiveJobs.filter(j => j.status?.toLowerCase() === 'pending').length > 0 && (
                        <span className="text-xs text-primary font-medium hidden sm:flex items-center gap-1">
                            <ArrowRight size={12} /> {t('warehouse.selectJobToAssign')}
                        </span>
                    )}
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-colors min-h-[38px] touch-manipulation cursor-pointer ${
                            isAdvancedOpen 
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm' 
                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'
                        }`}
                    >
                        <SlidersHorizontal size={14} />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Quick Job Type Tabs */}
            <div className="flex items-center gap-1.5 p-2 bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] overflow-x-auto scrollbar-none">
                {wmsJobTypes.map(type => {
                    const count = getJobTypeCount(type);
                    const isActive = assignJobFilter.toUpperCase() === type.toUpperCase();
                    return (
                        <button
                            key={type}
                            onClick={() => setAssignJobFilter(type)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap min-h-[38px] transition-colors touch-manipulation cursor-pointer ${
                                isActive
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                    : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card)]'
                            }`}
                        >
                            <span>{type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-semibold ${
                                isActive 
                                    ? 'bg-[var(--theme-primary-text)]/15 text-[var(--theme-primary-text)]' 
                                    : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)]'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Advanced Filters panel (Collapsible) */}
            {isAdvancedOpen && (
                <div className="p-4 bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] space-y-4 animate-in fade-in slide-in-from-top duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Site Filter */}
                        <div className="space-y-1.5">
                            <label htmlFor="site-filter-select" className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <Building2 size={12} /> Location / Site
                            </label>
                            <select
                                id="site-filter-select"
                                title="Filter by Location / Site"
                                aria-label="Filter by Location / Site"
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="woody-input text-xs font-medium py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] min-h-[38px]"
                            >
                                <option value="ALL">ALL SITES</option>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <AlertTriangle size={12} /> Priority
                            </label>
                            <div className="flex gap-1">
                                {['ALL', 'Critical', 'High', 'Normal'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setDispatchPriorityFilter(p)}
                                        className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider border transition-colors touch-manipulation cursor-pointer ${
                                            dispatchPriorityFilter === p
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-app)]'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assignment Status */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <Check size={12} /> Assignment Status
                            </label>
                            <div className="flex gap-1">
                                {(['ALL', 'UNASSIGNED', 'ASSIGNED'] as const).map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setAssignmentFilter(a)}
                                        className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider border transition-colors touch-manipulation cursor-pointer ${
                                            assignmentFilter === a
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-app)]'
                                        }`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <Search size={12} /> Search payload id or po
                            </label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={dispatchSearch}
                                onChange={(e) => setDispatchSearch(e.target.value)}
                                className="woody-input text-xs font-medium py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] min-h-[38px]"
                            />
                        </div>

                        {/* Job Size */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <List size={12} /> Job Size (Items)
                            </label>
                            <div className="flex gap-1">
                                {[
                                    { id: 'ALL', label: 'ALL' },
                                    { id: 'SMALL', label: 'SMALL (<5)' },
                                    { id: 'MEDIUM', label: 'MED (5-10)' },
                                    { id: 'LARGE', label: 'LRG (>10)' }
                                ].map(size => (
                                    <button
                                        key={size.id}
                                        onClick={() => setJobSizeFilter(size.id as any)}
                                        className={`flex-1 min-h-[38px] py-1.5 px-1 rounded-xl text-[11px] font-semibold uppercase tracking-wider border transition-colors touch-manipulation cursor-pointer ${
                                            jobSizeFilter === size.id
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-app)]'
                                        }`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sorting Direction & Order */}
                        <div className="space-y-1.5">
                            <label htmlFor="sort-jobs-select" className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1">
                                <ArrowUpDown size={12} /> Sorting
                            </label>
                            <div className="flex gap-1.5">
                                <select
                                    id="sort-jobs-select"
                                    title="Sort jobs by"
                                    aria-label="Sort jobs by"
                                    value={assignSortBy}
                                    onChange={(e) => setAssignSortBy(e.target.value)}
                                    className="woody-input text-xs font-medium py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] min-h-[38px] flex-1"
                                >
                                    <option value="priority">Priority</option>
                                    <option value="date">Date</option>
                                    <option value="items">Items count</option>
                                    <option value="eta">ETA Time</option>
                                </select>
                                <button
                                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                    className="min-h-[38px] px-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-app)] flex items-center justify-center transition-colors touch-manipulation"
                                    title={`Toggle order: current is ${sortDirection}`}
                                    aria-label={`Toggle order: current is ${sortDirection}`}
                                >
                                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                    <span className="text-[11px] font-semibold ml-1 uppercase">{sortDirection}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="flex justify-end pt-1">
                        <button
                            onClick={handleClearFilters}
                            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-amber-500/20 active:scale-95 transition-all touch-manipulation"
                        >
                            <RotateCcw size={14} />
                            Reset All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* WMS Stats Summary Bar */}
            <div className="p-3 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3 flex flex-col shadow-sm">
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Unassigned</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-primary mt-0.5">{unassignedCount}</span>
                </div>
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3 flex flex-col shadow-sm">
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Assigned</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5">{assignedCount}</span>
                </div>
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3 flex flex-col shadow-sm">
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Total</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">{totalCount}</span>
                </div>
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3 flex flex-col shadow-sm">
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Completed</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{completedWmsJobs.length}</span>
                </div>
            </div>

            {/* Jobs list container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredActiveJobs.length > 0 ? (
                    filteredActiveJobs.map(job => {
                        const bestMatchEmployee = employees
                            .filter(e => e.status === 'Active' && e.role?.toLowerCase() !== 'super_admin' && canWorkerPerformJob(e.role, job.type))
                            .map(e => {
                                const activeAssignments = jobAssignments.filter(
                                    a => a.employeeId === e.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                );
                                return { employee: e, workload: activeAssignments.length };
                            })
                            .sort((a, b) => a.workload - b.workload)[0];

                        const isAssigned = !!job.assignedTo || !['pending'].includes(job.status?.toLowerCase() || '');
                        const isSelected = selectedJob?.id === job.id;

                        return (
                            <AssignJobCard
                                key={job.id}
                                job={job}
                                isAssigned={isAssigned}
                                isSelected={isSelected}
                                bestMatchEmployee={bestMatchEmployee}
                                setSelectedJob={setSelectedJob}
                                setIsDetailsOpen={setIsDetailsOpen}
                                sites={sites}
                                employees={employees}
                                t={t}
                            />
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-[var(--theme-text-muted)] text-sm">
                        {t('warehouse.noPendingJobsMatch')}
                    </div>
                )}
            </div>
        </div>
    );
};
