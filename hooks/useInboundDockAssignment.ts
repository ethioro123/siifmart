import { useRef } from 'react';
import { logger } from '../utils/logger';
import { useMutation } from '@tanstack/react-query';
import type { PurchaseOrder } from '../types';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import { DOCK_BAYS, isInboundPurchaseOrder } from '../utils/shipmentWorkflow';

export function useInboundDockAssignment(siteId: string | undefined, refresh: () => Promise<void>) {
    const lock = useRef(false);
    return useMutation({
        mutationFn: async ({ order, dock }: { order: PurchaseOrder; dock: string }) => {
            if (!isInboundPurchaseOrder(order, siteId) || (dock !== '' && !DOCK_BAYS.some(bay => bay === dock))) {
                throw new Error('Select an outstanding purchase order for this receiving site and a valid dock.');
            }
            if (lock.current) throw new Error('A dock assignment is already being saved.');
            lock.current = true;
            try { return await purchaseOrdersService.update(order.id, { dockSlot: dock }); }
            finally { lock.current = false; }
        },
        onSuccess: async () => {
            try { await refresh(); } catch (error) { logger.error('InboundDock', 'Assignment saved but refresh failed', error); }
        }
    });
}
