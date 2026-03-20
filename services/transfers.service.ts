import { supabase } from '../lib/supabase';
import type { TransferRecord } from '../types';
import { generateTransferId } from './wms-jobs.service';

export const transfersService = {
    async getAll(siteId?: string, limit: number = 500) {
        // 1. Active Transfers (Not Received/Cancelled) - Full List
        let activeQuery = supabase
            .from('transfers')
            .select('*')
            .not('status', 'in', '("Received","Cancelled")')
            .order('created_at', { ascending: true });

        if (siteId) {
            activeQuery = activeQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        // 2. Historical Transfers (Received/Cancelled/Completed/Delivered) - Limited
        let historyQuery = supabase
            .from('transfers')
            .select('*')
            .in('status', ['Received', 'Cancelled', 'Completed', 'Delivered'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (siteId) {
            historyQuery = historyQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
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
            receivedBy: t.received_by
        }));
    },



    async create(transfer: Omit<TransferRecord, 'id' | 'sourceSiteName' | 'destSiteName'>) {
        const dbTransfer = {
            source_site_id: transfer.sourceSiteId,
            dest_site_id: transfer.destSiteId,
            status: transfer.status,
            transfer_date: transfer.date,
            items: transfer.items,
            order_ref: transfer.orderRef || generateTransferId() // Auto-generate TR-XXXX if missing
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
            transferStatus: data.transfer_status
        };
    },

    async update(id: string, updates: Partial<TransferRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.hasDiscrepancy !== undefined) { dbUpdates.has_discrepancy = updates.hasDiscrepancy; delete dbUpdates.hasDiscrepancy; }
        if (updates.discrepancyDetails !== undefined) { dbUpdates.discrepancy_details = updates.discrepancyDetails; delete dbUpdates.discrepancyDetails; }
        if (updates.transferStatus !== undefined) { dbUpdates.transfer_status = updates.transferStatus; delete dbUpdates.transferStatus; }

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
            notes: data.notes,
            transferStatus: data.transfer_status
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('transfers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
