import React, { useMemo } from 'react';
import { useFulfillment, OpTab } from './FulfillmentContext';
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

import { TransferTab } from './TransferTab';
import { CURRENCY_SYMBOL } from '../../constants';
// Services are likely needed for props passage or use context
import { purchaseOrdersService } from '../../services/supabase.service'; // Needed for DocksTab
import { productsService } from '../../services/supabase.service'; // Needed for TransferTab
import { inventoryRequestsService } from '../../services/supabase.service'; // Needed for CountTab, ReturnsTab
import { generatePackLabelHTML } from '../../utils/labels/PackLabelGenerator'; // Needed for DocksTab

const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    RECEIVE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    PUTAWAY: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker', 'inventory_specialist'],
    TRANSFER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'retail_manager'], // Store managers can request transfers
    PICK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker'],
    PACK: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker'],
    DOCKS: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'driver'],
    DRIVER: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'driver'],
    REPLENISH: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    COUNT: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'inventory_specialist'],
    WASTE: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'inventory_specialist'],
    RETURNS: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'],
    ASSIGN: ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'], // Job assignment center
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
        filteredProducts,
        sales,
        filteredMovements,
        processReturn,
        adjustStockMutation,
        transfers,
        refreshJobs,
        fixBrokenJobs,
        completeJob,
        jobAssignments
    } = useFulfillment();

    const { relocateProduct } = useData();

    const canAccessTab = (tab: OpTab) => {
        const allowedRoles = TAB_PERMISSIONS[tab];
        return allowedRoles.includes(user?.role || '');
    };

    const visibleTabs = useMemo(() => {
        const tabs = Object.keys(TAB_PERMISSIONS) as OpTab[];
        return tabs.filter(tab => canAccessTab(tab));
    }, [user?.role]);

    // 🚚 DRIVER INTERFACE
    if (user?.role === 'driver') {
        return (
            <Protected permission="ACCESS_WAREHOUSE" showMessage>
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
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    selectedJob={null}
                    resolveOrderRef={resolveOrderRef}
                    addNotification={addNotification}
                    wmsJobsService={wmsJobsService}
                    addProduct={addProduct}
                    jobs={jobs}
                    t={t}
                />
            </Protected>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4 md:gap-6 p-2 md:p-0">
            {isScannerMode && (
                <div className="fixed inset-0 z-[100] bg-black">
                    <ScannerInterface />
                </div>
            )}

            {/* --- MOBILE TAB SELECTOR --- */}
            <MobileTabSelector
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                visibleTabs={visibleTabs}
                t={t}
                filteredJobs={filteredJobs}
            />

            {/* --- DESKTOP TABS --- */}
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
                    refreshData={async () => { await refreshData(); refreshJobs(); }}
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
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    selectedJob={null}
                    resolveOrderRef={resolveOrderRef}
                    addNotification={addNotification}
                    wmsJobsService={wmsJobsService}
                    addProduct={addProduct}
                    jobs={jobs}
                    t={t}
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
                refreshData={refreshData}
                setSelectedJob={setSelectedJob}
                setIsDetailsOpen={setIsDetailsOpen}
                isDetailsOpen={isDetailsOpen}
                selectedJob={null}
                addNotification={addNotification}
                wmsJobsService={wmsJobsService}
                canAccessTab={canAccessTab}
                t={t}
                filteredProducts={filteredProducts}
                filteredEmployees={filteredEmployees}
                jobAssignments={jobAssignments}
            />
            }

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
                        refreshData={refreshData}
                        handleStartJob={handleStartJob}
                        selectedJob={selectedJob}
                        setSelectedJob={setSelectedJob}
                        setIsDetailsOpen={setIsDetailsOpen}
                        isDetailsOpen={isDetailsOpen}
                        resolveOrderRef={resolveOrderRef}
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
                        allProducts={products}
                        jobs={jobs}
                        filteredJobs={filteredJobs}
                        transfers={transfers}
                        orders={orders}
                        t={t}
                        addNotification={addNotification}
                        refreshData={async () => { await refreshData(); refreshJobs(); }}
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
                            await refreshData();
                        }}
                        completeJob={async (jobId: string, userName: string, skipValidation: boolean, items: any[]) => {
                            await wmsJobsService.completeJob(jobId, { user: userName, skipValidation, items });
                            await refreshData();
                        }}
                        relocateProductMutation={async (params: any) => {
                            // params might be { productId, newLocation, user } or similar based on context.
                            // DataContext relocateProduct signature: (productId, newLocation, user)
                            // Mutation expects object? TransferTab line 533 calls mutateAsync({ productId, locationId, user }).
                            // So params is { productId, locationId, user }.
                            return await relocateProduct(params.productId, params.locationId, params.user);
                        }}
                        logSystemEvent={logSystemEvent}
                        playBeep={(type: string) => console.log(`Beep: ${type}`)}
                        fixBrokenJobs={fixBrokenJobs}
                    />
                )
            }
        </div >
    );
};
