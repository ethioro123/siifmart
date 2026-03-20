import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFulfillment } from './FulfillmentContext';
import { PackHeader } from './pack/PackHeader';
import { PackScanner } from './pack/PackScanner';
import { PackList } from './pack/PackList';
import { PackHistory } from './pack/PackHistory';
import { PackJobModal } from './pack/PackJobModal';
import { PackDetailsModal } from './pack/PackDetailsModal';
import { ReturnToWarehouseModal } from './returns/ReturnToWarehouseModal';
import { WMSJob } from '../../types';
import { formatDateTime } from '../../utils/formatting';
import { generatePackLabelHTML } from '../../utils/labels/PackLabelGenerator';
import { playBeep } from '../../utils/audioUtils';
import { Search, ScanLine, CheckCircle, X, Loader2 } from 'lucide-react';
import { useScanOnly } from '../../hooks/useScanOnly';
import { inventoryRequestsService } from '../../services/supabase.service';
import { FulfillmentSuccessScreen } from './FulfillmentSuccessScreen';

export const PackTab: React.FC = () => {
    const {
        filteredJobs,
        historicalJobs,
        sites,
        filteredProducts,
        products,
        user,
        employees,
        wmsJobsService,
        jobs,
        updateJobItem,
        completeJob,
        addNotification,
        formatJobId,
        resolveOrderRef,
        generateTrackingNumber,
        t,
        setEarnedPoints,
        setShowPointsPopup
    } = useFulfillment();

    // --- LOCAL STATE ---
    const [packSearch, setPackSearch] = useState('');
    const [packJobFilter, setPackJobFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
    const [packSortBy, setPackSortBy] = useState<'priority' | 'date' | 'items'>('priority');
    const [packCurrentPage, setPackCurrentPage] = useState(1);


    const [isPackSortDropdownOpen, setIsPackSortDropdownOpen] = useState(false);
    const [isPackFilterDropdownOpen, setIsPackFilterDropdownOpen] = useState(false);

    // Modal & Confirmation State
    const [selectedPackJob, setSelectedPackJob] = useState<WMSJob | null>(null);
    const [isPackModalOpen, setIsPackModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [completedJobInfo, setCompletedJobInfo] = useState<any>(null);

    // Scan bar state
    const [scanInput, setScanInput] = useState('');
    const [scanError, setScanError] = useState('');
    const [scanSuccess, setScanSuccess] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scanInputRef = useRef<HTMLInputElement>(null);

    // Scan-only enforcement
    const scanOnlyHandlers = useScanOnly(setScanInput);

    // --- DERIVED STATE ---
    const PACK_ITEMS_PER_PAGE = 25;

    // Scanner derived state (same pattern as PickTab)
    const currentScannerItem = useMemo(() => {
        if (!selectedPackJob) return null;
        return selectedPackJob.lineItems?.find((i: any) => i.status !== 'Completed' && i.status !== 'Picked');
    }, [selectedPackJob]);

    const currentScannerProduct = useMemo(() => {
        if (!currentScannerItem || !selectedPackJob) return undefined;
        const targetSiteId = selectedPackJob.siteId || (selectedPackJob as any).site_id;
        return products.find(p =>
            (p.id === currentScannerItem.productId || p.sku === currentScannerItem.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        );
    }, [currentScannerItem, selectedPackJob, products]);

    // Active Jobs Logic
    const filteredPackJobs = useMemo(() => {
        return filteredJobs.filter(j => {
            if (j.type !== 'PACK') return false;
            if (packSearch && !j.id.toLowerCase().includes(packSearch.toLowerCase())) return false;
            if (packJobFilter === 'all') return j.status !== 'Completed' && j.status !== 'Cancelled';
            if (packJobFilter === 'pending') return j.status === 'Pending';
            if (packJobFilter === 'in-progress') return j.status === 'In-Progress';
            if (packJobFilter === 'completed') return j.status === 'Completed';
            return true;
        }).sort((a, b) => {
            if (packSortBy === 'priority') {
                const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
            } else if (packSortBy === 'date') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            } else if (packSortBy === 'items') {
                return (b.lineItems?.length ?? 0) - (a.lineItems?.length ?? 0);
            }
            return 0;
        });
    }, [filteredJobs, packSearch, packJobFilter, packSortBy]);

    const packJobsTotalPages = Math.ceil(filteredPackJobs.length / PACK_ITEMS_PER_PAGE);

    const paginatedPackJobs = useMemo(() => {
        const start = (packCurrentPage - 1) * PACK_ITEMS_PER_PAGE;
        return filteredPackJobs.slice(start, start + PACK_ITEMS_PER_PAGE);
    }, [filteredPackJobs, packCurrentPage]);

    // --- EFFECTS ---
    useEffect(() => {
        setPackCurrentPage(1);
    }, [packSearch, packJobFilter]);

    // Auto-focus scan input when in Process view
    useEffect(() => {
        if (viewMode === 'Process' && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [viewMode]);

    // --- HANDLERS ---

    // GLOBAL SCAN: Scan a barcode → find the matching Pack job → auto-pack all items → show confirmation
    const handleGlobalScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const barcode = scanInput.trim().toUpperCase();
        if (!barcode || isScanning) return;

        setScanError('');
        setScanSuccess('');
        setIsScanning(true);

        try {
            // 1. Find a pending/in-progress PACK job that contains this SKU or barcode
            const pendingPackJobs = filteredJobs.filter(j =>
                j.type === 'PACK' && (j.status === 'Pending' || j.status === 'In-Progress')
            );

            let matchedJob: WMSJob | null = null;

            for (const job of pendingPackJobs) {
                const hasMatch = job.lineItems?.some((item: any) => {
                    // Match by item SKU
                    if (item.sku?.toUpperCase() === barcode) return true;
                    // Match by product barcode or SKU from products list
                    const product = filteredProducts.find(p =>
                        (p.id === item.productId || p.sku === item.sku) &&
                        (p.siteId === job.siteId || p.site_id === (job as any).site_id)
                    );
                    if (product && (product.barcode?.toUpperCase() === barcode || product.sku?.toUpperCase() === barcode)) return true;
                    return false;
                });

                if (hasMatch) {
                    matchedJob = job;
                    break;
                }
            }

            if (!matchedJob) {
                playBeep('error');
                setScanError(`No Pack job found for barcode: ${barcode}`);
                setScanInput('');
                setTimeout(() => setScanError(''), 3000);
                setIsScanning(false);
                return;
            }

            // 2. Open Job & Assign tracking number
            if (matchedJob.status === 'Pending') {
                await wmsJobsService.update(matchedJob.id, { status: 'In-Progress' });
            }

            let trackingNum = matchedJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(matchedJob.id, { trackingNumber: trackingNum });
            }

            // 3. Refresh job and show confirmation
            const refreshedJob = filteredJobs.find(j => j.id === matchedJob!.id);
            const jobForModal = {
                ...(refreshedJob || matchedJob),
                trackingNumber: trackingNum,
                status: 'In-Progress' as const
            };

            playBeep('success');
            setScanSuccess(`Matched Job: ${formatJobId(matchedJob)}`);
            setScanInput('');

            // Show confirmation modal
            setSelectedPackJob(jobForModal as WMSJob);
            setIsPackModalOpen(true);

            setTimeout(() => setScanSuccess(''), 3000);
        } catch (err: any) {
            playBeep('error');
            setScanError(err?.message || 'Error processing scan');
            setTimeout(() => setScanError(''), 3000);
        } finally {
            setIsScanning(false);
        }
    };

    // Also allow opening a job manually by tapping
    const handleStartJob = async (job: WMSJob) => {
        let trackingNum = job.trackingNumber;
        if (!trackingNum) {
            trackingNum = generateTrackingNumber();
            await wmsJobsService.update(job.id, { trackingNumber: trackingNum });
        }

        const jobForModal = {
            ...job,
            trackingNumber: trackingNum,
            status: job.status === 'Pending' ? 'In-Progress' : job.status
        };

        setSelectedPackJob(jobForModal as WMSJob);
        setIsPackModalOpen(true);
        if (job.status === 'Pending') {
            await wmsJobsService.update(job.id, { status: 'In-Progress' });
            addNotification('info', `Started: ${formatJobId(job)}`);
        }
    };

    const handleUpdateItemQty = async (itemIndex: number, qty: number) => {
        if (!selectedPackJob) return;

        const expectedQty = selectedPackJob.lineItems![itemIndex].expectedQty || 1;
        const newStatus = qty >= expectedQty ? 'Picked' : 'In-Progress';

        // Optimistic Update
        await updateJobItem(selectedPackJob.id, itemIndex, newStatus, qty);

        const updatedLineItems = [...(selectedPackJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            pickedQty: qty
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
                    return {
                        name: i.name || product?.name || 'Unknown Product',
                        sku: i.sku || product?.sku || 'N/A',
                        quantity: i.pickedQty || i.expectedQty || 0,
                        unit: product?.unit
                    };
                })
            };

            let labelSize = 'XL';
            if (boxDetails.boxSize === 'Small') labelSize = 'Small';
            if (boxDetails.boxSize === 'Medium') labelSize = 'Medium';
            if (boxDetails.boxSize === 'Large') labelSize = 'Large';
            if (boxDetails.boxSize === 'Extra Large') labelSize = 'XL';

            const html = await generatePackLabelHTML(packLabelData, { size: labelSize, format: 'Both' });

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            }

            addNotification('success', 'Label ready to print!');
        } catch (err) {
            console.error(err);
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
                    return {
                        name: i.name || product?.name || 'Unknown Product',
                        sku: i.sku || product?.sku || 'N/A',
                        quantity: i.pickedQty || i.expectedQty || 0,
                        unit: product?.unit
                    };
                })
            };

            const html = await generatePackLabelHTML(packLabelData, { size: labelSize, format: 'Both' });

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            }

            addNotification('success', 'Label ready to print!');
        } catch (err) {
            console.error(err);
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
                    quantity: item.pickedQty || item.expectedQty || 1,
                    unit: product?.unit
                }]
            };

            let labelSize = boxSize || 'Large';
            if (labelSize === 'Extra Large') labelSize = 'XL';

            const html = await generatePackLabelHTML(itemLabelData, { size: labelSize, format: 'Both' });
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            }

            addNotification('success', `Label printed for ${item.name || item.sku}`);
        } catch (err) {
            console.error(err);
            addNotification('alert', 'Failed to generate item label');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for scanner confirm pack (scan-to-verify per item)
    const handleScanConfirmPack = async (itemIndex: number, qty: number) => {
        if (!selectedPackJob) return;

        const expectedQty = selectedPackJob.lineItems![itemIndex].expectedQty || 1;
        const newStatus = qty >= expectedQty ? 'Picked' : 'In-Progress';

        await updateJobItem(selectedPackJob.id, itemIndex, newStatus, qty);

        const updatedLineItems = [...(selectedPackJob.lineItems || [])];
        updatedLineItems[itemIndex] = {
            ...updatedLineItems[itemIndex],
            status: newStatus as any,
            pickedQty: qty
        };

        setSelectedPackJob({ ...selectedPackJob, lineItems: updatedLineItems, trackingNumber: selectedPackJob.trackingNumber });
    };

    const handleOpenScanner = () => {
        setIsPackModalOpen(false);
        setIsScannerOpen(true);
    };

    const handleScannerComplete = async () => {
        if (!selectedPackJob) return;
        setIsScannerOpen(false);
        setIsPackModalOpen(true); // Return to modal for box details & label printing
    };



    const handleCompleteJob = async (boxDetails: any) => {
        if (!selectedPackJob) return;
        setIsSubmitting(true);
        try {
            // GUARANTEE TRACKING NUMBER ASSIGNMENT
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
            
            // Show Success Screen
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


    // --- RENDER ---
    return (
        <>
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <PackHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                packJobFilter={packJobFilter}
                setPackJobFilter={setPackJobFilter}
                isPackFilterDropdownOpen={isPackFilterDropdownOpen}
                setIsPackFilterDropdownOpen={setIsPackFilterDropdownOpen}
                packSortBy={packSortBy}
                setPackSortBy={setPackSortBy}
                isPackSortDropdownOpen={isPackSortDropdownOpen}
                setIsPackSortDropdownOpen={setIsPackSortDropdownOpen}
                packSearch={packSearch}
                setPackSearch={setPackSearch}
                t={t}
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                {viewMode === 'Process' ? (
                    <>
                        {/* ═══════ GLOBAL SCAN BAR ═══════ */}
                        <div className="px-4 pb-4">
                            <form onSubmit={handleGlobalScan} className="relative group">
                                <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${scanSuccess ? 'bg-green-500/20 opacity-100' : scanError ? 'bg-red-500/20 opacity-100' : 'bg-cyan-500/10 opacity-0 group-focus-within:opacity-100'}`} />
                                <div className={`relative flex items-center gap-3 bg-black/60 border-2 rounded-2xl px-5 py-4 transition-all duration-300 ${scanSuccess ? 'border-green-500/50 bg-green-500/5' : scanError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus-within:border-cyan-500'}`}>
                                    {isScanning ? (
                                        <Loader2 size={22} className="text-cyan-400 animate-spin shrink-0" />
                                    ) : scanSuccess ? (
                                        <CheckCircle size={22} className="text-green-400 shrink-0" />
                                    ) : scanError ? (
                                        <X size={22} className="text-red-400 shrink-0" />
                                    ) : (
                                        <ScanLine size={22} className="text-cyan-400 shrink-0" />
                                    )}
                                    <input
                                        ref={scanInputRef}
                                        type="text"
                                        value={scanInput}
                                        onChange={e => setScanInput(e.target.value)}
                                        onKeyDown={scanOnlyHandlers.onKeyDown}
                                        onPaste={scanOnlyHandlers.onPaste}
                                        disabled={isScanning}
                                        className="flex-1 bg-transparent text-white text-lg font-mono tracking-wider outline-none placeholder-gray-600 disabled:opacity-50"
                                        placeholder="Scan barcode to start packing..."
                                        autoComplete="off"
                                    />
                                    {scanInput && (
                                        <button
                                            type="submit"
                                            disabled={isScanning}
                                            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            GO
                                        </button>
                                    )}
                                </div>
                                {/* Status Messages */}
                                {(scanSuccess || scanError) && (
                                    <div className={`absolute -bottom-7 left-5 text-xs font-bold tracking-wide ${scanSuccess ? 'text-green-400' : 'text-red-400'}`}>
                                        {scanSuccess || scanError}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Pack Job List */}
                        <div className={`flex-1 overflow-hidden ${scanSuccess || scanError ? 'mt-4' : ''}`}>
                            <PackList
                                filteredPackJobs={filteredPackJobs}
                                paginatedPackJobs={paginatedPackJobs}
                                sites={sites}
                                setSelectedPackJob={handleStartJob}
                                packCurrentPage={packCurrentPage}
                                setPackCurrentPage={setPackCurrentPage}
                                packJobsTotalPages={packJobsTotalPages}
                                PACK_ITEMS_PER_PAGE={PACK_ITEMS_PER_PAGE}
                                packSortBy={packSortBy}
                                setPackSortBy={setPackSortBy}
                                isPackSortDropdownOpen={isPackSortDropdownOpen}
                                setIsPackSortDropdownOpen={setIsPackSortDropdownOpen}
                                t={t}
                            />
                        </div>
                    </>
                ) : (
                    <PackHistory
                        historicalJobs={historicalJobs}
                        resolveOrderRef={resolveOrderRef}
                        sites={sites}
                        employees={employees}
                        products={products}
                        user={user}
                        addNotification={addNotification}
                        wmsJobsService={wmsJobsService}
                        jobs={jobs}
                        formatJobIdFn={formatJobId}
                        onJobSelect={(job) => {
                            setSelectedPackJob(job);
                            setIsDetailsOpen(true);
                        }}
                        onReturn={(job) => setReturnJob(job)}
                    />
                )}
            </div>

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
                        onOpenScanner={handleOpenScanner}
                        onPrintItemLabel={handlePrintItemLabel}
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
        </div >

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
