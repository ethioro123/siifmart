import { useState, useEffect, useCallback, useRef } from 'react';
import { getEmployeeDrafts, saveEmployeeDraft, deleteEmployeeDraft } from '../utils/employeeDrafts';
import type { EmployeeDraft } from '../utils/employeeDrafts';
import type { NewEmployeeFormData } from './useEmployeeWizard';

interface UseEmployeeDraftsProps {
    countryCode?: string;
    sites?: any[];
    newEmpData: NewEmployeeFormData;
    setNewEmpData: (data: any) => void;
    addStep: number;
    setAddStep?: (step: number) => void;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    resetWizard: () => void;
    isWizardOpen?: boolean;
    onResumeDraft?: () => void;
    onStartNewCandidate?: () => void;
}

export function useEmployeeDrafts({
    countryCode,
    sites = [],
    newEmpData,
    setNewEmpData,
    addStep,
    setAddStep,
    addNotification,
    resetWizard,
    isWizardOpen = false,
    onResumeDraft,
    onStartNewCandidate
}: UseEmployeeDraftsProps) {
    const [drafts, setDrafts] = useState<EmployeeDraft[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [draftSaveError, setDraftSaveError] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const skipNextCloseFlushRef = useRef(false);

    const reloadDrafts = useCallback(() => {
        setDrafts(getEmployeeDrafts(countryCode));
    }, [countryCode]);

    useEffect(() => {
        reloadDrafts();
    }, [reloadDrafts]);

    useEffect(() => {
        setActiveDraftId(null);
    }, [countryCode]);

    const hasCandidateProgress = useCallback(() => Boolean(
        newEmpData.firstName.trim() || newEmpData.lastName.trim() || newEmpData.email.trim() ||
        newEmpData.phone.trim() || newEmpData.nationalIdNumber?.trim() || newEmpData.avatar ||
        newEmpData.nationalIdPhoto || newEmpData.resume || (newEmpData.certificates?.length ?? 0) > 0 ||
        newEmpData.salary.trim() || newEmpData.specialization.trim() || newEmpData.address.trim() ||
        newEmpData.emergencyContact.trim() || addStep > 1
    ), [newEmpData, addStep]);

    useEffect(() => {
        if (!hasCandidateProgress() && !activeDraftId) {
            setLastSavedAt(null);
            setDraftSaveError(false);
        }
    }, [hasCandidateProgress, activeDraftId]);

    const saveCurrentDraft = useCallback(() => {
        const assignedSite = sites.find(s => s.id === newEmpData.siteId);
        return saveEmployeeDraft(newEmpData, addStep, activeDraftId, countryCode, assignedSite?.name);
    }, [newEmpData, addStep, activeDraftId, countryCode, sites]);

    const flushLatestDraftRef = useRef<() => void>(() => undefined);
    useEffect(() => {
        flushLatestDraftRef.current = () => {
            if (!hasCandidateProgress()) return;
            saveCurrentDraft();
        };
    }, [hasCandidateProgress, saveCurrentDraft]);

    // Also persist when the wizard unmounts during in-app navigation or closes.
    useEffect(() => {
        if (!isWizardOpen) return;
        return () => {
            if (skipNextCloseFlushRef.current) {
                skipNextCloseFlushRef.current = false;
                return;
            }
            try {
                flushLatestDraftRef.current();
            } catch {
                // The autosave status reports storage failures while the wizard is open.
            }
        };
    }, [isWizardOpen]);

    // Debounced persistence protects progress during refreshes and module changes.
    useEffect(() => {
        if (!isWizardOpen || !hasCandidateProgress()) return;
        const timeout = window.setTimeout(() => {
            setIsSavingDraft(true);
            try {
                const draft = saveCurrentDraft();
                setActiveDraftId(draft.id);
                setLastSavedAt(draft.savedAt);
                setDraftSaveError(false);
                reloadDrafts();
            } catch {
                setDraftSaveError(true);
            } finally {
                setIsSavingDraft(false);
            }
        }, 500);
        return () => window.clearTimeout(timeout);
    }, [isWizardOpen, hasCandidateProgress, saveCurrentDraft, reloadDrafts]);

    // Flush the latest form state synchronously when the browser is navigating away.
    useEffect(() => {
        if (!isWizardOpen || !hasCandidateProgress()) return;
        const flushDraft = () => {
            try {
                const draft = saveCurrentDraft();
                setActiveDraftId(draft.id);
            } catch {
                // The debounced save exposes storage errors while the page is open.
            }
        };
        window.addEventListener('pagehide', flushDraft);
        return () => window.removeEventListener('pagehide', flushDraft);
    }, [isWizardOpen, hasCandidateProgress, saveCurrentDraft]);

    const handleSaveDraft = useCallback(() => {
        if (!hasCandidateProgress()) {
            addNotification('alert', 'Enter candidate details before saving an onboarding draft.');
            return;
        }
        try {
            const draft = saveCurrentDraft();
            setActiveDraftId(draft.id);
            setLastSavedAt(draft.savedAt);
            setDraftSaveError(false);
            reloadDrafts();
            addNotification('success', `Draft saved: "${draft.title}" (Step ${addStep})`);
            return draft;
        } catch {
            setDraftSaveError(true);
            addNotification('alert', 'Could not save this draft on this device. Free up browser storage and try again.');
            return;
        }
    }, [hasCandidateProgress, addNotification, saveCurrentDraft, addStep, reloadDrafts]);

    const handleResumeDraft = useCallback((draftId: string) => {
        const found = drafts.find(d => d.id === draftId);
        if (!found) {
            addNotification('alert', 'Draft not found or has been removed.');
            return;
        }
        setNewEmpData({ ...found.data, password: '' });
        if (setAddStep) {
            setAddStep(found.step || 1);
        }
        setActiveDraftId(found.id);
        setLastSavedAt(found.savedAt);
        setIsDrawerOpen(false);
        onResumeDraft?.();
        addNotification('info', `Resumed draft for "${found.title}" at Step ${found.step}`);
    }, [drafts, setNewEmpData, setAddStep, addNotification, onResumeDraft]);

    const handleDeleteDraft = useCallback((draftId: string) => {
        const found = drafts.find(d => d.id === draftId);
        deleteEmployeeDraft(draftId, countryCode);
        if (activeDraftId === draftId) {
            setActiveDraftId(null);
        }
        reloadDrafts();
        addNotification('info', `Draft "${found?.title || 'Candidate'}" deleted.`);
    }, [drafts, activeDraftId, countryCode, reloadDrafts, addNotification]);

    const handleStartNewCandidate = useCallback(() => {
        setActiveDraftId(null);
        setIsDrawerOpen(false);
        (onStartNewCandidate || resetWizard)();
        addNotification('info', 'Started onboarding a new candidate. Drafts remain safely saved.');
    }, [resetWizard, onStartNewCandidate, addNotification]);

    const handleFinalSubmitSuccess = useCallback(() => {
        skipNextCloseFlushRef.current = true;
        if (activeDraftId) {
            deleteEmployeeDraft(activeDraftId, countryCode);
            setActiveDraftId(null);
            reloadDrafts();
        }
    }, [activeDraftId, countryCode, reloadDrafts]);

    return {
        drafts,
        activeDraftId,
        setActiveDraftId,
        isDrawerOpen,
        setIsDrawerOpen,
        handleSaveDraft,
        handleResumeDraft,
        handleDeleteDraft,
        handleStartNewCandidate,
        handleFinalSubmitSuccess,
        reloadDrafts,
        isSavingDraft,
        draftSaveError,
        lastSavedAt
    };
}
