import type { JobItem, PurchaseOrder, User, WMSJob } from '../types';

export const DOCK_BAYS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'] as const;
export const DISPATCH_LEADERSHIP = ['super_admin', 'ceo', 'admin', 'manager', 'regional_manager',
    'operations_manager', 'warehouse_manager', 'logistics_manager', 'dispatch_manager',
    'dispatcher', 'fleet_maintenance_supervisor', 'regional_logistics_lead', 'supply_chain_manager'];

export type ShipmentPhase = 'not-ready' | 'ready' | 'in-transit' | 'awaiting-receipt' | 'closed' | 'cancelled';

export function canManageDispatch(role?: string | null): boolean {
    return DISPATCH_LEADERSHIP.includes(role?.trim().toLowerCase() || '');
}

export function isShipment(job: WMSJob): boolean {
    return job.type === 'DISPATCH' || job.type === 'DRIVER';
}

export function getShipmentPhase(job: WMSJob): ShipmentPhase {
    if (['Cancelled', 'Deleted'].includes(job.status) || ['Cancelled', 'Rejected'].includes(job.transferStatus || '')) return 'cancelled';
    if (['Received', 'Completed'].includes(job.transferStatus || '')) return 'closed';
    if (['Delivered', 'Partially Delivered'].includes(job.transferStatus || '')) return 'awaiting-receipt';
    if (job.status === 'Completed') return 'closed';
    if (['Shipped', 'In-Transit'].includes(job.transferStatus || '')) return 'in-transit';
    if (['Packed', 'Staged', 'Ready'].includes(job.transferStatus || '')) return 'ready';
    return 'not-ready';
}

export function getShipmentQuantity(item: JobItem): number {
    const quantities = [item.dispatchedQty, item.shippedQty, item.packedQty, item.pickedQty,
        item.expectedQty, item.quantity];
    return quantities.find(quantity => typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0) ?? 0;
}

export function getShipmentUnits(job: WMSJob): number {
    return job.lineItems?.length ? job.lineItems.reduce((sum, item) => sum + getShipmentQuantity(item), 0) : job.items || 0;
}

export function getDriverMissions(jobs: WMSJob[], user: User | null, employeeId?: string): WMSJob[] {
    if (!user) return [];
    const supervisor = canManageDispatch(user.role);
    return jobs.filter(job => isShipment(job) && job.deliveryMethod !== 'External' &&
        ['ready', 'in-transit'].includes(getShipmentPhase(job)) &&
        (supervisor || (Boolean(job.assignedTo) && [user.id, employeeId].includes(job.assignedTo))));
}

export function getShipmentDepartureError(job: WMSJob): string | null {
    if (!isShipment(job) || getShipmentPhase(job) !== 'ready') return 'Only packed shipments can depart.';
    if (!DOCK_BAYS.some(dock => job.location === `Dock ${dock}`)) return 'Load the shipment at an outbound dock first.';
    if (job.deliveryMethod === 'External') {
        return job.externalCarrierName?.trim() ? null : 'Enter the external carrier name first.';
    }
    return job.assignedTo ? null : 'Assign a verified driver before departure.';
}

export function isInboundPurchaseOrder(po: PurchaseOrder, siteId?: string): boolean {
    return Boolean(siteId && po.siteId === siteId && ['Approved', 'Ordered', 'Partially Received'].includes(po.status) &&
        po.lineItems?.some(item => item.quantity > (item.receivedQty || 0)));
}
