import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface CategoryZoneMapping {
    id: string;
    siteId: string;
    category: string;
    defaultZone: string;
    createdAt?: string;
    updatedAt?: string;
}

export const categoryZonesService = {
    async getMappings(siteId: string): Promise<CategoryZoneMapping[]> {
        const { data, error } = await supabase
            .from('category_zones')
            .select('*')
            .eq('site_id', siteId);

        if (error) {
            logger.warn('categoryZonesService', 'Failed to load category zone mappings (table may not exist yet)', { message: error.message });
            return [];
        }

        return (data || []).map((d: any) => ({
            id: d.id,
            siteId: d.site_id,
            category: d.category,
            defaultZone: d.default_zone,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        }));
    },

    async setMapping(siteId: string, category: string, defaultZone: string): Promise<CategoryZoneMapping> {
        const { data, error } = await supabase
            .from('category_zones')
            .upsert(
                { site_id: siteId, category, default_zone: defaultZone, updated_at: new Date().toISOString() },
                { onConflict: 'site_id, category' }
            )
            .select()
            .single();

        if (error) {
            logger.error('categoryZonesService', 'Failed to set category zone mapping:', error);
            throw error;
        }

        return {
            id: data.id,
            siteId: data.site_id,
            category: data.category,
            defaultZone: data.default_zone,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },
    
    async removeMapping(siteId: string, category: string): Promise<void> {
        const { error } = await supabase
            .from('category_zones')
            .delete()
            .eq('site_id', siteId)
            .eq('category', category);
            
        if (error) {
             logger.error('categoryZonesService', 'Failed to remove category zone mapping:', error);
             throw error;
        }
    }
};
