import { supabase } from '../lib/supabase';
import type { JobRequisition, JobCandidate, RequisitionStatus, CandidateStage } from '../types/hr-advanced';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_REQS = 'siifmart_job_reqs_backup';
const LOCAL_STORAGE_CANDS = 'siifmart_candidates_backup';

let inMemoryReqs: JobRequisition[] = [];
let inMemoryCands: JobCandidate[] = [];

const getLocalReqs = (): JobRequisition[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_REQS);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryReqs;
};

const saveLocalReqs = (records: JobRequisition[]): void => {
    const map = new Map<string, JobRequisition>();
    for (const r of inMemoryReqs) map.set(r.id, r);
    for (const r of records) map.set(r.id, r);
    inMemoryReqs = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_REQS, JSON.stringify(inMemoryReqs));
        }
    } catch {
        // Safe
    }
};

const getLocalCands = (): JobCandidate[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_CANDS);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryCands;
};

const saveLocalCands = (records: JobCandidate[]): void => {
    const map = new Map<string, JobCandidate>();
    for (const c of inMemoryCands) map.set(c.id, c);
    for (const c of records) map.set(c.id, c);
    inMemoryCands = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_CANDS, JSON.stringify(inMemoryCands));
        }
    } catch {
        // Safe
    }
};

const mapDBToReq = (row: any): JobRequisition => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id,
    title: row.title,
    department: row.department,
    role: row.role,
    headcount: Number(row.headcount) || 1,
    target_salary: Number(row.target_salary) || 0,
    status: row.status as RequisitionStatus,
    justification: row.justification,
    requested_by: row.requested_by,
    requested_by_role: row.requested_by_role,
    approved_by: row.approved_by || undefined,
    approved_at: row.approved_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});

const mapDBToCand = (row: any): JobCandidate => ({
    id: row.id,
    requisition_id: row.requisition_id || undefined,
    country_code: (row.country_code || 'ET').toUpperCase(),
    name: row.name,
    email: row.email,
    phone: row.phone,
    stage: row.stage as CandidateStage,
    interview_score: Number(row.interview_score) || 0,
    technical_score: Number(row.technical_score) || 0,
    culture_fit_score: Number(row.culture_fit_score) || 0,
    interviewer_notes: row.interviewer_notes || undefined,
    offered_salary: row.offered_salary ? Number(row.offered_salary) : undefined,
    resume_url: row.resume_url || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});

