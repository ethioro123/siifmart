import { supabase } from '../lib/supabase';
import type { StoreOperationsAudit } from '../components/dashboard/types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_store_audits_backup';

let inMemoryAudits: StoreOperationsAudit[] = [];

const getLocalBackup = (): StoreOperationsAudit[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback to in-memory backup
    }
    return inMemoryAudits;
};

const saveLocalBackup = (audits: StoreOperationsAudit[]): void => {
    const map = new Map<string, StoreOperationsAudit>();
    for (const a of inMemoryAudits) {
        map.set(a.id, a);
    }
    for (const a of audits) {
        map.set(a.id, a);
    }
    inMemoryAudits = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryAudits));
        }
    } catch {
        // Quota safety
    }
};

const mapDBToAudit = (row: any): StoreOperationsAudit => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id,
    site_name: row.site_name || undefined,
    auditor_id: row.auditor_id,
    auditor_name: row.auditor_name,
    manager_on_duty_id: row.manager_on_duty_id || undefined,
    manager_on_duty_name: row.manager_on_duty_name || undefined,
    audit_type: row.audit_type || 'unannounced_walkthrough',
    planogram_score: Number(row.planogram_score) ?? 100,
    planogram_notes: row.planogram_notes || undefined,
    shelf_hygiene_score: Number(row.shelf_hygiene_score) ?? 100,
    halal_catalog_compliant: Boolean(row.halal_catalog_compliant ?? true),
    cash_counted: row.cash_counted !== null && row.cash_counted !== undefined ? Number(row.cash_counted) : undefined,
    cash_expected: row.cash_expected !== null && row.cash_expected !== undefined ? Number(row.cash_expected) : undefined,
    cash_variance: row.cash_variance !== null && row.cash_variance !== undefined ? Number(row.cash_variance) : undefined,
    register_id: row.register_id || undefined,
    findings: row.findings || undefined,
    corrective_actions: row.corrective_actions || undefined,
    status: row.status || 'passed',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || undefined
});

export const storeAuditsService = {
    async fetchAudits(countryCode: string = 'ET'): Promise<StoreOperationsAudit[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            const { data, error } = await supabase
                .from('store_operations_audits')
                .select('*')
                .eq('country_code', country)
                .order('created_at', { ascending: false });

            if (error) {
                logger.warn('storeAuditsService', 'Supabase query error, falling back to local storage', { message: error.message });
                const local = getLocalBackup().filter(a => (a.country_code || 'ET').toUpperCase() === country);
                return local;
            }

            const mapped = (data || []).map(mapDBToAudit);
            saveLocalBackup(mapped);
            return mapped;
        } catch (err) {
            logger.warn('storeAuditsService', 'Exception fetching audits, falling back to local', { error: String(err) });
            return getLocalBackup().filter(a => (a.country_code || 'ET').toUpperCase() === country);
        }
    },

    async createAudit(auditData: Omit<StoreOperationsAudit, 'id' | 'created_at'>): Promise<StoreOperationsAudit> {
        const country = (auditData.country_code || 'ET').toUpperCase();
        const newAudit: StoreOperationsAudit = {
            ...auditData,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('store_operations_audits')
                .insert([{
                    id: newAudit.id,
                    country_code: country,
                    site_id: newAudit.site_id,
                    site_name: newAudit.site_name,
                    auditor_id: newAudit.auditor_id,
                    auditor_name: newAudit.auditor_name,
                    manager_on_duty_id: newAudit.manager_on_duty_id,
                    manager_on_duty_name: newAudit.manager_on_duty_name,
                    audit_type: newAudit.audit_type,
                    planogram_score: newAudit.planogram_score,
                    planogram_notes: newAudit.planogram_notes,
                    shelf_hygiene_score: newAudit.shelf_hygiene_score,
                    halal_catalog_compliant: newAudit.halal_catalog_compliant,
                    cash_counted: newAudit.cash_counted,
                    cash_expected: newAudit.cash_expected,
                    cash_variance: newAudit.cash_variance,
                    register_id: newAudit.register_id,
                    findings: newAudit.findings,
                    corrective_actions: newAudit.corrective_actions,
                    status: newAudit.status,
                    created_at: newAudit.created_at
                }])
                .select()
                .single();

            if (error) {
                logger.warn('storeAuditsService', 'Error saving audit to Supabase, caching locally', { message: error.message });
                saveLocalBackup([newAudit]);
            } else if (data) {
                saveLocalBackup([mapDBToAudit(data)]);
            }
        } catch (err) {
            logger.warn('storeAuditsService', 'Exception saving audit, caching locally', { error: String(err) });
            saveLocalBackup([newAudit]);
        }

        // Synaptic Neural Mesh: Log audit event to system_logs for tamper-proof accountability
        try {
            await systemLogsService.create({
                user_name: newAudit.auditor_name || 'Store Operations Auditor',
                action: 'STORE_OPERATIONS_AUDIT_COMPLETED',
                module: 'Operations',
                details: JSON.stringify({
                    auditId: newAudit.id,
                    siteId: newAudit.site_id,
                    siteName: newAudit.site_name,
                    auditType: newAudit.audit_type,
                    planogramScore: newAudit.planogram_score,
                    cashVariance: newAudit.cash_variance,
                    status: newAudit.status,
                    managerOnDuty: newAudit.manager_on_duty_name,
                    countryCode: country
                })
            });
        } catch (logErr) {
            logger.warn('storeAuditsService', 'Failed to log audit action to system_logs', { error: String(logErr) });
        }

        return newAudit;
    }
};
