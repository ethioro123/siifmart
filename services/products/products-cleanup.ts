import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

/**
 * Remove orphaned 'On Order' or empty-location placeholders with 0 stock
 * when a real active product for the same SKU exists at the site.
 */
export async function deleteGhostPlaceholders(sku: string, siteId: string): Promise<boolean> {
    if (!sku || !siteId) return false;
    const cleanSku = sku.replace(/[-\s]/g, '').toUpperCase();
    try {
        const { data: records, error: fetchError } = await supabase
            .from('products')
            .select('id, stock, location')
            .eq('site_id', siteId)
            .or(`sku.eq.${sku},sku.eq.${cleanSku}`);

        if (fetchError || !records) {
            logger.warn('products-cleanup', `Failed to check ghost placeholders for SKU ${sku}`, { error: fetchError?.message });
            return false;
        }

        const hasRealActive = records.some(r => (r.stock !== null && r.stock > 0) || (r.location && r.location !== 'On Order'));
        if (hasRealActive) {
            const ghostIds = records
                .filter(r => (!r.stock || r.stock === 0) && (!r.location || r.location === 'On Order' || r.location.trim() === ''))
                .map(r => r.id);

            if (ghostIds.length > 0) {
                const { error: delError } = await supabase
                    .from('products')
                    .delete()
                    .in('id', ghostIds);

                if (delError) {
                    logger.warn('products-cleanup', `Failed to delete ghost product IDs ${ghostIds.join(',')}`, { error: delError?.message });
                } else {
                    logger.info('products-cleanup', `Deleted ${ghostIds.length} ghost placeholder(s) for SKU ${sku} at site ${siteId}`);
                }
            }
        }
        return true;
    } catch (error) {
        logger.warn('products-cleanup', `Error deleting ghost placeholders for SKU ${sku}`, { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

/**
 * Clear location assignment for products with 0 stock so they don't block new bin tenants.
 */
export async function clearLocationForEmptyProducts(location?: string, siteId?: string, sku?: string): Promise<boolean> {
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

/**
 * Safe delete product: verifies no audit evidence exists (movements, sales, approval requests, or PO items)
 * before deleting the product. Refuses to delete if audit records reference this product, preserving evidence.
 */
export async function cascadeDeleteProduct(id: string): Promise<void> {
    if (!id) throw new Error('Product ID is required');

    // 1. Verify no existing stock movements
    const { count: movementsCount, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

    if (movementsError) {
        logger.warn('products-cleanup', 'Failed to check stock movements for product delete', { error: movementsError.message });
    }
    if (movementsCount && movementsCount > 0) {
        throw new Error('Cannot delete product with existing stock movements; preserve product for audit trail.');
    }

    // 2. Verify no existing sale items
    try {
        const { count: saleCount, error: saleItemsError } = await supabase
            .from('sale_items')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', id);

        if (!saleItemsError && saleCount && saleCount > 0) {
            throw new Error('Cannot delete product with existing sales history; preserve product for audit trail.');
        }
    } catch {
        // Safe check fallback
    }

    // 3. Verify no existing approval requests (inventory_requests)
    const { count: requestsCount, error: requestsError } = await supabase
        .from('inventory_requests')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

    if (!requestsError && requestsCount && requestsCount > 0) {
        throw new Error('Cannot delete product with existing inventory approval requests; preserve requests for audit trail.');
    }

    // 4. Verify no existing purchase order references
    const { count: poItemsCount, error: poItemsError } = await supabase
        .from('po_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

    if (!poItemsError && poItemsCount && poItemsCount > 0) {
        throw new Error('Cannot delete product referenced in purchase orders; preserve product for audit trail.');
    }

    // 5. Cleanly delete unreferenced product without altering historical evidence
    const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (productError) {
        logger.error('products-cleanup', 'Failed to delete unreferenced product', { error: productError.message });
        throw productError;
    }
}
