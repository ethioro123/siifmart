import { useCallback } from 'react';
import { PurchaseOrder, WMSJob, Product } from '../../types';
import {
    productsService,
    wmsJobsService,
    purchaseOrdersService
} from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { convertToSellableUnits } from './useReceiving';

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
}

export const useReceivingSplit = (deps: UseReceivingSplitDeps) => {
    const {
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification,
        setProducts, setAllProducts
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
            const existingPutawayJobs = jobs.filter(j => j.orderRef === poId && j.type === 'PUTAWAY');
            let totalAlreadyReceived = 0;
            existingPutawayJobs.forEach(j => {
                j.lineItems.forEach((ji: any) => {
                    if (ji.productId === itemId || ji.sku === item.sku) {
                        totalAlreadyReceived += (ji.expectedQty || 0);
                    }
                });
            });

            const newSplitTotal = variants.reduce((sum, v) => sum + v.quantity, 0);

            if (totalAlreadyReceived + newSplitTotal > item.quantity) {
                const remaining = item.quantity - totalAlreadyReceived;
                if (remaining <= 0) {
                    addNotification('alert', `Item already fully received! Cannot add more.`);
                    return;
                }
                addNotification('alert', `Cannot receive ${newSplitTotal}. Only ${remaining} remaining.`);
                return;
            }

            const jobPromises = variants.map(async (variant, index) => {
                let targetProductId = variant.productId || itemId;
                let productSku = variant.sku;
                let primaryBarcode = variant.barcode;

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
                                costPrice: item.unitCost || 0,
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

                    let existingProduct = allProducts.find(p => 
                        (prodId && p.id === prodId) || 
                        (prodSku && p.sku === prodSku)
                    );
                    if (!existingProduct && products) {
                        existingProduct = products.find(p => 
                            (prodId && p.id === prodId) || 
                            (prodSku && p.sku === prodSku)
                        );
                    }
                    if (!existingProduct) {
                        // Let's try fetching it from DB to be absolutely sure!
                        try {
                            if (prodId && prodId.length === 36 && !prodId.startsWith('variant-')) { // Looks like a UUID
                                existingProduct = await productsService.getById(prodId);
                            }
                        } catch (e) {
                            logger.warn('useReceivingSplit', 'Could not fetch product by ID from DB in receivePOSplit');
                        }
                        if (!existingProduct && prodSku) {
                            try {
                                existingProduct = await productsService.getBySKU(prodSku) || undefined;
                            } catch (e) {
                                logger.warn('useReceivingSplit', 'Could not fetch product by SKU from DB in receivePOSplit');
                            }
                        }
                    }

                    if (existingProduct) {
                        targetProductId = existingProduct.id;
                        productSku = existingProduct.sku;

                        const updates: any = {};
                        
                        // Sync PO line item details if they are missing
                        if (!existingProduct.size && item.size) updates.size = item.size;
                        if (!existingProduct.brand && item.brand) updates.brand = item.brand;
                        if (!existingProduct.unit && item.unit) updates.unit = item.unit;
                        if (!existingProduct.category && item.category) updates.category = item.category;
                        if ((!existingProduct.price || existingProduct.price === 0) && item.retailPrice) updates.price = item.retailPrice;
                        if ((!existingProduct.costPrice || existingProduct.costPrice === 0) && item.unitCost) updates.costPrice = item.unitCost;
                        if (!existingProduct.customAttributes && item.customAttributes) updates.customAttributes = item.customAttributes;
                        if (!existingProduct.description && item.description) updates.description = item.description;
                        if (!existingProduct.minStock && item.minStock) updates.minStock = item.minStock;
                        if (!existingProduct.maxStock && item.maxStock) updates.maxStock = item.maxStock;

                        const currentBarcodes = Array.isArray(existingProduct.barcodes) 
                            ? [...existingProduct.barcodes] 
                            : [];
                        let changed = false;

                        // Check if variant.barcode is new and needs to be registered
                        if (variant.barcode) {
                            const cleanBarcode = variant.barcode.trim();
                            if (!existingProduct.barcode) {
                                updates.barcode = cleanBarcode;
                                changed = true;
                            } else if (existingProduct.barcode !== cleanBarcode && !currentBarcodes.includes(cleanBarcode)) {
                                currentBarcodes.push(cleanBarcode);
                                changed = true;
                            }
                        }

                        // Check if variant.barcodes has any new aliases
                        if (variant.barcodes && variant.barcodes.length > 0) {
                            variant.barcodes.forEach(b => {
                                const cleanB = b.trim();
                                if (cleanB !== existingProduct.barcode && !currentBarcodes.includes(cleanB)) {
                                    currentBarcodes.push(cleanB);
                                    changed = true;
                                }
                            });
                        }

                        if (changed || Object.keys(updates).length > 0) {
                            if (changed) {
                                updates.barcodes = currentBarcodes;
                            }
                            const updated = await productsService.update(existingProduct.id, updates);
                            if (updated) {
                                // Immediately update local states to prevent state desync
                                setProducts?.(prev => prev.map(p => p.id === existingProduct.id ? updated : p));
                                setAllProducts?.(prev => prev.map(p => p.id === existingProduct.id ? updated : p));
                            }
                        }
                    } else {
                        // Create product placeholder record in DB
                        try {
                            const created = await productsService.create({
                                siteId: po.siteId || activeSite?.id || '',
                                name: variant.productName || item.productName || `Item ${variant.sku || productSku}`,
                                sku: variant.sku || item.sku || productSku,
                                barcode: variant.barcode || (item as any).barcode || '',
                                barcodes: variant.barcodes || (item as any).barcodes || [],
                                price: item.retailPrice || 0,
                                costPrice: item.unitCost || 0,
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
                                productSku = created.sku;
                                primaryBarcode = created.barcode || variant.barcode;
                                setProducts?.(prev => [created, ...prev]);
                                setAllProducts?.(prev => [created, ...prev]);
                            }
                        } catch (err) {
                            logger.error('useReceivingSplit', 'Failed to create placeholder product in receivePOSplit', err as Error);
                            throw err;
                        }
                    }
                }

                const newJob: Omit<WMSJob, 'id'> = {
                    type: 'PUTAWAY',
                    priority: 'Normal',
                    status: 'Pending',
                    assignedTo: undefined,
                    location: locationId || 'Receiving Dock',
                    items: 1,
                    siteId: po.siteId || activeSite?.id || '',
                    orderRef: po.id,
                    createdBy: actionUser?.name || 'System',
                    lineItems: [{
                        productId: targetProductId,
                        name: variant.productName || item.productName,
                        sku: productSku,
                        expectedQty: convertToSellableUnits(variant.quantity, item),
                        pickedQty: 0,
                        status: 'Pending',
                        // Advanced fields
                        barcode: primaryBarcode,
                        batchNumber: variant.batchNumber,
                        condition: (variant.condition || 'Good') as any,
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
            setJobs(prev => [...prev, ...newJobs]);

            addNotification('success', `Created ${newJobs.length} split putaway jobs`);

            // Refresh PO details
            const updatedPO = await purchaseOrdersService.getById(poId);
            if (updatedPO) {
                setOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
            }
        } catch (e: any) {
            logger.error('useReceivingSplit', 'caught error', e as Error);
            addNotification('alert', e.message || "Failed to split receive");
            throw e;
        }
    }, [orders, allOrders, jobs, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification, products, setProducts, setAllProducts]);

    return { receivePOSplit };
};
