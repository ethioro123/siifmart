import React, { useState } from 'react';
import { useFulfillment } from '../../FulfillmentContext';
import { PackJobModal } from '../PackJobModal';
import { PackScanner } from '../PackScanner';
import { PackDiscrepancyModal } from '../PackDiscrepancyModal';
import { PackDetailsModal } from '../PackDetailsModal';
import { ReturnToWarehouseModal } from '../../returns/ReturnToWarehouseModal';
import { FulfillmentSuccessScreen } from '../../FulfillmentSuccessScreen';
import { WMSJob } from '../../../../types';
import { generatePackLabelHTML } from '../../../../utils/labels/PackLabelGenerator';
import { isWeightBased, isVolumeBased } from '../../../../utils/units';
import { wmsJobsService, inventoryRequestsService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';

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

    const getLabelQtyAndUnit = (item: any, product?: any) => {
        if (product) {
            const unit = product.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = product.size ? parseFloat(product.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : expected;
                const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                return {
                    quantity: `${displayPickedCases} x ${sizeNum}`,
                    unit
                };
            }
        }
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return {
                quantity: (item as any).requestedMeasureQty,
                unit: product?.unit || item.unit || 'KG'
            };
        }
        return {
            quantity: item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : (item.expectedQty || 0),
            unit: product?.unit || item.unit
        };
    };

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
            pickedQty: casesQty
        };

        const updatedJob = filteredJobs.find(j => j.id === selectedPackJob.id);
        if (updatedJob) setSelectedPackJob({ ...updatedJob, lineItems: updatedLineItems, trackingNumber: selectedPackJob.trackingNumber });
    };

    const handlePrintLabel = async (boxDetails: any) => {
        if (!selectedPackJob) return;
        setIsSubmitting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum }).catch(console.error);
            }

            const sourceSite = sites.find(s => s.id === selectedPackJob.siteId);
            const totalItems = selectedPackJob.lineItems?.length || 0;

            const packLabelData: any = {
                orderRef: selectedPackJob.orderRef || selectedPackJob.id,
                originalOrderRef: resolveOrderRef(selectedPackJob.orderRef) || (selectedPackJob as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: trackingNum,
                itemCount: totalItems,
                totalPackages: totalItems,
                customerName: (selectedPackJob as any).customerName,
                shippingAddress: (selectedPackJob as any).shippingAddress || boxDetails.destSite?.address,
                city: (selectedPackJob as any).city,
                packDate: new Date().toISOString(),
                packerName: user?.name,
                specialHandling: { coldChain: boxDetails.hasColdItems, fragile: boxDetails.packingMaterials?.bubbleWrap || boxDetails.packingMaterials?.fragileStickers, perishable: boxDetails.hasColdItems },
                destSiteName: boxDetails.destSite?.name || boxDetails.destSiteName,
                lineItems: selectedPackJob.lineItems?.map((i: any) => {
                    const product = products.find(p => p.sku === i.sku || p.id === i.productId);
                    const qtyInfo = getLabelQtyAndUnit(i, product);
                    return {
                        name: i.name || product?.name || 'Unknown Product',
                        sku: i.sku || product?.sku || 'N/A',
                        quantity: qtyInfo.quantity,
                        unit: qtyInfo.unit
                    };
                })
            };

            let labelSize = 'XL';
            if (boxDetails.boxSize === 'Small') labelSize = 'Small';
            if (boxDetails.boxSize === 'Medium') labelSize = 'Medium';
            if (boxDetails.boxSize === 'Large') labelSize = 'Large';
            if (boxDetails.boxSize === 'Extra Large') labelSize = 'XL';

            const html = await generatePackLabelHTML(packLabelData, { size: labelSize, format: 'Both' });

            let printHTML = html;
            const scriptTag = '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>';
            if (printHTML.includes('</body>')) {
                printHTML = printHTML.replace('</body>', `${scriptTag}</body>`);
            } else {
                printHTML += scriptTag;
            }

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printHTML);
                printWindow.document.close();
            }

            addNotification('success', 'Label ready to print!');
        } catch (err) {
            logger.error('PackModalsContainer', 'caught error', err as Error);
            addNotification('alert', 'Failed to generate label');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReprintLabel = async (job: WMSJob, labelSize: string) => {
        setIsSubmitting(true);
        try {
            const sourceSite = sites.find(s => s.id === job.siteId);
            const destSite = job.destSiteId ? sites.find(s => s.id === job.destSiteId) : undefined;
            const totalItems = job.lineItems?.length || 0;

            const packLabelData: any = {
                orderRef: job.orderRef || job.id,
                originalOrderRef: resolveOrderRef(job.orderRef) || (job as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: job.trackingNumber,
                itemCount: totalItems,
                customerName: (job as any).customerName,
                shippingAddress: (job as any).shippingAddress || destSite?.address,
                city: (job as any).city,
                packDate: new Date(job.updatedAt || job.createdAt || '').toISOString(),
                packerName: (job as any).user || 'System',
                specialHandling: {
                    fragile: job.lineItems?.some((i: any) => i.name?.toLowerCase().includes('fragile')),
                    coldChain: job.lineItems?.some((i: any) => i.category === 'Frozen' || i.category === 'Dairy'),
                    perishable: job.lineItems?.some((i: any) => i.category === 'Frozen' || i.category === 'Dairy')
                },
                destSiteName: destSite?.name,
                lineItems: job.lineItems?.map((i: any) => {
                    const product = products.find(p => p.sku === i.sku || p.id === i.productId);
                    const qtyInfo = getLabelQtyAndUnit(i, product);
                    return {
                        name: i.name || product?.name || 'Unknown Product',
                        sku: i.sku || product?.sku || 'N/A',
                        quantity: qtyInfo.quantity,
                        unit: qtyInfo.unit
                    };
                })
            };

            const html = await generatePackLabelHTML(packLabelData, { size: labelSize, format: 'Both' });

            let printHTML = html;
            const scriptTag = '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>';
            if (printHTML.includes('</body>')) {
                printHTML = printHTML.replace('</body>', `${scriptTag}</body>`);
            } else {
                printHTML += scriptTag;
            }

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printHTML);
                printWindow.document.close();
            }

            addNotification('success', 'Label ready to print!');
        } catch (err) {
            logger.error('PackModalsContainer', 'caught error', err as Error);
            addNotification('alert', 'Failed to generate label');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Per-product shipping label
    const handlePrintItemLabel = async (item: any, product: any, boxSize?: string) => {
        if (!selectedPackJob) return;
        setIsSubmitting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum }).catch(console.error);
            }

            const sourceSite = sites.find(s => s.id === selectedPackJob.siteId);
            const destSite = selectedPackJob.destSiteId ? sites.find(s => s.id === selectedPackJob.destSiteId) : undefined;
            const totalPkgs = selectedPackJob.lineItems?.length || 1;
            const itemIndex = selectedPackJob.lineItems?.findIndex((i: any) => i.sku === item.sku) ?? 0;

            const itemLabelData: any = {
                orderRef: selectedPackJob.orderRef || selectedPackJob.id,
                originalOrderRef: resolveOrderRef(selectedPackJob.orderRef) || (selectedPackJob as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: trackingNum,
                itemCount: 1,
                packageNumber: itemIndex + 1,
                totalPackages: totalPkgs,
                customerName: (selectedPackJob as any).customerName,
                shippingAddress: (selectedPackJob as any).shippingAddress || destSite?.address,
                city: (selectedPackJob as any).city,
                packDate: new Date().toISOString(),
                packerName: user?.name,
                destSiteName: destSite?.name,
                lineItems: [{
                    name: item.name || product?.name || 'Unknown Product',
                    sku: item.sku || product?.sku || 'N/A',
                    quantity: getLabelQtyAndUnit(item, product).quantity,
                    unit: getLabelQtyAndUnit(item, product).unit
                }]
            };

            let labelSize = boxSize || 'Large';
            if (labelSize === 'Extra Large') labelSize = 'XL';

            const html = await generatePackLabelHTML(itemLabelData, { size: labelSize, format: 'Both' });
            let printHTML = html;
            const scriptTag = '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>';
            if (printHTML.includes('</body>')) {
                printHTML = printHTML.replace('</body>', `${scriptTag}</body>`);
            } else {
                printHTML += scriptTag;
            }

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printHTML);
                printWindow.document.close();
            }

            addNotification('success', `Label printed for ${item.name || item.sku}`);
        } catch (err) {
            logger.error('PackModalsContainer', 'caught error', err as Error);
            addNotification('alert', 'Failed to generate item label');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for scanner confirm pack (scan-to-verify per item)
    const handleScanConfirmPack = async (itemIndex: number, qty: number) => {
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

        await updateJobItem(selectedPackJob.id, itemIndex, newStatus, casesQty);

        const updatedLineItems = [...(selectedPackJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            pickedQty: casesQty
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
                        onPrintLabel={handlePrintLabel}
                        isSubmitting={isSubmitting}
                        resolveOrderRef={resolveOrderRef}
                        onOpenScanner={() => {
                            setIsPackModalOpen(false);
                            setIsScannerOpen(true);
                        }}
                        onPrintItemLabel={handlePrintItemLabel}
                        onFlagDiscrepancy={() => setIsDiscrepancyModalOpen(true)}
                    />

                    {isScannerOpen && (
                        <PackScanner
                            job={selectedPackJob}
                            products={filteredProducts}
                            onClose={() => setIsScannerOpen(false)}
                            onConfirmPack={handleScanConfirmPack}
                            onCompleteJob={handleScannerComplete}
                            isProcessing={isSubmitting}
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
