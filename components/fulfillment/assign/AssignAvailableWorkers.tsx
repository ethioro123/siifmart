import { useFloorStageEligibility } from '../../../hooks/useFloorStageEligibility';
import { MAX_ACTIVE_JOBS, type AssignmentWorkload } from '../../../services/assignment-workloads.service';
import React, { useRef, useState } from 'react';
import { Employee, WMSJob } from '../../../types';
import { Protected } from '../../Protected';
import { useFulfillment } from '../FulfillmentContext';
import { logger } from '../../../utils/logger';
import { canWorkerPerformJob, getJobAssignmentEligibility, isFloorWorkerRole } from '../../../utils/fulfillmentRoles';
import { getEmployeeJobTitle } from '../../../utils/roles';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface AssignAvailableWorkersProps {
    workloads?: AssignmentWorkload[];
    workloadReady?: boolean;
    workloadTimezone?: string;
    refreshWorkloads?: () => Promise<unknown>;
    filteredEmployees: Employee[];
    dispatchEmployeeFilter: string;
    setDispatchEmployeeFilter: (val: string) => void;
    dispatchEmployeeSearch: string;
    setDispatchEmployeeSearch: (val: string) => void;
    isEmployeeRoleDropdownOpen: boolean;
    setIsEmployeeRoleDropdownOpen: (val: boolean) => void;
    jobAssignments: any[];
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsSubmitting: (val: boolean) => void;
    refreshData: () => Promise<void>;
    addNotification: (type: string, message: string) => void;
    wmsJobsService: any;
    assignCurrentPage: number;
    setAssignCurrentPage: (val: number | ((prev: number) => number)) => void;
    ASSIGN_ITEMS_PER_PAGE: number;
    t: (key: string) => string;
}

