import React, { useState, useEffect } from 'react';
import {
    Activity, ChevronDown, Search, X
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../types';
import { useSearchParams } from 'react-router-dom';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';
import { inventoryRequestsService } from '../../services/supabase.service';
import { DriversHistory } from './drivers/DriversHistory';
import { DriverHeader } from './drivers/DriverHeader';
import { DriverActiveMission } from './drivers/DriverActiveMission';
import { DriverTools } from './drivers/DriverTools';
import { DriverMetrics } from './drivers/DriverMetrics';
import { DriverJobBoard } from './drivers/DriverJobBoard';
import { DriverScanner } from './drivers/DriverScanner';
import { OutboundJobModal } from '../OutboundJobModal';
import { IncidentReportModal } from './drivers/IncidentReportModal';
import { authService } from '../../services/auth.service';
import { tasksService } from '../../services/tasks.service';
import { logger } from '../../utils/logger';
import { canManageDispatch, getDriverMissions } from '../../utils/shipmentWorkflow';

interface DriverTabProps {
    filteredJobs: WMSJob[];
    historicalJobs: WMSJob[];
    employees: any[];
    user: User | null;
    sites: Site[];
    products: Product[];
    activeSite: Site | null;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    refreshData: () => Promise<void>;
    refreshJobs?: () => void;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    isDetailsOpen: boolean;
    selectedJob: WMSJob | null;
    resolveOrderRef: (ref: string | undefined) => string;
    addNotification: (type: any, message: string) => void;
    wmsJobsService: any;
    addProduct: any;
    jobs: WMSJob[]; // Needed for parent transfer updates
    t: (key: string) => string;
    loadHistoricalJobs?: (limit?: number) => Promise<void>;
}

export const DriverTab: React.FC<DriverTabProps> = ({
    filteredJobs: allFilteredJobs,
    historicalJobs,
    employees,
    user,
    sites,
    products,
    activeSite,
    isSubmitting,
    refreshData,
    refreshJobs,
    setSelectedJob,
    setIsDetailsOpen,
    isDetailsOpen,
    selectedJob,
    resolveOrderRef,
    addNotification,
    wmsJobsService,
    addProduct,
    jobs,
    t,
    loadHistoricalJobs
}) => {
    // --- DRIVER TAB STATES ---
    const [viewMode, setViewMode] = useState<'Active' | 'History'>('Active');

    // RULE 10: Fetch history on demand when user switches to History view
    useEffect(() => {
        if (viewMode === 'History' && loadHistoricalJobs) loadHistoricalJobs();
    }, [viewMode, loadHistoricalJobs]);

    const [processingJobIds, setProcessingJobIds] = useState<Set<string>>(new Set());
    const [driverScannerOpen, setDriverScannerOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');
    const [showControlCenter, setShowControlCenter] = useState(false);

    const [, setParams] = useSearchParams();

    const currentEmployee = employees.find(employee => employee.id === user?.id ||
        (user?.email && employee.email?.toLowerCase() === user.email.toLowerCase()));
    const filteredJobs = getDriverMissions(allFilteredJobs, user, currentEmployee?.id, activeSite?.id || user?.siteId);

    const handleReportIssue = async (data: { type: string; description: string; priority: 'High' | 'Critical'; jobId?: string }) => {
        const managerRoles = ['warehouse_manager', 'country_operations_director', 'regional_operations_manager', 'country_managing_director', 'group_ceo'];
        const siteManager = employees.find(e =>
            (e.siteId === activeSite?.id || e.site_id === activeSite?.id) &&
            managerRoles.includes((e.role || '').toLowerCase())
        ) || employees.find(e => managerRoles.includes((e.role || '').toLowerCase()));

        const targetAssignee = siteManager?.id || user?.id;

        await tasksService.create({
            title: `INCIDENT: ${data.type}`,
            description: `Driver Report (${user?.name || 'Driver'}): ${data.description}${data.jobId ? ` (Job: ${data.jobId})` : ''}`,
            assignedTo: targetAssignee,
            status: 'Pending',
            priority: data.priority,
            dueDate: new Date().toISOString(),
        } as any);

        addNotification('success', 'Incident reported to Warehouse Manager.');
    };

    const handleViewDocs = () => {
        const activeMission = filteredJobs.find(job => job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') || filteredJobs[0];

        if (activeMission) {
            setSelectedJob(activeMission);
            setIsDetailsOpen(true);
        } else {
            addNotification('info', 'No active mission manifest found.');
        }
    };

    const handleEndShift = async () => {
        if (window.confirm("Are you sure you want to end your shift and sign out?")) {
            await authService.signOut();
            window.location.reload();
        }
    };

    const activeJobsCount = filteredJobs.filter(j => j.status !== 'Completed').length;

    return (
        <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-4 pr-1 custom-scrollbar pb-12">
            {/* COMPACT DRIVER HEADER */}
            <DriverHeader
                t={t}
                user={user}
                employees={employees}
                activeSite={activeSite}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isSubmitting={isSubmitting}
                refreshData={refreshData}
                activeCount={activeJobsCount}
                onDispatch={canManageDispatch(user?.role) && getVisibleFulfillmentTabs(user?.role).includes('DOCKS') ? () => setParams(previous => {
                    const next = new URLSearchParams(previous);
                    next.set('tab', 'DOCKS'); next.set('dock', 'outbound');
                    return next;
                }) : undefined}
            />

            {/* HYPER-OPTIMIZED MOBILE DASHBOARD */}
            {viewMode === 'Active' ? (
                <div className="flex flex-col gap-2 sm:gap-4">
                    {/* MOBILE COLLAPSIBLE TOGGLE */}
                    <button
                        onClick={() => setShowControlCenter(!showControlCenter)}
                        className="flex md:hidden items-center justify-between w-full p-2.5 sm:p-3.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xs hover:bg-[var(--theme-bg-subtle)] transition-colors text-xs font-semibold text-[var(--theme-text-primary)] min-h-[36px] touch-manipulation"
                    >
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-[var(--theme-primary)]" />
                            <span>Shift Summary & Actions</span>
                        </div>
                        <ChevronDown size={14} className={`text-[var(--theme-text-muted)] transition-transform duration-300 ${showControlCenter ? 'rotate-180' : ''}`} />
                    </button>

                    {/* METRICS, TOOLS & SEARCH CONTAINER */}
                    <div className={`md:flex flex-col gap-4 ${showControlCenter ? 'flex' : 'hidden md:flex'}`}>
                        {/* TOP: INLINE METRICS (Hyper-compact) */}
                        <DriverMetrics
                            t={t}
                            filteredJobs={filteredJobs}
                            historicalJobs={historicalJobs}
                            employees={employees}
                            user={user}
                        />

                        {/* MIDDLE: ACTION CENTER (Tight horizontal tools) */}
                        <DriverTools
                            t={t}
                            setDriverScannerOpen={setDriverScannerOpen}
                            onIssue={() => setIsIncidentModalOpen(true)}
                            onDocs={handleViewDocs}
                            onEnd={handleEndShift}
                            addNotification={addNotification}
                        />

                        {/* GLOBAL SEARCH */}
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-[var(--theme-primary)]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Find mission by ID, Dest, or TRK..."
                                aria-label="Search Missions"
                                title="Search Missions"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)]/20 shadow-xs transition-colors min-h-[44px]"
                            />
                            {globalSearch && (
                                <button 
                                    onClick={() => setGlobalSearch('')}
                                    aria-label="Clear search"
                                    title="Clear search"
                                    className="absolute inset-y-0 right-3 flex items-center text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors p-1"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM: ACTIVE MISSION (The main focus, dense layout) */}
                    <div className="w-full">
                        <DriverActiveMission
                            t={t}
                            filteredJobs={filteredJobs}
                            employees={employees}
                            user={user}
                            sites={sites}
                            products={products}
                            setSelectedJob={setSelectedJob}
                            setIsDetailsOpen={setIsDetailsOpen}
                            processingJobIds={processingJobIds}
                            setProcessingJobIds={setProcessingJobIds}
                            refreshData={refreshData}
                            refreshJobs={refreshJobs}
                            addNotification={addNotification}
                            globalSearch={globalSearch}
                        />
                    </div>

                    {/* COLLAPSED JOB BOARD */}
                    <div className="mt-4 border-t border-[var(--theme-border)] pt-4">
                        <DriverJobBoard
                            filteredJobs={filteredJobs} sites={sites} setSelectedJob={setSelectedJob}
                            setIsDetailsOpen={setIsDetailsOpen} globalSearch={globalSearch}
                        />
                    </div>
                </div>
            ) : (
                /* FULL WIDTH SECTION: MISSION LOG (History) */
                <DriversHistory
                    t={t}
                    historicalJobs={historicalJobs}
                    sites={sites}
                    employees={employees}
                    resolveOrderRef={resolveOrderRef}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    products={products}
                    user={user}
                    addNotification={addNotification}
                    inventoryRequestsService={inventoryRequestsService}
                    wmsJobsService={wmsJobsService}
                    jobs={jobs}
                />
            )}

            {/* DRIVER SCANNER OVERLAY */}
            {driverScannerOpen && (
                <DriverScanner jobs={filteredJobs} onClose={() => setDriverScannerOpen(false)}
                    onSelect={job => { setSelectedJob(job); setDriverScannerOpen(false); setIsDetailsOpen(true); }}
                />
            )}

            {/* SHIPMENT DETAILS MODAL */}
            {selectedJob && (
                <OutboundJobModal
                    isOpen={isDetailsOpen}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedJob(null);
                    }}
                    job={selectedJob}
                    user={user}
                    sites={sites}
                    products={products}
                    onRefresh={refreshData}
                    activeTab="driver"
                />
            )}

            {/* INCIDENT REPORT MODAL */}
            <IncidentReportModal
                t={t}
                isOpen={isIncidentModalOpen}
                onClose={() => setIsIncidentModalOpen(false)}
                user={user}
                activeJob={selectedJob}
                onReport={handleReportIssue}
            />
        </div>
    );
};
