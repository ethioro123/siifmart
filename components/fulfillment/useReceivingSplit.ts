import { useCallback } from 'react';
import { PurchaseOrder, WMSJob, Product } from '../../types';
import {
    productsService,
    wmsJobsService,
    purchaseOrdersService
} from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { convertToSellableUnits } from './useReceiving';
import { categoryZonesService } from '../../services/category-zones.service';

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

                    // First find local product
                    let localProduct = allProducts.find(p => 
                        ((prodId && p.id === prodId) || (prodSku && p.sku === prodSku)) &&
                        (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                    );
                    
                    if (!localProduct && products) {
                        localProduct = products.find(p => 
                            ((prodId && p.id === prodId) || (prodSku && p.sku === prodSku)) &&
                            (p.siteId === targetSiteId || (p as any).site_id === targetSiteId)
                        );
                    }

                    // Also find global product to use as template
                    let globalProduct = allProducts.find(p => 
                        (prodId && p.id === prodId) || 
                        (prodSku && p.sku === prodSku)
                    );

                    if (!localProduct && !globalProduct) {
                        // Let's try fetching it from DB to be absolutely sure!
                        try {
                            if (prodId && prodId.length === 36 && !prodId.startsWith('variant-')) { // Looks like a UUID
                                globalProduct = await productsService.getById(prodId);
                            }
                        } catch (e) {
                            logger.warn('useReceivingSplit', 'Could not fetch product by ID from DB in receivePOSplit');
                        }
                        if (!globalProduct && prodSku) {
                            try {
                                globalProduct = await productsService.getBySKU(prodSku) || undefined;
                            } catch (e) {
                                logger.warn('useReceivingSplit', 'Could not fetch product by SKU from DB in receivePOSplit');
                            }
                        }
                    }

                    if (localProduct) {
                        targetProductId = localProduct.id;
                        productSku = localProduct.sku;

                        const updates: any = {};
                        
                        // Sync PO line item details if they are missing
                        if (!localProduct.size && item.size) updates.size = item.size;
                        if (!localProduct.brand && item.brand) updates.brand = item.brand;
                        if (!localProduct.unit && item.unit) updates.unit = item.unit;
                        if (!localProduct.category && item.category) updates.category = item.category;
                        if (item.retailPrice && item.retailPrice > 0 && item.retailPrice !== localProduct.price) {
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
                                    // Immediately update local states to prevent state desync
                                    setProducts?.(prev => prev.map(p => p.id === targetProductId ? updated : p));
                                    setAllProducts?.(prev => prev.map(p => p.id === targetProductId ? updated : p));
                                }
                            } catch (err) {
                                logger.warn('useReceivingSplit', 'Could not sync product details in DB during receive split', { error: err instanceof Error ? err.message : JSON.stringify(err) });
                            }
                        }
                    } else {
                        // Create product placeholder record in DB
                        try {
                            const created = await productsService.create({
                                siteId: targetSiteId,
                                name: variant.productName || item.productName || globalProduct?.name || `Item ${variant.sku || productSku}`,
                                sku: variant.sku || item.sku || productSku,
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
                            logger.error('useReceivingSplit', 'Failed to create placeholder product in receivePOSplit', err as Error);
                            throw err;
                        }
                    }
                }

                // SMART ROUTING LOGIC
                let smartSuggestedLocation = '';
                
                // 1. SKU Memory: Check if the product already has a valid location in the system
                if (existingProduct?.location && existingProduct.location !== 'On Order' && existingProduct.location !== 'Receiving Dock') {
                    smartSuggestedLocation = existingProduct.location;
                } else {
                    // 2. Category Routing: Look up default zone for the product's category
                    try {
                        const targetSiteId = po.siteId || activeSite?.id || '';
                        const itemCat = item.category || '';
                        if (targetSiteId && itemCat) {
                            const categoryMappings = await categoryZonesService.getMappings(targetSiteId);
                            const match = categoryMappings.find(m => m.category.toLowerCase() === itemCat.toLowerCase());
                            if (match?.defaultZone) {
                                smartSuggestedLocation = match.defaultZone;
                                logger.info('useReceivingSplit', `🎯 Smart Routing: Category "${itemCat}" mapped to zone "${smartSuggestedLocation}"`);
                            }
                        }
                    } catch (e) {
                        logger.warn('useReceivingSplit', 'Category routing lookup failed (using fallback logic)');
                    }
                }

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
                        expectedQty: convertToSellableUnits(variant.quantity, item),
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
            setJobs(prev => [...prev, ...newJobs]);

            addNotification('success', `Created ${newJobs.length} split putaway jobs`);

            // Refresh PO details
            const updatedPO = await purchaseOrdersService.getById(poId);
            if (updatedPO) {
                setOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
            }

            // Stamp who physically received the goods (distinct from PO approver)
            if (actionUser?.name) {
                try {
                    await purchaseOrdersService.update(poId, { receivedBy: actionUser.name });
                } catch (err) {
                    logger.warn('useReceivingSplit', 'Could not stamp receivedBy on PO', { error: err instanceof Error ? err.message : JSON.stringify(err) });
                }
            }
        } catch (e: any) {
            logger.error('useReceivingSplit', 'caught error', e as Error);
            addNotification('alert', e.message || "Failed to split receive");
            throw e;
        }
    }, [orders, allOrders, jobs, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification, products, setProducts, setAllProducts]);

    return { receivePOSplit };
};
