import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { employeesService } from './employees.service';
import { createAuthAccountForNewHire } from '../utils/employeeAuthHelper';
import type { JobCandidate } from '../types/hr-advanced';

export interface CandidateHiringRoute {
    isException: boolean;
    isSalaryException: boolean;
    isQuotaException: boolean;
    maxSalary?: number;
    approvedQuota: number;
    currentActive: number;
    openSlots: number;
    countryBuffer: number;
    exceedsCountryBuffer: boolean;
    requiredSteps: ('HR_CLEARANCE' | 'HIRING_MANAGER_CONFIRM' | 'FINANCE_CLEARANCE' | 'CMD_APPROVAL' | 'GROUP_ESCALATION')[];
    reason: string;
}

export const isAuthorizedHiringManager = (userRole: string): boolean => {
    const norm = (userRole || '').toLowerCase().trim().replace(/[\s-]/g, '_');
    return [
        'store_manager',
        'warehouse_manager',
        'facility_director',
        'operations_manager',
        'country_operations_director',
        'regional_operations_manager',
        'country_managing_director',
        'country_hr_director',
        'regional_hr_manager',
        'hr_generalist',
        'group_ceo',
        'group_chro'
    ].includes(norm);
};

export const isHRLead = (userRole: string): boolean => {
    const norm = (userRole || '').toLowerCase().trim().replace(/[\s-]/g, '_');
    return [
        'country_hr_director',
        'regional_hr_manager',
        'hr_generalist',
        'country_managing_director',
        'group_ceo',
        'group_chro'
    ].includes(norm);
};

export const isFinanceLead = (userRole: string): boolean => {
    const norm = (userRole || '').toLowerCase().trim().replace(/[\s-]/g, '_');
    return [
        'country_finance_director',
        'regional_finance_manager',
        'country_managing_director',
        'group_ceo',
        'group_cfo'
    ].includes(norm);
};

export const evaluateCandidateHiringRoute = async (params: {
    siteId: string;
    role: string;
    offeredSalary?: number;
    countryCode?: string;
}): Promise<CandidateHiringRoute> => {
    const country = (params.countryCode || 'ET').toUpperCase();
    const siteId = params.siteId;
    const role = params.role;
    const proposedSalary = Number(params.offeredSalary) || 0;

    let approvedQuota = 10;
    let maxSalary: number | undefined = undefined;
    let currentActive = 0;
    let countryBuffer = 10;

    try {
        const { data: quotaRecord } = await supabase
            .from('facility_headcount_quotas')
            .select('approved_quota, max_monthly_salary')
            .eq('site_id', siteId)
            .eq('role', role)
            .maybeSingle();

        if (quotaRecord) {
            approvedQuota = Number(quotaRecord.approved_quota) || 10;
            if (quotaRecord.max_monthly_salary) {
                maxSalary = Number(quotaRecord.max_monthly_salary);
            }
        }

        const { count } = await supabase
            .from('employees')
            .select('id', { count: 'exact', head: true })
            .eq('site_id', siteId)
            .eq('role', role)
            .eq('status', 'Active');

        currentActive = count || 0;

        const { data: limitRecord } = await supabase
            .from('country_governance_limits')
            .select('headcount_country_buffer')
            .eq('country_code', country)
            .maybeSingle();

        if (limitRecord?.headcount_country_buffer) {
            countryBuffer = Number(limitRecord.headcount_country_buffer);
        }
    } catch (e) {
        logger.warn('recruitmentDelegation', 'Failed to evaluate live limits, using defaults', { error: String(e) });
    }

    const isQuotaFull = currentActive >= approvedQuota;
    const isSalaryExcess = Boolean(maxSalary && proposedSalary > maxSalary);
    const isException = isQuotaFull || isSalaryExcess;
    const openSlots = Math.max(0, approvedQuota - currentActive);
    const quotaOverage = isQuotaFull ? (currentActive + 1 - approvedQuota) : 0;
    const exceedsCountryBuffer = quotaOverage > countryBuffer;

    const requiredSteps: CandidateHiringRoute['requiredSteps'] = ['HR_CLEARANCE'];
    let reason = 'Routine hiring within pre-approved site headcount quota and standard compensation band.';

    if (isException) {
        requiredSteps.push('FINANCE_CLEARANCE');
        if (exceedsCountryBuffer) {
            requiredSteps.push('GROUP_ESCALATION');
            reason = `Headcount expansion exceeds country buffer (+${countryBuffer} slots). Escalates to Group CHRO / Group CEO.`;
        } else {
            requiredSteps.push('CMD_APPROVAL');
            reason = isSalaryExcess
                ? `Offered salary (${proposedSalary}) exceeds standard band cap (${maxSalary}). Requires Finance clearance and Country MD approval.`
                : `Facility headcount quota full (${currentActive}/${approvedQuota}). Requires Finance clearance and Country MD approval within national buffer.`;
        }
    } else {
        requiredSteps.push('HIRING_MANAGER_CONFIRM');
    }

    return {
        isException,
        isSalaryException: isSalaryExcess,
        isQuotaException: isQuotaFull,
        maxSalary,
        approvedQuota,
        currentActive,
        openSlots,
        countryBuffer,
        exceedsCountryBuffer,
        requiredSteps,
        reason
    };
};

export const provisionActivatedEmployee = async (
    candidate: JobCandidate,
    targetSiteId: string,
    finalRole: any,
    finalDept: string,
    finalSalary: number
) => {
    const now = new Date().toISOString();
    const joinDate = now.split('T')[0];
    const assignedCode = await employeesService.getNextCode(candidate.country_code);
    const numericPin = assignedCode.replace(/\D/g, '').slice(-4) || '1234';
    const defaultPwd = `SiifMart@${numericPin}`;
    let employeeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`;

    try {
        const nameParts = candidate.name.trim().split(' ');
        const authRes = await createAuthAccountForNewHire({
            signupEmail: candidate.email.toLowerCase(),
            password: defaultPwd,
            firstName: nameParts[0] || 'Staff',
            lastName: nameParts.slice(1).join(' ') || 'Member',
            role: finalRole,
            siteId: targetSiteId,
            employeeCode: assignedCode,
            fallbackEmployeeId: employeeId
        });
        employeeId = authRes.employeeId;
    } catch (e) {
        logger.warn('recruitmentDelegation', 'Failed to provision auth user during hire activation', { error: String(e) });
    }

    return employeesService.create({
        id: employeeId,
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
};

