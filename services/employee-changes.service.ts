import { supabase } from '../lib/supabase';
import { EmployeeProfileChangeRequest } from '../types/employee-change';
import { employeesService } from './employees.service';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_employee_change_requests_backup';

// Security Cleanup: Purge any legacy unencrypted sensitive employee change records from browser storage
if (typeof localStorage !== 'undefined') {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
        // Safe ignore
    }
}

// In-memory session cache only (transient read cache, never written to disk)
let inMemoryBackup: EmployeeProfileChangeRequest[] = [];

const mapDBToChangeRequest = (row: any): EmployeeProfileChangeRequest => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    countryCode: (row.country_code || 'ET').toUpperCase(),
    siteId: row.site_id || undefined,
    requestedBy: row.requested_by,
    requestedByRole: row.requested_by_role || 'hr',
    requestedAt: row.requested_at,
    status: row.status || 'pending',
    governanceCategory: row.governance_category || 'composite',
    requiredApprovers: Array.isArray(row.required_approvers) ? row.required_approvers : JSON.parse(row.required_approvers || '[]'),
    diffs: Array.isArray(row.diffs) ? row.diffs : JSON.parse(row.diffs || '[]'),
    fullProposedEmployee: typeof row.full_proposed_employee === 'object' ? row.full_proposed_employee : JSON.parse(row.full_proposed_employee || '{}'),
    reason: row.reason || '',
    approvedBy: row.approved_by || undefined,
    approvedByRole: row.approved_by_role || undefined,
    approvedAt: row.approved_at || undefined,
    rejectionReason: row.rejection_reason || undefined,
    rejectedBy: row.rejected_by || undefined,
    rejectedAt: row.rejected_at || undefined
});

