import { supabase } from '../lib/supabase';
import type { RoutingStock, RoutingZone, RoutingMapping } from '../utils/putawayRouting';

export interface PutawayRoutingSnapshot { stock: RoutingStock[]; zones: RoutingZone[]; mappings: RoutingMapping[] }
const PAGE_SIZE = 250;
export const putawayRoutingService = {
    async load(siteId: string): Promise<PutawayRoutingSnapshot> {
        if (!siteId) throw new Error('Select the assigned warehouse before routing stock.');
        const stock: RoutingStock[] = [];
        // Read live site stock on demand; never derive occupancy from a partial inventory cache.
        for (let offset = 0; ; offset += PAGE_SIZE) {
            const { data, error } = await supabase.from('products')
                .select('id,site_id,sku,category,location,stock,batch_number,expiry_date,zone_id')
                .eq('site_id', siteId).gt('stock', 0).order('id').range(offset, offset + PAGE_SIZE - 1);
            if (error) throw error;
            stock.push(...(data || []).map(p => ({ id: p.id, siteId: p.site_id, sku: p.sku, category: p.category,
                location: p.location, stock: p.stock, batchNumber: p.batch_number, expiryDate: p.expiry_date, zoneId: p.zone_id })));
            if ((data || []).length < PAGE_SIZE) break;
        }
        const [zones, mappings] = await Promise.all([
            supabase.from('warehouse_zones').select('id,site_id,name,type,temperature,capacity,occupied,is_locked,allow_putaway').eq('site_id', siteId).limit(500),
            supabase.from('category_zones').select('site_id,category,default_zone').eq('site_id', siteId).limit(500)
        ]);
        if (zones.error) throw zones.error;
        if (mappings.error) throw mappings.error;
        if ((zones.data?.length || 0) >= 500 || (mappings.data?.length || 0) >= 500) throw new Error('Routing configuration exceeds the supported snapshot size.');
        return { stock, zones: (zones.data || []).map(z => ({ id: z.id, siteId: z.site_id, name: z.name, type: z.type,
            temperature: z.temperature, capacity: z.capacity || 0, occupied: z.occupied || 0, isLocked: !!z.is_locked, allowPutaway: z.allow_putaway !== false })),
            mappings: (mappings.data || []).map(m => ({ siteId: m.site_id, category: m.category, defaultZone: m.default_zone })) };
    }
};
