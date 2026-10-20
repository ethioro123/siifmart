import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    productsService,
    inventoryRequestsService,
} from '../services/supabase.service';
import { systemLogsService } from '../services/system-logs.service';
import { posDB } from '../services/db/pos.db';
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
            if (userCountry && requestCountry && userCountry !== requestCountry && user?.role !== 'super_admin' && user?.role !== 'CEO') {
                throw new Error('Multi-country sovereignty violation: You cannot approve inventory requests outside your sovereign country.');
            }

            // Regional Governance Scoping
            const isNationalHq = user?.role === 'super_admin' || user?.role === 'CEO' || user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'auditor';
            const userRegion = user?.regionCode || (user as any)?.region_code;
            const requestRegion = change.regionCode || (change as any)?.region_code;

            if (!isNationalHq && userRegion && requestRegion && userRegion !== requestRegion) {
                throw new Error('Regional Governance Violation: You can only approve inventory adjustments within your assigned region.');
            }

            if (change.adjustmentReason?.startsWith('PRICE_CHANGE') ||
                change.adjustmentReason?.startsWith('MERCHANDISING:')) {
                await inventoryRequestsService.approveMerchandising(change.id);
                return { success: true, change };
            }

            // SOP-MER-037: price changes below the margin floor need Finance Manager / CEO sign-off
            if (requiresFinanceCoApproval(change) && !canApproveBelowFloor(user?.role)) {
                throw new Error(`Price change is below the ${MARGIN_FLOOR_PCT}% margin floor: Finance Manager or CEO approval is required.`);
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
            else if (change.changeType === 'edit' && change.proposedChanges) {
                const updateResult = await productsService.update(change.productId, {
                    ...change.proposedChanges,
                    id: change.productId,
                    approvalStatus: 'approved' as const,
                    approvedBy: user?.name,
                    approvedAt: new Date().toISOString()
                } as Product);
                success = !!updateResult;

                if (success && change.siteId) {
                    // Synaptic Neural Mesh: Sync POS IndexedDB Cache
                    try {
                        const existing = await posDB.getCachedProducts(change.siteId);
                        if (existing && Array.isArray(existing)) {
                            const updatedList = existing.map(p => p.id === change.productId ? { ...p, ...change.proposedChanges, approvalStatus: 'approved' } : p);
                            await posDB.cacheProducts(change.siteId, updatedList);
                        }
                    } catch (posErr) {
                        logger.warn('useInventoryRequestMutations', 'POS IndexedDB sync skipped', { error: String(posErr) });
                    }
                }

                // Zero-Trust Rule 5 Audit Logging
                try {
                    await systemLogsService.create({
                        action: 'PRODUCT_EDIT_APPROVED',
                        details: {
                            requestId: change.id,
                            productId: change.productId,
                            productName: change.productName,
                            productSku: change.productSku,
                            siteId: change.siteId,
                            proposedChanges: change.proposedChanges,
                            requestedBy: change.requestedBy,
                            approvedBy: user?.name || 'Regional Manager',
                            approverRole: user?.role,
                            summary: `Approved by ${user?.role || 'Manager'} ${user?.name}: Updated ${change.productName} (${change.productSku})`
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'System',
                        employee_id: user?.id,
                        site_id: change.siteId,
                        country_code: change.countryCode || 'ET',
                        entity_type: 'product',
                        entity_id: change.productId,
                    });
                } catch (logErr) {
                    logger.warn('useInventoryRequestMutations', 'Failed to write approval audit log', { error: String(logErr) });
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
