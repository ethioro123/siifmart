import { supabase } from '../lib/supabase';
import type { DiscrepancyResolution, DiscrepancyClaim } from '../types';

export const discrepancyService = {
    async createResolution(
        resolution: Omit<DiscrepancyResolution, 'id' | 'createdAt' | 'resolvedAt'>
    ): Promise<DiscrepancyResolution> {
        const dbResolution = {
            transfer_id: resolution.transferId,
            line_item_index: resolution.lineItemIndex,
            product_id: resolution.productId,
            expected_qty: resolution.expectedQty,
            received_qty: resolution.receivedQty,
            discrepancy_type: resolution.discrepancyType,
            resolution_type: resolution.resolutionType,
            resolution_status: resolution.resolutionStatus,
            resolution_notes: resolution.resolutionNotes,
            reason_code: resolution.reasonCode,
            estimated_value: resolution.estimatedValue,
            claim_amount: resolution.claimAmount,
            photo_urls: resolution.photoUrls,
            reported_by: resolution.reportedBy,
            site_id: resolution.siteId,
            resolve_qty: resolution.resolveQty,
            replacement_job_id: resolution.replacementJobId
        };
        const { data, error } = await supabase
            .from('discrepancy_resolutions')
            .insert(dbResolution)
            .select()
            .single();

        if (error) throw error;
        return this._mapResolution(data);
    },

    async updateResolution(
        id: string,
        updates: Partial<DiscrepancyResolution>
    ): Promise<DiscrepancyResolution> {
        const dbUpdates: any = { ...updates };

        // Map fields
        if (updates.resolutionStatus) dbUpdates.resolution_status = updates.resolutionStatus;
        if (updates.resolutionType) dbUpdates.resolution_type = updates.resolutionType;
        if (updates.resolutionNotes) dbUpdates.resolution_notes = updates.resolutionNotes;
        if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy;
        if (updates.resolvedBy) dbUpdates.resolved_by = updates.resolvedBy;
        if (updates.resolvedAt) dbUpdates.resolved_at = updates.resolvedAt;

        // Cleanup
        delete dbUpdates.resolutionStatus;
        delete dbUpdates.resolutionType;
        delete dbUpdates.resolutionNotes;
        delete dbUpdates.approvedBy;
        delete dbUpdates.resolvedBy;
        delete dbUpdates.resolvedAt;
        delete dbUpdates.transferId;
        delete dbUpdates.lineItemIndex;
        delete dbUpdates.productId;

        const { data, error } = await supabase
            .from('discrepancy_resolutions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this._mapResolution(data);
    },

    async getByTransferId(transferId: string): Promise<DiscrepancyResolution[]> {
        const { data, error } = await supabase
            .from('discrepancy_resolutions')
            .select('*')
            .eq('transfer_id', transferId);

        if (error) throw error;
        return (data || []).map((r: any) => this._mapResolution(r));
    },

    async createClaim(
        claim: Omit<DiscrepancyClaim, 'id' | 'submittedAt' | 'paidAt' | 'reviewedAt'>
    ): Promise<DiscrepancyClaim> {
        const dbClaim = {
            resolution_id: claim.resolutionId,
            claim_type: claim.claimType,
            claim_amount: claim.claimAmount,
            carrier_name: claim.carrierName,
            tracking_number: claim.trackingNumber,
            notes: claim.notes,
            documents: claim.documents
        };

        const { data, error } = await supabase
            .from('discrepancy_claims')
            .insert(dbClaim)
            .select()
            .single();

        if (error) throw error;
        return this._mapClaim(data);
    },

    async getClaimByResolutionId(resolutionId: string): Promise<DiscrepancyClaim | null> {
        const { data, error } = await supabase
            .from('discrepancy_claims')
            .select('*')
            .eq('resolution_id', resolutionId)
            .maybeSingle();

        if (error) throw error;
        return data ? this._mapClaim(data) : null;
    },

    _mapResolution(data: any): DiscrepancyResolution {
        return {
            id: data.id,
            transferId: data.transfer_id,
            lineItemIndex: data.line_item_index,
            productId: data.product_id,
            expectedQty: data.expected_qty,
            receivedQty: data.received_qty,
            variance: data.variance,
            discrepancyType: data.discrepancy_type,
            resolveQty: data.resolve_qty,
            resolutionType: data.resolution_type,
            resolutionStatus: data.resolution_status,
            resolutionNotes: data.resolution_notes,
            reasonCode: data.reason_code,
            estimatedValue: data.estimated_value,
            claimAmount: data.claim_amount,
            photoUrls: data.photo_urls,
            reportedBy: data.reported_by,
            resolvedBy: data.resolved_by,
            approvedBy: data.approved_by,
            createdAt: data.created_at,
            resolvedAt: data.resolved_at,
            siteId: data.site_id,
            replacementJobId: data.replacement_job_id,
            replacement_job_id: data.replacement_job_id
        };
    },

    _mapClaim(data: any): DiscrepancyClaim {
        return {
            id: data.id,
            resolutionId: data.resolution_id,
            claimType: data.claim_type,
            claimNumber: data.claim_number,
            claimStatus: data.claim_status,
            claimAmount: data.claim_amount,
            approvedAmount: data.approved_amount,
            submittedAt: data.submitted_at,
            reviewedAt: data.reviewed_at,
            paidAt: data.paid_at,
            carrierName: data.carrier_name,
            trackingNumber: data.tracking_number,
            documents: data.documents,
            notes: data.notes
        };
    }
};
