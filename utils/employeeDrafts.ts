import type { NewEmployeeFormData } from '../hooks/useEmployeeWizard';
import { UserRole } from '../types';

export interface EmployeeDraft {
    id: string;
    title: string;
    role: UserRole;
    department: string;
    siteId?: string;
    siteName?: string;
    countryCode?: string;
    step: number;
    savedAt: string;
    attachedDocsCount: number;
    data: NewEmployeeFormData;
}

const getStorageKey = (countryCode?: string): string => {
    const cleanCountry = (countryCode || 'ET').toUpperCase();
    return `siifmart_worker_drafts_${cleanCountry}`;
};

/**
 * Retrieves all saved employee onboarding drafts for the target sovereign country.
 */
export function getEmployeeDrafts(countryCode?: string): EmployeeDraft[] {
    try {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(getStorageKey(countryCode));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const sanitized = parsed.map((draft: EmployeeDraft) => ({
            ...draft,
            data: { ...draft.data, password: '' }
        }));
        if (JSON.stringify(sanitized) !== raw) {
            try {
                localStorage.setItem(getStorageKey(countryCode), JSON.stringify(sanitized));
            } catch {
                // Keep returning the sanitized in-memory drafts if storage is temporarily full.
            }
        }
        return sanitized;
    } catch {
        return [];
    }
}

/**
 * Saves or updates an employee onboarding draft.
 */
export function saveEmployeeDraft(
    data: NewEmployeeFormData,
    step: number,
    existingDraftId?: string | null,
    countryCode?: string,
    siteName?: string
): EmployeeDraft {
    const drafts = getEmployeeDrafts(countryCode);
    const candidateName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const title = candidateName || (data.role ? `New ${data.role} Candidate` : 'Untitled Candidate');

    const certificatesCount = Array.isArray(data.certificates) ? data.certificates.length : 0;
    const resumeCount = data.resume ? 1 : 0;
    const idCount = data.nationalIdPhoto ? 1 : 0;
    const attachedDocsCount = certificatesCount + resumeCount + idCount;

    const draftId = existingDraftId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const draft: EmployeeDraft = {
        id: draftId,
        title,
        role: data.role,
        department: data.department || 'Retail Operations',
        siteId: data.siteId,
        siteName: siteName || '',
        countryCode: (countryCode || 'ET').toUpperCase(),
        step,
        savedAt: new Date().toISOString(),
        attachedDocsCount,
        // Passwords are deliberately not recoverable from onboarding drafts.
        data: { ...data, password: '' }
    };

    // If updating existing draft, replace it; otherwise prepend
    const existingIndex = drafts.findIndex(d => d.id === draftId);
    let updated: EmployeeDraft[];
    if (existingIndex >= 0) {
        updated = [...drafts];
        updated[existingIndex] = draft;
    } else {
        updated = [draft, ...drafts];
    }

    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem(getStorageKey(countryCode), JSON.stringify(updated));
        }
    } catch (error) {
        throw new Error(`Could not save onboarding draft: ${error instanceof Error ? error.message : 'device storage is unavailable'}`);
    }

    return draft;
}

/**
 * Deletes a specific employee onboarding draft.
 */
export function deleteEmployeeDraft(draftId: string, countryCode?: string): void {
    try {
        if (typeof window === 'undefined') return;
        const drafts = getEmployeeDrafts(countryCode);
        const filtered = drafts.filter(d => d.id !== draftId);
        localStorage.setItem(getStorageKey(countryCode), JSON.stringify(filtered));
    } catch {
        // ignore
    }
}

/**
 * Clears all employee drafts for the sovereign country.
 */
export function clearEmployeeDrafts(countryCode?: string): void {
    try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(getStorageKey(countryCode));
    } catch {
        // ignore
    }
}
