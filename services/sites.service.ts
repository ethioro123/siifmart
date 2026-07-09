import { supabase } from '../lib/supabase';
import type { Site } from '../types';

// Helper: fetch all replenishment source IDs for a list of site IDs
async function fetchReplenishmentSourceIds(siteIds: string[]): Promise<Record<string, string[]>> {
    if (!siteIds.length) return {};
    const { data, error } = await supabase
        .from('site_replenishment_sources')
        .select('site_id, source_site_id')
        .in('site_id', siteIds);
    if (error || !data) return {};
    const map: Record<string, string[]> = {};
    for (const row of data) {
        if (!map[row.site_id]) map[row.site_id] = [];
        map[row.site_id].push(row.source_site_id);
    }
    return map;
}

// Helper: replace all replenishment source associations for a site
async function upsertReplenishmentSources(siteId: string, sourceIds: string[]): Promise<void> {
    // Delete existing
    await supabase
        .from('site_replenishment_sources')
        .delete()
        .eq('site_id', siteId);

    if (!sourceIds.length) return;

    // Insert new
    const rows = sourceIds.map(id => ({ site_id: siteId, source_site_id: id }));
    const { error } = await supabase.from('site_replenishment_sources').insert(rows);
    if (error) throw error;
}

function mapSiteRow(s: any, replenishmentSourceIds: string[]): any {
    const ids = replenishmentSourceIds ?? [];
    return {
        ...s,
        logisticsZoneId: s.logistics_zone_id,
        terminalCount: s.terminal_count,
        bonusEnabled: s.bonus_enabled,
        warehouseBonusEnabled: s.warehouse_bonus_enabled,
        zoneCount: s.zone_count,
        aisleCount: s.aisle_count,
        binCount: s.bin_count,
        taxJurisdictionId: s.tax_jurisdiction_id,
        fulfillmentStrategy: s.fulfillment_strategy,
        isFulfillmentNode: s.is_fulfillment_node,
        code: s.code || s.id.substring(0, 8).toUpperCase(),
        siteNumber: s.site_number,
        barcodePrefix: s.barcode_prefix,
        // Legacy single-source field kept for backward compatibility
        replenishmentSourceId: ids[0] ?? s.replenishment_source_id ?? undefined,
        // New many-to-many field
        replenishmentSourceIds: ids.length > 0 ? ids : (s.replenishment_source_id ? [s.replenishment_source_id] : []),
    };
}

export const sitesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const siteIds = data.map((s: any) => s.id);
        const sourcesMap = await fetchReplenishmentSourceIds(siteIds);

        return data.map((s: any) => mapSiteRow(s, sourcesMap[s.id] ?? []));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const sourcesMap = await fetchReplenishmentSourceIds([id]);
        return mapSiteRow(data, sourcesMap[id] ?? []);
    },

    async create(site: Omit<Site, 'id' | 'created_at' | 'updated_at'>) {
        const { data: allSites } = await supabase
            .from('sites')
            .select('code');

        let nextId = 1;
        if (allSites && allSites.length > 0) {
            const maxId = allSites.reduce((max, s) => {
                const match = s.code?.match(/SITE-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    return num > max ? num : max;
                }
                return max;
            }, 0);
            nextId = maxId + 1;
        }

        const newCode = `SITE-${nextId.toString().padStart(4, '0')}`;

        // Resolve legacy single-source field from new multi-source array
        const sourceIds: string[] = site.replenishmentSourceIds ?? (site.replenishmentSourceId ? [site.replenishmentSourceId] : []);

        const dbSite = {
            name: site.name,
            code: newCode,
            type: site.type,
            address: site.address,
            status: site.status,
            manager: site.manager,
            capacity: site.capacity,
            terminal_count: site.terminalCount,
            bonus_enabled: site.bonusEnabled,
            warehouse_bonus_enabled: site.warehouseBonusEnabled,
            fulfillment_strategy: site.fulfillmentStrategy || 'NEAREST',
            is_fulfillment_node: site.isFulfillmentNode !== undefined ? site.isFulfillmentNode : true,
            barcode_prefix: (site.type === 'Warehouse' || site.type === 'Distribution Center')
                ? nextId.toString().padStart(4, '0')
                : null,
            // Keep legacy field in sync with first source
            replenishment_source_id: sourceIds[0] ?? null,
            logistics_zone_id: site.logisticsZoneId ?? null,
            site_number: nextId
        };

        const { data, error } = await supabase
            .from('sites')
            .insert(dbSite)
            .select()
            .single();

        if (error) throw error;

        // Write join table associations
        if (sourceIds.length > 0) {
            await upsertReplenishmentSources(data.id, sourceIds);
        }

        return mapSiteRow(data, sourceIds);
    },

    async update(id: string, updates: Partial<Site>) {
        // ALLOWLIST approach: only send known DB columns to Supabase.
        // Never spread the full Site object — camelCase-only fields cause 400 errors.
        const dbUpdates: Record<string, unknown> = {};

        // Fields with identical names in TypeScript and the DB:
        const directFields: (keyof Site)[] = [
            'name', 'type', 'address', 'contact', 'status',
            'manager', 'capacity', 'language', 'latitude', 'longitude', 'region',
        ];
        for (const field of directFields) {
            if (updates[field] !== undefined) dbUpdates[field] = updates[field];
        }

        // Fields requiring camelCase → snake_case mapping:
        const fieldMap: [keyof Site, string][] = [
            ['terminalCount', 'terminal_count'],
            ['bonusEnabled', 'bonus_enabled'],
            ['warehouseBonusEnabled', 'warehouse_bonus_enabled'],
            ['taxJurisdictionId', 'tax_jurisdiction_id'],
            ['fulfillmentStrategy', 'fulfillment_strategy'],
            ['isFulfillmentNode', 'is_fulfillment_node'],
            ['logisticsZoneId', 'logistics_zone_id'],
            ['zoneCount', 'zone_count'],
            ['aisleCount', 'aisle_count'],
            ['binCount', 'bin_count'],
        ];
        for (const [tsKey, dbKey] of fieldMap) {
            if (updates[tsKey] !== undefined) dbUpdates[dbKey] = updates[tsKey];
        }

        // Compute new source IDs from multi-source array (falling back to single-source)
        const sourceIds: string[] | null =
            updates.replenishmentSourceIds !== undefined
                ? updates.replenishmentSourceIds
                : updates.replenishmentSourceId !== undefined
                    ? (updates.replenishmentSourceId ? [updates.replenishmentSourceId] : [])
                    : null; // null sentinel = don't update

        const shouldUpdateSources = sourceIds !== null;

        // Keep legacy single-source field in sync
        if (shouldUpdateSources) {
            dbUpdates.replenishment_source_id = sourceIds.length > 0 ? sourceIds[0] : null;
        }

        const { data, error } = await supabase
            .from('sites')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update join table if source IDs were explicitly provided
        if (shouldUpdateSources) {
            await upsertReplenishmentSources(id, sourceIds);
        }

        const finalSourceIds = shouldUpdateSources
            ? sourceIds
            : (await fetchReplenishmentSourceIds([id]))[id] ?? [];

        return mapSiteRow(data, finalSourceIds);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getAllActiveFulfillmentNodes() {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('status', 'Active')
            .or('type.eq.Warehouse,is_fulfillment_node.eq.true');

        if (error) throw error;

        const siteIds = data.map((s: any) => s.id);
        const sourcesMap = await fetchReplenishmentSourceIds(siteIds);

        return data.map((s: any) => mapSiteRow(s, sourcesMap[s.id] ?? []));
    }
};
