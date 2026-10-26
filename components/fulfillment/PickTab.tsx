import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { logger } from '../../utils/logger';
import { formatJobId } from '../../utils/jobIdFormatter';
import { sortPickItemsByOptimalRoute } from '../../utils/fulfillmentRoute';

import { isPickLineResolved, remainingPickQuantity, resolvePickProduct } from '../../utils/pickProgress';

import { FloorDiscrepancyModal } from './discrepancies/FloorDiscrepancyModal';
import { usePickExecution, PickRecountRequiredError } from '../../hooks/usePickExecution';

const PICK_ITEMS_PER_PAGE = 12;

export const PickTab: React.FC = () => {
    const {
        filteredJobs, user, historicalJobs, employees, sites, products, jobs,
        resolveOrderRef, handleStartJob, setSelectedJob, selectedJob, setIsDetailsOpen, isDetailsOpen,
        completeJob, isSubmitting, addNotification, wmsJobsService, loadHistoricalJobs,
        deleteJob, refreshJobs
    } = useFulfillment();

    const { t } = useLanguage();

    // --- PICK-SPECIFIC STATE ---
    const [pickSearch, setPickSearch] = useState('');
    const [pickSortBy, setPickSortBy] = useState<'priority' | 'date' | 'items' | 'site'>('date');
    const [isPickSortDropdownOpen, setIsPickSortDropdownOpen] = useState(false);
    const [pickCurrentPage, setPickCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    // RULE 10: Fetch history on demand when user switches to History view
    useEffect(() => {
        if (viewMode === 'History') loadHistoricalJobs();
    }, [viewMode]);

    // --- MODAL & SCANNER STATE ---
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [completedJobInfo, setCompletedJobInfo] = useState<any>(null);

    // Derived state for the scanner (Sequenced along the optimal warehouse picking path)
    const currentScannerItem = useMemo(() => {
        if (!selectedJob || selectedJob.type !== 'PICK' || !selectedJob.lineItems) return null;
        const targetSiteId = selectedJob.siteId || (selectedJob as any).site_id;
        const pending = selectedJob.lineItems.filter((i: any) => 
            !isPickLineResolved(i)
        );
        if (pending.length === 0) return null;

        // Smart Serpentine Pick Path Sequencing (Zone -> Aisle -> S-curve Bay -> Shelf Level)
        const sorted = sortPickItemsByOptimalRoute(pending, (item: any) => {
            const prod = resolvePickProduct(products, item, targetSiteId);
            return item.location || prod?.location;
        });
        return sorted[0] || null;
    }, [selectedJob, products]);

    const currentScannerProduct = useMemo(() => {
        if (!currentScannerItem || !selectedJob) return undefined;
        const targetSiteId = selectedJob.siteId || (selectedJob as any).site_id;
        return resolvePickProduct(products, currentScannerItem, targetSiteId);
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

    const [isCompletingPick, setIsCompletingPick] = useState(false);
    const completionLock = useRef(false);
    const handleCompleteJob = async (jobOrIgnored?: WMSJob) => {
        // Always use selectedJob (which has the most up-to-date lineItems)
        const latestJob = selectedJob;
        if (!latestJob || completionLock.current) return;
        completionLock.current = true;
        setIsCompletingPick(true);
        try {
            await completeJob(latestJob.id, user?.name || 'Worker', false, latestJob.lineItems);
        } catch (error) {
            logger.error('PickTab', 'PICK completion follow-up failed; see the completion notification for next steps.', error);
            return;
        } finally { completionLock.current = false; setIsCompletingPick(false); }
        refreshJobs();
        setIsJobModalOpen(false);
        setIsScannerOpen(false);
        // Show Success Screen
        setCompletedJobInfo({
            id: latestJob.id,
            jobNumber: latestJob.jobNumber,
            type: 'PICK'
        });
        setShowSuccessScreen(true);
        
        setSelectedJob(null);
    };

    const [discrepancy, setDiscrepancy] = useState<{ line: number; count?: number } | null>(null);
    const pickExecution = usePickExecution();
    const verifiedLocation = useRef('');
    const pickSaveLock = useRef(false);
    useEffect(() => { verifiedLocation.current = ''; }, [selectedJob?.id, currentScannerItem]);

    const handleScanLocation = async (barcode: string) => {
        verifiedLocation.current = barcode;
    };

    const handleScanItem = async (barcode: string, quantity?: number, shortageReason?: string) => {
        if (!selectedJob || !currentScannerItem) throw new Error('Refresh the picking job.');
        if (pickSaveLock.current) throw new Error('A picking line is already being saved.');
        const index = (currentScannerItem ? selectedJob.lineItems.indexOf(currentScannerItem) : 0);
        if (index < 0) throw new Error('Picking line changed; refresh the job.');
        const remaining = remainingPickQuantity(currentScannerItem);
        const scanned = quantity ?? remaining;
        if (!Number.isFinite(scanned) || scanned < 0 || scanned > remaining) throw new Error(`Enter a quantity between zero and ${remaining}.`);
        pickSaveLock.current = true;
        try {
            const saved = await pickExecution.mutateAsync({
                jobId: selectedJob.id, itemIndex: index,
                quantity: (currentScannerItem.pickedQty || 0) + scanned, expectedQuantity: currentScannerItem.expectedQty,
                locationBarcode: verifiedLocation.current, itemBarcode: barcode, shortageReason
            });
            setSelectedJob(saved);
            refreshJobs();
        } catch (error) {
            if (error instanceof PickRecountRequiredError) setDiscrepancy({ line: index, count: scanned });
            throw error;
        } finally { pickSaveLock.current = false; }
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
            if (['completed', 'cancelled'].includes((j.status || '').toLowerCase())) return false;
            if (j.assignedTo && j.assignedTo !== employeeId && !['country_managing_director','warehouse_manager','group_ceo','inventory_manager','country_operations_director','regional_operations_manager','regional_supply_chain_manager'].includes(user?.role || '')) return false;

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
        const activeFirst = [...filteredPickJobs].sort((a, b) =>
            Number(b.status === 'In-Progress') - Number(a.status === 'In-Progress')
        );
        return activeFirst.slice(start, start + PICK_ITEMS_PER_PAGE);
    }, [filteredPickJobs, pickCurrentPage]);

    return (
        <div className="flex-1 flex flex-col gap-1.5 sm:gap-6 px-0.5 sm:px-4">
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
                        isSubmitting={isSubmitting || isCompletingPick}
                        currentItem={currentScannerItem}
                        resolveOrderRef={resolveOrderRef}
                        onDeleteJob={deleteJob}
                        onReportDiscrepancy={() => setDiscrepancy({ line: Math.max(0, (currentScannerItem ? selectedJob.lineItems?.indexOf(currentScannerItem) : 0) ?? 0) })}
                    />

                    {isScannerOpen && (
                        <PickScanner
                            job={selectedJob}
                            currentItem={currentScannerItem}
                            currentProduct={currentScannerProduct}
                            products={products}
                            onClose={() => setIsScannerOpen(false)}
                            onCountDiscrepancy={(count) => setDiscrepancy({ line: (currentScannerItem ? selectedJob.lineItems.indexOf(currentScannerItem) : 0), count })}
                            onReportDiscrepancy={() => setDiscrepancy({ line: Math.max(0, (currentScannerItem ? selectedJob.lineItems.indexOf(currentScannerItem) : 0)) })}
                            onScanLocation={handleScanLocation}
                            onScanItem={handleScanItem}
                            onCompleteJob={handleCompleteJob}
                            isProcessing={isSubmitting || pickExecution.isPending || isCompletingPick}
                            expectedPrefix={sites.find(s => s.id === (selectedJob.siteId || (selectedJob as any).site_id))?.barcodePrefix}
                        />
                    )}

                    {discrepancy && <FloorDiscrepancyModal isOpen onClose={() => setDiscrepancy(null)} job={selectedJob} user={user}
                        initialLine={discrepancy.line} initialCount={discrepancy.count} addNotification={addNotification} onSaved={async () => { await refreshJobs(); }} />}
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
                            onDeleteJob={deleteJob}
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
