import { WMSJob, PurchaseOrder } from '../../../types';
import { convertToSellableUnits } from '../../procurement/utils';

/** Roles that review variance and may see ordered quantities in receive history. */
export const RECEIVE_VARIANCE_VIEW_ROLES = [
    'group_ceo',
    'country_managing_director',
    'country_operations_director',
    'warehouse_manager',
    'inventory_manager'
];

export const canViewReceiveVariance = (role?: string) =>
    RECEIVE_VARIANCE_VIEW_ROLES.includes(String(role || '').toLowerCase());

export interface PartialReceiveEntry {
    job: WMSJob;
    po: PurchaseOrder;
    countedQty: number;
    isComplete: boolean;
    /** Only populated for roles allowed to see ordered quantity */
    orderedQty?: number;
    variance?: number;
}

const isPOFinished = (po: PurchaseOrder) => {
    const lines = po.lineItems || [];
    const allReceived = lines.length > 0 &&
        lines.every(li => (li.receivedQty || 0) >= convertToSellableUnits(li.quantity, li));
    return allReceived || po.status === 'Received' || (po.status as string) === 'Closed';
};

/**
 * One entry per receive batch (PUTAWAY job) for POs that are not finished yet.
 * Each job is counted once even if it appears in both active and historical lists.
 * Ordered quantity and variance are attached only when `includeOrdered` is true.
 */
export function buildPartialReceiveEntries(
    orders: PurchaseOrder[],
    jobLists: WMSJob[][],
    includeOrdered: boolean
): PartialReceiveEntry[] {
    const seen = new Set<string>();
    const entries: PartialReceiveEntry[] = [];

    for (const job of jobLists.flat()) {
        if (!job || job.type !== 'PUTAWAY' || !job.id || seen.has(job.id)) continue;
        seen.add(job.id);

        const po = orders.find(o =>
            o.id === job.orderRef || (o.poNumber && o.poNumber === job.orderRef) || ((o as any).po_number && (o as any).po_number === job.orderRef));
        if (!po || isPOFinished(po)) continue;

        const countedQty = (job.lineItems || []).reduce(
            (sum: number, li: any) => sum + (Number(li.expectedQty ?? li.quantity) || 0), 0);

        entries.push({ job, po, countedQty, isComplete: false });
    }

    if (includeOrdered) {
        // Variance is PO-level: ordered minus everything counted so far across all batches of the line.
        const countedByLine = new Map<string, number>();
        const lineKey = (e: PartialReceiveEntry) => `${e.po.id}|${(e.job.lineItems?.[0] as any)?.sku || ''}`;
        entries.forEach(e => countedByLine.set(lineKey(e), (countedByLine.get(lineKey(e)) || 0) + e.countedQty));
        entries.forEach(e => {
            const sku = (e.job.lineItems?.[0] as any)?.sku;
            const line = (e.po.lineItems || []).find(li => li.sku === sku) || e.po.lineItems?.[0];
            if (!line) return;
            e.orderedQty = convertToSellableUnits(line.quantity, line);
            e.variance = e.orderedQty - (countedByLine.get(lineKey(e)) || 0);
        });
    }
    return entries;
}
