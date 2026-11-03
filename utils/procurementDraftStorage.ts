import type { POItem } from '../types';
import type { POItemFormDraft } from '../components/procurement/POItemForm';
import { purchaseAmount } from './productCosts';
import { logger } from './logger';

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
    id?: string;
    savedAt: string;
    itemCount: number;
    itemInProgress?: boolean;
    supplierDisplay: string;
    destinationDisplay?: string;
    totalEstimatedAmount?: number;
    currency?: string;
}

export interface StoredPODraft {
    id: string;
    data: PODraftPayload;
    meta: PODraftMeta;
    countryCode: string;
    userId: string;
    updatedAt: string;
}

export const PO_DRAFTS_UPDATED_EVENT = 'siifmart:po_drafts_updated';
const MAX_STORED_DRAFTS = 20;

export function getDraftsStorageKey(countryCode: string, userId?: string): string {
    const cc = (countryCode || 'ET').toUpperCase();
    const uid = userId || 'default';
    return `siifmart_po_drafts_${cc}_${uid}`;
}

export function getLegacyDraftStorageKey(countryCode: string, userId?: string): string {
    const cc = (countryCode || 'ET').toUpperCase();
    const uid = userId || 'default';
    return `siifmart_po_draft_${cc}_${uid}`;
}

function notifyDraftsUpdated(countryCode: string, userId?: string) {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new CustomEvent(PO_DRAFTS_UPDATED_EVENT, {
            detail: { countryCode: (countryCode || 'ET').toUpperCase(), userId: userId || 'default' }
        }));
    } catch {
        // Safe fallback in restricted environments
    }
}

export function computeDraftEstimatedTotal(payload: PODraftPayload): number {
    const items = payload.newPOItems || [];
    const subtotal = items.reduce((sum, item) => sum + (item.totalCost || (item.quantity * item.unitCost)), 0);
    const discount = subtotal * ((payload.discountRate || 0) / 100);
    const tax = subtotal * ((payload.taxRate || 0) / 100);
    const shipping = payload.shippingCost || 0;
    return purchaseAmount(subtotal - discount + tax + shipping);
}

export function listStoredPODrafts(countryCode: string, userId?: string): StoredPODraft[] {
    if (typeof window === 'undefined') return [];
    const normalizedCountry = (countryCode || 'ET').toUpperCase();
    const key = getDraftsStorageKey(normalizedCountry, userId);
    const legacyKey = getLegacyDraftStorageKey(normalizedCountry, userId);

    let drafts: StoredPODraft[] = [];

    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                drafts = parsed.filter(d => d && d.countryCode === normalizedCountry && d.id);
            }
        }
    } catch (err) {
        logger.warn('procurementDraftStorage', 'Failed reading multi-drafts from localStorage', { error: String(err) });
    }

    // Check and migrate legacy single draft if not already in drafts
    try {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
            const legacyParsed = JSON.parse(legacyRaw);
            if (legacyParsed?.data && legacyParsed.countryCode === normalizedCountry) {
                const legacyId = 'legacy-draft-1';
                const alreadyMigrated = drafts.some(d => d.id === legacyId);
                if (!alreadyMigrated) {
                    const migrated: StoredPODraft = {
                        id: legacyId,
                        data: legacyParsed.data,
                        meta: {
                            id: legacyId,
                            savedAt: legacyParsed.meta?.savedAt || new Date().toISOString(),
                            itemCount: legacyParsed.meta?.itemCount || legacyParsed.data.newPOItems?.length || 0,
                            itemInProgress: Boolean(legacyParsed.meta?.itemInProgress),
                            supplierDisplay: legacyParsed.meta?.supplierDisplay || 'Saved Supplier',
                            totalEstimatedAmount: computeDraftEstimatedTotal(legacyParsed.data),
                            currency: normalizedCountry === 'KE' ? 'KES' : 'ETB'
                        },
                        countryCode: normalizedCountry,
                        userId: userId || 'default',
                        updatedAt: legacyParsed.meta?.savedAt || new Date().toISOString()
                    };
                    drafts.unshift(migrated);
                    localStorage.setItem(key, JSON.stringify(drafts));
                }
            }
        }
    } catch (err) {
        logger.warn('procurementDraftStorage', 'Failed migrating legacy draft', { error: String(err) });
    }

    return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getStoredPODraft(id: string, countryCode: string, userId?: string): StoredPODraft | null {
    if (!id) return null;
    const drafts = listStoredPODrafts(countryCode, userId);
    return drafts.find(d => d.id === id) || null;
}

