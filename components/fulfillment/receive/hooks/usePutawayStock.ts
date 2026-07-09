import { productsService, stockMovementsService } from '../../../../services/supabase.service';
import { useStore } from '../../../../contexts/CentralStore';
import { useData } from '../../../../contexts/DataContext';
import { logger } from '../../../../utils/logger';
import { convertToSellableUnits } from '../../useReceiving';

export function usePutawayStock() {
    const { user } = useStore();
    const { orders, addNotification, refreshData } = useData();

    const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());

    const putawayStock = async (params: { 
        sku: string, 
        location: string, 
        quantity: number, 
        siteId: string, 
        type: 'IN' | 'TRANSFER', 
        expiryDate?: string, 
        batchNumber?: string, 
        sourceProductId?: string, 
        timestamp?: string, 
        size?: string, 
        brand?: string, 
        unit?: string, 
        packQuantity?: number, 
        category?: string, 
        retailPrice?: number, 
        customAttributes?: any, 
        description?: string, 
        minStock?: number, 
        maxStock?: number 
    }) => {
        try {
            const ts = params.timestamp || new Date().toISOString();
            logger.debug('Fulfillment', '📦 putawayStock called:');

            // 1. Check if product exists at destination
            let destProduct = await productsService.getBySkuAndLocation(params.sku, params.location, params.siteId);
            let destProductId = destProduct?.id;

            if (destProduct) {
                logger.debug('Fulfillment', `✅ Found existing product at ${params.location} (ID: ${destProduct.id}). Updating stock...`);
                // Update existing
                await productsService.adjustStock(destProduct.id, params.quantity, 'IN', `Putaway to ${params.location}`, user?.name || 'System', params.expiryDate, params.batchNumber, ts);
            } else {
                logger.debug('Fulfillment', `ℹ️ No product found at ${params.location}. Creating or recycling record...`);
                // Create new
                // Need source details. Use sourceProductId if available, or fetch by SKU.
                let sourceProduct: any;
                if (params.sourceProductId) {
                    try { sourceProduct = await productsService.getById(params.sourceProductId); } catch (e) { }
                }

                if (!sourceProduct) {
                    // Fetch master record or any record for this SKU to copy details
                    sourceProduct = await productsService.getBySKU(params.sku, params.siteId);
                }

                // [FIX] Handle custom products that only exist as PO Items
                if (!sourceProduct && params.sourceProductId) {
                    const poItem = orders?.flatMap(o => o.lineItems || []).find(i => i.id === params.sourceProductId || i.productId === params.sourceProductId);
                    if (poItem) {
                        logger.debug('Fulfillment', `ℹ️ Found PO Item matching ID. Creating initial product definition for ${params.sku}`);
                        sourceProduct = {
                            name: poItem.productName || params.sku,
                            sku: poItem.sku || params.sku,
                            price: poItem.retailPrice || 0,
                            costPrice: (() => {
                                const unitsPerOrderUnit = convertToSellableUnits(1, poItem);
                                return unitsPerOrderUnit > 0 ? (poItem.unitCost / unitsPerOrderUnit) : (poItem.unitCost || 0);
                            })(),
                            category: poItem.category || 'Uncategorized',
                            brand: poItem.brand || '',
                            size: poItem.size || '',
                            unit: poItem.unit || 'UNIT',
                            packQuantity: poItem.packQuantity || 1,
                            description: poItem.description || '',
                            minStock: poItem.minStock || 0,
                            maxStock: poItem.maxStock || 0,
                            customAttributes: poItem.customAttributes || null,
                            stock: 0,
                            location: 'On Order', // Will be overridden to actual location below
                            status: 'active',
                            siteId: params.siteId,
                            approvalStatus: 'approved'
                        };
                    }
                }

                if (!sourceProduct) {
                    throw new Error(`Product definition for SKU ${params.sku} not found`);
                }

                // [FIX] Check if source is a "ghost" placeholder (On Order/Empty & 0 Stock)
                // If so, MOVE/RECYCLE it instead of creating a duplicate.
                const isPlaceholder = (sourceProduct.location === 'On Order' || !sourceProduct.location) && sourceProduct.stock === 0;

                if (isPlaceholder && params.sourceProductId === sourceProduct.id) {
                    logger.debug('Fulfillment', `♻️ Recycling placeholder product ${sourceProduct.id} from '${sourceProduct.location}' to '${params.location}'`);

                    // Update the existing placeholder to be the real record
                    const updated = await productsService.update(sourceProduct.id, {
                        location: params.location,
                        stock: params.quantity,
                        expiryDate: params.expiryDate || sourceProduct.expiryDate,
                        batchNumber: params.batchNumber || sourceProduct.batchNumber,
                        // Carry over PO attributes from params (they travel from WMS job line item)
                        size: params.size || sourceProduct.size,
                        brand: params.brand || sourceProduct.brand,
                        unit: params.unit || sourceProduct.unit,
                        packQuantity: params.packQuantity || sourceProduct.packQuantity,
                        category: params.category || sourceProduct.category,
                        price: params.retailPrice || sourceProduct.price,
                        customAttributes: params.customAttributes || sourceProduct.customAttributes,
                        description: params.description || sourceProduct.description,
                        minStock: params.minStock || sourceProduct.minStock,
                        maxStock: params.maxStock || sourceProduct.maxStock,
                        // Ensure status is valid
                        status: 'active'
                    });
                    destProductId = updated.id;

                    // [FIX] Log Movement for Recycled Record
                    await stockMovementsService.create({
                        site_id: params.siteId,
                        product_id: updated.id,
                        product_name: updated.name,
                        type: 'IN',
                        quantity: params.quantity,
                        movement_date: ts,
                        performed_by: user?.name || 'System',
                        reason: `Putaway to ${params.location} (Recycled)`
                    } as any);

                } else {
                    // Standard Logic: Create clone for new location

                    // [FIX] Try to fetch PO Item explicitly to carry over deep attributes if they exist
                    let poAttribs = {};
                    if (params.sourceProductId) {
                        const poItem = orders?.flatMap(o => o.lineItems || []).find(i => i.id === params.sourceProductId || i.productId === params.sourceProductId);
                        if (poItem) {
                            poAttribs = {
                                brand: poItem.brand || sourceProduct.brand,
                                size: poItem.size || sourceProduct.size,
                                unit: poItem.unit || sourceProduct.unit,
                                packQuantity: poItem.packQuantity || sourceProduct.packQuantity,
                                description: poItem.description || sourceProduct.description,
                                minStock: poItem.minStock || sourceProduct.minStock,
                                maxStock: poItem.maxStock || sourceProduct.maxStock,
                                customAttributes: poItem.customAttributes || sourceProduct.customAttributes
                            };
                        }
                    }

                    const newProduct = {
                        ...sourceProduct,
                        ...poAttribs,
                        location: params.location,
                        stock: params.quantity,
                        status: 'active', // Ensure product shows in inventory
                        siteId: params.siteId, // [FIX] Override siteId to match destination
                        // Ensure we don't copy ID or other specific fields
                        id: undefined,
                        created_at: ts,
                        updated_at: undefined,
                        createdAt: ts,
                        updatedAt: undefined,
                        // Keep expiry/batch if provided, else use source
                        expiryDate: params.expiryDate || sourceProduct.expiryDate,
                        batchNumber: params.batchNumber || sourceProduct.batchNumber,
                        // Reset approval for new location? Or keep? Usually keep if moving approved stock.
                        approvalStatus: 'approved',
                    };

                    // Remove ID from object explicitly to avoid Supabase errors if spread didn't work as expected with types
                    delete (newProduct as any).id;

                    const newProductPayload = newProduct; // Rename for clarity in closure

                    try {
                        const created = await productsService.create(newProductPayload);
                        destProductId = created.id;
                        logger.debug('Fulfillment', `✅ Created new product record at ${params.location}`);

                        // [FIX] Log Movement for New Location Record
                        await stockMovementsService.create({
                            site_id: params.siteId,
                            product_id: created.id,
                            product_name: created.name,
                            type: 'IN',
                            quantity: params.quantity,
                            movement_date: ts,
                            performed_by: user?.name || 'System',
                            reason: `Putaway to ${params.location} (New Location)`
                        } as any);

                    } catch (err: any) {
                        // [SAFETY] Handle Unique Constraint Violation (Race condition or hidden record)
                        if (err.code === '23505') {
                            logger.warn('Fulfillment', `⚠️ Product creation collision (already exists) at ${params.location}. Recovering...`);
                            // Fetch the existing record that caused the collision
                            const existing = await productsService.getBySkuAndLocation(params.sku, params.location, params.siteId);
                            if (existing) {
                                logger.debug('Fulfillment', `🔄 Recovered: Found existing product ${existing.id}. Updating stock...`);
                                destProductId = existing.id;
                                // Force status to active and update stock
                                await productsService.update(existing.id, { status: 'active', updated_at: ts } as any);
                                await productsService.adjustStock(existing.id, params.quantity, 'IN', `Putaway to ${params.location} (Recovered)`, user?.name || 'System', params.expiryDate, params.batchNumber, ts);
                            } else {
                                // Should not happen if constraint fired, but just in case re-throw
                                throw err;
                            }
                        } else {
                            throw err;
                        }
                    }
                }
            }

            // [CLEANUP] Evict old tenants: If we put a new product here, ensure old 0-stock products don't claim this location
            try {
                await productsService.clearLocationForEmptyProducts(params.location, params.siteId, params.sku);
                logger.debug('Fulfillment', `🧹 Location ${params.location} cleanup complete (evicted 0-stock ghosts)`);
            } catch (cleanupErr) {
                logger.warn('Fulfillment', '⚠️ Manual cleanup of old location tenants failed (non-critical)');
            }

            addNotification('success', `Stock putaway to ${params.location}`);
            refreshData(); // Refresh to show new location
        } catch (e) {
            logger.error('Fulfillment', '❌ putawayStock failed:', e);
            addNotification('alert', 'Putaway failed');
            throw e;
        }
    };

    return { putawayStock };
}
