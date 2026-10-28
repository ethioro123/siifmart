import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface ProductPriceHistoryEntry {
    id: string;
    product_id: string;
    site_id: string;
    country_code: string;
    product_name: string;
    sku: string;
    old_regular_price: number;
    new_regular_price: number;
    old_sale_price: number | null;
    new_sale_price: number | null;
    old_is_on_sale: boolean;
    new_is_on_sale: boolean;
    old_effective_price: number;
    new_effective_price: number;
    actor_id: string | null;
    actor_name: string | null;
    changed_at: string;
    reviewed_by_me: boolean;
    request_id?:string|null;currency?:string|null;reason?:string|null;requester_name?:string|null;finance_approver_name?:string|null;
}

const HISTORY_PROJECTION = 'id, product_id, site_id, country_code, product_name, sku, old_regular_price, new_regular_price, old_sale_price, new_sale_price, old_is_on_sale, new_is_on_sale, old_effective_price, new_effective_price, actor_id, actor_name, changed_at';

export const productPriceHistoryService = {
    async listByProduct(siteId: string, country: string, productId: string, offset = 0, limit = 10, filters?: { since?:string|null;search?:string }): Promise<ProductPriceHistoryEntry[]> {
        const { data, error } = await supabase.rpc('list_product_price_history', {p_site_id:siteId,p_country_code:country.toUpperCase(),p_product_id:productId,
            p_offset:Math.max(0,offset),p_limit:Math.min(50,Math.max(1,limit)),p_since:filters?.since??null,p_search:filters?.search?.trim()||null});
        if (error) throw error;
        return (data || []).map((row:Omit<ProductPriceHistoryEntry,'reviewed_by_me'>) => ({ ...row, reviewed_by_me: false }));
    },
    async listBySite(siteId: string, offset = 0, limit = 50): Promise<ProductPriceHistoryEntry[]> {
        const { data, error } = await supabase
            .from('product_price_history')
            .select(HISTORY_PROJECTION)
            .eq('site_id', siteId)
            .order('changed_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error('ProductPriceHistory', 'Could not load product price history', error, { siteId });
            throw error;
        }

        const rows = data || [];
        if (rows.length === 0) return [];

        const { data: reviewRows, error: reviewError } = await supabase
            .from('product_price_history_reviews')
            .select('history_id')
            .in('history_id', rows.map(row => row.id));

        if (reviewError) {
            logger.error('ProductPriceHistory', 'Could not load review receipts', reviewError, { siteId });
            throw reviewError;
        }

        const reviewedIds = new Set((reviewRows || []).map(row => row.history_id));
        return rows.map(row => ({ ...row, reviewed_by_me: reviewedIds.has(row.id) })) as ProductPriceHistoryEntry[];
    },

    async countUnreviewed(siteId: string, since: string): Promise<number> {
        const { data, error } = await supabase.rpc('count_unreviewed_product_price_history', {
            p_site_id: siteId,
            p_since: since
        });

        if (error) {
            logger.error('ProductPriceHistory', 'Could not count unreviewed price changes', error, { siteId });
            throw error;
        }
        return Number(data || 0);
    },

    async markReviewed(historyIds: string[], reviewerId: string): Promise<void> {
        if (historyIds.length === 0) return;
        const receipts = historyIds.map(historyId => ({ history_id: historyId, reviewer_id: reviewerId }));
        const { error } = await supabase
            .from('product_price_history_reviews')
            .upsert(receipts, { onConflict: 'history_id,reviewer_id', ignoreDuplicates: true });

        if (error) {
            logger.error('ProductPriceHistory', 'Could not save review receipts', error, { count: historyIds.length });
            throw error;
        }
    }
};
