import { isExactPackQuantity } from '../../../../utils/packScanValidation';
import React, { useState, useRef } from 'react';
import { useFulfillment } from '../../FulfillmentContext';
import { PackJobModal } from '../PackJobModal';
import { PackScanner } from '../PackScanner';
import { PackDiscrepancyModal } from '../PackDiscrepancyModal';
import { PackDetailsModal } from '../PackDetailsModal';
import { ReturnToWarehouseModal } from '../../returns/ReturnToWarehouseModal';
import { FulfillmentSuccessScreen } from '../../FulfillmentSuccessScreen';
import { WMSJob } from '../../../../types';
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
        refreshData,
        deleteJob
    } = useFulfillment();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const completionLock = useRef(false);
    const [discrepancyCount, setDiscrepancyCount] = useState<{ line: number; count: number } | null>(null);

    const { handlePrintLabel, handleReprintLabel, getLabelQtyAndUnit, isPrinting } = usePackLabelPrint({
        products,
        sites,
        resolveOrderRef,
        generateTrackingNumber,
        addNotification
    });

    // Handler for scanner confirm pack (scan-to-verify per item)
    const handleScanConfirmPack = async (itemIndex: number, qty: number) => {
        if (!selectedPackJob) return;

        const item = selectedPackJob.lineItems![itemIndex];

        // qty coming in from PackScanner is already the CASES count (e.g. 20 packs),
        // NOT the base measure — scanner now pre-fills expectedQty directly, so no conversion needed.
        const casesQty = qty;

        const expectedQty = item.expectedQty || 1;
        if (!isExactPackQuantity(casesQty, expectedQty)) throw new Error('Record the exact physical quantity before confirming packing.');
        const isPacked = true;
        const newStatus = isPacked ? 'Picked' : 'In-Progress';

        await updateJobItem(selectedPackJob.id, itemIndex, newStatus, casesQty, undefined, {
            packed: isPacked,
            packedQty: casesQty
        });

        const updatedLineItems = [...(selectedPackJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            packed: isPacked,
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
        if (!selectedPackJob || completionLock.current) return;
        completionLock.current = true;
        setIsSubmitting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum });
                selectedPackJob.trackingNumber = trackingNum;
            }

            if (boxDetails?.requirePackSecuritySeal) {
                await wmsJobsService.update(selectedPackJob.id, {
                    packSecuritySealSerial: boxDetails.sealSerialNumber,
                });
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
            completionLock.current = false;
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
                        onStartPack={async (jobToStart) => {
                            const target = jobToStart || selectedPackJob;
                            if (target && target.status === 'Pending') {
                                try {
                                    await wmsJobsService.update(target.id, { status: 'In-Progress' });
                                    setSelectedPackJob(prev => prev ? { ...prev, status: 'In-Progress' } : prev);
                                } catch (e) {
                                    logger.error('Fulfillment', 'startPack', e);
                                    addNotification('alert', 'Could not start this packing job. Check your connection and try again.');
                                    throw e;
                                }
                            }
                        }}
                        onCompleteJob={handleCompleteJob}
                        onPrintLabel={(boxDetails) => handlePrintLabel(selectedPackJob, boxDetails)}
                        isSubmitting={isSubmitting || isPrinting}
                        resolveOrderRef={resolveOrderRef}
                        onOpenScanner={() => {
                            setIsPackModalOpen(false);
                            setIsScannerOpen(true);
                        }}
                        onFlagDiscrepancy={() => setIsDiscrepancyModalOpen(true)}
                        onDeleteJob={deleteJob}
                    />

                    {isScannerOpen && (
                        <PackScanner
                            job={selectedPackJob}
                            products={filteredProducts}
                            onClose={() => {
                                setIsScannerOpen(false);
                                setIsPackModalOpen(true);
                            }}
                            onFlagDiscrepancy={(line, count) => { setDiscrepancyCount({ line, count }); setIsDiscrepancyModalOpen(true); }}
                            onConfirmPack={handleScanConfirmPack}
                            onCompleteJob={handleScannerComplete}
                            isProcessing={isSubmitting || isPrinting}
                        />
                    )}

                    {/* Pack Discrepancy Modal */}
                    <PackDiscrepancyModal
                        isOpen={isDiscrepancyModalOpen}
                        onClose={() => { setIsDiscrepancyModalOpen(false); setDiscrepancyCount(null); }}
                        initialLine={discrepancyCount?.line}
                        initialCount={discrepancyCount?.count}
                        job={selectedPackJob}
                        currentUser={user}
                        wmsJobsService={wmsJobsService}
                        addNotification={addNotification}
                        refreshData={refreshData}

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
                    onDeleteJob={deleteJob}
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
