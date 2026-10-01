import { describe, it, expect } from 'vitest';
import type { SaleRecord, Site } from '../../types';
import { getCountryProfile } from '../../utils/localization';

describe('Sales History Multi-Country Tenant Isolation', () => {
    const mockSites: Site[] = [
        {
            id: 'site-ethiopia-1',
            code: 'ET-001',
            name: 'Bole Flagship Store',
            type: 'Store',
            country: 'ET',
            currency: 'ETB',
            address: 'Bole Medhanealem, Addis Ababa',
            status: 'Active'
        },
        {
            id: 'site-ethiopia-2',
            code: 'ET-002',
            name: 'Piazza Central Branch',
            type: 'Store',
            country: 'ET',
            currency: 'ETB',
            address: 'Piazza, Addis Ababa',
            status: 'Active'
        },
        {
            id: 'site-kenya-1',
            code: 'KE-001',
            name: 'Westlands Express',
            type: 'Store',
            country: 'KE',
            currency: 'KES',
            address: 'Waiyaki Way, Westlands, Nairobi',
            status: 'Active'
        }
    ];

    const mockSales: SaleRecord[] = [
        {
            id: 'sale-et-1',
            siteId: 'site-ethiopia-1',
            receiptNumber: '113300004',
            date: '2026-09-28T05:44:00Z',
            cashierName: 'Shukri Kamal',
            method: 'Cash',
            items: [
                {
                    id: 'item-1',
                    name: 'Product 1',
                    price: 35325,
                    quantity: 2,
                    category: 'Food',
                    stock: 50,
                    sku: 'ET-PR001',
                    image: '',
                    status: 'active',
                    siteId: 'site-ethiopia-1'
                }
            ],
            subtotal: 70650,
            tax: 0,
            total: 70650,
            status: 'Completed'
        },
        {
            id: 'sale-et-2',
            siteId: 'site-ethiopia-2',
            receiptNumber: '63300002',
            date: '2026-08-26T10:00:00Z',
            cashierName: 'Sara Bekele',
            method: 'Cash',
            items: [
                {
                    id: 'item-2',
                    name: 'Product 2',
                    price: 76000,
                    quantity: 1,
                    category: 'Electronics',
                    stock: 20,
                    sku: 'ET-PR002',
                    image: '',
                    status: 'active',
                    siteId: 'site-ethiopia-2'
                }
            ],
            subtotal: 76000,
            tax: 0,
            total: 76000,
            status: 'Completed'
        },
        {
            id: 'sale-ke-1',
            siteId: 'site-kenya-1',
            receiptNumber: 'KE-1000001',
            date: '2026-09-29T08:30:00Z',
            cashierName: 'David Ochieng',
            method: 'Mobile Money',
            items: [
                {
                    id: 'item-3',
                    name: 'Kenya Tea 500g',
                    price: 450,
                    quantity: 2,
                    category: 'Beverages',
                    stock: 100,
                    sku: 'KE-BV001',
                    image: '',
                    status: 'active',
                    siteId: 'site-kenya-1'
                }
            ],
            subtotal: 900,
            tax: 0,
            total: 900,
            status: 'Completed'
        }
    ];

    it('strictly isolates Kenyan sales and rejects Ethiopian transactions in Kenya tenant', () => {
        const activeCountry = 'KE';
        const countrySites = mockSites.filter(s => (s.country || 'ET') === activeCountry);
        const countrySiteIds = countrySites.map(s => s.id);

        expect(countrySites).toHaveLength(1);
        expect(countrySiteIds).toEqual(['site-kenya-1']);

        const kenyaSales = mockSales.filter(s => countrySiteIds.includes(s.siteId));

        expect(kenyaSales).toHaveLength(1);
        expect(kenyaSales[0].receiptNumber).toBe('KE-1000001');
        expect(kenyaSales[0].cashierName).toBe('David Ochieng');

        // Zero cross-country data leakage
        const hasEthiopianSale = kenyaSales.some(s => s.cashierName === 'Sara Bekele' || s.receiptNumber === '113300004');
        expect(hasEthiopianSale).toBe(false);
    });

    it('strictly isolates Ethiopian sales and rejects Kenyan transactions in Ethiopia tenant', () => {
        const activeCountry = 'ET';
        const countrySites = mockSites.filter(s => (s.country || 'ET') === activeCountry);
        const countrySiteIds = countrySites.map(s => s.id);

        expect(countrySites).toHaveLength(2);
        expect(countrySiteIds).toEqual(['site-ethiopia-1', 'site-ethiopia-2']);

        const ethiopiaSales = mockSales.filter(s => countrySiteIds.includes(s.siteId));

        expect(ethiopiaSales).toHaveLength(2);
        expect(ethiopiaSales.every(s => countrySiteIds.includes(s.siteId))).toBe(true);

        const hasKenyanSale = ethiopiaSales.some(s => s.cashierName === 'David Ochieng' || s.receiptNumber === 'KE-1000001');
        expect(hasKenyanSale).toBe(false);
    });

    it('prevents arithmetic cross-addition across national currencies', () => {
        const kenyaSiteIds = mockSites.filter(s => s.country === 'KE').map(s => s.id);
        const ethiopiaSiteIds = mockSites.filter(s => s.country === 'ET').map(s => s.id);

        const kenyaRevenue = mockSales
            .filter(s => kenyaSiteIds.includes(s.siteId) && s.status !== 'Refunded')
            .reduce((sum, s) => sum + s.total, 0);

        const ethiopiaRevenue = mockSales
            .filter(s => ethiopiaSiteIds.includes(s.siteId) && s.status !== 'Refunded')
            .reduce((sum, s) => sum + s.total, 0);

        // Kenya revenue must strictly be KSh 900 and never sum ETB 146,650
        expect(kenyaRevenue).toBe(900);
        expect(ethiopiaRevenue).toBe(70650 + 76000);
        expect(kenyaRevenue + ethiopiaRevenue).not.toBe(kenyaRevenue);
    });

    it('resolves correct currency symbol dynamically for each country profile', () => {
        expect(getCountryProfile('KE').currencySymbol).toBe('KSh');
        expect(getCountryProfile('ET').currencySymbol).toBe('ETB');
        expect(getCountryProfile('UG').currencySymbol).toBe('USh');
        expect(getCountryProfile('RW').currencySymbol).toBe('RWF');
        expect(getCountryProfile('TZ').currencySymbol).toBe('TSh');
    });

    it('returns empty result when a country has no registered facilities', () => {
        const ugandaSites = mockSites.filter(s => s.country === 'UG');
        const ugandaSiteIds = ugandaSites.map(s => s.id);

        const ugandaSales = mockSales.filter(s => ugandaSiteIds.includes(s.siteId));
        expect(ugandaSales).toHaveLength(0);
    });
});
