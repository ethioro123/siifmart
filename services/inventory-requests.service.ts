import { supabase } from '../lib/supabase';
import type { PendingInventoryChange } from '../types';

export const inventoryRequestsService = {
    async getAll(siteId?: string): Promise<PendingInventoryChange[]> {
        const query = supabase.from('inventory_requests').select('*');
        if (siteId) query.eq('site_id', siteId);

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) throw error;

        return data.map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSku: r.product_sku,
            siteId: r.site_id,
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
        const { data, error } = await supabase.from('inventory_requests').insert({
            site_id: request.siteId,
            product_id: request.productId,
            product_name: request.productName,
            product_sku: request.productSku,
            change_type: request.changeType,
            requested_by: request.requestedBy,
            status: 'pending',
            proposed_changes: request.proposedChanges,
            adjustment_type: request.adjustmentType,
            adjustment_qty: request.adjustmentQty,
            adjustment_reason: request.adjustmentReason
        }).select().single();

        if (error) throw error;
        return data;
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
            console.error('❌ inventoryRequestsService.update FAILED:', error);
            throw error;
        }

        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('inventory_requests').delete().eq('id', id);
        if (error) {
            console.error('❌ inventoryRequestsService.delete FAILED:', error);
            throw error;
        }
    }
};
