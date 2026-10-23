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

const WMS_JOB_COLUMNS = 'id, country_code, site_id, type, priority, status, items_count, assigned_to, location, order_ref, completed_at, completed_by, created_at, updated_at, line_items, source_site_id, dest_site_id, transfer_status, requested_by, approved_by, job_number, delivery_method, tracking_number, external_carrier_name, assigned_by, notes, has_discrepancy, discrepancy_details, shipped_at, delivered_at, received_at, received_by, pack_security_seal_serial';

export const wmsJobsService = {
    async approveTransferForPicking(transferId: string): Promise<WMSJob> {
        if (!transferId) throw new Error('A transfer is required for picking approval.');
        const { data, error } = await supabase.rpc('approve_transfer_for_picking', { p_transfer_id: transferId });
        if (error) throw error;
        if (!data?.id || data.type !== 'PICK') throw new Error('Server did not confirm a PICK job.');
        return mapWmsJobRow(data);
    },
    async createPackAfterCompletedPick(pickJobId: string): Promise<WMSJob> {
        const { data, error } = await supabase
            .rpc('create_pack_job_after_completed_pick', { p_pick_job_id: pickJobId })
            .single();

        if (error) throw error;
        if (!data) throw new Error('PACK job creation returned no job');
        return mapWmsJobRow(data);
    },

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
        const fields: Partial<Record<keyof WMSJob, string>> = {
            status: 'status', priority: 'priority', type: 'type', location: 'location', notes: 'notes',
            countryCode: 'country_code', country_code: 'country_code', siteId: 'site_id', site_id: 'site_id',
            items: 'items_count', items_count: 'items_count', assignedTo: 'assigned_to', orderRef: 'order_ref',
            lineItems: 'line_items', line_items: 'line_items', transferStatus: 'transfer_status',
            approvedBy: 'approved_by', requestedBy: 'requested_by', sourceSiteId: 'source_site_id',
            source_site_id: 'source_site_id', destSiteId: 'dest_site_id', dest_site_id: 'dest_site_id',
            shippedAt: 'shipped_at', shipped_at: 'shipped_at', deliveredAt: 'delivered_at', delivered_at: 'delivered_at',
            receivedAt: 'received_at', receivedBy: 'received_by', received_by: 'received_by',
            deliveryMethod: 'delivery_method', hasDiscrepancy: 'has_discrepancy', discrepancyDetails: 'discrepancy_details',
            trackingNumber: 'tracking_number', tracking_number: 'tracking_number', completedBy: 'completed_by',
            completed_by: 'completed_by', completedAt: 'completed_at', completed_at: 'completed_at',
            externalCarrierName: 'external_carrier_name', external_carrier_name: 'external_carrier_name',
            assignedBy: 'assigned_by', assigned_by: 'assigned_by', jobNumber: 'job_number',
            packSecuritySealSerial: 'pack_security_seal_serial'
        };
        const dbUpdates: Record<string, unknown> = {};
        for (const key of Object.keys(fields) as (keyof WMSJob)[]) {
            if (updates[key] !== undefined) dbUpdates[fields[key]!] = key === 'items' ? Math.round(updates.items || 0) : updates[key];
        }

        const { data, error } = await supabase
            .from('wms_jobs')
            .update(dbUpdates)
            .eq('id', id)
            .select(WMS_JOB_COLUMNS)
            .single();

        if (error) throw error;

        // Linked shipment/transfer changes are synchronized atomically by the database.

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
