import { useState, useEffect, useCallback, useRef } from 'react';
import { POItem } from '../../../types';
import { logger } from '../../../utils/logger';

export interface PODraftPayload {
    isManualVendor: boolean;
    manualVendorName: string;
    newPOSupplier: string;
    destinationSiteIds: string[];
    expectedDate: string;
    tempReq: 'Ambient' | 'Chilled' | 'Frozen';
    shelfLife: string;
    dockSlot: string;
    poPriority: 'Normal' | 'High' | 'Urgent' | 'Low';
    quantityDistribution: string;
    newPOItems: POItem[];
    poNotes: string;
    paymentTerms: string;
    incoterms: string;
    shippingCost: number;
    discountRate: number;
    taxRate: number;
}

export interface PODraftMeta {
    savedAt: string;
    itemCount: number;
    supplierDisplay: string;
}

export interface StoredPODraft {
    data: PODraftPayload;
    meta: PODraftMeta;
    countryCode: string;
    userId: string;
}

interface UsePODraftOptions {
    countryCode: string;
    userId?: string;
    enabled?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
}

export function usePODraft({
    countryCode,
    userId,
    enabled = true,
    isEditMode = false,
    isOpen
}: UsePODraftOptions) {
    const [hasDraft, setHasDraft] = useState(false);
    const [draftMeta, setDraftMeta] = useState<PODraftMeta | null>(null);
    const [isRestoredBannerVisible, setIsRestoredBannerVisible] = useState(false);

    const storageKey = `siifmart_po_draft_${(countryCode || 'ET').toUpperCase()}_${userId || 'default'}`;

    const readStoredDraft = useCallback((): StoredPODraft | null => {
        if (typeof window === 'undefined' || !enabled || isEditMode) return null;
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as StoredPODraft;
            if (!parsed?.data || parsed.countryCode !== (countryCode || 'ET').toUpperCase()) {
                return null;
            }
            return parsed;
        } catch (err) {
            logger.warn('usePODraft', 'Failed reading PO draft from localStorage', { error: String(err) });
            return null;
        }
    }, [storageKey, enabled, isEditMode, countryCode]);

    const discardDraft = useCallback(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(storageKey);
            setHasDraft(false);
            setDraftMeta(null);
            setIsRestoredBannerVisible(false);
            logger.info('usePODraft', `Draft purged for key ${storageKey}`);
        } catch (err) {
            logger.warn('usePODraft', 'Failed removing PO draft from localStorage', { error: String(err) });
        }
    }, [storageKey]);

    const saveDraft = useCallback((payload: PODraftPayload, supplierNameOverride?: string) => {
        if (typeof window === 'undefined' || !enabled || isEditMode) return;

        const hasContent =
            (payload.newPOItems && payload.newPOItems.length > 0) ||
            Boolean(payload.newPOSupplier) ||
            Boolean(payload.manualVendorName?.trim()) ||
            Boolean(payload.poNotes?.trim()) ||
            Boolean(payload.expectedDate);

        if (!hasContent) {
            discardDraft();
            return;
        }

        try {
            const supplierDisplay =
                supplierNameOverride ||
                (payload.isManualVendor
                    ? (payload.manualVendorName || 'Manual Supplier')
                    : (payload.newPOSupplier ? 'Registered Supplier' : 'Unspecified'));

            const meta: PODraftMeta = {
                savedAt: new Date().toISOString(),
                itemCount: payload.newPOItems?.length || 0,
                supplierDisplay
            };

            const draftToStore: StoredPODraft = {
                data: payload,
                meta,
                countryCode: (countryCode || 'ET').toUpperCase(),
                userId: userId || 'default'
            };

            localStorage.setItem(storageKey, JSON.stringify(draftToStore));
            setHasDraft(true);
            setDraftMeta(meta);
        } catch (err) {
            logger.warn('usePODraft', 'Failed saving PO draft to localStorage', { error: String(err) });
        }
    }, [storageKey, enabled, isEditMode, countryCode, userId, discardDraft]);

    // Check for draft when modal opens
    useEffect(() => {
        if (isOpen && !isEditMode && enabled) {
            const stored = readStoredDraft();
            if (stored) {
                setHasDraft(true);
                setDraftMeta(stored.meta);
                setIsRestoredBannerVisible(true);
            } else {
                setHasDraft(false);
                setDraftMeta(null);
                setIsRestoredBannerVisible(false);
            }
        } else if (!isOpen) {
            setIsRestoredBannerVisible(false);
        }
    }, [isOpen, isEditMode, enabled, readStoredDraft]);

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
        discardDraft
    };
}
