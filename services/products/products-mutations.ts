import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';
import { stockMovementsService } from '../stock-movements.service';
import { _mapProduct, _calculateStatus } from './products-helpers';
import { handleAutoReplenish } from './products-replenish';

/**
 * Check if a barcode is registered under a different SKU.
 */
export async function checkBarcodeConflicts(sku: string | undefined, barcodes: string[]) {
    if (!sku || barcodes.length === 0) return;

    const cleanBarcodes = barcodes
        .map(b => b ? b.trim() : '')
        .filter(b => b.length > 0);

    if (cleanBarcodes.length === 0) return;

    const orConditions = cleanBarcodes
        .map(b => `barcode.eq.${b},barcodes.cs.{${b}}`)
        .join(',');

    const { data, error } = await supabase
        .from('products')
        .select('sku, name, barcode, barcodes')
        .or(orConditions);

    if (error) {
        console.error('Error checking barcode conflicts:', error);
        throw error;
    }

    if (data && data.length > 0) {
        const normalizedTargetSku = sku.trim().toUpperCase();
        for (const item of data) {
            const itemSku = (item.sku || '').trim().toUpperCase();
            if (itemSku !== normalizedTargetSku) {
                throw new Error(`This barcode is flagged because it is already registered under SKU ${item.sku} (${item.name})`);
            }
        }
    }
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const barcodesToCheck: string[] = [];
    if (product.barcode && product.barcode.trim()) {
        barcodesToCheck.push(product.barcode.trim());
    }
    if (product.barcodes && Array.isArray(product.barcodes)) {
        product.barcodes.forEach(b => {
            if (b && b.trim() && !barcodesToCheck.includes(b.trim())) {
                barcodesToCheck.push(b.trim());
            }
        });
    }

    if (barcodesToCheck.length > 0 && product.sku) {
        await checkBarcodeConflicts(product.sku, barcodesToCheck);
    }

    const dbProduct: any = {
        site_id: product.siteId,
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        is_on_sale: product.isOnSale,
        stock: product.stock,
        status: _calculateStatus(product.stock || 0, product.minStock, product.status),
        location: product.location,
        expiry_date: product.expiryDate,
        batch_number: product.batchNumber,
        shelf_position: product.shelfPosition,
        competitor_price: product.competitorPrice,
        sales_velocity: product.salesVelocity,
        image: product.image,
        barcode: product.barcode,
        barcodes: product.barcodes,
        barcode_type: product.barcodeType,
        approval_status: product.approvalStatus,
        created_by: product.createdBy,
        approved_by: product.approvedBy,
        approved_at: product.approvedAt,
        brand: product.brand,
        size: product.size,
        unit: product.unit,
        pack_quantity: product.packQuantity,
        custom_attributes: product.customAttributes,
        description: product.description,
        min_stock: product.minStock,
        max_stock: product.maxStock,
        product_id: product.productId
    };

    if ((product as any).created_at) {
        dbProduct.created_at = (product as any).created_at;
    } else if ((product as any).createdAt) {
        dbProduct.created_at = (product as any).createdAt;
    }

    const { data, error } = await supabase
        .from('products')
        .insert(dbProduct)
        .select()
        .single();

    if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.warn('⚠️ Schema mismatch detected. Retrying product creation without approval fields...');
            const coreProduct: any = { ...dbProduct };
            delete coreProduct.approval_status;
            delete coreProduct.created_by;
            delete coreProduct.approved_by;
            delete coreProduct.approved_at;
            delete coreProduct.product_id;

            const { data: retryData, error: retryError } = await supabase
                .from('products')
                .insert(coreProduct)
                .select()
                .single();

            if (retryError) throw retryError;
            const mappedProduct = _mapProduct(retryData);
            if (mappedProduct.stock !== undefined) {
                handleAutoReplenish(mappedProduct).catch(err => {
                    console.error('❌ Background Auto-Replenishment Failed:', err);
                });
            }
            return mappedProduct;
        }
        throw error;
    }
    const mappedProduct = _mapProduct(data);
    if (mappedProduct.stock !== undefined) {
        handleAutoReplenish(mappedProduct).catch(err => {
            console.error('❌ Background Auto-Replenishment Failed:', err);
        });
    }
    return mappedProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    const barcodeChanged = updates.barcode !== undefined || updates.barcodes !== undefined;
    if (barcodeChanged) {
        let targetSku = updates.sku;
        let finalBarcode = updates.barcode;
        let finalBarcodes = updates.barcodes || [];

        const { data: existingProduct, error: fetchError } = await supabase
            .from('products')
            .select('sku, barcode, barcodes')
            .eq('id', id)
            .single();

        if (!fetchError && existingProduct) {
            targetSku = targetSku || existingProduct.sku;
            if (updates.barcode === undefined) {
                finalBarcode = existingProduct.barcode;
            }
            if (updates.barcodes === undefined) {
                finalBarcodes = existingProduct.barcodes || [];
            }
        }

        if (targetSku) {
            const barcodesToCheck: string[] = [];
            if (finalBarcode && finalBarcode.trim()) {
                barcodesToCheck.push(finalBarcode.trim());
            }
            if (Array.isArray(finalBarcodes)) {
                finalBarcodes.forEach((b: string) => {
                    if (b && b.trim() && !barcodesToCheck.includes(b.trim())) {
                        barcodesToCheck.push(b.trim());
                    }
                });
            }

            if (barcodesToCheck.length > 0) {
                await checkBarcodeConflicts(targetSku, barcodesToCheck);
            }
        }
    }

    const dbUpdates: any = { ...updates };

    const stockChanged = updates.stock !== undefined;
    const minStockChanged = updates.minStock !== undefined;
    const statusChanged = updates.status !== undefined;

    if (stockChanged || minStockChanged || statusChanged) {
        try {
            const { data: current, error: fetchError } = await supabase
                .from('products')
                .select('stock, min_stock, status')
                .eq('id', id)
                .single();

            if (!fetchError && current) {
                const finalStock = updates.stock !== undefined ? updates.stock : current.stock;
                const finalMinStock = updates.minStock !== undefined ? updates.minStock : current.min_stock;
                const currentStatus = updates.status !== undefined ? updates.status : current.status;

                dbUpdates.status = _calculateStatus(finalStock, finalMinStock, currentStatus);
            }
        } catch (e) {
            console.error('Failed to automatically calculate status for product update:', e);
        }
    }

    const fieldsToRemove = ['id', 'created_at', 'createdAt'];
    fieldsToRemove.forEach(field => delete dbUpdates[field]);

    if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
    if (updates.costPrice !== undefined) { dbUpdates.cost_price = updates.costPrice; delete dbUpdates.costPrice; }
    if (updates.salePrice !== undefined) { dbUpdates.sale_price = updates.salePrice; delete dbUpdates.salePrice; }
    if (updates.isOnSale !== undefined) { dbUpdates.is_on_sale = updates.isOnSale; delete dbUpdates.isOnSale; }
    if (updates.expiryDate !== undefined) { dbUpdates.expiry_date = updates.expiryDate; delete dbUpdates.expiryDate; }
    if (updates.batchNumber !== undefined) { dbUpdates.batch_number = updates.batchNumber; delete dbUpdates.batchNumber; }
    if (updates.shelfPosition !== undefined) { dbUpdates.shelf_position = updates.shelfPosition; delete dbUpdates.shelfPosition; }
    if (updates.competitorPrice !== undefined) { dbUpdates.competitor_price = updates.competitorPrice; delete dbUpdates.competitorPrice; }
    if (updates.salesVelocity !== undefined) { dbUpdates.sales_velocity = updates.salesVelocity; delete dbUpdates.salesVelocity; }
    if (updates.posReceivedAt !== undefined) { dbUpdates.pos_received_at = updates.posReceivedAt; delete dbUpdates.posReceivedAt; }
    if (updates.posReceivedBy !== undefined) { dbUpdates.pos_received_by = updates.posReceivedBy; delete dbUpdates.posReceivedBy; }
    if (updates.approvalStatus !== undefined) { dbUpdates.approval_status = updates.approvalStatus; delete dbUpdates.approvalStatus; }
    if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }
    if (updates.approvedAt !== undefined) { dbUpdates.approved_at = updates.approvedAt; delete dbUpdates.approvedAt; }
    if (updates.rejectedBy !== undefined) { dbUpdates.rejected_by = updates.rejectedBy; delete dbUpdates.rejectedBy; }
    if (updates.rejectedAt !== undefined) { dbUpdates.rejected_at = updates.rejectedAt; delete dbUpdates.rejectedAt; }
    if (updates.rejectionReason !== undefined) { dbUpdates.rejection_reason = updates.rejectionReason; delete dbUpdates.rejectionReason; }
    if (updates.priceUpdatedAt !== undefined) { dbUpdates.price_updated_at = updates.priceUpdatedAt; delete dbUpdates.priceUpdatedAt; }
    if (updates.oldPrice !== undefined) { delete dbUpdates.oldPrice; }
    if (updates.old_price !== undefined) { delete dbUpdates.old_price; }

    if (updates.productId !== undefined) {
        dbUpdates.product_id = updates.productId;
        delete dbUpdates.productId;
    }

    if (updates.packQuantity !== undefined) { dbUpdates.pack_quantity = updates.packQuantity; delete dbUpdates.packQuantity; }
    if (updates.customAttributes !== undefined) { dbUpdates.custom_attributes = updates.customAttributes; delete dbUpdates.customAttributes; }
    if (updates.minStock !== undefined) { dbUpdates.min_stock = updates.minStock; delete dbUpdates.minStock; }
    if (updates.maxStock !== undefined) { dbUpdates.max_stock = updates.maxStock; delete dbUpdates.maxStock; }

    const extraFields = ['minStockLevel', 'maxStockLevel', 'retailPrice', 'zoneId'];
    extraFields.forEach(f => delete dbUpdates[f]);

    if (updates.barcodeType !== undefined) {
        dbUpdates.barcode_type = updates.barcodeType;
        delete dbUpdates.barcodeType;
    }

    if (updates.barcodes !== undefined) {
        dbUpdates.barcodes = updates.barcodes;
    }

    const isPriceUpdate =
        updates.price !== undefined ||
        updates.costPrice !== undefined ||
        updates.salePrice !== undefined ||
        updates.isOnSale !== undefined;

    if (isPriceUpdate) {
        const { data: currentProduct } = await supabase
            .from('products')
            .select('price, cost_price, sale_price, is_on_sale')
            .eq('id', id)
            .single();

        if (currentProduct) {
            const priceChanged = updates.price !== undefined && updates.price !== currentProduct.price;
            const costChanged = updates.costPrice !== undefined && updates.costPrice !== currentProduct.cost_price;
            const salePriceChanged = updates.salePrice !== undefined && updates.salePrice !== currentProduct.sale_price;
            const onSaleChanged = updates.isOnSale !== undefined && updates.isOnSale !== currentProduct.is_on_sale;

            if (priceChanged || costChanged || salePriceChanged || onSaleChanged) {
                dbUpdates.price_updated_at = new Date().toISOString();
                if (priceChanged) {
                    dbUpdates.old_price = currentProduct.price;
                }
            }
        }
    }

    const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.warn('⚠️ Schema mismatch detected. Retrying product update without approval fields...');
            const coreUpdates: any = { ...dbUpdates };
            const fieldsToDelete = [
                'approval_status', 'created_by', 'approved_by', 'approved_at',
                'rejected_by', 'rejected_at', 'rejection_reason', 'price_updated_at',
                'product_id'
            ];
            fieldsToDelete.forEach(f => delete coreUpdates[f]);

            const { data: retryData, error: retryError } = await supabase
                .from('products')
                .update(coreUpdates)
                .eq('id', id)
                .select()
                .single();

            if (retryError) throw retryError;
            const mappedProduct = _mapProduct(retryData);
            if (coreUpdates.stock !== undefined) {
                handleAutoReplenish(mappedProduct).catch(err => {
                    console.error('❌ Background Auto-Replenishment Failed:', err);
                });
            }
            return mappedProduct;
        }
        throw error;
    }
    const mappedProduct = _mapProduct(data);
    if (dbUpdates.stock !== undefined) {
        handleAutoReplenish(mappedProduct).catch(err => {
            console.error('❌ Background Auto-Replenishment Failed:', err);
        });
    }
    return mappedProduct;
}

