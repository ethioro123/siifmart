import { supabase } from '../lib/supabase';
import type { LeaveRequestRecord, LeaveType, StatutoryLeaveConfig } from '../types/hr-zero-trust';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_leave_requests_backup';

// Security Cleanup: Purge any legacy unencrypted sensitive medical/leave records from browser storage
if (typeof localStorage !== 'undefined') {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
        // Safe ignore
    }
}

// In-memory session cache only (transient read cache, never written to disk)
let inMemoryLeaves: LeaveRequestRecord[] = [];

export const STATUTORY_LEAVE_POLICIES: Record<string, StatutoryLeaveConfig> = {
    ET: {
        countryCode: 'ET',
        annualLeaveDays: 16, // Proclamation No. 1156/2019: 16 working days initial
        sickLeaveDays: 30,   // First month with 100% pay
        maternityLeaveDays: 120, // 30 prenatal + 90 postnatal
        paternityLeaveDays: 3,
        carryOverAllowed: true,
        maxCarryOverDays: 8
    },
    KE: {
        countryCode: 'KE',
        annualLeaveDays: 21, // Employment Act 2007 §28: 21 working days with full pay
        sickLeaveDays: 30,   // 30 days full pay + 15 days half pay
        maternityLeaveDays: 90,
        paternityLeaveDays: 14,
        carryOverAllowed: true,
        maxCarryOverDays: 10
    }
};

export const getStatutoryLeaveConfig = (countryCode: string = 'ET'): StatutoryLeaveConfig => {
    const code = (countryCode || 'ET').toUpperCase();
    return STATUTORY_LEAVE_POLICIES[code] || STATUTORY_LEAVE_POLICIES.ET;
};

const mapDBToLeave = (row: any): LeaveRequestRecord => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id || undefined,
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    leave_type: row.leave_type as LeaveType,
    start_date: row.start_date,
    end_date: row.end_date,
    days: Number(row.days) || 1,
    reason: row.reason || '',
    status: row.status || 'Pending',
    requested_by: row.requested_by,
    requested_at: row.requested_at,
    reviewed_by: row.reviewed_by || undefined,
    reviewed_by_name: row.reviewed_by_name || undefined,
    reviewed_by_role: row.reviewed_by_role || undefined,
    reviewed_at: row.reviewed_at || undefined,
    rejection_reason: row.rejection_reason || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});

