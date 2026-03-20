import React, { useState, useEffect } from 'react';
import { WMSJob, Site, Product, Employee, WarehouseZone } from '../../types';
import { AssignHeader } from './assign/AssignHeader';
import { AssignPendingJobs } from './assign/AssignPendingJobs';
import { AssignAvailableWorkers } from './assign/AssignAvailableWorkers';
import { AssignJobDetails } from './assign/AssignJobDetails';
import { AssignActiveMatrix } from './assign/AssignActiveMatrix';
import { AssignLabelHub } from './assign/AssignLabelHub';
import { warehouseZonesService } from '../../services/supabase.service';

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
    // --- ASSIGN-specific state ---
    const [zones, setZones] = useState<WarehouseZone[]>([]);

    // Fetch zones when site changes
    useEffect(() => {
        if (activeSite?.id) {
            loadZones();
        }
    }, [activeSite?.id]);

    const loadZones = async () => {
        if (!activeSite?.id) return;
        const data = await warehouseZonesService.getAll(activeSite.id);
        setZones(data);
    };

    // Search and filter state
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
        <div className="flex-1 overflow-y-auto space-y-6">

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] md:h-96">
                {/* Pending Jobs */}
                <AssignPendingJobs
                    filteredJobs={filteredJobs}
                    assignJobFilter={assignJobFilter}
                    dispatchPriorityFilter={dispatchPriorityFilter}
                    dispatchSearch={dispatchSearch}
                    assignSortBy={assignSortBy}
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
            <AssignActiveMatrix
                employees={employees}
                jobAssignments={jobAssignments}
                filteredJobs={filteredJobs}
            />

            {/* LABEL PRINTING HUB */}
            <AssignLabelHub
                filteredProducts={filteredProducts}
                addNotification={addNotification}
                t={t}
                zones={zones}
                onZoneUpdate={loadZones}
                user={user}
                activeSite={activeSite}
            />

        </div>
    );
};
// End of component
