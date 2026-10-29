import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    generateCountryScopedReceiptNumber,
    extractReceiptSequence,
    parseReceiptNumber,
    extractMaxReceiptSequence,
    resetReceiptSequenceCache
} from '../../utils/receiptNumberGenerator';
import type { Site, SaleRecord } from '../../types';

describe('Country-Scoped Receipt Number & Sequence Generator', () => {
    beforeEach(() => {
        resetReceiptSequenceCache();
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    const mockKenyaSite: Site = {
        id: 'site-kenya-1',
        code: 'KE-001',
        name: 'Nairobi Flagship Hub',
        type: 'Store',
        country: 'KE',
        currency: 'KES',
        address: 'Nairobi',
        status: 'Active',
        siteNumber: 1
    };

    const mockEthiopiaSite1: Site = {
        id: 'site-ethiopia-1',
        code: 'SITE-0001',
        name: 'Bole Central Market',
        type: 'Store',
        country: 'ET',
        currency: 'ETB',
        address: 'Addis Ababa',
        status: 'Active',
        siteNumber: 1
    };

    const mockEthiopiaSite5: Site = {
        id: 'site-ethiopia-5',
        code: 'SITE-0005',
        name: 'Bole Supermarket',
        type: 'Store',
        country: 'ET',
        currency: 'ETB',
        address: 'Addis Ababa',
        status: 'Active',
        siteNumber: 5
    };

    it('generates sequential receipt number with KE prefix for Kenyan store', () => {
        const receipt1 = generateCountryScopedReceiptNumber({ activeSite: mockKenyaSite });
        expect(receipt1).toBe('KE-1000001');

        const receipt2 = generateCountryScopedReceiptNumber({ activeSite: mockKenyaSite });
        expect(receipt2).toBe('KE-1000002');
    });

    it('generates sequential receipt number with ET prefix for Ethiopian store', () => {
        const receipt1 = generateCountryScopedReceiptNumber({ activeSite: mockEthiopiaSite1 });
        expect(receipt1).toBe('ET-1000001');

        const receipt2 = generateCountryScopedReceiptNumber({ activeSite: mockEthiopiaSite1 });
        expect(receipt2).toBe('ET-1000002');
    });

    it('encodes site number in receipt number for different sites', () => {
        const receipt5 = generateCountryScopedReceiptNumber({ activeSite: mockEthiopiaSite5 });
        expect(receipt5).toBe('ET-5000001');
    });

    it('strictly isolates Kenya and Ethiopia sequences without cross-border bleed', () => {
        const ke1 = generateCountryScopedReceiptNumber({ activeSite: mockKenyaSite });
        const et1 = generateCountryScopedReceiptNumber({ activeSite: mockEthiopiaSite1 });
        const ke2 = generateCountryScopedReceiptNumber({ activeSite: mockKenyaSite });

        expect(ke1).toBe('KE-1000001');
        expect(et1).toBe('ET-1000001');
        expect(ke2).toBe('KE-1000002');
    });

    it('increments based on existing sales history', () => {
        const mockSales: SaleRecord[] = [
            {
                id: 'sale-1',
                siteId: 'site-kenya-1',
                receiptNumber: 'KE-1000005',
                date: '2026-10-30T00:00:00Z',
                items: [],
                subtotal: 1000,
                tax: 0,
                total: 1000,
                method: 'Cash',
                status: 'Completed'
            },
            {
                id: 'sale-2',
                siteId: 'site-kenya-1',
                receiptNumber: 'KE-1000006',
                date: '2026-10-30T01:00:00Z',
                items: [],
                subtotal: 2000,
                tax: 0,
                total: 2000,
                method: 'Cash',
                status: 'Completed'
            }
        ];

        const nextReceipt = generateCountryScopedReceiptNumber({
            activeSite: mockKenyaSite,
            sales: mockSales
        });
        expect(nextReceipt).toBe('KE-1000007');
    });

    it('parses sequence from legacy Ethiopian formats', () => {
        expect(extractReceiptSequence('113300004', 'ET', 1)).toBe(4);
        expect(extractReceiptSequence('63300002', 'ET', 6)).toBe(2);
        expect(extractReceiptSequence('TX-ETH-001', 'ET')).toBe(1);
        expect(extractReceiptSequence('TX-KE-001', 'KE')).toBe(1);
    });

    it('parses modern and legacy receipt numbers with parseReceiptNumber', () => {
        const parsedModern = parseReceiptNumber('KE-1000001');
        expect(parsedModern).toEqual({
            country: 'KE',
            siteNumber: 1,
            sequence: 1,
            raw: 'KE-1000001',
            isLegacy: false
        });

        const parsedLegacy = parseReceiptNumber('113300004');
        expect(parsedLegacy).toEqual({
            country: 'ET',
            siteNumber: 1,
            sequence: 4,
            raw: '113300004',
            isLegacy: true
        });
    });

    it('extracts maximum sequence correctly from mixed sales records', () => {
        const sales: SaleRecord[] = [
            { id: '1', siteId: 's1', receiptNumber: 'KE-1000001', date: '', items: [], subtotal: 0, tax: 0, total: 0, method: 'Cash', status: 'Completed' },
            { id: '2', siteId: 's1', receiptNumber: 'KE-1000045', date: '', items: [], subtotal: 0, tax: 0, total: 0, method: 'Cash', status: 'Completed' },
            { id: '3', siteId: 's1', receiptNumber: 'ET-1000099', date: '', items: [], subtotal: 0, tax: 0, total: 0, method: 'Cash', status: 'Completed' }
        ];

        // Should only consider KE sales when target is KE
        expect(extractMaxReceiptSequence(sales, 'KE', 1)).toBe(45);
        // Should only consider ET sales when target is ET
        expect(extractMaxReceiptSequence(sales, 'ET', 1)).toBe(99);
    });
});
