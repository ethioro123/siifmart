import React, { useState, useMemo, useEffect } from 'react';
import { useFulfillment } from './FulfillmentContext';
import { PackHeader } from './pack/PackHeader';
import { PackList } from './pack/PackList';
import { PackHistory } from './pack/PackHistory';
import { WMSJob } from '../../types';
import { playBeep } from '../../utils/audioUtils';

// --- Subcomponents ---
import { PackGlobalScanBar } from './pack/components/PackGlobalScanBar';
import { PackModalsContainer } from './pack/components/PackModalsContainer';

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
        addNotification,
        formatJobId,
        resolveOrderRef,
        generateTrackingNumber,
        t,
        loadHistoricalJobs
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
    const [isDiscrepancyModalOpen, setIsDiscrepancyModalOpen] = useState(false);

    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    // RULE 10: Fetch history on demand when user switches to History view
    useEffect(() => {
        if (viewMode === 'History') loadHistoricalJobs();
    }, [viewMode]);

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [completedJobInfo, setCompletedJobInfo] = useState<any>(null);

    // Scan bar state
    const [scanInput, setScanInput] = useState('');
    const [scanError, setScanError] = useState('');
    const [scanSuccess, setScanSuccess] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    // --- DERIVED STATE ---
    const PACK_ITEMS_PER_PAGE = 25;

    // Active Jobs Logic
    const filteredPackJobs = useMemo(() => {
        return filteredJobs.filter(j => {
            if (j.type !== 'PACK') return false;
            if (packSearch) {
                const q = packSearch.toLowerCase();
                const cleanJobId = formatJobId(j).toLowerCase();
                const orderRefStr = (j.orderRef || '').toLowerCase();
                const noteStr = (j.notes || '').toLowerCase();
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

                const qRaw = packSearch.toLowerCase();
                const qClean = qRaw.replace(/[-\s]/g, '');

                const matchesItems = j.lineItems?.some((item: any) => {
                    const itemName = (item.name || item.productName || '').toLowerCase();
                    const itemSku = (item.sku || '').toLowerCase();
                    const itemSkuClean = itemSku.replace(/[-\s]/g, '');
                    
                    const prod = products?.find(p => p.id === item.productId || p.sku === item.sku);
                    const prodBarcode = (prod?.barcode || '').toLowerCase();
                    const prodBarcodeClean = prodBarcode.replace(/[-\s]/g, '');
                    const prodCategory = (prod?.category || '').toLowerCase();

                    return (
                        itemName.includes(qRaw) ||
                        itemSku.includes(qRaw) ||
                        (itemSkuClean.length > 0 && itemSkuClean.includes(qClean)) ||
                        (prodBarcode.length > 0 && prodBarcode.includes(qRaw)) ||
                        (prodBarcodeClean.length > 0 && prodBarcodeClean.includes(qClean)) ||
                        prodCategory.includes(qRaw)
                    );
                });

                if (
                    !cleanJobId.includes(qRaw) &&
                    !j.id.toLowerCase().includes(qRaw) &&
                    !orderRefStr.includes(qRaw) &&
                    !workerName.includes(qRaw) &&
                    !workerCode.includes(qRaw) &&
                    !noteStr.includes(qRaw) &&
                    !jobNum.includes(qRaw) &&
                    !matchesItems
                ) {
                    return false;
                }
            }
            if (packJobFilter === 'all') return j.status !== 'Completed' && j.status !== 'Cancelled';
            if (packJobFilter === 'pending') return j.status === 'Pending';
            if (packJobFilter === 'in-progress') return j.status === 'In-Progress';
            if (packJobFilter === 'completed') return j.status === 'Completed';
            return true;
        }).sort((a, b) => {
            const activeOrder = Number(b.status === 'In-Progress') - Number(a.status === 'In-Progress');
            if (activeOrder !== 0) return activeOrder;
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
    }, [filteredJobs, packSearch, packJobFilter, packSortBy, employees]);

    const packJobsTotalPages = Math.ceil(filteredPackJobs.length / PACK_ITEMS_PER_PAGE);

    const packStats = useMemo(() => {
        let pending = 0;
        let active = 0;
        filteredJobs.forEach(j => {
            if (j.type === 'PACK') {
                if (j.status === 'Pending') pending++;
                else if (j.status === 'In-Progress') active++;
            }
        });
        return { pending, active };
    }, [filteredJobs]);

    const paginatedPackJobs = useMemo(() => {
        const start = (packCurrentPage - 1) * PACK_ITEMS_PER_PAGE;
        return filteredPackJobs.slice(start, start + PACK_ITEMS_PER_PAGE);
    }, [filteredPackJobs, packCurrentPage]);

    // --- EFFECTS ---
    useEffect(() => {
        setPackCurrentPage(1);
    }, [packSearch, packJobFilter]);

    // --- HANDLERS ---

    // GLOBAL SCAN: Scan an Order Ref, Job Number, Tracking Number, or Item Barcode → launch scanning mode
    const handleGlobalScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const scanCode = scanInput.trim().toUpperCase();
        if (!scanCode || isScanning) return;

        setScanError('');
        setScanSuccess('');
        setIsScanning(true);

        try {
            const pendingPackJobs = filteredJobs.filter(j =>
                j.type === 'PACK' && (j.status === 'Pending' || j.status === 'In-Progress')
            );

            const cleanCode = scanCode.replace(/[-\s]/g, '');

            // 1. Priority match: Order Reference, Job Number, Tracking Number, or Job ID
            let matchedJob = pendingPackJobs.find(j => {
                const cleanJobId = formatJobId(j).toUpperCase().replace(/[-\s]/g, '');
                const rawJobId = (j.id || '').toUpperCase().replace(/[-\s]/g, '');
                const jobNum = (j.jobNumber || (j as any).job_number || '').toUpperCase().replace(/[-\s]/g, '');
                const orderRef = (j.orderRef || '').toUpperCase().replace(/[-\s]/g, '');
                const tracking = (j.trackingNumber || '').toUpperCase().replace(/[-\s]/g, '');

                return (
                    (cleanJobId && cleanJobId === cleanCode) ||
                    (rawJobId && rawJobId === cleanCode) ||
                    (jobNum && jobNum === cleanCode) ||
                    (orderRef && orderRef === cleanCode) ||
                    (tracking && tracking === cleanCode) ||
                    (j.orderRef && j.orderRef.toUpperCase() === scanCode) ||
                    (j.jobNumber && j.jobNumber.toUpperCase() === scanCode)
                );
            });

            // 2. Secondary match: Item SKU or item product barcode inside the job
            if (!matchedJob) {
                for (const job of pendingPackJobs) {
                    const hasMatch = job.lineItems?.some((item: any) => {
                        if (item.sku?.toUpperCase() === scanCode) return true;
                        const product = filteredProducts.find(p =>
                            (p.id === item.productId || p.sku === item.sku) &&
                            (p.siteId === job.siteId || p.site_id === (job as any).site_id)
                        );
                        if (product && (product.barcode?.toUpperCase() === scanCode || product.sku?.toUpperCase() === scanCode)) return true;
                        return false;
                    });

                    if (hasMatch) {
                        matchedJob = job;
                        break;
                    }
                }
            }

            if (!matchedJob) {
                playBeep('error');
                setScanError(`No Pack job found for scan: ${scanCode}`);
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

            const refreshedJob = filteredJobs.find(j => j.id === matchedJob!.id);
            const jobForScanner = {
                ...(refreshedJob || matchedJob),
                trackingNumber: trackingNum,
                status: 'In-Progress' as const
            };

            playBeep('success');
            setScanSuccess(`Matched: ${formatJobId(matchedJob)}`);
            setScanInput('');

            // Open in Job Modal (starts on Job Details overview)
            setSelectedPackJob(jobForScanner as WMSJob);
            setIsPackModalOpen(true);
            setIsScannerOpen(false);

            setTimeout(() => setScanSuccess(''), 3000);
        } catch (err: any) {
            playBeep('error');
            setScanError(err?.message || 'Error processing scan');
            setTimeout(() => setScanError(''), 3000);
        } finally {
            setIsScanning(false);
        }
    };

    // Open Job Modal on Details step
    const handleStartJob = async (job: WMSJob) => {
        let trackingNum = job.trackingNumber;
        if (!trackingNum) {
            trackingNum = generateTrackingNumber();
            await wmsJobsService.update(job.id, { trackingNumber: trackingNum });
        }

        const jobData = {
            ...job,
            trackingNumber: trackingNum,
        };

        setSelectedPackJob(jobData as WMSJob);
        setIsPackModalOpen(true);
        setIsScannerOpen(false);
    };

    return (
        <>
            <div className="flex-1 overflow-hidden flex flex-col gap-1.5 md:gap-4">
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
                    filteredJobsCount={packStats}
                    t={t}
                />

                <div className="flex-1 overflow-hidden flex flex-col">
                    {viewMode === 'Process' ? (
                        <>
                            <PackGlobalScanBar
                                scanInput={scanInput}
                                setScanInput={setScanInput}
                                isScanning={isScanning}
                                scanSuccess={scanSuccess}
                                scanError={scanError}
                                onSubmit={handleGlobalScan}
                                t={t}
                            />

                            <div className="flex-1 overflow-hidden">
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
                            t={t}
                        />
                    )}
                </div>

                <PackModalsContainer
                    selectedPackJob={selectedPackJob}
                    setSelectedPackJob={setSelectedPackJob}
                    isPackModalOpen={isPackModalOpen}
                    setIsPackModalOpen={setIsPackModalOpen}
                    isScannerOpen={isScannerOpen}
                    setIsScannerOpen={setIsScannerOpen}
                    isDiscrepancyModalOpen={isDiscrepancyModalOpen}
                    setIsDiscrepancyModalOpen={setIsDiscrepancyModalOpen}
                    isDetailsOpen={isDetailsOpen}
                    setIsDetailsOpen={setIsDetailsOpen}
                    returnJob={returnJob}
                    setReturnJob={setReturnJob}
                    showSuccessScreen={showSuccessScreen}
                    setShowSuccessScreen={setShowSuccessScreen}
                    completedJobInfo={completedJobInfo}
                    setCompletedJobInfo={setCompletedJobInfo}
                    setViewMode={setViewMode}
                />
            </div>
        </>
    );
};
export default PackTab;
