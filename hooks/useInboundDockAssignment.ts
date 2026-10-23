import { useMutation } from '@tanstack/react-query';
import type { PurchaseOrder } from '../types';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import { DOCK_BAYS, isInboundPurchaseOrder } from '../utils/shipmentWorkflow';

export function useInboundDockAssignment(siteId: string | undefined, refresh: () => Promise<void>) {
    return useMutation({
        mutationFn: async ({ order, dock }: { order: PurchaseOrder; dock: string }) => {
            if (!isInboundPurchaseOrder(order, siteId) || (dock !== '' && !DOCK_BAYS.some(bay => bay === dock))) {
                throw new Error('Select an outstanding purchase order for this receiving site and a valid dock.');
            }
            return purchaseOrdersService.update(order.id, { dockSlot: dock });
        },
        onSuccess: refresh
    });
}
