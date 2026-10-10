import type { JobRequisition, JobCandidate } from '../types/hr-advanced';

const LOCAL_STORAGE_REQS = 'siifmart_job_reqs_backup';
const LOCAL_STORAGE_CANDS = 'siifmart_candidates_backup';

let inMemoryReqs: JobRequisition[] = [];
let inMemoryCands: JobCandidate[] = [];

export const getLocalReqs = (): JobRequisition[] => {
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

export const saveLocalReqs = (records: JobRequisition[]): void => {
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

export const getLocalCands = (): JobCandidate[] => {
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

export const saveLocalCands = (records: JobCandidate[]): void => {
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

export const mapDBToReq = (row: any): JobRequisition => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id,
    title: row.title,
    department: row.department,
    role: row.role,
    headcount: Number(row.headcount) || 1,
    target_salary: Number(row.target_salary) || 0,
    status: row.status,
    justification: row.justification,
    requested_by: row.requested_by,
    requested_by_role: row.requested_by_role,
    approved_by: row.approved_by || undefined,
    approved_at: row.approved_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});

export const mapDBToCand = (row: any): JobCandidate => ({
    id: row.id,
    requisition_id: row.requisition_id || undefined,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id || undefined,
    role: row.role || undefined,
    name: row.name,
    email: row.email,
    phone: row.phone,
    stage: row.stage,
    interview_score: Number(row.interview_score) || 0,
    technical_score: Number(row.technical_score) || 0,
    culture_fit_score: Number(row.culture_fit_score) || 0,
    interviewer_notes: row.interviewer_notes || undefined,
    offered_salary: row.offered_salary ? Number(row.offered_salary) : undefined,
    resume_url: row.resume_url || undefined,
    hr_approved_by: row.hr_approved_by || undefined,
    hr_approved_at: row.hr_approved_at || undefined,
    hr_notes: row.hr_notes || undefined,
    finance_approved_by: row.finance_approved_by || undefined,
    finance_approved_at: row.finance_approved_at || undefined,
    finance_notes: row.finance_notes || undefined,
    hired_employee_id: row.hired_employee_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});
