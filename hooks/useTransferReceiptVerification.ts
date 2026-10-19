import { useMutation } from '@tanstack/react-query';
import { transferReceiptVerificationService } from '../services/transfer-receipt-verification.service';
import type { ReceivingItem } from '../types';

export function useTransferReceiptVerification() {
    return useMutation({
        mutationFn: ({ jobId, items }: { jobId: string; items: ReceivingItem[] }) =>
            transferReceiptVerificationService.recordCount(jobId, items)
    });
}
