import { supabase } from '../lib/supabase';
import type { DisciplinaryRecord, DisciplinaryType, DisciplinarySeverity, AppealStatus } from '../types/hr-advanced';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_disciplinary_backup';

let inMemoryDisciplinary: DisciplinaryRecord[] = [];

const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getLocalBackup = (): DisciplinaryRecord[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryDisciplinary;
};

const saveLocalBackup = (records: DisciplinaryRecord[]): void => {
    const existing = getLocalBackup();
    const map = new Map<string, DisciplinaryRecord>();
    for (const r of existing) map.set(r.id, r);
    for (const r of records) map.set(r.id, r);
    inMemoryDisciplinary = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryDisciplinary));
        }
    } catch {
        // Safe
    }
};

const mapDBToRecord = (row: any): DisciplinaryRecord => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id || undefined,
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    record_type: row.record_type as DisciplinaryType,
    severity: row.severity as DisciplinarySeverity,
    title: row.title,
    description: row.description,
    action_taken: row.action_taken,
    appeal_status: (row.appeal_status || 'None') as AppealStatus,
    issued_by: row.issued_by,
    issued_by_role: row.issued_by_role,
    issued_at: row.issued_at,
    expires_at: row.expires_at || undefined,
    confidential_notes: row.confidential_notes || undefined,
    created_at: row.created_at
});

