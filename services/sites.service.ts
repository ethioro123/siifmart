import { supabase } from '../lib/supabase';
import type { Site } from '../types';

export const sitesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((s: any) => ({
            ...s,
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
            barcodePrefix: s.barcode_prefix
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            bonusEnabled: data.bonus_enabled,
            warehouseBonusEnabled: data.warehouse_bonus_enabled,
            zoneCount: data.zone_count,
            aisleCount: data.aisle_count,
            binCount: data.bin_count,
            fulfillmentStrategy: data.fulfillment_strategy,
            isFulfillmentNode: data.is_fulfillment_node,
            code: data.code || data.id.substring(0, 8).toUpperCase(),
            siteNumber: data.site_number,
            barcodePrefix: data.barcode_prefix
        };
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
                : null
        };
        const { data, error } = await supabase
            .from('sites')
            .insert(dbSite)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            bonusEnabled: data.bonus_enabled,
            warehouseBonusEnabled: data.warehouse_bonus_enabled,
            zoneCount: data.zone_count,
            aisleCount: data.aisle_count,
            binCount: data.bin_count,
            code: data.code,
            siteNumber: data.site_number,
            barcodePrefix: data.barcode_prefix
        };
    },

    async update(id: string, updates: Partial<Site>) {
        const dbUpdates: any = { ...updates };
        const fieldsToRemove = ['id', 'created_at', 'updated_at', 'code'];
        fieldsToRemove.forEach(field => delete dbUpdates[field]);

        if (updates.terminalCount !== undefined) {
            dbUpdates.terminal_count = updates.terminalCount;
            delete dbUpdates.terminalCount;
        }
        if (updates.bonusEnabled !== undefined) {
            dbUpdates.bonus_enabled = updates.bonusEnabled;
            delete dbUpdates.bonusEnabled;
        }
        if (updates.warehouseBonusEnabled !== undefined) {
            dbUpdates.warehouse_bonus_enabled = updates.warehouseBonusEnabled;
            delete dbUpdates.warehouseBonusEnabled;
        }
        delete dbUpdates.zoneCount;
        delete dbUpdates.aisleCount;
        delete dbUpdates.binCount;

        if (updates.taxJurisdictionId !== undefined) {
            dbUpdates.tax_jurisdiction_id = updates.taxJurisdictionId;
            delete dbUpdates.taxJurisdictionId;
        }
        if (updates.fulfillmentStrategy !== undefined) {
            dbUpdates.fulfillment_strategy = updates.fulfillmentStrategy;
            delete dbUpdates.fulfillmentStrategy;
        }
        if (updates.isFulfillmentNode !== undefined) {
            dbUpdates.is_fulfillment_node = updates.isFulfillmentNode;
            delete dbUpdates.isFulfillmentNode;
        }

        const { data, error } = await supabase
            .from('sites')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            bonusEnabled: data.bonus_enabled,
            warehouseBonusEnabled: data.warehouse_bonus_enabled,
            taxJurisdictionId: data.tax_jurisdiction_id,
            fulfillmentStrategy: data.fulfillment_strategy,
            isFulfillmentNode: data.is_fulfillment_node,
            siteNumber: data.site_number,
            code: data.code || 'UNK'
        };
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
        return data.map((s: any) => ({
            ...s,
            fulfillmentStrategy: s.fulfillment_strategy,
            isFulfillmentNode: s.is_fulfillment_node
        }));
    }
};
