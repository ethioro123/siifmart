// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCountryScoping } from '../../contexts/hooks/useCountryScoping';
import { Site, PurchaseOrder, SaleRecord, Employee, StockMovement, ShiftRecord, ExpenseRecord, Product } from '../../types';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const renderHookWithQuery = (callback: () => any, options?: any) =>
    renderHook(callback, { wrapper: createWrapper(), ...options });

describe('useCountryScoping Hook', () => {
    const mockSites: Site[] = [
        {
            id: 'site-eth-1',
            code: 'ETH-01',
            name: 'Addis Central Warehouse',
            type: 'Warehouse',
            address: 'Bole, Addis Ababa',
            status: 'Active',
            country: 'ET',
            currency: 'ETB'
        },
        {
            id: 'site-eth-2',
            code: 'ETH-02',
            name: 'Adama Retail Store',
            type: 'Store',
            address: 'Adama',
            status: 'Active',
            country: 'ET',
            currency: 'ETB'
        },
        {
            id: 'site-ke-1',
            code: 'KE-01',
            name: 'Nairobi Central Distribution Hub',
            type: 'Distribution Center',
            address: 'Industrial Area, Nairobi',
            status: 'Active',
            country: 'KE',
            currency: 'KSh'
        },
        {
            id: 'site-ke-2',
            code: 'KE-02',
            name: 'Westlands Retail Store',
            type: 'Store',
            address: 'Westlands, Nairobi',
            status: 'Active',
            country: 'KE',
            currency: 'KSh'
        }
    ];

    const mockOrders: PurchaseOrder[] = [
        {
            id: 'po-eth-1',
            siteId: 'site-eth-1',
            supplierId: 'sup-1',
            supplierName: 'Ethiopian Agri Goods',
            date: '2026-09-01',
            status: 'Approved',
            totalAmount: 50000,
            itemsCount: 100,
            lineItems: [],
            expectedDelivery: null
        },
        {
            id: 'po-ke-1',
            siteId: 'site-ke-1',
            supplierId: 'sup-2',
            supplierName: 'Kenya Wholesalers Ltd',
            date: '2026-09-10',
            status: 'Draft',
            totalAmount: 120000,
            itemsCount: 250,
            lineItems: [],
            expectedDelivery: null
        }
    ];

    const mockSales: SaleRecord[] = [
        {
            id: 'sale-eth-1',
            siteId: 'site-eth-2',
            receiptNumber: 'TX-ETH-001',
            date: '2026-09-20',
            items: [],
            subtotal: 2500,
            tax: 0,
            total: 2500,
            method: 'Cash',
            status: 'Completed'
        },
        {
            id: 'sale-ke-1',
            siteId: 'site-ke-2',
            receiptNumber: 'TX-KE-001',
            date: '2026-09-21',
            items: [],
            subtotal: 3400,
            tax: 0,
            total: 3400,
            method: 'Mobile Money',
            status: 'Completed'
        }
    ];

    const mockEmployees: Employee[] = [
        {
            id: 'emp-eth-1',
            code: 'EMP-ETH-01',
            name: 'Abebe Bikila',
            siteId: 'site-eth-1',
            role: 'stock_clerk',
            email: 'abebe@example.com',
            phone: '0911223344',
            status: 'Active',
            joinDate: '2025-01-01',
            department: 'Warehouse',
            avatar: '',
            performanceScore: 95
        },
        {
            id: 'emp-ke-1',
            code: 'EMP-KE-01',
            name: 'Peter Kipchoge',
            siteId: 'site-ke-1',
            role: 'stock_clerk',
            email: 'peter@example.com',
            phone: '0711223344',
            status: 'Active',
            joinDate: '2025-01-01',
            department: 'Warehouse',
            avatar: '',
            performanceScore: 92
        }
    ];

    const mockMovements: StockMovement[] = [
        {
            id: 'mov-eth-1',
            productId: 'p-1',
            productName: 'Ethiopian Item 1',
            siteId: 'site-eth-1',
            type: 'IN',
            quantity: 50,
            date: '2026-09-15',
            performedBy: 'Abebe',
            reason: 'Inbound Shipment'
        },
        {
            id: 'mov-ke-1',
            productId: 'p-2',
            productName: 'Kenyan Item 2',
            siteId: 'site-ke-1',
            type: 'IN',
            quantity: 100,
            date: '2026-09-18',
            performedBy: 'Peter',
            reason: 'Inbound Shipment'
        }
    ];

    it('scopes sites, orders, sales, movements, and employees to Kenya when country is KE', () => {
        const setActiveSiteId = vi.fn();
        const { result } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'KE',
                sites: mockSites,
                activeSiteId: 'site-ke-1',
                setActiveSiteId,
                allOrders: mockOrders,
                allSales: mockSales,
                employees: mockEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        // Sites
        expect(result.current.scopedSites.map(s => s.id)).toEqual(['site-ke-1', 'site-ke-2']);
        expect(result.current.scopedSites.every(s => s.country === 'KE')).toBe(true);

        // Orders
        expect(result.current.scopedAllOrders.map(o => o.id)).toEqual(['po-ke-1']);

        // Sales
        expect(result.current.scopedAllSales.map(s => s.id)).toEqual(['sale-ke-1']);

        // Employees
        expect(result.current.scopedEmployees.map(e => e.id)).toEqual(['emp-ke-1']);

        // Movements
        expect(result.current.scopedMovements.map(m => m.id)).toEqual(['mov-ke-1']);
    });

    it('scopes sites, orders, sales, movements, and employees to Ethiopia when country is ET', () => {
        const setActiveSiteId = vi.fn();
        const { result } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'ET',
                sites: mockSites,
                activeSiteId: 'site-eth-1',
                setActiveSiteId,
                allOrders: mockOrders,
                allSales: mockSales,
                employees: mockEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        // Sites
        expect(result.current.scopedSites.map(s => s.id)).toEqual(['site-eth-1', 'site-eth-2']);
        expect(result.current.scopedSites.every(s => s.country === 'ET')).toBe(true);

        // Orders
        expect(result.current.scopedAllOrders.map(o => o.id)).toEqual(['po-eth-1']);

        // Sales
        expect(result.current.scopedAllSales.map(s => s.id)).toEqual(['sale-eth-1']);

        // Employees
        expect(result.current.scopedEmployees.map(e => e.id)).toEqual(['emp-eth-1']);

        // Movements
        expect(result.current.scopedMovements.map(m => m.id)).toEqual(['mov-eth-1']);
    });

    it('auto-switches activeSiteId to first matching country site when country switches', () => {
        const setActiveSiteId = vi.fn();
        renderHookWithQuery(() =>
            useCountryScoping({
                country: 'KE',
                sites: mockSites,
                activeSiteId: 'site-eth-1', // Initially set to Ethiopian site
                setActiveSiteId,
                allOrders: mockOrders,
                allSales: mockSales,
                employees: mockEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        // Should call setActiveSiteId with first Kenyan site
        expect(setActiveSiteId).toHaveBeenCalledWith('site-ke-1');
    });

    it('strictly locks non-CEO staff to their assigned site country even if country setting changes', () => {
        const setActiveSiteId = vi.fn();
        const nonCeoUser = {
            id: 'emp-eth-1',
            name: 'Abebe Bikila',
            role: 'cashier' as const,
            siteId: 'site-eth-1'
        };

        const { result } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'KE', // Try to view Kenya as a cashier
                user: nonCeoUser,
                sites: mockSites,
                activeSiteId: 'site-eth-1',
                setActiveSiteId,
                allOrders: mockOrders,
                allSales: mockSales,
                employees: mockEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        // Cashier MUST be locked to Ethiopia
        expect(result.current.effectiveCountry).toBe('ET');
        expect(result.current.isCeo).toBe(false);
        expect(result.current.scopedSites.map(s => s.id)).toEqual(['site-eth-1', 'site-eth-2']);
        expect(result.current.scopedAllOrders.map(o => o.id)).toEqual(['po-eth-1']);
        expect(result.current.scopedAllSales.map(s => s.id)).toEqual(['sale-eth-1']);
    });

    it('allows CEO to switch freely between country instances', () => {
        const setActiveSiteId = vi.fn();
        const ceoUser = {
            id: 'ceo-1',
            name: 'Executive Director',
            role: 'group_ceo' as any,
            title: 'Chief Executive Officer'
        };

        // When CEO selects Kenya
        const { result: kenyaResult } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'KE',
                user: ceoUser,
                sites: mockSites,
                activeSiteId: 'site-ke-1',
                setActiveSiteId,
                allOrders: mockOrders,
                allSales: mockSales,
                employees: mockEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        expect(kenyaResult.current.effectiveCountry).toBe('KE');
        expect(kenyaResult.current.isCeo).toBe(true);
        expect(kenyaResult.current.scopedSites.map(s => s.id)).toEqual(['site-ke-1', 'site-ke-2']);
        expect(kenyaResult.current.scopedAllOrders.map(o => o.id)).toEqual(['po-ke-1']);

        // When CEO switches to Ethiopia
        const { result: ethResult } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'ET',
                user: ceoUser,
                sites: mockSites,
                activeSiteId: 'site-eth-1',
                setActiveSiteId,
                allOrders: mockOrders,
                allSales: mockSales,
                employees: mockEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        expect(ethResult.current.effectiveCountry).toBe('ET');
        expect(ethResult.current.isCeo).toBe(true);
        expect(ethResult.current.scopedSites.map(s => s.id)).toEqual(['site-eth-1', 'site-eth-2']);
        expect(ethResult.current.scopedAllOrders.map(o => o.id)).toEqual(['po-eth-1']);
    });

    it('seamlessly isolates any newly added country (e.g. Uganda UG) as its own fresh instance', () => {
        const setActiveSiteId = vi.fn();
        const ugandaSites: Site[] = [
            ...mockSites,
            {
                id: 'site-ug-1',
                code: 'UG-01',
                name: 'Kampala Central Hub',
                type: 'Distribution Center',
                address: 'Kampala, Uganda',
                status: 'Active',
                country: 'UG',
                currency: 'USh'
            }
        ];

        const ugandaOrders: PurchaseOrder[] = [
            ...mockOrders,
            {
                id: 'po-ug-1',
                siteId: 'site-ug-1',
                supplierId: 'sup-ug-1',
                supplierName: 'Uganda Coffee Exporters',
                date: '2026-09-25',
                status: 'Approved',
                totalAmount: 95000,
                itemsCount: 50,
                lineItems: [],
                expectedDelivery: null
            }
        ];

        const ugandaEmployees: Employee[] = [
            ...mockEmployees,
            {
                id: 'emp-ug-1',
                code: 'EMP-UG-01',
                name: 'Grace Namubiru',
                siteId: 'site-ug-1',
                role: 'cashier',
                email: 'grace@example.com',
                phone: '+256700123456',
                status: 'Active',
                joinDate: '2026-09-01',
                department: 'Retail',
                avatar: '',
                performanceScore: 90
            }
        ];

        // 1. CEO viewing Uganda
        const ceoUser = { id: 'ceo-1', role: 'group_ceo' as any };
        const { result: ceoResult } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'UG',
                user: ceoUser,
                sites: ugandaSites,
                activeSiteId: 'site-ug-1',
                setActiveSiteId,
                allOrders: ugandaOrders,
                allSales: mockSales,
                employees: ugandaEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        expect(ceoResult.current.effectiveCountry).toBe('UG');
        expect(ceoResult.current.scopedSites.map(s => s.id)).toEqual(['site-ug-1']);
        expect(ceoResult.current.scopedAllOrders.map(o => o.id)).toEqual(['po-ug-1']);
        expect(ceoResult.current.scopedEmployees.map(e => e.id)).toEqual(['emp-ug-1']);

        // 2. Ugandan cashier: strictly locked to Uganda
        const ugCashier = { id: 'emp-ug-1', role: 'cashier' as const, siteId: 'site-ug-1' };
        const { result: cashierResult } = renderHookWithQuery(() =>
            useCountryScoping({
                country: 'ET', // Attemping to view Ethiopia
                user: ugCashier,
                sites: ugandaSites,
                activeSiteId: 'site-ug-1',
                setActiveSiteId,
                allOrders: ugandaOrders,
                allSales: mockSales,
                employees: ugandaEmployees,
                movements: mockMovements,
                shifts: [],
                expenses: [],
                allProducts: [],
                suppliers: []
            })
        );

        expect(cashierResult.current.effectiveCountry).toBe('UG');
        expect(cashierResult.current.isCeo).toBe(false);
        expect(cashierResult.current.scopedSites.map(s => s.id)).toEqual(['site-ug-1']);
        expect(cashierResult.current.scopedAllOrders.map(o => o.id)).toEqual(['po-ug-1']);
        expect(cashierResult.current.scopedEmployees.map(e => e.id)).toEqual(['emp-ug-1']);
    });
});
