import { supabase } from '../lib/supabase';
import type { TerminationRequestRecord, TerminationReasonCode } from '../types/hr-zero-trust';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_terminations_backup';

let inMemoryTerminations: TerminationRequestRecord[] = [];

const getLocalBackup = (): TerminationRequestRecord[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryTerminations;
};

const saveLocalBackup = (records: TerminationRequestRecord[]): void => {
    const map = new Map<string, TerminationRequestRecord>();
    for (const r of inMemoryTerminations) map.set(r.id, r);
    for (const r of records) map.set(r.id, r);
    inMemoryTerminations = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryTerminations));
        }
    } catch {
        // Safe
    }
};

const mapDBToTermination = (row: any): TerminationRequestRecord => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id || undefined,
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    employee_role: row.employee_role,
    reason_code: row.reason_code as TerminationReasonCode,
    reason_details: row.reason_details,
    effective_date: row.effective_date,
    assets_returned: Boolean(row.assets_returned),
    pos_access_revoked: Boolean(row.pos_access_revoked),
    wms_badge_deactivated: Boolean(row.wms_badge_deactivated),
    keys_surrendered: Boolean(row.keys_surrendered),
    cash_drawer_reconciled: Boolean(row.cash_drawer_reconciled),
    status: row.status,
    proposed_by: row.proposed_by,
    proposed_by_name: row.proposed_by_name,
    proposed_by_role: row.proposed_by_role,
    proposed_at: row.proposed_at,
    approved_by: row.approved_by || undefined,
    approved_by_name: row.approved_by_name || undefined,
    approved_by_role: row.approved_by_role || undefined,
    approved_at: row.approved_at || undefined,
    rejection_reason: row.rejection_reason || undefined,
    reconciliation_notes: row.reconciliation_notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});

export const terminationsService = {
    async fetchTerminations(countryCode: string = 'ET'): Promise<TerminationRequestRecord[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            const { data, error } = await supabase
                .from('termination_requests')
                .select('*')
                .eq('country_code', country)
                .order('created_at', { ascending: false });

            if (error) {
                logger.warn('terminationsService', 'Supabase fetch error, fallback to local', { message: error.message });
                return getLocalBackup().filter(t => (t.country_code || 'ET').toUpperCase() === country);
            }

            const mapped = (data || []).map(mapDBToTermination);
            saveLocalBackup(mapped);
            return mapped;
        } catch (err) {
            logger.warn('terminationsService', 'Exception fetching terminations', { error: String(err) });
            return getLocalBackup().filter(t => (t.country_code || 'ET').toUpperCase() === country);
        }
    },

    async proposeTermination(data: {
        country_code: string;
        site_id?: string;
        employee_id: string;
        employee_name: string;
        employee_role: string;
        reason_code: TerminationReasonCode;
        reason_details: string;
        effective_date: string;
        assets_returned: boolean;
        pos_access_revoked: boolean;
        wms_badge_deactivated: boolean;
        keys_surrendered: boolean;
        cash_drawer_reconciled: boolean;
        proposed_by: string;
        proposed_by_name: string;
        proposed_by_role: string;
        reconciliation_notes?: string;
    }): Promise<TerminationRequestRecord> {
        const country = (data.country_code || 'ET').toUpperCase();
        const now = new Date().toISOString();
        const newRecord: TerminationRequestRecord = {
            ...data,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending_approval',
            proposed_at: now,
            created_at: now,
            updated_at: now
        };

        try {
            const { data: dbData, error } = await supabase
                .from('termination_requests')
                .insert([{
                    id: newRecord.id,
                    country_code: country,
                    site_id: newRecord.site_id,
                    employee_id: newRecord.employee_id,
                    employee_name: newRecord.employee_name,
                    employee_role: newRecord.employee_role,
                    reason_code: newRecord.reason_code,
                    reason_details: newRecord.reason_details,
                    effective_date: newRecord.effective_date,
                    assets_returned: newRecord.assets_returned,
                    pos_access_revoked: newRecord.pos_access_revoked,
                    wms_badge_deactivated: newRecord.wms_badge_deactivated,
                    keys_surrendered: newRecord.keys_surrendered,
                    cash_drawer_reconciled: newRecord.cash_drawer_reconciled,
                    status: 'pending_approval',
                    proposed_by: newRecord.proposed_by,
                    proposed_by_name: newRecord.proposed_by_name,
                    proposed_by_role: newRecord.proposed_by_role,
                    proposed_at: newRecord.proposed_at,
                    reconciliation_notes: newRecord.reconciliation_notes
                }])
                .select()
                .single();

            if (error) {
                logger.warn('terminationsService', 'Supabase insert error, saved locally', { message: error.message });
                saveLocalBackup([newRecord]);
            } else if (dbData) {
                saveLocalBackup([mapDBToTermination(dbData)]);
            }
        } catch (err) {
            logger.warn('terminationsService', 'Exception proposing termination, saved locally', { error: String(err) });
            saveLocalBackup([newRecord]);
        }

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: data.proposed_by_name,
                action: 'TERMINATION_PROPOSED_DUAL_CONTROL',
                module: 'Human Resources',
                details: JSON.stringify({
                    requestId: newRecord.id,
                    employeeId: data.employee_id,
                    employeeName: data.employee_name,
                    role: data.employee_role,
                    reasonCode: data.reason_code,
                    proposedByRole: data.proposed_by_role
                })
            });
        } catch (logErr) {
            logger.warn('terminationsService', 'Audit log failed', { error: String(logErr) });
        }

        return newRecord;
    },

    async approveTermination(
        requestId: string,
        approver: { id: string; name: string; role: string }
    ): Promise<boolean> {
        const records = getLocalBackup();
        const request = records.find(r => r.id === requestId);

        // 4-Eyes Principle: Proposer cannot approve their own termination
        if (request && request.proposed_by === approver.id) {
            throw new Error('Maker-Checker violation: Proposer cannot approve their own termination request.');
        }

        const now = new Date().toISOString();
        try {
            const { error } = await supabase
                .from('termination_requests')
                .update({
                    status: 'approved',
                    approved_by: approver.id,
                    approved_by_name: approver.name,
                    approved_by_role: approver.role,
                    approved_at: now,
                    updated_at: now
                })
                .eq('id', requestId);

            if (error) {
                logger.warn('terminationsService', 'Supabase approve error', { message: error.message });
            }

            // Synaptic Neural Mesh: Update employee status in Supabase
            if (request?.employee_id) {
                await supabase
                    .from('employees')
                    .update({ status: 'Terminated', updated_at: now })
                    .eq('id', request.employee_id);
            }
        } catch (err) {
            logger.warn('terminationsService', 'Exception approving termination', { error: String(err) });
        }

        const updated = records.map(r => {
            if (r.id === requestId) {
                return {
                    ...r,
                    status: 'approved' as const,
                    approved_by: approver.id,
                    approved_by_name: approver.name,
                    approved_by_role: approver.role,
                    approved_at: now,
                    updated_at: now
                };
            }
            return r;
        });
        saveLocalBackup(updated);

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: approver.name,
                action: 'TERMINATION_APPROVED_FINAL',
                module: 'Human Resources',
                details: JSON.stringify({
                    requestId,
                    employeeId: request?.employee_id,
                    employeeName: request?.employee_name,
                    approverRole: approver.role,
                    reasonCode: request?.reason_code
                })
            });
        } catch (logErr) {
            logger.warn('terminationsService', 'Audit log failed', { error: String(logErr) });
        }

        return true;
    }
};
