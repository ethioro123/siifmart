import React, { useState } from 'react';
import { useFulfillment } from '../../FulfillmentContext';
import { PackJobModal } from '../PackJobModal';
import { PackScanner } from '../PackScanner';
import { PackDiscrepancyModal } from '../PackDiscrepancyModal';
import { PackDetailsModal } from '../PackDetailsModal';
import { ReturnToWarehouseModal } from '../../returns/ReturnToWarehouseModal';
import { FulfillmentSuccessScreen } from '../../FulfillmentSuccessScreen';
import { WMSJob } from '../../../../types';
import { isWeightBased, isVolumeBased, getEffectivePackageSize } from '../../../../utils/units';
import { wmsJobsService, inventoryRequestsService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';
import { usePackLabelPrint } from '../hooks/usePackLabelPrint';

interface PackModalsContainerProps {
    selectedPackJob: WMSJob | null;
    setSelectedPackJob: React.Dispatch<React.SetStateAction<WMSJob | null>>;
    isPackModalOpen: boolean;
    setIsPackModalOpen: (val: boolean) => void;
    isScannerOpen: boolean;
    setIsScannerOpen: (val: boolean) => void;
    isDiscrepancyModalOpen: boolean;
    setIsDiscrepancyModalOpen: (val: boolean) => void;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (val: boolean) => void;
    returnJob: WMSJob | null;
    setReturnJob: (val: WMSJob | null) => void;
    showSuccessScreen: boolean;
    setShowSuccessScreen: (val: boolean) => void;
    completedJobInfo: any;
    setCompletedJobInfo: (val: any) => void;
    setViewMode: (val: 'Process' | 'History') => void;
}

export const PackModalsContainer: React.FC<PackModalsContainerProps> = ({
    selectedPackJob,
    setSelectedPackJob,
    isPackModalOpen,
    setIsPackModalOpen,
    isScannerOpen,
    setIsScannerOpen,
    isDiscrepancyModalOpen,
    setIsDiscrepancyModalOpen,
    isDetailsOpen,
    setIsDetailsOpen,
    returnJob,
    setReturnJob,
    showSuccessScreen,
    setShowSuccessScreen,
    completedJobInfo,
    setCompletedJobInfo,
    setViewMode
}) => {
    const {
        filteredJobs,
        historicalJobs,
        sites,
        filteredProducts,
        products,
        user,
        employees,
        jobs,
        updateJobItem,
        completeJob,
        addNotification,
        formatJobId,
        resolveOrderRef,
        generateTrackingNumber,
        setEarnedPoints,
        setShowPointsPopup,
        refreshData
    } = useFulfillment();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const { handlePrintLabel, handleReprintLabel, handlePrintItemLabel, getLabelQtyAndUnit, isPrinting } = usePackLabelPrint({
        products,
        sites,
        user,
        resolveOrderRef,
        generateTrackingNumber,
        addNotification
    });

    const handleUpdateItemQty = async (itemIndex: number, qty: number) => {
        if (!selectedPackJob) return;

        const item = selectedPackJob.lineItems![itemIndex];
        const product = products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === selectedPackJob.siteId || p.site_id === selectedPackJob.siteId));
        
        let casesQty = qty;
        if (product) {
            const unit = product.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = product.size ? parseFloat(product.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                casesQty = qty / sizeNum;
            }
        }

        const expectedQty = item.expectedQty || 1;
        const newStatus = casesQty >= expectedQty ? 'Picked' : 'In-Progress';

        // Optimistic Update
        await updateJobItem(selectedPackJob.id, itemIndex, newStatus, casesQty);

        const updatedLineItems = [...(selectedPackJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            pickedQty: casesQty,
            packed: casesQty >= expectedQty,
            packedQty: casesQty
        };

        const updatedJob = filteredJobs.find(j => j.id === selectedPackJob.id);
        if (updatedJob) setSelectedPackJob({ ...updatedJob, lineItems: updatedLineItems, trackingNumber: selectedPackJob.trackingNumber });
    };

    // Handler for scanner confirm pack (scan-to-verify per item)
    const handleScanConfirmPack = async (itemIndex: number, qty: number) => {
        if (!selectedPackJob) return;

        const item = selectedPackJob.lineItems![itemIndex];
        // productId-first lookup, then site-scoped SKU, then any-site SKU fallback
        const product = products.find(p => p.id === item.productId)
            || products.find(p => (p.sku === item.sku) && (p.siteId === selectedPackJob.siteId || p.site_id === selectedPackJob.siteId))
            || products.find(p => p.sku === item.sku);

        // qty coming in is TOTAL MEASURE (e.g. 37 L). Convert to cases for storage.
        const effectiveUnit = product?.unit || item.unit;
        const effectiveSize = product?.size || item.size;
        const sizeNum = getEffectivePackageSize(effectiveUnit, effectiveSize);
        const isWeightVol = effectiveUnit ? (isWeightBased(effectiveUnit) || isVolumeBased(effectiveUnit)) : false;

        let casesQty = qty;
        if (isWeightVol && sizeNum > 1) {
            // qty is in base measure (e.g. 37 L), convert to cases (37 / 20 = 1.85)
            casesQty = qty / sizeNum;
        }

        const expectedQty = item.expectedQty || 1;
        const newStatus = casesQty >= expectedQty - 0.001 ? 'Picked' : 'In-Progress';

        await updateJobItem(selectedPackJob.id, itemIndex, newStatus, casesQty);

        const updatedLineItems = [...(selectedPackJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            pickedQty: casesQty,
            packed: casesQty >= expectedQty - 0.001,
            packedQty: casesQty
        };

        setSelectedPackJob({ ...selectedPackJob, lineItems: updatedLineItems, trackingNumber: selectedPackJob.trackingNumber });
    };

    const handleScannerComplete = async () => {
        if (!selectedPackJob) return;
        setIsScannerOpen(false);
        setIsPackModalOpen(true);
    };

    const handleCompleteJob = async (boxDetails: any) => {
        if (!selectedPackJob) return;
        setIsSubmitting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum });
                selectedPackJob.trackingNumber = trackingNum;
            }

            const result = await completeJob(selectedPackJob.id, user?.name || 'Packer', false, selectedPackJob.lineItems);
            if (result && result.points > 0) {
                setEarnedPoints({ points: result.points, message: `Order Packed!`, bonuses: result.breakdown });
                setShowPointsPopup(true);
            }
            addNotification('success', `Order Packed! Tracking: ${trackingNum}`);
            setIsPackModalOpen(false);
            
            setCompletedJobInfo({
                id: selectedPackJob.id,
                jobNumber: selectedPackJob.jobNumber,
                type: 'PACK'
            });
            setShowSuccessScreen(true);
            
            setSelectedPackJob(null);
        } catch (err: any) {
            addNotification('alert', err?.message || 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {selectedPackJob && (
                <>
                    <PackJobModal
                        isOpen={isPackModalOpen}
                        onClose={() => { setIsPackModalOpen(false); setSelectedPackJob(null); }}
                        job={selectedPackJob}
                        user={user}
                        sites={sites}
                        products={filteredProducts}
                        onStartPack={() => { }}
                        onUpdateItemQty={handleUpdateItemQty}
                        onCompleteJob={handleCompleteJob}
                        onPrintLabel={(boxDetails) => handlePrintLabel(selectedPackJob, boxDetails)}
                        isSubmitting={isSubmitting || isPrinting}
                        resolveOrderRef={resolveOrderRef}
                        onOpenScanner={() => {
                            setIsPackModalOpen(false);
                            setIsScannerOpen(true);
                        }}
                        onPrintItemLabel={(item, product, boxSize) => handlePrintItemLabel(selectedPackJob, item, product, boxSize)}
                        onFlagDiscrepancy={() => setIsDiscrepancyModalOpen(true)}
                    />

                    {isScannerOpen && (
                        <PackScanner
                            job={selectedPackJob}
                            products={filteredProducts}
                            onClose={() => setIsScannerOpen(false)}
                            onConfirmPack={handleScanConfirmPack}
                            onCompleteJob={handleScannerComplete}
                            isProcessing={isSubmitting || isPrinting}
                        />
                    )}

                    {/* Pack Discrepancy Modal */}
                    <PackDiscrepancyModal
                        isOpen={isDiscrepancyModalOpen}
                        onClose={() => setIsDiscrepancyModalOpen(false)}
                        job={selectedPackJob}
                        currentUser={user}
                        wmsJobsService={wmsJobsService}
                        addNotification={addNotification}
                        refreshData={refreshData}
                        onAcceptCount={(updatedLineItems) => {
                            setSelectedPackJob(prev => prev ? { ...prev, lineItems: updatedLineItems } : prev);
                        }}
                    />
                </>
            )}

            {/* HISTORY DETAILS MODAL */}
            {isDetailsOpen && selectedPackJob && (selectedPackJob.status === 'Completed' || selectedPackJob.status === 'Cancelled') && (
                <PackDetailsModal
                    selectedItem={selectedPackJob}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedPackJob(null);
                    }}
                    resolveOrderRef={resolveOrderRef}
                    employees={employees}
                    sites={sites}
                    products={products}
                    onReturn={(job) => setReturnJob(job)}
                    onReprintLabel={handleReprintLabel}
                />
            )}

            {/* RETURN MODAL */}
            {returnJob && (
                <ReturnToWarehouseModal
                    job={returnJob}
                    products={products || []}
                    user={user}
                    onClose={() => setReturnJob(null)}
                    addNotification={addNotification || (() => { })}
                    inventoryRequestsService={inventoryRequestsService}
                    wmsJobsService={wmsJobsService}
                    jobs={jobs}
                />
            )}

            {/* SUCCESS SCREEN */}
            <FulfillmentSuccessScreen
                isOpen={showSuccessScreen}
                onClose={() => setShowSuccessScreen(false)}
                jobData={completedJobInfo}
                onViewHistory={() => {
                    setShowSuccessScreen(false);
                    setViewMode('History');
                }}
            />
        </>
    );
};
export default PackModalsContainer;
