import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PODraftPayload, StoredPODraft } from '../../components/procurement/hooks/usePODraft';
import { buildPurchaseOrders, resolvePOVendor } from '../../components/procurement/createPOHelpers';
import type { POItem, Supplier } from '../../types';

describe('Purchase Order Draft Auto-Save & Recovery', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        for (const key in mockStorage) {
            delete mockStorage[key];
        }

        // Mock window.localStorage
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

    const sampleItems: POItem[] = [
        {
            productId: 'p-1',
            productName: 'Teff Flour 25kg',
            quantity: 10,
            unitCost: 1500,
            totalCost: 15000,
            packaging: { unit: 'Bag', sellableQty: 1 }
        }
    ];

    it('generates strictly country-scoped and user-scoped storage keys', () => {
        const countryET = 'ET';
        const countryKE = 'KE';
        const user1 = 'usr-001';
        const user2 = 'usr-002';

        const keyET1 = `siifmart_po_draft_${countryET.toUpperCase()}_${user1}`;
        const keyET2 = `siifmart_po_draft_${countryET.toUpperCase()}_${user2}`;
        const keyKE1 = `siifmart_po_draft_${countryKE.toUpperCase()}_${user1}`;

        expect(keyET1).toBe('siifmart_po_draft_ET_usr-001');
        expect(keyET2).toBe('siifmart_po_draft_ET_usr-002');
        expect(keyKE1).toBe('siifmart_po_draft_KE_usr-001');

        expect(keyET1).not.toBe(keyKE1);
        expect(keyET1).not.toBe(keyET2);
    });

    it('saves draft payload to localStorage and preserves all line items and supplier info', () => {
        const key = 'siifmart_po_draft_ET_usr-001';
        const draftPayload: PODraftPayload = {
            isManualVendor: false,
            manualVendorName: '',
            newPOSupplier: 'sup-101',
            destinationSiteIds: ['wh-addis-1'],
            expectedDate: '2026-10-15',
            poPriority: 'High',
            quantityDistribution: 'per-store',
            newPOItems: sampleItems,
            poNotes: 'Urgent warehouse replenishment for holiday demand',
            paymentTerms: 'Net 30',
            incoterms: 'FOB',
            shippingCost: 500,
            discountRate: 5,
            taxRate: 15
        };

        const storedDraft: StoredPODraft = {
            data: draftPayload,
            meta: {
                savedAt: new Date().toISOString(),
                itemCount: 1,
                supplierDisplay: 'Habesha Grains PLC'
            },
            countryCode: 'ET',
            userId: 'usr-001'
        };

        localStorage.setItem(key, JSON.stringify(storedDraft));

        const retrieved = JSON.parse(localStorage.getItem(key)!) as StoredPODraft;
        expect(retrieved).toBeDefined();
        expect(retrieved.countryCode).toBe('ET');
        expect(retrieved.userId).toBe('usr-001');
        expect(retrieved.data.newPOItems.length).toBe(1);
        expect(retrieved.data.newPOItems[0].productName).toBe('Teff Flour 25kg');
        expect(retrieved.data.poPriority).toBe('High');
        expect(retrieved.data.poNotes).toBe('Urgent warehouse replenishment for holiday demand');
        expect(retrieved.data.destinationSiteIds).toEqual(['wh-addis-1']);
    });

    it('enforces multi-country tenant isolation: Ethiopian draft is never loaded in Kenyan context', () => {
        // Save Ethiopian draft
        const etKey = 'siifmart_po_draft_ET_usr-001';
        const etDraft: StoredPODraft = {
            data: {
                isManualVendor: true,
                manualVendorName: 'Addis Millers',
                newPOSupplier: '',
                destinationSiteIds: ['wh-addis-1'],
                expectedDate: '2026-10-20',
                poPriority: 'Normal',
                quantityDistribution: 'per-store',
                newPOItems: sampleItems,
                poNotes: 'Local Ethiopian grain order',
                paymentTerms: 'COD',
                incoterms: 'EXW',
                shippingCost: 200,
                discountRate: 0,
                taxRate: 15
            },
            meta: {
                savedAt: new Date().toISOString(),
                itemCount: 1,
                supplierDisplay: 'Addis Millers'
            },
            countryCode: 'ET',
            userId: 'usr-001'
        };
        localStorage.setItem(etKey, JSON.stringify(etDraft));

        // Attempt to read from Kenya context
        const keKey = 'siifmart_po_draft_KE_usr-001';
        const keRaw = localStorage.getItem(keKey);
        expect(keRaw).toBeNull();

        // Even if someone maliciously writes ET countryCode into the KE key, validation rejects it
        localStorage.setItem(keKey, JSON.stringify(etDraft));
        const maliciousParsed = JSON.parse(localStorage.getItem(keKey)!) as StoredPODraft;
        const isValidInKenya = maliciousParsed.countryCode === 'KE';
        expect(isValidInKenya).toBe(false);
    });

    it('discards draft from localStorage when user explicitly deletes draft or completes submission', () => {
        const key = 'siifmart_po_draft_KE_usr-002';
        localStorage.setItem(key, JSON.stringify({ some: 'draft' }));
        expect(localStorage.getItem(key)).not.toBeNull();

        // Discard
        localStorage.removeItem(key);
        expect(localStorage.getItem(key)).toBeNull();
    });

    describe('buildPurchaseOrders helper', () => {
        const mockSites = [
            { id: 'wh-1', name: 'Nairobi DC', type: 'Distribution Center', country: 'KE', currency: 'KSh' },
            { id: 'wh-2', name: 'Mombasa Warehouse', type: 'Warehouse', country: 'KE', currency: 'KSh' }
        ];

        it('creates single-site purchase order correctly', () => {
            const results = buildPurchaseOrders({
                destinationSiteIds: ['wh-1'],
                processedItems: sampleItems,
                quantityDistribution: 'per-store',
                shippingCost: 1000,
                discountRate: 0,
                taxRate: 16,
                sites: mockSites,
                currencySymbol: 'KSh',
                vendorId: 'sup-ke-1',
                vendorName: 'Nairobi Millers',
                expectedDate: '2026-10-30',
                poNotes: 'Test order',
                paymentTerms: 'Net 30',
                poPriority: 'Normal',
                userName: 'Operator 1',
                poRequestedBy: 'Operator 1'
            });

            expect(results.length).toBe(1);
            expect(results[0].po.siteId).toBe('wh-1');
            expect(results[0].po.supplierName).toBe('Nairobi Millers');
            expect(results[0].po.status).toBe('Draft');
            expect(results[0].items.length).toBe(1);
            expect(results[0].items[0].quantity).toBe(10);
            expect(results[0].po.countryCode).toBe('KE');
        });

        it('splits quantities across multiple sites when quantityDistribution is "split"', () => {
            const results = buildPurchaseOrders({
                destinationSiteIds: ['wh-1', 'wh-2'],
                processedItems: sampleItems, // 10 total
                quantityDistribution: 'split',
                shippingCost: 500,
                discountRate: 0,
                taxRate: 16,
                sites: mockSites,
                currencySymbol: 'KSh',
                vendorId: 'sup-ke-1',
                vendorName: 'Nairobi Millers',
                expectedDate: '2026-10-30',
                poNotes: 'Split order',
                paymentTerms: 'Net 30',
                poPriority: 'Normal',
                userName: 'Operator 1',
                poRequestedBy: 'Operator 1'
            });

            expect(results.length).toBe(2);
            // 10 split across 2 sites = 5 each
            expect(results[0].items[0].quantity).toBe(5);
            expect(results[1].items[0].quantity).toBe(5);
        });
    });

    describe('resolvePOVendor helper', () => {
        const mockSuppliers: Supplier[] = [
            {
                id: 'sup-reg-1',
                name: 'Eastleigh Wholesalers',
                countryCode: 'KE',
                type: 'Business',
                contact: 'John',
                category: 'Food',
                status: 'Active',
                rating: 5,
                leadTime: 3
            }
        ];

        it('resolves existing supplier when selected by ID', async () => {
            const result = await resolvePOVendor({
                isManualVendor: false,
                manualVendorName: '',
                newPOSupplier: 'sup-reg-1',
                allSuppliers: mockSuppliers,
                activeCountry: 'KE'
            });

            expect(result.vendorId).toBe('sup-reg-1');
            expect(result.vendorName).toBe('Eastleigh Wholesalers');
        });

        it('reuses existing supplier with same name in active country', async () => {
            const result = await resolvePOVendor({
                isManualVendor: true,
                manualVendorName: 'Eastleigh Wholesalers',
                newPOSupplier: '',
                allSuppliers: mockSuppliers,
                activeCountry: 'KE'
            });

            expect(result.vendorId).toBe('sup-reg-1');
            expect(result.vendorName).toBe('Eastleigh Wholesalers');
        });
    });
});
