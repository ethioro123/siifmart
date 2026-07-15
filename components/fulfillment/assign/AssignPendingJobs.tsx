import React, { useState } from 'react';
import { ArrowRight, SlidersHorizontal, RotateCcw, ArrowUpDown, Building2, Search, AlertTriangle, List, Check } from 'lucide-react';
import { WMSJob, Site, Employee } from '../../../types';
import { AssignJobCard } from './AssignJobCard';
import { useStore } from '../../../contexts/CentralStore';

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
    const { user } = useStore();

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

    // Filter lists to only include today's jobs for WMS stats and lists
    const activeJobsToday = filteredJobs;
    const historicalJobsToday = (historicalJobs || []).filter(j => isToday(j.completedAt || j.completed_at || j.createdAt || j.created_at));

    const wmsJobTypes = ['ALL', 'PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH'];
    const nonCompleted = ['pending', 'in-progress', 'assigned', 'accepted'];

    // 1. Get raw WMS active jobs
    const baseWmsJobs = activeJobsToday.filter(j => 
        nonCompleted.includes(j.status?.toLowerCase() || '') &&
        j.type !== 'TRANSFER' &&
        ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH'].includes(j.type?.toUpperCase() || '')
    );

    // Helper to count jobs for each tab under current active filters
    const getJobTypeCount = (type: string) => {
        let list = baseWmsJobs;
        if (type !== 'ALL') {
            list = list.filter(j => j.type?.toUpperCase() === type.toUpperCase());
        }
        // Apply priority filter
        if (dispatchPriorityFilter !== 'ALL') {
            list = list.filter(j => j.priority?.toLowerCase() === dispatchPriorityFilter.toLowerCase());
        }
        // Apply search query (job ID / PO Number)
        if (dispatchSearch) {
            const query = dispatchSearch.toLowerCase();
            list = list.filter(j => 
                j.id.toLowerCase().includes(query) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(query)) ||
                (j.poNumber && j.poNumber.toLowerCase().includes(query))
            );
        }
        // Apply site filter
        if (selectedSiteId !== 'ALL') {
            list = list.filter(j => j.sourceSiteId === selectedSiteId || j.destSiteId === selectedSiteId || j.siteId === selectedSiteId);
        }
        // Apply assignment status filter
        if (assignmentFilter === 'UNASSIGNED') {
            list = list.filter(j => !j.assignedTo && j.status?.toLowerCase() === 'pending');
        } else if (assignmentFilter === 'ASSIGNED') {
            list = list.filter(j => !!j.assignedTo || !['pending'].includes(j.status?.toLowerCase() || ''));
        }
        // Apply job size filter
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
        ['PICK', 'PACK', 'PUTAWAY', 'RECEIVE', 'COUNT', 'REPLENISH'].includes(j.type?.toUpperCase() || '')
    );

    // Apply filters to completed jobs count
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
            let etaA = a.type === 'PICK' ? Math.max(15, a.items * 3) : a.type === 'PACK' ? Math.max(10, a.items * 2) : Math.max(20, a.items * 4);
            let etaB = b.type === 'PICK' ? Math.max(15, b.items * 3) : b.type === 'PACK' ? Math.max(10, b.items * 2) : Math.max(20, b.items * 4);
            comparison = etaA - etaB;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Counts for Stats Bar
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
        <div className="glass-panel flex flex-col overflow-hidden h-[800px]">
            {/* Header section */}
            <div className="p-4 border-b border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] bg-stone-50/50 dark:bg-black/20 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse" />
                    <span className="font-black text-[10px] text-stone-550 dark:text-stone-400 uppercase tracking-widest">{t('warehouse.pendingJobs')}</span>
                    <span className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] px-2 py-0.5 rounded-full border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 ml-1 font-bold text-[10px]">
                        {filteredActiveJobs.length}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {!selectedJob && filteredActiveJobs.filter(j => j.status?.toLowerCase() === 'pending').length > 0 && (
                        <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-medium hidden sm:flex items-center gap-1">
                            <ArrowRight size={10} /> {t('warehouse.selectJobToAssign')}
                        </span>
                    )}
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            isAdvancedOpen 
                                ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] dark:bg-[#A9CBA2] dark:text-black dark:border-[#A9CBA2]' 
                                : 'bg-stone-150/40 dark:bg-white/5 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-white/5 hover:bg-stone-200/50 dark:hover:bg-white/10'
                        }`}
                    >
                        <SlidersHorizontal size={12} />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Quick Job Type Tabs (Simple) */}
            <div className="flex items-center gap-1 p-2 bg-stone-100/30 dark:bg-black/10 border-b border-[#E2DCCE]/20 dark:border-[#A9CBA2]/[0.02] overflow-x-auto scrollbar-none">
                {wmsJobTypes.map(type => {
                    const count = getJobTypeCount(type);
                    const isActive = assignJobFilter.toUpperCase() === type.toUpperCase();
                    return (
                        <button
                            key={type}
                            onClick={() => setAssignJobFilter(type)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-[#2C5E3B] text-white shadow-sm dark:bg-[#A9CBA2] dark:text-black'
                                    : 'text-stone-550 dark:text-stone-400 hover:bg-stone-150/50 dark:hover:bg-white/5'
                            }`}
                        >
                            <span>{type}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                                isActive 
                                    ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black' 
                                    : 'bg-stone-200/60 text-stone-600 dark:bg-white/10 dark:text-stone-400'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Advanced Filters panel (Collapsible) */}
            {isAdvancedOpen && (
                <div className="p-4 bg-stone-50/70 dark:bg-zinc-900/60 border-b border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] space-y-4 animate-in fade-in slide-in-from-top duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Site Filter */}
                        <div className="space-y-1.5">
                            <label htmlFor="site-filter-select" className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <Building2 size={10} /> Location / Site
                            </label>
                            <select
                                id="site-filter-select"
                                title="Filter by Location / Site"
                                aria-label="Filter by Location / Site"
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="woody-input text-[10px] font-bold py-1.5"
                            >
                                <option value="ALL">ALL SITES</option>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <AlertTriangle size={10} /> Priority
                            </label>
                            <div className="flex gap-1">
                                {['ALL', 'Critical', 'High', 'Normal'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setDispatchPriorityFilter(p)}
                                        className={`flex-1 py-1 px-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider border transition-all ${
                                            dispatchPriorityFilter === p
                                                ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] dark:bg-[#A9CBA2] dark:text-black dark:border-[#A9CBA2]'
                                                : 'bg-white dark:bg-white/5 text-stone-600 dark:text-stone-400 border-[#E2DCCE]/50 dark:border-white/5 hover:bg-stone-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assignment Status */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <Check size={10} /> Assignment Status
                            </label>
                            <div className="flex gap-1">
                                {['ALL', 'UNASSIGNED', 'ASSIGNED'].map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setAssignmentFilter(a as any)}
                                        className={`flex-1 py-1 px-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider border transition-all ${
                                            assignmentFilter === a
                                                ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] dark:bg-[#A9CBA2] dark:text-black dark:border-[#A9CBA2]'
                                                : 'bg-white dark:bg-white/5 text-stone-600 dark:text-stone-400 border-[#E2DCCE]/50 dark:border-white/5 hover:bg-stone-50'
                                        }`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search field */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <Search size={10} /> Search payload id or po
                            </label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={dispatchSearch}
                                onChange={(e) => setDispatchSearch(e.target.value)}
                                className="woody-input text-[10px] font-bold py-1.5"
                            />
                        </div>

                        {/* Job Size */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <List size={10} /> Job Size (Items)
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
                                        className={`flex-1 py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${
                                            jobSizeFilter === size.id
                                                ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] dark:bg-[#A9CBA2] dark:text-black dark:border-[#A9CBA2]'
                                                : 'bg-white dark:bg-white/5 text-stone-600 dark:text-stone-400 border-[#E2DCCE]/50 dark:border-white/5 hover:bg-stone-50'
                                        }`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sorting Direction & Order */}
                        <div className="space-y-1.5">
                            <label htmlFor="sort-jobs-select" className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <ArrowUpDown size={10} /> Sorting
                            </label>
                            <div className="flex gap-1.5">
                                <select
                                    id="sort-jobs-select"
                                    title="Sort jobs by"
                                    aria-label="Sort jobs by"
                                    value={assignSortBy}
                                    onChange={(e) => setAssignSortBy(e.target.value)}
                                    className="woody-input text-[10px] font-bold py-1.5 flex-1"
                                >
                                    <option value="priority">Priority</option>
                                    <option value="date">Date</option>
                                    <option value="items">Items count</option>
                                    <option value="eta">ETA Time</option>
                                </select>
                                <button
                                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                    className="px-3 bg-white dark:bg-white/5 border border-[#E2DCCE]/50 dark:border-white/5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-white/10 flex items-center justify-center transition-all"
                                    title={`Toggle order: current is ${sortDirection}`}
                                >
                                    <ArrowUpDown size={12} className={sortDirection === 'asc' ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'} />
                                    <span className="text-[8px] font-black ml-1 uppercase">{sortDirection}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="flex justify-end pt-1">
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all"
                        >
                            <RotateCcw size={10} />
                            Reset All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* WMS Stats Summary Bar */}
            <div className="p-3 border-b border-[#E2DCCE]/25 dark:border-[#A9CBA2]/[0.02] bg-stone-50/20 dark:bg-black/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/50 dark:bg-white/5 border border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.02] rounded-xl p-2.5 flex flex-col shadow-sm">
                    <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Unassigned</span>
                    <span className="text-base font-black text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5">{unassignedCount}</span>
                </div>
                <div className="bg-white/50 dark:bg-white/5 border border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.02] rounded-xl p-2.5 flex flex-col shadow-sm">
                    <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Assigned</span>
                    <span className="text-base font-black text-stone-550 dark:text-slate-400 mt-0.5">{assignedCount}</span>
                </div>
                <div className="bg-white/50 dark:bg-white/5 border border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.02] rounded-xl p-2.5 flex flex-col shadow-sm">
                    <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total</span>
                    <span className="text-base font-black text-[#8C6239] dark:text-[#E2C899] mt-0.5">{totalCount}</span>
                </div>
                <div className="bg-white/50 dark:bg-white/5 border border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.02] rounded-xl p-2.5 flex flex-col shadow-sm">
                    <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Completed</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{completedWmsJobs.length}</span>
                </div>
            </div>

            {/* Jobs list container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredActiveJobs.length > 0 ? (
                    filteredActiveJobs.map(job => {
                        // Find best match employee
                        const bestMatchEmployee = employees
                            .filter(e => {
                                const role = e.role?.toLowerCase();
                                if (role === 'super_admin') return false;
                                if (!['picker', 'packer', 'dispatcher', 'driver', 'warehouse_manager', 'receiver', 'inventory_specialist', 'admin', 'manager', 'regional_manager', 'operations_manager'].includes(role)) return false;
                                if (e.status !== 'Active') return false;

                                if (['admin', 'manager', 'regional_manager', 'operations_manager'].includes(role)) return true;

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
                    <div className="text-center py-8 text-slate-400 dark:text-gray-500 text-sm">
                        {t('warehouse.noPendingJobsMatch')}
                    </div>
                )}
            </div>
        </div>
    );
};
