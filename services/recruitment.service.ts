import { supabase } from '../lib/supabase';
import type { JobRequisition, JobCandidate, CandidateStage } from '../types/hr-advanced';
import { systemLogsService } from './system-logs.service';
import { employeesService } from './employees.service';
import { candidateCommandService } from './candidate-command.service';
import { SYSTEM_ROLES } from '../utils/roles';
import { logger } from '../utils/logger';
import {
    getLocalReqs,
    saveLocalReqs,
    getLocalCands,
    saveLocalCands,
    mapDBToReq,
    mapDBToCand
} from './recruitment-storage';
import {
    isHRLead,
    isFinanceLead,
    isAuthorizedHiringManager,
    evaluateCandidateHiringRoute,
    provisionActivatedEmployee
} from './recruitment-delegation';

export const recruitmentService = {
    async fetchRequisitions(countryCode = 'ET', page = 1, siteId?: string): Promise<JobRequisition[]> {
        let query = supabase.from('job_requisitions').select('id,country_code,site_id,title,department,role,headcount,target_salary,status,justification,requested_by,requested_by_role,approved_by,approved_at,created_at,updated_at').eq('country_code', countryCode.toUpperCase()).order('created_at', { ascending: false }).order('id').range((page - 1) * 25, page * 25 - 1);
        if (siteId) query = query.eq('site_id', siteId);
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data || []).map(mapDBToReq); saveLocalReqs(rows); return rows;
    },
    async requisitionById(id: string, country: string): Promise<JobRequisition> {
        const { data, error } = await supabase.from('job_requisitions').select('id,country_code,site_id,title,department,role,headcount,target_salary,status,justification,requested_by,requested_by_role,approved_by,approved_at,created_at,updated_at').eq('id', id).eq('country_code', country).single();
        if (error) throw error;
        return mapDBToReq(data);
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

        if (error) throw new Error(`Failed to save requisition: ${error.message}`);
        if (dbData) saveLocalReqs([mapDBToReq(dbData)]);

        try {
            await systemLogsService.create({
                user_name: data.requested_by,
                action: 'JOB_REQUISITION_CREATED',
                module: 'Human Resources',
                details: JSON.stringify({ reqId: newRecord.id, role: data.role, headcount: data.headcount, country })
            });
        } catch { /* safe */ }

        return newRecord;
    },

    async approveRequisition(
        requisitionId: string,
        approver: { id: string; name: string; role: string }
    ): Promise<boolean> {
        const reqs = getLocalReqs();
        const existing = reqs.find(r => r.id === requisitionId);

        if (existing && existing.requested_by === approver.name) {
            throw new Error('Maker-Checker violation: Requester cannot approve their own headcount requisition.');
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('job_requisitions')
            .update({ status: 'approved', approved_by: approver.name, approved_at: now, updated_at: now })
            .eq('id', requisitionId);

        if (error) throw new Error(`Failed to approve requisition: ${error.message}`);

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
        } catch { /* safe */ }

        return true;
    },

    async fetchCandidates(countryCode = 'ET', requisitionId?: string, page = 1, siteId?: string): Promise<JobCandidate[]> {
        let query = supabase.from('job_candidates').select('id,requisition_id,country_code,site_id,role,name,email,phone,stage,interview_score,technical_score,culture_fit_score,interviewer_notes,offered_salary,resume_url,hr_approved_by,hr_approved_at,hr_notes,finance_approved_by,finance_approved_at,finance_notes,hiring_manager_approved_by,hiring_manager_approved_at,hiring_manager_notes,cmd_approved_by,cmd_approved_at,hired_employee_id,created_by_id,hr_approved_by_id,finance_approved_by_id,hiring_manager_approved_by_id,cmd_approved_by_id,created_at,updated_at').eq('country_code', countryCode.toUpperCase()).order('created_at', { ascending: false }).order('id').range((page - 1) * 25, page * 25 - 1);
        if (requisitionId) query = query.eq('requisition_id', requisitionId);
        if (siteId) query = query.eq('site_id', siteId);
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data || []).map(mapDBToCand); saveLocalCands(rows); return rows;
    },

    async createCandidate(data: {
        country_code: string;
        requisition_id?: string;
        site_id?: string;
        role?: string;
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

        const { error } = await supabase.from('job_candidates').insert([newCandidate]);
        if (error) throw new Error(`Failed to save candidate: ${error.message}`);
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
            site_id?: string;
            role?: string;
            is_salary_exception?: boolean;
            is_quota_exception?: boolean;
        }
    ): Promise<boolean> {
        const now = new Date().toISOString();
        const updatePayload = { stage, ...evaluation, updated_at: now };

        const { error } = await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        if (error) throw new Error(`Failed to update candidate: ${error.message}`);

        const cands = getLocalCands().map(c => c.id === candidateId ? { ...c, ...updatePayload } : c);
        saveLocalCands(cands);
        return true;
    },

    canManageHiring(userRole: string): boolean {
        const found = SYSTEM_ROLES.find(r => r.id === userRole);
        return found ? found.level <= 8 : false;
    },

    canManageCandidates(userRole: string): boolean {
        if (userRole === 'talent_recruiter' || userRole === 'hr_generalist') return true;
        return this.canManageHiring(userRole);
    },

    getUserRoleLevel(userRole: string): number {
        const found = SYSTEM_ROLES.find(r => r.id === userRole);
        return found ? found.level : 99;
    },

    getAllowedRolesForManager(userRole: string): typeof SYSTEM_ROLES {
        const userLevel = this.getUserRoleLevel(userRole);
        return SYSTEM_ROLES.filter(r => r.level > userLevel);
    },

    evaluateCandidateRoute: evaluateCandidateHiringRoute,

    async approveCandidateHR(candidateId: string, _approver: { id: string; name: string; role: string }, notes?: string): Promise<boolean> {
        await candidateCommandService.decide(candidateId, 'hr', undefined, notes || 'Identity and credentials reviewed'); return true;
    },
    async approveCandidateSalaryFinance(candidateId: string, _approver: { id: string; name: string; role: string }, salary: number, notes?: string): Promise<boolean> {
        await candidateCommandService.decide(candidateId, 'finance', salary, notes || 'Salary and budget exception reviewed'); return true;
    },
    async confirmCandidateHiringManager(candidateId: string, _approver: { id: string; name: string; role: string }, notes?: string): Promise<boolean> {
        await candidateCommandService.decide(candidateId, 'manager', undefined, notes || 'Hiring offer and operational need reviewed'); return true;
    },
    async finalizeAndActivateHire(candidateId: string, _actor: { id: string; name: string; role: string }, _siteId?: string, _role?: string, department = 'Operations') {
        const id = await candidateCommandService.activate(candidateId, department);
        return employeesService.getById(id);
    }
};