export const leaveRequestsService = {
    async fetchLeaves(countryCode: string, employeeId?: string): Promise<LeaveRequestRecord[]> {
        let query = supabase.from('leave_requests').select('id,country_code,site_id,employee_id,employee_name,leave_type,start_date,end_date,days,reason,status,requested_by,requested_at,reviewed_by,reviewed_by_name,reviewed_by_role,reviewed_at,rejection_reason,created_at,updated_at').eq('country_code', countryCode).order('created_at', { ascending: false }).limit(25);
        if (employeeId) query = query.eq('employee_id', employeeId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapDBToLeave);
    },
    async pendingPage(country: string, site: string, page: number): Promise<LeaveRequestRecord[]> {
        const { data, error } = await supabase.from('leave_requests').select('id,country_code,site_id,employee_id,employee_name,leave_type,start_date,end_date,days,reason,status,requested_by,requested_at,reviewed_by,reviewed_by_name,reviewed_by_role,reviewed_at,rejection_reason,created_at,updated_at')
            .eq('country_code', country).eq('site_id', site).eq('status', 'Pending').order('requested_at').order('id').range((page - 1) * 25, page * 25 - 1);
        if (error) throw error;
        return (data || []).map(mapDBToLeave);
    },

    async createLeave(data: {
        country_code: string;
        site_id?: string;
        employee_id: string;
        employee_name: string;
        leave_type: LeaveType;
        start_date: string;
        end_date: string;
        days: number;
        reason: string;
        requested_by: string;
    }): Promise<LeaveRequestRecord> {
        const { data: session, error: authError } = await supabase.auth.getUser();
        if (authError || !session.user) throw new Error('Signed-in employee required');
        const country = (data.country_code || 'ET').toUpperCase();
        const newRecord: LeaveRequestRecord = {
            ...data,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'Pending',
            requested_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: dbData, error } = await supabase
            .from('leave_requests')
            .insert([{
                id: newRecord.id,
                country_code: country,
                site_id: newRecord.site_id,
                employee_id: newRecord.employee_id,
                employee_name: newRecord.employee_name,
                leave_type: newRecord.leave_type,
                start_date: newRecord.start_date,
                end_date: newRecord.end_date,
                days: newRecord.days,
                reason: newRecord.reason,
                status: 'Pending',
                requested_by: session.user.id,
                requested_at: newRecord.requested_at
            }])
            .select()
            .single();

        if (error) {
            logger.error('leaveRequestsService', 'Supabase leave insert failed:', error as Error);
            throw new Error(`Failed to submit leave request to server: ${error.message || 'Database error'}`);
        }

        const savedRecord = dbData ? mapDBToLeave(dbData) : newRecord;
        inMemoryLeaves = [savedRecord, ...inMemoryLeaves.filter(l => l.id !== savedRecord.id)];

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: data.requested_by,
                action: 'LEAVE_REQUEST_SUBMITTED',
                module: 'Human Resources',
                details: JSON.stringify({
                    leaveId: savedRecord.id,
                    employeeId: data.employee_id,
                    employeeName: data.employee_name,
                    type: data.leave_type,
                    days: data.days,
                    country: country
                })
            });
        } catch (logErr) {
            logger.warn('leaveRequestsService', 'Audit log non-blocking notice', { error: String(logErr) });
        }

        return savedRecord;
    },

    async reviewLeave(
        leaveId: string, 
        reviewer: { id: string; name: string; role: string },
        decision: 'Approved' | 'Rejected',
        rejectionReason?: string
    ): Promise<boolean> {
        // Fetch current record from server to verify maker-checker
        const { data: currentData, error: fetchErr } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', leaveId)
            .single();

        if (fetchErr || !currentData) {
            logger.error('leaveRequestsService', 'Leave request not found on server:', fetchErr as Error);
            throw new Error(`Leave request ${leaveId} not found on server.`);
        }

        const existing = mapDBToLeave(currentData);
        if (existing.employee_id === reviewer.id || existing.requested_by === reviewer.id) {
            throw new Error('Maker-Checker violation: Employees cannot review or approve their own leave request.');
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('leave_requests')
            .update({
                status: decision,
                reviewed_by: reviewer.id,
                reviewed_by_name: reviewer.name,
                reviewed_by_role: reviewer.role,
                reviewed_at: now,
                rejection_reason: rejectionReason || null,
                updated_at: now
            })
            .eq('id', leaveId).eq('status', 'Pending').eq('country_code', existing.country_code).select('id,status').single();

        if (error) {
            logger.error('leaveRequestsService', 'Supabase review update failed:', error as Error);
            throw new Error(`Failed to record leave decision on server: ${error.message}`);
        }

        inMemoryLeaves = inMemoryLeaves.map(l => {
            if (l.id === leaveId) {
                return {
                    ...l,
                    status: decision,
                    reviewed_by: reviewer.id,
                    reviewed_by_name: reviewer.name,
                    reviewed_by_role: reviewer.role,
                    reviewed_at: now,
                    rejection_reason: rejectionReason,
                    updated_at: now
                };
            }
            return l;
        });

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: reviewer.name,
                action: decision === 'Approved' ? 'LEAVE_REQUEST_APPROVED' : 'LEAVE_REQUEST_REJECTED',
                module: 'Human Resources',
                details: JSON.stringify({
                    leaveId,
                    reviewerRole: reviewer.role,
                    decision,
                    reason: rejectionReason
                })
            });
        } catch (logErr) {
            // Non-blocking log
        }

        return true;
    },

    _clearCache(): void {
        inMemoryLeaves = [];
    }
};
