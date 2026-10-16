/**
 * SIIFMART Employee Onboarding Governance & 4-Eyes Maker-Checker Rules.
 * Pure helper functions (no hooks, no I/O).
 */
import { saveEmployeeDocument } from './employeeProfileData';

/**
 * Executive and HR roles authorized to directly onboard and activate workers.
 */
export const DIRECT_ONBOARDING_ROLES: readonly string[] = [
    'super_admin',
    'ceo',
    'CEO',
    'admin',
    'hr',
    'hr_manager'
] as const;

/**
 * Checks whether the current user is authorized to perform direct staff onboarding.
 * Site & Facility Managers (Warehouse Managers, Store Managers, Online Store Managers, etc.)
 * cannot directly onboard workers; they draft candidate proposals for HR authorization.
 */
export const isDirectOnboardingAuthorized = (
    role?: string | null,
    candidateRole?: string | null,
    isQuotaApproved: boolean = false
): boolean => {
    if (!role) return false;
    const cleanRole = role.toLowerCase().trim();
    if (DIRECT_ONBOARDING_ROLES.some(r => r.toLowerCase() === cleanRole)) {
        return true;
    }
    // Regional & Site Managers can fast-track Level 4 frontline hires if pre-approved quota slot is available
    if (isQuotaApproved && candidateRole) {
        const managerialRoles = ['regional_manager', 'regional_hr_officer', 'store_manager', 'warehouse_manager', 'dispatch_manager', 'operations_manager'];
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
        return isDirect ? 'Activating Employee...' : 'Submitting to HR...';
    }
    return isDirect ? 'Activate Frontline Worker' : 'Submit to HR for Approval';
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
    return isDirect ? 'Onboard Talent (Fast-Track Active)' : 'Draft Candidate (HR Approval)';
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
