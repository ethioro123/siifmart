import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    productsService,
    inventoryRequestsService,
} from '../services/supabase.service';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { PendingInventoryChange, Product } from '../types';
import { logger } from '../utils/logger';
import { requiresFinanceCoApproval, canApproveBelowFloor, MARGIN_FLOOR_PCT } from '../utils/pricingGovernance';

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
            // Zero-Trust 4-Eyes Principle: Requester cannot approve their own inventory request
            if (change.requestedBy && (
                change.requestedBy.toLowerCase() === (user?.name || '').toLowerCase() ||
                change.requestedBy.toLowerCase() === (user?.email || '').toLowerCase()
            )) {
                throw new Error('4-Eyes Principle Violation: Requesters cannot approve their own inventory adjustments.');
            }

            // Sovereign Cross-Border Protection
            const userCountry = (user?.country || '').toUpperCase();
            const requestCountry = (change.countryCode || (change as any).country_code || '').toUpperCase();
            if (userCountry && requestCountry && userCountry !== requestCountry && user?.role !== 'group_ceo') {
                throw new Error('Multi-country sovereignty violation: You cannot approve inventory requests outside your sovereign country.');
            }

            // Regional Governance Scoping
            const isNationalHq = ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'country_finance_director', 'auditor', 'country_compliance_manager'].includes(user?.role || '');
            const userRegion = user?.regionCode || (user as any)?.region_code;
            const requestRegion = change.regionCode || (change as any)?.region_code;

            if (!isNationalHq && userRegion && requestRegion && userRegion !== requestRegion) {
                throw new Error('Regional Governance Violation: You can only approve inventory adjustments within your assigned region.');
            }

            if (change.changeType === 'edit') {
                const result = await inventoryRequestsService.approveProductEdit(change.id);
                return { success: true, change, ...result };
            }

            // SOP-MER-037: price changes below the margin floor need Country Finance Director / CEO sign-off
            if (requiresFinanceCoApproval(change) && !canApproveBelowFloor(user?.role)) {
                throw new Error(`Price change is below the ${MARGIN_FLOOR_PCT}% margin floor: Country Finance Director or CEO approval is required.`);
            }

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

            // 2. Update status to 'approved' to preserve tamper-proof audit trail
            if (success) {
                await inventoryRequestsService.update(change.id, {
                    status: 'approved',
                    approvedBy: user?.name,
                    approvedAt: new Date().toISOString()
                });
                return { success: true, change };
            } else {
                throw new Error('Failed to apply change to production');
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
            queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });

            if ('applied' in data && !data.applied) {
                addNotification('info', `Approval recorded (${data.approvalCount}/3): ${data.change.productName}`);
                return;
            }
            addNotification('success', `Request approved: ${data.change.productName}`);
            logSystemEvent(
                'Inventory Request Approved',
                `Request for ${data.change.changeType} "${data.change.productName}" approved`,
                user?.name || 'System',
                'Inventory'
            );
        },
        onError: (error: any) => {
            logger.error('useInventoryRequestMutations', 'Approval failed:', error);
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
            if (change.changeType === 'edit') {
                await inventoryRequestsService.rejectProductEdit(change.id, reason);
                return { change, reason };
            }
            await inventoryRequestsService.update(change.id, {
                status: 'rejected',
                rejectedBy: user?.name,
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason
            });
            return { change, reason };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
            queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
            addNotification('info', `Request rejected: ${data.change.productName}`);
            logSystemEvent(
                'Inventory Request Rejected',
                `Request for ${data.change.changeType} "${data.change.productName}" rejected. Reason: ${data.reason}`,
                user?.name || 'System',
                'Inventory'
            );
        },
        onError: (error: any) => {
            logger.error('useInventoryRequestMutations', 'Rejection failed:', error);
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
            queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
            addNotification('success', `Successfully cleared ${data.length} requests.`);
        },
        onError: (error: any) => {
            logger.error('useInventoryRequestMutations', 'Cleanup failed:', error);
            addNotification('alert', 'Failed to clear all requests');
        }
    });
}

export function useCreateInventoryRequestMutation() {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent } = useData();
    const { user } = useStore();

    return useMutation({
        mutationFn: async (request: Omit<PendingInventoryChange, 'id'>) => {
            const created = await inventoryRequestsService.create(request);
            return { created, request };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
            queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
            logSystemEvent(
                'Inventory Request Created',
                `Pending request created for ${data.request.changeType} "${data.request.productName}"`,
                user?.name || 'Staff',
                'Inventory'
            );
        },
        onError: (error: any) => {
            logger.error('useInventoryRequestMutations', 'Creation failed:', error);
            addNotification('alert', `Failed to submit inventory request: ${error?.message || 'Unknown error'}`);
        }
    });
}
