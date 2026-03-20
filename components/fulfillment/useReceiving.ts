import { useCallback } from 'react';
import {
    WMSJob, Product, PurchaseOrder, POReceivingInput
} from '../../types';
import {
    wmsJobsService,
    purchaseOrdersService,
    productsService
} from '../../services/supabase.service';

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Converts PO order quantity to sellable units.
 * 
 * Example: Order 100 bags of 10kg walnuts, sell by kg
 *   → 100 × 10 = 1,000 sellable kg
 * 
 * Example: Order 5 cases of Coke (24 bottles per case)
 *   → 5 × 24 = 120 sellable units
 * 
 * For products where size type matches sell unit directly (e.g., both kg),
 * it multiplies orderQty × sizeValue.
 * 
 * For cross-unit conversions (e.g., kg bag sold by gram),
 * it converts through base units.
 */
export const convertToSellableUnits = (orderQty: number, item: any): number => {
    if (!item) return orderQty;

    const attrs = item.customAttributes;
    const sizeValue = parseFloat(item.size || attrs?.packaging?.unitSize || '0');
    const sizeType = (attrs?.physical?.sizeType || '').toLowerCase().trim();
    const sellUnit = (item.unit || '').toUpperCase().trim();
    const packQty = parseInt(attrs?.packaging?.packQty || '0');
    const caseSize = parseInt(attrs?.packaging?.caseSize || '0');

    console.log(`📦 convertToSellableUnits: orderQty=${orderQty}, size=${sizeValue}, sizeType="${sizeType}", sellUnit="${sellUnit}", packQty=${packQty}, caseSize=${caseSize}`);

    // Step 1: Handle pack/case multiplier (for count-based products)
    if (packQty > 1 || caseSize > 1) {
        const effectivePackQty = packQty > 1 ? packQty : 1;
        const effectiveCaseSize = caseSize > 1 ? caseSize : 1;
        if (['UNIT', 'PACK', 'DOZEN'].includes(sellUnit) || !sellUnit) {
            return orderQty * effectiveCaseSize * effectivePackQty;
        }
    }

    // Step 2: Handle size-based conversion (for weight/volume products)
    if (sizeValue > 0 && sizeType) {
        let sizeInBase = sizeValue;
        let sizeCategory = '';
        // Weight
        if (['kg', 'kilogram', 'kilograms', 'kgs'].includes(sizeType)) { sizeInBase = sizeValue * 1000; sizeCategory = 'weight'; }
        else if (['g', 'gram', 'grams', 'gr'].includes(sizeType)) { sizeInBase = sizeValue; sizeCategory = 'weight'; }
        // Volume
        else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt'].includes(sizeType)) { sizeInBase = sizeValue * 1000; sizeCategory = 'volume'; }
        else if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(sizeType)) { sizeInBase = sizeValue; sizeCategory = 'volume'; }

        let sellInBase = 1;
        let sellCategory = '';
        if (sellUnit === 'KG') { sellInBase = 1000; sellCategory = 'weight'; }
        else if (sellUnit === 'G') { sellInBase = 1; sellCategory = 'weight'; }
        else if (sellUnit === 'L') { sellInBase = 1000; sellCategory = 'volume'; }
        else if (sellUnit === 'ML') { sellInBase = 1; sellCategory = 'volume'; }

        if (sizeCategory && sizeCategory === sellCategory) {
            const sellUnitsPerPackage = sizeInBase / sellInBase;
            console.log(`   ✅ Converted: ${orderQty} × ${sellUnitsPerPackage} = ${orderQty * sellUnitsPerPackage} ${sellUnit}`);
            return orderQty * sellUnitsPerPackage;
        }
    }

    return orderQty;
};

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
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useReceiving = (deps: UseReceivingDeps) => {
    const {
        orders, allOrders, jobs, products, allProducts,
        activeSite, setJobs, setOrders, setAllOrders, addNotification
    } = deps;

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

            console.log(`📦 Creating PUTAWAY jobs for ${itemsToProcess.length} items from PO ${po.poNumber}`);

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

                // Get product details
                const existingProduct = products.find(p => p.id === targetProductId);
                if (existingProduct) {
                    productSku = existingProduct.sku; // Use canonical SKU
                    productToUpdate = existingProduct;
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

            // Update PO status
            const updatedPO = await purchaseOrdersService.receive(poId, false);
            if (updatedPO) {
                setOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
            }

            addNotification('success', `Created ${newJobs.length} putaway jobs for PO ${po.poNumber}`);

            return newJobs;
        } catch (error) {
            console.error('Error receiving PO:', error);
            addNotification('alert', 'Failed to receive PO');
            throw error;
        }
    }, [orders, allOrders, products, setJobs, setOrders, setAllOrders, addNotification]);

    // ── receivePOSplit ──────────────────────────────────────────────────────

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
            const itemIndex = po.lineItems?.findIndex(i => i.productId === itemId || i.sku === itemId || i.id === itemId);
            if (itemIndex === undefined || itemIndex === -1) {
                console.error("Item not found in PO:", itemId);
                return;
            }
            const item = po.lineItems![itemIndex];

            // VALIDATION: Prevent over-receiving (helps avoid accidental duplicates)
            const existingPutawayJobs = jobs.filter(j => j.orderRef === poId && j.type === 'PUTAWAY');
            let totalAlreadyReceived = 0;
            existingPutawayJobs.forEach(j => {
                j.lineItems.forEach(ji => {
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
                                siteId: activeSite?.id || '',
                                name: variant.productName || `New Item ${variant.sku}`,
                                sku: variant.sku,
                                barcode: variant.barcode,
                                barcodes: variant.barcodes,
                                price: 0,
                                costPrice: 0,
                                category: 'Uncategorized',
                                status: 'active',
                                stock: 0
                            } as any);
                            if (created) {
                                targetProductId = created.id;
                            }
                        }
                    } catch (err) {
                        console.error("Failed to create new product during receive:", err);
                    }
                }
                // 2. Handle Existing Product - Update Barcodes if needed
                else if (variant.productId) {
                    const existingProduct = allProducts.find(p => p.id === variant.productId);
                    if (existingProduct && variant.barcodes && variant.barcodes.length > 0) {
                        const currentBarcodes = existingProduct.barcodes || [];
                        const newBarcodes = variant.barcodes.filter(b => !currentBarcodes.includes(b) && b !== existingProduct.barcode);

                        if (newBarcodes.length > 0) {
                            const updatedBarcodes = [...currentBarcodes, ...newBarcodes];
                            await productsService.update(variant.productId, { barcodes: updatedBarcodes });
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

            // Refresh PO to check if fully received
            const updatedPO = await purchaseOrdersService.receive(poId, false);
            if (updatedPO) {
                setOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
                setAllOrders(prev => prev.map(o => o.id === poId ? updatedPO : o));
            }
        } catch (e) {
            console.error(e);
            addNotification('alert', "Failed to split receive");
        }
    }, [orders, allOrders, jobs, allProducts, activeSite, setJobs, setOrders, setAllOrders, addNotification]);

    // ── finalizePO ──────────────────────────────────────────────────────────

    const finalizePO = useCallback(async (poId: string) => {
        try {
            const po = orders.find(o => o.id === poId);
            if (!po) throw new Error('PO not found');

            // Calculate if full or partial
            const poJobs = jobs.filter(j => j.orderRef === poId);
            const receivedMap: Record<string, number> = {};
            poJobs.forEach(job => {
                job.lineItems.forEach(item => {
                    if (item.productId) receivedMap[item.productId] = (receivedMap[item.productId] || 0) + item.expectedQty;
                });
            });

            const allReceived = po.lineItems?.every(item => {
                const received = (item.productId ? receivedMap[item.productId] : 0) || 0;
                return received >= item.quantity;
            });

            const status = allReceived ? 'Received' : 'Partial';

            const updated = await purchaseOrdersService.update(poId, { status: status as any });
            setOrders(prev => prev.map(o => o.id === poId ? updated : o));
            setAllOrders(prev => prev.map(o => o.id === poId ? updated : o));

            addNotification('success', `PO #${po.poNumber} finalized as ${status}`);
        } catch (error) {
            console.error('Finalize PO Error:', error);
            addNotification('alert', 'Failed to finalize PO');
            throw error;
        }
    }, [orders, jobs, setOrders, setAllOrders, addNotification]);

    return { receivePO, receivePOSplit, finalizePO };
};
