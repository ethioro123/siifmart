import { purchaseOrdersService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';
import { PurchaseOrder, WMSJob } from '../../../../types';

interface CheckPOCompletionParams {
    job: WMSJob;
    jobs: WMSJob[];
    orders?: PurchaseOrder[];
    allOrders: PurchaseOrder[];
    setOrders?: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    setAllOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    addNotification: (type: 'info' | 'success' | 'alert', message: string) => void;
    getTranslation: (key: string) => string;
}

/** The server checks all related jobs and audited quantities without exposing the blind PO manifest. */
export async function checkAndSyncPOCompletion({
    job, setOrders, setAllOrders, addNotification, getTranslation
}: CheckPOCompletionParams): Promise<void> {
    if (!job.orderRef) return;
    try {
        const result = await purchaseOrdersService.completeFromPutaway(job.id);
        if (result.state === 'awaiting_putaway') return;
        if (result.state !== 'synced' || !result.po_id || !result.status) {
            addNotification('alert', 'Putaway is saved. The linked PO receiving status needs warehouse review.');
            return;
        }
        const update = (previous: PurchaseOrder[]) => previous.map(po =>
            po.id === result.po_id ? { ...po, status: result.status! } : po);
        setOrders?.(update);
        setAllOrders(update);
        if (!result.changed) return;
        if (result.status === 'Received') {
            addNotification('success', getTranslation('warehouse.poFullyReceived').replace('{id}', result.po_number || result.po_id));
        } else {
            addNotification('info', `PO ${result.po_number || result.po_id} putaway is complete for a partial delivery.`);
        }
    } catch (error) {
        logger.error('useJobCompletion', 'Putaway saved; PO receipt synchronization failed', error as Error);
        addNotification('alert', 'Putaway is saved, but the linked PO receiving status could not be synchronized.');
    }
}
