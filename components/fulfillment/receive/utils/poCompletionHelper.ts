import { purchaseOrdersService } from '../../../../services/supabase.service';
import { convertToSellableUnits } from '../../../../components/procurement/utils';
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

/**
 * Validates whether all putaway jobs for a PO are complete AND verifies whether
 * the received quantity covers the entire order before marking the PO as Received.
 * Prevents partial/short shipments from prematurely closing the purchase order.
 */
export async function checkAndSyncPOCompletion({
    job,
    jobs,
    orders,
    allOrders,
    setOrders,
    setAllOrders,
    addNotification,
    getTranslation
}: CheckPOCompletionParams): Promise<void> {
    if (!job.orderRef) return;

    // Check all PUTAWAY jobs for this PO
    const allPutawayJobsForPO = jobs
        .filter(j => j.orderRef === job.orderRef && j.type === 'PUTAWAY')
        .map(j => j.id === job.id ? { ...j, status: 'Completed' as const } : j);

    const allPutawayJobsComplete = allPutawayJobsForPO.length > 0 &&
        allPutawayJobsForPO.every(j => j.status === 'Completed');

    if (!allPutawayJobsComplete) return;

    logger.debug('useJobCompletion', `All PUTAWAY jobs for PO ${job.orderRef} are complete. Checking quantities...`);

    // Lookup PO by ID or PO Number
    let targetPo = allOrders.find(o => o.id === job.orderRef || o.poNumber === job.orderRef || o.po_number === job.orderRef)
        || orders?.find(o => o.id === job.orderRef || o.poNumber === job.orderRef || o.po_number === job.orderRef);

    if (!targetPo) {
        try {
            targetPo = (await purchaseOrdersService.getById(job.orderRef)) || undefined;
        } catch { }
    }

    // Check whether the order is fully received or partial/short shipment
    const lineItems = targetPo?.lineItems || [];
    const isOrderFullyReceived = lineItems.length > 0 && lineItems.every(li => {
        const expectedSellable = convertToSellableUnits(li.quantity, li);
        return (li.receivedQty || 0) >= expectedSellable;
    });

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.orderRef || '');
    const poTargetId = isUUID ? job.orderRef : targetPo?.id;

    if (poTargetId) {
        try {
            const updatedPo = await purchaseOrdersService.receive(poTargetId, false);
            if (updatedPo) {
                if (setOrders) setOrders(prev => prev.map(o => (o.id === poTargetId || o.id === job.orderRef) ? updatedPo : o));
                setAllOrders(prev => prev.map(o => (o.id === poTargetId || o.id === job.orderRef) ? updatedPo : o));
                if (updatedPo.status === 'Received') {
                    addNotification('success', getTranslation('warehouse.poFullyReceived').replace('{id}', updatedPo.poNumber || job.orderRef || ''));
                } else {
                    addNotification('info', `PO ${updatedPo.poNumber || job.orderRef} putaway complete for partial delivery. Status: ${updatedPo.status}.`);
                }
            }
        } catch (err) {
            logger.error('useJobCompletion', `Failed to update PO status for ${job.orderRef}:`, err as Error);
        }
    } else {
        const newStatus = isOrderFullyReceived ? 'Received' : 'Partially Received';
        if (setOrders) setOrders(prev => prev.map(o => o.id === job.orderRef ? { ...o, status: newStatus } : o));
        setAllOrders(prev => prev.map(o => o.id === job.orderRef ? { ...o, status: newStatus } : o));
        if (newStatus === 'Received') {
            addNotification('success', getTranslation('warehouse.poReceivedLocalOnly').replace('{id}', job.orderRef || ''));
        } else {
            addNotification('info', `PO ${job.orderRef} partially received.`);
        }
    }
}
