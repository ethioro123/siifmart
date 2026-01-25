import { useQuery } from '@tanstack/react-query';
import { barcodeApprovalsService } from '../services/supabase.service';
import { BarcodeApprovalSchema } from '../schemas/inventory.schema';
import { BarcodeApproval } from '../types';

interface UseBarcodeApprovalsOptions {
    siteId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    enabled?: boolean;
}

export function useBarcodeApprovalsQuery(options: UseBarcodeApprovalsOptions = {}) {
    const { siteId, status = 'logged', enabled = true } = options;

    return useQuery({
        queryKey: ['barcode_approvals', siteId, status],
        queryFn: async () => {
            // Fetch from audit log service (siteId optional)
            const data = await barcodeApprovalsService.getAuditLog(siteId);

            if (!data) return [];

            // Accuracy: Validate each record with Zod
            return data.map(raw => {
                const result = BarcodeApprovalSchema.safeParse(raw);
                if (!result.success) {
                    console.warn('⚠️ Barcode Approval Schema Validation Failed:', {
                        id: raw.id,
                        errors: result.error.format()
                    });
                    return raw as BarcodeApproval;
                }
                const validated = result.data;
                return {
                    ...validated,
                    productId: validated.product_id,
                    siteId: validated.site_id || '',
                    createdBy: validated.created_by || 'Unknown',
                    createdAt: validated.created_at || new Date().toISOString(),
                    imageUrl: (validated.image_url as string) || undefined,
                    reviewedBy: (validated.reviewed_by as string) || undefined,
                    reviewedAt: (validated.reviewed_at as string) || undefined,
                    rejectionReason: (validated.rejection_reason as string) || undefined
                } as BarcodeApproval;
            });
        },
        enabled: enabled,
        staleTime: 1000 * 60 * 2, // 2 minutes stale time for audit data
    });
}
