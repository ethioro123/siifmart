import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WMSJob, Employee, WarehouseZone, Product } from '../../types';
import { PutawayHistory } from './putaway/PutawayHistory';
import { PutawayHeader } from './putaway/PutawayHeader';
import { PutawayList } from './putaway/PutawayList';
import { PutawayActiveJob } from './putaway/PutawayActiveJob';
import { PutawayScanner } from './putaway/PutawayScanner';
import { useData } from '../../contexts/DataContext';
import { useFulfillment } from './FulfillmentContext';
import { PutawayJobModal } from './putaway/PutawayJobModal';
import { PutawayDetailsModal } from './putaway/PutawayDetailsModal';
import { productsService } from '../../services/supabase.service';
import { useStore } from '../../contexts/CentralStore';
import { normalizeLocation, parseLocation } from '../../utils/locationTracking';
import { extractSitePrefix, extractPrefixFromBarcode } from '../../utils/locationEncoder';
import { logger } from '../../utils/logger';
import { usePutawayScanning } from './putaway/hooks/usePutawayScanning';
import { usePutawayAutoRepair } from './putaway/hooks/usePutawayAutoRepair';
import { formatJobId } from '../../utils/jobIdFormatter';
import { useQueryClient } from '@tanstack/react-query';
import { usePutawayRouting } from './putaway/hooks/usePutawayRouting';

interface PutawayTabProps {
    filteredJobs: WMSJob[]; historicalJobs: WMSJob[]; employees: Employee[]; user: any; orders: any[];
    isSubmitting: boolean; setIsSubmitting: (v: boolean) => void; refreshData: () => void;
    handleStartJob: (job: WMSJob) => void; selectedJob: WMSJob | null; setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void; isDetailsOpen: boolean; resolveOrderRef: (ref?: string) => string;
    sites: any[]; loadHistoricalJobs?: (limit?: number) => Promise<void>;
}

const PUTAWAY_ITEMS_PER_PAGE = 10;

