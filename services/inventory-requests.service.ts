import { supabase } from '../lib/supabase';
import type { PendingInventoryChange } from '../types';
import { logger } from '../utils/logger';

export const inventoryRequestsService = {
    async getAll(siteId?: string, countryCode?: string, limit: number = 25, regionCode?: string): Promise<PendingInventoryChange[]> {
        // RULE 10: 25-record shelf limit
        let query = supabase.from('inventory_requests').select('*').limit(limit);
        if (siteId) query = query.eq('site_id', siteId);
        if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
        if (regionCode) query = query.eq('region_code', regionCode);

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) throw error;

        return (data || []).map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSku: r.product_sku,
            siteId: r.site_id,
            countryCode: r.country_code,
            regionCode: r.region_code,
            region_code: r.region_code,
            changeType: r.change_type,
            requestedBy: r.requested_by,
            requestedAt: r.requested_at,
            status: r.status,
            proposedChanges: r.proposed_changes,
            adjustmentType: r.adjustment_type,
            adjustmentQty: r.adjustment_qty,
            adjustmentReason: r.adjustment_reason,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            rejectionReason: r.rejection_reason,
            rejectedBy: r.rejected_by,
            rejectedAt: r.rejected_at
        }));
    },

    async create(request: Omit<PendingInventoryChange, 'id'>) {
        let country = request.countryCode || (request as any).country_code;
        let regionCode = request.regionCode || (request as any).region_code;

        // Resilient resolution: if country or region is missing, fetch from sites table
        if ((!country || !regionCode) && request.siteId) {
            try {
                const { data: site } = await supabase
                    .from('sites')
                    .select('country, region_code')
                    .eq('id', request.siteId)
                    .maybeSingle();
                if (site) {
                    if (!country && site.country) {
                        country = site.country;
                    }
                    if (!regionCode && site.region_code) {
                        regionCode = site.region_code;
                    }
                }
            } catch (err) {
                logger.warn('inventoryRequestsService', 'Could not resolve country/region for site', { siteId: request.siteId });
            }
        }

        const resolvedCountry = (country || 'ET').toUpperCase();

        const insertPayload = {
            site_id: request.siteId,
            country_code: resolvedCountry,
            region_code: regionCode || null,
            product_id: request.productId || null,
            product_name: request.productName,
            product_sku: request.productSku,
            change_type: request.changeType,
            requested_by: request.requestedBy,
            status: request.status || 'pending',
            approved_by: request.approvedBy || null,
            approved_at: request.approvedAt || null,
            proposed_changes: request.proposedChanges,
            adjustment_type: request.adjustmentType,
            adjustment_qty: request.adjustmentQty,
            adjustment_reason: request.adjustmentReason
        };

        const { data, error } = await supabase
            .from('inventory_requests')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            logger.error('inventoryRequestsService', 'create FAILED:', error);
            throw error;
        }
        return {
            ...data,
            siteId: data.site_id,
            productId: data.product_id,
            productName: data.product_name,
            productSku: data.product_sku,
            changeType: data.change_type,
            requestedBy: data.requested_by,
            requestedAt: data.requested_at,
            countryCode: data.country_code,
            regionCode: data.region_code,
            region_code: data.region_code,
            proposedChanges: data.proposed_changes,
            adjustmentType: data.adjustment_type,
            adjustmentQty: data.adjustment_qty,
            adjustmentReason: data.adjustment_reason
        };
    },

    async update(id: string, updates: Partial<PendingInventoryChange>) {
        const dbUpdates: any = {
            status: updates.status,
            approved_by: updates.approvedBy,
            approved_at: updates.approvedAt,
            rejection_reason: updates.rejectionReason,
            rejected_by: updates.rejectedBy,
            rejected_at: updates.rejectedAt
        };

        // Remove undefined values to avoid overwriting with null
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) delete dbUpdates[key];
        });

        const { data, error } = await supabase
            .from('inventory_requests')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('inventoryRequestsService', 'update FAILED:', error);
            throw error;
        }

        return {
            ...data,
            siteId: data.site_id,
            productId: data.product_id,
            productName: data.product_name,
            productSku: data.product_sku,
            changeType: data.change_type,
            requestedBy: data.requested_by,
            requestedAt: data.requested_at,
            countryCode: data.country_code,
            regionCode: data.region_code,
            region_code: data.region_code,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at
        };
    },

    async delete(id: string) {
        const { error } = await supabase.from('inventory_requests').delete().eq('id', id);
        if (error) {
            logger.error('inventoryRequestsService', 'delete FAILED:', error);
            throw error;
        }
    }
};