export async function deleteProduct(id: string) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function cascadeDeleteProduct(id: string) {
    const { error: movementsError } = await supabase
        .from('stock_movements')
        .update({ product_id: null })
        .eq('product_id', id);

    if (movementsError) {
        console.warn('⚠️ Failed to update stock movements:', movementsError);
    }

    try {
        const { error: saleItemsError } = await supabase
            .from('sale_items')
            .update({ product_id: null })
            .eq('product_id', id);

        if (saleItemsError) {
            console.warn('⚠️ Failed to update sale_items:', saleItemsError);
        }
    } catch (e) {
        console.warn('⚠️ sale_items table may not exist:', e);
    }

    const { error: requestsError } = await supabase
        .from('inventory_requests')
        .delete()
        .eq('product_id', id);

    if (requestsError) {
        console.warn('⚠️ Failed to delete inventory_requests:', requestsError);
    }

    const { error: poItemsError } = await supabase
        .from('po_items')
        .update({ product_id: null })
        .eq('product_id', id);

    if (poItemsError) {
        console.warn('⚠️ Failed to update po_items:', poItemsError);
    }

    const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (productError) {
        console.error('❌ Failed to delete product:', productError);
        throw productError;
    }
}

export async function clearLocationForEmptyProducts(location?: string, siteId?: string, sku?: string) {
    try {
        let query = supabase
            .from('products')
            .update({ location: null })
            .eq('stock', 0);

        if (location) query = query.eq('location', location);
        if (siteId) query = query.eq('site_id', siteId);
        if (sku) query = query.eq('sku', sku);

        const { error } = await query;
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error clearing empty product locations:', error);
        return false;
    }
}

