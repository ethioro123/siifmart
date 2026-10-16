import { supabase } from '../lib/supabase';
import type { TransferRecord } from '../types';
import { generateTransferId } from './wms-jobs.service';

export const transfersService = {
    async getAll(siteId?: string, limit: number = 25, regionCode?: string, countryCode?: string): Promise<TransferRecord[]> {
        // 1. Active Transfers (Not Received/Cancelled)
        let activeQuery = supabase
            .from('transfers')
            .select('*')
            .not('status', 'in', '("Received","Cancelled")')
            .order('created_at', { ascending: true });

        if (siteId) {
            activeQuery = activeQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }
        if (regionCode) {
            activeQuery = activeQuery.or(`source_region_code.eq.${regionCode},dest_region_code.eq.${regionCode}`);
        }
        if (countryCode) {
            activeQuery = activeQuery.eq('country_code', countryCode.toUpperCase());
        }

        // 2. Historical Transfers (Received/Cancelled/Completed/Delivered) - Limited (RULE 10 default 25)
        let historyQuery = supabase
            .from('transfers')
            .select('*')
            .in('status', ['Received', 'Cancelled', 'Completed', 'Delivered'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (siteId) {
            historyQuery = historyQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }
        if (regionCode) {
            historyQuery = historyQuery.or(`source_region_code.eq.${regionCode},dest_region_code.eq.${regionCode}`);
        }
        if (countryCode) {
            historyQuery = historyQuery.eq('country_code', countryCode.toUpperCase());
        }

        const [activeRes, historyRes] = await Promise.all([activeQuery, historyQuery]);

        if (activeRes.error) throw activeRes.error;
        if (historyRes.error) throw historyRes.error;

        const combinedData = [...(activeRes.data || []), ...(historyRes.data || [])];
        return combinedData.map(t => ({
            ...t,
            sourceSiteId: t.source_site_id,
            destSiteId: t.dest_site_id,
            date: t.transfer_date,
            orderRef: t.order_ref,
            transferStatus: t.transfer_status,
            requestedBy: t.requested_by,
            shippedAt: t.shipped_at,
            deliveredAt: t.delivered_at,
            receivedAt: t.received_at,
            hasDiscrepancy: t.has_discrepancy,
            discrepancyDetails: t.discrepancy_details,
            discrepancyResolutionType: t.discrepancy_resolution_type,
            discrepancy_resolution_type: t.discrepancy_resolution_type,
            discrepancyReasonCode: t.discrepancy_reason_code,
            discrepancy_reason_code: t.discrepancy_reason_code,
            discrepancyResolvedBy: t.discrepancy_resolved_by,
            discrepancy_resolved_by: t.discrepancy_resolved_by,
            discrepancyResolvedAt: t.discrepancy_resolved_at,
            discrepancy_resolved_at: t.discrepancy_resolved_at,
            sourceRegionCode: t.source_region_code,
            source_region_code: t.source_region_code,
            destRegionCode: t.dest_region_code,
            dest_region_code: t.dest_region_code,
            countryCode: t.country_code,
            country_code: t.country_code,
            isInterRegion: t.is_inter_region ?? (t.source_region_code && t.dest_region_code && t.source_region_code !== t.dest_region_code),
            is_inter_region: t.is_inter_region ?? (t.source_region_code && t.dest_region_code && t.source_region_code !== t.dest_region_code),
            driverType: t.driver_type || 'INTERNAL',
            driver_type: t.driver_type || 'INTERNAL',
            driverId: t.driver_id,
            driver_id: t.driver_id,
            driverName: t.driver_name,
            driver_name: t.driver_name,
            dispatchedAt: t.dispatched_at,
            dispatched_at: t.dispatched_at,
            dispatchedBy: t.dispatched_by,
            dispatched_by: t.dispatched_by
        }));
    },

    async create(transfer: Omit<TransferRecord, 'id' | 'sourceSiteName' | 'destSiteName'>): Promise<TransferRecord> {
        // Enforce Multi-Country Sovereignty: verify both sites are within the same sovereign country
        let sourceRegion = transfer.sourceRegionCode || (transfer as any).source_region_code;
        let destRegion = transfer.destRegionCode || (transfer as any).dest_region_code;
        let country = (transfer.countryCode || (transfer as any).country_code || '').toUpperCase();

        if (transfer.sourceSiteId && transfer.destSiteId) {
            const { data: sites, error: siteErr } = await supabase
                .from('sites')
                .select('id, country, region_code')
                .in('id', [transfer.sourceSiteId, transfer.destSiteId]);

            if (!siteErr && sites && sites.length > 0) {
                const src = sites.find(s => s.id === transfer.sourceSiteId);
                const dst = sites.find(s => s.id === transfer.destSiteId);

                if (src && dst && src.country && dst.country && src.country.toUpperCase() !== dst.country.toUpperCase()) {
                    throw new Error(
                        `Multi-country sovereignty violation: Cross-border stock transfers between ${src.country} and ${dst.country} are strictly prohibited.`
                    );
                }

                if (src) {
                    if (!country && src.country) country = src.country.toUpperCase();
                    if (!sourceRegion && src.region_code) sourceRegion = src.region_code;
                }
                if (dst && !destRegion && dst.region_code) {
                    destRegion = dst.region_code;
                }
            }
        }

        const isInterRegion = !!(sourceRegion && destRegion && sourceRegion !== destRegion);

        const dbTransfer = {
            source_site_id: transfer.sourceSiteId,
            dest_site_id: transfer.destSiteId,
            status: transfer.status || 'Requested',
            transfer_date: transfer.date || new Date().toISOString().split('T')[0],
            items: transfer.items,
            order_ref: transfer.orderRef || generateTransferId(),
            source_region_code: sourceRegion || null,
            dest_region_code: destRegion || null,
            country_code: country || 'ET',
            is_inter_region: isInterRegion,
            requested_by: transfer.requestedBy || null,
            notes: transfer.notes || null,
        };

        const { data, error } = await supabase
            .from('transfers')
            .insert(dbTransfer)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            date: data.transfer_date,
            orderRef: data.order_ref,
            transferStatus: data.transfer_status,
            sourceRegionCode: data.source_region_code,
            source_region_code: data.source_region_code,
            destRegionCode: data.dest_region_code,
            dest_region_code: data.dest_region_code,
            countryCode: data.country_code,
            country_code: data.country_code,
            isInterRegion: data.is_inter_region,
            is_inter_region: data.is_inter_region,
            requestedBy: data.requested_by,
            shippedAt: data.shipped_at,
            deliveredAt: data.delivered_at,
            receivedAt: data.received_at,
            receivedBy: data.received_by
        };
    },

    async update(id: string, updates: Partial<TransferRecord>): Promise<TransferRecord> {
        const dbUpdates: any = { ...updates };
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.hasDiscrepancy !== undefined) { dbUpdates.has_discrepancy = updates.hasDiscrepancy; delete dbUpdates.hasDiscrepancy; }
        if (updates.discrepancyDetails !== undefined) { dbUpdates.discrepancy_details = updates.discrepancyDetails; delete dbUpdates.discrepancyDetails; }
        if (updates.discrepancyResolutionType !== undefined) { dbUpdates.discrepancy_resolution_type = updates.discrepancyResolutionType; delete dbUpdates.discrepancyResolutionType; }
        if (updates.discrepancyReasonCode !== undefined) { dbUpdates.discrepancy_reason_code = updates.discrepancyReasonCode; delete dbUpdates.discrepancyReasonCode; }
        if (updates.discrepancyResolvedBy !== undefined) { dbUpdates.discrepancy_resolved_by = updates.discrepancyResolvedBy; delete dbUpdates.discrepancyResolvedBy; }
        if (updates.discrepancyResolvedAt !== undefined) { dbUpdates.discrepancy_resolved_at = updates.discrepancyResolvedAt; delete dbUpdates.discrepancyResolvedAt; }
        if (updates.transferStatus !== undefined) { dbUpdates.transfer_status = updates.transferStatus; delete dbUpdates.transferStatus; }
        if (updates.shippedAt !== undefined) { dbUpdates.shipped_at = updates.shippedAt; delete dbUpdates.shippedAt; }
        if (updates.deliveredAt !== undefined) { dbUpdates.delivered_at = updates.deliveredAt; delete dbUpdates.deliveredAt; }
        if (updates.receivedAt !== undefined) { dbUpdates.received_at = updates.receivedAt; delete dbUpdates.receivedAt; }
        if (updates.receivedBy !== undefined) { dbUpdates.received_by = updates.receivedBy; delete dbUpdates.receivedBy; }
        if (updates.driverType !== undefined) { dbUpdates.driver_type = updates.driverType; delete dbUpdates.driverType; }
        if (updates.driverId !== undefined) { dbUpdates.driver_id = updates.driverId; delete dbUpdates.driverId; }
        if (updates.driverName !== undefined) { dbUpdates.driver_name = updates.driverName; delete dbUpdates.driverName; }
        if (updates.dispatchedAt !== undefined) { dbUpdates.dispatched_at = updates.dispatchedAt; delete dbUpdates.dispatchedAt; }
        if (updates.dispatchedBy !== undefined) { dbUpdates.dispatched_by = updates.dispatchedBy; delete dbUpdates.dispatchedBy; }

        // Clean client-only fields before sending to supabase
        delete dbUpdates.sourceSiteId;
        delete dbUpdates.destSiteId;
        delete dbUpdates.sourceSiteName;
        delete dbUpdates.destSiteName;
        delete dbUpdates.sourceRegionCode;
        delete dbUpdates.destRegionCode;
        delete dbUpdates.countryCode;
        delete dbUpdates.isInterRegion;

        const { data, error } = await supabase
            .from('transfers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            date: data.transfer_date,
            orderRef: data.order_ref,
            hasDiscrepancy: data.has_discrepancy,
            discrepancyDetails: data.discrepancy_details,
            discrepancyResolutionType: data.discrepancy_resolution_type,
            discrepancy_resolution_type: data.discrepancy_resolution_type,
            discrepancyReasonCode: data.discrepancy_reason_code,
            discrepancy_reason_code: data.discrepancy_reason_code,
            discrepancyResolvedBy: data.discrepancy_resolved_by,
            discrepancy_resolved_by: data.discrepancy_resolved_by,
            discrepancyResolvedAt: data.discrepancy_resolved_at,
            discrepancy_resolved_at: data.discrepancy_resolved_at,
            notes: data.notes,
            transferStatus: data.transfer_status,
            sourceRegionCode: data.source_region_code,
            source_region_code: data.source_region_code,
            destRegionCode: data.dest_region_code,
            dest_region_code: data.dest_region_code,
            countryCode: data.country_code,
            country_code: data.country_code,
            isInterRegion: data.is_inter_region,
            is_inter_region: data.is_inter_region,
            requestedBy: data.requested_by,
            shippedAt: data.shipped_at,
            deliveredAt: data.delivered_at,
            receivedAt: data.received_at,
            receivedBy: data.received_by,
            driverType: data.driver_type || 'INTERNAL',
            driver_type: data.driver_type || 'INTERNAL',
            driverId: data.driver_id,
            driver_id: data.driver_id,
            driverName: data.driver_name,
            driver_name: data.driver_name,
            dispatchedAt: data.dispatched_at,
            dispatched_at: data.dispatched_at,
            dispatchedBy: data.dispatched_by,
            dispatched_by: data.dispatched_by
        };
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('transfers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
