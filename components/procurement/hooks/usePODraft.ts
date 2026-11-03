import { useState, useEffect, useCallback, useRef } from 'react';
import {
    listStoredPODrafts,
    getStoredPODraft,
    saveStoredPODraft,
    deleteStoredPODraft,
    type PODraftPayload,
    type PODraftMeta,
    type StoredPODraft
} from '../../../utils/procurementDraftStorage';

export type { PODraftPayload, PODraftMeta, StoredPODraft };

interface UsePODraftOptions {
    countryCode: string;
    userId?: string;
    enabled?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    activeDraftId?: string | null;
}

export function usePODraft({
    countryCode,
    userId,
    enabled = true,
    isEditMode = false,
    isOpen,
    activeDraftId = null
}: UsePODraftOptions) {
    const [hasDraft, setHasDraft] = useState(false);
    const [draftMeta, setDraftMeta] = useState<PODraftMeta | null>(null);
    const [isRestoredBannerVisible, setIsRestoredBannerVisible] = useState(false);
    const currentDraftIdRef = useRef<string | null>(activeDraftId || null);

    useEffect(() => {
        if (activeDraftId) {
            currentDraftIdRef.current = activeDraftId;
        } else if (!currentDraftIdRef.current) {
            currentDraftIdRef.current = crypto.randomUUID();
        }
    }, [activeDraftId]);

    const readStoredDraft = useCallback((): StoredPODraft | null => {
        if (typeof window === 'undefined' || isEditMode) return null;
        if (currentDraftIdRef.current) {
            const draft = getStoredPODraft(currentDraftIdRef.current, countryCode, userId);
            if (draft) return draft;
        }
        // If resuming a draft or finding newest draft
        const drafts = listStoredPODrafts(countryCode, userId);
        return drafts[0] || null;
    }, [isEditMode, countryCode, userId]);

    const discardDraft = useCallback((specificId?: string) => {
        if (typeof window === 'undefined') return;
        const targetId = specificId || currentDraftIdRef.current;
        if (targetId) {
            deleteStoredPODraft(targetId, countryCode, userId);
        }
        setHasDraft(false);
        setDraftMeta(null);
        setIsRestoredBannerVisible(false);
        currentDraftIdRef.current = crypto.randomUUID();
    }, [countryCode, userId]);

    const saveDraft = useCallback((
        payload: PODraftPayload,
        supplierNameOverride?: string,
        force = false
    ): 'saved' | 'empty' | 'failed' => {
        if (typeof window === 'undefined' || isEditMode) return 'failed';
        if (!enabled && !force) return 'empty';

        const targetId = currentDraftIdRef.current || crypto.randomUUID();
        currentDraftIdRef.current = targetId;

        const saved = saveStoredPODraft({
            id: targetId,
            data: payload,
            supplierNameOverride,
            countryCode,
            userId,
            force
        });

        if (saved) {
            setHasDraft(true);
            setDraftMeta(saved.meta);
            return 'saved';
        }

        setHasDraft(false);
        setDraftMeta(null);
        return 'empty';
    }, [enabled, isEditMode, countryCode, userId]);

    // Check for draft when modal opens
    useEffect(() => {
        if (isOpen && !isEditMode) {
            const stored = readStoredDraft();
            if (stored && activeDraftId) {
                // If explicitly resumed
                setHasDraft(true);
                setDraftMeta(stored.meta);
                setIsRestoredBannerVisible(true);
            } else {
                setIsRestoredBannerVisible(false);
            }
        } else if (!isOpen) {
            setIsRestoredBannerVisible(false);
            if (!activeDraftId) {
                currentDraftIdRef.current = null;
            }
        }
    }, [isOpen, isEditMode, activeDraftId, readStoredDraft]);

    const dismissBanner = useCallback(() => {
        setIsRestoredBannerVisible(false);
    }, []);

    return {
        hasDraft,
        draftMeta,
        isRestoredBannerVisible,
        dismissBanner,
        saveDraft,
        readStoredDraft,
        discardDraft,
        currentDraftId: currentDraftIdRef.current
    };
}