export async function adjustStock(
    productId: string,
    quantity: number,
    type: 'IN' | 'OUT' | 'ADJUSTMENT',
    reason: string = 'Stock Adjustment',
    user: string = 'System',
    expiryDate?: string,
    batchNumber?: string,
    timestamp?: string
) {
    const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (productError) throw productError;
    const product = _mapProduct(productData);

    const currentStock = Number(product.stock || 0);
    const adjustQty = Number(quantity);

    let newStock = currentStock;
    if (type === 'OUT') {
        newStock = currentStock - adjustQty;
    } else {
        newStock = currentStock + adjustQty;
    }

    if (isNaN(newStock)) {
        throw new Error('Stock calculation resulted in NaN');
    }

    const updates: Partial<Product> = { stock: newStock };
    if (expiryDate) updates.expiryDate = expiryDate;
    if (batchNumber) updates.batchNumber = batchNumber;

    const updated = await updateProduct(productId, updates);

    await stockMovementsService.create({
        site_id: product.siteId,
        product_id: productId,
        product_name: product.name,
        type: type === 'ADJUSTMENT' ? 'IN' : type,
        quantity: adjustQty,
        movement_date: timestamp || new Date().toISOString(),
        performed_by: user,
        reason: reason || `Stock ${type.toLowerCase()}`
    } as any);

    return updated;
}