export const AssignAvailableWorkers: React.FC<AssignAvailableWorkersProps> = ({ workloads, workloadReady = false, workloadTimezone, refreshWorkloads, filteredEmployees, dispatchEmployeeFilter, setDispatchEmployeeFilter, dispatchEmployeeSearch, setDispatchEmployeeSearch, jobAssignments, selectedJob, setSelectedJob, setIsSubmitting, refreshData, addNotification, assignCurrentPage, setAssignCurrentPage, ASSIGN_ITEMS_PER_PAGE }) => {
    const { assignJob } = useFulfillment();
    const verification = useFloorStageEligibility(selectedJob);
    const [busy, setBusy] = useState<string | null>(null);
    const lock = useRef(false);
    const team = filteredEmployees.filter(employee => employee.status?.toLowerCase() === 'active' && (isFloorWorkerRole(employee.role) || ['country_managing_director','regional_operations_manager','country_operations_director','warehouse_manager','dispatcher','driver','auditor'].includes(employee.role?.toLowerCase())));
    const workload = (id: string) => workloadReady ? workloads?.find(w => w.employeeId === id) : undefined;
    const activeCount = (id: string) => workload(id)?.active ?? 0;
    const atCapacity = (id: string) => selectedJob?.assignedTo !== id && activeCount(id) >= MAX_ACTIVE_JOBS;
    const matches = team.filter(e => (dispatchEmployeeFilter === 'ALL' || e.role === dispatchEmployeeFilter) && `${e.name} ${e.code || ''}`.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase())).sort((a,b) => {
        const aMatch = selectedJob && canWorkerPerformJob(a.role, selectedJob.type) ? 1 : 0;
        const bMatch = selectedJob && canWorkerPerformJob(b.role, selectedJob.type) ? 1 : 0;
        return bMatch - aMatch || activeCount(a.id) - activeCount(b.id) || a.name.localeCompare(b.name);
    });
    const pages = Math.max(1, Math.ceil(matches.length / ASSIGN_ITEMS_PER_PAGE));
    const page = Math.min(Math.max(1, assignCurrentPage), pages);
    const visible = matches.slice((page - 1) * ASSIGN_ITEMS_PER_PAGE, page * ASSIGN_ITEMS_PER_PAGE);
    const assign = async (employee: Employee) => {
        if (!verification.ready || verification.excluded.includes(employee.id) || !selectedJob || lock.current || !workload(employee.id) || atCapacity(employee.id) || !getJobAssignmentEligibility(employee.role, selectedJob.type).eligible) return;
        lock.current = true; setBusy(employee.id); setIsSubmitting(true);
        try { await assignJob(selectedJob.id, employee.id); addNotification('success', `Job assigned to ${employee.name}`); setSelectedJob(null); try { await Promise.all([refreshData(), refreshWorkloads?.()]); } catch (refreshError) { logger.warn('AssignAvailableWorkers', 'Assignment saved; refresh failed', { error: refreshError instanceof Error ? refreshError.message : String(refreshError) }); } }
        catch (error) { logger.error('AssignAvailableWorkers', 'Failed to assign job', error); addNotification('alert', error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to assign job'); refreshWorkloads?.(); }
        finally { lock.current = false; setBusy(null); setIsSubmitting(false); }
    };
    return <section id="assignment-team" aria-label="Assignment team" className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] overflow-hidden scroll-mt-4">
        <header className="p-4 border-b border-[var(--theme-border)]"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Team <span className="text-[var(--theme-text-secondary)]">{team.length}</span></h3><span className="text-xs text-[var(--theme-text-secondary)]">Limit: 100 active jobs per person</span></div>
            <p className="mt-2 text-xs text-[var(--theme-text-secondary)]">{selectedJob ? `Assigning ${selectedJob.type} ${formatJobId(selectedJob)}. Choose a team member below.` : 'Select a job in the queue to see eligible team members.'}</p>
            <p className="mt-2 text-xs text-[var(--theme-text-secondary)]">{workloadReady ? `Completed today uses ${workloadTimezone || 'the configured timezone'}. Counts refresh every 15 seconds.` : 'Workload unavailable or loading. Assignments are disabled until counts are confirmed.'}</p>
            <div className="mt-3 flex flex-wrap gap-2"><input type="search" aria-label="Search assignment team" placeholder="Search name or staff code" value={dispatchEmployeeSearch} onChange={e => { setDispatchEmployeeSearch(e.target.value); setAssignCurrentPage(1); }} className="min-w-0 flex-1 basis-full sm:basis-auto min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)]" /><select aria-label="Staff role" value={dispatchEmployeeFilter} onChange={e => { setDispatchEmployeeFilter(e.target.value); setAssignCurrentPage(1); }} className="min-h-[44px] max-w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-2 text-xs text-[var(--theme-text-primary)]"><option value="ALL">All roles</option>{[...new Set(team.map(e => e.role))].map(role => <option key={role} value={role}>{role.replace(/_/g,' ')}</option>)}</select></div>
        </header>
        <div className="max-h-[65vh] overflow-y-auto divide-y divide-[var(--theme-border)]">
            {visible.map(employee => {
                const eligibility = selectedJob ? !verification.ready ? {eligible:false,reason:'Checking independent verifier…'} : verification.excluded.includes(employee.id) ? {eligible:false,reason:'Handled another stage of this order; choose an independent worker.'} : getJobAssignmentEligibility(employee.role, selectedJob.type) : null;
                const initials = employee.name.replace(/^\[TEST\]\s*/,'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word => word[0]).join('');
                return <div key={employee.id} className="flex items-start gap-3 p-4">
                    <div aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-[var(--theme-bg-subtle)] text-xs font-semibold text-[var(--theme-text-secondary)]">{initials}</div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[var(--theme-text-primary)] break-words">{employee.name}</p><p className="mt-1 text-xs text-[var(--theme-text-secondary)] break-words">{getEmployeeJobTitle(employee)} · {workload(employee.id) ? `${activeCount(employee.id)} / ${MAX_ACTIVE_JOBS} active · ${workload(employee.id)!.completedToday} completed today` : 'Workload unavailable'}</p>{atCapacity(employee.id) && <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Active job limit reached</p>}{eligibility && !eligibility.eligible && <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{eligibility.reason || 'Not eligible for this job'}</p>}</div>
                    <Protected permission="ASSIGN_TASKS"><button type="button" disabled={!eligibility?.eligible || !!busy || !workload(employee.id) || atCapacity(employee.id)} aria-label={`Assign job to ${employee.name}`} onClick={() => assign(employee)} className="min-h-[44px] shrink-0 rounded-xl border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{busy === employee.id ? 'Assigning…' : 'Assign'}</button></Protected>
                </div>;
            })}
            {!visible.length && <p className="p-6 text-sm text-[var(--theme-text-secondary)]">No team members match these filters.</p>}
        </div>
        {pages > 1 && <nav aria-label="Team pages" className="flex items-center justify-between gap-2 p-3 border-t border-[var(--theme-border)]"><button type="button" disabled={page === 1} onClick={() => setAssignCurrentPage(page - 1)} className="min-h-[44px] px-3 text-xs text-[var(--theme-text-primary)] disabled:opacity-40">Previous</button><span className="text-xs text-[var(--theme-text-secondary)]">{page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setAssignCurrentPage(page + 1)} className="min-h-[44px] px-3 text-xs text-[var(--theme-text-primary)] disabled:opacity-40">Next</button></nav>}
    </section>;
};
