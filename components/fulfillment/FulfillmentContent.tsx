import React, { useMemo, useState, useEffect } from 'react';
import { useFulfillment, OpTab } from './FulfillmentContext';

/** Returns true when viewport < 768 px (md breakpoint). SSR-safe. */
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}
import { useData } from '../../contexts/DataContext';
import { Protected } from '../Protected';
import { MobileTabSelector, DesktopTabSelector } from './TabSelectors';
import { ScannerInterface } from './ScannerInterface';
import { WasteTab } from './WasteTab';
import { DriverTab } from './DriverTab';
import { PutawayTab } from './PutawayTab';
import { ReplenishTab } from './ReplenishTab';
import { DocksTab } from './DocksTab';
import { CountTab } from './CountTab';
import { ReturnsTab } from './ReturnsTab';
import { PackTab } from './PackTab';
import { PickTab } from './PickTab';
import { ReceiveTab } from './ReceiveTab';
import { AssignTask } from './AssignTask';
import { LabelsTab } from './LabelsTab';

import { TransferTab } from './TransferTab';
import { CURRENCY_SYMBOL } from '../../constants';
// Services are likely needed for props passage or use context
import { purchaseOrdersService } from '../../services/supabase.service'; // Needed for DocksTab
import { productsService } from '../../services/supabase.service'; // Needed for TransferTab
import { inventoryRequestsService } from '../../services/supabase.service'; // Needed for CountTab, ReturnsTab
import { generatePackLabelHTML } from '../../utils/labels/PackLabelGenerator'; // Needed for DocksTab
import { logger } from '../../utils/logger';

const FLOOR_OPS_ROLES = ['picker', 'packer', 'receiver', 'inventory_specialist', 'forklift_operator', 'driver', 'inbound_qc_inspector'];

const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    RECEIVE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', ...FLOOR_OPS_ROLES],
    PUTAWAY: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', ...FLOOR_OPS_ROLES],
    TRANSFER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'retail_manager', 'logistics_manager', 'inventory_manager', 'demand_planner', 'replenishment_planner', ...FLOOR_OPS_ROLES],
    PICK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', ...FLOOR_OPS_ROLES],
    PACK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', ...FLOOR_OPS_ROLES],
    DOCKS: ['super_admin', 'admin', 'operations_manager', 'regional_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'fleet_maintenance_supervisor'],
    DRIVER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'driver', 'logistics_manager', 'fleet_maintenance_supervisor'], // Strict Delivery Lockdown: only drivers and dispatch leadership
    REPLENISH: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'replenishment_planner', ...FLOOR_OPS_ROLES],
    COUNT: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager', ...FLOOR_OPS_ROLES],
    WASTE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager', ...FLOOR_OPS_ROLES],
    RETURNS: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', ...FLOOR_OPS_ROLES],
    ASSIGN: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'fleet_maintenance_supervisor'], // Job assignment center
    LABELS: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'logistics_manager', 'inventory_manager', 'fleet_maintenance_supervisor', 'replenishment_planner', ...FLOOR_OPS_ROLES], // Label printing hub
};

