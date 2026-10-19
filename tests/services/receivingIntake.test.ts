import { describe, it, expect, vi, beforeEach } from 'vitest';

const getBySKU = vi.fn();
const update = vi.fn();
const ensureTransferReceiptProduct = vi.fn();

vi.mock('../../services/supabase.service', () => ({
    productsService: { getBySKU, update, ensureTransferReceiptProduct }
}));

import { processReceivingStockIntake } from '../../components/pos-command/hooks/utils/receivingIntake';

const base = () => ({
    transferId: 'job-1',
    destSiteId: 'site-dest',
    transferReceivingItems: [{ sku: 'ETDY001', name: 'Milk', receivedQty: 4 }],
    // Branch users have an empty global product cache.
    allProducts: [] as any[],
    receiverName: 'Receiver',
    timestampStr: '2026-10-19T00:00:00.000Z',
    addNotification: vi.fn()
});

describe('transfer receipt stock intake', () => {
    beforeEach(() => {
        getBySKU.mockReset();
        update.mockReset();
        ensureTransferReceiptProduct.mockReset();
        update.mockResolvedValue({});
    });

    it('uses the existing destination product found on the server and never creates a duplicate', async () => {
        getBySKU.mockResolvedValue({ id: 'p1', stock: 10 });
        const res = await processReceivingStockIntake(base());

        expect(res.success).toBe(true);
        expect(ensureTransferReceiptProduct).not.toHaveBeenCalled();
        expect(update).toHaveBeenCalledWith('p1', expect.objectContaining({ stock: 14 }));
        expect(res.appliedItems).toEqual([{ productId: 'p1', previousStock: 10, addedQty: 4 }]);
    });

    it('asks the server to prepare a genuinely missing destination product, then adds stock', async () => {
        getBySKU.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'p2', stock: 0 });
        ensureTransferReceiptProduct.mockResolvedValue('p2');
        const res = await processReceivingStockIntake(base());

        expect(ensureTransferReceiptProduct).toHaveBeenCalledWith('job-1', 'ETDY001');
        expect(update).toHaveBeenCalledWith('p2', expect.objectContaining({ stock: 4 }));
        expect(res.success).toBe(true);
    });

    it('fails the item (halting the receipt) when the server refuses to prepare the product', async () => {
        getBySKU.mockResolvedValue(null);
        ensureTransferReceiptProduct.mockRejectedValue({ code: '42501' });
        const params = base();
        const res = await processReceivingStockIntake(params);

        expect(res.success).toBe(false);
        expect(res.failedItems).toEqual(['ETDY001']);
        expect(update).not.toHaveBeenCalled();
        expect(params.addNotification).toHaveBeenCalledWith('alert', expect.stringContaining('ETDY001'));
    });
});
