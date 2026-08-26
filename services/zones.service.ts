import { supabase } from '../lib/supabase';
import type { WarehouseZone } from '../types';
import { logger } from '../utils/logger';

export const warehouseZonesService = {
    async getAll(siteId?: string) {
        try {
            let query = supabase.from('warehouse_zones').select('*');
            if (siteId) query = query.eq('site_id', siteId);

            const { data, error } = await query.order('picking_priority', { ascending: true });

            if (error) {
                // If picking_priority column is missing, Supabase might return 400/PGRST204
                const isColumnError = error.message.toLowerCase().includes('column') ||
                    error.message.toLowerCase().includes('does not exist') ||
                    error.code === '42703' || error.code === 'PGRST204';

                if (isColumnError) {
                    logger.warn('warehouseZonesService', 'Schema mismatch in warehouse_zones: fallback query without picking_priority order.');
                    let retryQuery = supabase.from('warehouse_zones').select('*');
                    if (siteId) retryQuery = retryQuery.eq('site_id', siteId);
                    const { data: retryData, error: retryError } = await retryQuery;
                    if (retryError) throw retryError;
                    return (retryData || []).map((z: any) => ({
                        ...z,
                        siteId: z.site_id,
                        pickingPriority: z.picking_priority ?? 10,
                        zoneType: z.zone_type || 'STANDARD',
                        status: 'Active'
                    }));
                }
                throw error;
            }

            return (data || []).map((z: any) => ({
                ...z,
                siteId: z.site_id,
                pickingPriority: z.picking_priority ?? 10,
                zoneType: z.zone_type || 'STANDARD',
                status: 'Active',
                // Locking fields
                isLocked: z.is_locked ?? false,
                lockReason: z.lock_reason,
                lockedAt: z.locked_at,
                lockedBy: z.locked_by,
                // Movement Rules
                allowPicking: z.allow_picking ?? true,
                allowPutaway: z.allow_putaway ?? true,
                capacity: z.capacity || 0,
                occupied: z.occupied || 0
            }));
        } catch (err) {
            logger.error('warehouseZonesService', 'Critical error in getAll', err as Error);
            return []; // Fail gracefully with empty array
        }
    },

    async update(id: string, updates: Partial<WarehouseZone>) {
        const dbUpdates: Record<string, any> = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.siteId !== undefined) dbUpdates.site_id = updates.siteId;
        if (updates.pickingPriority !== undefined) dbUpdates.picking_priority = updates.pickingPriority;
        if (updates.zoneType !== undefined) dbUpdates.zone_type = updates.zoneType;
        if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
        if (updates.lockReason !== undefined) dbUpdates.lock_reason = updates.lockReason;
        if (updates.lockedAt !== undefined) dbUpdates.locked_at = updates.lockedAt;
        if (updates.lockedBy !== undefined) dbUpdates.locked_by = updates.lockedBy;
        if (updates.allowPicking !== undefined) dbUpdates.allow_picking = updates.allowPicking;
        if (updates.allowPutaway !== undefined) dbUpdates.allow_putaway = updates.allowPutaway;
        if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
        if (updates.occupied !== undefined) dbUpdates.occupied = updates.occupied;

        const { error } = await supabase
            .from('warehouse_zones')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            // If extended columns cause an error, fallback to core fields
            const isColumnError = error.message?.toLowerCase().includes('column') ||
                error.code === 'PGRST204' || error.code === '42703';

            if (isColumnError) {
                const coreUpdates: Record<string, any> = {};
                if (updates.name !== undefined) coreUpdates.name = updates.name;
                if (updates.type !== undefined) coreUpdates.type = updates.type;
                const { error: retryError } = await supabase
                    .from('warehouse_zones')
                    .update(coreUpdates)
                    .eq('id', id);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }

        return {
            id,
            ...updates,
            status: 'Active'
        };
    },

    async create(zone: Omit<WarehouseZone, 'id'>) {
        const zoneId = (zone as any).id || crypto.randomUUID();
        const dbZone: Record<string, any> = {
            id: zoneId,
            name: zone.name,
            site_id: zone.siteId,
            type: zone.type || 'Dry',
            zone_type: zone.zoneType || 'STANDARD',
            picking_priority: zone.pickingPriority || 10,
            capacity: zone.capacity || 0,
            allow_picking: zone.allowPicking ?? true,
            allow_putaway: zone.allowPutaway ?? true
        };

        const { error } = await supabase
            .from('warehouse_zones')
            .insert(dbZone);

        if (error) {
            // PostgREST column missing error - fallback to core schema
            const isColumnError = error.message?.toLowerCase().includes('column') ||
                error.code === 'PGRST204' || error.code === '42703';

            if (isColumnError) {
                logger.warn('warehouseZonesService', 'Falling back to core columns for warehouse_zones insert');
                const coreZone = {
                    id: zoneId,
                    name: zone.name,
                    site_id: zone.siteId,
                    type: zone.type || 'Dry'
                };
                const { error: coreError } = await supabase
                    .from('warehouse_zones')
                    .insert(coreZone);
                if (coreError) throw coreError;
            } else {
                throw error;
            }
        }

        return {
            id: zoneId,
            ...zone,
            status: 'Active'
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('warehouse_zones')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
