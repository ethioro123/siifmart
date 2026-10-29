import { priceApprovalService } from './price-approval.service';
import { isPriceProposal } from '../utils/priceApproval';
import { supabase } from '../lib/supabase';
import type { PendingInventoryChange, Product } from '../types';
import { productEditFields } from '../utils/productEditApproval';
import { logger } from '../utils/logger';

export interface MerchandisingRequestsResult {
    data: PendingInventoryChange[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
}

export interface GetMerchandisingOptions {
    requestId?: string;
    layoutRevisionId?: string;
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'all';
    regionCode?: string;
    productId?: string;
    siteId?: string;
}

export const inventoryRequestsService = {
    async rejectProductEdit(requestId: string, reason: string): Promise<void> {
        const trimmed = (reason || '').trim();
        if (!trimmed) {
            throw new Error('A rejection reason is required');
        }
        const { error } = await supabase.rpc('reject_product_edit', { p_request_id: requestId, p_reason: trimmed });
        if (error) throw error;
    },
    async approveProductEdit(requestId: string): Promise<{ applied: boolean; approvalCount: number; workflow?: string }> {
        const { data, error } = await supabase.rpc('approve_product_edit', { p_request_id: requestId });
        if (error) throw error;
        return data;
    },
    async approveMerchandising(requestId: string): Promise<void> {
        const { error } = await supabase.rpc('approve_product_edit', { p_request_id: requestId });
        if (error) throw error;
    },

    async signoffMerchandisingPrice(requestId: string): Promise<void> {
        const { error } = await supabase.rpc('finance_signoff_merchandising_price', { p_request_id: requestId });
        if (error) throw error;
    },

    async submitPlanogramLayoutRevision(
        siteId: string,
        countryCode: string,
        changes: Array<{ productId: string; shelfPosition: string }>,
        reason?: string
    ): Promise<{ revisionId: string; count: number; requestIds: string[] }> {
        const { data, error } = await supabase.rpc('submit_planogram_layout_revision', {
            p_site_id: siteId,
            p_country_code: countryCode.toUpperCase(),
            p_changes: changes,
            p_reason: reason || 'MERCHANDISING: planogram layout revision'
        });
        if (error) throw error;
        return data;
    },

    async getMerchandisingRequests(
        countryCode: string,
        options: GetMerchandisingOptions = {}
    ): Promise<MerchandisingRequestsResult> {
        const page = Math.max(1, options.page || 1);
        const pageSize = Math.max(1, Math.min(100, options.limit || 25));
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase.from('inventory_requests')
            .select('id,product_id,product_name,product_sku,site_id,country_code,region_code,change_type,requested_by,requested_at,status,proposed_changes,adjustment_reason,finance_approved_by_employee_id,requested_by_employee_id,product_edit_approvals,product_edit_baseline,rejection_reason,rejected_by,rejected_at,approved_by,approved_at,layout_revision_id', { count: 'exact' })
            .eq('country_code', countryCode.toUpperCase())
            .eq('change_type', 'edit');

        if (options.status && options.status !== 'all') {
            if (options.status === 'completed') {
                query = query.in('status', ['approved', 'rejected']);
            } else {
                query = query.eq('status', options.status);
            }
        } else if (!options.status) {
            query = query.eq('status', 'pending');
        }

        if (options.requestId) query = query.eq('id', options.requestId);
        if (options.layoutRevisionId) query = query.eq('layout_revision_id', options.layoutRevisionId);
        if (options.productId) query = query.eq('product_id', options.productId);
        if (options.siteId) query = query.eq('site_id', options.siteId);
        if (options.regionCode) {
            query = query.eq('region_code', options.regionCode);
        }

        const { data, error, count } = await query
            .order('requested_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        const totalCount = count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const hasMore = page < totalPages;

        const rawItems = data || [];
        const productIds = Array.from(new Set(rawItems.map((r: any) => r.product_id).filter(Boolean)));
        const productMap = new Map<string, Partial<Product>>();

        if (productIds.length > 0) {
            const { data: prods } = await supabase.from('products')
                .select('id,name,sku,price,cost_price,sale_price,is_on_sale,stock,min_stock,max_stock,category,brand,image,description')
                .in('id', productIds);

            (prods || []).forEach((p: any) => {
                productMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    costPrice: p.cost_price,
                    salePrice: p.sale_price,
                    isOnSale: p.is_on_sale,
                    stock: p.stock,
                    minStock: p.min_stock,
                    maxStock: p.max_stock,
                    category: p.category,
                    brand: p.brand,
                    image: p.image,
                    description: p.description
                });
            });
        }

        const priceRoutes = await priceApprovalService.routes(rawItems.filter((row: { proposed_changes: Partial<Product> }) => isPriceProposal({proposedChanges:row.proposed_changes})).map((row: {id:string}) => row.id));
        const items: PendingInventoryChange[] = rawItems.map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSku: r.product_sku,
            siteId: r.site_id,
            countryCode: r.country_code,
            regionCode: r.region_code,
            changeType: r.change_type,
            requestedBy: r.requested_by,
            requestedAt: r.requested_at,
            status: r.status,
            proposedChanges: r.proposed_changes,
            priceApprovalRoute: priceRoutes[r.id],
            proposalBaseline: r.product_edit_baseline,
            adjustmentReason: r.adjustment_reason,
            financeApprovedByEmployeeId: r.finance_approved_by_employee_id,
            requestedByEmployeeId: r.requested_by_employee_id,
            productEditApprovals: r.product_edit_approvals,
            rejectionReason: r.rejection_reason,
            rejectedBy: r.rejected_by,
            rejectedAt: r.rejected_at,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            layoutRevisionId: r.layout_revision_id,
            layout_revision_id: r.layout_revision_id,
            currentProduct: r.product_id ? productMap.get(r.product_id) : undefined
        }));

        return {
            data: items,
            totalCount,
            page,
            pageSize,
            totalPages,
            hasMore
        };
    },

    async getMerchandisingPending(countryCode: string, limit = 100): Promise<PendingInventoryChange[]> {
        const result = await this.getMerchandisingRequests(countryCode, { limit, status: 'pending' });
        return result.data;
    },
    async getAll(siteId?: string, countryCode?: string, limit: number = 25, regionCode?: string, page = 1, pendingOnly = false): Promise<PendingInventoryChange[]> {
        // RULE 10: 25-record shelf limit
        let query = supabase.from('inventory_requests').select('id,product_id,product_name,product_sku,site_id,country_code,region_code,change_type,requested_by,requested_by_employee_id,requested_at,status,proposed_changes,adjustment_type,adjustment_qty,adjustment_reason,approved_by,approved_at,rejected_by,rejected_at,rejection_reason,finance_approved_by_employee_id,product_edit_approvals').limit(limit);
        if (siteId) query = query.eq('site_id', siteId);
        if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
        if (regionCode) query = query.eq('region_code', regionCode);
        if (pendingOnly) query = query.eq('status', 'pending').neq('change_type', 'edit');
        query = query.range((page - 1) * limit, page * limit - 1);

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) throw error;

        return (data || []).map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSku: r.product_sku,
            siteId: r.site_id,
            countryCode: r.country_code,
            regionCode: r.region_code,
            region_code: r.region_code,
            changeType: r.change_type,
            requestedBy: r.requested_by,
            requestedAt: r.requested_at,
            status: r.status,
            proposedChanges: r.proposed_changes,
            proposalBaseline: r.product_edit_baseline,
            adjustmentType: r.adjustment_type,
            adjustmentQty: r.adjustment_qty,
            adjustmentReason: r.adjustment_reason,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            rejectionReason: r.rejection_reason,
            rejectedBy: r.rejected_by,
            requestedByEmployeeId: r.requested_by_employee_id,
            financeApprovedByEmployeeId: r.finance_approved_by_employee_id,
            productEditApprovals: r.product_edit_approvals,
            rejectedAt: r.rejected_at
        }));
    },

    async create(request: Omit<PendingInventoryChange, 'id'>) {
        let country = request.countryCode || (request as any).country_code;
        let regionCode = request.regionCode || (request as any).region_code;

        // Resilient resolution: if country or region is missing, fetch from sites table
        if ((!country || !regionCode) && request.siteId) {
            try {
                const { data: site } = await supabase
                    .from('sites')
                    .select('country, region_code')
                    .eq('id', request.siteId)
                    .maybeSingle();
                if (site) {
                    if (!country && site.country) {
                        country = site.country;
                    }
                    if (!regionCode && site.region_code) {
                        regionCode = site.region_code;
                    }
                }
            } catch (err) {
                logger.warn('inventoryRequestsService', 'Could not resolve country/region for site', { siteId: request.siteId });
            }
        }

        const resolvedCountry = (country || 'ET').toUpperCase();

        const insertPayload = {
            site_id: request.siteId,
            country_code: resolvedCountry,
            region_code: regionCode || null,
            product_id: request.productId || null,
            product_name: request.productName,
            product_sku: request.productSku,
            change_type: request.changeType,
            requested_by: request.requestedBy,
            status: request.status || 'pending',
            approved_by: request.approvedBy || null,
            approved_at: request.approvedAt || null,
            proposed_changes: request.changeType === 'edit' ? productEditFields(request.proposedChanges || {}) : request.proposedChanges,
            adjustment_type: request.adjustmentType,
            adjustment_qty: request.adjustmentQty,
            adjustment_reason: request.changeType === 'edit' && Object.keys(request.proposedChanges || {}).some(key => ['price', 'costPrice', 'salePrice', 'isOnSale'].includes(key))
                ? `PRICE_CHANGE: ${request.adjustmentReason || 'Product edit'}` : request.adjustmentReason
        };

        const { data, error } = await supabase
            .from('inventory_requests')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            logger.error('inventoryRequestsService', 'create FAILED:', error);
            throw error;
        }
        return {
            ...data,
            siteId: data.site_id,
            productId: data.product_id,
            productName: data.product_name,
            productSku: data.product_sku,
            changeType: data.change_type,
            requestedBy: data.requested_by,
            requestedAt: data.requested_at,
            countryCode: data.country_code,
            regionCode: data.region_code,
            region_code: data.region_code,
            proposedChanges: data.proposed_changes,
            adjustmentType: data.adjustment_type,
            adjustmentQty: data.adjustment_qty,
            adjustmentReason: data.adjustment_reason
        };
    },

    async update(id: string, updates: Partial<PendingInventoryChange>) {
        const dbUpdates: any = {
            status: updates.status,
            approved_by: updates.approvedBy,
            approved_at: updates.approvedAt,
            rejection_reason: updates.rejectionReason,
            rejected_by: updates.rejectedBy,
            rejected_at: updates.rejectedAt
        };

        // Remove undefined values to avoid overwriting with null
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) delete dbUpdates[key];
        });

        const { data, error } = await supabase
            .from('inventory_requests')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('inventoryRequestsService', 'update FAILED:', error);
            throw error;
        }

        return {
            ...data,
            siteId: data.site_id,
            productId: data.product_id,
            productName: data.product_name,
            productSku: data.product_sku,
            changeType: data.change_type,
            requestedBy: data.requested_by,
            requestedAt: data.requested_at,
            countryCode: data.country_code,
            regionCode: data.region_code,
            region_code: data.region_code,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at
        };
    },

    async delete(id: string) {
        const { error } = await supabase.from('inventory_requests').delete().eq('id', id);
        if (error) {
            logger.error('inventoryRequestsService', 'delete FAILED:', error);
            throw error;
        }
    }
};
