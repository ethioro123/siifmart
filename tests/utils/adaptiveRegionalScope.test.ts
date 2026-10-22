// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCountryScoping } from '../../contexts/hooks/useCountryScoping';
import type { Site, PurchaseOrder, SaleRecord, Employee, ShiftRecord } from '../../types';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false }
        }
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('Adaptive Regional Scope across Workflows', () => {
    const mockSites: any[] = [
        { id: 'site-ke-nrb-1', name: 'Westlands Supermarket', code: 'site-ke-nrb-1', country: 'KE', regionCode: 'KE-NRB', type: 'Store', isOnline: true },
        { id: 'site-ke-nrb-dc', name: 'Nairobi Central Hub', code: 'site-ke-nrb-dc', country: 'KE', regionCode: 'KE-NRB', type: 'Warehouse', isOnline: true },
        { id: 'site-ke-coast-1', name: 'Mombasa Store', code: 'site-ke-coast-1', country: 'KE', regionCode: 'KE-COAST', type: 'Store', isOnline: true },
        { id: 'site-et-add-1', name: 'Bole Store', code: 'site-et-add-1', country: 'ET', regionCode: 'ET-ADD', type: 'Store', isOnline: true }
    ];

    const mockOrders: any[] = [
        { id: 'po-1', poNumber: 'PO-001', supplierId: 's1', siteId: 'site-ke-nrb-1', totalAmount: 45000, status: 'Approved', items: [], createdAt: '2026-10-15' },
        { id: 'po-2', poNumber: 'PO-002', supplierId: 's2', siteId: 'site-ke-coast-1', totalAmount: 60000, status: 'Approved', items: [], createdAt: '2026-10-15' }
    ];

    const mockSales: any[] = [
        { id: 'sale-1', siteId: 'site-ke-nrb-1', total: 1200, items: [], paymentMethod: 'cash', timestamp: '2026-10-15' },
        { id: 'sale-2', siteId: 'site-ke-coast-1', total: 3400, items: [], paymentMethod: 'mpesa', timestamp: '2026-10-15' }
    ];

    const mockExpenses: any[] = [
        { id: 'exp-1', siteId: 'site-ke-nrb-1', amount: 5000, category: 'Maintenance', description: 'Store cleaning', status: 'Approved', date: '2026-10-15' },
        { id: 'exp-2', siteId: 'site-ke-coast-1', amount: 8000, category: 'Utilities', description: 'Power', status: 'Approved', date: '2026-10-15' }
    ];

    it('scopes all operational entities to active region when activeRegionCode is set', () => {
        const { result } = renderHook(() =>
            useCountryScoping({
                country: 'KE',
                settings: { country: 'KE', storeName: 'SIIFMART' } as any,
                user: { id: 'user-reg-1', role: 'regional_operations_manager', scopeLevel: 'REGIONAL', regionCode: 'KE-NRB', siteId: 'site-ke-nrb-1', country: 'KE' } as any,
                sites: mockSites,
                activeSiteId: 'site-ke-nrb-1',
                setActiveSiteId: () => {},
                allOrders: mockOrders,
                allSales: mockSales,
                employees: [],
                movements: [],
                shifts: [],
                expenses: mockExpenses,
                allProducts: [],
                products: [],
                suppliers: [],
                customers: [],
                discountCodes: []
            }),
            { wrapper: createWrapper() }
        );

        // When locked to KE-NRB
        expect(result.current.scopedSites.map(s => s.id)).toEqual(['site-ke-nrb-1', 'site-ke-nrb-dc']);
        expect(result.current.scopedAllOrders.map(o => o.id)).toEqual(['po-1']);
        expect(result.current.scopedAllSales.map(s => s.id)).toEqual(['sale-1']);
        expect(result.current.scopedExpenses.map(e => e.id)).toEqual(['exp-1']);
    });

    it('retains all country-wide entities when activeRegionCode is null (Corporate HQ Lens)', () => {
        const { result } = renderHook(() =>
            useCountryScoping({
                country: 'KE',
                settings: { country: 'KE', storeName: 'SIIFMART' } as any,
                user: { id: 'user-hq-1', role: 'group_ceo', scopeLevel: 'HQ' } as any,
                sites: mockSites,
                activeSiteId: 'site-ke-nrb-1',
                setActiveSiteId: () => {},
                allOrders: mockOrders,
                allSales: mockSales,
                employees: [],
                movements: [],
                shifts: [],
                expenses: mockExpenses,
                allProducts: [],
                products: [],
                suppliers: [],
                customers: [],
                discountCodes: []
            }),
            { wrapper: createWrapper() }
        );

        // HQ without regional filter sees both Nairobi and Coast facilities in Kenya
        expect(result.current.scopedSites.map(s => s.id)).toEqual(['site-ke-nrb-1', 'site-ke-nrb-dc', 'site-ke-coast-1']);
        expect(result.current.scopedAllOrders.map(o => o.id)).toEqual(['po-1', 'po-2']);
        expect(result.current.scopedAllSales.map(s => s.id)).toEqual(['sale-1', 'sale-2']);
        expect(result.current.scopedExpenses.map(e => e.id)).toEqual(['exp-1', 'exp-2']);
    });
});
