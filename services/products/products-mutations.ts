import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';
import { stockMovementsService } from '../stock-movements.service';
import { _mapProduct, _calculateStatus } from './products-helpers';
import { handleAutoReplenish } from './products-replenish';
import { logger } from '../../utils/logger';
import { ensureMaster } from './product-master.service';

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
        const cleanSku = (s: string) => s.replace(/[-\s]/g, '').toUpperCase();
        const normalizedTargetSku = cleanSku(sku);
        for (const item of data) {
            const itemSku = cleanSku(item.sku || '');
            if (itemSku && normalizedTargetSku && itemSku !== normalizedTargetSku) {
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

    const cleanSku = product.sku ? product.sku.replace(/[-\s]/g, '').toUpperCase() : product.sku;

    const dbProduct: any = {
        site_id: product.siteId,
        name: product.name,
        sku: cleanSku,
        category: product.category,
        price: product.price || 0,
        cost_price: product.costPrice ?? (product as any).cost ?? 0,
        stock: product.stock || 0,
        status: _calculateStatus(product.stock || 0, product.minStock, product.status),
        location: product.location,
        expiry_date: product.expiryDate,
        batch_number: product.batchNumber,
        image: product.image,
        barcode: product.barcode,
        barcodes: product.barcodes,
        approved_by: product.approvedBy,
        approved_at: product.approvedAt,
        rejected_by: product.rejectedBy,
        rejected_at: product.rejectedAt,
        brand: product.brand,
        size: product.size,
        unit: product.unit,
        custom_attributes: (product.packageType || product.caseSize)
            ? {
                ...(product.customAttributes || {}),
                ...(product.packageType ? { package_type: product.packageType, packageType: product.packageType } : {}),
                ...(product.caseSize ? { case_size: product.caseSize, caseSize: product.caseSize } : {})
            }
            : product.customAttributes,
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

    // Clean undefined fields
    Object.keys(dbProduct).forEach(key => {
        if (dbProduct[key] === undefined) delete dbProduct[key];
    });

    // Prevent duplicate 0-stock / 'On Order' ghost placeholders if a record already exists at site
    if ((!dbProduct.stock || dbProduct.stock === 0) && (dbProduct.location === 'On Order' || !dbProduct.location)) {
        const { data: existingGhostOrReal } = await supabase
            .from('products')
            .select('id, site_id, name, sku, category, price, cost_price, stock, status, location, barcode, barcodes, brand, size, unit, custom_attributes, description, min_stock, max_stock, created_at')
            .eq('sku', dbProduct.sku)
            .eq('site_id', dbProduct.site_id)
            .order('stock', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (existingGhostOrReal) {
            logger.info('products-mutations', `Product ${dbProduct.sku} already exists at site ${dbProduct.site_id}. Reusing existing record instead of creating duplicate.`);
            return _mapProduct(existingGhostOrReal);
        }
    }

    if (dbProduct.sku && dbProduct.site_id) {
        const masterId = await ensureMaster({
            siteId: dbProduct.site_id,
            sku: dbProduct.sku,
            name: dbProduct.name,
            category: dbProduct.category,
            barcode: dbProduct.barcode,
            brand: dbProduct.brand,
            unit: dbProduct.unit,
            size: dbProduct.size,
            costPrice: dbProduct.cost_price,
            approved: Boolean(product.approvedBy),
            createdBy: product.approvedBy ?? null
        });
        if (masterId) dbProduct.master_id = masterId;
    }

    const { data, error } = await supabase
        .from('products')
        .insert(dbProduct)
        .select('id, site_id, name, sku, category, price, cost_price, stock, status, location, barcode, barcodes, brand, size, unit, custom_attributes, description, min_stock, max_stock, created_at')
        .single();

    if (error) {
        if (error.code === '23505') {
            logger.warn('products-mutations', `Product with SKU ${dbProduct.sku} already exists at site ${dbProduct.site_id}. Retrieving existing record...`);
            const { data: existing } = await supabase
                .from('products')
                .select('id, site_id, name, sku, category, price, cost_price, stock, status, location, barcode, barcodes, brand, size, unit, custom_attributes, description, min_stock, max_stock, created_at')
                .eq('sku', dbProduct.sku)
                .eq('site_id', dbProduct.site_id)
                .limit(1)
                .maybeSingle();
            if (existing) {
                return _mapProduct(existing);
            }
        }
        logger.error('products-mutations', 'Failed to insert product:', error);
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

    // Explicit Column Allowlist Architecture (Rule Invariant)
    const dbUpdates: Record<string, any> = {};

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

    const u = updates as any;

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku.replace(/[-\s]/g, '').toUpperCase();
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.salePrice !== undefined || u.sale_price !== undefined) dbUpdates.sale_price = updates.salePrice ?? u.sale_price;
    if (updates.isOnSale !== undefined || u.is_on_sale !== undefined) dbUpdates.is_on_sale = updates.isOnSale ?? u.is_on_sale;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.status !== undefined && dbUpdates.status === undefined) dbUpdates.status = updates.status;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
    if (updates.barcodes !== undefined) dbUpdates.barcodes = updates.barcodes;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.size !== undefined) dbUpdates.size = updates.size;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.siteId !== undefined || u.site_id !== undefined) dbUpdates.site_id = updates.siteId ?? u.site_id;
    if (updates.costPrice !== undefined || u.cost !== undefined || u.cost_price !== undefined) {
        dbUpdates.cost_price = updates.costPrice ?? u.cost ?? u.cost_price;
    }
    if (updates.expiryDate !== undefined || u.expiry_date !== undefined) dbUpdates.expiry_date = updates.expiryDate ?? u.expiry_date;
    if (updates.batchNumber !== undefined || u.batch_number !== undefined) dbUpdates.batch_number = updates.batchNumber ?? u.batch_number;
    if (updates.shelfPosition !== undefined || u.shelf_position !== undefined) dbUpdates.shelf_position = updates.shelfPosition ?? u.shelf_position;
    if (updates.competitorPrice !== undefined || u.competitor_price !== undefined) dbUpdates.competitor_price = updates.competitorPrice ?? u.competitor_price;
    if (updates.salesVelocity !== undefined || u.sales_velocity !== undefined) dbUpdates.sales_velocity = updates.salesVelocity ?? u.sales_velocity;
    if (updates.posReceivedAt !== undefined || u.pos_received_at !== undefined) dbUpdates.pos_received_at = updates.posReceivedAt ?? u.pos_received_at;
    if (updates.posReceivedBy !== undefined || u.pos_received_by !== undefined) dbUpdates.pos_received_by = updates.posReceivedBy ?? u.pos_received_by;
    if (updates.approvalStatus !== undefined || u.approval_status !== undefined) dbUpdates.approval_status = updates.approvalStatus ?? u.approval_status;
    if (updates.approvedBy !== undefined || u.approved_by !== undefined) dbUpdates.approved_by = updates.approvedBy ?? u.approved_by;
    if (updates.approvedAt !== undefined || u.approved_at !== undefined) dbUpdates.approved_at = updates.approvedAt ?? u.approved_at;
    if (updates.rejectedBy !== undefined || u.rejected_by !== undefined) dbUpdates.rejected_by = updates.rejectedBy ?? u.rejected_by;
    if (updates.rejectedAt !== undefined || u.rejected_at !== undefined) dbUpdates.rejected_at = updates.rejectedAt ?? u.rejected_at;
    if (updates.rejectionReason !== undefined || u.rejection_reason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason ?? u.rejection_reason;
    if (updates.priceUpdatedAt !== undefined || u.price_updated_at !== undefined) dbUpdates.price_updated_at = updates.priceUpdatedAt ?? u.price_updated_at;
    if (updates.productId !== undefined || u.product_id !== undefined) dbUpdates.product_id = updates.productId ?? u.product_id;
    if (updates.packQuantity !== undefined || u.pack_quantity !== undefined) dbUpdates.pack_quantity = updates.packQuantity ?? u.pack_quantity;
    if (updates.minStock !== undefined || u.min_stock !== undefined) dbUpdates.min_stock = updates.minStock ?? u.min_stock;
    if (updates.maxStock !== undefined || u.max_stock !== undefined) dbUpdates.max_stock = updates.maxStock ?? u.max_stock;
    if (updates.zoneId !== undefined || u.zone_id !== undefined) dbUpdates.zone_id = updates.zoneId ?? u.zone_id;

    // Safely fold packageType, caseSize, and customAttributes into custom_attributes
    let customAttrs = updates.customAttributes !== undefined 
        ? updates.customAttributes 
        : (u.custom_attributes !== undefined ? u.custom_attributes : undefined);

    if (updates.packageType !== undefined || updates.caseSize !== undefined) {
        customAttrs = {
            ...(customAttrs || {}),
            ...(updates.packageType !== undefined ? { package_type: updates.packageType, packageType: updates.packageType } : {}),
            ...(updates.caseSize !== undefined ? { case_size: updates.caseSize, caseSize: updates.caseSize } : {})
        };
    }
    if (customAttrs !== undefined) {
        dbUpdates.custom_attributes = customAttrs;
    }

    const hasRetailPriceUpdate = updates.price !== undefined || updates.salePrice !== undefined || updates.isOnSale !== undefined;
    if (hasRetailPriceUpdate) {
        const { data: currentProduct } = await supabase
            .from('products')
            .select('price, sale_price, is_on_sale')
            .eq('id', id)
            .single();

        if (currentProduct) {
            const currentEffectivePrice = currentProduct.is_on_sale && Number(currentProduct.sale_price) > 0
                ? Number(currentProduct.sale_price)
                : Number(currentProduct.price);
            const nextPrice = updates.price ?? Number(currentProduct.price);
            const nextSalePrice = updates.salePrice ?? Number(currentProduct.sale_price);
            const nextIsOnSale = updates.isOnSale ?? currentProduct.is_on_sale;
            const nextEffectivePrice = nextIsOnSale && Number(nextSalePrice) > 0 ? Number(nextSalePrice) : Number(nextPrice);
            if (nextEffectivePrice !== currentEffectivePrice) {
                dbUpdates.price_updated_at = new Date().toISOString();
                dbUpdates.old_price = currentEffectivePrice;
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

export {
    cascadeDeleteProduct,
    clearLocationForEmptyProducts,
    deleteGhostPlaceholders
} from './products-cleanup';

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

export async function updatePriceBySku(sku: string, siteId: string, newPrice: number) {
    if (!sku || !newPrice || newPrice <= 0) return [];
    const nowStr = new Date().toISOString();

    const { data: currentProducts, error: fetchError } = await supabase
        .from('products')
        .select('id, price, sale_price, is_on_sale')
        .eq('sku', sku)
        .eq('site_id', siteId);

    if (fetchError) {
        logger.warn('products-mutations', `Could not load current price by SKU ${sku}`, { error: fetchError.message });
        return [];
    }

    const changedProducts = (currentProducts || []).filter(product => Number(product.price) !== newPrice);
    try {
        return await Promise.all(changedProducts.map(async product => {
            const oldEffectivePrice = product.is_on_sale && Number(product.sale_price) > 0 ? Number(product.sale_price) : Number(product.price);
            const newEffectivePrice = product.is_on_sale && Number(product.sale_price) > 0 ? Number(product.sale_price) : newPrice;
            const updatePayload: Record<string, number | string> = { price: newPrice };
            if (oldEffectivePrice !== newEffectivePrice) {
                updatePayload.old_price = oldEffectivePrice;
                updatePayload.price_updated_at = nowStr;
            }
            const { data, error } = await supabase
                .from('products')
                .update(updatePayload)
                .eq('id', product.id)
                .select('*')
                .single();

            if (error) throw error;
            return _mapProduct(data);
        }));
    } catch (error: any) {
        logger.warn('products-mutations', `Could not update price by SKU ${sku}`, { error: error.message });
        return [];
    }
}
