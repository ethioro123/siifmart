import { describe, it, expect } from 'vitest';
import {
    consolidateInventoryBySku,
    computeWeeklyDemand,
    generateDemandChartData,
    buildReplenishmentQueue
} from '../../utils/merchandisingForecast';
import type { Product, PurchaseOrder, SaleRecord } from '../../types';
import type { TransferRecord } from '../../types/infrastructure';
import type { ProductSalesMetrics } from '../../utils/merchandisingAnalytics';

describe('Merchandising Forecasting & Replenishment Engine', () => {
    const baseProduct: Product = {
        id: 'prod-lot-1',
        name: 'Sunflower Cooking Oil 1L',
        sku: 'ET-OIL-1L',
        price: 320,
        costPrice: 260,
        stock: 10,
        category: 'Pantry',
        siteId: 'site-alpha',
        image: '',
        status: 'active',
        minStock: 20,
        packQuantity: 6
    };

    it('consolidates multiple lots of the same SKU at the same site into one inventory position (Gap 9)', () => {
        const lot1 = { ...baseProduct, id: 'lot-1', stock: 12, batchNumber: 'BATCH-A' };
        const lot2 = { ...baseProduct, id: 'lot-2', stock: 8, batchNumber: 'BATCH-B' };

        const consolidated = consolidateInventoryBySku([lot1, lot2], [], [], 'site-alpha');

        expect(consolidated.length).toBe(1);
        expect(consolidated[0].sku).toBe('ET-OIL-1L');
        expect(consolidated[0].onHand).toBe(20); // 12 + 8
        expect(consolidated[0].lotProductIds).toEqual(['lot-1', 'lot-2']);
    });

    it('strictly preserves an explicit minStock of 0 without coercing to default 15 (Gap 8)', () => {
        const zeroMinProduct = { ...baseProduct, id: 'zero-min', minStock: 0 };
        const consolidated = consolidateInventoryBySku([zeroMinProduct], [], [], 'site-alpha');

        expect(consolidated[0].minThreshold).toBe(0);
    });

    it('incorporates open purchase orders and in-transit transfers into net inventory position (Gap 7)', () => {
        const product = { ...baseProduct, stock: 5 }; // 5 on hand, min 20

        const openPOs: PurchaseOrder[] = [
            {
                id: 'po-1',
                siteId: 'site-alpha',
                supplierId: 'supp-1',
                supplierName: 'Agro Supplier',
                date: '2026-10-20',
                status: 'Approved', // Open incoming order
                totalAmount: 3120,
                itemsCount: 1,
                expectedDelivery: '2026-10-30',
                lineItems: [
                    {
                        productId: product.id,
                        sku: product.sku,
                        productName: product.name,
                        quantity: 2, // 2 packs
                        packQuantity: 6, // 6 units/pack = 12 units incoming
                        unitCost: 1560,
                        totalCost: 3120,
                        retailPrice: 320
                    }
                ]
            }
        ];

        const openTransfers: TransferRecord[] = [
            {
                id: 'tr-1',
                sourceSiteId: 'site-central',
                destSiteId: 'site-alpha',
                status: 'In-Transit',
                requestedAt: '2026-10-25',
                requestedBy: 'Logistics',
                items: [
                    {
                        productId: product.id,
                        sku: product.sku,
                        productName: product.name,
                        quantity: 5,
                        receivedQty: 0
                    }
                ]
            }
        ];

        const consolidated = consolidateInventoryBySku([product], openPOs, openTransfers, 'site-alpha');
        expect(consolidated[0].onHand).toBe(5);
        expect(consolidated[0].onOrderStock).toBe(12); // 2 packs * 6
        expect(consolidated[0].inTransitStock).toBe(5);
        expect(consolidated[0].effectiveInventory).toBe(22); // 5 + 12 + 5
    });

    it('correctly converts suggested sellable units to PO packs without multiplying pack twice (Gap 5)', () => {
        const productWithPacks = {
            ...baseProduct,
            stock: 4, // 4 on hand
            minStock: 20, // min 20, target = 40
            packQuantity: 6
        };

        const consolidated = consolidateInventoryBySku([productWithPacks], [], [], 'site-alpha');
        const metricsMap = new Map<string, ProductSalesMetrics>();
        metricsMap.set(productWithPacks.id, {
            productId: productWithPacks.id,
            unitsSold7d: 14,
            unitsSold30d: 60,
            revenue30d: 19200,
            dailyRunRate: 2,
            daysOfSupply: 2,
            effectiveVelocity: 'High',
            hasOrderHistory: true,
            stockoutRisk: true,
            needsMarkdown: false
        });

        const recs = buildReplenishmentQueue(consolidated, metricsMap);
        expect(recs.length).toBe(1);

        const rec = recs[0];
        // Deficit: target 80 - 4 onHand = 76 units
        // With packSize = 6, suggestedBuyPacks must be Math.ceil(76 / 6) = 13 packs
        // NOT 76 packs (which would have become 76 * 6 = 456 units)!
        expect(rec.packSize).toBe(6);
        expect(rec.suggestedBuyPacks).toBe(Math.ceil(rec.suggestedBuySellable / 6));
        expect(rec.effectiveOrderedUnits).toBe(rec.suggestedBuyPacks * 6);
        expect(rec.effectiveOrderedUnits).toBeGreaterThanOrEqual(rec.suggestedBuySellable);
    });

    it('never guesses missing costs as 70% or 50 (Gap 6)', () => {
        const noCostProduct: Product = {
            ...baseProduct,
            stock: 0,
            costPrice: undefined, // Cost not recorded!
            price: 200
        };

        const consolidated = consolidateInventoryBySku([noCostProduct], [], [], 'site-alpha');
        const metricsMap = new Map<string, ProductSalesMetrics>();
        const recs = buildReplenishmentQueue(consolidated, metricsMap);

        expect(recs.length).toBe(1);
        expect(recs[0].unitCost).toBe(0); // Strictly 0, not 140 (70%) or 50!
        expect(recs[0].costUnrecorded).toBe(true);
        expect(recs[0].totalCost).toBe(0);
    });

    it('generates demand chart from actual sales and does not claim validated confidence (Gap 1 & 2)', () => {
        const now = new Date('2026-10-28T00:00:00Z');
        const sales: SaleRecord[] = [
            // Week 4 (1-7 days ago)
            {
                id: 's-w4',
                siteId: 'site-alpha',
                date: '2026-10-25T10:00:00Z',
                status: 'Completed',
                subtotal: 100,
                tax: 0,
                total: 100,
                method: 'Cash',
                items: [{ ...baseProduct, quantity: 10 }]
            },
            // Week 3 (8-14 days ago)
            {
                id: 's-w3',
                siteId: 'site-alpha',
                date: '2026-10-18T10:00:00Z',
                status: 'Completed',
                subtotal: 100,
                tax: 0,
                total: 100,
                method: 'Cash',
                items: [{ ...baseProduct, quantity: 12 }]
            },
            // Week 2 (15-21 days ago)
            {
                id: 's-w2',
                siteId: 'site-alpha',
                date: '2026-10-11T10:00:00Z',
                status: 'Completed',
                subtotal: 100,
                tax: 0,
                total: 100,
                method: 'Cash',
                items: [{ ...baseProduct, quantity: 8 }]
            },
            // Week 1 (22-28 days ago)
            {
                id: 's-w1',
                siteId: 'site-alpha',
                date: '2026-10-04T10:00:00Z',
                status: 'Completed',
                subtotal: 100,
                tax: 0,
                total: 100,
                method: 'Cash',
                items: [{ ...baseProduct, quantity: 10 }]
            }
        ];

        const { weeklyActuals, totalSales } = computeWeeklyDemand(sales, 'site-alpha', undefined, now);
        expect(weeklyActuals).toEqual([10, 8, 12, 10]);
        expect(totalSales).toBe(40);

        const { chartData, confidencePct } = generateDemandChartData(weeklyActuals, totalSales);
        expect(chartData.length).toBe(8);
        expect(chartData[0].actual).toBe(10);
        expect(chartData[1].actual).toBe(8);
        expect(chartData[2].actual).toBe(12);
        expect(chartData[3].actual).toBe(10);

        // Confidence should be statistical (not hardcoded 94.8%)
        expect(confidencePct).toBeNull();
        expect(chartData[4].predicted).toBe(10);
    });

    it('returns zero and null confidence when there is no POS sales history (Gap 1, 2 & 11)', () => {
        const { weeklyActuals, totalSales } = computeWeeklyDemand([], 'site-alpha');
        expect(weeklyActuals).toEqual([0, 0, 0, 0]);
        expect(totalSales).toBe(0);

        const { chartData, confidencePct } = generateDemandChartData(weeklyActuals, totalSales);
        expect(confidencePct).toBeNull();
        expect(chartData[4].predicted).toBeNull();
    });
});
