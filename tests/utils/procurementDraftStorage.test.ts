// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    listStoredPODrafts,
    getStoredPODraft,
    saveStoredPODraft,
    deleteStoredPODraft,
    clearAllStoredPODrafts,
    getDraftsStorageKey,
    type PODraftPayload
} from '../../utils/procurementDraftStorage';
import type { POItem } from '../../types';

describe('Multi-Purchase-Order Paused Drafts Storage', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        for (const key in mockStorage) {
            delete mockStorage[key];
        }

        vi.stubGlobal('localStorage', {
            getItem: (key: string) => mockStorage[key] || null,
            setItem: (key: string, value: string) => {
                mockStorage[key] = value;
            },
            removeItem: (key: string) => {
                delete mockStorage[key];
            },
            clear: () => {
                for (const key in mockStorage) {
                    delete mockStorage[key];
                }
            }
        });
    });

    const createPayload = (supplierName: string, items: POItem[] = []): PODraftPayload => ({
        isManualVendor: true,
        manualVendorName: supplierName,
        newPOSupplier: '',
        destinationSiteIds: ['wh-1'],
        expectedDate: '2026-11-10',
        tempReq: 'Ambient',
        shelfLife: '30 days',
        dockSlot: 'DOCK-1',
        poPriority: 'Normal',
        quantityDistribution: 'per-store',
        newPOItems: items,
        poNotes: `Draft for ${supplierName}`,
        paymentTerms: 'Net 30',
        incoterms: 'FOB',
        shippingCost: 0,
        discountRate: 0,
        taxRate: 0
    });

    const sampleItem: POItem = {
        productId: 'item-1',
        productName: 'Sunflower Cooking Oil 3L',
        quantity: 50,
        unitCost: 120,
        totalCost: 6000,
        packaging: { unit: 'Carton', sellableQty: 6 }
    };

    it('generates strictly country-scoped storage keys', () => {
        expect(getDraftsStorageKey('ET', 'u1')).toBe('siifmart_po_drafts_ET_u1');
        expect(getDraftsStorageKey('KE', 'u1')).toBe('siifmart_po_drafts_KE_u1');
    });

    it('allows a user to save and maintain multiple distinct paused drafts concurrently', () => {
        const draft1 = saveStoredPODraft({
            data: createPayload('Adama Agro-Industrial Enterprise', [sampleItem]),
            supplierNameOverride: 'Adama Agro-Industrial Enterprise',
            countryCode: 'ET',
            userId: 'buyer-01'
        });

        const draft2 = saveStoredPODraft({
            data: createPayload('SunGold Refining PLC', [
                { ...sampleItem, productName: 'SunGold Pure Oil 5L', totalCost: 15000 }
            ]),
            supplierNameOverride: 'SunGold Refining PLC',
            countryCode: 'ET',
            userId: 'buyer-01'
        });

        expect(draft1).toBeDefined();
        expect(draft2).toBeDefined();
        expect(draft1?.id).not.toBe(draft2?.id);

        const drafts = listStoredPODrafts('ET', 'buyer-01');
        expect(drafts.length).toBe(2);
        expect(drafts.map(d => d.meta.supplierDisplay)).toContain('Adama Agro-Industrial Enterprise');
        expect(drafts.map(d => d.meta.supplierDisplay)).toContain('SunGold Refining PLC');
    });

    it('updates an existing draft when id is provided without duplicating it', () => {
        const initial = saveStoredPODraft({
            data: createPayload('Adama Agro-Industrial Enterprise', [sampleItem]),
            countryCode: 'ET',
            userId: 'buyer-01'
        });

        expect(initial).not.toBeNull();
        const draftId = initial!.id;

        const updated = saveStoredPODraft({
            id: draftId,
            data: createPayload('Adama Agro-Industrial Enterprise', [
                sampleItem,
                { ...sampleItem, productId: 'item-2', productName: 'Flour 25kg', totalCost: 8000 }
            ]),
            countryCode: 'ET',
            userId: 'buyer-01'
        });

        expect(updated?.id).toBe(draftId);
        const drafts = listStoredPODrafts('ET', 'buyer-01');
        expect(drafts.length).toBe(1);
        expect(drafts[0].meta.itemCount).toBe(2);
        expect(drafts[0].meta.totalEstimatedAmount).toBe(14000);
    });

    it('deletes only the specified paused draft while keeping other drafts intact', () => {
        const draftA = saveStoredPODraft({
            data: createPayload('Vendor A', [sampleItem]),
            countryCode: 'ET',
            userId: 'buyer-01'
        })!;

        const draftB = saveStoredPODraft({
            data: createPayload('Vendor B', [sampleItem]),
            countryCode: 'ET',
            userId: 'buyer-01'
        })!;

        expect(listStoredPODrafts('ET', 'buyer-01').length).toBe(2);

        const deleteResult = deleteStoredPODraft(draftA.id, 'ET', 'buyer-01');
        expect(deleteResult).toBe(true);

        const remaining = listStoredPODrafts('ET', 'buyer-01');
        expect(remaining.length).toBe(1);
        expect(remaining[0].id).toBe(draftB.id);
    });

    it('isolates drafts strictly by country code', () => {
        saveStoredPODraft({
            data: createPayload('Ethiopian Coffee Exporters', [sampleItem]),
            countryCode: 'ET',
            userId: 'buyer-01'
        });

        saveStoredPODraft({
            data: createPayload('Nairobi Tea Farms', [sampleItem]),
            countryCode: 'KE',
            userId: 'buyer-01'
        });

        const draftsET = listStoredPODrafts('ET', 'buyer-01');
        const draftsKE = listStoredPODrafts('KE', 'buyer-01');

        expect(draftsET.length).toBe(1);
        expect(draftsET[0].meta.supplierDisplay).toBe('Ethiopian Coffee Exporters');

        expect(draftsKE.length).toBe(1);
        expect(draftsKE[0].meta.supplierDisplay).toBe('Nairobi Tea Farms');
    });

    it('migrates legacy single draft into the multi-draft store seamlessly', () => {
        const legacyKey = 'siifmart_po_draft_ET_buyer-01';
        mockStorage[legacyKey] = JSON.stringify({
            data: createPayload('Legacy Grain Suppliers', [sampleItem]),
            meta: {
                savedAt: '2026-10-25T10:00:00Z',
                itemCount: 1,
                supplierDisplay: 'Legacy Grain Suppliers'
            },
            countryCode: 'ET',
            userId: 'buyer-01'
        });

        const drafts = listStoredPODrafts('ET', 'buyer-01');
        expect(drafts.length).toBe(1);
        expect(drafts[0].id).toBe('legacy-draft-1');
        expect(drafts[0].meta.supplierDisplay).toBe('Legacy Grain Suppliers');
    });
});
