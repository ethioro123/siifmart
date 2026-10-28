import { describe, expect, it } from 'vitest';
import type { Product } from '../../types';
import type { ForecastSnapshot, ForecastIncomingBucket } from '../../services/merchandising-forecast.service';
import { analyzeForecastSnapshot } from '../../utils/forecastSnapshot';
import { productOrderUnits } from '../../utils/productControlLogic';
import { convertToSellableUnits } from '../../components/procurement/utils';
const product = { id: 'p1', siteId: 's1', sku: 'SKU1', name: 'Coffee', stock: 5, price: 10, costPrice: 5, minStock: 0, unit: 'UNIT', status: 'active' } as Product;
const snapshot = (): ForecastSnapshot => ({ products: [product], demand: [{ sku: 'SKU1', age_days: 1, units: 30, refund_uncertain: false }], incoming: [], awaitingSkus: [], asOf: '2026-10-28T12:00:00Z', start: '2026-09-28T12:00:00Z' });
const incoming = (date: string | null): ForecastIncomingBucket => ({ sku: 'SKU1', expected_delivery: date, pack_quantity: 1, case_size: 0, unit: 'UNIT', size: '', custom_attributes: null, order_quantity: 40, received_units: 0 });
describe('Snapshot forecast integrity', () => {
    it('offsets only incoming orders recorded to arrive before stockout', () => {
        const data = snapshot(); data.incoming = [incoming('2026-10-30')];
        expect(analyzeForecastSnapshot(data).recommendations).toHaveLength(0);
        for (const date of [null, '2026-11-15', '2026-10-20']) {
            data.incoming = [incoming(date)];
            const rec = analyzeForecastSnapshot(data).recommendations[0];
            expect(rec.onOrder).toBe(0); expect(rec.blockedReason).toContain('arrival');
        }
    });
    it('keeps refund uncertainty visible even if no completed sales remain', () => {
        const data = snapshot(); data.demand = [{ sku: 'SKU1', age_days: 1, units: 0, refund_uncertain: true }];
        const rec = analyzeForecastSnapshot(data).recommendations[0];
        expect(rec.blockedReason).toContain('Refunded receipts'); expect(rec.suggestedBuySellable).toBe(0);
    });
    it('blocks conflicting lot policies independent of stock and input ordering', () => {
        const data = snapshot(); data.products = [{ ...product, id: 'p2', stock: 100, minStock: 20 }, product];
        expect(analyzeForecastSnapshot(data).recommendations[0].blockedReason).toContain('conflicting');
        data.products.reverse(); expect(analyzeForecastSnapshot(data).recommendations[0].blockedReason).toContain('conflicting');
    });
    it('uses the same bulk and explicit single conversion in forecast and receipts', () => {
        for (const p of [{ ...product, size: '500', unit: 'G', packQuantity: 6, customAttributes: { physical: { unit: 'g' }, packaging: { packQty: 6 } } }, { ...product, packQuantity: 6, customAttributes: { packaging: { packagingLevel: 'single', packQty: 6 } } }]) {
            expect(convertToSellableUnits(2, p)).toBe(productOrderUnits(p) * 2);
        }
    });
    it('exposes whole merchandising values and blocks fractional packaging', () => {
        const data = snapshot(); data.products = [{ ...product, costPrice: 5.7, unit: 'KG', size: '500', customAttributes: { physical: { unit: 'g' } } }];
        const rec = analyzeForecastSnapshot(data).recommendations[0];
        expect(rec.blockedReason).toContain('fractional');
        for (const value of [rec.dailyRunRate, rec.predictedDemand30d, rec.unitCost, rec.orderUnitCost, rec.totalCost, rec.suggestedBuySellable]) expect(Number.isInteger(value)).toBe(true);
    });
});
