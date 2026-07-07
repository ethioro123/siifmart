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

                // Get product details (check allProducts first)
                let existingProduct = allProducts.find(p => p.id === targetProductId || p.sku === productSku);
                if (!existingProduct) {
                    existingProduct = products.find(p => p.id === targetProductId || p.sku === productSku);
                }

                if (existingProduct) {
                    productSku = existingProduct.sku; // Use canonical SKU
                    targetProductId = existingProduct.id;
                    
                    // Sync PO line item details if they are missing
                    const updates: any = {};
                    if (!existingProduct.size && lineItem.size) updates.size = lineItem.size;
                    if (!existingProduct.brand && lineItem.brand) updates.brand = lineItem.brand;
                    if (!existingProduct.unit && lineItem.unit) updates.unit = lineItem.unit;
                    if (!existingProduct.category && lineItem.category) updates.category = lineItem.category;
                    if ((!existingProduct.price || existingProduct.price === 0) && lineItem.retailPrice) updates.price = lineItem.retailPrice;
                    if ((!existingProduct.costPrice || existingProduct.costPrice === 0) && lineItem.unitCost) updates.costPrice = lineItem.unitCost;
                    if (!existingProduct.customAttributes && lineItem.customAttributes) updates.customAttributes = lineItem.customAttributes;
                    if (!existingProduct.description && lineItem.description) updates.description = lineItem.description;
                    if (!existingProduct.minStock && lineItem.minStock) updates.minStock = lineItem.minStock;
                    if (!existingProduct.maxStock && lineItem.maxStock) updates.maxStock = lineItem.maxStock;

                    if (Object.keys(updates).length > 0) {
                        const updated = await productsService.update(existingProduct.id, updates);
                        if (updated) {
                            setProducts?.(prev => prev.map(p => p.id === existingProduct.id ? updated : p));
                            setAllProducts?.(prev => prev.map(p => p.id === existingProduct.id ? updated : p));
                        }
                    }
                } else {
                    // Create product placeholder record in DB
                    try {
                        const created = await productsService.create({
                            siteId: targetSiteId || activeSite?.id || '',
                            name: productName || lineItem.productName || `Item ${productSku}`,
                            sku: productSku || lineItem.sku,
                            barcode: (lineItem as any).barcode || '',
                            barcodes: (lineItem as any).barcodes || [],
                            price: lineItem.retailPrice || 0,
                            costPrice: lineItem.unitCost || 0,
                            category: lineItem.category || 'Uncategorized',
                            status: 'active',
                            stock: 0,
                            location: 'On Order',
                            size: lineItem.size || '',
                            brand: lineItem.brand || '',
                            unit: lineItem.unit || 'UNIT',
                            packQuantity: lineItem.packQuantity || 1,
                            customAttributes: lineItem.customAttributes || null,
                            description: lineItem.description || '',
                            minStock: lineItem.minStock || 0,
                            maxStock: lineItem.maxStock || 0
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
                return received >= item.quantity;
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
