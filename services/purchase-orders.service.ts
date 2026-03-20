import { supabase } from '../lib/supabase';
import type { PurchaseOrder } from '../types';
import { wmsJobsService } from './wms-jobs.service';
import { generateNextPONumber } from '../utils/jobIdFormatter';

export const purchaseOrdersService = {
    async getAll(siteId?: string, limit: number = 500, offset: number = 0, filters?: any) {
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

        if (filters?.isRequest !== undefined) {
            // Handle requests vs POs based on flag
            // Assuming requests are identified by status 'Request' or separate logic? 
            // Actually currently logic seems to be: isRequest param passed separately?
            // No, in fetchData we use { isRequest: true/false }
            // We need to clarify how requests are distinguished. 
            // Looking at fetchData: isRequest differentiates cache, but does it filter DB?
            // Actually the DB query below filters by status if passed. 
            // If isRequest=true, status might be 'Pending' but approvedBy is null?
            // For now, let's stick to existing filters and add new ones.
        }

        // NEW: Filter by Supplier
        if (filters?.supplierId) {
            query = query.eq('supplier_id', filters.supplierId);
        }

        // NEW: Dynamic Sorting
        // Default to created_at descending if not specified
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
                // poNumber is mapped below
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
                    let fullName = i.product_name || '';
                    // Parse bundled deep attributes from description JSON
                    let deepAttrs: any = {};
                    try { if (i.description && i.description.startsWith('{')) deepAttrs = JSON.parse(i.description); } catch { }

                    return {
                        ...i,
                        productId: i.product_id,
                        sku: i.sku || i.products?.sku || '',
                        productName: fullName,
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
    },

    async getMetrics(siteId?: string, filters?: any) {
        const params: any = {};
        if (siteId) params.p_site_id = siteId;
        if (filters?.startDate) params.p_start_date = `${filters.startDate}T00:00:00`;
        if (filters?.endDate) params.p_end_date = `${filters.endDate}T23:59:59`;

        // DEBUG: Log exact parameters being sent 

        const { data, error } = await supabase.rpc('get_procurement_metrics', params);

        // DEBUG: Log the raw response

        if (error) {
            console.error('Error fetching procurement metrics:', error);
            // Fallback to empty structure to prevent crash
            return {
                totalSpend: 0,
                openPO: 0,
                pendingValue: 0,
                potentialRevenue: 0,
                categoryData: [],
                trendData: []
            };
        }
        return data;
    },

    async getById(id: string) {
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
                let fullName = i.product_name || '';
                // Parse bundled deep attributes from description JSON
                let deepAttrs: any = {};
                try { if (i.description && i.description.startsWith('{')) deepAttrs = JSON.parse(i.description); } catch { }

                return {
                    ...i,
                    productId: i.product_id,
                    sku: i.sku || i.products?.sku || '',
                    productName: fullName,
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
    },

    async create(po: Omit<PurchaseOrder, 'created_at' | 'updated_at'>, items: any[]) {
        // Use provided ID or generate a new UUID
        const poId = po.id || crypto.randomUUID();

        // Database now supports Draft and Approved status directly
        const dbStatus = po.status;

        // Generate simple sequential PO number if not provided
        let poNumber = po.poNumber;
        if (!poNumber) {
            try {
                // Get the latest PO created to find the last sequence number
                // We order by created_at to avoid lexicographical ordering issues with different formats
                const { data: latestPOs, error: fetchError } = await supabase
                    .from('purchase_orders')
                    .select('po_number')
                    .not('po_number', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5); // Check last 5 to be safe in case of drafts/cancelled weirdness

                let lastValidPONumber: string | undefined;
                if (!fetchError && latestPOs && latestPOs.length > 0) {
                    // Try to find the most recent one that matches our new format AAAA0000
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

        // Create PO
        const dbPO = {
            id: poId,
            site_id: po.siteId,
            supplier_id: po.supplierId === 'UNSPECIFIED' ? null : po.supplierId, // Convert UNSPECIFIED to null
            supplier_name: po.supplierName,
            order_date: po.date,
            status: dbStatus, // Use mapped status
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
            created_by: po.createdBy
            // Note: approval tracking is handled via notes field (see update function)
        };
        const { error: poError } = await supabase
            .from('purchase_orders')
            .insert(dbPO);

        if (poError) throw poError;

        // Create PO items
        const itemsWithPOId = items.map(item => {
            // Check if productId is a valid UUID (starts with hex chars and has dashes)
            // If it's a custom ID like "CUSTOM-xxx", set to null
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

        // Try insert with all columns first; if DB hasn't been migrated yet, retry without new columns
        let { error: itemsError } = await supabase
            .from('po_items')
            .insert(itemsWithPOId);

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

        return await this.getById(poId);
    },

    async update(id: string, updates: Partial<PurchaseOrder>) {
        // Start with an empty object and only add fields that should be updated
        const dbUpdates: any = {};

        // Fetch current PO to get existing state (needed for logic)
        const currentPO = await this.getById(id);
        const currentNotes = currentPO?.notes || '';

        // Determine Effective Status (Update or Existing)
        const effectiveStatus = updates.status || currentPO.status;

        // Handle Approval Specific Logic (Tagging)
        if (updates.status === 'Approved' || (currentPO.status !== 'Approved' && updates.approvedBy)) {
            // Check if already approved (avoid duplicate tags)
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

        // --- HANDLE LINE ITEM UPDATES ---
        // Crucial: If lineItems are in the update, we must update the 'po_items' table.
        // We do this by deleting existing items and re-inserting the new ones.
        if (updates.lineItems && updates.lineItems.length > 0) {

            // 1. Delete existing items
            const { error: deleteError } = await supabase
                .from('po_items')
                .delete()
                .eq('po_id', id);

            if (deleteError) {
                console.error('Failed to delete existing PO items during update:', deleteError);
                throw deleteError;
            }

            // 2. Insert new items
            const itemsWithPOId = updates.lineItems.map((item: any) => {
                // Check if productId is a valid UUID
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
                    identity_type: item.identityType || 'known'
                };
            });

            const { error: insertError } = await supabase
                .from('po_items')
                .insert(itemsWithPOId);

            if (insertError) {
                console.error('Failed to insert new PO items during update:', insertError);
                throw insertError;
            }
        }

        // AUTO-CREATE JOB CHECK (Run on ANY update if status is Approved)
        // This ensures that if job creation failed previously, editing/saving the PO will retry it.
        // Also uses the LATEST line items.
        if (effectiveStatus === 'Approved' || dbUpdates.status === 'Approved') {
            try {
                // Check if job already exists for this PO
                const { count } = await supabase
                    .from('wms_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_ref', id)
                    .eq('type', 'RECEIVE');

                if (!count || count === 0) {
                    // Use updated line items if available, otherwise current items
                    const sourceItems = updates.lineItems || currentPO.lineItems || [];

                    const jobItems = sourceItems.map((item: any) => {
                        // Compose full display name: product name + size (if not already included)
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

                    // Map Priority (PO 'Urgent' -> Job 'Critical')
                    let priority: any = currentPO.priority || 'Normal';
                    if (priority === 'Urgent') priority = 'Critical';
                    if (priority === 'Low') priority = 'Normal';

                    if (wmsJobsService) {
                        await wmsJobsService.create({
                            siteId: updates.siteId || currentPO.siteId, // Use updated siteId if changed
                            type: 'RECEIVE',
                            priority: priority,
                            status: 'Pending',
                            items: jobItems.length,
                            lineItems: jobItems,
                            orderRef: id,
                            jobNumber: currentPO.po_number || currentPO.id,
                            location: 'INBOUND_DOCK',
                            // For RECEIVE jobs, sourceSiteId is undefined because goods come from external suppliers, not other sites
                            sourceSiteId: undefined
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to auto-create Receiving Job:', err);
            }
        }

        // Map camelCase to snake_case for other fields (only if they exist in updates)
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

        // Remove any undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });

        const { data, error } = await supabase
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

        // Return the updated PO with proper mapping
        return await this.getById(id);
    },

    async receive(id: string, shouldCreateJob = true) {
        // 1. Get PO details first (to create Putaway job with items)
        const po = await this.getById(id);
        if (!po) throw new Error('Purchase Order not found');

        // 2. Update PO status to Received
        const { error } = await supabase
            .from('purchase_orders')
            .update({
                status: 'Received',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Failed to update PO status:', error);
            throw error;
        }

        // 3. Create Putaway Job from the PO contents (Optional)
        if (!shouldCreateJob) {
            return await this.getById(id);
        }

        try {
            // Check if ANY Putaway job already exists for this PO to prevent double creation
            const { data: existingJobs } = await supabase
                .from('wms_jobs')
                .select('id')
                .eq('order_ref', id)
                .eq('type', 'PUTAWAY')
                .limit(1);

            if (existingJobs && existingJobs.length > 0) {
                return await this.getById(id);
            }

            // Find if there's an existing RECEIVE job to inherit its number
            const { data: receiveJob } = await supabase
                .from('wms_jobs')
                .select('job_number')
                .eq('order_ref', id)
                .eq('type', 'RECEIVE')
                .maybeSingle();

            const finalJobNumber = receiveJob?.job_number || po.poNumber || po.id;

            const createdJob = await wmsJobsService.create({
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
                    receivedQty: 0
                })),
                requestedBy: 'System (PO Receipt)',
                notes: `Auto-generated Putaway for PO ${po.poNumber || po.id}`
            } as any);
        } catch (e) {
            console.error('Failed to create Putaway job during PO receive:', e);
            // Don't throw here, prioritize PO status update success
        }

        // 4. Also update the associated WMS job to Completed if it exists (the RECEIVE job)
        try {
            // Find open RECEIVE job for this PO
            const { data: job } = await supabase
                .from('wms_jobs')
                .select('id')
                .eq('type', 'RECEIVE')
                .eq('order_ref', id)
                .neq('status', 'Completed') // Only if not already completed
                .maybeSingle();

            if (job) {
                await supabase
                    .from('wms_jobs')
                    .update({ status: 'Completed' })
                    .eq('id', job.id);
            }
        } catch (e) {
            console.error('Failed to close WMS job during PO receive:', e);
        }

        return await this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
