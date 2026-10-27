import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, inventoryRequestsService } from '../services/supabase.service';
import { Product, PendingInventoryChange, User } from '../types';
import { AppSite as Site } from '../lib/schemas';
import { systemLogsService } from '../services/system-logs.service';
import { posDB } from '../services/db/pos.db';
import { logger } from '../utils/logger';

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

            const countryCode = (activeSite as any)?.country || (user as any)?.country || 'ET';

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
                        countryCode: countryCode,
                        changeType: 'create',
                        requestedBy: user?.name || 'Unknown',
                        requestedAt: new Date().toISOString(),
                        status: 'pending',
                        proposedChanges: productToSave,
                        adjustmentType: 'IN',
                        adjustmentQty: stockToAdjust,
                        adjustmentReason: 'Initial stock on creation'
                    };
                    const res = await inventoryRequestsService.create(request);

                    // Zero-Trust Rule 5 Audit Logging
                    await systemLogsService.create({
                        action: 'PRODUCT_CREATION_REQUESTED',
                        details: {
                            sku: product.sku,
                            name: product.name,
                            category: product.category,
                            price: product.price,
                            siteId: activeSite.id,
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'Unknown',
                        employee_id: user?.id,
                        site_id: activeSite.id,
                        country_code: countryCode,
                        entity_type: 'inventory_request',
                        entity_id: (res as any)?.id || product.sku,
                    });

                    return res;
                } else {
                    const created = await productsService.create(productToSave);

                    // Synaptic Neural Mesh: Sync POS IndexedDB Cache
                    try {
                        const existing = await posDB.getCachedProducts(activeSite.id);
                        if (existing && Array.isArray(existing)) {
                            await posDB.cacheProducts(activeSite.id, [created, ...existing]);
                        }
                    } catch (err) {
                        logger.warn('useSaveProductMutation', 'POS IndexedDB sync skipped', { error: String(err) });
                    }

                    // Zero-Trust Rule 5 Audit Logging
                    await systemLogsService.create({
                        action: 'PRODUCT_CREATED',
                        details: {
                            sku: created.sku,
                            name: created.name,
                            category: created.category,
                            price: created.price,
                            siteId: activeSite.id,
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'Unknown',
                        employee_id: user?.id,
                        site_id: activeSite.id,
                        country_code: countryCode,
                        entity_type: 'product',
                        entity_id: created.id,
                    });

                    return created;
                }
            } else {
                const request: Omit<PendingInventoryChange, 'id'> = {
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    siteId: product.siteId || product.site_id || activeSite.id,
                    countryCode: countryCode,
                    changeType: 'edit',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    proposedChanges: productToSave,
                    adjustmentReason: 'Product attributes update'
                };
                const res = await inventoryRequestsService.create(request);

                // Zero-Trust Rule 5 Audit Logging
                await systemLogsService.create({
                    action: 'PRODUCT_EDIT_REQUESTED',
                    details: {
                        productId: product.id,
                        sku: product.sku,
                        name: product.name,
                        siteId: product.siteId || product.site_id || activeSite.id,
                    },
                    module: 'Inventory',
                    user_name: user?.name || 'Unknown',
                    employee_id: user?.id,
                    site_id: product.siteId || product.site_id || activeSite.id,
                    country_code: countryCode,
                    entity_type: 'inventory_request',
                    entity_id: (res as any)?.id || product.id,
                });

                return res;
            }
        },
        onSuccess: (_data, variables) => {
            // Invalidate queries to trigger re-fetch
            queryClient.invalidateQueries({ queryKey: ['products'] });
            if (variables?.activeSite?.id) {
                queryClient.invalidateQueries({ queryKey: ['products', variables.activeSite.id] });
            }
            queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
        }
    });
}
