import { supabase } from '../lib/supabase';
import type { MarginApprovalRequest } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

export const marginApprovalService = {
    async getRequests(countryCode: string = 'ET', status?: string): Promise<MarginApprovalRequest[]> {
        try {
            let query = supabase
                .from('margin_approval_requests')
                .select('*')
                .eq('country_code', countryCode)
                .order('created_at', { ascending: false });

            if (status && status !== 'All') {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((r: any) => ({
                id: r.id,
                requestNumber: r.request_number,
                productId: r.product_id,
                productName: r.product_name,
                sku: r.sku,
                siteId: r.site_id,
                countryCode: r.country_code,
                costPrice: Number(r.cost_price),
                proposedRetailPrice: Number(r.proposed_retail_price),
                proposedMarginPct: Number(r.proposed_margin_pct),
                targetMarginPct: Number(r.target_margin_pct),
                marginVariancePct: Number(r.margin_variance_pct),
                status: r.status,
                requestedById: r.requested_by_id,
                requestedByName: r.requested_by_name,
                reason: r.reason,
                approvedById: r.approved_by_id,
                approvedByName: r.approved_by_name,
                approvedAt: r.approved_at,
                rejectionReason: r.rejection_reason,
                createdAt: r.created_at
            }));
        } catch (error) {
            logger.error('marginApprovalService', 'getRequests error:', error as Error);
            return [];
        }
    },

    async createRequest(
        request: Omit<MarginApprovalRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'requestedById' | 'requestedByName'> & {
            requestedById?: string;
            requestedByName?: string;
        },
        user: { id: string; name: string }
    ): Promise<MarginApprovalRequest> {
        const requestNumber = `MAR-${Date.now().toString().slice(-6)}`;

        const { data, error } = await supabase
            .from('margin_approval_requests')
            .insert({
                request_number: requestNumber,
                product_id: request.productId,
                product_name: request.productName,
                sku: request.sku,
                site_id: request.siteId || null,
                country_code: request.countryCode,
                cost_price: request.costPrice,
                proposed_retail_price: request.proposedRetailPrice,
                proposed_margin_pct: request.proposedMarginPct,
                target_margin_pct: request.targetMarginPct,
                margin_variance_pct: request.marginVariancePct,
                status: 'Pending',
                requested_by_id: user.id,
                requested_by_name: user.name,
                reason: request.reason
            })
            .select()
            .single();

        if (error) throw error;

        await systemLogsService.create({
            user_name: user.name,
            action: 'MARGIN_APPROVAL_REQUESTED',
            module: 'Financials',
            details: `Low-margin price change requested for ${request.productName} (${request.sku}). Proposed margin: ${request.proposedMarginPct}% (Target: ${request.targetMarginPct}%).`
        });

        return {
            id: data.id,
            requestNumber: data.request_number,
            productId: data.product_id,
            productName: data.product_name,
            sku: data.sku,
            siteId: data.site_id,
            countryCode: data.country_code,
            costPrice: Number(data.cost_price),
            proposedRetailPrice: Number(data.proposed_retail_price),
            proposedMarginPct: Number(data.proposed_margin_pct),
            targetMarginPct: Number(data.target_margin_pct),
            marginVariancePct: Number(data.margin_variance_pct),
            status: data.status,
            requestedById: data.requested_by_id,
            requestedByName: data.requested_by_name,
            reason: data.reason,
            createdAt: data.created_at
        };
    },

    async signOff(
        id: string,
        action: 'Approved' | 'Rejected',
        user: { id: string; name: string },
        rejectionReason?: string
    ): Promise<void> {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('margin_approval_requests')
            .update({
                status: action,
                approved_by_id: action === 'Approved' ? user.id : null,
                approved_by_name: action === 'Approved' ? user.name : null,
                approved_at: action === 'Approved' ? now : null,
                rejection_reason: action === 'Rejected' ? rejectionReason : null,
                updated_at: now
            })
            .eq('id', id);

        if (error) throw error;

        await systemLogsService.create({
            user_name: user.name,
            action: action === 'Approved' ? 'MARGIN_CHANGE_APPROVED' : 'MARGIN_CHANGE_REJECTED',
            module: 'Financials',
            details: `Margin approval request #${id.slice(0, 8)} was ${action} by ${user.name}. ${rejectionReason ? `Reason: "${rejectionReason}"` : ''}`
        });
    }
};
