import { describe, expect, it } from 'vitest';
import type { Product, SaleRecord, PurchaseOrder } from '../../types';
import { computeProductSalesMetrics } from '../../utils/merchandisingAnalytics';
import { buildReplenishmentQueue, consolidateInventoryBySku, computeWeeklyDemand } from '../../utils/merchandisingForecast';
const product = { id: 'p1', sku: 'SKU1', name: 'Milk', stock: 0, minStock: 0, siteId: 's1', price: 10, costPrice: 5, category: 'Dairy', unit: 'UNIT', status: 'active', packQuantity: 6 } as Product;
const now = new Date('2026-10-28T12:00:00Z');
const sale = { id: 'sale1', siteId: 's1', date: '2026-10-27', status: 'Completed', items: [{ ...product, quantity: 3 }] } as SaleRecord;
describe('Forecast evidence regressions', () => {
    it('excludes cross-site, unscoped, pending, partial-refund and invalid-date sales', () => {
        for (const override of [{ siteId: 's2' }, { siteId: '' }, { status: 'Pending' }, { status: 'Partially Refunded' }, { date: 'invalid' }]) {
            const record = { ...sale, ...override } as SaleRecord;
            expect(computeProductSalesMetrics(product, [record], now).unitsSold30d).toBe(0);
            expect(computeWeeklyDemand([record], 's1', undefined, now).totalSales).toBe(0);
        }
    });
    it('detects out-of-stock demand and preserves low-volume run rate for recommendations', () => {
        const metric = computeProductSalesMetrics(product, [sale], now);
        expect(metric.stockoutRisk).toBe(true);
        const rec = buildReplenishmentQueue(consolidateInventoryBySku([product]), new Map([[product.id, metric]]))[0];
        expect(rec.predictedDemand30d).toBe(3);
        expect(rec.suggestedBuySellable).toBe(3);
        expect(rec.suggestedBuyPacks).toBe(1);
    });
    it('does not invent demand or a minimum when neither exists', () => {
        const items = consolidateInventoryBySku([{ ...product, minStock: undefined }]);
        expect(items[0].minThreshold).toBe(0);
        expect(buildReplenishmentQueue(items, new Map())).toEqual([]);
    });
    it('sums reservations on all lots and rejects out-of-scope inventory', () => {
        const lots = [{ ...product, stock: 10, customAttributes: { reserved: 2 } }, { ...product, id: 'p2', stock: 8, customAttributes: { reserved: 3 } }, { ...product, siteId: 's2', stock: 100 }];
        const position = consolidateInventoryBySku(lots, [], [], 's1')[0];
        expect(position.onHand).toBe(18); expect(position.reservedStock).toBe(5); expect(position.effectiveInventory).toBe(13);
    });
    it('subtracts received selling units after converting PO order packs', () => {
        const po = { siteId: 's1', status: 'Approved', lineItems: [{ productId: 'p1', sku: 'SKU1', quantity: 2, packQuantity: 6, receivedQty: 5 }] } as PurchaseOrder;
        expect(consolidateInventoryBySku([product], [po], [], 's1')[0].onOrderStock).toBe(7);
    });
    it('uses master-case conversion and reports pack rounding that exceeds maximum stock', () => {
        const p = { ...product, minStock: 10, maxStock: 20, customAttributes: { packaging: { packQty: 6, caseSize: 4, packagingLevel: 'two_tier' } } };
        const rec = buildReplenishmentQueue(consolidateInventoryBySku([p]), new Map())[0];
        expect(rec.packSize).toBe(24); expect(rec.orderUnitCost).toBe(120); expect(rec.blockedReason).toContain('exceed');
    });
});
