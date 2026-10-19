import React, { useState } from 'react';
import { ArrowDown, Box, ShieldCheck } from 'lucide-react';
import { WMSJob, Site, ReceivingItem, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getTransferQuantityConfig, toTransferStockQuantity } from './transferQuantity';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';
import { useFulfillment } from '../FulfillmentContext';
import { CustodyHandshakeModal } from './CustodyHandshakeModal';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { productsService } from '../../../services/supabase.service';
import { TransferReceiveItemCard } from './TransferReceiveItemCard';

interface TransferReceivingProps {
    activeTransferJob: WMSJob;
    transferReceiveItems: ReceivingItem[];
    setTransferReceiveItems: (items: ReceivingItem[]) => void;
    setTransferReceiveMode: (val: boolean) => void;
    setActiveTransferJob: (job: WMSJob | null) => void;
    allProducts: Product[];
    wmsJobsService: any;
    adjustStockMutation: any;
    addProduct?: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>;
    activeSite: Site | null;
}

export const TransferReceiving: React.FC<TransferReceivingProps> = ({
    activeTransferJob,
    transferReceiveItems,
    setTransferReceiveItems,
    setTransferReceiveMode,
    setActiveTransferJob,
    allProducts,
    wmsJobsService,
    adjustStockMutation,
    addProduct,
    addNotification,
    refreshData,
    activeSite
}) => {
    const { t } = useLanguage();
    const { user, employees, logSystemEvent } = useFulfillment();
    const { settings, effectiveCountry, products } = useData();
    const isBlindReceiving = resolveReceivingPolicy(settings, effectiveCountry).blind;
    const [isHandshakeModalOpen, setIsHandshakeModalOpen] = useState(false);
    const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

    // Delivering driver lookup
    const assignedDriver = employees.find(e => e.id === activeTransferJob.assignedTo);
    const driverName = (activeTransferJob as any).carrierName || (activeTransferJob as any).carrier || assignedDriver?.name || 'Assigned Driver / Courier';

    const handleConfirmReceipt = async (discrepancyDetails?: { hasDiscrepancy: boolean; discrepancyCount: number; driverAcknowledged: boolean }) => {
        if (!activeTransferJob) return;
        if (activeTransferJob.transferStatus === 'Received' || activeTransferJob.status === 'Completed') {
            addNotification('alert', 'This shipment has already been received and completed.');
            return;
        }
        const appliedStockAdjustments: { productId: string; previousStock: number }[] = [];
        try {
            setIsSubmittingReceipt(true);
            const hasDiscrepancy = !!discrepancyDetails?.hasDiscrepancy;
            const discrepancyCount = discrepancyDetails?.discrepancyCount || 0;

            const destSiteId = activeTransferJob.destSiteId || activeTransferJob.dest_site_id || activeSite?.id;
            const timestamp = new Date().toISOString();
            const receiverName = user?.name || 'Receiver';

            // 1. Process stock intake at destination site BEFORE marking transfer complete
            for (const item of transferReceiveItems) {
                if ((item.receivedQty || 0) > 0) {
                    const itemSku = (item as any).sku || '';
                    const itemName = item.productName || (item as any).name || '';
                    const itemUnit = (item as any).unit || 'pcs';
                    const itemSize = (item as any).size || '';
                    // Find source product to get product details
                    let sourceProduct: Product | null | undefined = allProducts.find(p => p.id === item.productId || (item.barcode && p.barcode === item.barcode))
                        || products.find(p => p.id === item.productId || (item.barcode && p.barcode === item.barcode));

                    if (!sourceProduct) {
                        try {
                            if (item.productId) sourceProduct = await productsService.getById(item.productId);
                            if (!sourceProduct && itemSku) sourceProduct = await productsService.getBySKU(itemSku);
                        } catch (e: any) {
                            logger.warn('TransferReceiving', `Source product lookup notice for SKU ${itemSku}: ${e?.message || String(e)}`);
                        }
                    }

                    const transferProduct = {
                        ...sourceProduct,
                        unit: item.unit || sourceProduct?.unit,
                        size: item.size || sourceProduct?.size,
                        packQuantity: item.packQuantity || sourceProduct?.packQuantity,
                        packageType: item.packageType || sourceProduct?.packageType,
                        customAttributes: item.customAttributes || sourceProduct?.customAttributes
                    };
                    const unitConfig = getTransferQuantityConfig(transferProduct);
                    const receivedStockQty = toTransferStockQuantity(
                        item.receivedQty || 0,
                        transferProduct,
                        item.requestedMeasureQty !== undefined || unitConfig.isLooseMeasure
                    );

                    // Look up existing destination product record
                    let destProduct: Product | null | undefined = sourceProduct ? (
                        allProducts.find(p => p.sku === sourceProduct?.sku && (p.siteId === destSiteId || (p as any).site_id === destSiteId))
                        || products.find(p => p.sku === sourceProduct?.sku && (p.siteId === destSiteId || (p as any).site_id === destSiteId))
                    ) : undefined;

                    if (!destProduct && (sourceProduct?.sku || itemSku) && destSiteId) {
                        try {
                            destProduct = await productsService.getBySKU(sourceProduct?.sku || itemSku, destSiteId);
                        } catch (e) { }
                    }
                    
                    let targetProductId = destProduct?.id;
                    
                    // Auto-create destination product if it doesn't exist
                    if (!destProduct && addProduct) {
                        const effectivePrice = sourceProduct?.price ?? (item as any).retailPrice ?? (item as any).price ?? 0;
                        const effectiveCost = (sourceProduct as any)?.costPrice || (sourceProduct as any)?.cost || (item as any).costPrice || (item as any).cost || 0;
                        const effectiveCategory = (sourceProduct?.category && sourceProduct.category !== 'Uncategorized')
                            ? sourceProduct.category
                            : ((item as any).category && (item as any).category !== 'Uncategorized' ? (item as any).category : 'General');

                        try {
                            const newProd = await addProduct({
                                name: sourceProduct?.name || itemName || `Item ${itemSku}`,
                                sku: sourceProduct?.sku || itemSku,
                                barcode: sourceProduct?.barcode || item.barcode || '',
                                price: effectivePrice,
                                costPrice: effectiveCost,
                                stock: 0,
                                unit: sourceProduct?.unit || itemUnit,
                                siteId: destSiteId,
                                site_id: destSiteId,
                                category: effectiveCategory,
                                brand: sourceProduct?.brand || (item as any).brand || '',
                                size: sourceProduct?.size || itemSize,
                                packQuantity: sourceProduct?.packQuantity || item.packQuantity,
                                packageType: sourceProduct?.packageType || item.packageType,
                                customAttributes: sourceProduct?.customAttributes || item.customAttributes,
                                productId: sourceProduct?.productId || sourceProduct?.id || item.productId,
                                countryCode: (sourceProduct as any)?.countryCode || (sourceProduct as any)?.country_code,
                                country_code: (sourceProduct as any)?.countryCode || (sourceProduct as any)?.country_code,
                            } as any);
                            targetProductId = newProd?.id;
                        } catch (err) {
                            logger.error('TransferReceiving', 'Failed to auto-create destination product', err as Error);
                            throw new Error(`Failed to create inventory item ${itemSku} at destination site.`);
                        }
                    }

                    if (targetProductId) {
                        const previousStock = Number(destProduct?.stock || 0);
                        await adjustStockMutation.mutateAsync({
                            productId: targetProductId,
                            productName: destProduct?.name || sourceProduct?.name || item.productName || 'Unknown',
                            productSku: destProduct?.sku || sourceProduct?.sku || 'N/A',
                            siteId: destSiteId || activeSite?.id || '',
                            quantity: receivedStockQty,
                            type: 'IN',
                            reason: `Transfer Receipt ${activeTransferJob.orderRef || activeTransferJob.jobNumber || activeTransferJob.id}`,
                            canApprove: true
                        });
                        appliedStockAdjustments.push({ productId: targetProductId, previousStock });
                    }
                }
            }

            // 2. Auto-create PUTAWAY job at destination store (must finish before completing transfer)
            const putawayItems = transferReceiveItems
                .filter(i => (i.receivedQty || 0) > 0)
                .map((i: any) => {
                    const matchingLineItem = (activeTransferJob.lineItems || []).find((li: any) => li.productId === i.productId || li.sku === i.sku);
                    return {
                        productId: i.productId,
                        name: i.name || i.productName || matchingLineItem?.name || 'Received Product',
                        sku: i.sku || matchingLineItem?.sku || i.productId,
                        price: (matchingLineItem as any)?.price || (matchingLineItem as any)?.retailPrice || 0,
                        retailPrice: (matchingLineItem as any)?.retailPrice || (matchingLineItem as any)?.price || 0,
                        costPrice: (matchingLineItem as any)?.costPrice || (matchingLineItem as any)?.cost || 0,
                        category: matchingLineItem?.category || 'General',
                        brand: matchingLineItem?.brand || '',
                        unit: matchingLineItem?.unit || i.unit || 'pcs',
                        size: matchingLineItem?.size || i.size || '',
                        packQuantity: matchingLineItem?.packQuantity || i.packQuantity,
                        packageType: matchingLineItem?.packageType || i.packageType,
                        customAttributes: matchingLineItem?.customAttributes || i.customAttributes,
                        barcode: matchingLineItem?.barcode || i.barcode || '',
                        expectedQty: toTransferStockQuantity(
                            i.receivedQty || 0,
                            {
                                unit: matchingLineItem?.unit || i.unit,
                                size: matchingLineItem?.size || i.size,
                                packQuantity: matchingLineItem?.packQuantity || i.packQuantity,
                                packageType: matchingLineItem?.packageType || i.packageType,
                                customAttributes: matchingLineItem?.customAttributes || i.customAttributes
                            },
                            i.requestedMeasureQty !== undefined || getTransferQuantityConfig({
                                unit: matchingLineItem?.unit || i.unit,
                                size: matchingLineItem?.size || i.size,
                                customAttributes: matchingLineItem?.customAttributes || i.customAttributes
                            }).isLooseMeasure
                        ),
                        pickedQty: 0,
                        status: 'Pending' as const
                    };
                });

            if (putawayItems.length > 0 && destSiteId) {
                await wmsJobsService.create({
                    type: 'PUTAWAY',
                    status: 'Pending',
                    siteId: destSiteId,
                    site_id: destSiteId,
                    priority: activeTransferJob.priority || 'Normal',
                    items: Math.ceil(putawayItems.reduce((acc, i) => acc + i.expectedQty, 0)),
                    lineItems: putawayItems,
                    location: 'Receiving Dock',
                    orderRef: activeTransferJob.orderRef || activeTransferJob.jobNumber || activeTransferJob.id,
                    createdBy: receiverName,
                    countryCode: activeTransferJob.countryCode || (activeTransferJob as any).country_code,
                    country_code: activeTransferJob.countryCode || (activeTransferJob as any).country_code
                } as any);
            }

            // 3. Preserve verified received quantities and condition statuses
            const updatedLineItems = (activeTransferJob.lineItems || []).map((li: any, idx: number) => {
                const recItem = transferReceiveItems.find((ri: any) => ri.productId === li.productId || ri.sku === li.sku || ri.id === li.id)
                    || transferReceiveItems[idx];
                return {
                    ...li,
                    receivedQty: recItem ? (recItem.receivedQty ?? 0) : (li.receivedQty ?? li.quantity ?? 0),
                    condition: recItem?.condition || 'Good',
                    status: recItem && (recItem.receivedQty || 0) < (li.requestedMeasureQty ?? li.expectedQty ?? li.quantity ?? 0) ? 'Short' : 'Received'
                };
            });

            // 4. Update WMS job status to Completed/Received
            await wmsJobsService.update(activeTransferJob.id, {
                transferStatus: 'Received',
                status: 'Completed',
                lineItems: updatedLineItems,
                hasDiscrepancy,
                discrepancyDetails: hasDiscrepancy
                    ? `Chain of Custody Discrepancy: ${discrepancyCount} units variance. Certified by ${receiverName}`
                    : undefined,
                receivedAt: timestamp,
                receivedBy: receiverName
            } as any);

            // The database trigger records the linked transfer summary with this acceptance.
            // If discrepancy occurred, dispatch event to penalize gamification accuracy & log audit
            if (hasDiscrepancy) {
                const responsibleEmployeeId = activeTransferJob.assignedTo || assignedDriver?.id;
                if (responsibleEmployeeId) {
                    window.dispatchEvent(new CustomEvent('fulfillment:chain-of-custody-discrepancy', {
                        detail: {
                            employeeId: responsibleEmployeeId,
                            employeeName: driverName,
                            siteId: activeTransferJob.sourceSiteId || activeSite?.id,
                            discrepancyCount,
                            totalExpected: activeTransferJob.items || 10,
                            transferId: activeTransferJob.id
                        }
                    }));
                }

                if (logSystemEvent) {
                    try {
                        await logSystemEvent(
                            'CHAIN_OF_CUSTODY_DISCREPANCY',
                            `Transfer ${formatJobId(activeTransferJob)} received with ${discrepancyCount} unit variance. Relinquished by ${driverName}, accepted by ${user?.name || 'Receiver'}. Driver co-sign: ${discrepancyDetails?.driverAcknowledged ? 'Acknowledged' : 'Unacknowledged'}`,
                            user?.name || 'Receiver',
                            'WMS_TRANSFERS'
                        );
                    } catch (auditErr) {
                        logger.warn('TransferReceiving', `Failed to log custody discrepancy: ${String(auditErr)}`);
                    }
                }
            } else if (logSystemEvent) {
                try {
                    await logSystemEvent(
                        'CHAIN_OF_CUSTODY_CLEAN_HANDSHAKE',
                        `Transfer ${formatJobId(activeTransferJob)} clean custody transfer sealed. 100% count match. Relinquished by ${driverName}, accepted by ${user?.name || 'Receiver'}`,
                        user?.name || 'Receiver',
                        'WMS_TRANSFERS'
                    );
                } catch (auditErr) {
                    logger.warn('TransferReceiving', `Failed to log clean custody handshake: ${String(auditErr)}`);
                }
            }

            addNotification(hasDiscrepancy ? 'warning' : 'success', hasDiscrepancy ? `Custody transfer sealed with ${discrepancyCount} unit discrepancy noted` : 'Clean custody handshake sealed successfully');
            setIsHandshakeModalOpen(false);
            setTransferReceiveMode(false);
            setActiveTransferJob(null);
            setTransferReceiveItems([]);
            await refreshData();
        } catch (err) {
            if (appliedStockAdjustments.length > 0) {
                for (const applied of appliedStockAdjustments) {
                    try {
                        await productsService.update(applied.productId, { stock: applied.previousStock } as any);
                    } catch (revErr) {
                        logger.error('TransferReceiving', `Rollback stock failed for ${applied.productId}`, revErr as Error);
                    }
                }
            }
            logger.error('TransferReceiving', 'Failed to receive transfer:', err);
            addNotification('alert', 'Failed to receive items');
        } finally {
            setIsSubmittingReceipt(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 mb-5 shadow-xs">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-lg tracking-tight">
                            <ArrowDown className="text-primary" size={20} />
                            {t('warehouse.shipmentReceiving')}
                        </h3>
                        {activeTransferJob && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-primary font-mono text-xs font-semibold">{formatJobId(activeTransferJob)}</span>
                                <span className="text-[var(--theme-text-secondary)] text-xs">•</span>
                                <span className="text-[var(--theme-text-secondary)] text-xs font-medium">{activeTransferJob.items} {t('warehouse.itemPlural')}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setTransferReceiveMode(false);
                            setActiveTransferJob(null);
                            setTransferReceiveItems([]);
                        }}
                        className="min-h-[44px] px-4 py-2 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl font-semibold transition-all text-xs touch-manipulation"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>

            {/* Receive List */}
            <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden flex flex-col shadow-xs">
                <div className="overflow-y-auto space-y-3.5 custom-scrollbar flex-1 pb-4">
                    {transferReceiveItems.map((item, idx) => {
                        const product = allProducts.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);
                        return (
                            <TransferReceiveItemCard
                                key={idx}
                                item={item}
                                idx={idx}
                                product={product}
                                isBlindReceiving={isBlindReceiving}
                                onUpdateItem={(targetIdx, updates) => {
                                    const newItems = [...transferReceiveItems];
                                    newItems[targetIdx] = { ...newItems[targetIdx], ...updates };
                                    setTransferReceiveItems(newItems);
                                }}
                                t={t}
                            />
                        );
                    })}
                </div>
                <div className="pt-4 border-t border-[var(--theme-border)] mt-2">
                    <button
                        onClick={() => setIsHandshakeModalOpen(true)}
                        className="w-full min-h-[44px] py-3.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all touch-manipulation active:scale-[0.99] cursor-pointer"
                    >
                        <ShieldCheck size={16} />
                        Review & Sign Digital Handshake (Chain of Custody)
                    </button>
                </div>
            </div>

            {/* Custody Handshake Modal */}
            <CustodyHandshakeModal
                isOpen={isHandshakeModalOpen}
                onClose={() => setIsHandshakeModalOpen(false)}
                onConfirm={handleConfirmReceipt}
                activeTransferJob={activeTransferJob}
                transferReceiveItems={transferReceiveItems}
                allProducts={allProducts}
                products={products}
                currentUser={user}
                driverName={driverName}
                isSubmitting={isSubmittingReceipt}
            />
        </div>
    );
};
