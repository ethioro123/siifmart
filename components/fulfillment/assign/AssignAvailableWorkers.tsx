import React from 'react';
import { Users as UsersIcon, Search, User as UserIcon, ChevronDown, Plus } from 'lucide-react';
import { Employee, WMSJob } from '../../../types';
import { Protected } from '../../Protected';
import { useFulfillment } from '../FulfillmentContext';
import { logger } from '../../../utils/logger';
import { canWorkerPerformJob, getJobAssignmentEligibility, isDeliveryJob, isFloorWorkerRole } from '../../../utils/fulfillmentRoles';
import { getEmployeeJobTitle } from '../../../utils/roles';

interface AssignAvailableWorkersProps {
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

export const AssignAvailableWorkers: React.FC<AssignAvailableWorkersProps> = ({
    filteredEmployees,
    dispatchEmployeeFilter,
    setDispatchEmployeeFilter,
    dispatchEmployeeSearch,
    setDispatchEmployeeSearch,
    isEmployeeRoleDropdownOpen,
    setIsEmployeeRoleDropdownOpen,
    jobAssignments,
    selectedJob,
    setSelectedJob,
    setIsSubmitting,
    refreshData,
    addNotification,
    assignCurrentPage,
    setAssignCurrentPage,
    ASSIGN_ITEMS_PER_PAGE,
    t
}) => {
    const { assignJob } = useFulfillment();

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] font-semibold text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <UsersIcon size={16} className="text-primary" />
                    <span>{t('warehouse.availableStaff')}</span>
                    <span className="bg-primary/10 text-primary font-mono tabular-nums px-2 py-0.5 rounded-full border border-primary/20 ml-1 text-xs">
                        {(() => {
                            let filtered = filteredEmployees.filter(e =>
                                ['admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker', 'packer', 'driver', 'receiver', 'inventory_specialist', 'forklift_operator', 'auditor'].includes(e.role?.toLowerCase()) &&
                                e.status?.toLowerCase() === 'active'
                            );
                            if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role?.toLowerCase() === dispatchEmployeeFilter.toLowerCase());
                            if (dispatchEmployeeSearch) filtered = filtered.filter(e => e.name?.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()) || e.code?.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()));
                            return filtered.length;
                        })()}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Staff Search */}
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={dispatchEmployeeSearch}
                            onChange={(e) => setDispatchEmployeeSearch(e.target.value)}
                            className="woody-input !pl-8 pr-3 py-1.5 text-xs w-36 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] min-h-[38px]"
                        />
                    </div>

                    {/* Role Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsEmployeeRoleDropdownOpen(!isEmployeeRoleDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[38px] touch-manipulation whitespace-nowrap"
                        >
                            <UserIcon size={14} className={dispatchEmployeeFilter !== 'ALL' ? 'text-primary' : ''} />
                            <span>ROLE: {dispatchEmployeeFilter.toUpperCase()}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isEmployeeRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isEmployeeRoleDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsEmployeeRoleDropdownOpen(false)} />
                                <div className="absolute top-full right-0 mt-2 w-44 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {['ALL', 'picker', 'packer', 'dispatcher', 'driver', 'receiver', 'warehouse_manager', 'inventory_specialist'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => {
                                                setDispatchEmployeeFilter(role);
                                                setIsEmployeeRoleDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold min-h-[38px] flex items-center touch-manipulation transition-colors cursor-pointer ${dispatchEmployeeFilter === role
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
                                                }`}
                                        >
                                            {role.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {(() => {
                    let filtered = filteredEmployees.filter(e =>
                        ['admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker', 'packer', 'driver', 'receiver', 'inventory_specialist', 'forklift_operator', 'auditor'].includes(e.role?.toLowerCase()) &&
                        e.status?.toLowerCase() === 'active'
                    );
                    if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role?.toLowerCase() === dispatchEmployeeFilter.toLowerCase());
                    if (dispatchEmployeeSearch) filtered = filtered.filter(e => e.name?.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()) || e.code?.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()));

                    // Check if selected job matches employee role using fulfillment role rules
                    const getRoleMatch = (employee: any, job: WMSJob | null) => {
                        if (!job) return false;
                        return canWorkerPerformJob(employee.role, job.type);
                    };

                    // Sort by: role match first, then by workload
                    filtered.sort((a, b) => {
                        const aMatch = getRoleMatch(a, selectedJob);
                        const bMatch = getRoleMatch(b, selectedJob);
                        if (aMatch !== bMatch) return aMatch ? -1 : 1;

                        const aWorkload = jobAssignments.filter(
                            ass => ass.employeeId === a.id && ['Assigned', 'Accepted', 'In-Progress'].includes(ass.status)
                        ).length;
                        const bWorkload = jobAssignments.filter(
                            ass => ass.employeeId === b.id && ['Assigned', 'Accepted', 'In-Progress'].includes(ass.status)
                        ).length;
                        return aWorkload - bWorkload;
                    });

                    const assignTotalPages = Math.ceil(filtered.length / ASSIGN_ITEMS_PER_PAGE);
                    const safeAssignPage = Math.min(Math.max(1, assignCurrentPage), Math.max(1, assignTotalPages));
                    const paginatedEmployees = filtered.slice((safeAssignPage - 1) * ASSIGN_ITEMS_PER_PAGE, safeAssignPage * ASSIGN_ITEMS_PER_PAGE);

                    return (
                        <>
                            {paginatedEmployees.map((employee) => {
                                // Count active assignments for this employee
                                const activeAssignments = jobAssignments.filter(
                                    a => a.employeeId === employee.id &&
                                        ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                );
                                const workloadCount = activeAssignments.length;
                                const roleMatch = getRoleMatch(employee, selectedJob);
                                const eligibility = selectedJob ? getJobAssignmentEligibility(employee.role, selectedJob.type) : { eligible: true };
                                const isDeliveryLockout = selectedJob ? (isDeliveryJob(selectedJob.type) && isFloorWorkerRole(employee.role)) : false;

                                return (
                                    <div key={employee.id} className={`p-4 rounded-2xl border transition-colors ${roleMatch && selectedJob
                                        ? 'bg-primary/5 border-primary/30'
                                        : isDeliveryLockout && selectedJob
                                            ? 'bg-amber-500/5 border-amber-500/20 opacity-80'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-sm font-semibold text-[var(--theme-text-primary)] shadow-sm">
                                                    {employee.name?.charAt(0) || '?'}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--theme-bg-card)] ${employee.status?.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-[var(--theme-text-muted)]'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="text-sm text-[var(--theme-text-primary)] font-semibold truncate">{employee.name}</div>
                                                    {roleMatch && selectedJob && (
                                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-semibold uppercase tracking-wider text-[11px]">
                                                            Match
                                                        </span>
                                                    )}
                                                    {isDeliveryLockout && selectedJob && (
                                                        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold uppercase tracking-wider text-[11px]">
                                                            Driver Only
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Workload Progress Bar */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[11px] font-mono tabular-nums uppercase font-semibold tracking-wider">
                                                        <span className="text-[var(--theme-text-muted)]">{getEmployeeJobTitle(employee)}</span>
                                                        <span className="text-[var(--theme-text-secondary)]">
                                                            {workloadCount} {t('warehouse.active')}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[var(--theme-bg-app)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                                                        <div
                                                            className="h-full transition-all duration-500 bg-primary"
                                                            ref={(el) => { if (el) el.style.width = `${Math.min(100, (workloadCount / 5) * 100)}%`; }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Protected permission="ASSIGN_TASKS">
                                                <button
                                                    disabled={!selectedJob || !eligibility.eligible}
                                                    onClick={async () => {
                                                        if (!selectedJob) return;
                                                        if (!eligibility.eligible) {
                                                            addNotification('alert', eligibility.reason || 'Worker is not eligible for this job type');
                                                            return;
                                                        }
                                                        try {
                                                            setIsSubmitting(true);
                                                            await assignJob(selectedJob.id, employee.id);
                                                            addNotification('success', `Job assigned to ${employee.name}`);
                                                            setSelectedJob(null);
                                                            await refreshData();
                                                        } catch (error) {
                                                            logger.error('AssignAvailableWorkers', 'Failed to assign job:', error);
                                                            addNotification('alert', 'Failed to assign job');
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }}
                                                    className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border transition-colors flex items-center justify-center touch-manipulation ${!selectedJob || !eligibility.eligible
                                                        ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)] cursor-not-allowed opacity-50'
                                                        : roleMatch
                                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm hover:opacity-90 active:scale-95 cursor-pointer'
                                                            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] active:scale-95 cursor-pointer'
                                                        }`}
                                                    title={
                                                        !selectedJob
                                                            ? t('warehouse.selectJobFirst')
                                                            : !eligibility.eligible
                                                                ? (eligibility.reason || 'Ineligible for this job')
                                                                : 'Assign Task'
                                                    }
                                                    aria-label="Assign Task"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </Protected>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Assign Pagination Controls */}
                            {assignTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 py-4 border-t border-[var(--theme-border)]">
                                    <div className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] p-1.5 rounded-full border border-[var(--theme-border)]">
                                        <button
                                            onClick={() => setAssignCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={safeAssignPage === 1}
                                            title="Previous Page"
                                            aria-label="Previous Page"
                                            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-[var(--theme-bg-card)] transition-colors text-[var(--theme-text-secondary)] touch-manipulation"
                                        >
                                            <ChevronDown className="rotate-90" size={14} />
                                        </button>
                                        <span className="text-xs font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider px-2">
                                            Page <span className="text-[var(--theme-text-primary)]">{safeAssignPage}</span> of {assignTotalPages}
                                        </span>
                                        <button
                                            onClick={() => setAssignCurrentPage(prev => Math.min(assignTotalPages, prev + 1))}
                                            disabled={safeAssignPage === assignTotalPages}
                                            title="Next Page"
                                            aria-label="Next Page"
                                            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-[var(--theme-bg-card)] transition-colors text-[var(--theme-text-secondary)] touch-manipulation"
                                        >
                                            <ChevronDown className="-rotate-90" size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
                {filteredEmployees.filter(e =>
                    ['admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker', 'packer', 'driver', 'receiver', 'inventory_specialist', 'forklift_operator', 'auditor'].includes(e.role?.toLowerCase()) &&
                    e.status?.toLowerCase() === 'active'
                ).length === 0 && (
                    <div className="text-center py-8 text-[var(--theme-text-muted)] text-sm">
                        No warehouse staff available
                    </div>
                )}
            </div>
        </div>
    );
};
