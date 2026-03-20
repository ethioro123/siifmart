import { supabase } from '../lib/supabase';
import type { WarehouseZone } from '../types';

export const warehouseZonesService = {
    async getAll(siteId?: string) {
        try {
            let query = supabase.from('warehouse_zones').select('*');
            if (siteId) query = query.eq('site_id', siteId);

            const { data, error } = await query.order('picking_priority', { ascending: true });

            if (error) {
                // If picking_priority column is missing, Supabase might return 400
                // We check message for "column" and "does not exist" or specific PostgREST error codes
                const isColumnError = error.message.toLowerCase().includes('column') ||
                    error.message.toLowerCase().includes('does not exist') ||
                    error.code === '42703'; // PostgreSQL error code for undefined_column

                if (isColumnError) {
                    console.warn('⚠️ Schema mismatch in warehouse_zones: picking_priority column missing. Falling back to default order.');
                    let retryQuery = supabase.from('warehouse_zones').select('*');
                    if (siteId) retryQuery = retryQuery.eq('site_id', siteId);
                    const { data: retryData, error: retryError } = await retryQuery;
                    if (retryError) throw retryError;
                    return (retryData || []).map((z: any) => ({
                        ...z,
                        siteId: z.site_id,
                        pickingPriority: 10, // Default fallback
                        zoneType: z.zone_type || 'STANDARD'
                    }));
                }
                throw error;
            }

            return data.map((z: any) => ({
                ...z,
                siteId: z.site_id,
                pickingPriority: z.picking_priority,
                zoneType: z.zone_type,
                // Locking fields
                isLocked: z.is_locked,
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
            console.error('❌ Critical error in warehouseZonesService.getAll:', err);
            return []; // Fail gracefully with empty array
        }
    },

    async update(id: string, updates: Partial<WarehouseZone>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId) {
            dbUpdates.site_id = updates.siteId;
            delete dbUpdates.siteId;
        }
        if (updates.pickingPriority !== undefined) {
            dbUpdates.picking_priority = updates.pickingPriority;
            delete dbUpdates.pickingPriority;
        }
        if (updates.zoneType) {
            dbUpdates.zone_type = updates.zoneType;
            delete dbUpdates.zoneType;
        }
        // Locking fields mapping
        if (updates.isLocked !== undefined) {
            dbUpdates.is_locked = updates.isLocked;
            delete dbUpdates.isLocked;
        }
        if (updates.lockReason !== undefined) {
            dbUpdates.lock_reason = updates.lockReason;
            delete dbUpdates.lockReason;
        }
        if (updates.lockedAt !== undefined) {
            dbUpdates.locked_at = updates.lockedAt;
            delete dbUpdates.lockedAt;
        }
        if (updates.lockedBy !== undefined) {
            dbUpdates.locked_by = updates.lockedBy;
            delete dbUpdates.lockedBy;
        }
        // Movement Rules
        if (updates.allowPicking !== undefined) {
            dbUpdates.allow_picking = updates.allowPicking;
            delete dbUpdates.allowPicking;
        }
        if (updates.allowPutaway !== undefined) {
            dbUpdates.allow_putaway = updates.allowPutaway;
            delete dbUpdates.allowPutaway;
        }
        if (updates.capacity !== undefined) {
            // No rename needed if DB col is 'capacity', but types has it same
        }
        if (updates.occupied !== undefined) {
            // No rename needed
        }

        delete dbUpdates.id;

        const { data, error } = await supabase
            .from('warehouse_zones')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            pickingPriority: data.picking_priority,
            zoneType: data.zone_type,
            isLocked: data.is_locked,
            lockReason: data.lock_reason,
            lockedAt: data.locked_at,
            lockedBy: data.locked_by,
            allowPicking: data.allow_picking,
            allowPutaway: data.allow_putaway,
            capacity: data.capacity,
            occupied: data.occupied
        };
    },

    async create(zone: Omit<WarehouseZone, 'id'>) {
        // Generate a UUID if not provided/auto-generated
        // Mapping
        const dbZone = {
            name: zone.name,
            site_id: zone.siteId,
            type: zone.type,
            zone_type: zone.zoneType,
            picking_priority: zone.pickingPriority || 10,
            capacity: zone.capacity || 0,
            allow_picking: zone.allowPicking ?? true,
            allow_putaway: zone.allowPutaway ?? true,
            status: zone.status || 'Active'
        };

        const { data, error } = await supabase
            .from('warehouse_zones')
            .insert(dbZone)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            pickingPriority: data.picking_priority,
            zoneType: data.zone_type,
            isLocked: data.is_locked,
            lockReason: data.lock_reason,
            lockedAt: data.locked_at,
            lockedBy: data.locked_by,
            allowPicking: data.allow_picking,
            allowPutaway: data.allow_putaway,
            capacity: data.capacity,
            occupied: data.occupied
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