export const disciplinaryService = {
    async fetchDisciplinaryRecords(countryCode: string = 'ET', employeeId?: string, siteId?: string): Promise<DisciplinaryRecord[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            let query = supabase
                .from('disciplinary_records')
                .select('*')
                .eq('country_code', country);

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }
            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }

            const { data, error } = await query.order('issued_at', { ascending: false });
            if (error) {
                logger.warn('disciplinaryService', 'Supabase error, fallback to local', { message: error.message });
                return getLocalBackup().filter(r => 
                    (r.country_code || 'ET').toUpperCase() === country &&
                    (!employeeId || r.employee_id === employeeId) &&
                    (!siteId || siteId === 'All' || r.site_id === siteId)
                );
            }

            const mapped = (data || []).map(mapDBToRecord);
            saveLocalBackup(mapped);
            return mapped;
        } catch (err) {
            logger.warn('disciplinaryService', 'Exception fetching records', { error: String(err) });
            return getLocalBackup().filter(r => 
                (r.country_code || 'ET').toUpperCase() === country &&
                (!employeeId || r.employee_id === employeeId) &&
                (!siteId || siteId === 'All' || r.site_id === siteId)
            );
        }
    },

    async issueDisciplinaryNotice(data: {
        country_code: string;
        site_id?: string;
        employee_id: string;
        employee_name: string;
        record_type: DisciplinaryType;
        severity: DisciplinarySeverity;
        title: string;
        description: string;
        action_taken: string;
        issued_by: string;
        issued_by_role: string;
        expires_at?: string;
        confidential_notes?: string;
    }): Promise<DisciplinaryRecord> {
        const country = (data.country_code || 'ET').toUpperCase();
        const now = new Date().toISOString();
        const newRecord: DisciplinaryRecord = {
            ...data,
            country_code: country,
            id: generateUUID(),
            appeal_status: 'None',
            issued_at: now,
            created_at: now
        };

        try {
            const { data: dbData, error } = await supabase
                .from('disciplinary_records')
                .insert([{
                    id: newRecord.id,
                    country_code: country,
                    site_id: newRecord.site_id || null,
                    employee_id: newRecord.employee_id,
                    employee_name: newRecord.employee_name,
                    record_type: newRecord.record_type,
                    severity: newRecord.severity,
                    title: newRecord.title,
                    description: newRecord.description,
                    action_taken: newRecord.action_taken,
                    appeal_status: 'None',
                    issued_by: newRecord.issued_by,
                    issued_by_role: newRecord.issued_by_role,
                    issued_at: newRecord.issued_at,
                    expires_at: newRecord.expires_at || null,
                    confidential_notes: newRecord.confidential_notes || null
                }])
                .select()
                .single();

            if (error) {
                logger.warn('disciplinaryService', 'Supabase insert error, saved locally', { message: error.message });
                saveLocalBackup([newRecord]);
            } else if (dbData) {
                saveLocalBackup([mapDBToRecord(dbData)]);
            }
        } catch (err) {
            logger.warn('disciplinaryService', 'Exception inserting notice, saved locally', { error: String(err) });
            saveLocalBackup([newRecord]);
        }

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: data.issued_by,
                action: 'DISCIPLINARY_NOTICE_ISSUED',
                module: 'Human Resources',
                details: JSON.stringify({
                    recordId: newRecord.id,
                    employeeId: data.employee_id,
                    employeeName: data.employee_name,
                    type: data.record_type,
                    severity: data.severity,
                    issuerRole: data.issued_by_role,
                    country
                })
            });
        } catch (logErr) {
            logger.warn('disciplinaryService', 'Audit log failed', { error: String(logErr) });
        }

        return newRecord;
    },

    async fileAppeal(recordId: string, employeeId: string, appealNotes: string): Promise<boolean> {
        const records = getLocalBackup();
        const existing = records.find(r => r.id === recordId);
        if (existing && existing.employee_id !== employeeId) {
            throw new Error('Access denied: You can only file an appeal against your own disciplinary notice.');
        }

        const notesToSave = appealNotes 
            ? (existing?.confidential_notes 
                ? `${existing.confidential_notes}\n[Appeal filed]: ${appealNotes}` 
                : `[Appeal filed]: ${appealNotes}`)
            : existing?.confidential_notes;

        try {
            const { error } = await supabase
                .from('disciplinary_records')
                .update({ 
                    appeal_status: 'Pending Appeal',
                    confidential_notes: notesToSave || null
                })
                .eq('id', recordId);

            if (error) {
                logger.warn('disciplinaryService', 'Supabase appeal update error', { message: error.message });
            }
        } catch (err) {
            logger.warn('disciplinaryService', 'Exception in fileAppeal', { error: String(err) });
        }

        const updated = records.map(r => r.id === recordId ? { 
            ...r, 
            appeal_status: 'Pending Appeal' as const,
            confidential_notes: notesToSave
        } : r);
        saveLocalBackup(updated);

        try {
            await systemLogsService.create({
                user_name: existing?.employee_name || 'Staff',
                action: 'DISCIPLINARY_APPEAL_FILED',
                module: 'Human Resources',
                details: JSON.stringify({ recordId, employeeId, notes: appealNotes })
            });
        } catch {
            // Safe
        }

        return true;
    },

    async resolveAppeal(
        recordId: string,
        resolution: 'Upheld' | 'Overturned',
        reviewer: { id: string; name: string; role: string },
        adjudicationNotes?: string
    ): Promise<boolean> {
        const records = getLocalBackup();
        const existing = records.find(r => r.id === recordId);

        // 4-Eyes rule: Issuer cannot resolve the appeal (checks both ID and name)
        if (existing && (
            (reviewer.id && existing.issued_by === reviewer.id) ||
            (reviewer.name && existing.issued_by === reviewer.name)
        )) {
            throw new Error('Maker-Checker violation: Disciplinary notice issuer cannot adjudicate the appeal.');
        }

        const notesToSave = adjudicationNotes
            ? (existing?.confidential_notes
                ? `${existing.confidential_notes}\n[Adjudication ${resolution} by ${reviewer.name} (${reviewer.role})]: ${adjudicationNotes}`
                : `[Adjudication ${resolution} by ${reviewer.name} (${reviewer.role})]: ${adjudicationNotes}`)
            : existing?.confidential_notes;

        try {
            const { error } = await supabase
                .from('disciplinary_records')
                .update({ 
                    appeal_status: resolution,
                    confidential_notes: notesToSave || null
                })
                .eq('id', recordId);

            if (error) {
                logger.warn('disciplinaryService', 'Supabase resolve appeal error', { message: error.message });
            }
        } catch (err) {
            logger.warn('disciplinaryService', 'Exception resolving appeal', { error: String(err) });
        }

        const updated = records.map(r => r.id === recordId ? { 
            ...r, 
            appeal_status: resolution,
            confidential_notes: notesToSave
        } : r);
        saveLocalBackup(updated);

        try {
            await systemLogsService.create({
                user_name: reviewer.name,
                action: resolution === 'Upheld' ? 'DISCIPLINARY_APPEAL_UPHELD' : 'DISCIPLINARY_APPEAL_OVERTURNED',
                module: 'Human Resources',
                details: JSON.stringify({ recordId, resolution, reviewerRole: reviewer.role })
            });
        } catch {
            // Safe
        }

        return true;
    }
};
