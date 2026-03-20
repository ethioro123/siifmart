import React, { useState, useMemo } from 'react';
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
import { useStore } from '../../contexts/CentralStore';
import { normalizeLocation, parseLocation } from '../../utils/locationTracking';
import { extractSitePrefix, extractPrefixFromBarcode } from '../../utils/locationEncoder';

interface PutawayTabProps {
    filteredJobs: WMSJob[];
    historicalJobs: WMSJob[];
    employees: Employee[];
    user: any;
    orders: any[];
    isSubmitting: boolean;
    setIsSubmitting: (v: boolean) => void;
    refreshData: () => void;
    handleStartJob: (job: WMSJob) => void;
    selectedJob: WMSJob | null;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    isDetailsOpen: boolean;
    resolveOrderRef: (ref?: string) => string;
}

const PUTAWAY_ITEMS_PER_PAGE = 10;

export const PutawayTab: React.FC<PutawayTabProps> = ({
    filteredJobs, historicalJobs, employees, user, orders,
    isSubmitting, setIsSubmitting, refreshData, handleStartJob,
    selectedJob, setSelectedJob, setIsDetailsOpen, resolveOrderRef, isDetailsOpen
}) => {
    // --- PUTAWAY-SPECIFIC STATE ---
    const [putawaySearch, setPutawaySearch] = useState('');
    const [putawayCurrentPage, setPutawayCurrentPage] = useState(1);
    const [isPutawaySortDropdownOpen, setIsPutawaySortDropdownOpen] = useState(false);
    const [putawayStatusFilter, setPutawayStatusFilter] = useState<'All' | 'Pending' | 'In-Progress'>('All');
    const [putawaySortBy, setPutawaySortBy] = useState<'priority' | 'date' | 'items'>('priority');
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

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
        putawayStock
    } = useFulfillment();

    // --- SORTED/FILTERED PUTAWAY JOBS ---
    const sortedPutawayJobs = useMemo(() => {
        let filtered = filteredJobs.filter(j => {
            if (j.type !== 'PUTAWAY' && j.type !== 'REPLENISH') return false;
            const status = j.status?.toLowerCase() || 'pending';
            if (status === 'completed' || status === 'cancelled') return false;
            if (j.lineItems && j.lineItems.length > 0) {
                const allDone = j.lineItems.every(i =>
                    i.status === 'Picked' || i.status === 'Short' || i.status === 'Discontinued'
                );
                if (allDone) return false;
            }
            return true;
        });

        if (putawayStatusFilter !== 'All') filtered = filtered.filter(j => j.status === putawayStatusFilter);
        if (putawaySearch) {
            filtered = filtered.filter(j =>
                j.id.toLowerCase().includes(putawaySearch.toLowerCase()) ||
                (j.orderRef && resolveOrderRef(j.orderRef).toLowerCase().includes(putawaySearch.toLowerCase()))
            );
        }

        return filtered.sort((a, b) => {
            if (putawaySortBy === 'priority') {
                const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            } else if (putawaySortBy === 'items') {
                return b.items - a.items;
            } else {
                return new Date(b.id).getTime() - new Date(a.id).getTime();
            }
        });
    }, [filteredJobs, putawayStatusFilter, putawaySearch, putawaySortBy, orders]);

    const putawayTotalPages = Math.ceil(sortedPutawayJobs.length / PUTAWAY_ITEMS_PER_PAGE);
    const safePutawayCurrentPage = Math.min(Math.max(1, putawayCurrentPage), Math.max(1, putawayTotalPages));
    const paginatedPutawayJobs = useMemo(() => {
        const start = (safePutawayCurrentPage - 1) * PUTAWAY_ITEMS_PER_PAGE;
        return sortedPutawayJobs.slice(start, start + PUTAWAY_ITEMS_PER_PAGE);
    }, [sortedPutawayJobs, safePutawayCurrentPage]);

    const filteredJobsCount = {
        pending: filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status === 'Pending').length,
        active: filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status === 'In-Progress').length,
        inboundItems: filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status !== 'Completed').reduce((sum, j) => {
            const lineItemsSum = j.lineItems?.reduce((acc, li) => acc + (li.expectedQty || 0), 0) || 0;
            return sum + Math.max(j.items || 0, lineItemsSum);
        }, 0),
    };

    // --- ACTIVE JOB HELPERS ---
    const currentItem = useMemo(() => {
        if (!selectedJob) return undefined;
        return selectedJob.lineItems?.find(i => i.status !== 'Completed' && i.status !== 'Picked');
    }, [selectedJob]);

    const currentProduct = useMemo(() => {
        if (!currentItem) return undefined;
        const targetSiteId = activeSite?.id;
        return allProducts.find(p =>
            (p.id === currentItem.productId || p.sku === currentItem.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        );
    }, [currentItem, allProducts, activeSite]);

    const recommendation = useMemo(() => {
        if (!currentItem) return null;
        const targetSku = currentItem.sku;
        const targetSiteId = activeSite?.id;

        // 1. PRIMARY: Consolidation (Same SKU already in this warehouse)
        // Check if this SKU exists in ANY bay in the current site
        const existingStock = allProducts.filter(p =>
            p.sku === targetSku &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId) &&
            p.location &&
            p.location !== 'On Order' &&
            p.location !== 'Populating...'
        );

        if (existingStock.length > 0) {
            // Pick the first/main location
            return {
                location: existingStock[0].location!,
                type: 'ASSIGNED' as const,
                label: 'Existing Stock Bay'
            };
        }

        // 2. SECONDARY: Local Category Hub (Cluster nearby similar items)
        if (currentProduct?.category) {
            const categoryItems = allProducts.filter(p =>
                p.category === currentProduct.category &&
                p.location &&
                (p.siteId === targetSiteId || p.site_id === targetSiteId)
            );

            if (categoryItems.length > 0) {
                const freq: Record<string, number> = {};
                categoryItems.forEach(p => {
                    const loc = p.location!;
                    // Use normalizeLocation for consistent parsing of verbose/strict formats
                    const strictLoc = normalizeLocation(loc);
                    if (strictLoc) {
                        const parts = strictLoc.split('-');
                        const zoneAisle = `${parts[0]}-${parts[1]}`;
                        freq[zoneAisle] = (freq[zoneAisle] || 0) + 1;
                    }
                });

                const sortedFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                if (sortedFreq.length > 0) {
                    const [zone, aisle] = sortedFreq[0][0].split('-');
                    return {
                        location: `ZONE ${zone} • AISLE ${aisle}`,
                        type: 'SUGGESTED' as const,
                        label: 'Local Category Hub'
                    };
                }
            }
        }

        // 3. TERTIARY: Global Category Hint (Peeking at other site layouts)
        if (currentProduct?.category) {
            const globalCategoryItems = allProducts.filter(p =>
                p.category === currentProduct.category &&
                p.location &&
                p.location !== 'On Order'
            );

            if (globalCategoryItems.length > 0) {
                const globalFreq: Record<string, number> = {};
                globalCategoryItems.forEach(p => {
                    const parsed = parseLocation(p.location!);
                    if (parsed.isValid) {
                        const zoneGroup = `ZONE ${parsed.zone}`;
                        globalFreq[zoneGroup] = (globalFreq[zoneGroup] || 0) + 1;
                    }
                });

                const sortedGlobal = Object.entries(globalFreq).sort((a, b) => b[1] - a[1]);
                if (sortedGlobal.length > 0) {
                    return {
                        location: sortedGlobal[0][0],
                        type: 'SUGGESTED' as const,
                        label: 'Global Standard Area'
                    };
                }
            }
        }

        return null;
    }, [currentItem, currentProduct, allProducts, activeSite]);

    // --- MANAGE SCANNING LOGIC ---

    const handleScanLocation = async (loc: string) => {
        const normalized = normalizeLocation(loc);

        if (!normalized) {
            addNotification('error', `Invalid storage format. Expected: A-02-03 (Zones A-Z, Aisles 1-99, Bays 1-99)`);
            throw new Error('Invalid location format');
        }

        addNotification('success', `Location ${normalized} ready`);
        return;
    };

    const handleScanItem = async (barcode: string) => {
        if (!selectedJob || !currentItem) return;

        // [NEW] Enforce location scan first
        if (!scannedLocation) {
            addNotification('alert', 'Please scan a location first!');
            throw new Error('Location not scanned');
        }

        const normalized = barcode.toUpperCase().trim();
        const product = currentProduct;

        const isValid =
            normalized === currentItem.sku?.toUpperCase() ||
            normalized === product?.barcode?.toUpperCase() ||
            (product?.barcodes && product.barcodes.includes(normalized));

        if (!isValid) {
            addNotification('alert', 'Wrong item scanned!');
            throw new Error('Wrong item');
        }

        setIsSubmitting(true);
        try {
            // Capture a single timestamp for consistency across inventory and putaway history
            const putawayTimestamp = new Date().toISOString();

            // 2. Putaway Stock Logic (Replaces adjustStock + relocate)
            await putawayStock({
                sku: currentItem.sku || '',
                location: scannedLocation,
                quantity: currentItem.expectedQty,
                siteId: activeSite?.id,
                type: 'IN',
                expiryDate: currentItem.expiryDate,
                batchNumber: currentItem.batchNumber,
                sourceProductId: currentItem.productId,
                timestamp: putawayTimestamp,
                // Pass PO attributes from job line item → product record
                size: currentItem.size,
                brand: currentItem.brand,
                unit: currentItem.unit,
                packQuantity: currentItem.packQuantity,
                category: currentItem.category,
                retailPrice: currentItem.retailPrice,
                customAttributes: currentItem.customAttributes,
                description: currentItem.description,
                minStock: currentItem.minStock,
                maxStock: currentItem.maxStock
            });

            // 1. Update Job Item Status — use findIndex (not indexOf) to avoid reference mismatch
            const itemIndex = selectedJob.lineItems.findIndex(i =>
                (i.productId === currentItem.productId || i.sku === currentItem.sku) &&
                i.status !== 'Picked' && i.status !== 'Completed'
            );
            console.log('📍 [PUTAWAY] itemIndex:', itemIndex, 'of', selectedJob.lineItems.length, 'items');

            if (itemIndex === -1) {
                console.error('❌ [PUTAWAY] Could not find current item in lineItems!', currentItem);
                addNotification('alert', 'Error: item not found in job');
                return;
            }

            await updateJobItem(selectedJob.id, itemIndex, 'Picked', currentItem.expectedQty, scannedLocation);

            addNotification('success', 'Item put away successfully');

            // 3. Update Local Job State
            const nextItems = [...selectedJob.lineItems];
            nextItems[itemIndex] = { ...currentItem, status: 'Picked', pickedQty: currentItem.expectedQty, location: scannedLocation };

            // 4. Auto-Complete: If all items are done, complete the job automatically
            const allDone = nextItems.every(i => i.status === 'Picked' || i.status === 'Short' || i.status === 'Completed');
            console.log('📍 [PUTAWAY] allDone:', allDone, 'statuses:', nextItems.map(i => i.status));

            if (allDone) {
                console.log('🏁 [PUTAWAY] Auto-completing job', selectedJob.id);
                await completeJob(selectedJob.id, user?.id || 'Driver', false, nextItems, putawayTimestamp);
                addNotification('success', 'All items put away — Job completed!');
                setIsScannerOpen(false);
                setSelectedJob(null);
            } else {
                setSelectedJob({ ...selectedJob, lineItems: nextItems });
            }

        } catch (e) {
            console.error('❌ [PUTAWAY] Error:', e);
            addNotification('alert', 'Error processing putaway');
            throw e;
        } finally {
            setIsSubmitting(false);
        }
    };



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

    const onScanItemWrapper = async (barcode: string) => {
        await handleScanItem(barcode);
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
        setIsSubmitting(true);
        try {
            await completeJob(job.id, user?.id || 'Driver', false, job.lineItems);
            setIsJobModalOpen(false);
            setJobForModal(null);
            setSelectedJob(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
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
                        />
                    ) : (
                        <div className="col-span-full">
                            <PutawayHistory
                                historicalJobs={historicalJobs}
                                resolveOrderRef={resolveOrderRef}
                                setSelectedJob={setSelectedJob}
                                setIsDetailsOpen={setIsDetailsOpen}
                                employees={employees}
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
                    occupants={locationOccupants}
                    allProducts={allProducts}
                    activeSiteId={activeSite?.id}
                    expectedPrefix={activeSite?.barcodePrefix || extractSitePrefix(activeSite?.code)}
                    onClose={() => setIsScannerOpen(false)}
                    onScanLocation={onScanLocationWrapper}
                    onScanItem={onScanItemWrapper}
                    isProcessing={isSubmitting}
                />
            )}

            {/* JOB DETAILS MODAL (Now the Work Hub) */}
            {jobForModal && (
                <PutawayJobModal
                    isOpen={isJobModalOpen}
                    onClose={() => {
                        setIsJobModalOpen(false);
                        setSelectedJob(null); // Clear active sync if they close the hub
                    }}
                    job={selectedJob?.id === jobForModal.id ? selectedJob : jobForModal}
                    user={user}
                    sites={sites}
                    products={allProducts}
                    onStartPutaway={handleStartFromModal}
                    onCompleteJob={handleCompleteJobFromModal}
                    isSubmitting={isSubmitting}
                    currentItem={currentItem}
                    resolveOrderRef={resolveOrderRef}
                />
            )}

            {/* HISTORY DETAILS MODAL */}
            {isDetailsOpen && selectedJob && (
                <PutawayDetailsModal
                    selectedItem={selectedJob}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedJob(null);
                    }}
                    resolveOrderRef={resolveOrderRef}
                    employees={employees}
                />
            )}
        </div>
    );
};
