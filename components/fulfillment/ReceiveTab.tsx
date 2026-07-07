import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PurchaseOrder, Product } from '../../types';
import { generateUnifiedBatchLabelsHTML } from '../../utils/labels/ProductLabelGenerator';
import { LabelSize, LabelFormat } from '../../utils/labels/types';
import { useFulfillment } from './FulfillmentContext';
import { ReceiveHistory } from './receive/ReceiveHistory';
import { ReceiveHeader } from './receive/ReceiveHeader';
import { ReceiveList } from './receive/ReceiveList';
import { ReceiveSplitModal } from './receive/ReceiveSplitModal';
import { ReceiveResolutionModal } from './receive/ReceiveResolutionModal';
import { ReceiveReviewModal } from './receive/ReceiveReviewModal';
import { ReceiveReprintModal } from './receive/ReceiveReprintModal';
import { ReceiveDetailsModal } from './receive/ReceiveDetailsModal';
import { inventoryRequestsService } from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { useReceiveScan } from './receive/hooks/useReceiveScan';

export const ReceiveTab: React.FC = () => {
    const {
        t, jobs, orders, products, allProducts, employees,
        isSubmitting, setIsSubmitting, receivePOSplit, addNotification,
        refreshData, historicalJobs, selectedJob, setSelectedJob, isDetailsOpen, setIsDetailsOpen,
        resolveOrderRef, activeTab, finalizePO, user, wmsJobsService, sites
    } = useFulfillment();

    // --- STATE ---
    const [receiveSearch, setReceiveSearch] = useState('');
    const [receiveCurrentPage, setReceiveCurrentPage] = useState(1);
    const RECEIVE_ITEMS_PER_PAGE = 25;
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
    const [unresolvedScans, setUnresolvedScans] = useState<Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>>([]);
    const [resolvingBarcode, setResolvingBarcode] = useState<{ barcode: string; qty: number } | null>(null);
    const [resolutionSearch, setResolutionSearch] = useState('');
    const [resolutionMode, setResolutionMode] = useState<'map' | 'new' | 'hold'>('map');

    const [isSplitReceiving, setIsSplitReceiving] = useState(false);
    const [splitReceivingItem, setSplitReceivingItem] = useState<any | null>(null);
    const [splitReceivingPO, setSplitReceivingPO] = useState<any | null>(null);
    const [splitVariants, setSplitVariants] = useState<Array<{
        id: string;
        sku: string;
        skuType: 'existing' | 'new';
        productId?: string;
        productName?: string;
        quantity: number;
        barcode?: string;
        barcodes?: string[];
        expiryDate?: string;
        batchNumber?: string;
        temperature?: string;
        condition?: string;
    }>>([]);

    const [reviewPO, setReviewPO] = useState<PurchaseOrder | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const [reprintItem, setReprintItem] = useState<{
        sku: string;
        name: string;
        qty: number;
        price?: string | number;
        category?: string;
        expiry?: string;
    } | null>(null);
    const [reprintSize, setReprintSize] = useState<'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL'>('XL');
    const [reprintFormat, setReprintFormat] = useState<'QR' | 'Barcode' | 'Both'>('Both');
    const [reprintOptions, setReprintOptions] = useState({
        showPrice: true,
        showCategory: true,
        showName: true
    });

    const [finalizedSkus, setFinalizedSkus] = useState<Record<string, string>>({});

    const scanInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        if (activeTab === 'RECEIVE' && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [activeTab]);

    // --- LOGIC ---
    const receivedQuantities = useMemo(() => {
        if (!receivingPO) return {};
        const counts: Record<string, number> = {};
        const allPoJobs = jobs.filter(j => j.orderRef === receivingPO.id);
        allPoJobs.forEach(job => {
            job.lineItems.forEach(item => {
                counts[item.productId] = (counts[item.productId] || 0) + item.expectedQty;
            });
        });
        return counts;
    }, [receivingPO, jobs]);

    const filteredReceiveOrders = useMemo(() => {
        const employeeId = employees.find((e: any) => e.email === user?.email || e.name === user?.name || e.id === user?.id)?.id;
        const isStaffWithLimitedAccess = !['admin', 'warehouse_manager', 'super_admin', 'dispatcher', 'inventory_specialist'].includes(user?.role || '');

        return orders.filter(o => {
            const isApproved = o.status === 'Approved';
            const matchesSearch = o.id.toLowerCase().includes(receiveSearch.toLowerCase()) ||
                (o.supplierName || '').toLowerCase().includes(receiveSearch.toLowerCase());
            const hasItemsToReceive = (o.lineItems || []).some(item => {
                const remaining = item.quantity - (item.receivedQty || 0);
                return remaining > 0;
            });
            
            if (!isApproved || !matchesSearch || !hasItemsToReceive) return false;

            if (isStaffWithLimitedAccess) {
                const hasAssignedReceiveJob = jobs.some(j => 
                    j.type === 'RECEIVE' && 
                    j.orderRef === o.id && 
                    j.assignedTo === employeeId &&
                    !['completed', 'cancelled', 'deleted'].includes(j.status?.toLowerCase() || '')
                );
                if (!hasAssignedReceiveJob) return false;
            }

            return true;
        });
    }, [orders, receiveSearch, jobs, employees, user]);

    const receiveOrdersTotalPages = Math.ceil(filteredReceiveOrders.length / RECEIVE_ITEMS_PER_PAGE);
    const paginatedReceiveOrders = useMemo(() => {
        const start = (receiveCurrentPage - 1) * RECEIVE_ITEMS_PER_PAGE;
        return filteredReceiveOrders.slice(start, start + RECEIVE_ITEMS_PER_PAGE);
    }, [filteredReceiveOrders, receiveCurrentPage]);

    const { handleGlobalScan } = useReceiveScan({
        user,
        employees,
        jobs,
        orders,
        products,
        allProducts,
        unresolvedScans,
        setUnresolvedScans,
        setSplitReceivingItem,
        setSplitReceivingPO,
        setSplitVariants,
        setIsSplitReceiving,
        addNotification,
        setReceiveSearch,
        isSplitReceiving,
        splitReceivingItem,
        splitVariants,
        splitReceivingPO
    });
    const handlePrintBatch = async (printItems: Array<{ sku: string; name: string; qty: number; price?: string | number; category?: string; expiry?: string; }>) => {
        setIsSubmitting(true);
        try {
            const labelsToPrint = printItems.map(item => ({
                value: item.sku,
                label: item.name,
                quantity: item.qty,
                price: (item.price || '0.00').toString(),
                category: item.category || 'General',
                date: ''
            }));
            const printOptions = {
                size: reprintSize as LabelSize,
                format: reprintFormat as LabelFormat,
                showPrice: reprintOptions.showPrice,
                showCategory: reprintOptions.showCategory,
                showName: reprintOptions.showName
            };

            const html = await generateUnifiedBatchLabelsHTML(labelsToPrint, printOptions);

            const printWin = window.open('', '_blank');
            if (printWin) {
                printWin.document.write(html);
                printWin.document.close();
            } else {
                addNotification('alert', 'Popup blocked. Allow popups to print.');
            }
        } catch (e) {
            logger.error('ReceiveTab', 'caught error', e as Error);
            addNotification('alert', 'Failed to generate labels');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReprintLabels = async () => {
        if (!reprintItem || isSubmitting) return;
        logger.debug('ReceiveTab', '🔍 REPRINT_ITEM');
        await handlePrintBatch([reprintItem]);
        setReprintItem(null);
    };

    // --- RENDER ---
    return (
        <div className="flex-1 overflow-hidden flex flex-col space-y-4 md:space-y-6">
            <ReceiveHeader
                scanInputRef={scanInputRef}
                handleGlobalScan={handleGlobalScan}
                unresolvedScans={unresolvedScans}
                setUnresolvedScans={setUnresolvedScans}
                setReceivingPO={setReceivingPO}
                filteredReceiveOrders={filteredReceiveOrders}
                receiveSearch={receiveSearch}
                setReceiveSearch={setReceiveSearch}
                setResolvingBarcode={setResolvingBarcode}
                setResolutionSearch={setResolutionSearch}
                setResolutionMode={setResolutionMode}
                viewMode={viewMode}
                setViewMode={setViewMode}
                orders={orders}
                t={t}
                isSubmitting={isSubmitting}
            />

            {/* CONTENT AREA */}
            {viewMode === 'Process' ? (
                <ReceiveList
                    paginatedReceiveOrders={paginatedReceiveOrders}
                    receiveOrdersTotalPages={receiveOrdersTotalPages}
                    filteredReceiveOrdersLength={filteredReceiveOrders.length}
                    receiveCurrentPage={receiveCurrentPage}
                    setReceiveCurrentPage={setReceiveCurrentPage}
                    jobs={jobs}
                    receivedQuantities={receivedQuantities}
                    setReprintItem={setReprintItem}
                    setSplitReceivingItem={setSplitReceivingItem}
                    setSplitReceivingPO={setSplitReceivingPO}
                    setSplitVariants={setSplitVariants}
                    setIsSplitReceiving={setIsSplitReceiving}
                    allProducts={allProducts}
                    finalizedSkus={finalizedSkus}
                    products={products}
                    setReviewPO={setReviewPO}
                    setShowReviewModal={setShowReviewModal}
                    t={t}
                    isSubmitting={isSubmitting}
                    itemsPerPage={RECEIVE_ITEMS_PER_PAGE}
                    user={user}
                    employees={employees}
                />
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <ReceiveHistory
                        orders={orders}
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
                        sites={sites}
                        t={t}
                    />
                </div>
            )}

            {/* Split Receiving Modal */}
            {isSplitReceiving && splitReceivingItem && splitReceivingPO && (
                <ReceiveSplitModal
                    splitReceivingItem={splitReceivingItem}
                    splitReceivingPO={splitReceivingPO}
                    splitVariants={splitVariants}
                    setSplitVariants={setSplitVariants}
                    setIsSplitReceiving={setIsSplitReceiving}
                    setSplitReceivingItem={setSplitReceivingItem}
                    setSplitReceivingPO={setSplitReceivingPO}
                    allProducts={allProducts}
                    receivePOSplit={receivePOSplit}
                    handlePrintBatch={handlePrintBatch}
                    setReprintItem={setReprintItem}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    jobs={jobs}
                    t={t}
                />
            )}

            {/* Barcode Resolution Modal */}
            {resolvingBarcode && (
                <ReceiveResolutionModal
                    resolvingBarcode={resolvingBarcode}
                    setResolvingBarcode={setResolvingBarcode}
                    resolutionSearch={resolutionSearch}
                    setResolutionSearch={setResolutionSearch}
                    products={products}
                    setUnresolvedScans={setUnresolvedScans}
                    addNotification={addNotification}
                    refreshData={refreshData}
                    isSubmitting={isSubmitting}
                    t={t}
                />
            )}

            {/* Reprint Modal */}
            {reprintItem && (
                <ReceiveReprintModal
                    reprintItem={reprintItem}
                    setReprintItem={setReprintItem}
                    isSubmitting={isSubmitting}
                    handleReprintLabels={handleReprintLabels}
                    reprintSize={reprintSize}
                    setReprintSize={setReprintSize}
                    reprintFormat={reprintFormat}
                    setReprintFormat={setReprintFormat}
                    reprintOptions={reprintOptions}
                    setReprintOptions={setReprintOptions}
                    t={t}
                />
            )}
            {/* Review PO Modal */}
            {showReviewModal && reviewPO && (
                <ReceiveReviewModal
                    po={reviewPO}
                    jobs={jobs}
                    onClose={() => setShowReviewModal(false)}
                    onFinalize={async () => {
                        if (isSubmitting) return;
                        setIsSubmitting(true);
                        try {
                            await finalizePO(reviewPO.id);
                            setShowReviewModal(false);
                            setReviewPO(null);
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                    isSubmitting={isSubmitting}
                    t={t}
                />
            )}

            {/* History Details Modal */}
            {isDetailsOpen && selectedJob && (
                <ReceiveDetailsModal
                    selectedItem={selectedJob}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedJob(null);
                    }}
                    resolveOrderRef={resolveOrderRef}
                    setReprintItem={setReprintItem}
                    sites={sites}
                    t={t}
                />
            )}
        </div>
    );
};
