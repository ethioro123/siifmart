import React, { useState } from 'react';
import { ArrowDown, Box, ShieldCheck } from 'lucide-react';
import { WMSJob, Site, ReceivingItem, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';
import { useFulfillment } from '../FulfillmentContext';
import { CustodyHandshakeModal } from './CustodyHandshakeModal';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { productsService } from '../../../services/supabase.service';

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
    const driverName = activeTransferJob.carrierName || activeTransferJob.carrier || assignedDriver?.name || 'Assigned Driver / Courier';

    const handleConfirmReceipt = async (discrepancyDetails?: { hasDiscrepancy: boolean; discrepancyCount: number; driverAcknowledged: boolean }) => {
        if (!activeTransferJob) return;
        try {
            setIsSubmittingReceipt(true);
            const hasDiscrepancy = !!discrepancyDetails?.hasDiscrepancy;
            const discrepancyCount = discrepancyDetails?.discrepancyCount || 0;

            // Preserve verified received quantities and condition statuses
            const updatedLineItems = (activeTransferJob.lineItems || []).map((li: any, idx: number) => {
                const recItem = transferReceiveItems.find(ri => ri.productId === li.productId || ri.sku === li.sku || ri.id === li.id)
                    || transferReceiveItems[idx];
                return {
                    ...li,
                    receivedQty: recItem ? (recItem.receivedQty ?? 0) : (li.receivedQty ?? li.quantity ?? 0),
                    condition: recItem?.condition || 'Good',
                    status: recItem && (recItem.receivedQty || 0) < (li.expectedQty || li.quantity || 0) ? 'Short' : 'Received'
                };
            });

            // Update job status to Received with Chain of Custody audit details
            await wmsJobsService.update(activeTransferJob.id, {
                transferStatus: 'Received',
                status: 'Completed',
                lineItems: updatedLineItems,
                hasDiscrepancy,
                discrepancyDetails: hasDiscrepancy
                    ? `Chain of Custody Discrepancy: ${discrepancyCount} units variance. Certified by ${user?.name || 'Receiver'}`
                    : undefined,
                receivedAt: new Date().toISOString(),
                receivedBy: user?.name || 'Receiver'
            } as any);

            // Also complete the child DISPATCH job if exists
            try {
                const { data: dispatchJobs } = await supabase
                    .from('wms_jobs')
                    .select('id')
                    .or(`order_ref.eq.${activeTransferJob.id},order_ref.eq.${activeTransferJob.jobNumber}`);

                if (dispatchJobs && dispatchJobs.length > 0) {
                    for (const dj of dispatchJobs) {
                        await wmsJobsService.update(dj.id, {
                            status: 'Completed',
                            transferStatus: 'Received',
                            receivedAt: new Date().toISOString()
                        });
                    }
                }
            } catch (err) {
                logger.warn('TransferReceiving', `Failed to complete child DISPATCH job: ${String(err)}`);
            }

            // Also complete the transfers table record if exists
            try {
                const isUUID = (val?: string) => val ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()) : false;
                const idsToQuery = [];
                if (activeTransferJob.id && isUUID(activeTransferJob.id)) {
                    idsToQuery.push(`id.eq.${activeTransferJob.id}`);
                }
                if (activeTransferJob.orderRef && isUUID(activeTransferJob.orderRef)) {
                    idsToQuery.push(`id.eq.${activeTransferJob.orderRef}`);
                }

                if (idsToQuery.length > 0) {
                    const { data: transferRecord } = await supabase
                        .from('transfers')
                        .select('id')
                        .or(idsToQuery.join(','));

                    if (transferRecord && transferRecord.length > 0) {
                        const { transfersService } = await import('../../../services/supabase.service');
                        for (const tr of transferRecord) {
                            await transfersService.update(tr.id, {
                                status: 'Completed',
                                receivedAt: new Date().toISOString()
                            });
                        }
                    }
                }
            } catch (err) {
                logger.warn('TransferReceiving', `Failed to complete transfers table record: ${String(err)}`);
            }

            // Process stock adjustments at destination site
            const destSiteId = activeTransferJob.destSiteId || activeTransferJob.dest_site_id || activeSite?.id;
            for (const item of transferReceiveItems) {
                if ((item.receivedQty || 0) > 0) {
                    const itemSku = (item as any).sku || '';
                    const itemName = item.productName || (item as any).name || '';
                    const itemUnit = (item as any).unit || 'pcs';
                    const itemSize = (item as any).size || '';

                    // Find the source product first to get the SKU
                    let sourceProduct: Product | null | undefined = allProducts.find(p => p.id === item.productId || (item.barcode && p.barcode === item.barcode))
                        || products.find(p => p.id === item.productId || (item.barcode && p.barcode === item.barcode));

                    if (!sourceProduct) {
                        try {
                            if (item.productId) {
                                sourceProduct = await productsService.getById(item.productId);
                            }
                            if (!sourceProduct && itemSku) {
                                sourceProduct = await productsService.getBySKU(itemSku);
                            }
                        } catch (e: any) {
                            logger.warn('TransferReceiving', `Failed to fetch source product fallback for SKU ${itemSku}: ${e?.message || String(e)}`);
                        }
                    }

                    // Try to find the product record at the destination site by SKU
                    let destProduct: Product | null | undefined = sourceProduct ? (
                        allProducts.find(p => 
                            p.sku === sourceProduct?.sku && 
                            (p.siteId === destSiteId || (p as any).site_id === destSiteId)
                        ) || products.find(p => 
                            p.sku === sourceProduct?.sku && 
                            (p.siteId === destSiteId || (p as any).site_id === destSiteId)
                        )
                    ) : undefined;

                    if (!destProduct && (sourceProduct?.sku || itemSku) && destSiteId) {
                        try {
                            destProduct = await productsService.getBySKU(sourceProduct?.sku || itemSku, destSiteId);
                        } catch (e) { }
                    }
                    
                    let targetProductId = destProduct?.id;
                    
                    // If product doesn't exist at destination site, auto-create/clone it for destination site
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
                                productId: sourceProduct?.productId || sourceProduct?.id || item.productId,
                                countryCode: (sourceProduct as any)?.countryCode || (sourceProduct as any)?.country_code,
                                country_code: (sourceProduct as any)?.countryCode || (sourceProduct as any)?.country_code,
                            } as any);
                            targetProductId = newProd?.id;
                        } catch (err) {
                            logger.warn('TransferReceiving', `Failed to auto-create destination product via addProduct: ${String(err)}`);
                        }
                    }

                    if (targetProductId) {
                        await adjustStockMutation.mutateAsync({
                            productId: targetProductId,
                            productName: destProduct?.name || sourceProduct?.name || item.productName || 'Unknown',
                            productSku: destProduct?.sku || sourceProduct?.sku || 'N/A',
                            siteId: destSiteId || activeSite?.id || '',
                            quantity: item.receivedQty,
                            type: 'IN',
                            reason: `Transfer Receipt ${activeTransferJob.orderRef || activeTransferJob.jobNumber || activeTransferJob.id}`,
                            canApprove: true
                        });
                    }
                }
            }

            // Auto-create PUTAWAY job at destination store for shelving received goods
            try {
                const putawayItems = transferReceiveItems
                    .filter(i => (i.receivedQty || 0) > 0)
                    .map(i => ({
                        productId: i.productId,
                        name: i.name || 'Received Product',
                        sku: i.sku || i.productId,
                        expectedQty: i.receivedQty || 0,
                        pickedQty: 0,
                        status: 'Pending' as const
                    }));

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
                        createdBy: user?.name || 'System',
                        countryCode: activeTransferJob.countryCode || (activeTransferJob as any).country_code,
                        country_code: activeTransferJob.countryCode || (activeTransferJob as any).country_code
                    } as any);
                }
            } catch (putawayErr) {
                logger.warn('TransferReceiving', `Failed to auto-create Putaway job: ${String(putawayErr)}`);
            }

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
                            <div key={idx} className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4 flex gap-4">
                                <div className="w-16 h-16 bg-[var(--theme-bg-card)] rounded-lg flex items-center justify-center shrink-0 border border-[var(--theme-border)]">
                                    {product?.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Box className="text-[var(--theme-text-secondary)]" size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--theme-text-primary)] truncate text-sm">{product?.name || 'Unknown Item'}</h4>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{product?.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">
                                                {t('warehouse.expected')}{isBlindReceiving ? ' (Blind)' : ''}
                                            </span>
                                            <p className="font-mono text-[var(--theme-text-primary)] font-bold tabular-nums">
                                                {isBlindReceiving ? (
                                                    <span className="text-amber-500 font-mono tracking-widest font-bold">***</span>
                                                ) : (
                                                    <>
                                                        {item.expectedQty}
                                                        {product?.unit && getSellUnit(product.unit).code !== 'UNIT' && (
                                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium ml-1 uppercase">{getSellUnit(product.unit).shortLabel}</span>
                                                        )}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label htmlFor={`received-qty-${idx}`} className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">
                                                {t('warehouse.received')}{product?.unit && getSellUnit(product.unit).code !== 'UNIT' ? ` (${getSellUnit(product.unit).shortLabel})` : ''}
                                            </label>
                                            <input
                                                id={`received-qty-${idx}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                step={product?.unit && getSellUnit(product.unit).allowDecimal ? '0.01' : '1'}
                                                value={item.receivedQty === 0 ? '' : item.receivedQty}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    const newItems = [...transferReceiveItems];
                                                    const unitDef = getSellUnit(product?.unit);
                                                    const rawVal = e.target.value;
                                                    if (rawVal.trim() === '') {
                                                        newItems[idx].receivedQty = 0;
                                                    } else {
                                                        newItems[idx].receivedQty = unitDef.allowDecimal ? parseFloat(rawVal) || 0 : parseInt(rawVal, 10) || 0;
                                                    }
                                                    setTransferReceiveItems(newItems);
                                                }}
                                                className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation font-mono tabular-nums"
                                                aria-label={`Received quantity for ${product?.name || 'item'}`}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`condition-${idx}`} className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">{t('warehouse.returnCondition')}</label>
                                            <select
                                                id={`condition-${idx}`}
                                                value={item.condition}
                                                onChange={(e) => {
                                                    const newItems = [...transferReceiveItems];
                                                    newItems[idx].condition = e.target.value as any;
                                                    setTransferReceiveItems(newItems);
                                                }}
                                                className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation"
                                                aria-label={`Condition for ${product?.name || 'item'}`}
                                            >
                                                <option value="Good">{t('warehouse.good')}</option>
                                                <option value="Damaged">Damaged</option>
                                                <option value="Short">Short / Missing</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
