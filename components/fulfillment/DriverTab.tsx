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

    const adjustStockMutation = useAdjustStockMutation();

    return (
        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-12">
            {/* DRIVER COMMAND CENTER HEADER */}
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

            {/* UPPER OPERATIONAL DASHBOARD: 3-Column Tactical Display */}
            {viewMode === 'Active' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* COLUMN 1: ACTIVE MISSION (Priority focus) */}
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
                        />

                        {/* COLUMN 2: OPERATIONS HUB (Tools) */}
                        <DriverTools
                            setDriverScannerOpen={setDriverScannerOpen}
                            addNotification={addNotification}
                        />

                        {/* COLUMN 3: PERFORMANCE TELEMETRY */}
                        <DriverMetrics
                            filteredJobs={filteredJobs}
                            employees={employees}
                            user={user}
                        />
                    </div>

                    {/* FULL WIDTH SECTION: INTAKE MARKETPLACE */}
                    <DriverJobBoard
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
                    />

                </>
            ) : (
                /* FULL WIDTH SECTION: MISSION LOG (History) */
                <DriversHistory
                    historicalJobs={historicalJobs}
                    sites={sites}
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
        </div>
    );
};
