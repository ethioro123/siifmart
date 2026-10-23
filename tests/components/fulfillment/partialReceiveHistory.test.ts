import { describe, it, expect } from 'vitest';
import { buildPartialReceiveEntries, canViewReceiveVariance } from '../../../components/fulfillment/receive/partialReceiveHistory';

const po = (over: any = {}) => ({
    id: 'po1', poNumber: 'AAAA0004', status: 'Approved',
    lineItems: [{ sku: 'ETBB002', quantity: 24, packQuantity: 10, receivedQty: 0 }],
    ...over
}) as any;
const job = (id: string, qty: number) => ({
    id, type: 'PUTAWAY', orderRef: 'po1', status: 'Pending',
    lineItems: [{ sku: 'ETBB002', name: 'MoliCare', expectedQty: qty }]
}) as any;

describe('buildPartialReceiveEntries', () => {
    it('creates one entry per batch and counts duplicated jobs once', () => {
        const entries = buildPartialReceiveEntries([po()], [[job('j1', 180)], [job('j1', 180)]], false);
        expect(entries).toHaveLength(1);
        expect(entries[0].countedQty).toBe(180);
    });

    it('hides ordered quantity and variance from non-review roles', () => {
        const [e] = buildPartialReceiveEntries([po()], [[job('j1', 180)]], false);
        expect(e.orderedQty).toBeUndefined();
        expect(e.variance).toBeUndefined();
    });

    it('shows PO-level variance across batches to review roles', () => {
        const entries = buildPartialReceiveEntries([po()], [[job('j1', 100), job('j2', 80)]], true);
        expect(entries).toHaveLength(2);
        expect(entries[0].orderedQty).toBe(240);
        expect(entries[0].variance).toBe(60);
    });

    it('skips finished POs', () => {
        expect(buildPartialReceiveEntries([po({ status: 'Received' })], [[job('j1', 240)]], false)).toHaveLength(0);
    });

    it('limits variance visibility to review roles', () => {
        expect(canViewReceiveVariance('warehouse_manager')).toBe(true);
        expect(canViewReceiveVariance('receiver')).toBe(false);
    });
});
