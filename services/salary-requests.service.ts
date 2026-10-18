import { supabase } from '../lib/supabase';
import type { SalaryChangeRequest } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_salary_requests_backup';

// Security Cleanup: Purge any legacy unencrypted sensitive compensation records from browser storage
if (typeof localStorage !== 'undefined') {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
        // Safe ignore
    }
}

// In-memory session cache only (transient read cache, never written to disk)
let inMemoryBackup: SalaryChangeRequest[] = [];

const mapDBToSalaryRequest = (row: any): SalaryChangeRequest => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    currentSalary: Number(row.current_salary) || 0,
    proposedSalary: Number(row.proposed_salary) || 0,
    currency: row.currency || 'ETB',
    siteId: row.site_id || undefined,
    countryCode: (row.country_code || 'ET').toUpperCase(),
    reason: row.reason || '',
    status: row.status || 'pending',
    requestedBy: row.requested_by,
    requestedByRole: row.requested_by_role || 'hr',
    requestedAt: row.requested_at,
    approvedBy: row.approved_by || undefined,
    approvedByRole: row.approved_by_role || undefined,
    approvedAt: row.approved_at || undefined,
    rejectionReason: row.rejection_reason || undefined,
    rejectedBy: row.rejected_by || undefined,
    rejectedAt: row.rejected_at || undefined
});

