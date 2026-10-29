import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JobItem, WMSJob } from '../types';
import { wmsJobsService } from '../services/wms-jobs.service';
import { DOCK_BAYS, getShipmentDepartureError, getShipmentPhase, getShipmentQuantity, isShipment } from '../utils/shipmentWorkflow';

export type ShipmentAction =
    | { type: 'load'; dock: string }
    | { type: 'assign'; driverId: string }
    | { type: 'transport'; method: 'Internal' | 'External' }
    | { type: 'carrier'; name: string }
    | { type: 'unstage' }
    | { type: 'depart' }
    | { type: 'arrive'; delivered: number[]; note: string };

export function useShipmentWorkflow(onRefresh: () => Promise<void>) {
    const lock = useRef(false);
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ job, action }: { job: WMSJob; action: ShipmentAction }) => {
            if (!job.updatedAt) throw new Error(t('warehouse.driverHub.shipmentChanged'));
            if (!isShipment(job)) throw new Error('Use the transfer workflow for transfer requests.');
            const phase = getShipmentPhase(job);
            const updates: Partial<WMSJob> = {};
            if (action.type === 'arrive') {
                if (phase !== 'in-transit') throw new Error('Record departure before arrival.');
                if (!job.lineItems.length || action.delivered.length !== job.lineItems.length) throw new Error('The delivery manifest is incomplete.');
                const lineItems: JobItem[] = job.lineItems.map((item, index) => {
                    const quantity = action.delivered[index];
                    const dispatched = getShipmentQuantity(item);
                    if (!Number.isFinite(quantity) || quantity < 0 || quantity > dispatched) throw new Error('Arrival quantities must be between zero and the dispatched quantity.');
                    return { ...item, deliveredQty: quantity, undeliveredQty: dispatched - quantity };
                });
                const partial = lineItems.some(item => (item.undeliveredQty || 0) > 0);
                if (partial && !action.note.trim()) throw new Error('Explain the undelivered goods before recording arrival.');
                Object.assign(updates, { status: 'Completed', transferStatus: partial ? 'Partially Delivered' : 'Delivered',
                    deliveredAt: new Date().toISOString(), lineItems, hasDiscrepancy: partial,
                    notes: [job.notes, action.note.trim()].filter(Boolean).join('\n') });
            } else {
                if (phase !== 'ready') throw new Error('Only staged, packed shipments can be changed.');
                if (action.type === 'load') {
                    if (!DOCK_BAYS.some(dock => dock === action.dock)) throw new Error('Select a valid outbound dock.');
                    Object.assign(updates, { location: `Dock ${action.dock}`, status: 'In-Progress' });
                } else if (action.type === 'assign') {
                    Object.assign(updates, { assignedTo: action.driverId, deliveryMethod: 'Internal', externalCarrierName: '' });
                } else if (action.type === 'transport') {
                    Object.assign(updates, { deliveryMethod: action.method, assignedTo: '', externalCarrierName: '' });
                } else if (action.type === 'carrier') {
                    updates.externalCarrierName = action.name.trim();
                } else if (action.type === 'unstage') {
                    updates.location = 'Dispatch Bay';
                } else {
                    const error = getShipmentDepartureError(job);
                    if (error) throw new Error(error);
                    Object.assign(updates, { status: 'In-Progress', transferStatus: 'Shipped', location: 'In-Transit', shippedAt: new Date().toISOString() });
                }
            }
            // The database validates the actor/driver and synchronizes linked records in one transaction.
            if (lock.current) throw new Error('A shipment action is already being saved.');
            lock.current = true;
            try { return await wmsJobsService.update(job.id, updates, job.updatedAt); }
            catch (error) {
                if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') throw new Error(t('warehouse.driverHub.shipmentChanged'));
                throw error;
            }
            finally { lock.current = false; }
        },
        onSuccess: async () => {
            const results = await Promise.allSettled([
                queryClient.invalidateQueries({ queryKey: ['jobs'] }),
                queryClient.invalidateQueries({ queryKey: ['transfers'] }),
                onRefresh()
            ]);
            for (const result of results) if (result.status === 'rejected') logger.error('ShipmentWorkflow', 'Shipment saved but refresh failed', result.reason);
        }
    });
}