export const FulfillmentContent: React.FC = () => {
    const {
        user,
        activeTab,
        setActiveTab,
        filteredJobs,
        showPointsPopup,
        setShowPointsPopup,
        earnedPoints,
        t,
        orders,
        jobs,
        sites,
        activeSite,
        employees,
        addNotification,
        refreshData,
        receivePO,
        receivingPO,
        setReceivingPO,
        filteredEmployees,
        handleStartJob,
        selectedJob,
        setSelectedJob,
        isDetailsOpen,
        setIsDetailsOpen,
        isScannerMode,
        setIsScannerMode,
        wmsJobsService,
        logSystemEvent,
        formatJobId,
        formatDateTime,
        formatRelativeTime,
        historicalJobs,
        isSubmitting,
        setIsSubmitting,
        resolveOrderRef,
        addProduct,
        products,
        allProducts,
        filteredProducts,
        sales,
        filteredMovements,
        processReturn,
        adjustStockMutation,
        transfers,
        refreshJobs,
        fixBrokenJobs,
        completeJob,
        jobAssignments,
        loadHistoricalJobs
    } = useFulfillment();

    const { relocateProduct } = useData();

    const refreshOperationalData = async () => {
        await refreshData();
        refreshJobs();
    };

    const canAccessTab = (tab: OpTab) => {
        const allowedRoles = TAB_PERMISSIONS[tab];
        return allowedRoles.includes(user?.role || '');
    };

    const visibleTabs = useMemo(() => {
        const tabs = Object.keys(TAB_PERMISSIONS) as OpTab[];
        return tabs.filter(tab => canAccessTab(tab));
    }, [user?.role]);

    const isMobile = useIsMobile();

    return (
        <div className="h-full flex flex-col gap-1.5 md:gap-6 p-1.5 md:p-0">
            {isScannerMode && (
                <div className="fixed inset-0 z-[100] bg-black">
                    <ScannerInterface />
                </div>
            )}

            {/* --- TAB SELECTORS --- */}
            {isMobile ? (
                <MobileTabSelector
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    visibleTabs={visibleTabs}
                    t={t}
                    filteredJobs={filteredJobs}
                />
            ) : (
                <DesktopTabSelector
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    visibleTabs={visibleTabs}
                    t={t}
                    filteredJobs={filteredJobs}
                    showPointsPopup={showPointsPopup}
                    setShowPointsPopup={setShowPointsPopup}
                    earnedPoints={earnedPoints}
                />
            )}

            {/* --- DOCKS TAB --- */}
            {activeTab === 'DOCKS' && (
                <DocksTab
                    orders={orders}
                    jobs={jobs}
                    sites={sites}
                    activeSite={activeSite ?? null}
                    employees={employees}
                    user={user}
                    t={t}
                    addNotification={addNotification}
                    refreshData={refreshOperationalData}
                    setActiveTab={setActiveTab}
                    setReceivingPO={setReceivingPO}
                    purchaseOrdersService={purchaseOrdersService}
                    wmsJobsService={wmsJobsService}
                    logSystemEvent={logSystemEvent}
                    generatePackLabelHTML={generatePackLabelHTML}
                    formatJobId={formatJobId}
                    formatDateTime={formatDateTime}
                    formatRelativeTime={formatRelativeTime}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    completeJob={completeJob}
                    products={products}
                />
            )}

            {/* --- DRIVER TAB (for non-driver roles viewing it?) --- */}
            {activeTab === 'DRIVER' && (
                <DriverTab
                    filteredJobs={filteredJobs}
                    historicalJobs={historicalJobs}
                    employees={employees}
                    user={user}
                    sites={sites}
                    products={products}
                    activeSite={activeSite || null}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    refreshData={refreshData}
                    refreshJobs={refreshJobs}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    isDetailsOpen={isDetailsOpen}
                    selectedJob={selectedJob}
                    resolveOrderRef={resolveOrderRef}
                    addNotification={addNotification}
                    wmsJobsService={wmsJobsService}
                    addProduct={addProduct}
                    jobs={jobs}
                    t={t}
                    loadHistoricalJobs={loadHistoricalJobs}
                />
            )}

            {/* --- RECEIVE TAB --- */}
            {activeTab === 'RECEIVE' && <ReceiveTab />}

            {/* --- PICK TAB --- */}
            {activeTab === 'PICK' && <PickTab />}

            {/* --- PACK TAB --- */}
            {activeTab === 'PACK' && <PackTab />}

            {/* --- ASSIGN TAB --- */}
            {activeTab === 'ASSIGN' && canAccessTab('ASSIGN') && <AssignTask
                filteredJobs={filteredJobs}
                historicalJobs={historicalJobs}
                employees={employees}
                user={user}
                products={products}
                sites={sites}
                activeSite={activeSite}
                orders={orders}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
                refreshData={refreshOperationalData}
                setSelectedJob={setSelectedJob}
                setIsDetailsOpen={setIsDetailsOpen}
                isDetailsOpen={isDetailsOpen}
                selectedJob={selectedJob}
                addNotification={addNotification}
                wmsJobsService={wmsJobsService}
                canAccessTab={canAccessTab}
                t={t}
                filteredProducts={filteredProducts}
                filteredEmployees={filteredEmployees}
                jobAssignments={jobAssignments}
            />
            }

            {/* --- LABELS TAB --- */}
            {activeTab === 'LABELS' && canAccessTab('LABELS') && <LabelsTab />}

            {/* --- PUTAWAY TAB --- */}
            {
                activeTab === 'PUTAWAY' && (
                    <PutawayTab
                        filteredJobs={filteredJobs}
                        historicalJobs={historicalJobs}
                        employees={employees}
                        user={user}
                        orders={orders}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                        refreshData={refreshOperationalData}
                        handleStartJob={handleStartJob}
                        selectedJob={selectedJob}
                        setSelectedJob={setSelectedJob}
                        setIsDetailsOpen={setIsDetailsOpen}
                        isDetailsOpen={isDetailsOpen}
                        resolveOrderRef={resolveOrderRef}
                        sites={sites}
                        loadHistoricalJobs={loadHistoricalJobs}
                    />
                )
            }
            {/* Wait, handleStartJob in PutawayTab? */}
            {/* context has handleStartJob. PutawayTab expects prop? */}
            {/* I should pass handleStartJob from context. It is in context! line 60 in step 8562. */}

            {/* --- REPLENISH TAB --- */}
            {activeTab === 'REPLENISH' && <ReplenishTab filteredProducts={filteredProducts} products={products} historicalJobs={historicalJobs} sales={sales} isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} setSelectedJob={setSelectedJob} setIsDetailsOpen={setIsDetailsOpen} wmsJobsService={wmsJobsService} addNotification={addNotification} activeSite={activeSite} />}

            {/* --- COUNT TAB --- */}
            {
                activeTab === 'COUNT' && (
                    <CountTab
                        products={products}
                        movements={filteredMovements} // Wait, usage in Fulfillment.tsx was movements. Step 8541 line 646: movements={movements}. Context has movements.
                        user={user}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                        setSelectedJob={setSelectedJob}
                        setIsDetailsOpen={setIsDetailsOpen}
                        inventoryRequestsService={inventoryRequestsService}
                        addNotification={addNotification}
                    />
                )
            }

            {/* --- WASTE TAB --- */}
            {activeTab === 'WASTE' && <WasteTab filteredMovements={filteredMovements} setSelectedJob={setSelectedJob} setIsDetailsOpen={setIsDetailsOpen} />}

            {/* --- RETURNS TAB --- */}
            {
                activeTab === 'RETURNS' && (
                    <ReturnsTab
                        sales={sales}
                        processReturn={processReturn}
                        inventoryRequestsService={inventoryRequestsService}
                        products={products}
                        user={user}
                        addNotification={addNotification}
                        formatJobId={(id: string) => id} // Simple identity or custom formatter since WMS formatJobId expects object
                        resolveOrderRef={resolveOrderRef}
                        CURRENCY_SYMBOL={CURRENCY_SYMBOL}
                    />
                )
            }

            {/* --- TRANSFER TAB --- */}
            {
                activeTab === 'TRANSFER' && (
                    <TransferTab
                        activeTab="TRANSFER"
                        activeSite={activeSite ?? null}
                        user={user ?? null}
                        sites={sites}
                        products={products}
                        allProducts={allProducts}
                        jobs={jobs}
                        filteredJobs={filteredJobs}
                        transfers={transfers}
                        orders={orders}
                        t={t}
                        addNotification={addNotification}
                        refreshData={refreshOperationalData}
                        wmsJobsService={wmsJobsService}
                        productsService={productsService}
                        adjustStockMutation={adjustStockMutation}
                        addProduct={addProduct}
                        selectedJob={selectedJob}
                        setSelectedJob={setSelectedJob}
                        setIsDetailsOpen={setIsDetailsOpen}
                        isDetailsOpen={isDetailsOpen}
                        updateJobItem={async (jobId: string, itemIndex: number, status: string, quantity: number) => {
                            await wmsJobsService.updateJobItem(jobId, itemIndex, status, quantity);
                            await refreshOperationalData();
                        }}
                        completeJob={async (jobId: string, userName: string, skipValidation: boolean, items: any[]) => {
                            await wmsJobsService.completeJob(jobId, { user: userName, skipValidation, items });
                            await refreshOperationalData();
                        }}
                        relocateProductMutation={async (params: any) => {
                            // params might be { productId, newLocation, user } or similar based on context.
                            // DataContext relocateProduct signature: (productId, newLocation, user)
                            // Mutation expects object? TransferTab line 533 calls mutateAsync({ productId, locationId, user }).
                            // So params is { productId, locationId, user }.
                            return await relocateProduct(params.productId, params.locationId, params.user);
                        }}
                        logSystemEvent={logSystemEvent}
                        playBeep={(type: string) => logger.debug('FulfillmentContent', `Beep: ${type}`)}
                        fixBrokenJobs={fixBrokenJobs}
                        historicalJobs={historicalJobs}
                        loadHistoricalJobs={loadHistoricalJobs}
                    />
                )
            }
        </div >
    );
};
