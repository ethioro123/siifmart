import { supabase } from '../lib/supabase';
import type { SalaryChangeRequest } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';
import { isSovereignCEO } from '../utils/employeeGovernance';
import { getRoleHierarchy } from '../utils/roles';

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
    async getAll(
        siteId?: string, 
        countryCode?: string, 
        limit: number = 25,
        offset: number = 0,
        status?: 'pending' | 'approved' | 'rejected'
    ): Promise<SalaryChangeRequest[]> {
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

            // RULE 10: 25-record shelf limit with bounded pagination
            let query = supabase.from('salary_requests').select('*');
            if (shouldFilterSite && siteId) query = query.eq('site_id', siteId);
            if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
            if (status) query = query.eq('status', status);

            query = query.order('requested_at', { ascending: false });
            if (offset > 0) {
                query = query.range(offset, offset + limit - 1);
            } else {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mapped = (data || []).map(mapDBToSalaryRequest);
            if (offset === 0 && !status) {
                inMemoryBackup = mapped;
            }
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
            if (status) results = results.filter(r => r.status === status);
            const sorted = results.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
            return sorted.slice(offset, offset + limit);
        }
    },

    async getPending(siteId?: string, countryCode?: string, limit: number = 25, offset: number = 0): Promise<SalaryChangeRequest[]> {
        return this.getAll(siteId, countryCode, limit, offset, 'pending');
    },

    async getHistory(siteId?: string, countryCode?: string, limit: number = 25, offset: number = 0): Promise<SalaryChangeRequest[]> {
        const all = await this.getAll(siteId, countryCode, limit + offset, 0);
        return all.filter(r => r.status !== 'pending').slice(offset, offset + limit);
    },

    async create(request: Omit<SalaryChangeRequest, 'id'>): Promise<SalaryChangeRequest> {
        const country = (request.countryCode || 'ET').toUpperCase();
        const newId = crypto.randomUUID();

        // Protection against subordinate modifying Global CEO
        if (request.employeeId) {
            try {
                const { data: targetEmp } = await supabase
                    .from('employees')
                    .select('role')
                    .eq('id', request.employeeId)
                    .maybeSingle();

                const isTargetCEO = targetEmp?.role && isSovereignCEO(targetEmp.role);
                const isRequesterCEO = isSovereignCEO(request.requestedByRole);

                if (isTargetCEO && !isRequesterCEO) {
                    throw new Error('Access Denied: Subordinate roles cannot propose salary adjustments for the Global CEO.');
                }
            } catch (err: any) {
                if (err?.message?.includes('Access Denied')) throw err;
                // Non-blocking schema fallback
            }
        }

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
        const { data, error } = await supabase.rpc('review_salary_request', { p_request: requestId, p_approve: true, p_reason: null });
        if (error) throw error;
        if (data?.id !== requestId || data.status !== 'approved') throw new Error('Salary approval was not confirmed');
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('salary:request-approved'));
        return mapDBToSalaryRequest(data);
    },

    async reject(
        requestId: string,
        rejector: { id?: string; name: string; role: string },
        rejectionReason: string
    ): Promise<SalaryChangeRequest> {
        const { data, error } = await supabase.rpc('review_salary_request', { p_request: requestId, p_approve: false, p_reason: rejectionReason });
        if (error) throw error;
        if (data?.id !== requestId || data.status !== 'rejected') throw new Error('Salary rejection was not confirmed');
        return mapDBToSalaryRequest(data);
    },

    _clearCache(): void {
        inMemoryBackup = [];
    }
};
