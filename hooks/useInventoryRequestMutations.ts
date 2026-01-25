import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    productsService,
    inventoryRequestsService,
    // Note: createPutawayJob might need to be imported if it's a utility or from another hook
} from '../services/supabase.service';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { PendingInventoryChange, Product } from '../types';

// For putaway job - we need to see where it comes from. 
// In Inventory.tsx it seems it's available in scope (maybe from DataContext or defined in Inventory.tsx)
// Let's assume it's a service call for now or we might need to pass the function.
// Checking Inventory.tsx... it calls createPutawayJob.

export function useApproveInventoryRequestMutation(createPutawayJob?: Function) {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent } = useData();
    const { user } = useStore();

    return useMutation({
        mutationFn: async (change: PendingInventoryChange) => {
            let success = false;
            let resultProduct: Product | null = null;

            // 1. Apply the change to production
            if (change.changeType === 'create' && change.proposedChanges) {
                const productToCreate = {
                    ...change.proposedChanges,
                    approvalStatus: 'approved' as const,
                    approvedBy: user?.name,
                    approvedAt: new Date().toISOString()
                };
                resultProduct = await productsService.create(productToCreate as Product);
                if (resultProduct && resultProduct.id) {
                    success = true;
                    if (createPutawayJob && (change.adjustmentQty || 0) > 0) {
                        await createPutawayJob(resultProduct, change.adjustmentQty || 0, user?.name || 'System', 'Approved Creation');
                    }
                }
            }
            else if (change.changeType === 'edit' && change.proposedChanges) {
                const updateResult = await productsService.update(change.productId, {
                    ...change.proposedChanges,
                    id: change.productId,
                    approvalStatus: 'approved' as const,
                    approvedBy: user?.name,
                    approvedAt: new Date().toISOString()
                } as Product);
                success = !!updateResult;
            }
            else if (change.changeType === 'delete') {
                await productsService.cascadeDelete(change.productId);
                success = true;
            }
            else if (change.changeType === 'stock_adjustment') {
                await productsService.adjustStock(
                    change.productId,
                    change.adjustmentQty || 0,
                    change.adjustmentType || 'IN',
                    change.adjustmentReason || 'Approved Adjustment',
                    user?.name || 'System'
                );
                success = true;
            }

            // 2. DELETE the pending request
            if (success) {
                try {
                    await inventoryRequestsService.delete(change.id);
                } catch (deleteErr) {
                    // Fallback: try updating status
                    await inventoryRequestsService.update(change.id, {
                        status: 'approved',
                        approvedBy: user?.name,
                        approvedAt: new Date().toISOString()
                    });
                }
                return { success: true, change };
            } else {
                throw new Error('Failed to apply change to production');
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });

            addNotification('success', `Request approved: ${data.change.productName}`);
            logSystemEvent(
                'Inventory Request Approved',
                `Request for ${data.change.changeType} "${data.change.productName}" approved`,
                user?.name || 'System',
                'Inventory'
            );
        },
        onError: (error: any) => {
            console.error('Approval failed:', error);
            addNotification('alert', `Failed to approve request: ${error?.message || 'Unknown error'}`);
        }
    });
}

export function useRejectInventoryRequestMutation() {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent } = useData();
    const { user } = useStore();

    return useMutation({
        mutationFn: async ({ change, reason }: { change: PendingInventoryChange, reason: string }) => {
            try {
                await inventoryRequestsService.delete(change.id);
            } catch (deleteErr) {
                await inventoryRequestsService.update(change.id, {
                    status: 'rejected',
                    rejectedBy: user?.name,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: reason
                });
            }
            return { change, reason };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
            addNotification('info', `Request rejected: ${data.change.productName}`);
            logSystemEvent(
                'Inventory Request Rejected',
                `Request for ${data.change.changeType} "${data.change.productName}" rejected. Reason: ${data.reason}`,
                user?.name || 'System',
                'Inventory'
            );
        },
        onError: (error: any) => {
            console.error('Rejection failed:', error);
            addNotification('alert', 'Failed to reject request');
        }
    });
}

export function useBulkCleanupRequestsMutation() {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent } = useData();
    const { user } = useStore();

    return useMutation({
        mutationFn: async (pendingChanges: PendingInventoryChange[]) => {
            const cleanupPromises = pendingChanges.map(change =>
                inventoryRequestsService.update(change.id, {
                    status: 'rejected',
                    rejectedBy: user?.name,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: 'System Cleanup: Correcting role casing mismatch ghosts'
                })
            );
            return await Promise.all(cleanupPromises);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
            addNotification('success', `Successfully cleared ${data.length} requests.`);
        },
        onError: (error: any) => {
            console.error('Cleanup failed:', error);
            addNotification('alert', 'Failed to clear all requests');
        }
    });
}
