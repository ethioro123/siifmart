import { supabase } from '../lib/supabase';
import type { WarehouseZone } from '../types';
import { logger } from '../utils/logger';

export const warehouseZonesService = {
    async getAll(siteId?: string) {
        try {
            let query = supabase.from('warehouse_zones').select('id,name,site_id,type,zone_type,picking_priority,capacity,occupied,temperature,is_locked,lock_reason,locked_at,locked_by,allow_picking,allow_putaway,specialization,aisle_specializations,accepted_categories,aisle_categories');
            if (siteId) query = query.eq('site_id', siteId);

            const { data, error } = await query.order('picking_priority', { ascending: true });

            if (error) {
                // If picking_priority column is missing, Supabase might return 400/PGRST204
                const isColumnError = error.message.toLowerCase().includes('column') ||
                    error.message.toLowerCase().includes('does not exist') ||
                    error.code === '42703' || error.code === 'PGRST204';

                if (isColumnError) {
                    logger.warn('warehouseZonesService', 'Schema mismatch in warehouse_zones: fallback query without picking_priority order.');
                    let retryQuery = supabase.from('warehouse_zones').select('id,name,site_id,type,zone_type,picking_priority,capacity,occupied,temperature,is_locked,lock_reason,locked_at,locked_by,allow_picking,allow_putaway,specialization,aisle_specializations,accepted_categories,aisle_categories');
                    if (siteId) retryQuery = retryQuery.eq('site_id', siteId);
                    const { data: retryData, error: retryError } = await retryQuery;
                    if (retryError) throw retryError;
                    return (retryData || []).map((z: any) => ({
                        ...z,
                        siteId: z.site_id,
                        specialization: z.specialization ?? null,
                        acceptedCategories: z.accepted_categories ?? [],
                        aisleCategories: z.aisle_categories ?? {},
                        aisleSpecializations: z.aisle_specializations ?? {},
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
                        specialization: z.specialization ?? null,
                        acceptedCategories: z.accepted_categories ?? [],
                        aisleCategories: z.aisle_categories ?? {},
                        aisleSpecializations: z.aisle_specializations ?? {},
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
            throw err; // A failed request is not an empty configured layout.
        }
    },

    async update(id: string, updates: Partial<WarehouseZone>) {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.acceptedCategories !== undefined) dbUpdates.accepted_categories = updates.acceptedCategories;
        if (updates.aisleCategories !== undefined) dbUpdates.aisle_categories = updates.aisleCategories;
        if (updates.specialization !== undefined) dbUpdates.specialization = updates.specialization?.trim() || null;
        if (updates.aisleSpecializations !== undefined) dbUpdates.aisle_specializations = updates.aisleSpecializations;

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

        if (error && (updates.specialization !== undefined || updates.aisleSpecializations !== undefined || updates.acceptedCategories !== undefined || updates.aisleCategories !== undefined)) throw error;
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
            specialization: zone.specialization?.trim() || null,
            accepted_categories: zone.acceptedCategories ?? [],
            aisle_categories: zone.aisleCategories ?? {},
            aisle_specializations: zone.aisleSpecializations ?? {},
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

        if (error && (zone.specialization !== undefined || zone.aisleSpecializations !== undefined || zone.acceptedCategories !== undefined || zone.aisleCategories !== undefined)) throw error;
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
    },

    getStandardDefaultZones(siteId: string): Omit<WarehouseZone, 'id'>[] {
        return [
            { name: 'Zone A', siteId, type: 'Dry', zoneType: 'RECEIVING', pickingPriority: 1, capacity: 5000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone B', siteId, type: 'Dry', zoneType: 'BULK', pickingPriority: 10, capacity: 25000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone C', siteId, type: 'Dry', zoneType: 'STANDARD', pickingPriority: 3, capacity: 10000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone D', siteId, type: 'Dry', zoneType: 'STANDARD', pickingPriority: 5, capacity: 15000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone E', siteId, type: 'Cold', zoneType: 'CHILLED', pickingPriority: 6, capacity: 8000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '4°C' },
            { name: 'Zone F', siteId, type: 'Cold', zoneType: 'FREEZER', pickingPriority: 8, capacity: 6000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '-18°C' },
            { name: 'Zone G', siteId, type: 'Secure', zoneType: 'HIGH_VALUE', pickingPriority: 4, capacity: 2000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone H', siteId, type: 'Dry', zoneType: 'QUARANTINE', pickingPriority: 9, capacity: 3000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone I', siteId, type: 'Dry', zoneType: 'STAGING', pickingPriority: 2, capacity: 5000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
            { name: 'Zone J', siteId, type: 'Dry', zoneType: 'SHIPPING', pickingPriority: 1, capacity: 4000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 }
        ];
    }
};
