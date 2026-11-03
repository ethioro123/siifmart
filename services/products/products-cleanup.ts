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
            .in('sku', [sku, cleanSku]).limit(25);

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
                const { data: deleted, error: delError } = await supabase
                    .from('products')
                    .delete()
                    .in('id', ghostIds).select('id');

                if (delError) {
                    logger.warn('products-cleanup', 'Placeholder deletion rejected', { error: delError.message });
                    return false;
                } else {
                    if (deleted?.length !== ghostIds.length) return false;
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

/** Delete only a product which passes the server's stock and evidence guards. */
export async function cascadeDeleteProduct(id: string): Promise<void> {
    if (!id) throw new Error('Product ID is required');
    const { data, error } = await supabase.from('products').delete().eq('id', id).select('id').single();
    if (error) throw error;
    if (data?.id !== id) throw new Error('Product deletion was not confirmed.');
}
