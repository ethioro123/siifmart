export interface DepartmentBudgetRecord {
    id: string;
    countryCode: string;
    siteId: string;
    department: string;
    category: string;
    fiscalYear: number;
    fiscalQuarter: number;
    budgetedAmount: number;
    actualSpent: number;
    alertThresholdPct: number;
    approvedById?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type TenderReconciliationStatus = 'Matched' | 'Variance_Flagged' | 'Reconciled' | 'Investigation';

export interface TenderReconciliationRecord {
    id: string;
    countryCode: string;
    siteId: string;
    reconciliationDate: string;
    tenderType: 'Telebirr' | 'CBE_Birr' | 'M_Pesa' | 'Card' | 'Cash';
    posReportedAmount: number;
    statementAmount: number;
    variance: number;
    feeDeductions: number;
    status: TenderReconciliationStatus;
    statementReference?: string;
    reconciledById?: string;
    reconciledByName?: string;
    reconciledAt?: string;
    notes?: string;
    createdAt?: string;
}
