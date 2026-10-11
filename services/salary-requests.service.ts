import { supabase } from '../lib/supabase';
import type { SalaryChangeRequest } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_salary_requests_backup';

let inMemoryBackup: SalaryChangeRequest[] = [];

const getLocalBackup = (): SalaryChangeRequest[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback to inMemoryBackup
    }
    return inMemoryBackup;
};

const saveLocalBackup = (requests: SalaryChangeRequest[]): void => {
    const map = new Map<string, SalaryChangeRequest>();
    for (const r of inMemoryBackup) {
        map.set(r.id, r);
    }
    for (const r of requests) {
        map.set(r.id, r);
    }
    inMemoryBackup = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryBackup));
        }
    } catch {
        // Ignore local storage quota errors
    }
};

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
            // RULE 10: 25-record shelf limit
            let query = supabase.from('salary_requests').select('*').limit(limit);
            if (siteId) query = query.eq('site_id', siteId);
            if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());

            const { data, error } = await query.order('requested_at', { ascending: false });
            if (error) throw error;

            const mapped = (data || []).map(mapDBToSalaryRequest);
            saveLocalBackup(mapped);
        } catch (error) {
            logger.warn('salaryRequestsService', 'Remote fetch failed, falling back to local store:', { error: String(error) });
        }

        let results = getLocalBackup();
        if (siteId) results = results.filter(r => r.siteId === siteId);
        if (countryCode) results = results.filter(r => r.countryCode.toUpperCase() === countryCode.toUpperCase());
        return results.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
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

        let result: SalaryChangeRequest = mapDBToSalaryRequest(dbRecord);

        try {
            const { data, error } = await supabase
                .from('salary_requests')
                .insert(dbRecord)
                .select()
                .single();

            if (error) throw error;
            result = mapDBToSalaryRequest(data);
        } catch (error) {
            logger.warn('salaryRequestsService', 'Remote insert failed, saved to local cache:', { error: String(error) });
        }

        // Cache locally
        const backup = getLocalBackup();
        saveLocalBackup([result, ...backup.filter(r => r.id !== result.id)]);

        // Log audit event
        await systemLogsService.create({
            user_name: request.requestedBy,
            action: 'SALARY_CHANGE_REQUESTED',
            details: `HR (${request.requestedBy}) requested salary adjustment for ${request.employeeName}: ${request.currentSalary} -> ${request.proposedSalary} ${request.currency}. Reason: ${request.reason}`,
            module: 'HR'
        });

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
        let targetRequest: SalaryChangeRequest | null = null;

        // Fetch current record
        try {
            const { data, error } = await supabase
                .from('salary_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (!error && data) targetRequest = mapDBToSalaryRequest(data);
        } catch {
            // fallback
        }

        if (!targetRequest) {
            const backup = getLocalBackup();
            targetRequest = backup.find(r => r.id === requestId) || null;
        }

        if (!targetRequest) {
            throw new Error(`Salary request ${requestId} not found.`);
        }

        // Apply approval updates
        const updatedRequest: SalaryChangeRequest = {
            ...targetRequest,
            status: 'approved',
            approvedBy: approver.name,
            approvedByRole: approver.role,
            approvedAt: now
        };

        try {
            await supabase
                .from('salary_requests')
                .update({
                    status: 'approved',
                    approved_by: approver.name,
                    approved_by_role: approver.role,
                    approved_at: now
                })
                .eq('id', requestId);

            // Update employee master record in Supabase
            await supabase
                .from('employees')
                .update({ salary: targetRequest.proposedSalary })
                .eq('id', targetRequest.employeeId);
        } catch (error) {
            logger.warn('salaryRequestsService', 'Remote approval update failed, continuing with local updates:', { error: String(error) });
        }

        // Update local backup
        const backup = getLocalBackup();
        saveLocalBackup(backup.map(r => r.id === requestId ? updatedRequest : r));

        // Audit Trail
        await systemLogsService.create({
            user_name: approver.name,
            action: 'SALARY_CHANGE_APPROVED',
            details: `Approved salary adjustment for ${targetRequest.employeeName}: ${targetRequest.currentSalary} -> ${targetRequest.proposedSalary} ${targetRequest.currency}. Approver: ${approver.name} (${approver.role})`,
            module: 'Finance'
        });

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
        let targetRequest: SalaryChangeRequest | null = null;

        try {
            const { data, error } = await supabase
                .from('salary_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (!error && data) targetRequest = mapDBToSalaryRequest(data);
        } catch {
            // fallback
        }

        if (!targetRequest) {
            const backup = getLocalBackup();
            targetRequest = backup.find(r => r.id === requestId) || null;
        }

        if (!targetRequest) {
            throw new Error(`Salary request ${requestId} not found.`);
        }

        const updatedRequest: SalaryChangeRequest = {
            ...targetRequest,
            status: 'rejected',
            rejectedBy: rejector.name,
            rejectionReason,
            rejectedAt: now
        };

        try {
            await supabase
                .from('salary_requests')
                .update({
                    status: 'rejected',
                    rejected_by: rejector.name,
                    rejection_reason: rejectionReason,
                    rejected_at: now
                })
                .eq('id', requestId);
        } catch (error) {
            logger.warn('salaryRequestsService', 'Remote reject update failed:', { error: String(error) });
        }

        const backup = getLocalBackup();
        saveLocalBackup(backup.map(r => r.id === requestId ? updatedRequest : r));

        await systemLogsService.create({
            user_name: rejector.name,
            action: 'SALARY_CHANGE_REJECTED',
            details: `Rejected salary adjustment for ${targetRequest.employeeName} (${targetRequest.currentSalary} -> ${targetRequest.proposedSalary}). Reason: ${rejectionReason}`,
            module: 'Finance'
        });

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('salary:request-rejected', {
                detail: { request: updatedRequest, reason: rejectionReason }
            }));
        }

        return updatedRequest;
    },

    _clearCache(): void {
        inMemoryBackup = [];
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        } catch {
            // Ignore
        }
    }
};
