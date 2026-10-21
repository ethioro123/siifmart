import { supabase } from '../lib/supabase';
import type { Site } from '../types';
import type { Country } from '../utils/localization';
import { getEffectiveCountry, getCountryProfile } from '../utils/localization';
import { getCountryAdminDefaults } from '../utils/countryAdmin';
import { generateNextSiteCode, formatDisplaySiteId, isPlaceSpecificCode, generatePlaceSpecificSiteCode } from '../utils/siteIdGenerator';

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
    const country = s.country || getEffectiveCountry({ country: s.country, currency: s.currency });
    const profile = getCountryProfile(country);
    const currency = s.currency || profile.currency;
    return {
        ...s,
        country,
        currency,
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
        code: (s.code && isPlaceSpecificCode(s.code))
            ? s.code
            : formatDisplaySiteId({ ...s, country, currency }) || s.code || s.id.substring(0, 8).toUpperCase(),
        siteNumber: s.site_number,
        barcodePrefix: s.barcode_prefix,
        regionCode: s.region_code,
        region_code: s.region_code,
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
            .neq('type', 'Dark Store')
            .neq('type', 'Online Store')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Auto-provision Administration HQ for active supported countries if missing
        const supportedCountries: Country[] = ['ET', 'KE', 'UG', 'RW', 'TZ'];
        for (const c of supportedCountries) {
            const hasAdmin = data.some((s: any) =>
                (s.country || 'ET').toUpperCase() === c &&
                ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations'].includes(s.type || '')
            );
            if (!hasAdmin) {
                try {
                    const defaults = getCountryAdminDefaults(c);
                    const newAdmin = await this.create({
                        name: defaults.name,
                        code: defaults.code,
                        type: defaults.type,
                        address: defaults.address,
                        status: defaults.status,
                        manager: defaults.manager,
                        country: defaults.country,
                        currency: defaults.currency,
                        region: defaults.region,
                        isFulfillmentNode: false
                    });
                    if (newAdmin) {
                        data.unshift(newAdmin);
                    }
                } catch {
                    // Non-blocking in case of offline or RLS restrictions
                }
            }
        }

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
        if (data.type === 'Dark Store' || data.type === 'Online Store') {
            throw new Error('This legacy online store site is retired. Use a warehouse or distribution center.');
        }

        const sourcesMap = await fetchReplenishmentSourceIds([id]);
        return mapSiteRow(data, sourcesMap[id] ?? []);
    },

    async create(site: Omit<Site, 'id' | 'created_at' | 'updated_at'>) {
        if (!['Administration', 'Administrative', 'Central Operations', 'Warehouse', 'Store', 'Distribution Center', 'HQ', 'Headquarters'].includes(site.type)) {
            throw new Error('Choose an administration, warehouse, distribution center, or retail store site.');
        }
        const siteCountry = site.country || getEffectiveCountry({ country: site.country, currency: site.currency });
        const siteCurrency = site.currency || getCountryProfile(siteCountry).currency;
        const countryCode = (siteCountry || 'ET').toUpperCase();

        const { data: allSites } = await supabase
            .from('sites')
            .select('code, site_number, country');

        if (!(site.region_code || site.regionCode)) {
            throw new Error('Operational region is mandatory. Every location must belong to a region.');
        }

        let nextSiteNum = 1;
        if (allSites && allSites.length > 0) {
            const maxId = allSites.reduce((max, s: any) => {
                const siteNum = typeof s.site_number === 'number' ? s.site_number : 0;
                return Math.max(max, siteNum);
            }, 0);
            nextSiteNum = maxId + 1;
        }

        // Generate clean operational site ID: [COUNTRY]-[ZONE]-[TYPE]-[UNIQUE_NUMBER]
        const placeSpecificCode = generatePlaceSpecificSiteCode({
            country: countryCode,
            regionCode: site.region_code || site.regionCode,
            type: site.type,
            name: site.name,
            siteNumber: nextSiteNum,
            existingSites: allSites || []
        });
        const resolvedCode = site.code && site.code !== 'GENERATED_BY_DB' ? site.code : placeSpecificCode;

        // Resolve legacy single-source field from new multi-source array
        const sourceIds: string[] = site.replenishmentSourceIds ?? (site.replenishmentSourceId ? [site.replenishmentSourceId] : []);

        const dbSite: Record<string, any> = {
            name: site.name,
            code: resolvedCode,
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
                ? resolvedCode.replace(/^[A-Z]+-/, '').padStart(4, '0')
                : null,
            // Keep legacy field in sync with first source
            replenishment_source_id: sourceIds[0] ?? null,
            logistics_zone_id: site.logisticsZoneId ?? null,
            region_code: site.region_code || site.regionCode || null,
            site_number: nextSiteNum,
            country: siteCountry,
            currency: siteCurrency
        };

        let insertResult = await supabase
            .from('sites')
            .insert(dbSite)
            .select()
            .single();

        if (insertResult.error && (insertResult.error.message?.includes('column "country"') || insertResult.error.message?.includes('column "currency"'))) {
            delete dbSite.country;
            delete dbSite.currency;
            insertResult = await supabase
                .from('sites')
                .insert(dbSite)
                .select()
                .single();
        }

        if (insertResult.error) throw insertResult.error;
        const data = insertResult.data;

        // Write join table associations
        if (sourceIds.length > 0) {
            await upsertReplenishmentSources(data.id, sourceIds);
        }

        return mapSiteRow(data, sourceIds);
    },

    async update(id: string, updates: Partial<Site>) {
        if (updates.type !== undefined && !['Administration', 'Administrative', 'Central Operations', 'Warehouse', 'Store', 'Distribution Center', 'HQ', 'Headquarters'].includes(updates.type)) {
            throw new Error('Online sales use a warehouse or distribution center site.');
        }
        // ALLOWLIST approach: only send known DB columns to Supabase.
        // Never spread the full Site object — camelCase-only fields cause 400 errors.
        const dbUpdates: Record<string, unknown> = {};

        // Fields with identical names in TypeScript and the DB:
        const directFields: (keyof Site)[] = [
            'name', 'type', 'address', 'contact', 'status',
            'manager', 'capacity', 'language', 'latitude', 'longitude', 'region',
            'country', 'currency'
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
            ['regionCode', 'region_code'],
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

        let updateResult = await supabase
            .from('sites')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (updateResult.error && (updateResult.error.message?.includes('column "country"') || updateResult.error.message?.includes('column "currency"'))) {
            delete dbUpdates.country;
            delete dbUpdates.currency;
            updateResult = await supabase
                .from('sites')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();
        }

        if (updateResult.error) throw updateResult.error;
        const data = updateResult.data;

        // Update join table if source IDs were explicitly provided
        if (shouldUpdateSources) {
            await upsertReplenishmentSources(id, sourceIds);
        }

        const finalSourceIds = shouldUpdateSources
            ? sourceIds
            : (await fetchReplenishmentSourceIds([id]))[id] ?? [];

        return mapSiteRow(data, finalSourceIds);
    },

    async ensureCountryAdministrationSite(country: Country): Promise<Site | null> {
        const countryUpper = (country || 'ET').toUpperCase() as Country;
        try {
            const { data, error } = await supabase
                .from('sites')
                .select('*')
                .eq('country', countryUpper)
                .in('type', ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations'])
                .limit(1);

            if (!error && data && data.length > 0) {
                const sourcesMap = await fetchReplenishmentSourceIds([data[0].id]);
                return mapSiteRow(data[0], sourcesMap[data[0].id] ?? []);
            }

            const defaults = getCountryAdminDefaults(countryUpper);
            return await this.create({
                name: defaults.name,
                code: defaults.code,
                type: defaults.type,
                address: defaults.address,
                status: defaults.status,
                manager: defaults.manager,
                country: defaults.country,
                currency: defaults.currency,
                region: defaults.region,
                isFulfillmentNode: false
            });
        } catch (err) {
            console.error(`Failed to ensure Administration HQ for country ${countryUpper}:`, err);
            return null;
        }
    },

    async delete(id: string) {
        // Zero-trust check: Cannot delete the primary Administration site for a country
        const { data: targetSite } = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (targetSite && ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations'].includes(targetSite.type)) {
            const siteCountry = targetSite.country || 'ET';
            const { data: adminSites } = await supabase
                .from('sites')
                .select('id')
                .eq('country', siteCountry)
                .in('type', ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations']);

            if (!adminSites || adminSites.length <= 1) {
                throw new Error(`Cannot delete primary Administration HQ for country ${siteCountry}. Every country must retain an Administration central site.`);
            }
        }

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
