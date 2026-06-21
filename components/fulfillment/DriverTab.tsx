import React, { useState } from 'react';
import {
    Truck, FileText, Search, Plus, X, CheckCircle, ArrowRight, Layout, Layers,
    AlertTriangle, Clock, MapPin, List, ChevronRight, ClipboardCheck, Minus,
    AlertOctagon, RefreshCw, History as HistoryIcon, Package, Lock, Snowflake, Zap,
    Trash2, RotateCcw, Shield, ShieldCheck, Hash, ArrowDown, ArrowLeft, MoreHorizontal, User as UserIcon,
    Box, Printer, Scan, Navigation, Rocket, Warehouse, ShoppingBag, Activity, QrCode, LogOut, Archive
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../types';
import { useAdjustStockMutation } from '../../hooks/useAdjustStockMutation';
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
}

export const DriverTab: React.FC<DriverTabProps> = ({
    filteredJobs,
    historicalJobs,
    employees,
    user,
    sites,
    products,
    activeSite,
    isSubmitting,
    setIsSubmitting,
    refreshData,
    setSelectedJob,
    setIsDetailsOpen,
    isDetailsOpen,
    selectedJob,
    resolveOrderRef,
    addNotification,
    wmsJobsService,
    addProduct,
    jobs,
    t
}) => {
    // --- DRIVER TAB STATES ---
    const [viewMode, setViewMode] = useState<'Active' | 'History'>('Active');
    const [processingJobIds, setProcessingJobIds] = useState<Set<string>>(new Set());
    const [driverScannerOpen, setDriverScannerOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');

    const adjustStockMutation = useAdjustStockMutation();

    const handleUpdateJob = async (id: string, updates: Partial<WMSJob>) => {
        try {
            await wmsJobsService.update(id, updates);
            await refreshData();
            addNotification('success', 'Shipment updated.');
        } catch (err) {
            addNotification('alert', 'Update failed.');
        }
    };

    const handleReportIssue = async (data: { type: string; description: string; priority: 'High' | 'Critical'; jobId?: string }) => {
        const canSeeGlobalQueue = [
            'super_admin', 'admin', 'regional_manager',
            'operations_manager', 'warehouse_manager', 'dispatcher'
        ].includes((user?.role || '').toLowerCase());

        const currentEmployee = employees.find(e =>
            (user?.email && e.email === user.email) ||
            (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
            ((user as any)?.employeeId && e.id === (user as any).employeeId) ||
            e.id === user?.id
        );
        const employeeId = currentEmployee?.id || user?.id;

        await tasksService.create({
            title: `INCIDENT: ${data.type}`,
            description: `Driver Report: ${data.description}${data.jobId ? ` (Job: ${data.jobId})` : ''}`,
            assignedTo: employeeId,
            status: 'Pending',
            priority: data.priority,
            dueDate: new Date().toISOString(),
        } as any);

        addNotification('success', 'Incident reported to management.');
    };

    const handleViewDocs = () => {
        const canSeeGlobalQueue = [
            'super_admin', 'admin', 'manager', 'regional_manager',
            'operations_manager', 'warehouse_manager', 'dispatcher'
        ].includes((user?.role || '').toLowerCase());

        const currentEmployee = employees.find(e =>
            (user?.email && e.email === user.email) ||
            (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
            ((user as any)?.employeeId && e.id === (user as any).employeeId) ||
            e.id === user?.id
        );
        const employeeId = currentEmployee?.id || user?.id;

        const activeMission = filteredJobs.find(j =>
            (j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER') &&
            (canSeeGlobalQueue ? !!j.assignedTo : j.assignedTo === employeeId) &&
            j.status !== 'Completed'
        );

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

    return (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar pb-12">
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
            />

            {/* HYPER-OPTIMIZED MOBILE DASHBOARD */}
            {viewMode === 'Active' ? (
                <div className="flex flex-col gap-4">
                    {/* TOP: INLINE METRICS (Hyper-compact) */}
                    <DriverMetrics
                        filteredJobs={filteredJobs}
                        historicalJobs={historicalJobs}
                        employees={employees}
                        user={user}
                    />

                    {/* MIDDLE: ACTION CENTER (Tight horizontal tools) */}
                    <DriverTools
                        setDriverScannerOpen={setDriverScannerOpen}
                        onIssue={() => setIsIncidentModalOpen(true)}
                        onDocs={handleViewDocs}
                        onEnd={handleEndShift}
                        addNotification={addNotification}
                    />

                    {/* GLOBAL SEARCH */}
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[#A9CBA2]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find mission by ID, Dest, or TRK..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs md:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 shadow-sm dark:shadow-inner transition-colors"
                        />
                        {globalSearch && (
                            <button 
                                onClick={() => setGlobalSearch('')}
                                aria-label="Clear search"
                                title="Clear search"
                                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* BOTTOM: ACTIVE MISSION (The main focus, dense layout) */}
                    <div className="w-full">
                        <DriverActiveMission
                            t={t}
                            filteredJobs={filteredJobs}
                            employees={employees}
                            user={user}
                            sites={sites}
                            jobs={jobs}
                            products={products}
                            setSelectedJob={setSelectedJob}
                            setIsDetailsOpen={setIsDetailsOpen}
                            processingJobIds={processingJobIds}
                            setProcessingJobIds={setProcessingJobIds}
                            wmsJobsService={wmsJobsService}
                            refreshData={refreshData}
                            addNotification={addNotification}
                            adjustStockMutation={adjustStockMutation}
                            addProduct={addProduct}
                            globalSearch={globalSearch}
                        />
                    </div>

                    {/* COLLAPSED JOB BOARD */}
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <DriverJobBoard
                            t={t}
                            filteredJobs={filteredJobs}
                            sites={sites}
                            employees={employees}
                            user={user}
                            setSelectedJob={setSelectedJob}
                            setIsDetailsOpen={setIsDetailsOpen}
                            processingJobIds={processingJobIds}
                            setProcessingJobIds={setProcessingJobIds}
                            wmsJobsService={wmsJobsService}
                            refreshData={refreshData}
                            addNotification={addNotification}
                            globalSearch={globalSearch}
                            jobs={jobs}
                        />
                    </div>
                </div>
            ) : (
                /* FULL WIDTH SECTION: MISSION LOG (History) */
                <DriversHistory
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
                <DriverScanner
                    setDriverScannerOpen={setDriverScannerOpen}
                    selectedJob={selectedJob}
                    wmsJobsService={wmsJobsService}
                    addNotification={addNotification}
                    refreshData={refreshData}
                    setSelectedJob={setSelectedJob}
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
                    onUpdateJob={handleUpdateJob}
                    onRefresh={refreshData}
                    activeTab="driver"
                />
            )}

            {/* INCIDENT REPORT MODAL */}
            <IncidentReportModal
                isOpen={isIncidentModalOpen}
                onClose={() => setIsIncidentModalOpen(false)}
                user={user}
                activeJob={selectedJob}
                onReport={handleReportIssue}
            />
        </div>
    );
};
