import { useCallback } from 'react';
import { PurchaseOrder, WMSJob, Product, SystemConfig } from '../../types';
import {
    productsService,
    wmsJobsService,
    purchaseOrdersService,
    systemLogsService
} from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { convertToSellableUnits } from './useReceiving';
import { resolveReceivingPolicy, maxReceivable, buildOverReceiveMessage } from '../../utils/receivingPolicy';
import { findMatchingProduct, resolveSmartPutawayLocation, cleanSku } from './receivingSplitHelpers';

interface UseReceivingSplitDeps {
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

export const useReceivingSplit = (deps: UseReceivingSplitDeps) => {
    const {
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification,
        setProducts, setAllProducts, settings
    } = deps;

    const receivePOSplit = useCallback(async (
        poId: string,
        itemId: string,
        variants: Array<{ sku: string; skuType: 'existing' | 'new'; productId?: string; productName?: string; quantity: number; barcode?: string; barcodes?: string[]; expiryDate?: string; batchNumber?: string; condition?: string; }>,
        locationId?: string,
        actionUser?: { name: string; email: string }
    ) => {
        try {
            const po = orders.find(o => o.id === poId) || allOrders.find(o => o.id === poId);
            if (!po) throw new Error('PO not found');

            // Find the line item
            const itemIndex = po.lineItems?.findIndex((i: any) => i.productId === itemId || i.sku === itemId || i.id === itemId);
            if (itemIndex === undefined || itemIndex === -1) {
                logger.error('useReceivingSplit', `Item not found in PO: ${itemId}`, new Error(`Item ${itemId} not found`));
                return;
            }
            const item = po.lineItems![itemIndex];

            // VALIDATION: Prevent over-receiving (helps avoid accidental duplicates)
            const clean = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';
            const expectedSellable = convertToSellableUnits(item.quantity, item);
            const targetKey = clean(item.sku) || item.productId || itemId;

            const policy = resolveReceivingPolicy(settings, activeSite?.country);
            const existingPutawayJobs = jobs.filter(j => (j.orderRef === poId || (po.poNumber && j.orderRef === po.poNumber) || (po.po_number && j.orderRef === po.po_number)) && j.type === 'PUTAWAY');
            let totalAlreadyReceived = 0;
            existingPutawayJobs.forEach(j => {
                j.lineItems.forEach((ji: any) => {
                    const jobKey = clean(ji.sku) || ji.productId;
                    if (jobKey && targetKey && (jobKey === targetKey || ji.productId === itemId || ji.sku === item.sku)) {
                        totalAlreadyReceived += (ji.expectedQty || 0);
                    }
                });
            });
            // Server-authoritative: another device may have received since local state loaded
            const freshPO = await purchaseOrdersService.getById(poId).catch(() => null);
            totalAlreadyReceived = Math.max(totalAlreadyReceived, (freshPO?.lineItems as any[])?.[itemIndex]?.receivedQty || 0);

            const newSplitTotal = variants.reduce((sum, v) => sum + v.quantity, 0);
            const allowed = maxReceivable(expectedSellable, policy.overReceiveTolerancePct);

            if (totalAlreadyReceived + newSplitTotal > allowed) {
                addNotification('alert', buildOverReceiveMessage(policy.blind, {
                    received: totalAlreadyReceived, expected: expectedSellable, attempted: newSplitTotal, allowed
                }));
                return;
            }

            const jobPromises = variants.map(async (variant, index) => {
                let targetProductId = variant.productId || itemId;
                let productSku = variant.sku;
                let primaryBarcode = variant.barcode;
                let existingProduct: Product | undefined;

                // 1. Handle New Product Creation
                if (variant.skuType === 'new') {
                    try {
                        const newProductCheck = allProducts.find(p => p.sku === variant.sku);
                        if (newProductCheck) {
                            targetProductId = newProductCheck.id;
                        } else {
                            const created = await productsService.create({
                                siteId: po.siteId || activeSite?.id || '',
                                name: variant.productName || item.productName || `New Item ${variant.sku}`,
                                sku: variant.sku,
                                barcode: variant.barcode,
                                barcodes: variant.barcodes || [],
                                price: item.retailPrice || 0,
                                costPrice: (() => {
                                    const unitsPerOrderUnit = convertToSellableUnits(1, item);
                                    return unitsPerOrderUnit > 0 ? (item.unitCost / unitsPerOrderUnit) : (item.unitCost || 0);
                                })(),
                                category: item.category || 'Uncategorized',
                                status: 'active',
                                stock: 0,
                                location: 'On Order',
                                size: item.size || '',
                                brand: item.brand || '',
                                unit: item.unit || 'UNIT',
                                packQuantity: item.packQuantity || 1,
                                customAttributes: item.customAttributes || null,
                                description: item.description || '',
                                minStock: item.minStock || 0,
                                maxStock: item.maxStock || 0
                            } as any);
                            if (created) {
                                targetProductId = created.id;
                                setProducts?.(prev => [created, ...prev]);
                                setAllProducts?.(prev => [created, ...prev]);
                            }
                        }
                    } catch (err) {
                        logger.error('useReceivingSplit', 'Failed to create new product during receive', err as Error);
                        throw err;
                    }
                }
                // 2. Handle Existing Product - Update Barcodes and Attributes if needed
                else if (variant.productId || itemId) {
                    const prodId = variant.productId || item.productId;
                    const prodSku = variant.sku || item.sku;
                    const targetSiteId = po.siteId || activeSite?.id || '';
                    const incomingBarcodes = [variant.barcode, ...(variant.barcodes || []), (item as any).barcode, ...((item as any).barcodes || [])]
                        .filter((b): b is string => Boolean(b && b.trim()))
                        .map(b => b.trim());

                    const { localProduct, globalProduct } = await findMatchingProduct({
                        prodId,
                        prodSku,
                        productName: item.productName,
                        incomingBarcodes,
                        targetSiteId,
                        allProducts,
                        products
                    });

                    existingProduct = localProduct || globalProduct;
                    if (localProduct) {
                        targetProductId = localProduct.id;
                        productSku = localProduct.sku;

                        const updates: any = {};
                        
                        // Sync PO line item details if they are missing
                        if (!localProduct.size && item.size) updates.size = item.size;
                        if (!localProduct.brand && item.brand) updates.brand = item.brand;
                        if (!localProduct.unit && item.unit) updates.unit = item.unit;
                        if (!localProduct.category && item.category) updates.category = item.category;
                        if (policy.poPriceApplyAt === 'receive' && item.retailPrice && item.retailPrice > 0 && item.retailPrice !== localProduct.price) {
                            updates.price = item.retailPrice;
                            updates.priceUpdatedAt = new Date().toISOString();
                            if (targetSiteId && item.sku) {
                                productsService.updatePriceBySku(item.sku, targetSiteId, item.retailPrice).catch(e => {
                                    logger.warn('useReceivingSplit', `Failed to sync price across SKU ${item.sku}`, e);
                                });
                            }
                        }
                        if ((!localProduct.costPrice || localProduct.costPrice === 0) && item.unitCost) {
                            const unitsPerOrderUnit = convertToSellableUnits(1, item);
                            updates.costPrice = unitsPerOrderUnit > 0 ? (item.unitCost / unitsPerOrderUnit) : item.unitCost;
                        }
                        if (!localProduct.customAttributes && item.customAttributes) updates.customAttributes = item.customAttributes;
                        if (!localProduct.description && item.description) updates.description = item.description;
                        if (!localProduct.minStock && item.minStock) updates.minStock = item.minStock;
                        if (!localProduct.maxStock && item.maxStock) updates.maxStock = item.maxStock;
                        if (variant.expiryDate) updates.expiryDate = variant.expiryDate;
                        if (variant.batchNumber) updates.batchNumber = variant.batchNumber;

                        const currentBarcodes = Array.isArray(localProduct.barcodes) 
                            ? [...localProduct.barcodes] 
                            : [];
                        let changed = false;

                        // Check if variant.barcode is new and needs to be registered
                        if (variant.barcode) {
                            const cleanBarcode = variant.barcode.trim();
                            if (!localProduct.barcode) {
                                updates.barcode = cleanBarcode;
                                changed = true;
                            } else if (localProduct.barcode !== cleanBarcode && !currentBarcodes.includes(cleanBarcode)) {
                                currentBarcodes.push(cleanBarcode);
                                changed = true;
                            }
                        }

                        // Check if variant.barcodes has any new aliases
                        if (variant.barcodes && variant.barcodes.length > 0) {
                            const existingBarcode = localProduct.barcode;
                            variant.barcodes.forEach(b => {
                                const cleanB = b.trim();
                                if (cleanB !== existingBarcode && !currentBarcodes.includes(cleanB)) {
                                    currentBarcodes.push(cleanB);
                                    changed = true;
                                }
                            });
                        }

                        if (changed || Object.keys(updates).length > 0) {
                            if (changed) {
                                updates.barcodes = currentBarcodes;
                            }
                            try {
                                const updated = await productsService.update(targetProductId, updates);
                                if (updated) {
                                    setProducts?.(prev => prev.map(p => p.id === targetProductId ? updated : p));
                                    setAllProducts?.(prev => prev.map(p => p.id === targetProductId ? updated : p));
                                }
                            } catch (err) {
                                logger.warn('useReceivingSplit', 'Could not sync product details in DB during receive split', { error: err instanceof Error ? err.message : JSON.stringify(err) });
                            }
                        }
                    } else {
                        // Create product placeholder record in DB
                        const candidateSku = cleanSku(globalProduct?.sku || prodSku || variant.sku || item.sku || '');
                        try {
                            const created = await productsService.create({
                                siteId: targetSiteId,
                                name: variant.productName || item.productName || globalProduct?.name || `Item ${candidateSku}`,
                                sku: candidateSku || variant.sku || item.sku || productSku,
                                barcode: variant.barcode || (item as any).barcode || globalProduct?.barcode || '',
                                barcodes: variant.barcodes || (item as any).barcodes || globalProduct?.barcodes || [],
                                price: item.retailPrice || globalProduct?.price || 0,
                                costPrice: (() => {
                                    const unitsPerOrderUnit = convertToSellableUnits(1, item);
                                    return unitsPerOrderUnit > 0 ? (item.unitCost / unitsPerOrderUnit) : (item.unitCost || globalProduct?.costPrice || 0);
                                })(),
                                category: item.category || globalProduct?.category || 'Uncategorized',
                                status: 'active',
                                stock: 0,
                                location: 'On Order',
                                expiryDate: variant.expiryDate,
                                batchNumber: variant.batchNumber,
                                size: item.size || globalProduct?.size || '',
                                brand: item.brand || globalProduct?.brand || '',
                                unit: item.unit || globalProduct?.unit || 'UNIT',
                                packQuantity: item.packQuantity || globalProduct?.packQuantity || 1,
                                packageType: item.packageType || globalProduct?.packageType || item.customAttributes?.packaging?.packageType || globalProduct?.customAttributes?.packaging?.packageType || '',
                                caseSize: item.caseSize || globalProduct?.caseSize || item.customAttributes?.packaging?.caseSize || globalProduct?.customAttributes?.packaging?.caseSize || undefined,
                                customAttributes: item.customAttributes || globalProduct?.customAttributes || null,
                                description: item.description || globalProduct?.description || '',
                                minStock: item.minStock || globalProduct?.minStock || 0,
                                maxStock: item.maxStock || globalProduct?.maxStock || 0
                            } as any);
                            if (created) {
                                targetProductId = created.id;
                                productSku = created.sku;
                                primaryBarcode = created.barcode || variant.barcode;
                                setProducts?.(prev => [created, ...prev]);
                                setAllProducts?.(prev => [created, ...prev]);
                            }
                        } catch (err) {
                            let recovered = false;
                            try {
                                const existingSku = candidateSku ? await productsService.getBySKU(candidateSku, targetSiteId) : null;
                                const existingBc = !existingSku && incomingBarcodes[0] ? await productsService.getByBarcode(incomingBarcodes[0]) : null;
                                const existingInDb: Product | null = existingSku || (Array.isArray(existingBc) ? existingBc[0] : existingBc);
                                if (existingInDb) {
                                    recovered = true;
                                    targetProductId = existingInDb.id;
                                    productSku = existingInDb.sku;
                                    primaryBarcode = existingInDb.barcode || variant.barcode;
                                }
                            } catch (e) {
                                // ignore
                            }
                            if (!recovered) {
                                logger.error('useReceivingSplit', 'Failed to create placeholder product in receivePOSplit', err as Error);
                                throw err;
                            }
                        }
                    }
                }

                const smartSuggestedLocation = await resolveSmartPutawayLocation(
                    existingProduct,
                    item.category,
                    po.siteId || activeSite?.id || ''
                );

                const newJob: Omit<WMSJob, 'id'> = {
                    siteId: po.siteId || activeSite?.id || '',
                    site_id: po.siteId || activeSite?.id || '',
                    type: 'PUTAWAY',
                    priority: 'Normal',
                    status: 'Pending',
                    assignedTo: undefined,
                    location: 'Receiving Dock',
                    items: 1,
                    orderRef: po.id,
                    createdBy: actionUser?.name || 'System',
                    lineItems: [{
                        productId: targetProductId,
                        name: variant.productName || item.productName,
                        sku: productSku,
                        expectedQty: variant.quantity,
                        pickedQty: 0,
                        status: 'Pending',
                        // Advanced fields
                        barcode: primaryBarcode,
                        expiryDate: variant.expiryDate,
                        batchNumber: variant.batchNumber,
                        condition: (variant.condition || 'Good') as any,
                        suggestedLocation: smartSuggestedLocation || undefined,
                        // Pass pricing data for labels and inventory creation
                        cost: item.unitCost,
                        retailPrice: item.retailPrice,
                        // Pass PO attributes so putaway can create a complete Product record
                        unit: item.unit,
                        size: item.size,
                        brand: item.brand,
                        packQuantity: item.packQuantity,
                        category: item.category,
                        customAttributes: item.customAttributes,
                        description: item.description,
                        minStock: item.minStock,
                        maxStock: item.maxStock
                    }]
                };

                const createdJob = await wmsJobsService.create(newJob as any);
                return createdJob;
            });

            const newJobs = await Promise.all(jobPromises);

            // 1. Calculate updated lineItems with receivedQty
            const updatedLineItems = (po.lineItems || []).map((li: any, idx: number) => {
                if (idx === itemIndex) {
                    const prevQty = li.receivedQty || 0;
                    return {
                        ...li,
                        receivedQty: prevQty + newSplitTotal
                    };
                }
                return li;
            });

            // 2. Check if all items across this PO are now fully received
            const isAllReceived = updatedLineItems.every((li: any) => {
                const targetSellable = convertToSellableUnits(li.quantity, li);
                return (li.receivedQty || 0) >= targetSellable;
            });
            // Keep PO in 'Approved' status so manager can authenticate and finalize manifest in ReceiveReviewModal
            const newPOStatus = po.status === 'Approved' ? 'Approved' : (isAllReceived ? 'Received' : po.status);

            // 3. Persist updated lineItems and status to DB
            try {
                await purchaseOrdersService.update(poId, {
                    lineItems: updatedLineItems,
                    status: newPOStatus as any,
                    receivedBy: actionUser?.name || (po as any).receivedBy
                });
            } catch (err) {
                // Roll back created jobs so the PO and jobs never diverge (prevents double receive)
                await Promise.all(newJobs.map(j => j?.id ? wmsJobsService.delete(j.id).catch(() => null) : null));
                logger.error('useReceivingSplit', 'PO sync failed; rolled back putaway jobs', err as Error);
                throw new Error('Receive could not be saved. Nothing was recorded — please retry.');
            }

            // 4. If matching WMS RECEIVE job exists, update its status
            const matchingReceiveJobs = jobs.filter(j => 
                j.type === 'RECEIVE' && 
                (j.orderRef === poId || (po.poNumber && j.jobNumber === po.poNumber) || (po.po_number && j.jobNumber === po.po_number))
            );
            if (matchingReceiveJobs.length > 0) {
                for (const rj of matchingReceiveJobs) {
                    const rjUpdatedLineItems = (rj.lineItems || []).map((rli: any) => {
                        const matchedPOItem = updatedLineItems.find((uli: any) => 
                            uli.productId === rli.productId || (uli.sku && clean(uli.sku) === clean(rli.sku))
                        );
                        const targetQty = convertToSellableUnits(rli.expectedQty || 0, rli);
                        return {
                            ...rli,
                            receivedQty: matchedPOItem?.receivedQty || rli.receivedQty || 0,
                            status: ((matchedPOItem?.receivedQty || 0) >= targetQty) ? 'Completed' : rli.status
                        };
                    });
                    const receiveJobStatus = isAllReceived ? 'Completed' : 'In-Progress';
                    try {
                        await wmsJobsService.update(rj.id, {
                            status: receiveJobStatus,
                            lineItems: rjUpdatedLineItems,
                            completedBy: isAllReceived ? (actionUser?.name || 'System') : undefined,
                            completedAt: isAllReceived ? new Date().toISOString() : undefined
                        });
                    } catch (e) {
                        logger.error('useReceivingSplit', 'updateReceiveJobs', e);
                    }
                }
            }

            // 5. Update local state for jobs and orders
            setJobs(prev => {
                const updated = prev.map(j => {
                    if (j.type === 'RECEIVE' && (j.orderRef === poId || (po.poNumber && j.jobNumber === po.poNumber) || (po.po_number && j.jobNumber === po.po_number))) {
                        return {
                            ...j,
                            status: isAllReceived ? ('Completed' as const) : ('In-Progress' as const),
                            completedBy: isAllReceived ? (actionUser?.name || 'System') : j.completedBy,
                            completedAt: isAllReceived ? new Date().toISOString() : j.completedAt
                        };
                    }
                    return j;
                });
                return [...updated, ...newJobs];
            });

            addNotification('success', `Created ${newJobs.length} split putaway jobs`);

            try {
                await systemLogsService.create({
                    action: 'PO_SPLIT_RECEIVE_CONFIRMED',
                    module: 'Fulfillment',
                    user_name: actionUser?.name || 'Receiver',
                    site_id: po.siteId || activeSite?.id,
                    country_code: activeSite?.country || 'ET',
                    entity_type: 'purchase_order',
                    entity_id: poId,
                    details: {
                        poNumber: po.poNumber,
                        itemId,
                        splitVariantsCount: variants.length,
                        totalQuantityReceived: newSplitTotal,
                        receivedBy: actionUser?.name,
                    },
                });
            } catch (logErr) {
                logger.warn('useReceivingSplit', 'Non-blocking audit log failure:', { error: logErr instanceof Error ? logErr.message : String(logErr) });
            }

            // Refresh PO details in state
            const updatedPO = await purchaseOrdersService.getById(poId).catch(() => null);
            if (updatedPO) {
                setOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
            } else {
                setOrders(prev => prev.map(o => o.id === poId ? { ...o, lineItems: updatedLineItems, status: newPOStatus as any } : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? { ...o, lineItems: updatedLineItems, status: newPOStatus as any } : o));
            }
        } catch (e: any) {
            logger.error('useReceivingSplit', 'caught error', e as Error);
            addNotification('alert', e.message || "Failed to split receive");
            throw e;
        }
    }, [orders, allOrders, jobs, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification, products, setProducts, setAllProducts, settings]);

    return { receivePOSplit };
};
