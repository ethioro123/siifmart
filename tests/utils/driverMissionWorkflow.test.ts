import { describe, expect, it } from 'vitest';
import type { PurchaseOrder, User, WMSJob } from '../../types';
import { canInspectTransferArrival, getDriverMissions, getShipmentDepartureError, getShipmentPhase, getShipmentUnits, isInboundPurchaseOrder } from '../../utils/shipmentWorkflow';

const driver: User = { id: 'driver-1', role: 'driver', name: 'Driver', avatar: '', title: 'Driver' };
const job = (overrides: Partial<WMSJob> = {}): WMSJob => ({
    id: 'shipment-1', siteId: 'origin', sourceSiteId: 'origin', destSiteId: 'destination',
    countryCode: 'KE', type: 'DISPATCH', status: 'Pending', priority: 'Normal',
    transferStatus: 'Packed', assignedTo: driver.id, items: 10, location: 'Dispatch Bay', orderRef: 'transfer-1',
    lineItems: [{ productId: 'product-1', sku: 'KE-FR001', name: 'Carrots', expectedQty: 10, pickedQty: 0, packedQty: 0, status: 'Pending' }],
    ...overrides
});

describe('shipment handoffs', () => {
    it('shows one delivery instead of its parent transfer and never offers an approved transfer for pickup', () => {
        expect(getDriverMissions([job({ type: 'TRANSFER', id: 'transfer-1' }), job(), job({ id: 'approved', type: 'TRANSFER', transferStatus: 'Approved' })], driver)).toEqual([job()]);
    });
    it('keeps unassigned, other-driver, and external-carrier missions out of the driver queue', () => {
        expect(getDriverMissions([job({ assignedTo: '' }), job({ assignedTo: 'driver-2' }), job({ deliveryMethod: 'External' })], driver)).toEqual([]);
    });
    it('lets dispatch leadership see transport at its origin, without mixing incoming deliveries', () => {
        const dispatcher = { ...driver, role: 'dispatcher' as const };
        expect(getDriverMissions([job(), job({ id: 'incoming', sourceSiteId: 'another-site' })], dispatcher, undefined, 'origin')).toEqual([job()]);
    });
    it('requires a dock and driver or named external carrier before departure', () => {
        expect(getShipmentDepartureError(job())).toContain('dock');
        expect(getShipmentDepartureError(job({ location: 'Dock D1', assignedTo: '' }))).toContain('verified driver');
        expect(getShipmentDepartureError(job({ location: 'Dock D1' }))).toBeNull();
        expect(getShipmentDepartureError(job({ location: 'Dock D1', deliveryMethod: 'External', externalCarrierName: '' }))).toContain('carrier');
        expect(getShipmentDepartureError(job({ location: 'Dock D1', deliveryMethod: 'External', externalCarrierName: 'Courier' }))).toBeNull();
    });
    it('distinguishes transport arrival from destination acceptance', () => {
        expect(getShipmentPhase(job({ status: 'Completed', transferStatus: 'Delivered' }))).toBe('awaiting-receipt');
        expect(getShipmentPhase(job({ status: 'Completed', transferStatus: 'Partially Delivered' }))).toBe('awaiting-receipt');
        expect(getShipmentPhase(job({ status: 'Completed', transferStatus: 'Received' }))).toBe('closed');
        expect(getShipmentPhase(job({ transferStatus: 'Rejected' }))).toBe('cancelled');
    });
    it('opens receiving only for an arrived transfer at the receiving site', () => {
        const arrived = job({ type: 'TRANSFER', transferStatus: 'Delivered' });
        expect(canInspectTransferArrival(arrived, 'receiver', 'destination')).toBe(true);
        expect(canInspectTransferArrival(arrived, 'warehouse_manager', 'origin')).toBe(false);
        expect(canInspectTransferArrival(arrived, 'driver', 'destination')).toBe(false);
        expect(canInspectTransferArrival({ ...arrived, transferStatus: 'Shipped' }, 'receiver', 'destination')).toBe(false);
    });
    it('counts physical quantities while respecting zero-valued reset pack fields', () => {
        expect(getShipmentUnits(job())).toBe(10);
        expect(getShipmentUnits(job({ lineItems: [
            { ...job().lineItems[0], expectedQty: 200 }, { ...job().lineItems[0], expectedQty: 53 }, { ...job().lineItems[0], expectedQty: 88 }
        ] }))).toBe(341);
        expect(getShipmentUnits(job({ lineItems: [{ ...job().lineItems[0], expectedQty: 0 }] }))).toBe(0);
    });
    it('retains outstanding partial purchase receipts only at the receiving site', () => {
        const po = { id: 'po-1', siteId: 'origin', status: 'Partially Received', lineItems: [{ quantity: 10, receivedQty: 4 }] } as PurchaseOrder;
        expect(isInboundPurchaseOrder(po, 'origin')).toBe(true);
        expect(isInboundPurchaseOrder(po, 'destination')).toBe(false);
        expect(isInboundPurchaseOrder({ ...po, status: 'Received' }, 'origin')).toBe(false);
        expect(isInboundPurchaseOrder({ ...po, lineItems: [{ ...po.lineItems[0], receivedQty: 10 }] }, 'origin')).toBe(false);
    });
});
