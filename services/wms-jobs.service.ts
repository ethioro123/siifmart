import { supabase } from '../lib/supabase';
import type { WMSJob } from '../types';
import { mapWmsJobRow } from './wms-jobs.mapper';
import { logger } from '../utils/logger';

export { mapWmsJobRow };

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

const WMS_JOB_COLUMNS = 'id, country_code, site_id, type, priority, status, items_count, assigned_to, location, order_ref, completed_at, completed_by, created_at, updated_at, line_items, source_site_id, dest_site_id, transfer_status, requested_by, approved_by, job_number, delivery_method, tracking_number, external_carrier_name, assigned_by, notes, has_discrepancy, discrepancy_details, shipped_at, delivered_at, received_at, received_by';

export const wmsJobsService = {
    async getById(id: string) {
        // Fetch job using JSONB line_items (Standardized Architecture)
        const { data, error } = await supabase
            .from('wms_jobs')
            .select(WMS_JOB_COLUMNS)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return mapWmsJobRow(data);
    },

    async getAll(siteId?: string, limit: number = 0, employeeId?: string, countryCode?: string) {
        // 1. Fetch ALL Active Jobs (Pending/In-Progress) for the site (operational backlog)
        let activeQuery = supabase
            .from('wms_jobs')
            .select(WMS_JOB_COLUMNS)
            .not('status', 'in', '("Completed","Cancelled")')
            .order('created_at', { ascending: true }); // Oldest first for FIFO

        if (countryCode) {
            activeQuery = activeQuery.eq('country_code', countryCode);
        }

        if (siteId && employeeId) {
            activeQuery = activeQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId},assigned_to.eq.${employeeId}`);
        } else if (siteId) {
            activeQuery = activeQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        } else if (employeeId) {
            activeQuery = activeQuery.eq('assigned_to', employeeId);
        }

        // 2. RULE 10 — Zero Eager History: only fetch history when caller explicitly requests it
        //    limit <= 0 means "active jobs only" — zero historical data downloaded on mount.
        const historyPromise = limit > 0
            ? (() => {
                let historyQuery = supabase
                    .from('wms_jobs')
                    .select(WMS_JOB_COLUMNS)
                    .in('status', ['Completed', 'Cancelled'])
                    .order('updated_at', { ascending: false })
                    .limit(limit);

                if (countryCode) historyQuery = historyQuery.eq('country_code', countryCode);

                if (siteId && employeeId) {
                    historyQuery = historyQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId},assigned_to.eq.${employeeId}`);
                } else if (siteId) {
                    historyQuery = historyQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
                } else if (employeeId) {
                    historyQuery = historyQuery.eq('assigned_to', employeeId);
                }
                return historyQuery;
            })()
            : Promise.resolve({ data: [] as any[], error: null });

        // Execute queries
        const [activeRes, historyRes] = await Promise.all([activeQuery, historyPromise]);

        if (activeRes.error) throw activeRes.error;
        if (historyRes.error) throw historyRes.error;

        // Combine datasets
        const combinedData = [...(activeRes.data || []), ...(historyRes.data || [])];

        return combinedData.map(mapWmsJobRow);
    },

    /**
     * RULE 10 — On-demand history fetch. Call ONLY when user explicitly clicks the History tab.
     * Never call on module mount/login. Returns latest 25 completed/cancelled jobs by default.
     */
    async getHistory(siteId?: string, limit: number = 200, employeeId?: string, countryCode?: string, type?: WMSJob['type']) {
        let q = supabase
            .from('wms_jobs')
            .select(WMS_JOB_COLUMNS)
            .in('status', ['Completed', 'Cancelled'])
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (type) q = q.eq('type', type);
        if (countryCode) q = q.eq('country_code', countryCode);

        if (siteId && employeeId) {
            q = q.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId},assigned_to.eq.${employeeId}`);
        } else if (siteId) {
            q = q.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        } else if (employeeId) {
            q = q.eq('assigned_to', employeeId);
        }

        const { data, error } = await q;
        if (error) throw error;

        return (data || []).map(mapWmsJobRow);
    },

    async getDiscrepancies(siteId: string, countryCode?: string): Promise<WMSJob[]> {
        let query = supabase
            .from('wms_jobs')
            .select(WMS_JOB_COLUMNS)
            .contains('line_items', JSON.stringify([{ status: 'Discrepancy' }]));

        if (countryCode) {
            query = query.eq('country_code', countryCode);
        }

        if (siteId) {
            query = query.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(mapWmsJobRow);
    },

    async create(job: Omit<WMSJob, 'id' | 'created_at' | 'updated_at'>) {
        let countryCode = job.countryCode || job.country_code || (job as any).country;

        // Auto-resolve country from site if not explicitly supplied
        if (!countryCode) {
            const targetSiteId = job.siteId || (job as any).site_id || job.sourceSiteId || job.destSiteId;
            if (targetSiteId) {
                try {
                    const { data: siteRow } = await supabase
                        .from('sites')
                        .select('country')
                        .or(`id.eq.${targetSiteId},code.eq.${targetSiteId}`)
                        .maybeSingle();
                    if (siteRow?.country) {
                        countryCode = siteRow.country;
                    }
                } catch { }
            }
        }

        if (!countryCode) {
            const siteStr = String(job.siteId || (job as any).site_id || '');
            if (siteStr.toUpperCase().includes('KE') || siteStr.toLowerCase().includes('-ke')) {
                countryCode = 'KE';
            } else {
                countryCode = 'ET';
            }
        }

        const dbJob = {
            country_code: countryCode,
            site_id: job.siteId,
            type: job.type,
            priority: job.priority,
            status: job.status,
            items_count: Math.round(job.items || 0),
            assigned_to: job.assignedTo,
            location: job.location,
            order_ref: job.orderRef,
            completed_at: job.completedAt,
            completed_by: job.completedBy,
            created_at: job.createdAt,
            // DATA OPTIMIZATION: Sanitize line items (strip images)
            line_items: (job.lineItems || []).map((item: any) => ({
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
            external_carrier_name: job.externalCarrierName,
            assigned_by: job.assignedBy
        };

        // Job types that own their own number (top-level jobs)
        const SELF_NUMBERED_TYPES = ['TRANSFER', 'RECEIVE', 'PUTAWAY', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'ASSIGN'];
        const needsOwnNumber = SELF_NUMBERED_TYPES.includes((dbJob.type || '').toUpperCase());

        // RETRY LOGIC for Job Number Uniqueness
        const MAX_RETRIES_PER_LENGTH = 10;
        let currentLength = 6;
        let retriesAtCurrentLength = 0;

        while (true) {
            const isRetry = retriesAtCurrentLength > 0 || currentLength > 6;

            if (needsOwnNumber && (!dbJob.job_number || isRetry)) {
                dbJob.job_number = generateReadableJobNumber(currentLength);

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
                return mapWmsJobRow(data);
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
                if (needsOwnNumber) {
                    retriesAtCurrentLength++;
                    if (retriesAtCurrentLength >= MAX_RETRIES_PER_LENGTH) {
                        currentLength++;
                        retriesAtCurrentLength = 0;
                        logger.warn('wmsJobsService', `Job number length expanded to ${currentLength} chars due to collision exhaustion.`);
                    }
                    continue;
                } else {
                    logger.error('wmsJobsService', 'WMS Job Insert Error: Job number conflict for inherited number.', error as Error);
                    throw new Error('Database rejected inherited job number due to remaining unique constraint. Please run the SQL script to drop the unique constraint.');
                }
            }

            logger.error('wmsJobsService', 'WMS Job Insert Error', error as Error);
            throw error;
        }
    },

    async update(id: string, updates: Partial<WMSJob>) {
        const dbUpdates: any = { ...updates };
        if (updates.countryCode !== undefined) { dbUpdates.country_code = updates.countryCode; delete dbUpdates.countryCode; }
        if (updates.country_code !== undefined) { dbUpdates.country_code = updates.country_code; }
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.items !== undefined) { dbUpdates.items_count = Math.round(updates.items || 0); delete dbUpdates.items; }
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

        // Synchronize linked transfers record when lifecycle status changes on a TRANSFER job
        if ((updates.status || updates.transferStatus) && (data?.type === 'TRANSFER' || data?.order_ref)) {
            try {
                const transferUpdates: Record<string, any> = {
                    updated_at: new Date().toISOString()
                };
                if (updates.transferStatus) transferUpdates.transfer_status = updates.transferStatus;
                if (updates.status === 'Completed' || updates.transferStatus === 'Received') {
                    transferUpdates.status = 'Completed';
                    transferUpdates.transfer_status = 'Received';
                    if (updates.receivedAt) transferUpdates.received_at = updates.receivedAt;
                    if (updates.receivedBy) transferUpdates.received_by = updates.receivedBy;
                } else if (updates.status === 'Cancelled') {
                    transferUpdates.status = 'Cancelled';
                }

                const targetRef = data?.order_ref || id;
                await supabase
                    .from('transfers')
                    .update(transferUpdates)
                    .or(`id.eq.${targetRef},order_ref.eq.${targetRef}`);
            } catch (syncErr) {
                logger.warn('wmsJobsService', 'Linked transfer dual-record synchronization notice:', { error: String(syncErr) });
            }
        }

        return mapWmsJobRow(data);
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
        const job = await this.getById(jobId);
        if (!job) throw new Error('Job not found');

        const updatedLineItems = job.lineItems.filter((_: any, idx: number) => idx !== itemIndex);

        return await this.update(jobId, {
            lineItems: updatedLineItems,
            items: updatedLineItems.length
        });
    }
};
