import { describe, expect, it } from 'vitest';
import type { Product } from '../../types';
import {
    buildTransferLineItem,
    getTransferQuantityConfig,
    getTransferRemainingStock,
    formatTransferStock,
    normalizeTransferEntry,
    toTransferStockQuantity
} from '../../components/fulfillment/transfer/transferQuantity';
import { mapWmsJobRow } from '../../services/wms-jobs.mapper';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 'product-1',
    siteId: 'warehouse-1',
    name: 'Cooking Oil',
    category: 'Grocery',
    price: 10,
    stock: 20,
    sku: 'OIL-1',
    image: '',
    status: 'active',
    ...overrides
});

describe('Fulfilment transfer quantity units', () => {
    it('uses product-specific count units for packaged products', () => {
        const config = getTransferQuantityConfig(makeProduct({ unit: 'CASE', packQuantity: 12, packageType: 'Case' }));
        expect(config.quantityLabel).toBe('cs');
        expect(config.step).toBe(1);
        expect(config.allowDecimal).toBe(false);
    });

    it('converts packaged weight requests and remaining stock into the same measure', () => {
        const product = makeProduct({ unit: 'KG', size: '500' });
        expect(getTransferQuantityConfig(product).packageSize).toBe(0.5);
        expect(getTransferRemainingStock(10, 2, product, true)).toBe(3);
        expect(toTransferStockQuantity(2, product, true)).toBe(4);
        expect(formatTransferStock(10, product)).toContain('0.5kg');
    });

    it('allows unit-defined decimal steps for loose bulk products', () => {
        const product = makeProduct({ unit: 'KG', stock: 10 });
        const config = getTransferQuantityConfig(product);
        expect(config.isLooseMeasure).toBe(true);
        expect(config.quantityLabel).toBe('kg');
        expect(config.step).toBe(0.01);
        expect(normalizeTransferEntry('1.237', product)).toBe(1.24);
    });

    it('keeps unit and package attributes on transfer line items', () => {
        const product = makeProduct({ unit: 'CASE', packQuantity: 12, packageType: 'Case', customAttributes: { packaging: { caseSize: 12 } } });
        const lineItem = buildTransferLineItem(product, 3);
        expect(lineItem).toMatchObject({ unit: 'CASE', packQuantity: 12, packageType: 'Case', expectedQty: 3 });
        expect(lineItem.customAttributes).toEqual(product.customAttributes);
        expect(lineItem.requestedMeasureQty).toBeUndefined();
    });

    it('retains direct measure quantities for loose bulk transfers', () => {
        const lineItem = buildTransferLineItem(makeProduct({ unit: 'KG' }), 2.5);
        expect(lineItem).toMatchObject({ expectedQty: 2.5, requestedMeasureQty: 2.5 });
    });

    it('maps snake-case unit details from saved WMS line items', () => {
        const job = mapWmsJobRow({
            id: 'job-1',
            line_items: [{ package_type: 'Case', requested_measure_qty: 6, is_measure: true }]
        });
        expect(job.lineItems[0]).toMatchObject({ packageType: 'Case', requestedMeasureQty: 6, isMeasure: true });
    });
});
