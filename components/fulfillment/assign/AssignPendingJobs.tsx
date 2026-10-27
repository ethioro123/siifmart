import { MAX_ACTIVE_JOBS, type AssignmentWorkload } from '../../../services/assignment-workloads.service';
import React, { useState } from 'react';
import { ArrowRight, SlidersHorizontal, RotateCcw, ArrowUpDown, Building2, Search, AlertTriangle, List, Check } from 'lucide-react';
import { WMSJob, Site, Employee } from '../../../types';
import { AssignJobCard } from './AssignJobCard';
import { canWorkerPerformJob } from '../../../utils/fulfillmentRoles';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AssignPendingJobsProps {
    workloads?: AssignmentWorkload[];
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
    t?: (key: string, params?: Record<string, any>) => string;
}

export const AssignPendingJobs: React.FC<AssignPendingJobsProps> = ({
    filteredJobs,
    historicalJobs,
    workloads,
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
    setIsDetailsOpen
}) => {
    const { t } = useLanguage();
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
                j.id.toLowerCase().includes(query) || (j.jobNumber || '').toLowerCase().includes(query) || (j.lineItems || []).some(item => (item.sku || '').toLowerCase().includes(query) || (item.name || '').toLowerCase().includes(query)) ||
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
            j.id.toLowerCase().includes(query) || (j.jobNumber || '').toLowerCase().includes(query) || (j.lineItems || []).some(item => (item.sku || '').toLowerCase().includes(query) || (item.name || '').toLowerCase().includes(query)) ||
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
            j.id.toLowerCase().includes(query) || (j.jobNumber || '').toLowerCase().includes(query) || (j.lineItems || []).some(item => (item.sku || '').toLowerCase().includes(query) || (item.name || '').toLowerCase().includes(query)) ||
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

    return <section aria-label={t('warehouse.jobQueueTitle')} className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-[var(--theme-border)]">
            <div>
                <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                    {t('warehouse.jobQueueTitle')} <span className="ml-1 text-[var(--theme-text-secondary)]">{filteredActiveJobs.length}</span>
                </h3>
                <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">{t('warehouse.jobQueueSubtitle')}</p>
            </div>
            <button type="button" aria-expanded={isAdvancedOpen} onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="min-h-[44px] rounded-lg border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-primary)] cursor-pointer">
                {t('warehouse.moreFilters')}
            </button>
        </div>
        <div className="flex flex-wrap gap-1 px-3 pt-3">
            {(['ALL','UNASSIGNED','ASSIGNED'] as const).map(filter => (
                <button
                    type="button"
                    key={filter}
                    aria-pressed={assignmentFilter === filter}
                    onClick={() => setAssignmentFilter(filter)}
                    className={`min-h-[44px] rounded-lg px-3 text-xs font-medium cursor-pointer ${assignmentFilter === filter ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'}`}
                >
                    {filter === 'ALL' ? t('warehouse.allActiveFilter') : filter === 'UNASSIGNED' ? t('warehouse.needsAssignmentFilter') : t('warehouse.assignedFilter')}
                </button>
            ))}
        </div>
        {isAdvancedOpen && (
            <div className="p-3 flex flex-wrap gap-2 border-b border-[var(--theme-border)]">
                <select aria-label={t('warehouse.allFacilities')} value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="min-h-[44px] min-w-0 max-w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-2 text-xs text-[var(--theme-text-primary)] cursor-pointer">
                    <option value="ALL">{t('warehouse.allFacilities')}</option>
                    {sites.map(site => <option value={site.id} key={site.id}>{site.name}</option>)}
                </select>
                <select aria-label={t('warehouse.allSizes')} value={jobSizeFilter} onChange={e => setJobSizeFilter(e.target.value as typeof jobSizeFilter)} className="min-h-[44px] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-2 text-xs text-[var(--theme-text-primary)] cursor-pointer">
                    <option value="ALL">{t('warehouse.allSizes')}</option>
                    <option value="SMALL">{t('warehouse.under5Items')}</option>
                    <option value="MEDIUM">{t('warehouse.items5To10')}</option>
                    <option value="LARGE">{t('warehouse.over10Items')}</option>
                </select>
                <button type="button" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} className="min-h-[44px] rounded-lg border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-primary)] cursor-pointer">
                    {t('warehouse.orderDirection', { direction: sortDirection === 'asc' ? t('warehouse.ascendingWord') : t('warehouse.descendingWord') })}
                </button>
                <button type="button" onClick={handleClearFilters} className="min-h-[44px] px-3 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer">
                    {t('warehouse.resetFilters')}
                </button>
            </div>
        )}
        <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto">                {filteredActiveJobs.length > 0 ? (
                    filteredActiveJobs.map(job => {
                        const bestMatchEmployee = employees
                            .filter(e => e.status?.toLowerCase() === 'active' && e.role?.toLowerCase() !== 'group_ceo' && canWorkerPerformJob(e.role, job.type))
                            .map(e => {
                                const current = workloads?.find(w => w.employeeId === e.id);
                                return { employee: e, workload: current?.active ?? MAX_ACTIVE_JOBS };
                            })
                            .filter(candidate => candidate.workload < MAX_ACTIVE_JOBS)
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
                )}</div>
    </section>;
};
