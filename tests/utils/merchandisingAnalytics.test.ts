import { describe, it, expect } from 'vitest';
import { computeProductSalesMetrics, buildCatalogSalesMetricsIndex } from '../../utils/merchandisingAnalytics';
import type { Product, SaleRecord } from '../../types';

describe('Merchandising Analytics Engine', () => {
    const baseProduct: Product = {
        id: 'prod-1',
        name: 'Organic Honey 500g',
        sku: 'ET-HONEY-500',
        price: 150,
        costPrice: 100,
        stock: 30,
        category: 'Pantry',
        shelfPosition: 'Eye Level',
        salesVelocity: 'Low',
        siteId: 'site-1',
        image: '',
        status: 'active'
    };

    const now = new Date('2026-10-11T12:00:00Z');

    it('computes metrics with zero order history and falls back to product salesVelocity', () => {
        const metrics = computeProductSalesMetrics(baseProduct, [], now);
        expect(metrics.unitsSold7d).toBe(0);
        expect(metrics.unitsSold30d).toBe(0);
        expect(metrics.revenue30d).toBe(0);
        expect(metrics.dailyRunRate).toBe(0);
        expect(metrics.effectiveVelocity).toBe('Low');
        expect(metrics.hasOrderHistory).toBe(false);
    });

    it('computes real units sold, revenue, and daily run rate from valid orders', () => {
        const orders: SaleRecord[] = [
            {
                id: 'ord-1',
                siteId: 'site-1',
                date: '2026-10-09T10:00:00Z', // 2 days ago (within 7d and 30d)
                subtotal: 300,
                tax: 0,
                total: 300,
                method: 'Cash',
                status: 'Completed',
                items: [
                    { ...baseProduct, quantity: 2, price: 150 }
                ]
            },
            {
                id: 'ord-2',
                siteId: 'site-1',
                date: '2026-09-25T10:00:00Z', // 16 days ago (within 30d, outside 7d)
                subtotal: 1500,
                tax: 0,
                total: 1500,
                method: 'Mobile Money',
                status: 'Completed',
                items: [
                    { ...baseProduct, quantity: 10, price: 150 }
                ]
            },
            {
                id: 'ord-refunded',
                siteId: 'site-1',
                date: '2026-10-10T10:00:00Z',
                subtotal: 150,
                tax: 0,
                total: 150,
                method: 'Cash',
                status: 'Refunded', // Should be ignored
                items: [
                    { ...baseProduct, quantity: 5, price: 150 }
                ]
            }
        ];

        const metrics = computeProductSalesMetrics(baseProduct, orders, now);
        expect(metrics.unitsSold7d).toBe(2);
        expect(metrics.unitsSold30d).toBe(12);
        expect(metrics.revenue30d).toBe(1800);
        expect(metrics.dailyRunRate).toBe(0.4);
        expect(metrics.daysOfSupply).toBe(75); // 30 / 0.4
        expect(metrics.effectiveVelocity).toBe('Medium'); // 12 >= 10
        expect(metrics.hasOrderHistory).toBe(true);
    });

    it('identifies high velocity and stockout risk', () => {
        const orders: SaleRecord[] = [
            {
                id: 'ord-bulk',
                siteId: 'site-1',
                date: '2026-10-08T10:00:00Z',
                subtotal: 7500,
                tax: 0,
                total: 7500,
                method: 'Cash',
                status: 'Completed',
                items: [
                    { ...baseProduct, quantity: 50, price: 150 }
                ]
            }
        ];

        const lowStockProduct: Product = { ...baseProduct, stock: 5 };
        const metrics = computeProductSalesMetrics(lowStockProduct, orders, now);

        expect(metrics.effectiveVelocity).toBe('High'); // 50 >= 40
        expect(metrics.dailyRunRate).toBe(1.67);
        expect(metrics.daysOfSupply).toBe(3); // 5 / 1.67
        expect(metrics.stockoutRisk).toBe(true); // < 7 days
    });

    it('strictly excludes pending, draft, cancelled, and void sales from demand calculations', () => {
        const orders: SaleRecord[] = [
            {
                id: 'ord-pending',
                siteId: 'site-1',
                date: '2026-10-10T10:00:00Z',
                subtotal: 300,
                tax: 0,
                total: 300,
                method: 'Cash',
                status: 'Pending', // Pending sale should NEVER inflate demand
                items: [{ ...baseProduct, quantity: 20, price: 150 }]
            },
            {
                id: 'ord-cancelled',
                siteId: 'site-1',
                date: '2026-10-10T10:00:00Z',
                subtotal: 300,
                tax: 0,
                total: 300,
                method: 'Cash',
                status: 'Cancelled' as any,
                items: [{ ...baseProduct, quantity: 15, price: 150 }]
            },
            {
                id: 'ord-completed',
                siteId: 'site-1',
                date: '2026-10-10T10:00:00Z',
                subtotal: 150,
                tax: 0,
                total: 150,
                method: 'Cash',
                status: 'Completed',
                items: [{ ...baseProduct, quantity: 5, price: 150 }]
            }
        ];

        const metrics = computeProductSalesMetrics(baseProduct, orders, now);
        expect(metrics.unitsSold30d).toBe(5);
        expect(metrics.revenue30d).toBe(750);
    });

    it('strictly prevents another store location sale with the same SKU from inflating this store forecast', () => {
        const orders: SaleRecord[] = [
            {
                id: 'ord-store-2',
                siteId: 'site-2', // Different location!
                date: '2026-10-10T10:00:00Z',
                subtotal: 3000,
                tax: 0,
                total: 3000,
                method: 'Cash',
                status: 'Completed',
                items: [{ ...baseProduct, quantity: 20, price: 150 }] // Same SKU
            },
            {
                id: 'ord-store-1',
                siteId: 'site-1', // Correct location
                date: '2026-10-10T10:00:00Z',
                subtotal: 300,
                tax: 0,
                total: 300,
                method: 'Cash',
                status: 'Completed',
                items: [{ ...baseProduct, quantity: 2, price: 150 }]
            }
        ];

        const metrics = computeProductSalesMetrics(baseProduct, orders, now);
        expect(metrics.unitsSold30d).toBe(2); // Only site-1 sale should count
    });

    it('indexes catalog metrics efficiently with buildCatalogSalesMetricsIndex', () => {
        const index = buildCatalogSalesMetricsIndex([baseProduct], [], now);
        expect(index.has(baseProduct.id)).toBe(true);
        expect(index.get(baseProduct.id)?.productId).toBe(baseProduct.id);
    });
});