export const recruitmentService = {
    async fetchRequisitions(countryCode: string = 'ET'): Promise<JobRequisition[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            const { data, error } = await supabase
                .from('job_requisitions')
                .select('*')
                .eq('country_code', country)
                .order('created_at', { ascending: false });

            if (error) {
                logger.warn('recruitmentService', 'Supabase reqs error, using local', { message: error.message });
                return getLocalReqs().filter(r => (r.country_code || 'ET').toUpperCase() === country);
            }

            const mapped = (data || []).map(mapDBToReq);
            saveLocalReqs(mapped);
            return mapped;
        } catch (err) {
            logger.warn('recruitmentService', 'Exception in fetchRequisitions', { error: String(err) });
            return getLocalReqs().filter(r => (r.country_code || 'ET').toUpperCase() === country);
        }
    },

    async createRequisition(data: {
        country_code: string;
        site_id: string;
        title: string;
        department: string;
        role: string;
        headcount: number;
        target_salary: number;
        justification: string;
        requested_by: string;
        requested_by_role: string;
    }): Promise<JobRequisition> {
        const country = (data.country_code || 'ET').toUpperCase();
        const now = new Date().toISOString();
        const newRecord: JobRequisition = {
            ...data,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending_hq_approval',
            created_at: now,
            updated_at: now
        };

        try {
            const { data: dbData, error } = await supabase
                .from('job_requisitions')
                .insert([{
                    id: newRecord.id,
                    country_code: country,
                    site_id: newRecord.site_id,
                    title: newRecord.title,
                    department: newRecord.department,
                    role: newRecord.role,
                    headcount: newRecord.headcount,
                    target_salary: newRecord.target_salary,
                    status: 'pending_hq_approval',
                    justification: newRecord.justification,
                    requested_by: newRecord.requested_by,
                    requested_by_role: newRecord.requested_by_role
                }])
                .select()
                .single();

            if (error) {
                logger.warn('recruitmentService', 'Supabase insert error, saved locally', { message: error.message });
                saveLocalReqs([newRecord]);
            } else if (dbData) {
                saveLocalReqs([mapDBToReq(dbData)]);
            }
        } catch (err) {
            logger.warn('recruitmentService', 'Exception inserting req, saved locally', { error: String(err) });
            saveLocalReqs([newRecord]);
        }

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: data.requested_by,
                action: 'JOB_REQUISITION_CREATED',
                module: 'Human Resources',
                details: JSON.stringify({
                    reqId: newRecord.id,
                    role: data.role,
                    headcount: data.headcount,
                    country
                })
            });
        } catch {
            // Safe
        }

        return newRecord;
    },

    async approveRequisition(
        requisitionId: string,
        approver: { id: string; name: string; role: string }
    ): Promise<boolean> {
        const reqs = getLocalReqs();
        const existing = reqs.find(r => r.id === requisitionId);

        // 4-Eyes rule: Requester cannot approve their own requisition
        if (existing && existing.requested_by === approver.name) {
            throw new Error('Maker-Checker violation: Requester cannot approve their own headcount requisition.');
        }

        const now = new Date().toISOString();
        try {
            const { error } = await supabase
                .from('job_requisitions')
                .update({
                    status: 'approved',
                    approved_by: approver.name,
                    approved_at: now,
                    updated_at: now
                })
                .eq('id', requisitionId);

            if (error) {
                logger.warn('recruitmentService', 'Supabase approve error', { message: error.message });
            }
        } catch (err) {
            logger.warn('recruitmentService', 'Exception approving req', { error: String(err) });
        }

        const updated = reqs.map(r => r.id === requisitionId ? {
            ...r,
            status: 'approved' as const,
            approved_by: approver.name,
            approved_at: now,
            updated_at: now
        } : r);
        saveLocalReqs(updated);

        try {
            await systemLogsService.create({
                user_name: approver.name,
                action: 'JOB_REQUISITION_APPROVED_HQ',
                module: 'Human Resources',
                details: JSON.stringify({ requisitionId, approverRole: approver.role })
            });
        } catch {
            // Safe
        }

        return true;
    },

    async fetchCandidates(countryCode: string = 'ET', requisitionId?: string): Promise<JobCandidate[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            let query = supabase
                .from('job_candidates')
                .select('*')
                .eq('country_code', country)
                .order('created_at', { ascending: false });

            if (requisitionId) {
                query = query.eq('requisition_id', requisitionId);
            }

            const { data, error } = await query;
            if (error) {
                return getLocalCands().filter(c => 
                    (c.country_code || 'ET').toUpperCase() === country &&
                    (!requisitionId || c.requisition_id === requisitionId)
                );
            }

            const mapped = (data || []).map(mapDBToCand);
            saveLocalCands(mapped);
            return mapped;
        } catch {
            return getLocalCands().filter(c => 
                (c.country_code || 'ET').toUpperCase() === country &&
                (!requisitionId || c.requisition_id === requisitionId)
            );
        }
    },

    async createCandidate(data: {
        country_code: string;
        requisition_id?: string;
        name: string;
        email: string;
        phone: string;
        resume_url?: string;
    }): Promise<JobCandidate> {
        const country = (data.country_code || 'ET').toUpperCase();
        const now = new Date().toISOString();
        const newCandidate: JobCandidate = {
            ...data,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            stage: 'applied',
            interview_score: 0,
            technical_score: 0,
            culture_fit_score: 0,
            created_at: now,
            updated_at: now
        };

        try {
            await supabase.from('job_candidates').insert([newCandidate]);
        } catch {
            // Fallback handled
        }
        saveLocalCands([newCandidate]);
        return newCandidate;
    },

    async updateCandidateStage(
        candidateId: string,
        stage: CandidateStage,
        evaluation?: {
            interview_score?: number;
            technical_score?: number;
            culture_fit_score?: number;
            interviewer_notes?: string;
            offered_salary?: number;
        }
    ): Promise<boolean> {
        const now = new Date().toISOString();
        const updatePayload = {
            stage,
            ...evaluation,
            updated_at: now
        };

        try {
            await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        } catch {
            // Fallback
        }

        const cands = getLocalCands().map(c => c.id === candidateId ? { ...c, ...updatePayload } : c);
        saveLocalCands(cands);
        return true;
    }
};
