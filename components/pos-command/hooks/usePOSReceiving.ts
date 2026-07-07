import { useState } from 'react';
import { isWeightBased, isVolumeBased } from '../../../utils/units';

interface UsePOSReceivingProps {
    user: any;
    activeSite: any;
    allProducts: any[];
    transfers: any[];
    jobs: any[];
    addProduct: (p: any) => Promise<any>;
    adjustStock: (pId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => any;
    refreshData: () => Promise<void>;
    refreshJobs: () => void;
    addNotification: (type: 'info' | 'success' | 'alert', message: string) => void;
    formatJobId: (job: any) => string;
    t: (key: string) => string;
}

export const usePOSReceiving = ({
    user,
    activeSite,
    allProducts,
    transfers,
    jobs,
    addProduct,
    adjustStock,
    refreshData,
    refreshJobs,
    addNotification,
    formatJobId,
    t
}: UsePOSReceivingProps) => {
    // --- LOCAL STATES ---
    const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
    const [receivingSummary, setReceivingSummary] = useState<any>(null);
    const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null);
    const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);
    const [orderRefScanInput, setOrderRefScanInput] = useState('');
    const [transferScanBarcode, setTransferScanBarcode] = useState('');
    const [transferReceivingItems, setTransferReceivingItems] = useState<any[]>([]);

    const handleCloseReceivingModal = () => {
        setIsReceivingModalOpen(false);
        setReceivingSummary(null);
        setSelectedTransferForReceiving(null);
        setTransferReceivingItems([]);
    };

    const handleUpdateTransferItem = (index: number, field: string, value: any) => {
        setTransferReceivingItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleSelectTransferForReceiving = (transferId: string) => {
        let transfer = transfers.find(t => t.id === transferId);
        const job = jobs.find(j => j.id === transferId);

        if (!transfer && job) {
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

        if (!transfer) return;

        setSelectedTransferForReceiving(transferId);
        setIsReceivingModalOpen(true);

        const sourceItems = (job?.lineItems || (job as any)?.line_items || transfer.items || []);

        const items = sourceItems.map((item: any) => {
            const itemSku = item.sku?.trim()?.toUpperCase();
            const allMatchingProducts = itemSku
                ? allProducts.filter(p => p.sku?.trim()?.toUpperCase() === itemSku)
                : [];
            const product = allMatchingProducts.find(p => p.size && parseFloat(p.size as string) > 0)
                ?? allMatchingProducts[0]
                ?? null;

            const packageQty = item.expectedQty ?? item.expected_qty ?? item.quantity ?? 0;
            const measureQty = item.requestedMeasureQty ?? item.requested_measure_qty;

            const productSize = parseFloat(
                (product?.size && parseFloat(product.size as string) > 0 ? product.size : null)
                ?? item.size
                ?? '0'
            ) || 0;

            const itemUnit = item.unit || item.measure_unit || item.uom;
            const productUnit = product?.unit || (product as any)?.measureUnit;
            const resolvedUnit = (itemUnit || productUnit || '').trim().toUpperCase();

            return {
                productId: product?.productId || product?.id || item.productId || item.product_id,
                sku: itemSku || item.sku,
                name: product?.name || item.name || t('posCommand.unknownProduct'),
                expectedQty: packageQty,
                requestedMeasureQty: measureQty,
                displayExpectedQty: packageQty,
                receivedQty: 0,
                condition: 'Good' as const,
                notes: '',
                unit: resolvedUnit,
                productSize,
                isMeasure: !!(measureQty || (productSize > 0 && (isWeightBased(resolvedUnit) || isVolumeBased(resolvedUnit))))
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
                if (matchJob.type === 'DISPATCH') {
                    handleSelectTransferForReceiving(matchJob.id);
                    setOrderRefScanInput('');
                    addNotification('success', `${t('posCommand.shipmentFound')} ${ref}`);
                    return;
                }
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
            const item = transferReceivingItems[itemIndex];
            const product = allProducts.find(p => p.sku?.trim()?.toUpperCase() === item.sku?.trim()?.toUpperCase());
            const unit = product?.unit || item.unit || '';
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = product?.size ? parseFloat(product.size as string) : 0;
            const incrementVal = (isWeightVol && sizeNum > 0) ? sizeNum : 1;

            handleUpdateTransferItem(itemIndex, 'receivedQty', item.receivedQty + incrementVal);
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
            const { wmsJobsService } = await import('../../../services/supabase.service');
            const selectedId = selectedTransferForReceiving;
            
            let transferJob: any = null;
            let dispatchJob: any = null;

            const selectedJobObj = jobs.find(j => j.id === selectedId);
            if (selectedJobObj) {
                if (selectedJobObj.type === 'TRANSFER') {
                    transferJob = selectedJobObj;
                    dispatchJob = jobs.find(j => j.type === 'DISPATCH' && (j.orderRef === transferJob.id || j.orderRef === transferJob.jobNumber));
                } else if (selectedJobObj.type === 'DISPATCH') {
                    dispatchJob = selectedJobObj;
                    transferJob = jobs.find(j => j.type === 'TRANSFER' && (j.id === dispatchJob.orderRef || j.jobNumber === dispatchJob.orderRef));
                }
            }

            let transfer = transfers.find(t => t.id === selectedId) as any;
            if (transfer) {
                if (!transferJob) {
                    transferJob = jobs.find(j => j.type === 'TRANSFER' && (j.id === transfer.id || j.jobNumber === transfer.jobNumber || j.orderRef === transfer.id));
                }
                if (!dispatchJob) {
                    dispatchJob = jobs.find(j => j.type === 'DISPATCH' && (j.orderRef === transfer.id || j.orderRef === transfer.jobNumber));
                }
            } else if (selectedJobObj) {
                transfer = {
                    id: selectedJobObj.id,
                    sourceSiteId: (selectedJobObj as any).sourceSiteId || (selectedJobObj as any).source_site_id,
                    destSiteId: selectedJobObj.destSiteId,
                    status: selectedJobObj.status,
                    transferStatus: selectedJobObj.transferStatus,
                    items: selectedJobObj.lineItems || (selectedJobObj as any).line_items || [],
                    orderRef: selectedJobObj.orderRef,
                    jobNumber: selectedJobObj.jobNumber,
                    createdAt: selectedJobObj.createdAt,
                    updatedAt: selectedJobObj.updatedAt,
                    lineItems: selectedJobObj.lineItems || (selectedJobObj as any).line_items
                } as any;
            }

            const finalTransfer = transferJob || transfer;
            if (!finalTransfer) throw new Error('Transfer not found');

            const rawLineItems = finalTransfer.lineItems || finalTransfer.items || [];
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

            const timestampStr = new Date().toISOString();
            const receiverName = user?.name || t('posCommand.posUser');

            const targetTransferId = transferJob?.id || selectedId;
            try {
                await wmsJobsService.update(targetTransferId, {
                    transferStatus: 'Received',
                    receivedAt: timestampStr,
                    receivedBy: receiverName,
                    status: 'Completed',
                    lineItems: updatedLineItems
                } as any);
            } catch (updateErr: any) {
                console.error(`Failed to update TRANSFER job ${targetTransferId}:`, updateErr);
                throw updateErr;
            }

            const targetDispatchJob = dispatchJob || jobs.find(j =>
                j.type === 'DISPATCH' &&
                (j.orderRef === targetTransferId || j.orderRef === finalTransfer.jobNumber)
            );

            if (targetDispatchJob && targetDispatchJob.id !== targetTransferId) {
                try {
                    await wmsJobsService.update(targetDispatchJob.id, {
                        status: 'Completed',
                        transferStatus: 'Received',
                        receivedAt: timestampStr,
                        receivedBy: receiverName
                    } as any);
                } catch (dErr) {
                    console.warn('Failed to update DISPATCH job:', dErr);
                }
            }

            if (transferJob && transferJob.id !== targetTransferId) {
                try {
                    await wmsJobsService.update(transferJob.id, {
                        status: 'Completed',
                        transferStatus: 'Received',
                        receivedAt: timestampStr,
                        receivedBy: receiverName,
                        lineItems: updatedLineItems
                    } as any);
                } catch (pErr) {
                    console.warn('Failed to update parent TRANSFER job:', pErr);
                }
            }

            const destSiteId = transfer.destSiteId || activeSite?.id;
            const failedItems: string[] = [];

            if (destSiteId) {
                const { productsService } = await import('../../../services/supabase.service');

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
                        } else {
                            const templateProduct = itemSku
                                ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                                : null;

                            try {
                                await addProduct({
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

            const hasDiscrepancies = transferReceivingItems.some(i => {
                const sizeNum = i.productSize || 0;
                const isWV = sizeNum > 0 && (isWeightBased(i.unit || '') || isVolumeBased(i.unit || ''));
                const rawExpected = isWV ? (i.displayExpectedQty || i.expectedQty) * sizeNum : (i.displayExpectedQty || i.expectedQty);
                return i.receivedQty !== rawExpected;
            });
            setReceivingSummary({
                orderRef: transfer.orderRef || selectedId,
                jobNumber: transfer.jobNumber || (transfer as any).job_number,
                items: transferReceivingItems.map(i => ({
                    sku: i.sku,
                    name: i.name,
                    expectedQty: i.expectedQty,
                    displayExpectedQty: i.displayExpectedQty || i.expectedQty,
                    receivedQty: i.receivedQty,
                    condition: i.condition,
                    unit: i.unit,
                    productSize: i.productSize || 0
                })),
                timestamp: new Date().toISOString(),
                hasDiscrepancies
            });

            await refreshData();
            refreshJobs();
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
                            `${t('posCommand.startingRepair')}: ${formatJobId(job as any)}`,
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

    return {
        isReceivingModalOpen,
        setIsReceivingModalOpen,
        receivingSummary,
        setReceivingSummary,
        selectedTransferForReceiving,
        setSelectedTransferForReceiving,
        isConfirmingReceive,
        orderRefScanInput,
        setOrderRefScanInput,
        transferScanBarcode,
        setTransferScanBarcode,
        transferReceivingItems,
        setTransferReceivingItems,
        handleCloseReceivingModal,
        handleUpdateTransferItem,
        handleSelectTransferForReceiving,
        handleScanOrderRef,
        handleScanTransferItem,
        handleConfirmTransferReceiving,
        repairShipmentInventory
    };
};
export default usePOSReceiving;
