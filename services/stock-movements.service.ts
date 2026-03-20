import { supabase } from '../lib/supabase';
import type { StockMovement } from '../types';

export const stockMovementsService = {
    async getAll(siteId?: string, productId?: string, limit: number = 50, offset: number = 0, filters?: { search?: string; type?: string }, sort?: { key: string; direction: 'asc' | 'desc' }) {
        let query = supabase
            .from('stock_movements')
            .select('*', { count: 'exact' });

        // Apply Filters
        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        if (productId) {
            query = query.eq('product_id', productId);
        }

        if (filters?.type && filters.type !== 'All') {
            query = query.eq('type', filters.type);
        }

        if (filters?.search) {
            const term = filters.search.trim().toLowerCase();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
            const isHex = /^[0-9a-f]{1,8}$/i.test(term);

            if (isUuid) {
                query = query.or(`product_name.ilike.%${term}%,id.eq.${term}`);
            } else if (isHex) {
                const paddedMin = term.padEnd(8, '0');
                const paddedMax = term.padEnd(8, 'f');
                const minUuid = `${paddedMin}-0000-0000-0000-000000000000`;
                const maxUuid = `${paddedMax}-ffff-ffff-ffff-ffffffffffff`;
                query = query.or(`product_name.ilike.%${term}%,and(id.gte.${minUuid},id.lte.${maxUuid})`);
            } else {
                query = query.ilike('product_name', `%${term}%`);
            }
        }

        // Apply Sort
        if (sort?.key) {
            const dbKey = sort.key === 'date' ? 'created_at' : sort.key === 'quantity' ? 'quantity' : 'created_at';
            query = query.order(dbKey, { ascending: sort.direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((m: any) => ({
            ...m,
            siteId: m.site_id,
            productId: m.product_id,
            productName: m.product_name,
            date: m.created_at || m.movement_date,
            movementDate: m.movement_date,
            performedBy: m.performed_by,
            user: m.performed_by,
            batchNumber: m.batch_number
        }));

        return { data: mappedData, count: count || 0 };
    },

    async create(movement: Omit<StockMovement, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('stock_movements')
            .insert(movement)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // NEW: Server-Side Warehouse Analytics
    async getAnalytics(siteId?: string, startDate?: string, endDate?: string) {
        const params: any = {};
        if (siteId && siteId !== 'All') params.p_site_id = siteId;
        if (startDate) params.p_start_date = startDate;
        if (endDate) params.p_end_date = `${endDate}T23:59:59`;

        const { data, error } = await supabase.rpc('get_warehouse_metrics', params);
        if (error) {
            console.error('Error fetching warehouse metrics:', error);
            return null;
        }
        return data;
    }
};
