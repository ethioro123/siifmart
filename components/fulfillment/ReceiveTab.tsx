import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PurchaseOrder } from '../../types';
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

export const ReceiveTab: React.FC = () => {
    const {
        t, jobs, orders, products, allProducts, employees,
        isSubmitting, setIsSubmitting, receivePOSplit, addNotification,
        refreshData, historicalJobs, selectedJob, setSelectedJob, isDetailsOpen, setIsDetailsOpen,
        resolveOrderRef, activeTab, finalizePO, user, wmsJobsService
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
        return orders.filter(o => {
            const isApproved = o.status === 'Approved';
            const matchesSearch = o.id.toLowerCase().includes(receiveSearch.toLowerCase()) ||
                (o.supplierName || '').toLowerCase().includes(receiveSearch.toLowerCase());
            const hasItemsToReceive = (o.lineItems || []).some(item => {
                const remaining = item.quantity - (item.receivedQty || 0);
                return remaining > 0;
            });
            return isApproved && matchesSearch && hasItemsToReceive;
        });
    }, [orders, receiveSearch]);

    const receiveOrdersTotalPages = Math.ceil(filteredReceiveOrders.length / RECEIVE_ITEMS_PER_PAGE);
    const paginatedReceiveOrders = useMemo(() => {
        const start = (receiveCurrentPage - 1) * RECEIVE_ITEMS_PER_PAGE;
        return filteredReceiveOrders.slice(start, start + RECEIVE_ITEMS_PER_PAGE);
    }, [filteredReceiveOrders, receiveCurrentPage]);

    const handleGlobalScan = (val: string) => {
        if (!val || !products || !orders) return;
        const normalizedVal = val.trim().toUpperCase();

        if (isSplitReceiving && splitReceivingItem && splitVariants.length > 0) {
            const scannedProduct = products.find(p => {
                const matchSku = p.sku?.trim().toUpperCase() === normalizedVal;
                const matchBarcode = p.barcode?.trim().toUpperCase() === normalizedVal;
                const matchAliases = p.barcodes?.some((b: string) => b.trim().toUpperCase() === normalizedVal);
                return matchSku || matchBarcode || matchAliases;
            });

            const splitItemSku = splitReceivingItem.sku?.trim().toUpperCase();
            const isSameProduct = scannedProduct?.id === splitReceivingItem.productId ||
                normalizedVal === splitItemSku ||
                splitVariants.some(v => {
                    const vSku = v.sku?.trim().toUpperCase();
                    const vBarcode = v.barcode?.trim().toUpperCase();
                    return vSku === normalizedVal || vBarcode === normalizedVal;
                });

            if (isSameProduct) {
                const totalCurrentlyAllocated = splitVariants.reduce((sum, v) => sum + v.quantity, 0);
                if (totalCurrentlyAllocated < splitReceivingItem.quantity) {
                    const targetIdx = splitVariants.findIndex(v => {
                        const vSku = v.sku?.trim().toUpperCase();
                        const vBarcode = v.barcode?.trim().toUpperCase();
                        return vSku === normalizedVal || vBarcode === normalizedVal;
                    });
                    const idxToUpdate = targetIdx === -1 ? 0 : targetIdx;
                    setSplitVariants(prev => prev.map((v, idx) =>
                        idx === idxToUpdate ? { ...v, quantity: v.quantity + 1, barcode: v.barcode || val } : v
                    ));
                    addNotification('success', `Incremented ${splitReceivingItem.productName} to ${totalCurrentlyAllocated + 1} units`);
                } else {
                    addNotification('alert', `Cannot exceed PO quantity (${splitReceivingItem.quantity})`);
                }
                setReceiveSearch('');
                return;
            } else {
                addNotification('alert', `Warning: Scanned ${scannedProduct?.name || val} but currently receiving ${splitReceivingItem.productName}.`);
                setReceiveSearch('');
                return;
            }
        }

        const product = products.find(p => p.sku === val || p.barcode === val || (p.barcodes && p.barcodes.includes(val)));
        if (product) {
            const relevantPO = orders.find(po => po.status === 'Approved' && po.lineItems?.some((li: any) => li.productId === product.id));
            if (relevantPO) {
                const lineItem = relevantPO.lineItems?.find((li: any) => li.productId === product.id);
                if (lineItem) {
                    // const remainingQty = lineItem.quantity - (lineItem.receivedQty || 0); // Not used currently?
                    setSplitReceivingItem(lineItem);
                    setSplitReceivingPO(relevantPO);
                    const now = new Date();
                    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const newBatch = `BN-${dateStr}-${randomStr}`;

                    setSplitVariants([{
                        id: `variant-${Date.now()}`,
                        sku: product.sku,
                        skuType: 'existing',
                        quantity: 1,
                        productId: product.id,
                        productName: product.name,
                        barcode: val,
                        batchNumber: newBatch
                    }]);
                    setIsSplitReceiving(true);
                    addNotification('success', `Opening receive for ${product.name}`);
                    setReceiveSearch('');
                    return;
                }
            } else {
                addNotification('alert', `${product.name} not expected on any active PO`);
                setReceiveSearch('');
                return;
            }
        }

        const alreadyUnresolved = unresolvedScans.some(s => s.barcode === val);
        if (!alreadyUnresolved) {
            const scannedBarcode = val.toUpperCase();
            const suggestions: string[] = [];
            const skuMatch = products.find(p => p.sku && (scannedBarcode.includes(p.sku.toUpperCase()) || p.sku.toUpperCase().includes(scannedBarcode)));
            if (skuMatch) suggestions.push(`💡 Similar to SKU: ${skuMatch.sku} (${skuMatch.name})`);
            if (/^\d{13}$/.test(scannedBarcode)) suggestions.push(`📊 EAN-13 barcode detected`);
            else if (/^\d{12}$/.test(scannedBarcode)) suggestions.push(`📊 UPC-A barcode detected`);
            else if (/^\d{8}$/.test(scannedBarcode)) suggestions.push(`📊 EAN-8 barcode detected`);
            else if (/^[A-Z0-9]{6,20}$/i.test(scannedBarcode)) suggestions.push(`📊 CODE128 format detected`);

            const activeReceivePOs = orders.filter(po => po.status === 'Approved');
            if (activeReceivePOs.length > 0) {
                const poLineMatch = activeReceivePOs.flatMap(po => po.lineItems || []).find(li => scannedBarcode.toLowerCase().includes(li.productName.toLowerCase().substring(0, 4)) || li.sku?.toLowerCase() === scannedBarcode.toLowerCase());
                if (poLineMatch) suggestions.push(`🎯 Might be: ${poLineMatch.productName}`);
            }

            setUnresolvedScans(prev => [...prev, { barcode: val, scannedAt: new Date(), qty: 1, suggestions }]);
            addNotification('alert', `Unknown barcode - click to resolve`);
        }
        setReceiveSearch('');
    };

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
            console.error(e);
            addNotification('alert', 'Failed to generate labels');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReprintLabels = async () => {
        if (!reprintItem || isSubmitting) return;
        console.log('🔍 REPRINT_ITEM:', JSON.stringify(reprintItem));
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
                />
            )}
        </div>
    );
};
