export type DrawerReconciliationStatus = 'Pending' | 'Reconciled' | 'Flagged' | 'Audited';

export interface DrawerReconciliationRecord {
    id: string;
    shiftNumber?: string;
    siteId: string;
    siteName?: string;
    countryCode: string;
    cashierId: string;
    cashierName: string;
    startTime: string;
    endTime?: string;
    openingFloat: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
    expenses: number;
    expectedCash: number;
    actualCash: number;
    variance: number;
    discrepancyReason?: string;
    status: 'Open' | 'Closed' | 'Audited' | 'Flagged';
    reconciliationStatus: DrawerReconciliationStatus;

    // Rule 18 "The Captain Owns the Ship" — Supervisory Co-Attribution
    supervisorId?: string;
    supervisorName?: string;
    supervisorCoSignNotes?: string;
    supervisorSignedAt?: string;

    // Finance Dual Sign-Off
    financeSignOffBy?: string;
    financeSignOffName?: string;
    financeSignOffAt?: string;
    varianceFlagged?: boolean;
    hqNotes?: string;
}

export interface DrawerAuditFilter {
    siteId?: string;
    countryCode?: string;
    startDate?: string;
    endDate?: string;
    status?: DrawerReconciliationStatus | 'All';
    onlyFlaggedVariances?: boolean;
}
