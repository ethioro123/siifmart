import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { stockMovementsService } from './stock-movements.service';

export const productsService = {
    async getAll(siteId?: string, limit?: number, offset?: number, filters?: any, sort?: { key: string, direction: 'asc' | 'desc' }) {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        // Apply Sorting
        if (sort && sort.key) {
            let column = sort.key;
            // Map camelCase to snake_case
            if (sort.key === 'createdAt') column = 'created_at';
            else if (sort.key === 'costPrice') column = 'cost_price';
            else if (sort.key === 'salePrice') column = 'sale_price';
            else if (sort.key === 'siteId') column = 'site_id';
            // Avoid sorting by computed fields on server directly to avoid crashes.
            // Using proxy columns (cost_price/price) provides better relevance than created_at.
            if (sort.key === 'assetValue') {
                column = 'cost_price';
            } else if (sort.key === 'abc') {
                column = 'price';
            }

            query = query.order(column, { ascending: sort.direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        if (filters) {
            if (filters.search) {
                const search = filters.search;
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,location.ilike.%${search}%,barcode.eq.${search}`);
            }
            if (filters.category && filters.category !== 'All') {
                query = query.eq('category', filters.category);
            }
            if (filters.status && filters.status !== 'All') {
                if (filters.status === 'Active') query = query.eq('status', 'active');
                else if (filters.status === 'Low Stock') query = query.eq('status', 'low_stock');
                else if (filters.status === 'Out of Stock') query = query.eq('status', 'out_of_stock');
            }
        }

        if (limit) {
            const from = offset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((p: any) => ({
            ...p,
            siteId: p.site_id,
            costPrice: p.cost_price,
            salePrice: p.sale_price,
            isOnSale: p.is_on_sale,
            expiryDate: p.expiry_date,
            batchNumber: p.batch_number,
            shelfPosition: p.shelf_position,
            competitorPrice: p.competitor_price,
            salesVelocity: p.sales_velocity,
            posReceivedAt: p.pos_received_at,
            pos_received_at: p.pos_received_at,
            posReceivedBy: p.pos_received_by,
            pos_received_by: p.pos_received_by,
            approvalStatus: p.approval_status,
            approval_status: p.approval_status,
            createdBy: p.created_by,
            approvedBy: p.approved_by,
            approvedAt: p.approved_at,
            rejectedBy: p.rejected_by,
            rejectedAt: p.rejected_at,
            rejectionReason: p.rejection_reason,
            oldPrice: p.old_price,
            old_price: p.old_price,
            priceUpdatedAt: p.price_updated_at
        }));

        return { data: mappedData, count: count || 0 };
    },

    async getMetrics(siteId?: string) {
        const { data, error } = await supabase.rpc('get_inventory_metrics', {
            p_site_id: siteId && siteId !== 'All' ? siteId : null
        });
        if (error) throw error;
        return data;
    },

    async getFinancialMetrics(siteId?: string, startDate?: string, endDate?: string) {
        const { data, error } = await supabase.rpc('get_financial_metrics', {
            p_site_id: siteId && siteId !== 'All' ? siteId : null,
            p_start_date: startDate,
            p_end_date: endDate
        });
        if (error) throw error;
        return data;
    },

    /**
     * Strict search for barcode (Exact match on primary OR alias)
     */
    async getByBarcode(barcode: string, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*');

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        // Exact match on 'barcode' column OR inclusion in 'barcodes' array
        // Syntax: barcode.eq.VALUE,barcodes.cs.{VALUE}
        const { data, error } = await query.or(`barcode.eq.${barcode},barcodes.cs.{${barcode}}`);

        if (error) throw error;
        return data.map((p: any) => this._mapProduct(p));
    },

    async search(term: string, siteId?: string, limit: number = 20) {
        let query = supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
            .limit(limit);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((p: any) => ({
            ...p,
            siteId: p.site_id,
            costPrice: p.cost_price,
            salePrice: p.sale_price,
            isOnSale: p.is_on_sale,
            expiryDate: p.expiry_date,
            batchNumber: p.batch_number,
            shelfPosition: p.shelf_position,
            competitorPrice: p.competitor_price,
            salesVelocity: p.sales_velocity,
            posReceivedAt: p.pos_received_at,
            pos_received_at: p.pos_received_at,
            posReceivedBy: p.pos_received_by,
            pos_received_by: p.pos_received_by,
            approvalStatus: p.approval_status,
            approval_status: p.approval_status,
            createdBy: p.created_by,
            approvedBy: p.approved_by,
            approvedAt: p.approved_at,
            rejectedBy: p.rejected_by,
            rejectedAt: p.rejected_at,
            rejectionReason: p.rejection_reason
        }));
    },

    async getById(id: string, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .eq('id', id);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            posReceivedBy: data.pos_received_by,
            pos_received_by: data.pos_received_by,
            approvalStatus: data.approval_status,
            approval_status: data.approval_status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            rejectedBy: data.rejected_by,
            rejectedAt: data.rejected_at,
            rejectionReason: data.rejection_reason
        };
    },

    async getBySKU(sku: string, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .eq('sku', sku);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query.maybeSingle(); // Changed to maybeSingle to handle 'not found' gracefully if needed, but getBySKU usually implies uniqueness? No, getBySKU is tricky with multi-location. 
        // Actually getBySKU might return multiple if we have multiple locations. 
        // This existing method seems to assume uniqueness or just gets one.
        // Let's keep it as is (single) but handle error if multiple.
        if (error) throw error;
        return data ? this._mapProduct(data) : null;
    },

    /**
     * Finds a specific product instance at a location.
     * Used for multi-location putaway logic.
     */
    async getBySkuAndLocation(sku: string, location: string, siteId: string) {
        // Normalizing location comparison (case-insensitive, trimming) is done via ILIKE if possible or exact match.
        // Location should be exact match usually, but let's be robust.
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .eq('site_id', siteId)
            // Use filter for case-insensitive location matching if needed, or just eq
            .ilike('location', location)
            .maybeSingle();

        if (error) throw error;
        return data ? this._mapProduct(data) : null;
    },

    /**
     * Finds ALL products with the matching SKU across all sites.
     * Uses case-insensitive matching for robustness.
     * Used for Global Price Sync.
     */
    async findAllBySKU(sku: string) {
        if (!sku || sku === 'N/A' || sku === 'TEMP') return [];

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('sku', sku.trim());

        if (error) throw error;
        return data.map(p => this._mapProduct(p));
    },

    /**
     * Updates prices for ALL products matching a SKU across the network.
     * Robust: Fetches current state first to preserve old_price for each unique location.
     */
    async updatePricesBySKU(sku: string, updates: { price: number; costPrice?: number; salePrice?: number; isOnSale?: boolean }) {
        if (!sku || sku === 'N/A') throw new Error('Cannot sync prices for products without a valid SKU');

        const targets = await this.findAllBySKU(sku);

        if (targets.length === 0) {
            console.warn(`⚠️ Global Sync: No products found for SKU "${sku}".`);
            return [];
        }


        // Update each product sequentially (or in small batches) to ensure 'update' logic (old_price) triggers.
        // This is safer than a bulk update which would set one old_price for everyone.
        const updatePromises = targets.map(p => this.update(p.id, updates));
        const results = await Promise.all(updatePromises);

        return results;
    },

    /**
     * Specialized price update that preserves the old price.
     * Used when we want to ensure history is kept.
     */
    async updatePrice(id: string, newPrice: number) {
        // Fetch current price first
        const { data: current, error: fetchError } = await supabase
            .from('products')
            .select('price')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const updates: any = {
            price: newPrice,
            old_price: current.price,
            price_updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this._mapProduct(data);
    },

    async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
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
            status: product.status,
            location: product.location,
            expiry_date: product.expiryDate,
            batch_number: product.batchNumber,
            shelf_position: product.shelfPosition,
            competitor_price: product.competitorPrice,
            sales_velocity: product.salesVelocity,

            image: product.image,
            barcode: product.barcode,
            barcodes: product.barcodes, // [NEW] Persist Aliases
            barcode_type: product.barcodeType,
            approval_status: product.approvalStatus,
            created_by: product.createdBy,
            approved_by: product.approvedBy,
            approved_at: product.approvedAt,
            // PO enterprise attributes
            brand: product.brand,
            size: product.size,
            unit: product.unit,
            pack_quantity: product.packQuantity,
            custom_attributes: product.customAttributes,
            description: product.description,
            min_stock: product.minStock,
            max_stock: product.maxStock,
            // [NEW] Link to global product ID if provided
            product_id: product.productId
        };
        // Allow explicit created_at override (e.g. from putaway timestamp sync)
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
            // Robustness: If new columns are missing, retry without them
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
                return this._mapProduct(retryData);
            }
            throw error;
        }
        return this._mapProduct(data);
    },

    // Helper to map DB record to Product interface
    _mapProduct(data: any): Product {
        return {
            ...data,
            siteId: data.site_id,
            barcodes: data.barcodes || [], // [NEW] Map Aliases
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            approvalStatus: data.approval_status,
            approval_status: data.approval_status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            rejectedBy: data.rejected_by,
            rejectedAt: data.rejected_at,
            rejectionReason: data.rejection_reason,
            oldPrice: data.old_price,
            old_price: data.old_price,
            priceUpdatedAt: data.price_updated_at,
            productId: data.product_id,
            product_id: data.product_id,
            // PO enterprise attributes
            packQuantity: data.pack_quantity,
            pack_quantity: data.pack_quantity,
            customAttributes: data.custom_attributes,
            custom_attributes: data.custom_attributes,
            description: data.description,
            minStock: data.min_stock,
            maxStock: data.max_stock
        };
    },

    async update(id: string, updates: Partial<Product>) {
        const dbUpdates: any = { ...updates };

        // Remove fields that shouldn't be updated or don't exist in DB
        const fieldsToRemove = ['id', 'created_at', 'createdAt'];
        fieldsToRemove.forEach(field => delete dbUpdates[field]);

        // Map camelCase to snake_case for database
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

        // Map PO attribute fields from camelCase to snake_case
        if (updates.packQuantity !== undefined) { dbUpdates.pack_quantity = updates.packQuantity; delete dbUpdates.packQuantity; }
        if (updates.customAttributes !== undefined) { dbUpdates.custom_attributes = updates.customAttributes; delete dbUpdates.customAttributes; }
        if (updates.minStock !== undefined) { dbUpdates.min_stock = updates.minStock; delete dbUpdates.minStock; }
        if (updates.maxStock !== undefined) { dbUpdates.max_stock = updates.maxStock; delete dbUpdates.maxStock; }

        // Additional fields to remove that might be in the JS object but not in DB
        const extraFields = ['minStockLevel', 'maxStockLevel', 'retailPrice', 'zoneId'];
        extraFields.forEach(f => delete dbUpdates[f]);

        if (updates.barcodeType !== undefined) {
            dbUpdates.barcode_type = updates.barcodeType;
            delete dbUpdates.barcodeType;
        }

        if (updates.barcodes !== undefined) {
            dbUpdates.barcodes = updates.barcodes;
        }

        // [NEW] Price Change Detection Logic
        // To avoid spurious updates, we first fetch the current state if any price field is being touched.

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
            } else {
                console.warn('⚠️ Could not fetch current product to compare prices.'); // DEBUG
            }
        }

        const { data, error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Robustness: If new columns are missing, retry without them
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
                return this._mapProduct(retryData);
            }
            throw error;
        }
        return this._mapProduct(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Cascade delete - removes all related records first, then deletes the product
    // Only for CEO use when absolutely necessary
    async cascadeDelete(id: string) {

        // 1. Delete related stock_movements
        const { error: movementsError } = await supabase
            .from('stock_movements')
            .delete()
            .eq('product_id', id);

        if (movementsError) {
            console.warn('⚠️ Failed to delete stock movements:', movementsError);
            // Continue anyway - might not have any movements
        } else {
        }

        // 2. Delete related sale line items (if table exists)
        try {
            const { error: saleItemsError } = await supabase
                .from('sale_items')
                .delete()
                .eq('product_id', id);

            if (!saleItemsError) {
            }
        } catch (e) {
            console.warn('⚠️ sale_items table may not exist:', e);
        }

        // 3. Delete related inventory_requests
        const { error: requestsError } = await supabase
            .from('inventory_requests')
            .delete()
            .eq('product_id', id);

        if (!requestsError) {
        }

        // 4. Detach from Purchase Order Items (DELETE items to resolve FK constraint)
        const { error: poItemsError } = await supabase
            .from('po_items')
            .delete()
            .eq('product_id', id);

        if (poItemsError) {
            console.warn('⚠️ Failed to delete po_items:', poItemsError);
            // If we fail here, the next step will likely fail
        } else {
        }

        // 4. Finally delete the product itself
        const { error: productError } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (productError) {
            console.error('❌ Failed to delete product:', productError);
            throw productError;
        }

    },

    /**
     * Clears location for any products that have 0 stock
     * Helps keep inventory tidy - can be targeted by site, location, or SKU
     */
    async clearLocationForEmptyProducts(location?: string, siteId?: string, sku?: string) {
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
    },

    async adjustStock(productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string = 'Stock Adjustment', user: string = 'System', expiryDate?: string, batchNumber?: string, timestamp?: string) {
        console.log('📊 adjustStock called:', { productId, quantity, type, reason, user, expiryDate, batchNumber });

        const product = await this.getById(productId);
        console.log('📊 Product fetched:', { id: product.id, name: product.name, currentStock: product.stock });

        const currentStock = Number(product.stock || 0);
        const adjustQty = Number(quantity);

        let newStock = currentStock;
        if (type === 'OUT') {
            newStock = currentStock - adjustQty;
        } else {
            newStock = currentStock + adjustQty;
        }

        console.log('📊 Stock calculation:', { currentStock, adjustQty, type, newStock });

        if (isNaN(newStock)) {
            console.error('❌ CRITICAL: Stock calculation resulted in NaN', { currentStock, adjustQty, type, product });
            throw new Error('Stock calculation resulted in NaN');
        }

        const updates: Partial<Product> = { stock: newStock };
        if (expiryDate) updates.expiryDate = expiryDate;
        if (batchNumber) updates.batchNumber = batchNumber;

        const updated = await this.update(productId, updates);
        console.log('📊 Product updated:', { id: updated.id, name: updated.name, newStock: updated.stock, expiryDate: updated.expiryDate, batchNumber: updated.batchNumber });

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

        console.log('📊 Stock movement created');

        return updated;
    },

    async getLowStock(threshold: number = 10, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .lte('stock', threshold)
            .order('stock', { ascending: true });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Finds products across all sites that are below their minStock threshold.
     * This is used by the Distribution Hub to identify store needs.
     */
    async getLowStockAcrossSites() {
        // We select all products and filter locally for stock < minStock
        // since Supabase doesn't easily support cross-column comparison in client libraries
        // without a raw RPC or complex filter string.
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .not('status', 'eq', 'archived');

        if (error) throw error;

        // Filter for items below threshold (minStock or default 10)
        return data
            .map(p => this._mapProduct(p))
            .filter(p => p.stock < (p.minStock || 10));
    },

    /**
     * Finds all site locations that have stock for a specific SKU.
     * Used to suggest warehouse sources for replenishment.
     */
    async getWarehouseStock(sku: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .gt('stock', 0);

        if (error) throw error;
        return data.map((p: any) => this._mapProduct(p));
    }

};
