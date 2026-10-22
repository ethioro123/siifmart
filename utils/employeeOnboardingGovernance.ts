/**
 * SIIFMART Employee Onboarding Governance & 4-Eyes Maker-Checker Rules.
 * Pure helper functions (no hooks, no I/O).
 */
import { saveEmployeeDocument } from './employeeProfileData';
import { canEmployRole } from './roles';

/**
 * Executive and HR roles authorized to directly onboard and activate workers.
 */
export const DIRECT_ONBOARDING_ROLES: readonly string[] = ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director'] as const;

/**
 * Checks whether the current user is authorized to perform direct staff onboarding.
 * Site & Facility Managers (Warehouse Managers, Store Managers, etc.)
 * cannot directly onboard workers; they draft candidate proposals for HR authorization.
 */
export const isDirectOnboardingAuthorized = (
    role?: string | null,
    candidateRole?: string | null,
    isQuotaApproved: boolean = false
): boolean => {
    if (!role) return false;
    const cleanRole = role.toLowerCase().trim();

    // Hierarchy boundary: Nobody can directly onboard a candidate of equal or superior hierarchy rank
    if (candidateRole && !canEmployRole(role, candidateRole)) {
        return false;
    }

    if (DIRECT_ONBOARDING_ROLES.some(r => r.toLowerCase() === cleanRole)) {
        return true;
    }
    // Regional & Site Managers (L3-L7) can fast-track Level 10 frontline hires if pre-approved quota slot is available
    if (isQuotaApproved && candidateRole) {
        const managerialRoles = ['regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_security_manager', 'regional_merchandising_manager', 'store_manager', 'warehouse_manager', 'dispatch_supervisor', 'regional_supply_chain_manager', 'inventory_manager', 'country_operations_director', 'country_supply_chain_director'];
        if (managerialRoles.includes(cleanRole)) {
            return true;
        }
    }
    return false;
};

/**
 * Returns the human-readable submit button label depending on actor authority.
 */
export const getOnboardingSubmitLabel = (
    role?: string | null,
    isSubmitting: boolean = false,
    candidateRole?: string | null,
    isQuotaApproved: boolean = false
): string => {
    const isDirect = isDirectOnboardingAuthorized(role, candidateRole, isQuotaApproved);
    if (isSubmitting) {
        return isDirect ? (isQuotaApproved ? 'Activating Employee...' : 'Creating Employee...') : 'Submitting to HR...';
    }
    return isDirect ? (isQuotaApproved ? 'Activate Frontline Worker' : 'Confirm & Onboard Talent') : 'Submit to HR for Approval';
};

/**
 * Returns the wizard modal title depending on actor authority.
 */
export const getOnboardingModalTitle = (
    role?: string | null,
    candidateRole?: string | null,
    isQuotaApproved: boolean = false
): string => {
    const isDirect = isDirectOnboardingAuthorized(role, candidateRole, isQuotaApproved);
    return isDirect ? (isQuotaApproved ? 'Onboard Talent (Fast-Track Active)' : 'Onboard Talent') : 'Draft Candidate (HR Approval)';
};

/**
 * Persists attached candidate identity and personnel documents to local/verified storage.
 */
export const persistCandidateDocuments = (employeeId: string, newEmpData: any) => {
    if (newEmpData.nationalIdPhoto) {
        saveEmployeeDocument(employeeId, {
            name: 'National_ID_Card.jpg',
            size: newEmpData.nationalIdInfo?.compressedSize || '180 KB',
            type: 'jpg',
            dataUrl: newEmpData.nationalIdPhoto
        });
    }
    if (newEmpData.resume?.dataUrl) {
        saveEmployeeDocument(employeeId, {
            name: newEmpData.resume.name,
            size: newEmpData.resume.size,
            type: newEmpData.resume.type,
            dataUrl: newEmpData.resume.dataUrl
        });
    }
    if (Array.isArray(newEmpData.certificates)) {
        newEmpData.certificates.forEach((cert: any) => {
            saveEmployeeDocument(employeeId, {
                name: cert.name,
                size: cert.size,
                type: cert.type,
                dataUrl: cert.dataUrl
            });
        });
    }
};
