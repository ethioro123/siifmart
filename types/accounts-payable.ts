export type InvoiceMatchStatus =
    | 'Pending_Match'
    | 'Matched'
    | 'Discrepancy_Quantity'
    | 'Discrepancy_Price'
    | 'Manual_Override'
    | 'Rejected';

export type InvoicePaymentStatus =
    | 'Draft'
    | 'Pending_Approval'
    | 'Approved'
    | 'Partially_Paid'
    | 'Paid'
    | 'Voided'
    | 'Disputed';

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    productId: string;
    sku?: string;
    itemName: string;
    poQuantity: number;
    receivedQuantity: number;
    invoicedQuantity: number;
    poUnitPrice: number;
    invoicedUnitPrice: number;
    taxRate: number;
    totalPrice: number;
    matchVariancePct: number;
}

export interface VendorInvoice {
    id: string;
    invoiceNumber: string;
    vendorId: string;
    vendorName: string;
    poId?: string;
    poNumber?: string;
    receivingRecordId?: string;
    receivingManifestNumber?: string;
    siteId: string;
    countryCode: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    currency: string;
    matchStatus: InvoiceMatchStatus;
    matchDiscrepancyNotes?: string;
    status: InvoicePaymentStatus;
    items?: InvoiceItem[];
    createdById?: string;
    approvedById?: string;
    approvedAt?: string;
    overrideReason?: string;
    paymentRunId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentRun {
    id: string;
    runNumber: string;
    countryCode: string;
    currency: string;
    totalInvoices: number;
    totalAmount: number;
    status: 'Draft' | 'Pending_Approval' | 'Approved' | 'Processing' | 'Completed' | 'Cancelled';
    createdById?: string;
    createdByName?: string;
    approvedById?: string;
    approvedByName?: string;
    approvedAt?: string;
    bankReference?: string;
    paymentChannel: 'Bank_Transfer' | 'Telebirr' | 'CBE_Birr' | 'M_Pesa' | 'Check';
    notes?: string;
    invoices?: VendorInvoice[];
    createdAt?: string;
    updatedAt?: string;
}
