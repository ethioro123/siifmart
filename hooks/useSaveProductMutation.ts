import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, inventoryRequestsService } from '../services/supabase.service';
import { Product, PendingInventoryChange, User } from '../types';
import { AppSite as Site } from '../lib/schemas';

interface SaveProductParams {
    product: Product;
    isNew: boolean;
    activeSite: Site | null;
    user: User | null;
    canApprove: boolean;
    stockToAdjust?: number;
}

export function useSaveProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ product, isNew, activeSite, user, canApprove, stockToAdjust = 0 }: SaveProductParams) => {
            if (!activeSite?.id) throw new Error('No active site selected.');

            // Business Logic: Role-based approval
            const finalApprovalStatus = isNew ? (canApprove ? 'approved' : 'pending') : product.approvalStatus;

            const productToSave = {
                ...product,
                approvalStatus: finalApprovalStatus,
                createdBy: isNew ? (user?.name || 'Unknown') : product.createdBy,
                createdAt: isNew ? new Date().toISOString() : product.createdAt,
                approvedBy: isNew && canApprove ? user?.name : product.approvedBy,
                approvedAt: isNew && canApprove ? new Date().toISOString() : product.approvedAt,
            } as Product;

            if (isNew) {
                if (!canApprove) {
                    // Create Request instead of Product
                    const request: Omit<PendingInventoryChange, 'id'> = {
                        productId: '',
                        productName: product.name,
                        productSku: product.sku,
                        siteId: activeSite.id,
                        changeType: 'create',
                        requestedBy: user?.name || 'Unknown',
                        requestedAt: new Date().toISOString(),
                        status: 'pending',
                        proposedChanges: productToSave,
                        adjustmentType: 'IN',
                        adjustmentQty: stockToAdjust,
                        adjustmentReason: 'Initial stock on creation'
                    };
                    return await inventoryRequestsService.create(request);
                } else {
                    return await productsService.create(productToSave);
                }
            } else {
                if (!canApprove) {
                    const request: Omit<PendingInventoryChange, 'id'> = {
                        productId: product.id,
                        productName: product.name,
                        productSku: product.sku,
                        siteId: activeSite.id,
                        changeType: 'edit',
                        requestedBy: user?.name || 'Unknown',
                        requestedAt: new Date().toISOString(),
                        status: 'pending',
                        proposedChanges: productToSave,
                        adjustmentType: 'IN',
                        adjustmentQty: stockToAdjust,
                        adjustmentReason: 'Stock updated via edit'
                    };
                    return await inventoryRequestsService.create(request);
                } else {
                    return await productsService.update(productToSave.id!, productToSave);
                }
            }
        },
        onSuccess: () => {
            // Invalidate queries to trigger re-fetch
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
        }
    });
}
