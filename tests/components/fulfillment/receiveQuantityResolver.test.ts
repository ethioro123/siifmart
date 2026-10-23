import { describe, it, expect } from 'vitest';
import { buildPOJobsReceivedMap, resolvePOLineItemProgress } from '../../../components/fulfillment/receive/receiveQuantityResolver';

const job = (id: string, qty: number) => ({
    id,
    type: 'PUTAWAY',
    lineItems: [{ sku: 'ETBB002', productId: 'p1', name: 'MoliCare Diaper', expectedQty: qty }]
}) as any;

describe('receiveQuantityResolver', () => {
    it('counts a putaway job once even if it appears twice in client state', () => {
        const maps = buildPOJobsReceivedMap([job('j1', 180), job('j1', 180)]);
        expect(maps.skuMap['ETBB002']).toBe(180);
    });

    it('still sums distinct split jobs', () => {
        const maps = buildPOJobsReceivedMap([job('j1', 100), job('j2', 80)]);
        expect(maps.skuMap['ETBB002']).toBe(180);
        const progress = resolvePOLineItemProgress({ sku: 'ETBB002', quantity: 24, packQuantity: 10 }, maps, []);
        expect(progress.jobReceived).toBe(180);
    });
});
