import { useAssignmentWorkloads } from '../../hooks/useAssignmentWorkloads';
import React, { useState } from 'react';
import { WMSJob, Site, Product, Employee } from '../../types';
import { AssignHeader } from './assign/AssignHeader';
import { AssignPendingJobs } from './assign/AssignPendingJobs';
import { AssignAvailableWorkers } from './assign/AssignAvailableWorkers';
import { AssignJobDetails } from './assign/AssignJobDetails';
import { AssignActiveMatrix } from './assign/AssignActiveMatrix';

// Constants
const ASSIGN_ITEMS_PER_PAGE = 20;

interface AssignTaskProps {
    filteredJobs: WMSJob[];
    historicalJobs: WMSJob[];
    employees: Employee[];
    user: any;
    products: Product[];
    sites: Site[];
    activeSite: any;
    orders: any[];
    isSubmitting: boolean;
    setIsSubmitting: (v: boolean) => void;
    refreshData: () => Promise<void>;
    setSelectedJob: (j: WMSJob | null) => void;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (v: boolean) => void;
    selectedJob: WMSJob | null;
    filteredProducts: Product[];
    filteredEmployees: Employee[];
    jobAssignments: any[];
    t: (key: string) => string;
    addNotification: (type: string, message: string) => void;
    wmsJobsService: any;
    canAccessTab: (tab: any) => boolean;
}

export const AssignTask: React.FC<AssignTaskProps> = ({
    filteredJobs,
    historicalJobs,
    employees,
    sites,
    isSubmitting,
    setIsSubmitting,
    refreshData,
    setSelectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    selectedJob,
    addNotification,
    wmsJobsService,
    filteredProducts,
    filteredEmployees,
    jobAssignments,
    t,
    activeSite,
    user
}) => {

    const workloads = useAssignmentWorkloads(activeSite?.id, activeSite?.country, user?.id, filteredEmployees.map(e => e.id));

    // Search and filter state
    const [dispatchSearch, setDispatchSearch] = useState('');
    const [dispatchPriorityFilter, setDispatchPriorityFilter] = useState<string>('ALL');
    const [dispatchEmployeeSearch, setDispatchEmployeeSearch] = useState('');
    const [dispatchEmployeeFilter, setDispatchEmployeeFilter] = useState<string>('ALL');
    const [assignCurrentPage, setAssignCurrentPage] = useState(1);
    const [assignJobFilter, setAssignJobFilter] = useState<string>('ALL');
    const [assignSortBy, setAssignSortBy] = useState<string>('priority');
    const [isAssignFilterDropdownOpen, setIsAssignFilterDropdownOpen] = useState(false);
    const [isAssignSortDropdownOpen, setIsAssignSortDropdownOpen] = useState(false);
    const [isEmployeeRoleDropdownOpen, setIsEmployeeRoleDropdownOpen] = useState(false);

    return (
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">

            {/* JOB ASSIGNMENT CENTER HEADER */}
            <AssignHeader
                assignJobFilter={assignJobFilter}
                setAssignJobFilter={setAssignJobFilter}
                dispatchPriorityFilter={dispatchPriorityFilter}
                setDispatchPriorityFilter={setDispatchPriorityFilter}
                assignSortBy={assignSortBy}
                setAssignSortBy={setAssignSortBy}
                dispatchSearch={dispatchSearch}
                setDispatchSearch={setDispatchSearch}
                isAssignFilterDropdownOpen={isAssignFilterDropdownOpen}
                setIsAssignFilterDropdownOpen={setIsAssignFilterDropdownOpen}
                isAssignSortDropdownOpen={isAssignSortDropdownOpen}
                setIsAssignSortDropdownOpen={setIsAssignSortDropdownOpen}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 items-start">
                {/* Pending Jobs */}
                <AssignPendingJobs
                    workloads={workloads.isSuccess && !workloads.isError ? workloads.data?.workers : undefined}
                    filteredJobs={filteredJobs}
                    historicalJobs={historicalJobs}
                    assignJobFilter={assignJobFilter}
                    setAssignJobFilter={setAssignJobFilter}
                    dispatchPriorityFilter={dispatchPriorityFilter}
                    setDispatchPriorityFilter={setDispatchPriorityFilter}
                    dispatchSearch={dispatchSearch}
                    setDispatchSearch={setDispatchSearch}
                    assignSortBy={assignSortBy}
                    setAssignSortBy={setAssignSortBy}
                    employees={employees}
                    jobAssignments={jobAssignments}
                    sites={sites}
                    selectedJob={selectedJob}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    t={t}
                />

                {/* Available Workers */}
                <AssignAvailableWorkers
                    workloads={workloads.data?.workers}
                    workloadReady={workloads.isSuccess && !workloads.isError}
                    workloadTimezone={workloads.data?.timezone}
                    refreshWorkloads={() => workloads.refetch()}
                    filteredEmployees={filteredEmployees}
                    dispatchEmployeeFilter={dispatchEmployeeFilter}
                    setDispatchEmployeeFilter={setDispatchEmployeeFilter}
                    dispatchEmployeeSearch={dispatchEmployeeSearch}
                    setDispatchEmployeeSearch={setDispatchEmployeeSearch}
                    isEmployeeRoleDropdownOpen={isEmployeeRoleDropdownOpen}
                    setIsEmployeeRoleDropdownOpen={setIsEmployeeRoleDropdownOpen}
                    jobAssignments={jobAssignments}
                    selectedJob={selectedJob}
                    setSelectedJob={setSelectedJob}
                    setIsSubmitting={setIsSubmitting}
                    refreshData={refreshData}
                    addNotification={addNotification}
                    wmsJobsService={wmsJobsService}
                    assignCurrentPage={assignCurrentPage}
                    setAssignCurrentPage={setAssignCurrentPage}
                    ASSIGN_ITEMS_PER_PAGE={ASSIGN_ITEMS_PER_PAGE}
                    t={t}
                />
            </div>

            {/* Selected Job Details Modal */}
            <AssignJobDetails
                selectedJob={selectedJob}
                isDetailsOpen={isDetailsOpen}
                setIsDetailsOpen={setIsDetailsOpen}
                sites={sites}
                t={t}
            />

            {/* LIVE OPERATIONS MATRIX */}
            <details className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
                <summary className="min-h-[44px] cursor-pointer text-sm font-medium text-[var(--theme-text-secondary)]">
                    {t('warehouse.workloadOverviewSummary')}
                </summary>
                <AssignActiveMatrix
                    employees={employees}
                    jobAssignments={jobAssignments}
                    filteredJobs={filteredJobs}
                    selectedJob={selectedJob}
                    setSelectedJob={setSelectedJob}
                />
            </details>

        </div>
    );
};
// End of component
