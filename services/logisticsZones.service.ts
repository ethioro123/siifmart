import { supabase } from '../lib/supabase';
import type { LogisticsZone } from '../types';
import { logger } from '../utils/logger';

export const logisticsZonesService = {
    async getAll(country?: string): Promise<LogisticsZone[]> {
        let query = supabase
            .from('logistics_zones')
            .select('*')
            .order('name', { ascending: true });

        if (country) {
            if (country === 'ET') {
                query = query.or('country.eq.ET,country.is.null');
            } else {
                query = query.eq('country', country);
            }
        }

        const { data, error } = await query;

        if (error) {
            logger.error('logisticsZonesService', 'Error fetching logistics zones:', error);
            throw error;
        }
        return data || [];
    },

    async create(zone: Omit<LogisticsZone, 'id' | 'created_at' | 'updated_at'>): Promise<LogisticsZone> {
        const payload: Record<string, unknown> = {
            name: zone.name,
            description: zone.description,
            country: zone.country || 'ET'
        };

        const { data, error } = await supabase
            .from('logistics_zones')
            .insert(payload)
            .select()
            .single();

        if (error) {
            logger.error('logisticsZonesService', 'Error creating logistics zone:', error);
            throw error;
        }
        return data;
    },

    async update(id: string, updates: Partial<LogisticsZone>): Promise<LogisticsZone> {
        const { data, error } = await supabase
            .from('logistics_zones')
            .update({
                name: updates.name,
                description: updates.description,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('logisticsZonesService', 'Error updating logistics zone:', error);
            throw error;
        }
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('logistics_zones')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('logisticsZonesService', 'Error deleting logistics zone:', error);
            throw error;
        }
    }
};
