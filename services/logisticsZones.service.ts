import { supabase } from '../lib/supabase';
import type { LogisticsZone } from '../types';

export const logisticsZonesService = {
    async getAll(): Promise<LogisticsZone[]> {
        const { data, error } = await supabase
            .from('logistics_zones')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching logistics zones:', error);
            throw error;
        }
        return data || [];
    },

    async create(zone: Omit<LogisticsZone, 'id' | 'created_at' | 'updated_at'>): Promise<LogisticsZone> {
        const { data, error } = await supabase
            .from('logistics_zones')
            .insert({
                name: zone.name,
                description: zone.description
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating logistics zone:', error);
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
            console.error('❌ Error updating logistics zone:', error);
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
            console.error('❌ Error deleting logistics zone:', error);
            throw error;
        }
    }
};
