import { useCallback } from 'react';
import {
    WMSJob, Product, PurchaseOrder, POReceivingInput
} from '../../types';
import {
    wmsJobsService,
    purchaseOrdersService,
    productsService
} from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { useReceivingSplit } from './useReceivingSplit';


import { convertToSellableUnits } from '../procurement/utils';
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
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useReceiving = (deps: UseReceivingDeps) => {
    const {
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification,
        setProducts, setAllProducts
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

                // 2. Check if the product already exists in the TARGET SITE
                let localProduct = allProducts.find(p => 
                    (p.id === targetProductId || p.sku === productSku) && 
                    (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                );
                if (!localProduct) {
                    localProduct = products.find(p => 
                        (p.id === targetProductId || p.sku === productSku) && 
                        (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                    );
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
                    if (lineItem.retailPrice && lineItem.retailPrice > 0 && lineItem.retailPrice !== localProduct.price) {
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

            return newJobs;
        } catch (error: any) {
            logger.error('useReceiving', 'Error receiving PO', error as Error);
            addNotification('alert', error.message || 'Failed to receive PO');
            throw error;
        }
    }, [orders, allOrders, products, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification, setProducts, setAllProducts]);



    // ── finalizePO ──────────────────────────────────────────────────────────

    const finalizePO = useCallback(async (poId: string) => {
        try {
            const po = orders.find(o => o.id === poId);
            if (!po) throw new Error('PO not found');

            // Calculate if full or partial
            const poJobs = jobs.filter(j => (j.orderRef === poId || (po.po_number && j.orderRef === po.po_number) || (po.poNumber && j.orderRef === po.poNumber)) && j.type === 'PUTAWAY');
            const receivedMap: Record<string, number> = {};
            poJobs.forEach(job => {
                job.lineItems.forEach(item => {
                    if (item.productId) {
                        receivedMap[item.productId] = (receivedMap[item.productId] || 0) + item.expectedQty;
                    }
                    if (item.sku) {
                        receivedMap[item.sku] = (receivedMap[item.sku] || 0) + item.expectedQty;
                    }
                });
            });

            const allReceived = po.lineItems?.every(item => {
                const product = allProducts.find(p => p.id === item.productId || (item.sku && p.sku === item.sku));
                const candidateKeys = [
                    item.productId,
                    item.sku,
                    product?.id,
                    product?.sku
                ].filter(Boolean) as string[];
                
                const received = candidateKeys.length > 0 
                    ? candidateKeys.reduce((max, k) => Math.max(max, receivedMap[k] || 0), 0)
                    : 0;
                const expectedSellable = convertToSellableUnits(item.quantity, item);
                return received >= expectedSellable;
            });

            const status = allReceived ? 'Received' : 'Partially Received';

            const updated = await purchaseOrdersService.update(poId, { status: status as any });
            setOrders(prev => prev.map(o => o.id === poId ? updated : o));
            setAllOrders(prev => prev.map(o => o.id === poId ? updated : o));

            addNotification('success', `PO #${po.poNumber || po.po_number} finalized as ${status}`);
        } catch (error) {
            logger.error('useReceiving', 'Finalize PO Error', error as Error);
            addNotification('alert', 'Failed to finalize PO');
            throw error;
        }
    }, [orders, jobs, allProducts, setOrders, setAllOrders, addNotification]);

    return { receivePO, receivePOSplit, finalizePO };
};
