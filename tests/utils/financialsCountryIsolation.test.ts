import { describe, it, expect } from 'vitest';
import {
    getCountryTaxConfig,
    calculateApAging,
    computeWeeklyCashflow,
    getDateRangeBounds
} from '../../hooks/financialsHelpers';
import type { PurchaseOrder } from '../../types';

describe('Financials Country Isolation & Sovereign Accounting', () => {
    describe('getCountryTaxConfig', () => {
        it('should correctly configure Ethiopian tax authority and 15% VAT by default', () => {
            const config = getCountryTaxConfig('ET');
            expect(config.rate).toBe(15);
            expect(config.authority).toContain('ERCA');
            expect(config.taxName).toBe('VAT (ERCA)');
            expect(config.code).toBe('ETB');
        });

        it('should correctly configure Kenyan tax authority and 16% VAT by default', () => {
            const config = getCountryTaxConfig('KE');
            expect(config.rate).toBe(16);
            expect(config.authority).toContain('KRA');
            expect(config.taxName).toBe('VAT (KRA)');
            expect(config.code).toBe('KSh');
        });

        it('should correctly configure Ugandan tax authority and 18% VAT by default', () => {
            const config = getCountryTaxConfig('UG');
            expect(config.rate).toBe(18);
            expect(config.authority).toContain('URA');
            expect(config.code).toBe('USh');
        });

        it('should allow custom setting override when config-gated in system settings', () => {
            const customET = getCountryTaxConfig('ET', 12.5);
            expect(customET.rate).toBe(12.5);
            expect(customET.authority).toContain('ERCA');

            const customKE = getCountryTaxConfig('KE', 14.0);
            expect(customKE.rate).toBe(14.0);
            expect(customKE.authority).toContain('KRA');
        });
    });

    describe('calculateApAging', () => {
        it('should bin purchase orders into correct aging brackets and calculate total outstanding', () => {
            const now = Date.now();
            const dayMs = 24 * 3600 * 1000;

            const orders: Partial<PurchaseOrder>[] = [
                {
                    id: 'PO-001',
                    date: new Date(now - 10 * dayMs).toISOString(),
                    totalAmount: 50000,
                    status: 'Received'
                },
                {
                    id: 'PO-002',
                    date: new Date(now - 45 * dayMs).toISOString(),
                    totalAmount: 30000,
                    status: 'Approved'
                },
                {
                    id: 'PO-003',
                    date: new Date(now - 75 * dayMs).toISOString(),
                    totalAmount: 15000,
                    status: 'Ordered'
                },
                {
                    id: 'PO-004',
                    date: new Date(now - 120 * dayMs).toISOString(),
                    totalAmount: 10000,
                    status: 'Partially Received'
                },
                {
                    id: 'PO-005', // Cancelled order should be excluded from AP aging
                    date: new Date(now - 20 * dayMs).toISOString(),
                    totalAmount: 99999,
                    status: 'Cancelled'
                },
                {
                    id: 'PO-006', // Draft order should be excluded
                    date: new Date(now - 5 * dayMs).toISOString(),
                    totalAmount: 88888,
                    status: 'Draft'
                }
            ];

            const aging = calculateApAging(orders as PurchaseOrder[]);

            expect(aging.current).toBe(50000);
            expect(aging.days1to30).toBe(30000);
            expect(aging.days31to60).toBe(15000);
            expect(aging.days60Plus).toBe(10000);
            expect(aging.totalOutstanding).toBe(105000);
        });

        it('should return all zeros for empty or settled purchase orders', () => {
            const aging = calculateApAging([]);
            expect(aging.current).toBe(0);
            expect(aging.days1to30).toBe(0);
            expect(aging.days31to60).toBe(0);
            expect(aging.days60Plus).toBe(0);
            expect(aging.totalOutstanding).toBe(0);
        });
    });

    describe('computeWeeklyCashflow', () => {
        it('should standardize cashflow data with income, expense, revenue, and expenses properties', () => {
            const sales = [
                { created_at: '2026-08-10T10:00:00Z', total: 1000 },
                { created_at: '2026-08-10T14:00:00Z', total: 500 }
            ];
            const expenses = [
                { date: '2026-08-10T11:00:00Z', amount: 300 }
            ];

            const cashflow = computeWeeklyCashflow(sales, expenses);
            expect(cashflow.length).toBeGreaterThan(0);
            expect(cashflow[0].income).toBe(1500);
            expect(cashflow[0].revenue).toBe(1500);
            expect(cashflow[0].expense).toBe(300);
            expect(cashflow[0].expenses).toBe(300);
        });
    });

    describe('getDateRangeBounds', () => {
        it('should compute valid start and end dates for This Month', () => {
            const bounds = getDateRangeBounds('This Month');
            expect(bounds.startDate).toBeDefined();
            expect(bounds.endDate).toBeDefined();
            expect(new Date(bounds.startDate!).getTime()).toBeLessThanOrEqual(new Date(bounds.endDate!).getTime());
        });

        it('should compute valid start and end dates for This Quarter', () => {
            const bounds = getDateRangeBounds('This Quarter');
            expect(bounds.startDate).toBeDefined();
            expect(bounds.endDate).toBeDefined();
        });
    });
});
