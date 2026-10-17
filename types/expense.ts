export type ExpenseStatus = 'Draft' | 'Pending' | 'Approved' | 'Paid' | 'Voided' | 'Rejected' | 'Overdue';

export type ExpenseCategory =
    | 'Rent'
    | 'Utilities'
    | 'Marketing'
    | 'Maintenance'
    | 'Software'
    | 'Salaries'
    | 'Logistics'
    | 'Packaging'
    | 'Legal_Audit'
    | 'Other';

export interface ExpenseRecord {
    id: string;
    siteId: string;
    site_id?: string;
    countryCode?: string;
    country_code?: string;
    date: string;
    expense_date?: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    status: ExpenseStatus;

    // Maker / Checker & Zero-Trust Audit Trail
    createdById?: string;
    created_by_id?: string;
    createdByName?: string;
    created_by_name?: string;

    approvedById?: string;
    approved_by_id?: string;
    approvedBy?: string;
    approved_by?: string;
    approvedAt?: string;
    approved_at?: string;

    // Soft-Void Audit (No Hard Deletes)
    voidReason?: string;
    void_reason?: string;
    voidedById?: string;
    voided_by_id?: string;
    voidedByName?: string;
    voided_by_name?: string;
    voidedAt?: string;
    voided_at?: string;

    // Settlement Reference
    paymentRef?: string;
    payment_ref?: string;

    // CEO Escalation Governance (Country threshold gating)
    escalatedToCeo?: boolean;
    escalated_to_ceo?: boolean;
    escalationReason?: string;
    escalation_reason?: string;

    // Regional Governance & HQ Escalation
    regionCode?: string;
    region_code?: string;
    requiresHqApproval?: boolean;
    requires_hq_approval?: boolean;
    hqApprovedBy?: string;
    hq_approved_by?: string;
    hqApprovedAt?: string;
    hq_approved_at?: string;

    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
}

export interface ExpenseThresholdConfig {
    countryCode: string;
    ceoApprovalThreshold: number; // e.g. 50,000 ETB or 50,000 KSh
    requirePaymentRef: boolean;
    autoFlagAnomalousVariance: boolean;
}