export const salaryRequestsService = {
    async getAll(siteId?: string, countryCode?: string, limit: number = 25): Promise<SalaryChangeRequest[]> {
        try {
            let shouldFilterSite = Boolean(siteId && siteId !== 'All' && siteId !== 'all');
            if (shouldFilterSite && siteId) {
                try {
                    const { data: siteRecord } = await supabase
                        .from('sites')
                        .select('type, code')
                        .eq('id', siteId)
                        .maybeSingle();

                    if (siteRecord) {
                        const isHq = ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations'].includes(siteRecord.type || '') ||
                            siteRecord.code?.endsWith('-HQ') || siteRecord.code === 'HQ' || siteRecord.code === 'HQ-GLOBAL';
                        if (isHq) {
                            shouldFilterSite = false;
                        }
                    }
                } catch {
                    // Safe fallback
                }
            }

            // RULE 10: 25-record shelf limit
            let query = supabase.from('salary_requests').select('*').limit(limit);
            if (shouldFilterSite && siteId) query = query.eq('site_id', siteId);
            if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());

            const { data, error } = await query.order('requested_at', { ascending: false });
            if (error) throw error;

            const mapped = (data || []).map(mapDBToSalaryRequest);
            inMemoryBackup = mapped;
            return mapped;
        } catch (error) {
            logger.error('salaryRequestsService', 'Remote fetch failed for salary requests:', error as Error);
            // Return in-memory session cache if available, otherwise empty
            let results = inMemoryBackup;
            if (siteId && siteId !== 'All' && siteId !== 'all') {
                const isHqId = siteId.toLowerCase().includes('hq') || siteId.toLowerCase().includes('admin');
                if (!isHqId) {
                    results = results.filter(r => r.siteId === siteId);
                }
            }
            if (countryCode) results = results.filter(r => r.countryCode.toUpperCase() === countryCode.toUpperCase());
            return results.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        }
    },

    async getPending(siteId?: string, countryCode?: string): Promise<SalaryChangeRequest[]> {
        const all = await this.getAll(siteId, countryCode);
        return all.filter(r => r.status === 'pending');
    },

    async create(request: Omit<SalaryChangeRequest, 'id'>): Promise<SalaryChangeRequest> {
        const country = (request.countryCode || 'ET').toUpperCase();
        const newId = crypto.randomUUID();

        const dbRecord = {
            id: newId,
            employee_id: request.employeeId,
            employee_name: request.employeeName,
            current_salary: request.currentSalary,
            proposed_salary: request.proposedSalary,
            currency: request.currency || 'ETB',
            site_id: request.siteId || null,
            country_code: country,
            reason: request.reason,
            status: 'pending',
            requested_by: request.requestedBy,
            requested_by_role: request.requestedByRole || 'hr',
            requested_at: request.requestedAt || new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('salary_requests')
            .insert(dbRecord)
            .select()
            .single();

        if (error) {
            logger.error('salaryRequestsService', 'Remote salary request insert failed:', error as Error);
            throw new Error(`Failed to submit salary adjustment to server: ${error.message || 'Database error'}`);
        }

        const result: SalaryChangeRequest = mapDBToSalaryRequest(data);
        inMemoryBackup = [result, ...inMemoryBackup.filter(r => r.id !== result.id)];

        // Log audit event
        try {
            await systemLogsService.create({
                user_name: request.requestedBy,
                action: 'SALARY_CHANGE_REQUESTED',
                details: `HR (${request.requestedBy}) requested salary adjustment for ${request.employeeName}: ${request.currentSalary} -> ${request.proposedSalary} ${request.currency}. Reason: ${request.reason}`,
                module: 'HR'
            });
        } catch {
            // Non-blocking log
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('salary:request-created', { detail: result }));
        }

        return result;
    },

    async approve(
        requestId: string,
        approver: { id?: string; name: string; role: string }
    ): Promise<SalaryChangeRequest> {
        const now = new Date().toISOString();

        // 1. Fetch current record from server
        const { data: currentData, error: fetchErr } = await supabase
            .from('salary_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchErr || !currentData) {
            logger.error('salaryRequestsService', 'Salary request not found on server:', fetchErr as Error);
            throw new Error(`Salary request ${requestId} not found on server.`);
        }

        const targetRequest = mapDBToSalaryRequest(currentData);

        // 2. Persist approval status on server
        const { error: updateErr } = await supabase
            .from('salary_requests')
            .update({
                status: 'approved',
                approved_by: approver.name,
                approved_by_role: approver.role,
                approved_at: now
            })
            .eq('id', requestId);

        if (updateErr) {
            logger.error('salaryRequestsService', 'Remote approval status update failed:', updateErr as Error);
            throw new Error(`Failed to record salary approval on server: ${updateErr.message}`);
        }

        // 3. Update employee master compensation in database
        const { error: empErr } = await supabase
            .from('employees')
            .update({ salary: targetRequest.proposedSalary })
            .eq('id', targetRequest.employeeId);

        if (empErr) {
            logger.error('salaryRequestsService', 'Failed to update employee salary in database:', empErr as Error);
            throw new Error(`Failed to update employee salary in database: ${empErr.message}`);
        }

        const updatedRequest: SalaryChangeRequest = {
            ...targetRequest,
            status: 'approved',
            approvedBy: approver.name,
            approvedByRole: approver.role,
            approvedAt: now
        };

        inMemoryBackup = inMemoryBackup.map(r => r.id === requestId ? updatedRequest : r);

        // Audit Trail
        try {
            await systemLogsService.create({
                user_name: approver.name,
                action: 'SALARY_CHANGE_APPROVED',
                details: `Approved salary adjustment for ${targetRequest.employeeName}: ${targetRequest.currentSalary} -> ${targetRequest.proposedSalary} ${targetRequest.currency}. Approver: ${approver.name} (${approver.role})`,
                module: 'Finance'
            });
        } catch {
            // Non-blocking
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('salary:request-approved', {
                detail: {
                    request: updatedRequest,
                    employeeId: targetRequest.employeeId,
                    newSalary: targetRequest.proposedSalary
                }
            }));
        }

        return updatedRequest;
    },

    async reject(
        requestId: string,
        rejector: { id?: string; name: string; role: string },
        rejectionReason: string
    ): Promise<SalaryChangeRequest> {
        const now = new Date().toISOString();

        // 1. Fetch current record from server
        const { data: currentData, error: fetchErr } = await supabase
            .from('salary_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchErr || !currentData) {
            logger.error('salaryRequestsService', 'Salary request not found on server:', fetchErr as Error);
            throw new Error(`Salary request ${requestId} not found on server.`);
        }

        const targetRequest = mapDBToSalaryRequest(currentData);

        // 2. Persist rejection on server
        const { error: rejErr } = await supabase
            .from('salary_requests')
            .update({
                status: 'rejected',
                rejected_by: rejector.name,
                rejection_reason: rejectionReason,
                rejected_at: now
            })
            .eq('id', requestId);

        if (rejErr) {
            logger.error('salaryRequestsService', 'Remote reject update failed:', rejErr as Error);
            throw new Error(`Failed to record salary rejection on server: ${rejErr.message}`);
        }

        const updatedRequest: SalaryChangeRequest = {
            ...targetRequest,
            status: 'rejected',
            rejectedBy: rejector.name,
            rejectionReason,
            rejectedAt: now
        };

        inMemoryBackup = inMemoryBackup.map(r => r.id === requestId ? updatedRequest : r);

        try {
            await systemLogsService.create({
                user_name: rejector.name,
                action: 'SALARY_CHANGE_REJECTED',
                details: `Rejected salary adjustment for ${targetRequest.employeeName} (${targetRequest.currentSalary} -> ${targetRequest.proposedSalary}). Reason: ${rejectionReason}`,
                module: 'Finance'
            });
        } catch {
            // Non-blocking
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('salary:request-rejected', {
                detail: { request: updatedRequest, reason: rejectionReason }
            }));
        }

        return updatedRequest;
    },

    _clearCache(): void {
        inMemoryBackup = [];
    }
};
