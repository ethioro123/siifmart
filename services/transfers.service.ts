import { blindReceivingService } from './blind-receiving.service';
import { supabase } from '../lib/supabase';
import type { TransferRecord } from '../types';
import { generateTransferId } from './wms-jobs.service';
import { logger } from '../utils/logger';

function mapTransferRow(t: any): TransferRecord {
    return {
        ...t,
        sourceSiteId: t.source_site_id,
        source_site_id: t.source_site_id,
        destSiteId: t.dest_site_id,
        dest_site_id: t.dest_site_id,
        date: t.transfer_date,
        orderRef: t.order_ref,
        transferStatus: t.transfer_status || t.status,
        requestedBy: t.requested_by,
        shippedAt: t.shipped_at,
        deliveredAt: t.delivered_at,
        receivedAt: t.received_at,
        receivedBy: t.received_by,
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
        dispatched_by: t.dispatched_by,
        approvedBy: t.approved_by,
        approved_by: t.approved_by,
        approvedAt: t.approved_at,
        approved_at: t.approved_at,
        approvedByRole: t.approved_by_role,
        approved_by_role: t.approved_by_role,
        approvalNotes: t.approval_notes,
        approval_notes: t.approval_notes
    };
}

export const transfersService = {
    /**
     * Fetches transfers with strict pagination, query partitioning and deduplication.
     * Prevents unbounded downloads and duplicate records between active and historical views.
     */
    async getAll(siteId?: string, limit: number = 25, regionCode?: string, countryCode?: string): Promise<TransferRecord[]> {
        const safeLimit = Math.max(1, Math.min(limit || 25, 100));

        // 1. Active In-Flight Transfers (strictly exclude terminal states)
        let activeQuery = supabase
            .from('transfers')
            .select('*')
            .not('status', 'in', '("Received","Cancelled","Completed","Delivered","Rejected")')
            .order('created_at', { ascending: true })
            .limit(safeLimit * 2);

        if (siteId) {
            activeQuery = activeQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }
        if (regionCode) {
            activeQuery = activeQuery.or(`source_region_code.eq.${regionCode},dest_region_code.eq.${regionCode}`);
        }
        if (countryCode) {
            activeQuery = activeQuery.eq('country_code', countryCode.toUpperCase());
        }

        // 2. Historical Closed Transfers (strictly limited to safeLimit)
        let historyQuery = supabase
            .from('transfers')
            .select('*')
            .in('status', ['Received', 'Cancelled', 'Completed', 'Delivered', 'Rejected'])
            .order('created_at', { ascending: false })
            .limit(safeLimit);

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

        // 3. Deduplicate strictly by ID
        const seenIds = new Set<string>();
        const combinedData: TransferRecord[] = [];

        for (const raw of [...(activeRes.data || []), ...(historyRes.data || []), ...(siteId ? await blindReceivingService.transfers(siteId,countryCode) : [])]) {
            if (raw.id && !seenIds.has(raw.id)) {
                seenIds.add(raw.id);
                combinedData.push(mapTransferRow(raw));
            }
        }

        return combinedData;
    },

    async getById(id: string): Promise<TransferRecord | null> {
        const { data, error } = await supabase
            .from('transfers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            logger.error('transfersService', `Failed to get transfer ${id}:`, error);
            throw error;
        }

        return data ? mapTransferRow(data) : null;
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
        return mapTransferRow(data);
    },

    /**
     * Approves a stock transfer using Server-Side SECURITY DEFINER RPC.
     * Enforces inter-regional HQ authority guards and synchronizes wms_jobs.
     */
    async approve(
        id: string,
        approver: { approverId?: string; approverName: string; approverRole: string; notes?: string }
    ): Promise<TransferRecord> {
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('approve_transfer', {
                p_transfer_id: id,
                p_approver_id: approver.approverId || 'unknown',
                p_approver_name: approver.approverName,
                p_approver_role: approver.approverRole,
                p_notes: approver.notes || ''
            });

            if (!rpcError && rpcData?.success) {
                const fresh = await this.getById(id);
                if (fresh) return fresh;
            }

            if (rpcError) {
                const msg = rpcError.message || '';
                if (
                    msg.includes('Authority Boundary Violation') ||
                    msg.includes('Segregation of Duties') ||
                    msg.includes('Zero-Trust') ||
                    msg.includes('Status Guard')
                ) {
                    throw new Error(msg);
                }
                logger.warn('transfersService', 'RPC approve_transfer failed, falling back:', { error: String(rpcError.message) });
            }
        } catch (rpcErr: any) {
            if (
                rpcErr.message?.includes('Authority Boundary Violation') ||
                rpcErr.message?.includes('Segregation of Duties') ||
                rpcErr.message?.includes('Zero-Trust')
            ) {
                throw rpcErr;
            }
        }

        const now = new Date().toISOString();
        return this.update(id, {
            status: 'Approved',
            transferStatus: 'Approved',
            approvedBy: approver.approverName,
            approvedAt: now,
            approvedByRole: approver.approverRole,
            approvalNotes: approver.notes || ''
        } as any);
    },

    /**
     * Completes a transfer receipt atomically via database RPC.
     */
    async receiveAtomic(
        id: string,
        receiver: {
            receiverId?: string;
            receiverName: string;
            receiverRole?: string;
            hasDiscrepancy?: boolean;
            discrepancyDetails?: string;
            notes?: string;
        }
    ): Promise<TransferRecord> {
        const { data, error } = await supabase.rpc('receive_transfer_atomic', {
            p_transfer_id: id,
            p_receiver_id: receiver.receiverId || 'unknown',
            p_receiver_name: receiver.receiverName,
            p_receiver_role: receiver.receiverRole || 'receiver',
            p_has_discrepancy: receiver.hasDiscrepancy || false,
            p_discrepancy_details: receiver.discrepancyDetails || null,
            p_notes: receiver.notes || ''
        });
        if (error) throw error;
        if (!data?.success) throw new Error('Server did not confirm transfer receipt.');
        const fresh = await this.getById(id);
        if (!fresh) throw new Error('Confirmed transfer receipt could not be loaded.');
        return fresh;
    },

    /**
     * Updates transfer record and synchronously propagates status changes to linked WMS Jobs.
     */
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
        if ((updates as any).approvedBy !== undefined) { dbUpdates.approved_by = (updates as any).approvedBy; delete dbUpdates.approvedBy; }
        if ((updates as any).approved_by !== undefined) { dbUpdates.approved_by = (updates as any).approved_by; }
        if ((updates as any).approvedAt !== undefined) { dbUpdates.approved_at = (updates as any).approvedAt; delete dbUpdates.approvedAt; }
        if ((updates as any).approved_at !== undefined) { dbUpdates.approved_at = (updates as any).approved_at; }
        if ((updates as any).approvedByRole !== undefined) { dbUpdates.approved_by_role = (updates as any).approvedByRole; delete dbUpdates.approvedByRole; }
        if ((updates as any).approvalNotes !== undefined) { dbUpdates.approval_notes = (updates as any).approvalNotes; delete dbUpdates.approvalNotes; }

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

        // Synchronize linked wms_jobs record when lifecycle status changes
        if (updates.status || updates.transferStatus) {
            try {
                const wmsUpdates: Record<string, any> = {
                    updated_at: new Date().toISOString()
                };
                if (updates.transferStatus) wmsUpdates.transfer_status = updates.transferStatus;
                else if (updates.status) wmsUpdates.transfer_status = updates.status;

                if (updates.status === 'Completed' || updates.status === 'Received') {
                    wmsUpdates.status = 'Completed';
                    wmsUpdates.transfer_status = 'Received';
                    if (updates.receivedAt) wmsUpdates.received_at = updates.receivedAt;
                    if (updates.receivedBy) wmsUpdates.received_by = updates.receivedBy;
                } else if (updates.status === 'Cancelled' || updates.status === 'Rejected') {
                    wmsUpdates.status = 'Cancelled';
                }

                await supabase
                    .from('wms_jobs')
                    .update(wmsUpdates)
                    .or(`id.eq.${id},order_ref.eq.${id}`)
                    .eq('type', 'TRANSFER');
            } catch (syncErr) {
                logger.warn('transfersService', 'WMS job dual-record synchronization notice:', { error: String(syncErr) });
            }
        }

        return mapTransferRow(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('transfers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
