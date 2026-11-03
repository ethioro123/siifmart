import { useState, useEffect, useCallback } from 'react';
import {
    listStoredPODrafts,
    deleteStoredPODraft,
    clearAllStoredPODrafts,
    PO_DRAFTS_UPDATED_EVENT,
    type StoredPODraft
} from '../../../utils/procurementDraftStorage';

interface UsePausedPODraftsOptions {
    countryCode: string;
    userId?: string;
}

export function usePausedPODrafts({ countryCode, userId }: UsePausedPODraftsOptions) {
    const [drafts, setDrafts] = useState<StoredPODraft[]>(() => listStoredPODrafts(countryCode, userId));

    const refresh = useCallback(() => {
        setDrafts(listStoredPODrafts(countryCode, userId));
    }, [countryCode, userId]);

    useEffect(() => {
        refresh();

        const handleDraftsUpdated = () => {
            refresh();
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key?.startsWith('siifmart_po_draft')) {
                refresh();
            }
        };

        window.addEventListener(PO_DRAFTS_UPDATED_EVENT, handleDraftsUpdated);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(PO_DRAFTS_UPDATED_EVENT, handleDraftsUpdated);
            window.removeEventListener('storage', handleStorage);
        };
    }, [refresh]);

    const deleteDraft = useCallback((draftId: string) => {
        deleteStoredPODraft(draftId, countryCode, userId);
        refresh();
    }, [countryCode, userId, refresh]);

    const clearAll = useCallback(() => {
        clearAllStoredPODrafts(countryCode, userId);
        refresh();
    }, [countryCode, userId, refresh]);

    return {
        drafts,
        draftsCount: drafts.length,
        deleteDraft,
        clearAll,
        refresh
    };
}
