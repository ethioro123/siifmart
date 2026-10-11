import { supabase } from '../lib/supabase';
import type { JobRequisition, JobCandidate, RequisitionStatus, CandidateStage } from '../types/hr-advanced';
import { systemLogsService } from './system-logs.service';
import { employeesService } from './employees.service';
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
            site_id?: string;
            role?: string;
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
    },

    canManageHiring(userRole: string): boolean {
        const found = SYSTEM_ROLES.find(r => r.id === userRole);
        if (!found) return false;
        // Level 1 (CEO), Level 2 (Directors), Level 3 (Site/Unit Managers) can initiate headcount requisitions
        return found.level <= 3;
    },

    canManageCandidates(userRole: string): boolean {
        // Talent Recruiters and HR staff can source and manage candidate pipelines
        if (userRole === 'talent_recruiter' || userRole === 'hr') return true;
        return this.canManageHiring(userRole);
    },

    getUserRoleLevel(userRole: string): number {
        const found = SYSTEM_ROLES.find(r => r.id === userRole);
        return found ? found.level : 99;
    },

    getAllowedRolesForManager(userRole: string): typeof SYSTEM_ROLES {
        const userLevel = this.getUserRoleLevel(userRole);
        // Strict hierarchy: managers can ONLY hire for roles strictly below their rank (level > userLevel)
        return SYSTEM_ROLES.filter(r => r.level > userLevel);
    },

    async approveCandidateHR(
        candidateId: string,
        approver: { id: string; name: string; role: string },
        notes?: string
    ): Promise<boolean> {
        const isHR = ['hr_manager', 'hr', 'super_admin', 'admin'].includes(approver.role);
        if (!isHR) {
            throw new Error('4-Eyes Violation: Only HR leadership can perform candidate identity & compliance approval.');
        }

        const now = new Date().toISOString();
        const updatePayload = {
            hr_approved_by: approver.name,
            hr_approved_at: now,
            hr_notes: notes || 'Identity, credentials & right-to-work verified.',
            updated_at: now
        };

        try {
            await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        } catch (err) {
            logger.warn('recruitmentService', 'Supabase HR approve error', { error: String(err) });
        }

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
        const isFinance = ['finance_manager', 'super_admin', 'admin'].includes(approver.role);
        if (!isFinance) {
            throw new Error('4-Eyes Violation: Only Finance leadership can authorize salary and compensation bands.');
        }

        if (!offeredSalary || offeredSalary <= 0) {
            throw new Error('Offered salary must be greater than zero.');
        }

        const now = new Date().toISOString();
        const updatePayload = {
            finance_approved_by: approver.name,
            finance_approved_at: now,
            finance_notes: notes || 'Salary verified against site departmental budget and statutory laws.',
            offered_salary: offeredSalary,
            updated_at: now
        };

        try {
            await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        } catch (err) {
            logger.warn('recruitmentService', 'Supabase Finance approve error', { error: String(err) });
        }

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

    async finalizeAndActivateHire(
        candidateId: string,
        actor: { id: string; name: string; role: string },
        siteId?: string,
        role?: string,
        department?: string
    ): Promise<any> {
        const candidate = getLocalCands().find(c => c.id === candidateId);
        if (!candidate) throw new Error('Candidate not found.');

        const isCEO = actor.role === 'super_admin' || actor.role === 'admin';
        if (!isCEO) {
            if (!candidate.hr_approved_at) {
                throw new Error('Zero-Trust Guard: Mandatory HR identity verification required before hire activation.');
            }
            if (!candidate.finance_approved_at) {
                throw new Error('Zero-Trust Guard: Mandatory Finance salary approval required before hire activation.');
            }
        }

        // Resolve site from params, candidate, or requisition
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

        if (!targetSiteId) {
            throw new Error('Operating site location is mandatory for hire activation.');
        }

        const finalRole = (targetRole || 'stock_clerk') as any;
        const finalDept = targetDept || 'Operations';
        const finalSalary = candidate.offered_salary || 0;
        const now = new Date().toISOString();
        const joinDate = now.split('T')[0];

        const assignedCode = await employeesService.getNextCode(candidate.country_code);

        // Provision into public.employees
        const newEmployee = await employeesService.create({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`,
            code: assignedCode,
            name: candidate.name,
            email: candidate.email.toLowerCase(),
            phone: candidate.phone,
            role: finalRole,
            siteId: targetSiteId,
            department: finalDept,
            salary: finalSalary,
            status: 'Active',
            joinDate,
            avatar: '',
            performanceScore: 100,
            specialization: 'Floor Operations',
            attendanceRate: 100,
            badges: ['New Hire']
        });

        const updatePayload = {
            stage: 'hired' as const,
            hired_employee_id: newEmployee.id,
            site_id: targetSiteId,
            role: finalRole,
            updated_at: now
        };

        try {
            await supabase.from('job_candidates').update(updatePayload).eq('id', candidateId);
        } catch {
            // fallback handled
        }

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
