import { receivingTransactionService } from '../../services/receiving-transaction.service';
import { loadReceivingPOItem } from '../../utils/receivingPOItem';
import { hasValidReceivingCounts } from '../../utils/receivingCountValidation';
import { useCallback, useRef } from 'react';
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
import { mergeCustomAttributes, extractProductAttributesFromPOItem } from '../../utils/productAttributes';
import { syncProductAliases } from '../../services/products/product-master.service';

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

    const receiptLock = useRef(false);
    const retry=useRef<{signature:string;id:string}|null>(null);
    const receivePOSplit = useCallback(async (
        poId: string,
        itemId: string,
        variants: Array<{ sku: string; skuType: 'existing' | 'new'; productId?: string; productName?: string; quantity: number; barcode?: string; barcodes?: string[]; expiryDate?: string; batchNumber?: string; condition?: string; }>,
        locationId?: string,
        actionUser?: { name: string; email: string }
    ) => {
        if (receiptLock.current) throw new Error('A receipt is already being saved.');
        receiptLock.current = true;
        try {
            if (!hasValidReceivingCounts(variants)) throw new Error('Enter a positive physical count for every split.');
            const { po, itemIndex, item } = await loadReceivingPOItem(poId, itemId, activeSite?.id, activeSite?.country);
            const poAttrs = extractProductAttributesFromPOItem(item);
            const signature=JSON.stringify([poId,itemId,variants,locationId]);
            if(retry.current?.signature!==signature)retry.current={signature,id:crypto.randomUUID()};

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
            totalAlreadyReceived = Math.max(totalAlreadyReceived, item.receivedQty || 0);

            const newSplitTotal = variants.reduce((sum, v) => sum + v.quantity, 0);
            const allowed = maxReceivable(expectedSellable, policy.overReceiveTolerancePct);

            if (totalAlreadyReceived + newSplitTotal > allowed) {
                throw new Error(buildOverReceiveMessage(policy.blind, {
                    received: totalAlreadyReceived, expected: expectedSellable, attempted: newSplitTotal, allowed
                }));
            }

            const jobPromises = variants.map(async (variant, index) => {
                let targetProductId = variant.productId || itemId;
                let productSku = variant.sku;
                let primaryBarcode = variant.barcode;
                let existingProduct: Product | undefined;

                // 1. Handle New Product Creation
                if (variant.skuType === 'new') {
                    try {
                        let newProductCheck = allProducts.find(p => p.sku === variant.sku && (p.siteId || p.site_id) === po.siteId);
                        if (!newProductCheck && (po.siteId || activeSite?.id)) {
                            try {
                                newProductCheck = (await productsService.getBySKU(variant.sku, po.siteId || activeSite?.id)) || undefined;
                            } catch { }
                        }
                        if (newProductCheck) {
                            targetProductId = newProductCheck.id;
                        } else {
                            const created = await productsService.createReceivingPlaceholder({
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
                                category: poAttrs.category || 'Uncategorized',
                                status: 'active',
                                stock: 0,
                                location: 'On Order',
                                image: poAttrs.image || '',
                                size: poAttrs.size || '',
                                brand: poAttrs.brand || '',
                                unit: poAttrs.unit || 'UNIT',
                                packQuantity: poAttrs.packQuantity || 1,
                                packageType: poAttrs.packageType || '',
                                caseSize: poAttrs.caseSize,
                                customAttributes: poAttrs.customAttributes || null,
                                description: poAttrs.description || '',
                                minStock: poAttrs.minStock || 0,
                                maxStock: poAttrs.maxStock || 0
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
                        
                        // Sync PO line item details if they are missing or updated
                        if (!localProduct.size && poAttrs.size) updates.size = poAttrs.size;
                        if (!localProduct.brand && poAttrs.brand) updates.brand = poAttrs.brand;
                        if (!localProduct.unit && poAttrs.unit) updates.unit = poAttrs.unit;
                        if (!localProduct.category && poAttrs.category) updates.category = poAttrs.category;
                        if (!localProduct.image && poAttrs.image) updates.image = poAttrs.image;
                        if ((!localProduct.packQuantity || localProduct.packQuantity === 1) && poAttrs.packQuantity > 1) updates.packQuantity = poAttrs.packQuantity;
                        if (!localProduct.packageType && poAttrs.packageType) updates.packageType = poAttrs.packageType;
                        if (!localProduct.caseSize && poAttrs.caseSize) updates.caseSize = poAttrs.caseSize;
                        if (!localProduct.description && poAttrs.description) updates.description = poAttrs.description;
                        if (!localProduct.minStock && poAttrs.minStock) updates.minStock = poAttrs.minStock;
                        if (!localProduct.maxStock && poAttrs.maxStock) updates.maxStock = poAttrs.maxStock;
                        if (poAttrs.customAttributes) {
                            const mergedAttrs = mergeCustomAttributes(localProduct.customAttributes, poAttrs.customAttributes);
                            if (JSON.stringify(mergedAttrs) !== JSON.stringify(localProduct.customAttributes)) updates.customAttributes = mergedAttrs;
                        }
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
                        // Receipt lot identity belongs on the new putaway line, never on existing stock.

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
                                const rSku = cleanSku(prodSku || variant.sku || item.sku || '');
                                if (rSku) syncProductAliases(rSku, targetSiteId, currentBarcodes).catch(() => {});
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
                            const created = await productsService.createReceivingPlaceholder({
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
                                category: poAttrs.category || globalProduct?.category || 'Uncategorized',
                                status: 'active',
                                stock: 0,
                                location: 'On Order',
                                image: poAttrs.image || globalProduct?.image || '',
                                expiryDate: variant.expiryDate,
                                batchNumber: variant.batchNumber,
                                size: poAttrs.size || globalProduct?.size || '',
                                brand: poAttrs.brand || globalProduct?.brand || '',
                                unit: poAttrs.unit || globalProduct?.unit || 'UNIT',
                                packQuantity: poAttrs.packQuantity || globalProduct?.packQuantity || 1,
                                packageType: poAttrs.packageType || globalProduct?.packageType || '',
                                caseSize: poAttrs.caseSize || globalProduct?.caseSize,
                                customAttributes: mergeCustomAttributes(globalProduct?.customAttributes, poAttrs.customAttributes),
                                description: poAttrs.description || globalProduct?.description || '',
                                minStock: poAttrs.minStock || globalProduct?.minStock || 0,
                                maxStock: poAttrs.maxStock || globalProduct?.maxStock || 0
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

                const targetCountry = po.countryCode || po.country_code || (po.currency === 'KSh' || po.currency === 'KES' ? 'KE' : undefined) || activeSite?.country || settings?.country || 'ET';
                const newJob: Omit<WMSJob, 'id'> = {
                    countryCode: targetCountry,
                    country_code: targetCountry,
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
                        // Pass full PO attributes so putaway can create a complete Product record
                        unit: poAttrs.unit || item.unit,
                        size: poAttrs.size,
                        brand: poAttrs.brand,
                        image: poAttrs.image,
                        packQuantity: poAttrs.packQuantity,
                        packageType: poAttrs.packageType,
                        caseSize: poAttrs.caseSize,
                        category: poAttrs.category,
                        customAttributes: poAttrs.customAttributes,
                        description: poAttrs.description,
                        minStock: poAttrs.minStock,
                        maxStock: poAttrs.maxStock
                    }]
                };

                return newJob;
            });

            const drafts = await Promise.all(jobPromises);
            const newJobs=await receivingTransactionService.save(retry.current!.id,poId,item.id!,item.receivedQty||0,drafts);
            const updatedLineItems=(po.lineItems||[]).map((li,index)=>index===itemIndex ? {...li,receivedQty:(li.receivedQty||0)+newSplitTotal}:li);
            const newPOStatus=po.status;
            // Manifest completion remains the explicit supervised receiving action.
            const isAllReceived=false;
            // 5. Update local state for jobs and orders
            setJobs(prev => {
                const updated = prev;
                // Realtime/refetch may already have delivered these jobs; never list a job twice
                const createdIds = new Set(newJobs.map(j => j?.id).filter(Boolean));
                return [...updated.filter(j => !createdIds.has(j.id)), ...newJobs];
            });

            retry.current=null;

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
        } finally { receiptLock.current = false; }
    }, [orders, allOrders, jobs, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification, products, setProducts, setAllProducts, settings]);

    return { receivePOSplit };
};
