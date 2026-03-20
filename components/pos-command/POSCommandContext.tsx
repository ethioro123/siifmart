import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useFulfillmentData } from '../fulfillment/FulfillmentDataProvider';
import { useGamification } from '../../contexts/GamificationContext';
import { useDateFilter, DateRangeOption } from '../../hooks/useDateFilter';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatJobId } from '../../utils/jobIdFormatter';

// Define the shape of the Context
interface POSCommandContextType {
    // Navigation & Date
    dateRange: DateRangeOption;
    setDateRange: (range: DateRangeOption) => void;
    isWithinRange: (date: string) => boolean;
    filteredSales: any[];

    // App State Lookups
    activeShift: any;
    cashInDrawer: number;
    personalSales: number;
    txCount: number;
    returnCount: number;
    totalRevenue: number;
    getShiftSummary: () => any;
    myPoints: any;
    siteWorkerPoints: any[];
    hourlyData: any[];
    paymentChartData: any[];

    // Screen/Security State
    isLocked: boolean;
    setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
    pin: string;
    setPin: React.Dispatch<React.SetStateAction<string>>;

    // Receiving State
    isReceivingModalOpen: boolean;
    setIsReceivingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    receivingSummary: any;
    setReceivingSummary: React.Dispatch<React.SetStateAction<any>>;
    selectedTransferForReceiving: string | null;
    setSelectedTransferForReceiving: React.Dispatch<React.SetStateAction<string | null>>;
    isConfirmingReceive: boolean;
    orderRefScanInput: string;
    setOrderRefScanInput: React.Dispatch<React.SetStateAction<string>>;
    transferScanBarcode: string;
    setTransferScanBarcode: React.Dispatch<React.SetStateAction<string>>;
    transferReceivingItems: any[];
    setTransferReceivingItems: React.Dispatch<React.SetStateAction<any[]>>;

    // Stock Search State
    isStockListOpen: boolean;
    setIsStockListOpen: React.Dispatch<React.SetStateAction<boolean>>;
    stockSearch: string;
    setStockSearch: React.Dispatch<React.SetStateAction<string>>;

    // Shift Closing State
    isClosingShift: boolean;
    setIsClosingShift: React.Dispatch<React.SetStateAction<boolean>>;
    closingStep: number;
    setClosingStep: React.Dispatch<React.SetStateAction<number>>;
    cashDenominations: Record<string, number>;
    setCashDenominations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    discrepancyReason: string;
    setDiscrepancyReason: React.Dispatch<React.SetStateAction<string>>;
    isSubmittingShift: boolean;

    // Transactions Display State
    txPage: number;
    setTxPage: React.Dispatch<React.SetStateAction<number>>;
    TX_PER_PAGE: number;

    // Handlers
    handleScanOrderRef: (ref: string) => void;
    handleSelectTransferForReceiving: (transferId: string) => void;
    handleUpdateTransferItem: (index: number, field: string, value: any) => void;
    handleScanTransferItem: (barcode: string) => void;
    handleConfirmTransferReceiving: () => Promise<void>;
    repairShipmentInventory: (jobId: string) => Promise<void>;
    handleCloseReceivingModal: () => void;
    handleLockScreen: () => void;
    handleReprint: () => void;
    handleEndShift: () => void;
    handleSubmitShift: () => Promise<void>;
    handleUpdateDenomination: (den: number, quantity: number) => void;
}

const POSCommandContext = createContext<POSCommandContextType | undefined>(undefined);

