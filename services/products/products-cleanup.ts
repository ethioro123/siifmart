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
 * Cascade delete product references across movements, requests, and PO items before deleting product.
 */
export async function cascadeDeleteProduct(id: string): Promise<void> {
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
