/**
 * Purchase Orders — read operations
 * Extracted from purchase-orders.service.ts to keep file size manageable.
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// getAll
// ============================================================================

export async function getAll(siteId?: string, limit: number = 500, offset: number = 0, filters?: any) {
    let query = supabase
        .from('purchase_orders')
        .select('*, po_items(*, products(sku))', { count: 'exact' });

    if (siteId) {
        query = query.eq('site_id', siteId);
    }

    // Apply Filters
    if (filters) {
        if (filters.status && filters.status !== 'All') {
            query = query.eq('status', filters.status);
        }
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('created_at', `${filters.endDate}T23:59:59`);
        }
        if (filters.search) {
            const term = filters.search;
            query = query.or(`po_number.ilike.%${term}%,supplier_name.ilike.%${term}%`);
        }
    }

    // Filter by Supplier
    if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
    }

    // Dynamic Sorting — default to created_at descending
    const sortBy = filters?.sortBy || 'created_at';
    const sortDir = filters?.sortDir || 'desc';
    query = query.order(sortBy, { ascending: sortDir === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const mappedData = data.map((p: any) => {
        // Parse approval info from notes (stored as [APPROVED_BY:name:date] tag)
        let approvedBy = null;
        let approvedAt = null;
        let notes = p.notes;

        const approvalMatch = p.notes ? p.notes.match(/\[APPROVED_BY:(.*?):(.*?)]/) : null;
        if (approvalMatch) {
            approvedBy = approvalMatch[1];
            approvedAt = approvalMatch[2];
        }

        // Reverse map status: Pending without approval = Draft
        let frontendStatus = p.status;
        if (p.status === 'Pending' && !approvedBy) {
            frontendStatus = 'Draft';
        } else if (p.status === 'Pending' && approvedBy) {
            frontendStatus = 'Approved';
        }

        return {
            ...p,
            status: frontendStatus,
            date: p.order_date,
            requestedBy: p.requested_by,
            createdBy: p.created_by,
            approvedBy,
            approvedAt,
            notes,
            siteId: p.site_id,
            supplierId: p.supplier_id,
            supplierName: p.supplier_name,
            totalAmount: p.total_amount,
            itemsCount: p.items_count,
            expectedDelivery: p.expected_delivery,
            shippingCost: p.shipping_cost,
            taxAmount: p.tax_amount,
            paymentTerms: p.payment_terms,
            tempReq: p.temp_req,
            shelfLife: p.shelf_life,
            dockSlot: p.dock_slot,
            poNumber: p.po_number,
            lineItems: (p.po_items || []).map((i: any) => {
                let deepAttrs: any = {};
                try { if (i.description && i.description.startsWith('{')) deepAttrs = JSON.parse(i.description); } catch { }

                return {
                    ...i,
                    productId: i.product_id,
                    sku: i.sku || i.products?.sku || '',
                    productName: i.product_name || '',
                    unitCost: i.unit_cost,
                    retailPrice: i.retail_price || 0,
                    totalCost: i.total_cost,
                    receivedQty: i.received_qty,
                    rejectedQty: i.rejected_qty,
                    brand: i.brand || '',
                    size: i.size || '',
                    unit: i.unit || '',
                    category: i.category || '',
                    identityType: i.identity_type || 'known',
                    packQuantity: deepAttrs.packQuantity || i.pack_quantity || 1,
                    description: deepAttrs.text || '',
                    minStock: deepAttrs.minStock || i.min_stock || 0,
                    maxStock: deepAttrs.maxStock || i.max_stock || 0,
                    customAttributes: deepAttrs.customAttributes || i.custom_attributes || null
                };
            }),
            createdAt: p.created_at,
            updatedAt: p.updated_at
        };
    });

    return { data: mappedData, count: count || 0 };
}

// ============================================================================
// getMetrics
// ============================================================================

export async function getMetrics(siteId?: string, filters?: any) {
    const params: any = {};
    if (siteId) params.p_site_id = siteId;
    if (filters?.startDate) params.p_start_date = `${filters.startDate}T00:00:00`;
    if (filters?.endDate) params.p_end_date = `${filters.endDate}T23:59:59`;

    const { data, error } = await supabase.rpc('get_procurement_metrics', params);

    if (error) {
        console.error('Error fetching procurement metrics:', error);
        return { totalSpend: 0, openPO: 0, pendingValue: 0, potentialRevenue: 0, categoryData: [], trendData: [] };
    }
    return data;
}

// ============================================================================
// getById
// ============================================================================

export async function getById(id: string) {
    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, po_items(*, products(sku))')
        .eq('id', id)
        .single();

    if (error) throw error;

    // Parse approval info from notes (stored as [APPROVED_BY:name:date] tag)
    let approvedBy = null;
    let approvedAt = null;
    let notes = data.notes;

    const approvalMatch = data.notes ? data.notes.match(/\[APPROVED_BY:(.*?):(.*?)]/) : null;
    if (approvalMatch) {
        approvedBy = approvalMatch[1];
        approvedAt = approvalMatch[2];
    }

    // Reverse map status: Pending without approval = Draft
    let frontendStatus = data.status;
    if (data.status === 'Pending' && !approvedBy) {
        frontendStatus = 'Draft';
    } else if (data.status === 'Pending' && approvedBy) {
        frontendStatus = 'Approved';
    }

    return {
        ...data,
        status: frontendStatus,
        date: data.order_date,
        requestedBy: data.requested_by,
        createdBy: data.created_by,
        approvedBy,
        approvedAt,
        notes,
        siteId: data.site_id,
        supplierId: data.supplier_id,
        supplierName: data.supplier_name,
        totalAmount: data.total_amount,
        itemsCount: data.items_count,
        expectedDelivery: data.expected_delivery,
        shippingCost: data.shipping_cost,
        taxAmount: data.tax_amount,
        paymentTerms: data.payment_terms,
        tempReq: data.temp_req,
        shelfLife: data.shelf_life,
        dockSlot: data.dock_slot,
        poNumber: data.po_number,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lineItems: data.po_items.map((i: any) => {
            let deepAttrs: any = {};
            try { if (i.description && i.description.startsWith('{')) deepAttrs = JSON.parse(i.description); } catch { }

            return {
                ...i,
                productId: i.product_id,
                sku: i.sku || i.products?.sku || '',
                productName: i.product_name || '',
                unitCost: i.unit_cost,
                totalCost: i.total_cost,
                receivedQty: i.received_qty,
                rejectedQty: i.rejected_qty,
                retailPrice: i.retail_price || 0,
                image: i.image || '',
                brand: i.brand || '',
                size: i.size || '',
                unit: i.unit || '',
                category: i.category || '',
                identityType: i.identity_type || 'known',
                packQuantity: deepAttrs.packQuantity || i.pack_quantity || 1,
                description: deepAttrs.text || '',
                minStock: deepAttrs.minStock || i.min_stock || 0,
                maxStock: deepAttrs.maxStock || i.max_stock || 0,
                customAttributes: deepAttrs.customAttributes || i.custom_attributes || null
            };
        })
    };
}