export const POSCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user, logout } = useStore();
    const {
        sales, addNotification, products, activeSite, shifts,
        allProducts, adjustStock, addProduct, refreshData, closeShift,
        storePoints
    } = useData();
    const { jobs, transfers, updateJob } = useFulfillmentData();
    const { workerPoints } = useGamification();

    // --- DATE FILTER ---
    const { dateRange, setDateRange, isWithinRange } = useDateFilter('This Quarter');
    const filteredSales = sales.filter(s => isWithinRange(s.date));

    // --- LOCAL STATE ---
    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState('');

    // Receiving
    const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
    const [isStockListOpen, setIsStockListOpen] = useState(false);
    const [receivingSummary, setReceivingSummary] = useState<any>(null);
    const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null);
    const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);
    const [stockSearch, setStockSearch] = useState('');
    const [orderRefScanInput, setOrderRefScanInput] = useState('');
    const [transferScanBarcode, setTransferScanBarcode] = useState('');
    const [transferReceivingItems, setTransferReceivingItems] = useState<any[]>([]);

    // Shift Closing
    const [isClosingShift, setIsClosingShift] = useState(false);
    const [closingStep, setClosingStep] = useState(1);
    const [cashDenominations, setCashDenominations] = useState<Record<string, number>>({
        '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0
    });
    const [discrepancyReason, setDiscrepancyReason] = useState('');
    const [isSubmittingShift, setIsSubmittingShift] = useState(false);

    // Pagination
    const [txPage, setTxPage] = useState(1);
    const TX_PER_PAGE = 5;

    // --- COMPUTED DATA ---
    const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');

    const getShiftSummary = () => {
        if (!activeShift) return { cash: 0, card: 0, mobile: 0, total: 0, expected: 0 };
        const startTime = new Date(activeShift.startTime).getTime();
        const currentShiftSales = sales.filter(s => new Date(s.date).getTime() >= startTime);

        const cash = currentShiftSales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0);
        const card = currentShiftSales.filter(s => s.method === 'Card').reduce((sum, s) => sum + s.total, 0);
        const mobile = currentShiftSales.filter(s => s.method === 'Mobile Money').reduce((sum, s) => sum + s.total, 0);

        return {
            cash,
            card,
            mobile,
            total: cash + card + mobile,
            expected: (activeShift.openingFloat || 0) + cash
        };
    };

    const shiftSummary = getShiftSummary();
    const cashInDrawer = shiftSummary.expected;
    const personalSales = shiftSummary.total;
    const txCount = sales.filter(s =>
        new Date(s.date).getTime() >= (activeShift ? new Date(activeShift.startTime).getTime() : 0) &&
        s.cashierName === user?.name
    ).length;
    const returnCount = sales.filter(s =>
        new Date(s.date).getTime() >= (activeShift ? new Date(activeShift.startTime).getTime() : 0) &&
        s.status === 'Refunded'
    ).length;
    const totalRevenue = personalSales;

    // Gamification & Charts
    const myPoints = workerPoints.find(wp => wp.employeeId === user?.id || wp.employeeName === user?.name);
    const siteWorkerPoints = workerPoints.filter(wp => wp.siteId === activeSite?.id);

    const methodStats = filteredSales.reduce((acc: any, curr) => {
        acc[curr.method] = (acc[curr.method] || 0) + 1;
        return acc;
    }, {});

    const totalFilteredSales = filteredSales.length;
    const paymentChartData = Object.keys(methodStats).map(key => {
        // Map methods to translated names
        let translatedName = key;
        if (key === 'Cash') translatedName = t('pos.cashSales');
        else if (key === 'Card') translatedName = t('pos.cardSales');
        else if (key === 'Mobile Money') translatedName = t('pos.mobileSales');

        return {
            name: translatedName,
            value: totalFilteredSales > 0 ? Math.round((methodStats[key] / totalFilteredSales) * 100) : 0
        };
    });

    const hourlyData = [
        { name: '09:00', amount: totalRevenue * 0.1, label: t('posCommand.salesAmount') },
        { name: '10:00', amount: totalRevenue * 0.15, label: t('posCommand.salesAmount') },
        { name: '11:00', amount: totalRevenue * 0.2, label: t('posCommand.salesAmount') },
        { name: '12:00', amount: totalRevenue * 0.25, label: t('posCommand.salesAmount') },
        { name: '13:00', amount: totalRevenue * 0.1, label: t('posCommand.salesAmount') },
        { name: '14:00', amount: totalRevenue * 0.2, label: t('posCommand.salesAmount') },
    ];


    // --- HANDLERS ---
    const handleSelectTransferForReceiving = (transferId: string) => {
        let transfer = transfers.find(t => t.id === transferId);
        // Always look up the WMSJob too — its lineItems are the source of truth
        // (updated during pick/pack with accurate expectedQty, pickedQty, unit, etc.)
        const job = jobs.find(j => j.id === transferId);

        if (!transfer) {
            if (job) {
                transfer = {
                    id: job.id,
                    sourceSiteId: (job as any).sourceSiteId || (job as any).source_site_id,
                    destSiteId: job.destSiteId,
                    status: job.status,
                    transferStatus: job.transferStatus,
                    items: job.lineItems || (job as any).line_items || [],
                    orderRef: job.orderRef,
                    createdAt: job.createdAt,
                    updatedAt: job.updatedAt
                } as any;
            }
        }

        if (!transfer) return;

        setSelectedTransferForReceiving(transferId);
        setIsReceivingModalOpen(true);

        // Prefer job lineItems (source of truth) over transfer.items (may be stale)
        const sourceItems = (job?.lineItems || (job as any)?.line_items || transfer.items || []);

        const items = sourceItems.map((item: any) => {
            const itemSku = item.sku?.trim()?.toUpperCase();
            const product = itemSku ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku) : null;

            // Transfer stores expectedQty in PACKAGE units (e.g., 5 units of 20L = 100L)
            // and requestedMeasureQty as the original measure request (e.g., 89 L)
            const packageQty = item.expectedQty ?? item.expected_qty ?? item.quantity ?? 0;
            const measureQty = item.requestedMeasureQty ?? item.requested_measure_qty;
            const productSize = parseFloat(product?.size || item.size || '0');

            // Aggressive unit resolution: check item, check current product, check ANY product with this SKU
            const itemUnit = item.unit || item.measure_unit || item.uom;
            const productUnit = product?.unit || (product as any)?.measureUnit;
            const fallbackUnit = measureQty ? (productSize > 1 ? 'L' : 'KG') : '';

            const resolvedUnit = (itemUnit || productUnit || fallbackUnit || '').trim().toUpperCase();

            return {
                productId: product?.productId || product?.id || item.productId || item.product_id,
                sku: itemSku || item.sku,
                name: product?.name || item.name || t('posCommand.unknownProduct'),
                expectedQty: packageQty,
                requestedMeasureQty: measureQty,
                displayExpectedQty: measureQty || packageQty,
                receivedQty: 0,
                condition: 'Good' as const,
                notes: '',
                unit: resolvedUnit,
                productSize,
                isMeasure: !!measureQty
            };
        });

        setTransferReceivingItems(items);
    };

    const handleScanOrderRef = (ref: string) => {
        if (!ref.trim()) return;

        let foundTransfer = transfers.find(t =>
            (t as any).orderRef?.toLowerCase() === ref.toLowerCase() ||
            t.id?.toLowerCase() === ref.toLowerCase()
        );

        if (!foundTransfer) {
            const matchJob = jobs.find(j =>
                (j as any).trackingNumber?.toLowerCase() === ref.toLowerCase() ||
                j.orderRef?.toLowerCase() === ref.toLowerCase() ||
                j.id?.toLowerCase() === ref.toLowerCase()
            );

            if (matchJob) {
                // For DISPATCH jobs, select directly (no transfer record exists)
                if (matchJob.type === 'DISPATCH') {
                    handleSelectTransferForReceiving(matchJob.id);
                    setOrderRefScanInput('');
                    addNotification('success', `${t('posCommand.shipmentFound')} ${ref}`);
                    return;
                }
                // For TRANSFER jobs, try to find transfer record
                foundTransfer = transfers.find(t =>
                    t.id === matchJob.orderRef ||
                    (t as any).orderRef === matchJob.orderRef
                );
            }
        }

        if (foundTransfer) {
            handleSelectTransferForReceiving(foundTransfer.id);
            setOrderRefScanInput('');
            addNotification('success', `${t('posCommand.shipmentFound')} ${ref}`);
        } else {
            addNotification('alert', `${t('posCommand.shipmentNotFound')} ${ref}`);
        }
    };

    const handleUpdateTransferItem = (index: number, field: string, value: any) => {
        setTransferReceivingItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleScanTransferItem = (barcode: string) => {
        const scannedValue = barcode.trim().toUpperCase();
        if (!scannedValue) return;

        const itemIndex = transferReceivingItems.findIndex(item => {
            const itemSku = item.sku?.trim().toUpperCase() || '';
            const product = allProducts.find(p => p.sku?.trim().toUpperCase() === itemSku);
            const primaryBarcode = (product?.barcode || '').trim().toUpperCase();
            const barcodeAliases = (product?.barcodes || []).map((b: string) => b.trim().toUpperCase());

            return scannedValue === itemSku ||
                (primaryBarcode && scannedValue === primaryBarcode) ||
                barcodeAliases.includes(scannedValue);
        });

        if (itemIndex !== -1) {
            handleUpdateTransferItem(itemIndex, 'receivedQty', transferReceivingItems[itemIndex].receivedQty + 1);
            setTransferScanBarcode('');
            addNotification('success', `${t('posCommand.itemIncremented')} ${transferReceivingItems[itemIndex].name}`);
        } else {
            addNotification('alert', `${t('posCommand.itemNotInShipment')} ${barcode}`);
        }
    };

    const handleConfirmTransferReceiving = async () => {
        if (!selectedTransferForReceiving || transferReceivingItems.length === 0) {
            addNotification('alert', t('posCommand.noTransferSelected'));
            return;
        }

        setIsConfirmingReceive(true);
        try {
            const { wmsJobsService } = await import('../../services/supabase.service');
            const transferId = selectedTransferForReceiving;
            let transfer = transfers.find(t => t.id === transferId) as any;

            if (!transfer) {
                const job = jobs.find(j => j.id === transferId);
                if (job) {
                    transfer = {
                        id: job.id,
                        sourceSiteId: (job as any).sourceSiteId || (job as any).source_site_id,
                        destSiteId: job.destSiteId,
                        status: job.status,
                        transferStatus: job.transferStatus,
                        items: job.lineItems || (job as any).line_items || [],
                        orderRef: job.orderRef,
                        jobNumber: job.jobNumber,
                        createdAt: job.createdAt,
                        updatedAt: job.updatedAt,
                        lineItems: job.lineItems || (job as any).line_items
                    } as any;
                }
            }

            if (!transfer) throw new Error('Transfer not found');

            // Build updated line items — handle both camelCase and snake_case fields
            const rawLineItems = transfer.lineItems || transfer.items || [];
            const updatedLineItems = rawLineItems.map((item: any) => {
                const itemSku = (item.sku || '').trim().toUpperCase();
                const rx = transferReceivingItems.find(i =>
                    i.sku?.trim()?.toUpperCase() === itemSku ||
                    i.productId === (item.productId || item.product_id)
                );
                const expectedQty = item.expectedQty ?? item.expected_qty ?? item.quantity ?? 0;
                const isComplete = rx && (rx.receivedQty >= (rx.displayExpectedQty || expectedQty));
                return {
                    ...item,
                    receivedQty: rx ? rx.receivedQty : 0,
                    received_qty: rx ? rx.receivedQty : 0,
                    condition: rx ? rx.condition : 'Good',
                    status: isComplete ? 'Completed' : 'Discrepancy'
                };
            });

            // 1. Update the TRANSFER job status
            console.log(`📦 Updating TRANSFER ${transferId} → Received/Completed`);
            try {
                await wmsJobsService.update(transferId, {
                    transferStatus: 'Received',
                    receivedAt: new Date().toISOString(),
                    receivedBy: user?.name || t('posCommand.posUser'),
                    status: 'Completed',
                    lineItems: updatedLineItems
                } as any);
                console.log(`✅ TRANSFER job ${transferId} updated to Received/Completed`);
            } catch (updateErr: any) {
                console.error(`❌ Failed to update TRANSFER job ${transferId}:`, updateErr);
                throw updateErr;
            }

            // 2. Also complete the DISPATCH job if exists
            const dispatchJob = jobs.find(j =>
                j.type === 'DISPATCH' &&
                (j.orderRef === transfer.id || j.orderRef === transfer.jobNumber)
            );

            if (dispatchJob) {
                try {
                    await wmsJobsService.update(dispatchJob.id, {
                        status: 'Completed',
                        transferStatus: 'Received',
                        receivedAt: new Date().toISOString(),
                        receivedBy: user?.name || t('posCommand.posUser')
                    } as any);
                    console.log(`✅ DISPATCH job ${dispatchJob.id} updated to Completed`);
                } catch (dErr) {
                    console.warn('⚠️ Failed to update DISPATCH job:', dErr);
                }
            }

            // 3. Update stock at destination
            const destSiteId = transfer.destSiteId || activeSite?.id;
            const failedItems: string[] = [];

            if (destSiteId) {
                const { productsService } = await import('../../services/supabase.service');

                for (const item of transferReceivingItems) {
                    if (item.receivedQty > 0) {
                        const itemSku = item.sku?.trim()?.toUpperCase();
                        const destProduct = itemSku
                            ? allProducts.find(p =>
                                p.sku?.trim()?.toUpperCase() === itemSku &&
                                (p.siteId === destSiteId || p.site_id === destSiteId)
                            )
                            : null;

                        if (destProduct) {
                            const newStock = (destProduct.stock || 0) + item.receivedQty;
                            await productsService.update(destProduct.id, { stock: newStock });
                            console.log(`✅ Stock updated: ${destProduct.name} ${destProduct.stock} → ${newStock} (+${item.receivedQty})`);
                        } else {
                            const templateProduct = itemSku
                                ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                                : null;

                            try {
                                const created = await addProduct({
                                    name: item.name || templateProduct?.name || t('posCommand.newProduct'),
                                    sku: item.sku,
                                    price: templateProduct?.price || 0,
                                    costPrice: (templateProduct as any)?.costPrice || (templateProduct as any)?.cost || 0,
                                    stock: item.receivedQty,
                                    unit: templateProduct?.unit || 'pcs',
                                    siteId: destSiteId,
                                    category: templateProduct?.category || t('posCommand.uncategorized'),
                                    minStockLevel: 5,
                                    image: templateProduct?.image || '',
                                    productId: templateProduct?.productId || templateProduct?.id
                                } as any);

                                if (created?.id) {
                                    console.log(`✅ Created product ${item.name} at ${destSiteId} with stock=${item.receivedQty}`);
                                }
                            } catch (err) {
                                console.error('Failed to auto-create product:', err);
                                failedItems.push(item.sku || item.name);
                            }
                        }
                    }
                }
            }

            if (failedItems.length > 0) {
                addNotification('alert', `Failed to create: ${failedItems.join(', ')}. Please add manually.`);
            }

            // 4. Show receiving summary
            const hasDiscrepancies = transferReceivingItems.some(i =>
                i.receivedQty !== (i.displayExpectedQty || i.expectedQty)
            );
            setReceivingSummary({
                orderRef: transfer.orderRef || transferId,
                jobNumber: transfer.jobNumber || (transfer as any).job_number,
                items: transferReceivingItems.map(i => ({
                    sku: i.sku,
                    name: i.name,
                    expectedQty: i.expectedQty,
                    displayExpectedQty: i.displayExpectedQty || i.expectedQty,
                    receivedQty: i.receivedQty,
                    condition: i.condition,
                    unit: i.unit
                })),
                timestamp: new Date().toISOString(),
                hasDiscrepancies
            });

            await refreshData();
            addNotification('success', t('posCommand.shipmentReceivedSuccess'));
            setSelectedTransferForReceiving(null);
        } catch (err: any) {
            console.error('Error confirming receipt:', err);
            addNotification('alert', `${t('posCommand.failedToFinalize')} ${err.message}`);
        } finally {
            setIsConfirmingReceive(false);
        }
    };

    const repairShipmentInventory = async (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            addNotification('alert', t('posCommand.recordNotFound'));
            return;
        }

        const items = job.lineItems || (job as any).line_items || [];
        if (items.length === 0) {
            addNotification('alert', t('posCommand.noItemsInRecord'));
            return;
        }

        addNotification('info', `${t('posCommand.startingRepair')} ${job.orderRef || job.id.substring(0, 8)}...`);

        try {
            const destSiteId = job.destSiteId || (job as any).dest_site_id || activeSite?.id;
            let repairCount = 0;

            for (const item of items) {
                const received = item.receivedQty || (item as any).quantity || item.expectedQty || item.pickedQty ||
                    (item as any).received_qty || (item as any).qty || 0;

                if (received > 0) {
                    const itemSku = item.sku?.trim()?.toUpperCase();
                    const templateProduct = itemSku
                        ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                        : null;

                    if (!templateProduct && !item.sku && !item.name) continue;

                    const destProduct = allProducts.find(p =>
                        (p.sku === (item.sku || templateProduct?.sku)) &&
                        (p.siteId === destSiteId || p.site_id === destSiteId)
                    );

                    let targetId = destProduct?.id;

                    if (!destProduct) {
                        const created = await addProduct({
                            name: item.name || templateProduct?.name || t('posCommand.restoredProduct'),
                            sku: item.sku || templateProduct?.sku || 'N/A',
                            price: templateProduct?.price || 0,
                            costPrice: (templateProduct as any)?.costPrice || (templateProduct as any)?.cost || 0,
                            stock: 0,
                            unit: templateProduct?.unit || 'pcs',
                            siteId: destSiteId,
                            category: templateProduct?.category || t('posCommand.uncategorized'),
                            productId: templateProduct?.productId || templateProduct?.id
                        } as any);
                        targetId = created?.id;
                        repairCount++;
                    }

                    if (targetId) {
                        await adjustStock(
                            targetId,
                            received,
                            'IN',
                            `${t('posCommand.startingRepair')}: ${formatJobId(job as any)}`, // Explicit cast to help TypeScript
                            user?.name || t('posCommand.posRepair')
                        );
                    }
                }
            }

            await refreshData();
            addNotification('success', `${t('posCommand.repairComplete')} ${repairCount} missing records.`);
        } catch (err: any) {
            console.error('Repair failed:', err);
            addNotification('alert', `${t('posCommand.repairFailed')} ${err.message}`);
        }
    };

    const handleCloseReceivingModal = () => {
        setIsReceivingModalOpen(false);
        setReceivingSummary(null);
        setSelectedTransferForReceiving(null);
        setTransferReceivingItems([]);
    };

    const handleLockScreen = () => setIsLocked(true);
    const handleReprint = () => addNotification('info', t('posCommand.printingReceipt'));

    const handleEndShift = () => {
        if (!activeShift) {
            addNotification('alert', t('posCommand.noShiftFound'));
            return;
        }
        setClosingStep(1);
        setIsClosingShift(true);
    };

    const handleSubmitShift = async () => {
        if (!activeShift) return;
        setIsSubmittingShift(true);

        try {
            const summary = getShiftSummary();
            const actualCash = Object.entries(cashDenominations).reduce(
                (sum, [value, count]) => sum + (parseInt(value) * count),
                0
            );

            const record: any = {
                ...activeShift,
                endTime: new Date().toISOString(),
                cashSales: summary.cash,
                cardSales: summary.card,
                mobileSales: summary.mobile,
                expectedCash: summary.expected,
                actualCash: actualCash,
                variance: actualCash - summary.expected,
                denominations: cashDenominations,
                discrepancyReason: discrepancyReason,
                status: 'Closed'
            };

            await closeShift(record);
            addNotification('success', t('posCommand.shiftClosedSuccess'));
            setIsClosingShift(false);
            logout();
            navigate('/');
        } catch (error) {
            console.error('Shift closure error:', error);
            addNotification('alert', t('posCommand.shiftClosedError'));
        } finally {
            setIsSubmittingShift(false);
        }
    };

    const handleUpdateDenomination = (den: number, quantity: number) => {
        setCashDenominations(prev => ({
            ...prev,
            [den]: quantity
        }));
    };

    const value: POSCommandContextType = {
        dateRange, setDateRange, isWithinRange, filteredSales,
        activeShift, cashInDrawer, personalSales, txCount, returnCount, totalRevenue,
        getShiftSummary, myPoints, siteWorkerPoints, hourlyData, paymentChartData,
        isLocked, setIsLocked, pin, setPin,
        isReceivingModalOpen, setIsReceivingModalOpen, receivingSummary, setReceivingSummary,
        selectedTransferForReceiving, setSelectedTransferForReceiving, isConfirmingReceive,
        orderRefScanInput, setOrderRefScanInput, transferScanBarcode, setTransferScanBarcode,
        transferReceivingItems, setTransferReceivingItems,
        isStockListOpen, setIsStockListOpen, stockSearch, setStockSearch,
        isClosingShift, setIsClosingShift, closingStep, setClosingStep,
        cashDenominations, setCashDenominations, discrepancyReason, setDiscrepancyReason, isSubmittingShift,
        txPage, setTxPage, TX_PER_PAGE,
        handleScanOrderRef, handleSelectTransferForReceiving, handleUpdateTransferItem,
        handleScanTransferItem, handleConfirmTransferReceiving, repairShipmentInventory, handleCloseReceivingModal,
        handleLockScreen, handleReprint, handleEndShift, handleSubmitShift, handleUpdateDenomination
    };

    return <POSCommandContext.Provider value={value}>{children}</POSCommandContext.Provider>;
};

export const usePOSCommand = () => {
    const context = useContext(POSCommandContext);
    if (context === undefined) {
        throw new Error('usePOSCommand must be used within a POSCommandProvider');
    }
    return context;
};
