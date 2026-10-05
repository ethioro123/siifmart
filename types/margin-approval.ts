export interface MarginApprovalRequest {
    id: string;
    requestNumber: string;
    productId: string;
    productName: string;
    sku: string;
    siteId?: string;
    countryCode: string;
    costPrice: number;
    proposedRetailPrice: number;
    proposedMarginPct: number;
    targetMarginPct: number;
    marginVariancePct: number; // e.g. -8.5% below target
    status: 'Pending' | 'Approved' | 'Rejected';
    requestedById: string;
    requestedByName: string;
    reason: string;
    approvedById?: string;
    approvedByName?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt?: string;
}
