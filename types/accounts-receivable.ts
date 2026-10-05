export type ArInvoiceStatus = 'Draft' | 'Sent' | 'Partially_Paid' | 'Paid' | 'Overdue' | 'Disputed' | 'Voided';

export interface ArInvoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    siteId: string;
    countryCode: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    currency: string;
    paymentTerms: 'Due_on_Receipt' | 'Net_15' | 'Net_30' | 'Net_60';
    status: ArInvoiceStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerCreditLimit {
    customerId: string;
    customerName: string;
    creditLimit: number;
    currentOutstanding: number;
    availableCredit: number;
    isHold: boolean;
    holdReason?: string;
    countryCode: string;
}

export interface ArAgingReport {
    current: number;       // 0-30 days
    days31to60: number;    // 31-60 days
    days61to90: number;    // 61-90 days
    days90Plus: number;    // >90 days
    totalOutstanding: number;
}
