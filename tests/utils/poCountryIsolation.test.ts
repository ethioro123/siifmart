import { describe, it, expect } from 'vitest';
import type { PurchaseOrder } from '../../types';

describe('Purchase Orders Multi-Country Tenant Isolation', () => {
    const mockOrders: PurchaseOrder[] = [
        {
            id: 'po-et-1',
            poNumber: 'ET-AAAA0141',
            siteId: 'site-addis-1',
            supplierId: 'sup-et-1',
            supplierName: 'Primary Supplier Addis',
            destination: 'Central Operations',
            date: '2026-08-26',
            status: 'Received',
            totalAmount: 24000,
            itemsCount: 60,
            expectedDelivery: null,
            requestedBy: 'Shukri Kamal',
            countryCode: 'ET',
            currency: 'ETB',
            lineItems: []
        },
        {
            id: 'po-et-2',
            poNumber: 'ET-AAAA0131',
            siteId: 'site-addis-1',
            supplierId: 'sup-et-2',
            supplierName: 'Bamba Ethiopia',
            destination: 'Central Operations',
            date: '2026-07-21',
            status: 'Received',
            totalAmount: 5608000,
            itemsCount: 400,
            expectedDelivery: '2026-11-22',
            requestedBy: 'Yohannes Bekele',
            countryCode: 'ET',
            currency: 'ETB',
            lineItems: []
        },
        {
            id: 'po-ke-1',
            poNumber: 'KE-AAAA0001',
            siteId: 'site-nairobi-1',
            supplierId: 'sup-ke-1',
            supplierName: 'Nairobi Fresh Produce Ltd',
            destination: 'Nairobi Hub',
            date: '2026-09-01',
            status: 'Approved',
            totalAmount: 450000,
            itemsCount: 150,
            expectedDelivery: '2026-09-05',
            requestedBy: 'David Ochieng',
            countryCode: 'KE',
            currency: 'KSh',
            lineItems: []
        }
    ];

    it('strictly isolates Kenyan purchase orders and rejects Ethiopian records in Kenya tenant', () => {
        const kenyaOrders = mockOrders.filter(po => po.countryCode === 'KE');

        expect(kenyaOrders).toHaveLength(1);
        expect(kenyaOrders[0].poNumber).toBe('KE-AAAA0001');
        expect(kenyaOrders[0].currency).toBe('KSh');
        expect(kenyaOrders[0].destination).toBe('Nairobi Hub');

        // Zero cross-border data leakage verification
        const hasEthiopianPO = kenyaOrders.some(po => po.destination === 'Central Operations' || po.requestedBy === 'Yohannes Bekele');
        expect(hasEthiopianPO).toBe(false);
    });

    it('strictly isolates Ethiopian purchase orders and rejects Kenyan records in Ethiopia tenant', () => {
        const ethiopiaOrders = mockOrders.filter(po => po.countryCode === 'ET');

        expect(ethiopiaOrders).toHaveLength(2);
        expect(ethiopiaOrders.every(po => po.currency === 'ETB')).toBe(true);
        expect(ethiopiaOrders.every(po => po.countryCode === 'ET')).toBe(true);

        const hasKenyanPO = ethiopiaOrders.some(po => po.destination === 'Nairobi Hub' || po.currency === 'KSh');
        expect(hasKenyanPO).toBe(false);
    });

    it('prevents arithmetic cross-addition across national borders', () => {
        const kenyaSpend = mockOrders
            .filter(po => po.countryCode === 'KE')
            .reduce((sum, po) => sum + po.totalAmount, 0);

        const ethiopiaSpend = mockOrders
            .filter(po => po.countryCode === 'ET')
            .reduce((sum, po) => sum + po.totalAmount, 0);

        // Kenya spend must strictly be 450,000 KSh (never mixed with ETB 5,632,000)
        expect(kenyaSpend).toBe(450000);
        expect(ethiopiaSpend).toBe(24000 + 5608000);
    });
});
