import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, inventoryRequestsService } from '../services/supabase.service';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { PendingInventoryChange } from '../types';

interface DeleteProductParams {
    productId: string;
    productName: string;
    productSku: string;
    siteId: string;
    canApprove: boolean;
}

export function useDeleteProductMutation() {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent } = useData();
    const { user } = useStore();

    return useMutation({
        mutationFn: async (params: DeleteProductParams) => {
            const { productId, productName, productSku, siteId, canApprove } = params;

            if (canApprove) {
                // Direct deletion
                await productsService.cascadeDelete(productId);
                return { type: 'direct', productId, productName };
            } else {
                // Create request
                const request: Omit<PendingInventoryChange, 'id'> = {
                    productId,
                    productName,
                    productSku,
                    siteId,
                    changeType: 'delete',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                };
                await inventoryRequestsService.create(request);
                return { type: 'request', productName };
            }
        },
        onSuccess: (result) => {
            if (result.type === 'direct') {
                queryClient.invalidateQueries({ queryKey: ['products'] });
                addNotification('success', 'Product and related records deleted permanently');
                logSystemEvent(
                    'Product Deleted',
                    `Product "${result.productName}" (ID: ${result.productId}) and all related records deleted permanently`,
                    user?.name || 'System',
                    'Inventory'
                );
            } else {
                queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
                addNotification('info', `Delete request submitted for approval. Product: ${result.productName}`);
            }
        },
        onError: (error: any) => {
            console.error('Delete product failed:', error);

            // Handle foreign key constraint violation
            if (error?.code === '23503' || error?.message?.includes('foreign key constraint') || error?.message?.includes('still referenced')) {
                addNotification('alert', 'Cannot delete product - transaction history exists. Set status to "Inactive" instead.');
            } else {
                addNotification('alert', error.message || 'Failed to delete product');
            }
        }
    });
}
