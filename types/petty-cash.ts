export type PettyCashReplenishStatus = 'Requested' | 'Approved' | 'Disbursed' | 'Rejected';

export interface PettyCashAccount {
    id: string;
    siteId: string;
    siteName?: string;
    countryCode: string;
    currency: string;
    authorizedFloat: number;
    currentBalance: number;
    custodianId: string;
    custodianName: string;
    lastReplenishedAt?: string;
}

export interface PettyCashVoucher {
    id: string;
    voucherNumber: string;
    siteId: string;
    countryCode: string;
    voucherDate: string;
    category: 'Local_Transit' | 'Cleaning_Supplies' | 'Emergency_Repairs' | 'Water_Tea' | 'Other';
    description: string;
    amount: number;
    receiptAttached: boolean;
    paidTo: string;
    approvedById?: string;
    approvedByName?: string;
    createdById: string;
    createdByName: string;
    status: 'Pending' | 'Approved' | 'Voided';
}

export interface PettyCashReplenishment {
    id: string;
    requestNumber: string;
    siteId: string;
    countryCode: string;
    amountRequested: number;
    amountApproved?: number;
    currentFloatBalance: number;
    status: PettyCashReplenishStatus;
    requestedById: string;
    requestedByName: string;
    approvedById?: string;
    approvedByName?: string;
    paymentRef?: string;
    notes?: string;
    createdAt?: string;
}