export const employeeChangesService = {
    async getAll(siteId?: string, countryCode?: string, limit: number = 25): Promise<EmployeeProfileChangeRequest[]> {
        try {
            // RULE 10: 25-record shelf limit
            let query = supabase.from('employee_change_requests').select('*').limit(limit);
            if (siteId) query = query.eq('site_id', siteId);
            if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());

            const { data, error } = await query.order('requested_at', { ascending: false });
            if (error) throw error;

            const mapped = (data || []).map(mapDBToChangeRequest);
            inMemoryBackup = mapped;
            return mapped;
        } catch (error) {
            logger.error('employeeChangesService', 'Remote fetch failed for change requests:', error as Error);
            let results = inMemoryBackup;
            if (siteId) results = results.filter(r => r.siteId === siteId);
            if (countryCode) results = results.filter(r => r.countryCode.toUpperCase() === countryCode.toUpperCase());
            return results.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        }
    },

    async getPending(siteId?: string, countryCode?: string): Promise<EmployeeProfileChangeRequest[]> {
        const all = await this.getAll(siteId, countryCode);
        return all.filter(r => r.status === 'pending');
    },

    async create(request: Omit<EmployeeProfileChangeRequest, 'id'>): Promise<EmployeeProfileChangeRequest> {
        const country = (request.countryCode || 'ET').toUpperCase();
        const newId = crypto.randomUUID();

        const newRecord: EmployeeProfileChangeRequest = {
            ...request,
            id: newId,
            countryCode: country
        };

        const dbRecord = {
            id: newId,
            employee_id: request.employeeId,
            employee_name: request.employeeName,
            country_code: country,
            site_id: request.siteId || null,
            requested_by: request.requestedBy,
            requested_by_role: request.requestedByRole,
            requested_at: request.requestedAt,
            status: 'pending',
            governance_category: request.governanceCategory,
            required_approvers: request.requiredApprovers,
            diffs: request.diffs,
            full_proposed_employee: request.fullProposedEmployee,
            reason: request.reason
        };

        const { data, error } = await supabase
            .from('employee_change_requests')
            .insert([dbRecord])
            .select()
            .single();

        if (error) {
            logger.error('employeeChangesService', 'Supabase insert failed:', error as Error);
            throw new Error(`Failed to submit profile change request to server: ${error.message || 'Database error'}`);
        }

        const result = mapDBToChangeRequest(data);
        inMemoryBackup = [result, ...inMemoryBackup.filter(r => r.id !== result.id)];
        return result;
    },

    async approve(
        requestId: string,
        approverName: string,
        approverRole: string,
        notes?: string
    ): Promise<EmployeeProfileChangeRequest> {
        // 1. Fetch current record from server
        const { data: currentData, error: fetchErr } = await supabase
            .from('employee_change_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchErr || !currentData) {
            logger.error('employeeChangesService', 'Change request not found on server:', fetchErr as Error);
            throw new Error(`Employee profile change request ${requestId} not found on server.`);
        }

        const target = mapDBToChangeRequest(currentData);
        const approvedAt = new Date().toISOString();

        // 2. Apply changes to the actual employee record via employeesService
        try {
            await employeesService.update(target.employeeId, target.fullProposedEmployee);
            logger.info('employeeChangesService', `Applied profile updates for employee ${target.employeeName} (${target.employeeId})`);
        } catch (updateErr) {
            logger.error('employeeChangesService', 'Failed to update employee in database:', updateErr as Error);
            throw new Error(`Failed to apply changes to employee: ${(updateErr as Error).message}`);
        }

        // 3. Persist approval state on server
        const { error: reqErr } = await supabase
            .from('employee_change_requests')
            .update({
                status: 'approved',
                approved_by: approverName,
                approved_by_role: approverRole,
                approved_at: approvedAt
            })
            .eq('id', requestId);

        if (reqErr) {
            logger.error('employeeChangesService', 'Remote update failed:', reqErr as Error);
            throw new Error(`Failed to record approval on server: ${reqErr.message}`);
        }

        const updatedRecord: EmployeeProfileChangeRequest = {
            ...target,
            status: 'approved',
            approvedBy: approverName,
            approvedByRole: approverRole,
            approvedAt
        };

        inMemoryBackup = inMemoryBackup.map(r => r.id === requestId ? updatedRecord : r);

        // 4. Log to system audit trail
        try {
            await systemLogsService.create({
                action: 'APPROVE_EMPLOYEE_PROFILE_CHANGE',
                details: `Approved cross-departmental changes for ${target.employeeName}. Reason: ${target.reason}. Diff summary: ${target.diffs.map(d => `${d.label}: ${d.oldValue} -> ${d.newValue}`).join('; ')}`,
                user_name: approverName,
                performed_by: approverName,
                module: 'HR',
                site_id: target.siteId,
                country_code: target.countryCode
            });
        } catch {
            // Non-blocking log
        }

        return updatedRecord;
    },

    async reject(
        requestId: string,
        rejectedByName: string,
        rejectionReason: string
    ): Promise<EmployeeProfileChangeRequest> {
        // 1. Fetch current record from server
        const { data: currentData, error: fetchErr } = await supabase
            .from('employee_change_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchErr || !currentData) {
            logger.error('employeeChangesService', 'Change request not found on server:', fetchErr as Error);
            throw new Error(`Employee profile change request ${requestId} not found on server.`);
        }

        const target = mapDBToChangeRequest(currentData);
        const rejectedAt = new Date().toISOString();

        const { error: reqErr } = await supabase
            .from('employee_change_requests')
            .update({
                status: 'rejected',
                rejected_by: rejectedByName,
                rejected_at: rejectedAt,
                rejection_reason: rejectionReason
            })
            .eq('id', requestId);

        if (reqErr) {
            logger.error('employeeChangesService', 'Remote update failed:', reqErr as Error);
            throw new Error(`Failed to record rejection on server: ${reqErr.message}`);
        }

        const updatedRecord: EmployeeProfileChangeRequest = {
            ...target,
            status: 'rejected',
            rejectedBy: rejectedByName,
            rejectedAt,
            rejectionReason
        };

        inMemoryBackup = inMemoryBackup.map(r => r.id === requestId ? updatedRecord : r);

        try {
            await systemLogsService.create({
                action: 'REJECT_EMPLOYEE_PROFILE_CHANGE',
                details: `Rejected change request for ${target.employeeName}. Reason: ${rejectionReason}`,
                user_name: rejectedByName,
                performed_by: rejectedByName,
                module: 'HR',
                site_id: target.siteId,
                country_code: target.countryCode
            });
        } catch {
            // Non-blocking
        }

        return updatedRecord;
    }
};
