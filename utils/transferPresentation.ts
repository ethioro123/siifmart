/** Presentation only: never infer custody completion from a later-looking label. */
export function effectiveTransferStatus(parent = 'Requested', dispatch?: string): string {
    const rank: Record<string, number> = { Draft: -1, Requested: 0, Approved: 1, Picking: 2, Picked: 3, Packed: 4, Shipped: 5, Dispatched: 5, 'In-Transit': 6, Delivered: 7, Received: 8 };
    if (!(parent in rank) || !dispatch || !(dispatch in rank)) return parent;
    return rank[dispatch] > rank[parent] ? dispatch : parent;
}
export function transferStatusTone(status: string): 'warning' | 'info' | 'success' | 'danger' | 'neutral' {
    if (['Rejected', 'Cancelled'].includes(status)) return 'danger';
    if (['Received', 'Completed'].includes(status)) return 'success';
    if (['Requested', 'Picking', 'Picked', 'Partially Delivered'].includes(status)) return 'warning';
    if (['Approved', 'Packed', 'Shipped', 'Dispatched', 'In-Transit', 'Delivered'].includes(status)) return 'info';
    return 'neutral';
}
export function transferStatusKey(status: string): string | undefined {
    const keys: Record<string, string> = {
        Draft: 'draft', Requested: 'requested', Approved: 'approved', Picking: 'picking', Picked: 'picked',
        Packed: 'packed', Shipped: 'shipped', 'In-Transit': 'inTransit', Delivered: 'delivered', Received: 'received',
        Completed: 'completed', Cancelled: 'cancelled', Rejected: 'rejected', Dispatched: 'dispatched', 'Partially Delivered': 'transferPartialDelivery'
    };
    return keys[status] ? `warehouse.${keys[status]}` : undefined;
}

export interface TransferEvidence {
    requestedAt?: string; createdAt?: string; created_at?: string;
    approvedAt?: string; approved_at?: string;
    shippedAt?: string; shipped_at?: string; dispatchedAt?: string; dispatched_at?: string;
    deliveredAt?: string; delivered_at?: string;
    receivedAt?: string; completedAt?: string; completed_at?: string;
    hasDiscrepancy?: boolean; discrepancyDetails?: string;
    discrepancyResolvedAt?: string; discrepancy_resolved_at?: string;
}
export function transferEvidenceEvents(record: TransferEvidence) {
    const observed = [
        { key: 'requested', at: record.requestedAt || record.createdAt || record.created_at },
        { key: 'approved', at: record.approvedAt || record.approved_at },
        { key: 'shipped', at: record.shippedAt || record.shipped_at || record.dispatchedAt || record.dispatched_at },
        { key: 'delivered', at: record.deliveredAt || record.delivered_at },
        { key: 'received', at: record.receivedAt },
        { key: 'completed', at: record.completedAt || record.completed_at },
        { key: 'transferExceptionResolved', at: record.discrepancyResolvedAt || record.discrepancy_resolved_at }
    ];
    return observed.filter((event): event is { key: string; at: string } => Boolean(event.at) && Number.isFinite(Date.parse(event.at!)))
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
