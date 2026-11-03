import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { receiptSummary, receiptDetail, correctionInput, receiptDecisionInput, type ReceiptCorrectionInput, type ReceiptDecisionInput } from '../types/blind-receipt-review';
const confirmed = z.object({ id: z.string().uuid(), saved: z.literal(true) });
export const blindReceiptReviewService = {
    async list(site: string, country: string, before?: { created_at: string; id: string }, exceptions = true) {
        z.string().uuid().parse(site);
        const { data, error } = await supabase.rpc('blind_receipt_queue_filtered', { p_site: site, p_country: country, p_exceptions: exceptions, p_before: before?.created_at || null, p_before_id: before?.id || null });
        if (error) throw error;
        return z.array(receiptSummary).max(25).parse(data);
    },
    async detail(id: string) {
        z.string().uuid().parse(id);
        const { data, error } = await supabase.rpc('blind_receipt_detail', { p_receipt: id });
        if (error) throw error;
        return receiptDetail.parse(data);
    },
    async requestCorrection(input: ReceiptCorrectionInput) {
        const v = correctionInput.parse(input);
        const { data, error } = await supabase.rpc('request_blind_receipt_correction', { p_request: v.requestId, p_receipt: v.receiptId, p_job: v.jobId, p_quantity: v.quantity, p_reason: v.reason });
        if (error) throw error;
        return confirmed.parse(data);
    },
    async reportIssue(input: { receiptId: string; reason: string }) {
        const v = z.object({ receiptId: z.string().uuid(), reason: z.string().trim().min(3).max(1200) }).strict().parse(input);
        const { data, error } = await supabase.rpc('report_blind_receipt_issue', { p_receipt: v.receiptId, p_reason: v.reason });
        if (error) throw error;
        return confirmed.parse(data);
    },
    async decide(input: ReceiptDecisionInput) {
        const v = receiptDecisionInput.parse(input);
        const { data, error } = await supabase.rpc('decide_blind_receipt', { p_receipt: v.receiptId, p_correction: v.correctionId, p_approve: v.approve, p_reason: v.reason });
        if (error) throw error;
        return confirmed.parse(data);
    }
};
