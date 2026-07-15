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
        t
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
                    !jobNum.includes(q) &&
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

    const paginatedPackJobs = useMemo(() => {
        const start = (packCurrentPage - 1) * PACK_ITEMS_PER_PAGE;
        return filteredPackJobs.slice(start, start + PACK_ITEMS_PER_PAGE);
    }, [filteredPackJobs, packCurrentPage]);

    // --- EFFECTS ---
    useEffect(() => {
        setPackCurrentPage(1);
    }, [packSearch, packJobFilter]);

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
                            <PackGlobalScanBar
                                scanInput={scanInput}
                                setScanInput={setScanInput}
                                isScanning={isScanning}
                                scanSuccess={scanSuccess}
                                scanError={scanError}
                                onSubmit={handleGlobalScan}
                                t={t}
                            />

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
