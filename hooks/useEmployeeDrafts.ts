import { useState, useEffect, useCallback } from 'react';
import { EmployeeDraft, getEmployeeDrafts, saveEmployeeDraft, deleteEmployeeDraft } from '../utils/employeeDrafts';
import { NewEmployeeFormData } from './useEmployeeWizard';

interface UseEmployeeDraftsProps {
    countryCode?: string;
    sites?: any[];
    newEmpData: NewEmployeeFormData;
    setNewEmpData: (data: any) => void;
    addStep: number;
    setAddStep?: (step: number) => void;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    resetWizard: () => void;
}

export function useEmployeeDrafts({
    countryCode,
    sites = [],
    newEmpData,
    setNewEmpData,
    addStep,
    setAddStep,
    addNotification,
    resetWizard
}: UseEmployeeDraftsProps) {
    const [drafts, setDrafts] = useState<EmployeeDraft[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const reloadDrafts = useCallback(() => {
        setDrafts(getEmployeeDrafts(countryCode));
    }, [countryCode]);

    useEffect(() => {
        reloadDrafts();
    }, [reloadDrafts]);

    const handleSaveDraft = useCallback(() => {
        const assignedSite = sites.find(s => s.id === newEmpData.siteId);
        const draft = saveEmployeeDraft(
            newEmpData,
            addStep,
            activeDraftId,
            countryCode,
            assignedSite?.name
        );
        setActiveDraftId(draft.id);
        reloadDrafts();
        addNotification('success', `Draft saved: "${draft.title}" (Step ${addStep})`);
        return draft;
    }, [newEmpData, addStep, activeDraftId, countryCode, sites, reloadDrafts, addNotification]);

    const handleResumeDraft = useCallback((draftId: string) => {
        const found = drafts.find(d => d.id === draftId);
        if (!found) {
            addNotification('alert', 'Draft not found or has been removed.');
            return;
        }
        setNewEmpData({ ...found.data });
        if (setAddStep) {
            setAddStep(found.step || 1);
        }
        setActiveDraftId(found.id);
        setIsDrawerOpen(false);
        addNotification('info', `Resumed draft for "${found.title}" at Step ${found.step}`);
    }, [drafts, setNewEmpData, setAddStep, addNotification]);

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
        resetWizard();
        addNotification('info', 'Started onboarding a new candidate. Drafts remain safely saved.');
    }, [resetWizard, addNotification]);

    const handleFinalSubmitSuccess = useCallback(() => {
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
        reloadDrafts
    };
}