export interface SaveStoredPODraftParams {
    id?: string;
    data: PODraftPayload;
    supplierNameOverride?: string;
    destinationNameOverride?: string;
    countryCode: string;
    userId?: string;
    currency?: string;
    force?: boolean;
}

export function saveStoredPODraft({
    id,
    data,
    supplierNameOverride,
    destinationNameOverride,
    countryCode,
    userId,
    currency,
    force = false
}: SaveStoredPODraftParams): StoredPODraft | null {
    if (typeof window === 'undefined') return null;

    const hasContent = force ||
        Boolean(data.itemForm) ||
        (data.newPOItems && data.newPOItems.length > 0) ||
        Boolean(data.newPOSupplier) ||
        Boolean(data.manualVendorName?.trim()) ||
        Boolean(data.poNotes?.trim()) ||
        Boolean(data.expectedDate);

    const normalizedCountry = (countryCode || 'ET').toUpperCase();
    const key = getDraftsStorageKey(normalizedCountry, userId);
    const existingDrafts = listStoredPODrafts(normalizedCountry, userId);
    const draftId = id || crypto.randomUUID();

    if (!hasContent) {
        if (id) {
            deleteStoredPODraft(id, normalizedCountry, userId);
        }
        return null;
    }

    try {
        const supplierDisplay = supplierNameOverride ||
            (data.isManualVendor
                ? (data.manualVendorName?.trim() || 'Manual Supplier')
                : (data.newPOSupplier ? 'Registered Supplier' : 'Unspecified Supplier'));

        const now = new Date().toISOString();
        const meta: PODraftMeta = {
            id: draftId,
            savedAt: now,
            itemCount: data.newPOItems?.length || 0,
            itemInProgress: Boolean(data.itemForm),
            supplierDisplay,
            destinationDisplay: destinationNameOverride,
            totalEstimatedAmount: computeDraftEstimatedTotal(data),
            currency: currency || (normalizedCountry === 'KE' ? 'KES' : 'ETB')
        };

        const newOrUpdated: StoredPODraft = {
            id: draftId,
            data,
            meta,
            countryCode: normalizedCountry,
            userId: userId || 'default',
            updatedAt: now
        };

        const remaining = existingDrafts.filter(d => d.id !== draftId);
        const updatedList = [newOrUpdated, ...remaining].slice(0, MAX_STORED_DRAFTS);

        localStorage.setItem(key, JSON.stringify(updatedList));
        notifyDraftsUpdated(normalizedCountry, userId);
        return newOrUpdated;
    } catch (err) {
        logger.warn('procurementDraftStorage', 'Failed saving draft to localStorage', { error: String(err) });
        return null;
    }
}

export function deleteStoredPODraft(id: string, countryCode: string, userId?: string): boolean {
    if (typeof window === 'undefined' || !id) return false;
    const normalizedCountry = (countryCode || 'ET').toUpperCase();
    const key = getDraftsStorageKey(normalizedCountry, userId);
    const legacyKey = getLegacyDraftStorageKey(normalizedCountry, userId);

    try {
        const existingDrafts = listStoredPODrafts(normalizedCountry, userId);
        const updatedList = existingDrafts.filter(d => d.id !== id);
        localStorage.setItem(key, JSON.stringify(updatedList));

        // Also clean up legacy key if legacy was deleted or no drafts remain
        if (id === 'legacy-draft-1' || updatedList.length === 0) {
            try { localStorage.removeItem(legacyKey); } catch { /* ignore */ }
        }

        notifyDraftsUpdated(normalizedCountry, userId);
        return true;
    } catch (err) {
        logger.warn('procurementDraftStorage', 'Failed removing draft from localStorage', { error: String(err) });
        return false;
    }
}

export function clearAllStoredPODrafts(countryCode: string, userId?: string): void {
    if (typeof window === 'undefined') return;
    const normalizedCountry = (countryCode || 'ET').toUpperCase();
    const key = getDraftsStorageKey(normalizedCountry, userId);
    const legacyKey = getLegacyDraftStorageKey(normalizedCountry, userId);

    try {
        localStorage.removeItem(key);
        localStorage.removeItem(legacyKey);
        notifyDraftsUpdated(normalizedCountry, userId);
    } catch (err) {
        logger.warn('procurementDraftStorage', 'Failed clearing all drafts from localStorage', { error: String(err) });
    }
}
