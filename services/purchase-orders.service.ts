import { supabase } from '../lib/supabase';
import type { PurchaseOrder } from '../types';
import { wmsJobsService } from './wms-jobs.service';
import { getAll, getMetrics, getById } from './purchase-orders.read';
import { logger } from '../utils/logger';
import { systemLogsService } from './system-logs.service';
import { getEffectiveCountry } from '../utils/localization';
import { purchaseOrdersApprovalService } from './purchase-orders.approval';
import { purchaseOrdersLifecycleService } from './purchase-orders.lifecycle';

async function validateWarehouseDestination(siteId?: string): Promise<{ name?: string; type?: string; region_code?: string; country?: string } | null> {
    if (!siteId) return null;
    try {
        const { data: s } = await supabase.from('sites').select('name, type, region_code, country').eq('id', siteId).maybeSingle();
        if (s && s.type !== 'Warehouse' && s.type !== 'Distribution Center') {
            throw new Error(`Procurement policy violation: Purchase orders can only be sent to a Warehouse or Distribution Center. Selected site "${s.name}" is a ${s.type}.`);
        }
        return s;
    } catch (err) {
        if (err instanceof Error && err.message.includes('Procurement policy violation')) throw err;
        return null;
    }
}

export const purchaseOrdersService = {
    // Re-export read operations so consumers can import from one place
    getAll,
    getMetrics,
    getById,
    approve: purchaseOrdersApprovalService.approve,
    clearFinance: purchaseOrdersApprovalService.clearFinance,
    reject: purchaseOrdersApprovalService.reject,

    async create(po: Omit<PurchaseOrder, 'created_at' | 'updated_at'>, items: any[]) {
        const poId = po.id || crypto.randomUUID();
        const dbStatus = po.status;

        // Enforce enterprise procurement policy: Purchase orders can only be sent to Warehouse or Distribution Center
        const destSite = await validateWarehouseDestination(po.siteId);

        const explicitPoNumber = po.po_number || po.poNumber;
        const dbPO = {
            id: poId,
            ...(explicitPoNumber ? { po_number: explicitPoNumber } : {}),
            site_id: po.siteId,
            supplier_id: po.supplierId === 'UNSPECIFIED' ? null : po.supplierId,
            supplier_name: po.supplierName,
            order_date: po.date,
            status: dbStatus,
            total_amount: po.totalAmount,
            items_count: po.itemsCount,
            expected_delivery: po.expectedDelivery,
            shipping_cost: po.shippingCost,
            tax_amount: po.taxAmount,
            notes: po.notes,
            payment_terms: po.paymentTerms,
            incoterms: po.incoterms,
            destination: po.destination || destSite?.name || null,
            discount: po.discount,
            temp_req: po.tempReq,
            shelf_life: po.shelfLife,
            dock_slot: po.dockSlot || null,
            requested_by: po.requestedBy,
            created_by: po.createdBy,
            priority: po.priority,
            currency: po.currency || 'ETB',
            country_code: po.countryCode || po.country_code || destSite?.country || getEffectiveCountry({ country: po.countryCode || po.country_code, currency: po.currency }),
            region_code: po.regionCode || po.region_code || destSite?.region_code || null,
            requires_hq_approval: Boolean(po.requiresHqApproval || po.requires_hq_approval)
        };

        const insertBuilder: any = supabase.from('purchase_orders').insert(dbPO);
        let { data: insertedPO, error: poError } = typeof insertBuilder?.select === 'function'
            ? await insertBuilder.select('po_number').single()
            : await insertBuilder;
        if (poError && (poError.code === '42703' || poError.message?.includes('country_code'))) {
            logger.warn('PurchaseOrdersService', 'purchase_orders.country_code column not present on DB, inserting without country_code');
            const { country_code: _, ...fallbackPO } = dbPO;
            const retryBuilder: any = supabase.from('purchase_orders').insert(fallbackPO);
            const retry = typeof retryBuilder?.select === 'function'
                ? await retryBuilder.select('po_number').single()
                : await retryBuilder;
            insertedPO = retry.data;
            poError = retry.error;
        }
        if (poError) throw poError;
        const poNumber = insertedPO?.po_number || explicitPoNumber;

        // Create PO items
        const itemsWithPOId = items.map(item => {
            const rawProdId = item.productId || item.product_id;
            const isValidUUID = Boolean(rawProdId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawProdId));
            return {
                po_id: poId,
                product_id: isValidUUID ? rawProdId : null,
                product_name: item.productName || item.product_name,
                sku: item.sku || null,
                quantity: item.quantity,
                unit_cost: item.unitCost ?? item.unit_cost ?? 0,
                total_cost: item.totalCost ?? item.total_cost ?? (item.quantity * (item.unitCost ?? item.unit_cost ?? 0)),
                retail_price: item.retailPrice ?? item.retail_price ?? 0,
                image: item.image || null,
                brand: item.brand || null,
                size: item.size || null,
                unit: item.unit || null,
                category: item.category || null,
                identity_type: item.identityType || item.identity_type || 'known',
                pack_quantity: item.packQuantity ?? item.pack_quantity ?? 1,
                case_size: item.caseSize ?? item.case_size ?? 0,
                package_type: item.packageType || item.package_type || item.customAttributes?.packaging?.packageType || item.custom_attributes?.packaging?.packageType || null,
                description: item.description || null,
                min_stock: item.minStock ?? item.min_stock ?? 0,
                max_stock: item.maxStock ?? item.max_stock ?? 0,
                custom_attributes: item.customAttributes || item.custom_attributes || null
            };
        });

        // Try insert with all columns first; retry without new columns if migration not run
        let { error: itemsError } = await supabase.from('po_items').insert(itemsWithPOId);

        if (itemsError && itemsError.code === 'PGRST204') {
            logger.warn('PurchaseOrdersService', '⚠️ po_items migration not run yet. Falling back to basic columns.');
            const basicItems = itemsWithPOId.map(({ pack_quantity, case_size, package_type, description, min_stock, max_stock, custom_attributes, ...rest }: any) => rest);
            const retry = await supabase.from('po_items').insert(basicItems);
            itemsError = retry.error;
        }

        if (itemsError) {
            logger.error('PurchaseOrdersService', 'PO Items Insert Error', itemsError);
            throw new Error(`PO Items Insert Failed: ${itemsError.message} (PO ID: ${poId})`);
        }

        // Audit log PO creation
        await systemLogsService.create({
            user_name: po.createdBy || 'System',
            action: 'PURCHASE_ORDER_CREATED',
            module: 'Procurement',
            details: `Created PO ${poNumber} (${po.currency || 'ETB'} ${po.totalAmount}) for site ${po.siteId}`
        });

        // Gracefully attempt re-fetch via getById without crashing on RLS/PostgREST 406
        let fetchedPO: PurchaseOrder | null = null;
        try {
            fetchedPO = await getById(poId);
        } catch (fetchErr) {
            logger.warn('PurchaseOrdersService', 'getById after create bypassed due to RLS/filtering', { error: String(fetchErr) });
        }

        if (fetchedPO) return fetchedPO;

        // Return synthesized created PO record if RLS prevents immediate SELECT
        return {
            ...po,
            id: poId,
            poNumber,
            po_number: poNumber,
            status: po.status || 'Draft',
            lineItems: items,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as PurchaseOrder;
    },

    async update(id: string, updates: Partial<PurchaseOrder>) {
        const dbUpdates: any = {};

        const currentPO = await getById(id).catch(() => null);
        const currentNotes = currentPO?.notes || '';
        const effectiveStatus = updates.status || currentPO.status;

        // Handle Approval Specific Logic (Tagging & DB Columns)
        if (updates.status === 'Approved' || (currentPO && currentPO.status !== 'Approved' && updates.approvedBy)) {
            const alreadyApproved = currentNotes?.includes('[APPROVED_BY:');
            if (!alreadyApproved) {
                const approvalTag = `\n[APPROVED_BY:${updates.approvedBy || 'System'}:${updates.approvedAt || new Date().toISOString()}]`;
                dbUpdates.notes = currentNotes + approvalTag;
            }
            dbUpdates.status = 'Approved';
            if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy;
            if (updates.approvedAt) dbUpdates.approved_at = updates.approvedAt;
        } else if (updates.status === 'Cancelled') {
            dbUpdates.status = 'Cancelled';
        } else if (updates.status) {
            dbUpdates.status = String(updates.status);
        }

        // Handle Line Item Updates (Only allowed for Draft/Pending to prevent post-approval price tampering)
        const isSettled = currentPO && ['Approved', 'Ordered', 'Received', 'Partially Received'].includes(currentPO.status);
        if (updates.lineItems && updates.lineItems.length > 0 && !isSettled) {
            const { error: deleteError } = await supabase.from('po_items').delete().eq('po_id', id);
            if (deleteError) {
                logger.error('PurchaseOrdersService', 'Failed to delete existing PO items during update', deleteError);
                throw deleteError;
            }

            const itemsWithPOId = updates.lineItems.map((item: any) => {
                const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);
                return {
                    po_id: id,
                    product_id: isValidUUID ? item.productId : null,
                    product_name: item.productName,
                    sku: item.sku || null,
                    quantity: item.quantity,
                    unit_cost: item.unitCost,
                    total_cost: item.totalCost || (item.quantity * item.unitCost),
                    retail_price: item.retailPrice || 0,
                    image: item.image || null,
                    brand: item.brand || null,
                    size: item.size || null,
                    unit: item.unit || null,
                    category: item.category || null,
                    identity_type: item.identityType || 'known',
                    pack_quantity: item.packQuantity || item.pack_quantity || 1,
                    case_size: item.caseSize || item.case_size || 0,
                    package_type: item.packageType || item.package_type || item.customAttributes?.packaging?.packageType || null,
                    description: item.description || null,
                    min_stock: item.minStock || 0,
                    max_stock: item.maxStock || 0,
                    custom_attributes: item.customAttributes || null
                };
            });

            const { error: insertError } = await supabase.from('po_items').insert(itemsWithPOId);
            if (insertError) {
                logger.error('PurchaseOrdersService', 'Failed to insert new PO items during update', insertError);
                throw insertError;
            }
        } else if (updates.lineItems && updates.lineItems.length > 0 && isSettled) {
            // Zero-Trust: Never mutate commercial price/qty post-approval, but persist physical receipt metrics
            for (const item of updates.lineItems) {
                const itemUpdate: any = {};
                if (item.receivedQty !== undefined) itemUpdate.received_qty = item.receivedQty;
                if (item.rejectedQty !== undefined) itemUpdate.rejected_qty = item.rejectedQty;
                if (item.productId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId)) {
                    itemUpdate.product_id = item.productId;
                }
                if (item.sku) itemUpdate.sku = item.sku;

                if (Object.keys(itemUpdate).length > 0) {
                    if (item.id) {
                        await supabase.from('po_items').update(itemUpdate).eq('id', item.id);
                    } else if (item.sku) {
                        await supabase.from('po_items').update(itemUpdate).eq('po_id', id).eq('sku', item.sku);
                    } else if (item.productName) {
                        await supabase.from('po_items').update(itemUpdate).eq('po_id', id).eq('product_name', item.productName);
                    }
                }
            }
        }

        // AUTO-CREATE JOB CHECK on Approved status
        if (effectiveStatus === 'Approved' || dbUpdates.status === 'Approved') {
            try {
                const { count } = await supabase
                    .from('wms_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_ref', id)
                    .eq('type', 'RECEIVE');

                if (!count || count === 0) {
                    const sourceItems = updates.lineItems || currentPO.lineItems || [];
                    const jobItems = sourceItems.map((item: any) => {
                        let fullName = item.productName || 'Unknown Item';
                        if (item.size && !fullName.includes(item.size)) {
                            fullName = `${fullName} ${item.size}`.trim();
                        }
                        return {
                            productId: item.productId || 'UNKNOWN',
                            name: fullName,
                            sku: item.sku || '',
                            image: item.image || '',
                            brand: item.brand || '',
                            size: item.size || '',
                            unit: item.unit || '',
                            category: item.category || '',
                            expectedQty: item.quantity || 0,
                            pickedQty: 0,
                            receivedQty: 0,
                            status: 'Pending'
                        };
                    });

                    let priority: any = currentPO.priority || 'Normal';
                    if (priority === 'Urgent') priority = 'Critical';
                    if (priority === 'Low') priority = 'Normal';

                    if (wmsJobsService) {
                        await wmsJobsService.create({
                            siteId: updates.siteId || currentPO.siteId,
                            countryCode: (currentPO as any).country_code || (currentPO as any).countryCode || 'ET',
                            type: 'RECEIVE',
                            priority,
                            status: 'Pending',
                            items: jobItems.length,
                            lineItems: jobItems,
                            orderRef: id,
                            jobNumber: currentPO.po_number || currentPO.id,
                            location: 'INBOUND_DOCK',
                            sourceSiteId: undefined
                        });
                    }
                }
            } catch (err) {
                logger.error('PurchaseOrdersService', 'Failed to auto-create Receiving Job', err as Error);
            }
        }

        // Enforce enterprise procurement policy: Purchase orders can only be routed to Warehouse or Distribution Center
        await validateWarehouseDestination(updates.siteId || currentPO?.siteId);

        // Map camelCase to snake_case for scalar fields.
        // Note: guard_procurement_order_decision forbids mutating (site_id, country_code, region_code, created_by) on existing POs.
        if (!currentPO && updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; }
        if (updates.supplierId !== undefined) { dbUpdates.supplier_id = updates.supplierId === 'UNSPECIFIED' ? null : updates.supplierId; }
        if (updates.supplierName !== undefined) { dbUpdates.supplier_name = updates.supplierName; }
        if (updates.totalAmount !== undefined) { dbUpdates.total_amount = updates.totalAmount; }
        if (updates.itemsCount !== undefined) { dbUpdates.items_count = updates.itemsCount; }
        if (updates.expectedDelivery !== undefined) { dbUpdates.expected_delivery = updates.expectedDelivery; }
        if (updates.shippingCost !== undefined) { dbUpdates.shipping_cost = updates.shippingCost; }
        if (updates.taxAmount !== undefined) { dbUpdates.tax_amount = updates.taxAmount; }
        if (updates.paymentTerms !== undefined) { dbUpdates.payment_terms = updates.paymentTerms; }
        if (updates.tempReq !== undefined) { dbUpdates.temp_req = updates.tempReq; }
        if (updates.shelfLife !== undefined) { dbUpdates.shelf_life = updates.shelfLife; }
        if (updates.dockSlot !== undefined) {
            const nextDock = updates.dockSlot || null;
            const canAssignDock = ['Approved', 'Ordered', 'Partially Received'].includes(effectiveStatus);
            if (!nextDock || canAssignDock || nextDock === (currentPO?.dockSlot || null)) {
                dbUpdates.dock_slot = nextDock;
            }
        }
        if (!currentPO && updates.createdBy !== undefined) { dbUpdates.created_by = updates.createdBy; }
        if (updates.requestedBy !== undefined) { dbUpdates.requested_by = updates.requestedBy; }
        if (updates.receivedBy !== undefined) { dbUpdates.received_by = updates.receivedBy; }
        if (updates.poNumber !== undefined) { dbUpdates.po_number = updates.poNumber; }
        if (updates.notes !== undefined && !dbUpdates.notes) { dbUpdates.notes = updates.notes; }
        if (updates.date !== undefined) { dbUpdates.order_date = updates.date; }
        if (updates.destination !== undefined) { dbUpdates.destination = updates.destination; }
        if (updates.discount !== undefined) { dbUpdates.discount = updates.discount; }
        if (updates.incoterms !== undefined) { dbUpdates.incoterms = updates.incoterms; }
        if (updates.priority !== undefined) { dbUpdates.priority = updates.priority; }
        if (updates.currency !== undefined) { dbUpdates.currency = updates.currency; }
        if (!currentPO) {
            if (updates.countryCode !== undefined) { dbUpdates.country_code = updates.countryCode; }
            if (updates.country_code !== undefined) { dbUpdates.country_code = updates.country_code; }
            if (updates.regionCode !== undefined) { dbUpdates.region_code = updates.regionCode; }
            if (updates.region_code !== undefined) { dbUpdates.region_code = updates.region_code; }
        }
        if (updates.requiresHqApproval !== undefined) { dbUpdates.requires_hq_approval = updates.requiresHqApproval; }
        if (updates.requires_hq_approval !== undefined) { dbUpdates.requires_hq_approval = updates.requires_hq_approval; }
        if (updates.hqApprovedBy !== undefined) { dbUpdates.hq_approved_by = updates.hqApprovedBy; }
        if (updates.hq_approved_by !== undefined) { dbUpdates.hq_approved_by = updates.hq_approved_by; }
        if (updates.hqApprovedAt !== undefined) { dbUpdates.hq_approved_at = updates.hqApprovedAt; }
        if (updates.hq_approved_at !== undefined) { dbUpdates.hq_approved_at = updates.hq_approved_at; }

        // Remove undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) delete dbUpdates[key];
        });

        let { error } = await supabase
            .from('purchase_orders')
            .update(dbUpdates)
            .eq('id', id);

        if (error && (error.code === '42703' || error.message?.includes('country_code'))) {
            logger.warn('PurchaseOrdersService', 'purchase_orders.country_code column not present on DB, updating without country_code');
            const fallback = { ...dbUpdates };
            delete fallback.country_code;
            const retry = await supabase
                .from('purchase_orders')
                .update(fallback)
                .eq('id', id);
            error = retry.error;
        }

        if (error) {
            logger.error('PurchaseOrdersService', 'PO Update Error', error);
            throw error;
        }

        if (updates.status === 'Approved' || effectiveStatus === 'Approved') {
            await systemLogsService.create({
                user_name: updates.approvedBy || 'System',
                action: 'PURCHASE_ORDER_APPROVED',
                module: 'Procurement',
                details: `Approved PO ${currentPO?.poNumber || id}`
            });
        }

        const updated = await getById(id).catch(() => null);
        return updated || ({ ...updates, id } as any);
    },

    receive: purchaseOrdersLifecycleService.receive,
    delete: purchaseOrdersLifecycleService.delete,
    cancel: purchaseOrdersLifecycleService.cancel
};
