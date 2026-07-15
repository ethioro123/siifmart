import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFulfillment } from './FulfillmentContext';
import { PickHistory } from './pick/PickHistory';
import { PickHeader } from './pick/PickHeader';
import { PickList } from './pick/PickList';
import { WMSJob } from '../../types';
import { PickJobModal } from './pick/PickJobModal';
import { PickScanner } from './pick/PickScanner';
import { PickDetailsModal } from './pick/PickDetailsModal';
import { ReturnToWarehouseModal } from './returns/ReturnToWarehouseModal';
import { inventoryRequestsService } from '../../services/supabase.service';
import { FulfillmentSuccessScreen } from './FulfillmentSuccessScreen';
import { isWeightBased, isVolumeBased } from '../../utils/units';
import { logger } from '../../utils/logger';
import { formatJobId } from '../../utils/jobIdFormatter';

const PICK_ITEMS_PER_PAGE = 12;

export const PickTab: React.FC = () => {
    const {
        filteredJobs, user, historicalJobs, employees, sites, products, jobs,
        resolveOrderRef, handleStartJob, setSelectedJob, selectedJob, setIsDetailsOpen, isDetailsOpen,
        completeJob, updateJobItem, isSubmitting, addNotification, wmsJobsService
    } = useFulfillment();

    const { t } = useLanguage();

    // --- PICK-SPECIFIC STATE ---
    const [pickSearch, setPickSearch] = useState('');
    const [pickSortBy, setPickSortBy] = useState<'priority' | 'date' | 'items' | 'site'>('date');
    const [isPickSortDropdownOpen, setIsPickSortDropdownOpen] = useState(false);
    const [pickCurrentPage, setPickCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    // --- MODAL & SCANNER STATE ---
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [completedJobInfo, setCompletedJobInfo] = useState<any>(null);

    // Derived state for the scanner
    const currentScannerItem = useMemo(() => {
        if (!selectedJob || selectedJob.type !== 'PICK') return null;
        return selectedJob.lineItems?.find((i: any) => (i.status || '').toLowerCase() !== 'completed' && (i.status || '').toLowerCase() !== 'picked');
    }, [selectedJob]);

    const currentScannerProduct = useMemo(() => {
        if (!currentScannerItem || !selectedJob) return undefined;
        const targetSiteId = selectedJob.siteId || (selectedJob as any).site_id;
        return products.find(p =>
            (p.id === currentScannerItem.productId || p.sku === currentScannerItem.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        );
    }, [currentScannerItem, selectedJob, products]);

    // Handle job click from the List view
    const onJobClick = (job: WMSJob) => {
        setSelectedJob(job);
        setIsJobModalOpen(true);
    };

    const handleStartPick = (job: WMSJob) => {
        handleStartJob(job);
        setIsJobModalOpen(false);
        setIsScannerOpen(true);
    };

    const handleCompleteJob = async (jobOrIgnored?: WMSJob) => {
        // Always use selectedJob (which has the most up-to-date lineItems)
        const latestJob = selectedJob;
        if (!latestJob) return;
        setIsJobModalOpen(false);
        setIsScannerOpen(false);
        await completeJob(latestJob.id, user?.name || 'Worker', false, latestJob.lineItems);
        
        // Show Success Screen
        setCompletedJobInfo({
            id: latestJob.id,
            jobNumber: latestJob.jobNumber,
            type: 'PICK'
        });
        setShowSuccessScreen(true);
        
        setSelectedJob(null);
    };

    const handleScanLocation = async (location: string) => {
        // Just verify location. Do nothing to DB yet.
    };

    const handleScanItem = async (barcode: string, quantity?: number) => {
        if (!selectedJob || !currentScannerItem) return;
        const targetSiteId = selectedJob.siteId || (selectedJob as any).site_id;
        const product = products.find(p => (p.barcode === barcode || p.sku === barcode) && (p.siteId === targetSiteId || p.site_id === targetSiteId));

        if (!product || (product.sku !== currentScannerItem.sku)) {
            throw new Error("Invalid Item");
        }

        // Auto-pick full remaining quantity if no specific quantity given
        const expected = currentScannerItem.expectedQty || (currentScannerItem as any).quantity || 1;
        const alreadyPicked = currentScannerItem.pickedQty || 0;
        const remaining = expected - alreadyPicked;

        let scanQty = quantity;
        const unit = product.unit;
        const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
        const sizeNum = product.size ? parseFloat(product.size as string) : 0;

        if (scanQty !== undefined) {
            if (isWeightVol && sizeNum > 0) {
                scanQty = scanQty / sizeNum;
            }
        } else {
            scanQty = remaining || 1;
        }

        const nextPicked = alreadyPicked + scanQty;
        const newStatus = nextPicked >= expected ? 'Picked' : currentScannerItem.status;

        const itemIndex = selectedJob.lineItems?.findIndex((i: any) => i === currentScannerItem) ?? -1;
        if (itemIndex === -1) {
            logger.error('PickTab', "Scanner item not found in job line items", new Error(String("Scanner item not found in job line items")));
            throw new Error("Scanner item reference lost");
        }

        await updateJobItem(selectedJob.id, itemIndex, newStatus as any, nextPicked);

        // Build the updated lineItems directly from the current selectedJob (not from global `jobs` which may be stale)
        const updatedLineItems = [...(selectedJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            pickedQty: nextPicked
        };

        // Update selectedJob immediately so currentScannerItem useMemo advances to the next item
        setSelectedJob({ ...selectedJob, lineItems: updatedLineItems });
    };

    const filteredPickJobs = useMemo(() => {
        // Map of Transfer UUID → transferStatus  (for approval gating)
        const transferStatusMap = new Map<string, string>();
        filteredJobs.forEach(j => {
            if (j.type === 'TRANSFER') transferStatusMap.set(j.id, j.transferStatus || 'Requested');
        });

        const APPROVED_STATUSES = ['Approved', 'Picking', 'Picked', 'Packed', 'Shipped', 'In-Transit', 'Delivered', 'Received'];

        const employeeId = employees.find((e: any) => e.email === user?.email || e.name === user?.name || e.id === user?.id)?.id;

        return filteredJobs.filter(j => {
            if (j.type !== 'PICK') return false;
            if ((j.status || '').toLowerCase() === 'completed') return false;
            if (j.assignedTo && j.assignedTo !== employeeId && !['admin', 'warehouse_manager', 'super_admin'].includes(user?.role || '')) return false;

            if (pickSearch) {
                const q = pickSearch.toLowerCase();
                const cleanJobId = formatJobId(j).toLowerCase();
                const orderRefStr = (j.orderRef || '').toLowerCase();
                const noteStr = (j.notes || '').toLowerCase();
                const priorityStr = (j.priority || '').toLowerCase();
                const jobNum = (j.jobNumber || (j as any).job_number || '').toLowerCase();

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

                const matchesItems = j.lineItems?.some((item: any) => 
                    (item.name || '').toLowerCase().includes(q) ||
                    (item.productName || '').toLowerCase().includes(q) ||
                    (item.sku || '').toLowerCase().includes(q)
                );

                if (
                    !cleanJobId.includes(q) &&
                    !j.id.toLowerCase().includes(q) &&
                    !orderRefStr.includes(q) &&
                    !workerName.includes(q) &&
                    !workerCode.includes(q) &&
                    !noteStr.includes(q) &&
                    !priorityStr.includes(q) &&
                    !jobNum.includes(q) &&
                    !matchesItems
                ) {
                    return false;
                }
            }

            // If this PICK is linked to a TRANSFER, only show it once approved
            const linkedTransferStatus = transferStatusMap.get(j.orderRef || '');
            if (linkedTransferStatus !== undefined) {
                // It IS linked to a transfer — only show if approved
                return APPROVED_STATUSES.includes(linkedTransferStatus);
            }

            // Regular outbound PICK (linked to a Sale) — always visible
            return true;
        });
    }, [filteredJobs, user?.name, user?.role, pickSearch, employees]);

    // --- PICK PAGINATION ---
    const pickJobsTotalPages = Math.ceil(filteredPickJobs.length / PICK_ITEMS_PER_PAGE);
    const paginatedPickJobs = useMemo(() => {
        const start = (pickCurrentPage - 1) * PICK_ITEMS_PER_PAGE;
        return filteredPickJobs.slice(start, start + PICK_ITEMS_PER_PAGE);
    }, [filteredPickJobs, pickCurrentPage]);

    return (
        <div className="flex-1 flex flex-col gap-6 px-4">
            <PickHeader
                pendingCount={filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Pending').length}
                inProgressCount={filteredJobs.filter(j => j.type === 'PICK' && j.status === 'In-Progress').length}
                completedCount={filteredJobs.filter(j => j.type === 'PICK' && (j.status || '').toLowerCase() === 'completed').length}
                viewMode={viewMode}
                setViewMode={setViewMode}
                t={t}
                pickSearch={pickSearch}
                setPickSearch={setPickSearch}
            />

            {viewMode === 'Process' ? (
                <PickList
                    filteredPickJobs={filteredPickJobs}
                    paginatedPickJobs={paginatedPickJobs}
                    pickSortBy={pickSortBy}
                    setPickSortBy={setPickSortBy}
                    isPickSortDropdownOpen={isPickSortDropdownOpen}
                    setIsPickSortDropdownOpen={setIsPickSortDropdownOpen}
                    pickCurrentPage={pickCurrentPage}
                    setPickCurrentPage={setPickCurrentPage}
                    pickJobsTotalPages={pickJobsTotalPages}
                    PICK_ITEMS_PER_PAGE={PICK_ITEMS_PER_PAGE}
                    handleStartJob={onJobClick}
                    sites={sites}
                    employees={employees}
                    t={t}
                />
            ) : (
                <PickHistory
                    historicalJobs={historicalJobs}
                    resolveOrderRef={resolveOrderRef}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    employees={employees}
                    products={products}
                    user={user}
                    addNotification={addNotification}
                    inventoryRequestsService={inventoryRequestsService}
                    wmsJobsService={wmsJobsService}
                    jobs={jobs}
                    t={t}
                />
            )}

            {/* MODALS AND SCANNERS */}
            {selectedJob && selectedJob.type === 'PICK' && (
                <>
                    <PickJobModal
                        isOpen={isJobModalOpen}
                        onClose={() => {
                            setIsJobModalOpen(false);
                            setSelectedJob(null);
                        }}
                        job={selectedJob}
                        user={user}
                        sites={sites}
                        products={products}
                        employees={employees}
                        onStartPick={handleStartPick}
                        onCompleteJob={handleCompleteJob}
                        isSubmitting={isSubmitting}
                        currentItem={currentScannerItem}
                        resolveOrderRef={resolveOrderRef}
                    />

                    {isScannerOpen && (
                        <PickScanner
                            job={selectedJob}
                            currentItem={currentScannerItem}
                            currentProduct={currentScannerProduct}
                            products={products}
                            onClose={() => setIsScannerOpen(false)}
                            onScanLocation={handleScanLocation}
                            onScanItem={handleScanItem}
                            onCompleteJob={handleCompleteJob}
                            isProcessing={isSubmitting}
                            expectedPrefix={sites.find(s => s.id === (selectedJob.siteId || (selectedJob as any).site_id))?.barcodePrefix}
                        />
                    )}

                    {/* HISTORY DETAILS MODAL */}
                    {isDetailsOpen && ((selectedJob.status || '').toLowerCase() === 'completed' || (selectedJob.status || '').toLowerCase() === 'cancelled') && (
                        <PickDetailsModal
                            selectedItem={selectedJob}
                            onClose={() => {
                                setIsDetailsOpen(false);
                                setSelectedJob(null);
                            }}
                            resolveOrderRef={resolveOrderRef}
                            employees={employees}
                            products={products}
                            sites={sites}
                            onReturn={(job) => setReturnJob(job)}
                        />
                    )}

                    {/* RETURN FLOW */}
                    {returnJob && (
                        <ReturnToWarehouseModal
                            job={returnJob}
                            onClose={() => setReturnJob(null)}
                            products={products}
                            user={user}
                            addNotification={addNotification}
                            inventoryRequestsService={inventoryRequestsService}
                        />
                    )}
                </>
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
        </div>
    );
};