export const PutawayTab: React.FC<PutawayTabProps> = ({
    filteredJobs, historicalJobs, employees, user, orders,
    isSubmitting, setIsSubmitting, refreshData, handleStartJob,
    selectedJob, setSelectedJob, setIsDetailsOpen, resolveOrderRef, isDetailsOpen, sites: tabSites,
    loadHistoricalJobs
}) => {
    const isSubmittingRef = useRef(false);
    const queryClient = useQueryClient();

    // --- PUTAWAY-SPECIFIC STATE ---
    const [putawaySearch, setPutawaySearch] = useState('');
    const [putawayCurrentPage, setPutawayCurrentPage] = useState(1);
    const [isPutawaySortDropdownOpen, setIsPutawaySortDropdownOpen] = useState(false);
    const [putawayStatusFilter, setPutawayStatusFilter] = useState<'All' | 'Pending' | 'In-Progress'>('All');
    const [putawaySortBy, setPutawaySortBy] = useState<'priority' | 'date' | 'items'>('priority');
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    // RULE 10: Fetch history on demand when user switches to History view
    useEffect(() => {
        if (viewMode === 'History' && loadHistoricalJobs) loadHistoricalJobs();
    }, [viewMode]);

    // Temp location state for the scanner flow (moved up for scope access)
    const [scannedLocation, setScannedLocation] = useState<string>('');
    const [locationOccupants, setLocationOccupants] = useState<Product[]>([]);

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [jobForModal, setJobForModal] = useState<WMSJob | null>(null);

    // Context Hooks for actions
    const { sites } = useData();
    const { user: storeUser } = useStore();
    const { allProducts } = useData();
    const {
        updateJobItem,
        adjustStockMutation,
        relocateProductMutation,
        completeJob,
        addNotification,
        activeSite,
        zones,
        putawayStock,
        t,
        deleteJob
    } = useFulfillment();

    // --- AUTO-REPAIR MISSING PRODUCTS FOR PUTAWAY JOBS ---
    usePutawayAutoRepair(filteredJobs, activeSite, allProducts, refreshData);

    // --- SORTED/FILTERED PUTAWAY JOBS ---
    const sortedPutawayJobs = useMemo(() => {
        let filtered = filteredJobs.filter(j => {
            if (j.type !== 'PUTAWAY' && j.type !== 'REPLENISH') return false;
            const status = j.status?.toLowerCase() || 'pending';
            if (status === 'completed' || status === 'cancelled') return false;
            return true;
        });

        if (putawayStatusFilter !== 'All') filtered = filtered.filter(j => j.status === putawayStatusFilter);
        if (putawaySearch) {
            const q = putawaySearch.toLowerCase();
            filtered = filtered.filter(j => {
                const cleanJobId = formatJobId(j).toLowerCase();
                const orderRefStr = (j.orderRef || '').toLowerCase();
                const orderRefResolvedStr = resolveOrderRef ? resolveOrderRef(j.orderRef).toLowerCase() : '';
                const noteStr = (j.notes || '').toLowerCase();
                const jobNum = (j.jobNumber || (j as any).job_number || '').toLowerCase();
                const statusStr = (j.status || '').toLowerCase();

                // Worker info
                const userId = j.completedBy || j.assignedTo;
                let userObj = employees?.find(e => 
                    e.id === userId || 
                    (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
                    (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
                    (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
                );
                const workerName = (userObj?.name || userId || '').toLowerCase();
                const workerCode = (userObj?.code || '').toLowerCase();

                // Search product names and SKUs
                const items = j.lineItems || (j as any).line_items || [];
                const matchesItems = items.some((item: any) => 
                    (item.name || '').toLowerCase().includes(q) ||
                    (item.productName || '').toLowerCase().includes(q) ||
                    (item.sku || '').toLowerCase().includes(q)
                );

                return (
                    cleanJobId.includes(q) ||
                    j.id.toLowerCase().includes(q) ||
                    orderRefStr.includes(q) ||
                    orderRefResolvedStr.includes(q) ||
                    workerName.includes(q) ||
                    workerCode.includes(q) ||
                    noteStr.includes(q) ||
                    statusStr.includes(q) ||
                    jobNum.includes(q) ||
                    matchesItems
                );
            });
        }

        return filtered.sort((a, b) => {
            const activeOrder = Number(b.status === 'In-Progress') - Number(a.status === 'In-Progress');
            if (activeOrder !== 0) return activeOrder;
            if (putawaySortBy === 'priority') {
                const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            }
            if (putawaySortBy === 'items') return b.items - a.items;
            return new Date(b.id).getTime() - new Date(a.id).getTime();
        });
    }, [filteredJobs, putawayStatusFilter, putawaySearch, putawaySortBy, orders, employees]);

    const putawayTotalPages = Math.ceil(sortedPutawayJobs.length / PUTAWAY_ITEMS_PER_PAGE);
    const safePutawayCurrentPage = Math.min(Math.max(1, putawayCurrentPage), Math.max(1, putawayTotalPages));
    const paginatedPutawayJobs = useMemo(() => {
        const start = (safePutawayCurrentPage - 1) * PUTAWAY_ITEMS_PER_PAGE;
        return sortedPutawayJobs.slice(start, start + PUTAWAY_ITEMS_PER_PAGE);
    }, [sortedPutawayJobs, safePutawayCurrentPage]);

    const filteredJobsCount = useMemo(() => {
        let pending = 0, active = 0, completed = 0, inboundItems = 0;
        filteredJobs.forEach(j => {
            if (j.type !== 'PUTAWAY' && j.type !== 'REPLENISH') return;
            if (j.status === 'Pending') pending++;
            else if (j.status === 'In-Progress') active++;
            else if (j.status === 'Completed') completed++;
            if (j.status !== 'Completed') {
                const lineItemsSum = j.lineItems?.reduce((acc, li) => acc + (li.expectedQty || 0), 0) || 0;
                inboundItems += Math.max(j.items || 0, lineItemsSum);
            }
        });
        return { pending, active, completed, inboundItems };
    }, [filteredJobs]);

    // --- ACTIVE JOB HELPERS ---
    const currentItem = useMemo(() => {
        if (!selectedJob) return undefined;
        return selectedJob.lineItems?.find(i => !['Completed', 'Picked', 'Short', 'Discontinued'].includes(i.status));
    }, [selectedJob]);

    const currentProduct = useMemo(() => {
        if (!currentItem) return undefined;
        const targetSiteId = activeSite?.id;
        let prod = allProducts.find(p =>
            (p.id === currentItem.productId || p.sku === currentItem.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        );
        return prod;
    }, [currentItem, allProducts, activeSite]);

    const routing = usePutawayRouting({
        siteId: selectedJob?.siteId || activeSite?.id || '', sku: currentItem?.sku || '',
        category: currentItem?.category || currentProduct?.category, quantity: currentItem?.expectedQty || 0,
        batchNumber: currentItem?.batchNumber, expiryDate: currentItem?.expiryDate,
        storageType: currentItem?.customAttributes?.storage?.type || currentProduct?.customAttributes?.storage?.type,
        suggestedLocation: currentItem?.suggestedLocation, condition: currentItem?.condition
    }, selectedJob?.countryCode || selectedJob?.country_code || activeSite?.country || '', isScannerOpen, selectedJob?.id, user?.id);
    const recommendation = routing.suggestions[0] || null;

    // --- MANAGE SCANNING LOGIC ---
    const { handleScanLocation, handleScanItem } = usePutawayScanning({
        selectedJob,
        currentItem,
        currentProduct,
        scannedLocation,
        setScannedLocation,
        setLocationOccupants,
        isSubmitting,
        isSubmittingRef,
        setIsSubmitting,
        putawayStock,
        updateJobItem,
        completeJob,
        addNotification,
        activeSite,
        allProducts,
        user,
        setSelectedJob,
        setIsScannerOpen
    });



    // Wrap handleScanLocation to store it
    const onScanLocationWrapper = async (loc: string) => {
        // Redundant Safety Check: Validate Prefix
        // Even if UI blocks it, API/Scanner logic should double check
        if (loc.length >= 14) {
            const scanPrefix = extractPrefixFromBarcode(loc);
            const expectedPrefix = activeSite?.barcodePrefix || extractSitePrefix(activeSite?.code); // Use system prefix

            if (scanPrefix && expectedPrefix && scanPrefix !== expectedPrefix) {
                addNotification('error', `Rejected: Barcode from wrong site (${scanPrefix})`);
                return;
            }
        }

        const normalized = normalizeLocation(loc);
        const canonLoc = normalized || loc;
        setScannedLocation(canonLoc);

        // Find occupants at this location
        const occupants = allProducts.filter(p =>
            normalizeLocation(p.location || '') === canonLoc &&
            p.siteId === activeSite?.id &&
            p.id !== currentProduct?.id
        );
        setLocationOccupants(occupants);

        await handleScanLocation(loc);
    };

    const onScanItemWrapper = async (barcode: string, quantity?: number) => {
        await handleScanItem(barcode, quantity);
        await queryClient.invalidateQueries({ queryKey: ['putawayRouting'] });
        // Clean up
        setScannedLocation(''); // Reset for next item
        setLocationOccupants([]);
    };

    const handleShowDetails = (job: WMSJob) => {
        setJobForModal(job);
        setIsJobModalOpen(true);
    };

    const handleStartFromModal = async (job: WMSJob) => {
        // Start/Resume job — startJobExecution sets selectedJob with optimized lineItems
        await handleStartJob(job);
        // Don't overwrite selectedJob — startJobExecution already set the optimized version
        setIsScannerOpen(true);
        // Close the modal to show the scanner clearly
        setIsJobModalOpen(false);
    };

    const handleCompleteJobFromModal = async (job: WMSJob) => {
        if (isSubmitting || !job.lineItems.length || !job.lineItems.every(item => ['Picked', 'Completed'].includes(item.status))) return;
        setIsSubmitting(true);
        try {
            await completeJob(job.id, user?.id || 'Driver', false, job.lineItems);
            setIsJobModalOpen(false);
            setJobForModal(null);
            setSelectedJob(null);
        } catch (e) {
            logger.error('PutawayTab', 'caught error', e as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col space-y-2 md:space-y-6">
            {/* PUTAWAY CONTROL HUB */}
            <PutawayHeader
                filteredJobsCount={filteredJobsCount}
                putawaySearch={putawaySearch}
                setPutawaySearch={setPutawaySearch}
                putawayStatusFilter={putawayStatusFilter}
                setPutawayStatusFilter={setPutawayStatusFilter}
                putawaySortBy={putawaySortBy}
                setPutawaySortBy={setPutawaySortBy}
                isPutawaySortDropdownOpen={isPutawaySortDropdownOpen}
                setIsPutawaySortDropdownOpen={setIsPutawaySortDropdownOpen}
                refreshData={refreshData}
                isSubmitting={isSubmitting}
                viewMode={viewMode}
                setViewMode={setViewMode}
                t={t}
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                    {viewMode === 'Process' ? (
                        <PutawayList
                            sortedPutawayJobs={sortedPutawayJobs}
                            paginatedPutawayJobs={paginatedPutawayJobs}
                            putawayCurrentPage={safePutawayCurrentPage}
                            putawayTotalPages={putawayTotalPages}
                            setPutawayCurrentPage={setPutawayCurrentPage}
                            putawayItemsPerPage={PUTAWAY_ITEMS_PER_PAGE}
                            resolveOrderRef={resolveOrderRef}
                            selectedJob={selectedJob}
                            setSelectedJob={setSelectedJob}
                            employees={employees}
                            user={user}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={setIsSubmitting}
                            handleStartJob={handleStartJob}
                            onShowDetails={handleShowDetails}
                            t={t}
                        />
                    ) : (
                        <div className="col-span-full">
                            <PutawayHistory
                                historicalJobs={historicalJobs}
                                resolveOrderRef={resolveOrderRef}
                                setSelectedJob={setSelectedJob}
                                setIsDetailsOpen={setIsDetailsOpen}
                                employees={employees}
                                sites={tabSites}
                                t={t}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* SCANNER OVERLAY */}
            {isScannerOpen && selectedJob && currentItem && (
                <PutawayScanner
                    job={selectedJob}
                    currentItem={currentItem}
                    currentProduct={currentProduct}
                    recommendation={recommendation}
                    routing={routing}
                    occupants={locationOccupants}
                    allProducts={allProducts}
                    activeSiteId={activeSite?.id}
                    expectedPrefix={activeSite?.barcodePrefix || extractSitePrefix(activeSite?.code)}
                    onClose={() => setIsScannerOpen(false)}
                    onScanLocation={onScanLocationWrapper}
                    onScanItem={onScanItemWrapper}
                    isProcessing={isSubmitting}
                    t={t}
                />
            )}

            {/* JOB DETAILS MODAL (Now the Work Hub) */}
            {jobForModal && (
                <PutawayJobModal
                    isOpen={isJobModalOpen}
                    onClose={() => { setIsJobModalOpen(false); setSelectedJob(null); }}
                    job={selectedJob?.id === jobForModal.id ? selectedJob : jobForModal}
                    user={user}
                    sites={sites}
                    products={allProducts}
                    onStartPutaway={handleStartFromModal}
                    onCompleteJob={handleCompleteJobFromModal}
                    isSubmitting={isSubmitting}
                    currentItem={currentItem}
                    resolveOrderRef={resolveOrderRef}
                    employees={employees}
                    t={t}
                    onDeleteJob={deleteJob}
                />
            )}

            {/* HISTORY DETAILS MODAL */}
            {isDetailsOpen && selectedJob && (
                <PutawayDetailsModal
                    selectedItem={selectedJob}
                    onClose={() => { setIsDetailsOpen(false); setSelectedJob(null); }}
                    resolveOrderRef={resolveOrderRef}
                    employees={employees}
                    sites={sites}
                    t={t}
                    onDeleteJob={deleteJob}
                />
            )}
        </div>
    );
};
