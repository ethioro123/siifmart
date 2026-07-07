import { supabase } from '../lib/supabase';
import type { PurchaseOrder } from '../types';
import { wmsJobsService } from './wms-jobs.service';
import { generateNextPONumber } from '../utils/jobIdFormatter';
import { getAll, getMetrics, getById } from './purchase-orders.read';

export const purchaseOrdersService = {
    // Re-export read operations so consumers can import from one place
    getAll,
    getMetrics,
    getById,

    async create(po: Omit<PurchaseOrder, 'created_at' | 'updated_at'>, items: any[]) {
        const poId = po.id || crypto.randomUUID();
        const dbStatus = po.status;

        // Generate simple sequential PO number if not provided
        let poNumber = po.poNumber;
        if (!poNumber) {
            try {
                const { data: latestPOs, error: fetchError } = await supabase
                    .from('purchase_orders')
                    .select('po_number')
                    .not('po_number', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5);

                let lastValidPONumber: string | undefined;
                if (!fetchError && latestPOs && latestPOs.length > 0) {
                    const match = latestPOs.find(p => p.po_number?.match(/^[A-Z]{4}\d{4}$/i));
                    if (match) {
                        lastValidPONumber = match.po_number;
                    }
                }

                poNumber = generateNextPONumber(lastValidPONumber);
            } catch (error) {
                console.warn('Failed to generate sequential PO number, using fallback:', error);
                poNumber = `AUTO-${Date.now().toString().slice(-8)}`;
            }
        }

        const dbPO = {
            id: poId,
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
            destination: po.destination,
            discount: po.discount,
            temp_req: po.tempReq,
            shelf_life: po.shelfLife,
            dock_slot: po.dockSlot,
            po_number: poNumber,
            requested_by: po.requestedBy,
            created_by: po.createdBy,
            priority: po.priority
        };

        const { error: poError } = await supabase.from('purchase_orders').insert(dbPO);
        if (poError) throw poError;

        // Create PO items
        const itemsWithPOId = items.map(item => {
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);
            return {
                po_id: poId,
                product_id: isValidUUID ? item.productId : null,
                product_name: item.productName,
                sku: item.sku || null,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                total_cost: item.totalCost,
                retail_price: item.retailPrice || 0,
                image: item.image || null,
                brand: item.brand || null,
                size: item.size || null,
                unit: item.unit || null,
                category: item.category || null,
                identity_type: item.identityType || 'known',
                pack_quantity: item.packQuantity || 1,
                description: item.description || null,
                min_stock: item.minStock || 0,
                max_stock: item.maxStock || 0,
                custom_attributes: item.customAttributes || null
            };
        });

        // Try insert with all columns first; retry without new columns if migration not run
        let { error: itemsError } = await supabase.from('po_items').insert(itemsWithPOId);

        if (itemsError && itemsError.code === 'PGRST204') {
            console.warn('⚠️ po_items migration not run yet. Falling back to basic columns. Run supabase_add_po_item_columns.sql to fix.');
            const basicItems = itemsWithPOId.map(({ pack_quantity, description, min_stock, max_stock, custom_attributes, ...rest }: any) => rest);
            const retry = await supabase.from('po_items').insert(basicItems);
            itemsError = retry.error;
        }

        if (itemsError) {
            console.error('PO Items Insert Error:', itemsError);
            throw new Error(`PO Items Insert Failed: ${itemsError.message} (PO ID: ${poId})`);
        }

        return await getById(poId);
    },

    async update(id: string, updates: Partial<PurchaseOrder>) {
        const dbUpdates: any = {};

        const currentPO = await getById(id);
        const currentNotes = currentPO?.notes || '';
        const effectiveStatus = updates.status || currentPO.status;

        // Handle Approval Specific Logic (Tagging)
        if (updates.status === 'Approved' || (currentPO.status !== 'Approved' && updates.approvedBy)) {
            const alreadyApproved = currentNotes?.includes('[APPROVED_BY:');
            if (!alreadyApproved) {
                const approvalTag = `\n[APPROVED_BY:${updates.approvedBy || 'System'}:${updates.approvedAt || new Date().toISOString()}]`;
                dbUpdates.notes = currentNotes + approvalTag;
            }
            dbUpdates.status = 'Approved';
        } else if (updates.status === 'Cancelled') {
            dbUpdates.status = 'Cancelled';
        } else if (updates.status) {
            dbUpdates.status = String(updates.status);
        }

        // Handle Line Item Updates (delete + re-insert)
        if (updates.lineItems && updates.lineItems.length > 0) {
            const { error: deleteError } = await supabase.from('po_items').delete().eq('po_id', id);
            if (deleteError) {
                console.error('Failed to delete existing PO items during update:', deleteError);
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
                    pack_quantity: item.packQuantity || 1,
                    description: item.description || null,
                    min_stock: item.minStock || 0,
                    max_stock: item.maxStock || 0,
                    custom_attributes: item.customAttributes || null
                };
            });

            const { error: insertError } = await supabase.from('po_items').insert(itemsWithPOId);
            if (insertError) {
                console.error('Failed to insert new PO items during update:', insertError);
                throw insertError;
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
                console.error('Failed to auto-create Receiving Job:', err);
            }
        }

        // Map camelCase to snake_case for scalar fields
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; }
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
        if (updates.dockSlot !== undefined) { dbUpdates.dock_slot = updates.dockSlot; }
        if (updates.createdBy !== undefined) { dbUpdates.created_by = updates.createdBy; }
        if (updates.requestedBy !== undefined) { dbUpdates.requested_by = updates.requestedBy; }
        if (updates.poNumber !== undefined) { dbUpdates.po_number = updates.poNumber; }
        if (updates.notes !== undefined && !dbUpdates.notes) { dbUpdates.notes = updates.notes; }
        if (updates.date !== undefined) { dbUpdates.order_date = updates.date; }
        if (updates.destination !== undefined) { dbUpdates.destination = updates.destination; }
        if (updates.discount !== undefined) { dbUpdates.discount = updates.discount; }
        if (updates.incoterms !== undefined) { dbUpdates.incoterms = updates.incoterms; }
        if (updates.priority !== undefined) { dbUpdates.priority = updates.priority; }

        // Remove undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) delete dbUpdates[key];
        });

        const { error } = await supabase
            .from('purchase_orders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('PO Update Error:', error);
            console.error('Update payload:', dbUpdates);
            throw error;
        }

        return await getById(id);
    },

    async receive(id: string, shouldCreateJob = true) {
        const po = await getById(id);
        if (!po) throw new Error('Purchase Order not found');

        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'Received', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Failed to update PO status:', error);
            throw error;
        }

        if (!shouldCreateJob) {
            return await getById(id);
        }

        try {
            const { data: existingJobs } = await supabase
                .from('wms_jobs')
                .select('id')
                .eq('order_ref', id)
                .eq('type', 'PUTAWAY')
                .limit(1);

            if (existingJobs && existingJobs.length > 0) {
                return await getById(id);
            }

            const { data: receiveJob } = await supabase
                .from('wms_jobs')
                .select('job_number')
                .eq('order_ref', id)
                .eq('type', 'RECEIVE')
                .maybeSingle();

            const finalJobNumber = receiveJob?.job_number || po.poNumber || po.id;

            await wmsJobsService.create({
                siteId: po.siteId,
                type: 'PUTAWAY',
                priority: (po as any).priority || 'Normal',
                status: 'Pending',
                items: po.itemsCount,
                orderRef: po.id,
                jobNumber: finalJobNumber,
                lineItems: po.lineItems.map((item: any) => ({
                    productId: item.productId,
                    name: item.productName,
                    sku: item.sku,
                    image: item.image || '',
                    expectedQty: item.quantity,
                    pickedQty: 0,
                    status: 'Pending',
                    receivedQty: 0,
                    cost: item.unitCost,
                    retailPrice: item.retailPrice,
                    unit: item.unit,
                    size: item.size,
                    brand: item.brand,
                    packQuantity: item.packQuantity,
                    category: item.category,
                    customAttributes: item.customAttributes,
                    description: item.description,
                    minStock: item.minStock,
                    maxStock: item.maxStock
                })),
                requestedBy: 'System (PO Receipt)',
                notes: `Auto-generated Putaway for PO ${po.poNumber || po.id}`
            } as any);
        } catch (e) {
            console.error('Failed to create Putaway job during PO receive:', e);
        }

        // Close the associated RECEIVE job if it exists
        try {
            const { data: job } = await supabase
                .from('wms_jobs')
                .select('id')
                .eq('type', 'RECEIVE')
                .eq('order_ref', id)
                .neq('status', 'Completed')
                .maybeSingle();

            if (job) {
                await supabase.from('wms_jobs').update({ status: 'Completed' }).eq('id', job.id);
            }
        } catch (e) {
            console.error('Failed to close WMS job during PO receive:', e);
        }

        return await getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
        if (error) throw error;
    }
};
