import { useCallback } from 'react';
import {
    WMSJob, Product, PurchaseOrder, POReceivingInput, SystemConfig
} from '../../types';
import {
    wmsJobsService,
    purchaseOrdersService,
    productsService,
    systemLogsService
} from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { useReceivingSplit } from './useReceivingSplit';


import { convertToSellableUnits } from '../procurement/utils';
import { resolveReceivingPolicy } from '../../utils/receivingPolicy';
export { convertToSellableUnits };

// ─── Hook Dependencies ──────────────────────────────────────────────────────

interface UseReceivingDeps {
    orders: PurchaseOrder[];
    allOrders: PurchaseOrder[];
    jobs: WMSJob[];
    products: Product[];
    allProducts: Product[];
    activeSite: any;
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    setOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    setAllOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
    setAllProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
    settings?: SystemConfig;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useReceiving = (deps: UseReceivingDeps) => {
    const {
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification,
        setProducts, setAllProducts, settings
    } = deps;

    const { receivePOSplit } = useReceivingSplit(deps);

    // ── receivePO ───────────────────────────────────────────────────────────

    const receivePO = useCallback(async (
        poId: string,
        receivedItems?: POReceivingInput[],
        skuDecisions?: Record<string, 'keep' | 'generate'>,
        scannedSkus?: Record<string, string>,
        locationId?: string,
        actionUser?: { name: string; email: string }
    ) => {
        try {
            const po = orders.find(o => o.id === poId) || allOrders.find(o => o.id === poId);
            if (!po) throw new Error('PO not found');
            if (!po.lineItems) return;

            const targetSiteId = po.siteId || po.site_id;
            const policy = resolveReceivingPolicy(settings, activeSite?.country);

            // Filter for items that have received quantity > 0
            const itemsToProcess = receivedItems
                ? receivedItems.filter(item => item.received > 0)
                : po.lineItems.map((item, index) => ({ index, received: item.quantity })); // Default: Receive all

            logger.debug('useReceiving', `📦 Creating PUTAWAY jobs for ${itemsToProcess.length} items from PO ${po.poNumber}`);

            const jobPromises = itemsToProcess.map(async (item, index) => {
                // Find line item in PO
                const lineItem = po.lineItems![item.index];
                const qtyToReceive = item.received;

                let targetProductId = lineItem.productId;
                let productName = lineItem.productName;
                let productSku = lineItem.sku;
                let productToUpdate: Product | undefined;

                // 1. Check if we need to create a new product first (if this was a temporary/new item)
                // OR if SKU decision is 'generate'
                const decision = skuDecisions ? skuDecisions[lineItem.sku || ''] : 'keep';
                const scannedSku = scannedSkus ? scannedSkus[lineItem.sku || ''] : null;

                const cleanSku = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';
                // 2. Check if the product already exists in the TARGET SITE
                let localProduct = allProducts.find(p => 
                    (p.id === targetProductId || (productSku && cleanSku(p.sku) === cleanSku(productSku))) && 
                    (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                );
                if (!localProduct) {
                    localProduct = products.find(p => 
                        (p.id === targetProductId || (productSku && cleanSku(p.sku) === cleanSku(productSku))) && 
                        (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                    );
                }

                // Check database to prevent creating duplicate placeholder if not yet loaded in local state
                if (!localProduct && (targetProductId || productSku) && targetSiteId) {
                    try {
                        if (targetProductId) {
                            localProduct = (await productsService.getById(targetProductId)) || undefined;
                        }
                        if (!localProduct && productSku) {
                            localProduct = (await productsService.getBySKU(productSku, targetSiteId)) || undefined;
                        }
                    } catch (e) { }
                }

                // Also find a global product to act as a template if we need to create one
                let globalProduct = allProducts.find(p => p.id === targetProductId || p.sku === productSku);

                if (localProduct) {
                    productSku = localProduct.sku; // Use canonical SKU
                    targetProductId = localProduct.id;
                    
                    // Sync PO line item details if they are missing
                    const updates: any = {};
                    if (!localProduct.size && lineItem.size) updates.size = lineItem.size;
                    if (!localProduct.brand && lineItem.brand) updates.brand = lineItem.brand;
                    if (!localProduct.unit && lineItem.unit) updates.unit = lineItem.unit;
                    if (!localProduct.category && lineItem.category) updates.category = lineItem.category;
                    if (policy.poPriceApplyAt === 'receive' && lineItem.retailPrice && lineItem.retailPrice > 0 && lineItem.retailPrice !== localProduct.price) {
                        updates.price = lineItem.retailPrice;
                        updates.priceUpdatedAt = new Date().toISOString();
                        if (targetSiteId && lineItem.sku) {
                            productsService.updatePriceBySku(lineItem.sku, targetSiteId, lineItem.retailPrice).catch(e => {
                                logger.warn('useReceiving', `Failed to sync price across SKU ${lineItem.sku}`, e);
                            });
                        }
                    }
                    if ((!localProduct.costPrice || localProduct.costPrice === 0) && lineItem.unitCost) {
                        const unitsPerOrderUnit = convertToSellableUnits(1, lineItem);
                        updates.costPrice = unitsPerOrderUnit > 0 ? (lineItem.unitCost / unitsPerOrderUnit) : lineItem.unitCost;
                    }
                    if (!localProduct.customAttributes && lineItem.customAttributes) updates.customAttributes = lineItem.customAttributes;
                    if (!localProduct.description && lineItem.description) updates.description = lineItem.description;
                    if (!localProduct.minStock && lineItem.minStock) updates.minStock = lineItem.minStock;
                    if (!localProduct.maxStock && lineItem.maxStock) updates.maxStock = lineItem.maxStock;
 
                    if (Object.keys(updates).length > 0) {
                        const updated = await productsService.update(localProduct.id, updates);
                        if (updated) {
                            setProducts?.(prev => prev.map(p => p.id === localProduct!.id ? updated : p));
                            setAllProducts?.(prev => prev.map(p => p.id === localProduct!.id ? updated : p));
                        }
                    }
                } else {
                    // Create product placeholder record in DB
                    try {
                        const created = await productsService.create({
                            siteId: targetSiteId || activeSite?.id || '',
                            name: productName || lineItem.productName || globalProduct?.name || `Item ${productSku}`,
                            sku: productSku || lineItem.sku,
                            barcode: (lineItem as any).barcode || globalProduct?.barcode || '',
                            barcodes: (lineItem as any).barcodes || globalProduct?.barcodes || [],
                            price: lineItem.retailPrice || globalProduct?.price || 0,
                            costPrice: (() => {
                                const unitsPerOrderUnit = convertToSellableUnits(1, lineItem);
                                return unitsPerOrderUnit > 0 ? (lineItem.unitCost / unitsPerOrderUnit) : (lineItem.unitCost || globalProduct?.costPrice || 0);
                            })(),
                            category: lineItem.category || globalProduct?.category || 'Uncategorized',
                            status: 'active',
                            stock: 0,
                            location: 'On Order',
                            expiryDate: (lineItem as any).expiryDate || (lineItem as any).expiry_date || globalProduct?.expiryDate,
                            batchNumber: (lineItem as any).batchNumber || (lineItem as any).batch_number || globalProduct?.batchNumber,
                            size: lineItem.size || globalProduct?.size || '',
                            brand: lineItem.brand || globalProduct?.brand || '',
                            unit: lineItem.unit || globalProduct?.unit || 'UNIT',
                            packQuantity: lineItem.packQuantity || globalProduct?.packQuantity || 1,
                            packageType: lineItem.packageType || globalProduct?.packageType || lineItem.customAttributes?.packaging?.packageType || globalProduct?.customAttributes?.packaging?.packageType || '',
                            caseSize: lineItem.caseSize || globalProduct?.caseSize || lineItem.customAttributes?.packaging?.caseSize || globalProduct?.customAttributes?.packaging?.caseSize || undefined,
                            customAttributes: lineItem.customAttributes || globalProduct?.customAttributes || null,
                            description: lineItem.description || globalProduct?.description || '',
                            minStock: lineItem.minStock || globalProduct?.minStock || 0,
                            maxStock: lineItem.maxStock || globalProduct?.maxStock || 0
                        } as any);
                        if (created) {
                            targetProductId = created.id;
                            productSku = created.sku;
                            setProducts?.(prev => [created, ...prev]);
                            setAllProducts?.(prev => [created, ...prev]);
                        }
                    } catch (err) {
                        logger.error('useReceiving', 'Failed to create placeholder product in receivePO', err as Error);
                        throw err;
                    }
                }

                const newJob: Omit<WMSJob, 'id'> = {
                    siteId: targetSiteId || '',
                    site_id: targetSiteId, // Supabase
                    type: 'PUTAWAY',
                    status: 'Pending',
                    priority: 'Normal',
                    assignedTo: undefined,
                    items: 1, // Line items count
                    location: 'Receiving Dock',
                    orderRef: po.id,
                    lineItems: [{
                        productId: targetProductId!,
                        name: productName,
                        sku: productSku || '', // Use resolved SKU
                        expectedQty: convertToSellableUnits(qtyToReceive || 0, lineItem),
                        pickedQty: 0,
                        status: 'Pending',
                        // Pass cost/price for label printing if available
                        cost: lineItem.unitCost,
                        retailPrice: lineItem.retailPrice,
                        unit: lineItem.unit,
                        expiryDate: (lineItem as any).expiryDate || (lineItem as any).expiry_date,
                        batchNumber: (lineItem as any).batchNumber || (lineItem as any).batch_number,
                        // Pass PO attributes so putaway can create a complete Product record
                        size: lineItem.size,
                        brand: lineItem.brand,
                        packQuantity: lineItem.packQuantity,
                        category: lineItem.category,
                        customAttributes: lineItem.customAttributes,
                        description: lineItem.description,
                        minStock: lineItem.minStock,
                        maxStock: lineItem.maxStock
                    }]
                };

                const createdJob = await wmsJobsService.create(newJob as any);
                return { job: createdJob, productId: targetProductId, sku: productSku };
            });

            const results = await Promise.all(jobPromises);
            const newJobs = results.map(r => r.job);

            // Update local state
            setJobs(prev => [...prev, ...newJobs]);

            // Stamp who physically received the goods
            if (actionUser?.name) {
                try {
                    await purchaseOrdersService.update(poId, { receivedBy: actionUser.name });
                } catch (err) {
                    logger.warn('useReceiving', 'Could not stamp receivedBy on PO', { error: err instanceof Error ? err.message : JSON.stringify(err) });
                }
            }

            // Refresh PO details
            const updatedPO = await purchaseOrdersService.getById(poId);
            if (updatedPO) {
                setOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
            }

            addNotification('success', `Created ${newJobs.length} putaway jobs for PO ${po.poNumber}`);

            try {
                await systemLogsService.create({
                    action: 'PO_GOODS_RECEIVED',
                    module: 'Fulfillment',
                    user_name: actionUser?.name || 'Receiver',
                    site_id: targetSiteId,
                    country_code: activeSite?.country || 'ET',
                    entity_type: 'purchase_order',
                    entity_id: poId,
                    details: {
                        poNumber: po.poNumber,
                        itemsCount: newJobs.length,
                        itemsProcessed: itemsToProcess.length,
                        receivedBy: actionUser?.name,
                    },
                });
            } catch (logErr) {
                logger.warn('useReceiving', 'Non-blocking audit log failure:', { error: logErr instanceof Error ? logErr.message : String(logErr) });
            }

            return newJobs;
        } catch (error: any) {
            logger.error('useReceiving', 'Error receiving PO', error as Error);
            addNotification('alert', error.message || 'Failed to receive PO');
            throw error;
        }
    }, [orders, allOrders, products, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification, setProducts, setAllProducts, settings]);



    // ── finalizePO ──────────────────────────────────────────────────────────

    const finalizePO = useCallback(async (poId: string) => {
        try {
            const po = orders.find(o => o.id === poId) || allOrders.find(o => o.id === poId);
            if (!po) throw new Error('PO not found');

            const cleanSku = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';

            // Calculate if full or partial
            const poJobs = jobs.filter(j => (j.orderRef === poId || (po.po_number && j.orderRef === po.po_number) || (po.poNumber && j.orderRef === po.poNumber)) && j.type === 'PUTAWAY');
            const receivedMap: Record<string, number> = {};
            poJobs.forEach(job => {
                job.lineItems.forEach(item => {
                    const expected = item.expectedQty || (item as any).quantity || 0;
                    if (expected <= 0) return;
                    const canonKey = cleanSku(item.sku) || item.productId;
                    if (canonKey) {
                        receivedMap[canonKey] = (receivedMap[canonKey] || 0) + expected;
                    }
                });
            });

            const updatedLineItems = (po.lineItems || []).map((item: any) => {
                const product = allProducts.find(p => p.id === item.productId || (item.sku && cleanSku(p.sku) === cleanSku(item.sku)));
                const canonKey = cleanSku(item.sku) || cleanSku(product?.sku) || item.productId || product?.id || '';
                const receivedFromJobs = canonKey ? (receivedMap[canonKey] || 0) : 0;
                const received = Math.max(item.receivedQty || 0, receivedFromJobs);

                return {
                    ...item,
                    receivedQty: received
                };
            });

            const allReceived = updatedLineItems.every((item: any) => {
                const expectedSellable = convertToSellableUnits(item.quantity, item);
                return (item.receivedQty || 0) >= expectedSellable;
            });

            const status = allReceived ? 'Received' : 'Partially Received';

            // 1. Update PO status and lineItems in DB
            const updated = await purchaseOrdersService.update(poId, { 
                status: status as any,
                lineItems: updatedLineItems
            });
            setOrders(prev => prev.map(o => o.id === poId ? updated : o));
            setAllOrders(prev => prev.map(o => o.id === poId ? updated : o));

            // 2. Mark any matching WMS RECEIVE jobs as Completed
            const receiveJobs = jobs.filter(j => 
                j.type === 'RECEIVE' && 
                (j.orderRef === poId || (po.poNumber && j.jobNumber === po.poNumber) || (po.po_number && j.jobNumber === po.po_number))
            );
            for (const rj of receiveJobs) {
                try {
                    await wmsJobsService.update(rj.id, {
                        status: 'Completed',
                        completedBy: po.receivedBy || 'System',
                        completedAt: new Date().toISOString()
                    });
                } catch (e) {
                    logger.error('useReceiving', 'finalizePO_updateReceiveJobs', e);
                }
            }

            // 3. Update local jobs state so the RECEIVE job is shown as Completed
            setJobs(prev => prev.map(j => {
                if (j.type === 'RECEIVE' && (j.orderRef === poId || (po.poNumber && j.jobNumber === po.poNumber) || (po.po_number && j.jobNumber === po.po_number))) {
                    return {
                        ...j,
                        status: 'Completed' as const,
                        completedBy: po.receivedBy || 'System',
                        completedAt: new Date().toISOString()
                    };
                }
                return j;
            }));

            addNotification('success', `PO #${po.poNumber || po.po_number} finalized as ${status}`);
        } catch (error) {
            logger.error('useReceiving', 'Finalize PO Error', error as Error);
            addNotification('alert', 'Failed to finalize PO');
            throw error;
        }
    }, [orders, allOrders, jobs, allProducts, setOrders, setAllOrders, setJobs, addNotification]);

    return { receivePO, receivePOSplit, finalizePO };
};
