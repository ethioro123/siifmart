import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, inventoryRequestsService } from '../services/supabase.service';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { PendingInventoryChange } from '../types';

interface AdjustStockParams {
    productId: string;
    productName: string;
    productSku: string;
    siteId: string;
    quantity: number;
    type: 'IN' | 'OUT';
    reason: string;
    canApprove: boolean;
    expiryDate?: string;
    batchNumber?: string;
}

export function useAdjustStockMutation() {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent } = useData();
    const { user } = useStore();

    return useMutation({
        mutationFn: async (params: AdjustStockParams) => {
            const { productId, productName, productSku, siteId, quantity, type, reason, canApprove, expiryDate, batchNumber } = params;

            if (canApprove) {
                // Direct adjustment
                await productsService.adjustStock(productId, quantity, type, reason, user?.name || 'System', expiryDate, batchNumber);
                return { type: 'direct', productName, quantity, adjustmentType: type };
            } else {
                // Create request
                const request: Omit<PendingInventoryChange, 'id'> = {
                    productId,
                    productName,
                    productSku,
                    siteId,
                    changeType: 'stock_adjustment',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    adjustmentType: type,
                    adjustmentQty: quantity,
                    adjustmentReason: reason
                };
                await inventoryRequestsService.create(request);
                return { type: 'request', productName };
            }
        },
        onSuccess: (result) => {
            if (result.type === 'direct') {
                // CRITICAL: Use partial match to invalidate ALL product-related queries
                // The products query key is ['products', siteId, limit, offset, sort]
                queryClient.invalidateQueries({
                    predicate: (query) => query.queryKey[0] === 'products'
                });
                addNotification('success', `Stock adjusted for "${result.productName}".`);
                logSystemEvent(
                    'Stock Adjusted',
                    `Manually adjusted stock for "${result.productName}" by ${result.quantity} units (${result.adjustmentType})`,
                    user?.name || 'System',
                    'Inventory'
                );
            } else {
                queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
                addNotification('info', 'Stock adjustment request submitted for approval');
            }
        },
        onError: (error: any) => {
            console.error('Stock adjustment failed:', error);
            addNotification('alert', error.message || 'Failed to process adjustment');
        }
    });
}
