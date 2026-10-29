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
import { CURRENCY_SYMBOL } from '../../constants';
// Services are likely needed for props passage or use context
import { purchaseOrdersService } from '../../services/supabase.service'; // Needed for DocksTab
import { productsService } from '../../services/supabase.service'; // Needed for TransferTab
import { inventoryRequestsService } from '../../services/supabase.service'; // Needed for CountTab, ReturnsTab
import { generatePackLabelHTML } from '../../utils/labels/PackLabelGenerator'; // Needed for DocksTab
import { getVisibleFulfillmentTabs, getDefaultFulfillmentTab } from '../../utils/fulfillmentTabPermissions';
import { logger } from '../../utils/logger';

// Lazy-loaded tab components to isolate bundle transforms and enforce egress efficiency
const WasteTab = React.lazy(() => import('./WasteTab').then(m => ({ default: m.WasteTab })));
const DriverTab = React.lazy(() => import('./DriverTab').then(m => ({ default: m.DriverTab })));
const PutawayTab = React.lazy(() => import('./PutawayTab').then(m => ({ default: m.PutawayTab })));
const ReplenishTab = React.lazy(() => import('./ReplenishTab').then(m => ({ default: m.ReplenishTab })));
const DocksTab = React.lazy(() => import('./DocksTab').then(m => ({ default: m.DocksTab })));
const CountTab = React.lazy(() => import('./CountTab').then(m => ({ default: m.CountTab })));
const ReturnsTab = React.lazy(() => import('./ReturnsTab').then(m => ({ default: m.ReturnsTab })));
const PackTab = React.lazy(() => import('./PackTab').then(m => ({ default: m.PackTab })));
const PickTab = React.lazy(() => import('./PickTab').then(m => ({ default: m.PickTab })));
const ReceiveTab = React.lazy(() => import('./ReceiveTab').then(m => ({ default: m.ReceiveTab })));
const AssignTask = React.lazy(() => import('./AssignTask').then(m => ({ default: m.AssignTask })));
const LabelsTab = React.lazy(() => import('./LabelsTab').then(m => ({ default: m.LabelsTab })));
const TransferTab = React.lazy(() => import('./TransferTab').then(m => ({ default: m.TransferTab })));

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

    const visibleTabs = useMemo(() => {
        return getVisibleFulfillmentTabs(user?.role);
    }, [user?.role]);
    const canAccessTab = (tab: OpTab) => visibleTabs.includes(tab);

    const defaultTab = useMemo(() => getDefaultFulfillmentTab(user?.role), [user?.role]);

    useEffect(() => {
        if (!visibleTabs.includes(activeTab)) {
            setActiveTab(visibleTabs.includes(defaultTab) ? defaultTab : (visibleTabs[0] ?? 'RECEIVE'));
        }
    }, [activeTab, setActiveTab, visibleTabs, defaultTab]);

    const isMobile = useIsMobile();

    return (
        <div className="h-full flex flex-col gap-1.5 md:gap-6 p-1.5 md:p-0">
            {isScannerMode && (
                <div className="fixed inset-0 z-[100] bg-[var(--theme-bg-app)]">
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
                    siteId={activeSite?.id}
                />
            ) : (
                <DesktopTabSelector
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    visibleTabs={visibleTabs}
                    t={t}
                    filteredJobs={filteredJobs}
                    siteId={activeSite?.id}
                    showPointsPopup={showPointsPopup}
                    setShowPointsPopup={setShowPointsPopup}
                    earnedPoints={earnedPoints}
                />
            )}

            {canAccessTab(activeTab) && (
                <React.Suspense fallback={
                    <div className="flex items-center justify-center p-12 text-xs text-[var(--theme-text-secondary)]">
                        Loading...
                    </div>
                }>
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
                    <ReturnsTab user={user} addNotification={addNotification} />
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
                </React.Suspense>
            )}
        </div >
    );
};
