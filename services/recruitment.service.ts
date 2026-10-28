import { supabase } from '../lib/supabase';
import type { JobRequisition, JobCandidate, CandidateStage } from '../types/hr-advanced';
import { systemLogsService } from './system-logs.service';
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

    async fetchCandidates(countryCode: string = 'ET', requisitionId?: string): Promise<JobCandidate[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            let query = supabase
                .from('job_candidates')
                .select('*')
                .eq('country_code', country)
                .order('created_at', { ascending: false });

            if (requisitionId) query = query.eq('requisition_id', requisitionId);

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

    async approveCandidateHR(
        candidateId: string,
        approver: { id: string; name: string; role: string },
        notes?: string
    ): Promise<boolean> {
        if (!isHRLead(approver.role)) {
            throw new Error('4-Eyes Violation: Only HR leadership can perform candidate identity & compliance approval.');
        }

        const candidate = getLocalCands().find(c => c.id === candidateId);
        if (candidate && (candidate.name.toLowerCase() === approver.name.toLowerCase() || candidate.email.toLowerCase() === approver.name.toLowerCase())) {
            throw new Error('Zero-Trust Anti-Fraud Violation: You cannot approve your own HR candidate clearance.');
        }

        const now = new Date().toISOString();
        const updatePayload = {
            hr_approved_by: approver.name,
            hr_approved_at: now,
            hr_notes: notes || 'Identity, credentials & compensation band cleared.',
            updated_at: now
        };

        const { error } = await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        if (error) throw new Error(`Failed to record HR candidate approval: ${error.message}`);

        const cands = getLocalCands().map(c => c.id === candidateId ? { ...c, ...updatePayload } : c);
        saveLocalCands(cands);

        await systemLogsService.create({
            user_name: approver.name,
            action: 'CANDIDATE_HR_VETTING_APPROVED',
            module: 'Human Resources',
            details: JSON.stringify({ candidateId, approverRole: approver.role, notes })
        });

        return true;
    },

    async approveCandidateSalaryFinance(
        candidateId: string,
        approver: { id: string; name: string; role: string },
        offeredSalary: number,
        notes?: string
    ): Promise<boolean> {
        if (!isFinanceLead(approver.role)) {
            throw new Error('4-Eyes Violation: Only Finance leadership can authorize salary and compensation bands.');
        }

        if (!offeredSalary || offeredSalary <= 0) {
            throw new Error('Offered salary must be greater than zero.');
        }

        const candidate = getLocalCands().find(c => c.id === candidateId);
        if (candidate && (candidate.name.toLowerCase() === approver.name.toLowerCase() || candidate.email.toLowerCase() === approver.name.toLowerCase())) {
            throw new Error('Zero-Trust Anti-Fraud Violation: You cannot approve your own Finance salary clearance.');
        }

        const now = new Date().toISOString();
        const updatePayload = {
            finance_approved_by: approver.name,
            finance_approved_at: now,
            finance_notes: notes || 'Salary verified against site departmental budget and statutory laws.',
            offered_salary: offeredSalary,
            updated_at: now
        };

        const { error } = await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        if (error) throw new Error(`Failed to record Finance candidate approval: ${error.message}`);

        const cands = getLocalCands().map(c => c.id === candidateId ? { ...c, ...updatePayload } : c);
        saveLocalCands(cands);

        await systemLogsService.create({
            user_name: approver.name,
            action: 'CANDIDATE_SALARY_FINANCE_APPROVED',
            module: 'Finance',
            details: JSON.stringify({ candidateId, approverRole: approver.role, offeredSalary, notes })
        });

        return true;
    },

    async confirmCandidateHiringManager(
        candidateId: string,
        approver: { id: string; name: string; role: string },
        notes?: string
    ): Promise<boolean> {
        if (!isAuthorizedHiringManager(approver.role)) {
            throw new Error('Delegation Violation: Only Authorized Hiring Managers or Operations Leads can confirm hiring offers.');
        }

        const candidate = getLocalCands().find(c => c.id === candidateId);
        if (candidate && (candidate.name.toLowerCase() === approver.name.toLowerCase() || candidate.email.toLowerCase() === approver.name.toLowerCase())) {
            throw new Error('Zero-Trust Anti-Fraud Violation: You cannot confirm your own hiring offer.');
        }

        if (!candidate?.hr_approved_at) {
            throw new Error('Gating Violation: HR credentials and compensation band clearance is required before confirming offer.');
        }

        const now = new Date().toISOString();
        const updatePayload = {
            hiring_manager_approved_by: approver.name,
            hiring_manager_approved_at: now,
            hiring_manager_notes: notes || 'Hiring offer confirmed within approved site headcount quota.',
            stage: 'offered' as CandidateStage,
            updated_at: now
        };

        const { error } = await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        if (error) throw new Error(`Failed to record Hiring Manager confirmation: ${error.message}`);

        const cands = getLocalCands().map(c => c.id === candidateId ? { ...c, ...updatePayload } : c);
        saveLocalCands(cands);

        await systemLogsService.create({
            user_name: approver.name,
            action: 'CANDIDATE_OFFER_CONFIRMED_BY_MANAGER',
            module: 'Human Resources',
            details: JSON.stringify({ candidateId, approverRole: approver.role, notes })
        });

        return true;
    },

    async finalizeAndActivateHire(
        candidateId: string,
        actor: { id: string; name: string; role: string },
        siteId?: string,
        role?: string,
        department?: string
    ): Promise<any> {
        const candidate = getLocalCands().find(c => c.id === candidateId);
        if (!candidate) throw new Error('Candidate not found.');

        const isCEO = actor.role === 'group_ceo' || actor.role === 'group_chro';
        if (!isCEO) {
            if (!candidate.hr_approved_at) {
                throw new Error('Zero-Trust Guard: Mandatory HR identity verification required before hire activation.');
            }

            const isException = Boolean(candidate.is_salary_exception || candidate.is_quota_exception);
            if (isException) {
                if (!candidate.finance_approved_at) {
                    throw new Error('Zero-Trust Guard: Unbudgeted headcount or salary exceptions require Finance clearance.');
                }
                const hasExecutiveSignoff = Boolean(candidate.cmd_approved_at || candidate.group_approved_at) ||
                    ['country_managing_director', 'group_ceo', 'group_chro'].includes(actor.role);
                if (!hasExecutiveSignoff) {
                    throw new Error('Zero-Trust Guard: Unbudgeted exceptions require Country MD or Group Executive approval.');
                }
            } else {
                const hasManagerConfirm = Boolean(candidate.hiring_manager_approved_at) || isAuthorizedHiringManager(actor.role);
                if (!hasManagerConfirm) {
                    throw new Error('Delegation Guard: Authorized Hiring Manager confirmation is required before hire activation.');
                }
            }
        }

        let targetSiteId = siteId || candidate.site_id;
        let targetRole = role || candidate.role;
        let targetDept = department;

        if (candidate.requisition_id) {
            const req = getLocalReqs().find(r => r.id === candidate.requisition_id);
            if (req) {
                targetSiteId = targetSiteId || req.site_id;
                targetRole = targetRole || req.role;
                targetDept = targetDept || req.department;
            }
        }

        if (!targetSiteId) throw new Error('Operating site location is mandatory for hire activation.');

        const finalRole = (targetRole || 'stock_clerk') as any;
        const finalDept = targetDept || 'Operations';
        const finalSalary = candidate.offered_salary || 0;
        const now = new Date().toISOString();

        const newEmployee = await provisionActivatedEmployee(
            candidate,
            targetSiteId,
            finalRole,
            finalDept,
            finalSalary
        );

        const updatePayload = {
            stage: 'hired' as const,
            hired_employee_id: newEmployee.id,
            site_id: targetSiteId,
            role: finalRole,
            updated_at: now
        };

        try {
            await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        } catch { /* fallback */ }

        const cands = getLocalCands().map(c => c.id === candidateId ? { ...c, ...updatePayload } : c);
        saveLocalCands(cands);

        await systemLogsService.create({
            user_name: actor.name,
            action: 'EMPLOYEE_SYNAPTIC_HIRED',
            module: 'Human Resources',
            details: JSON.stringify({
                candidateId,
                newEmployeeId: newEmployee.id,
                newEmployeeCode: newEmployee.code,
                name: newEmployee.name,
                role: finalRole,
                siteId: targetSiteId,
                salary: finalSalary
            })
        });

        return newEmployee;
    }
};
