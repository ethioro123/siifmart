import { supabase } from '../lib/supabase';
import type { WMSJob } from '../types';


// Helper to generate readable Job Numbers (Strict 4-Char Limit)
// Generates a random alphanumeric code of the given length
// Starts at 6 chars (36^6 = 2.17 billion combos), auto-expands if needed
export const generateReadableJobNumber = (length: number = 6): string => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper: Generate Transfer ID (TR-XXXX)
export const generateTransferId = (): string => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TR-${result}`;
};



export const wmsJobsService = {
    async getById(id: string) {
        // Fetch job using JSONB line_items (Standardized Architecture)
        // We do NOT join wms_job_items because the system writes to the JSON column 'line_items'
        const { data, error } = await supabase
            .from('wms_jobs')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        // Map line items to match frontend structure
        const job = {
            ...data,
            siteId: data.site_id,
            trackingNumber: data.tracking_number,
            destSiteId: data.dest_site_id,
            sourceSiteId: data.source_site_id,
            items: data.items_count,
            lineItems: (data.line_items || []).map((item: any) => ({
                id: item.id,
                jobId: item.job_id,
                productId: item.product_id,
                name: item.name,
                sku: item.sku,
                expectedQty: item.expected_qty,
                pickedQty: item.picked_qty,
                status: item.status,
                location: item.location,
                expiryDate: item.expiryDate,
                batchNumber: item.batchNumber,
                condition: item.condition
            })),
            completedBy: data.completed_by, // [FIX] Map completed_by
            completedAt: data.completed_at,  // [FIX] Map completed_at
            externalCarrierName: data.external_carrier_name, // [NEW] Map external_carrier_name
            assignedBy: data.assigned_by // [NEW] Map assigned_by
        };

        return job;
    },

    async getAll(siteId?: string, limit: number = 500) {
        // 1. Fetch ALL Active Jobs (Pending/In-Progress) for the site
        // We don't limit these because they represent the operational backlog that MUST be visible
        let activeQuery = supabase
            .from('wms_jobs')
            .select('*')
            .not('status', 'in', '("Completed","Cancelled")')
            .order('created_at', { ascending: true }); // Oldest first for FIFO

        if (siteId) {
            activeQuery = activeQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        // 2. Fetch Recent Historical Jobs (Completed/Cancelled)
        // We limit these to prevent bloating the client state.
        // ALWAYS sort by updated_at DESC so recently completed jobs stay at the top!
        let historyQuery = supabase
            .from('wms_jobs')
            .select('*')
            .in('status', ['Completed', 'Cancelled'])
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (siteId) {
            historyQuery = historyQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        // Execute parallel queries
        const [activeRes, historyRes] = await Promise.all([activeQuery, historyQuery]);

        if (activeRes.error) throw activeRes.error;
        if (historyRes.error) throw historyRes.error;

        // DEBUG: Log first few completed jobs to verify completed_by is in DB
        const completedJobs = historyRes.data?.filter((j: any) => j.status === 'Completed').slice(0, 3);
        if (completedJobs?.length) {
            console.log('🔍 [wmsJobsService] Sample completed jobs from DB:', completedJobs.map((j: any) => ({
                id: j.id,
                status: j.status,
                completed_by: j.completed_by,
                completed_at: j.completed_at
            })));
        }

        // Combine datasets
        const combinedData = [...(activeRes.data || []), ...(historyRes.data || [])];

        // Map to domain model
        return combinedData.map((j: any) => ({
            ...j,
            siteId: j.site_id,
            items: j.items_count,
            assignedTo: j.assigned_to,
            orderRef: j.order_ref,
            lineItems: j.line_items || [],
            jobNumber: j.job_number,
            sourceSiteId: j.source_site_id,
            destSiteId: j.dest_site_id,
            transferStatus: j.transfer_status,
            requestedBy: j.requested_by,
            approvedBy: j.approved_by,
            shippedAt: j.shipped_at,
            deliveredAt: j.delivered_at,
            receivedAt: j.received_at,
            receivedBy: j.received_by,
            trackingNumber: j.tracking_number,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
            deliveryMethod: j.delivery_method,
            hasDiscrepancy: j.has_discrepancy,
            discrepancyDetails: j.discrepancy_details,
            completedBy: j.completed_by,
            completedAt: j.completed_at,
            externalCarrierName: j.external_carrier_name, // [NEW] Map external_carrier_name
            assignedBy: j.assigned_by, // [NEW] Map assigned_by
            notes: j.notes
        }));
    },
    async getDiscrepancies(siteId: string): Promise<WMSJob[]> {
        let query = supabase
            .from('wms_jobs')
            .select('*')
            .contains('line_items', JSON.stringify([{ status: 'Discrepancy' }]));

        if (siteId) {
            query = query.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((j: any) => ({
            ...j,
            siteId: j.site_id,
            items: j.items_count,
            assignedTo: j.assigned_to,
            orderRef: j.order_ref,
            lineItems: j.line_items || [],
            jobNumber: j.job_number,
            sourceSiteId: j.source_site_id,
            destSiteId: j.dest_site_id,
            transferStatus: j.transfer_status,
            requestedBy: j.requested_by,
            approvedBy: j.approved_by,
            shippedAt: j.shipped_at,
            deliveredAt: j.delivered_at,
            receivedAt: j.received_at,
            receivedBy: j.received_by,
            trackingNumber: j.tracking_number,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
            deliveryMethod: j.delivery_method,
            hasDiscrepancy: j.has_discrepancy,
            discrepancyDetails: j.discrepancy_details,
            externalCarrierName: j.external_carrier_name,
            assignedBy: j.assigned_by,
            notes: j.notes
        }));
    },

    async create(job: Omit<WMSJob, 'id' | 'created_at' | 'updated_at'>) {
        const dbJob = {
            site_id: job.siteId,
            type: job.type,
            priority: job.priority,
            status: job.status,
            items_count: job.items,
            assigned_to: job.assignedTo,
            location: job.location,
            order_ref: job.orderRef,
            // [FIX] Map completed_at to completedAt
            completed_at: job.completedAt,
            completed_by: job.completedBy,
            started_at: job.startedAt,
            created_at: job.createdAt,
            // DATA OPTIMIZATION: Sanitize line items (strip images)
            line_items: job.lineItems.map((item: any) => ({
                ...item,
                image: '' // Strip image to save storage
            })),
            source_site_id: job.sourceSiteId,
            dest_site_id: job.destSiteId,
            transfer_status: job.transferStatus,
            requested_by: job.requestedBy,
            approved_by: job.approvedBy,
            job_number: (job as any).jobNumber, // Will be populated below if not present
            delivery_method: job.deliveryMethod,
            tracking_number: job.trackingNumber,
            external_carrier_name: job.externalCarrierName, // [NEW] Persist external_carrier_name
            assigned_by: job.assignedBy // [NEW] Persist assignedBy
        };

        // Job types that own their own number (top-level jobs)
        // Child outbound types (PICK, PACK, DISPATCH, DRIVER) derive display from orderRef via formatJobId
        const SELF_NUMBERED_TYPES = ['TRANSFER', 'RECEIVE', 'PUTAWAY', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'ASSIGN'];
        const needsOwnNumber = SELF_NUMBERED_TYPES.includes((dbJob.type || '').toUpperCase());

        // RETRY LOGIC for Job Number Uniqueness
        // Starts with 6-char codes; after MAX_RETRIES_PER_LENGTH collisions, expands to 7, 8... chars
        const MAX_RETRIES_PER_LENGTH = 10;
        let currentLength = 6;
        let retriesAtCurrentLength = 0;

        while (true) {
            const isRetry = retriesAtCurrentLength > 0 || currentLength > 6;

            // Only generate a job_number for top-level job types
            if (needsOwnNumber && (!dbJob.job_number || isRetry)) {
                dbJob.job_number = generateReadableJobNumber(currentLength);

                // Also regen tracking number on retry if it's an auto-generated SF number
                if (isRetry && dbJob.tracking_number && dbJob.tracking_number.startsWith('SF')) {
                    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    const base = dbJob.tracking_number.slice(0, 14);
                    dbJob.tracking_number = `${base}${random}`;
                }
            }


            const { data, error } = await supabase
                .from('wms_jobs')
                .insert(dbJob)
                .select()
                .single();

            if (!error) {
                return {
                    ...data,
                    siteId: data.site_id,
                    items: data.items_count,
                    assignedTo: data.assigned_to,
                    orderRef: data.order_ref,
                    lineItems: data.line_items || [],
                    jobNumber: data.job_number,
                    sourceSiteId: data.source_site_id,
                    destSiteId: data.dest_site_id,
                    transferStatus: data.transfer_status,
                    requestedBy: data.requested_by,
                    approvedBy: data.approved_by,
                    shippedAt: data.shipped_at,
                    deliveredAt: data.delivered_at,
                    receivedAt: data.received_at,
                    receivedBy: data.received_by,
                    trackingNumber: data.tracking_number,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                    deliveryMethod: data.delivery_method,
                    externalCarrierName: data.external_carrier_name, // [NEW] Map external_carrier_name
                    assignedBy: data.assigned_by
                };
            }

            // Collision Handling
            if (
                error.code === '23505' ||
                error.code === '409' ||
                (error as any).status === 409 ||
                error.message?.includes('duplicate key') ||
                error.message?.includes('unique constraint') ||
                JSON.stringify(error).toLowerCase().includes('duplicate')
            ) {
                // IMPORTANT FIX: Only retry if we are actually generating our own numbers randomly.
                // If needsOwnNumber is false (e.g. PICK job inheriting a number), retrying with the same data will just loop infinitely.
                if (needsOwnNumber) {
                    retriesAtCurrentLength++;
                    if (retriesAtCurrentLength >= MAX_RETRIES_PER_LENGTH) {
                        // Exhausted retries at this length — expand by one character
                        currentLength++;
                        retriesAtCurrentLength = 0;
                        console.warn(`⚠️ Job number length expanded to ${currentLength} chars due to collision exhaustion.`);
                    }
                    continue;
                } else {
                    console.error('❌ WMS Job Insert Error: Job number conflict for inherited number. Ensure DB unique constraint is removed.', error);
                    throw new Error('Database rejected inherited job number due to remaining unique constraint. Please run the SQL script to drop the unique constraint.');
                }
            }

            // If other error, throw immediately
            console.error('❌ WMS Job Insert Error:', error);
            console.error('❌ Error Details:', JSON.stringify(error, null, 2));
            throw error;
        }

        throw new Error('Failed to generate unique Job Number after multiple attempts.');
    },

    async update(id: string, updates: Partial<WMSJob>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.items !== undefined) { dbUpdates.items_count = updates.items; delete dbUpdates.items; }
        if (updates.assignedTo !== undefined) { dbUpdates.assigned_to = updates.assignedTo; delete dbUpdates.assignedTo; }
        if (updates.orderRef !== undefined) { dbUpdates.order_ref = updates.orderRef; delete dbUpdates.orderRef; }
        if (updates.lineItems !== undefined) { dbUpdates.line_items = updates.lineItems; delete dbUpdates.lineItems; }
        if (updates.transferStatus !== undefined) { dbUpdates.transfer_status = updates.transferStatus; delete dbUpdates.transferStatus; }
        if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }
        if (updates.shippedAt !== undefined) { dbUpdates.shipped_at = updates.shippedAt; delete dbUpdates.shippedAt; }
        if (updates.deliveredAt !== undefined) { dbUpdates.delivered_at = updates.deliveredAt; delete dbUpdates.deliveredAt; }
        if (updates.receivedAt !== undefined) { dbUpdates.received_at = updates.receivedAt; delete dbUpdates.receivedAt; }
        if (updates.receivedBy !== undefined) { dbUpdates.received_by = updates.receivedBy; delete dbUpdates.receivedBy; }
        if (updates.deliveryMethod !== undefined) { dbUpdates.delivery_method = updates.deliveryMethod; delete dbUpdates.deliveryMethod; }
        if (updates.hasDiscrepancy !== undefined) { dbUpdates.has_discrepancy = updates.hasDiscrepancy; delete dbUpdates.hasDiscrepancy; }
        if (updates.discrepancyDetails !== undefined) { dbUpdates.discrepancy_details = updates.discrepancyDetails; delete dbUpdates.discrepancyDetails; }
        if (updates.trackingNumber !== undefined) { dbUpdates.tracking_number = updates.trackingNumber; delete dbUpdates.trackingNumber; }
        if (updates.completedBy !== undefined) { dbUpdates.completed_by = updates.completedBy; delete dbUpdates.completedBy; }
        if (updates.completedAt !== undefined) { dbUpdates.completed_at = updates.completedAt; delete dbUpdates.completedAt; }
        if (updates.externalCarrierName !== undefined) { dbUpdates.external_carrier_name = updates.externalCarrierName; delete dbUpdates.externalCarrierName; }
        if (updates.assignedBy !== undefined) { dbUpdates.assigned_by = updates.assignedBy; delete dbUpdates.assignedBy; }

        const { data, error } = await supabase
            .from('wms_jobs')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            items: data.items_count,
            assignedTo: data.assigned_to,
            orderRef: data.order_ref,
            lineItems: data.line_items || [],
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            transferStatus: data.transfer_status,
            requestedBy: data.requested_by,
            approvedBy: data.approved_by,
            shippedAt: data.shipped_at,
            deliveredAt: data.delivered_at,
            receivedAt: data.received_at,
            receivedBy: data.received_by,
            trackingNumber: data.tracking_number,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            hasDiscrepancy: data.has_discrepancy,
            discrepancyDetails: data.discrepancy_details,
            completedBy: data.completed_by,
            completedAt: data.completed_at,
            externalCarrierName: data.external_carrier_name,
            assignedBy: data.assigned_by,
            notes: data.notes
        };
    },

    async complete(id: string) {
        return await this.update(id, { status: 'Completed' });
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('wms_jobs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async removeItem(jobId: string, itemIndex: number) {
        // 1. Fetch current job
        const job = await this.getById(jobId);
        if (!job) throw new Error('Job not found');

        // 2. Filter out the item
        const updatedLineItems = job.lineItems.filter((_: any, idx: number) => idx !== itemIndex);

        // 3. Update the job
        return await this.update(jobId, {
            lineItems: updatedLineItems,
            items: updatedLineItems.length
        });
    }
};
