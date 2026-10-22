import { useState, useEffect, useCallback, useRef } from 'react';
import { POItem } from '../../../types';
import type { POItemFormDraft } from '../POItemForm';
import { logger } from '../../../utils/logger';

export interface PODraftPayload {
    itemForm?: POItemFormDraft | null;
    editingItemIndex?: number | null;
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
    itemInProgress?: boolean;
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
        if (typeof window === 'undefined' || isEditMode) return null;
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
    }, [storageKey, isEditMode, countryCode]);

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

    const saveDraft = useCallback((payload: PODraftPayload, supplierNameOverride?: string, force = false): 'saved' | 'empty' | 'failed' => {
        if (typeof window === 'undefined' || isEditMode) return 'failed';
        if (!enabled && !force) return 'empty';

        const hasContent = force || Boolean(payload.itemForm) ||
            (payload.newPOItems && payload.newPOItems.length > 0) ||
            Boolean(payload.newPOSupplier) ||
            Boolean(payload.manualVendorName?.trim()) ||
            Boolean(payload.poNotes?.trim()) ||
            Boolean(payload.expectedDate);

        if (!hasContent) {
            discardDraft();
            return 'empty';
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
                itemInProgress: Boolean(payload.itemForm),
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
            return 'saved';
        } catch (err) {
            logger.warn('usePODraft', 'Failed saving PO draft to localStorage', { error: String(err) });
            return 'failed';
        }
    }, [storageKey, enabled, isEditMode, countryCode, userId, discardDraft]);

    // Check for draft when modal opens
    useEffect(() => {
        if (isOpen && !isEditMode) {
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
    }, [isOpen, isEditMode, readStoredDraft]);

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
