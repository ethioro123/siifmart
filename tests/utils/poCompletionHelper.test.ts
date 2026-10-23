import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAndSyncPOCompletion } from '../../components/fulfillment/receive/utils/poCompletionHelper';
import { purchaseOrdersService } from '../../services/supabase.service';
import type { PurchaseOrder, WMSJob } from '../../types';
vi.mock('../../services/supabase.service', () => ({ purchaseOrdersService: { completeFromPutaway: vi.fn(), getById: vi.fn(), receive: vi.fn() } }));
vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn() } }));
const po = { id: 'po', status: 'Approved', lineItems: [] } as unknown as PurchaseOrder;
function setup() {
    return { job: { id: 'job', orderRef: 'po', type: 'PUTAWAY' } as WMSJob, jobs: [], allOrders: [],
        setOrders: vi.fn(), setAllOrders: vi.fn(), addNotification: vi.fn(), getTranslation: () => 'PO {id} fully received' };
}
describe('PO completion uses server evidence, not cached manifests', () => {
    beforeEach(() => vi.clearAllMocks());
    it('syncs a server-confirmed status even when the local PO and job caches are empty', async () => {
        vi.mocked(purchaseOrdersService.completeFromPutaway).mockResolvedValue({ state: 'synced', po_id: 'po', po_number: 'AAAA0004', status: 'Received', changed: true });
        const params = setup(); await checkAndSyncPOCompletion(params);
        expect(params.setAllOrders.mock.calls[0][0]([po])[0].status).toBe('Received');
        expect(params.addNotification).toHaveBeenCalledWith('success', 'PO AAAA0004 fully received');
        expect(purchaseOrdersService.getById).not.toHaveBeenCalled();
        expect(purchaseOrdersService.receive).not.toHaveBeenCalled();
    });
    it.each(['awaiting_putaway', 'needs_review', 'not_found'] as const)('does not invent a local Received status for %s', async state => {
        vi.mocked(purchaseOrdersService.completeFromPutaway).mockResolvedValue({ state });
        const params = setup(); await checkAndSyncPOCompletion(params);
        expect(params.setAllOrders).not.toHaveBeenCalled();
        expect(params.addNotification).not.toHaveBeenCalledWith('success', expect.anything());
    });
    it('reports a sync failure without presenting already-saved Putaway as failed', async () => {
        vi.mocked(purchaseOrdersService.completeFromPutaway).mockRejectedValue(new Error('server unavailable'));
        const params = setup(); await checkAndSyncPOCompletion(params);
        expect(params.addNotification).toHaveBeenCalledWith('alert', expect.stringContaining('Putaway is saved'));
        expect(params.setAllOrders).not.toHaveBeenCalled();
    });
    it('does not repeat the received notification for an idempotent replay', async () => {
        vi.mocked(purchaseOrdersService.completeFromPutaway).mockResolvedValue({ state: 'synced', po_id: 'po', status: 'Received', changed: false });
        const params = setup(); await checkAndSyncPOCompletion(params);
        expect(params.addNotification).not.toHaveBeenCalled();
    });
});
