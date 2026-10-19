import { supabase } from '../lib/supabase';
import type { ReceivingItem } from '../types';

export interface TransferReceiptVerification {
    status: 'awaiting_first_count' | 'awaiting_recount' | 'verified';
    canCount: boolean;
    hasDiscrepancy?: boolean;
    discrepancyCount?: number;
    firstCounterId?: string;
    secondCounterId?: string;
    items: ReceivingItem[];
}

type ReceiptVerificationRpcResult = Omit<TransferReceiptVerification, 'items'> & {
    items: Array<ReceivingItem & { name?: string }>;
};

function mapVerification(data: unknown): TransferReceiptVerification {
    const result = data as ReceiptVerificationRpcResult;
    return {
        ...result,
        items: result.items.map(item => ({ ...item, productName: item.productName || item.name }))
    };
}

export const transferReceiptVerificationService = {
    async get(jobId: string): Promise<TransferReceiptVerification> {
        const { data, error } = await supabase.rpc('get_transfer_receipt_verification', { p_job_id: jobId });
        if (error) throw error;
        return mapVerification(data);
    },

    async recordCount(jobId: string, items: ReceivingItem[]): Promise<TransferReceiptVerification> {
        const counts = items.map((item, index) => ({
            index,
            productId: item.productId,
            receivedQty: Number(item.receivedQty || 0),
            condition: item.condition || 'Good'
        }));
        const { data, error } = await supabase.rpc('record_transfer_receipt_count', {
            p_job_id: jobId,
            p_counts: counts
        });
        if (error) throw error;
        return mapVerification(data);
    }
};
