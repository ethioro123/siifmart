import { useMutation, useQueryClient } from '@tanstack/react-query';
import { barcodeApprovalsService } from '../services/supabase.service';
import { useData } from '../contexts/DataContext';

export function useApproveBarcodeMutation() {
    const queryClient = useQueryClient();
    const { addNotification } = useData();

    return useMutation({
        mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
            return await barcodeApprovalsService.approve(id, userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barcodeApprovals'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            addNotification('success', 'Barcode mapping approved');
        },
        onError: (error: any) => {
            console.error('Approve barcode failed:', error);
            addNotification('alert', error.message || 'Failed to approve barcode mapping');
        }
    });
}

export function useRejectBarcodeMutation() {
    const queryClient = useQueryClient();
    const { addNotification } = useData();

    return useMutation({
        mutationFn: async ({ id, userId, reason }: { id: string, userId: string, reason: string }) => {
            return await barcodeApprovalsService.reject(id, userId, reason);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barcodeApprovals'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            addNotification('success', 'Barcode mapping rejected and reverted');
        },
        onError: (error: any) => {
            console.error('Reject barcode failed:', error);
            addNotification('alert', error.message || 'Failed to reject barcode mapping');
        }
    });
}
