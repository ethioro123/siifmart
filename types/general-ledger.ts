export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'COGS' | 'Expense';

export interface AccountRecord {
    code: string;
    name: string;
    category: AccountCategory;
    subCategory?: string;
    normalBalance: 'Debit' | 'Credit';
    countryCode: string;
    isActive: boolean;
}

export interface JournalLine {
    id?: string;
    journalId?: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description?: string;
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    entryDate: string;
    periodKey: string; // 'YYYY-MM'
    countryCode: string;
    siteId: string;
    sourceModule: 'POS' | 'Expenses' | 'AP' | 'Payroll' | 'Inventory' | 'Manual';
    sourceReferenceId?: string;
    memo: string;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    isPosted: boolean;
    createdById?: string;
    lines: JournalLine[];
    createdAt?: string;
}

export type FiscalPeriodStatus = 'Open' | 'Closing_Pending' | 'Closed' | 'Locked';

export interface FiscalPeriod {
    periodKey: string; // 'YYYY-MM'
    countryCode: string;
    status: FiscalPeriodStatus;
    openedAt: string;
    closedAt?: string;
    closedById?: string;
    closedByName?: string;
    lockReason?: string;
}

export interface TrialBalanceRow {
    accountCode: string;
    accountName: string;
    category: AccountCategory;
    debitTotal: number;
    creditTotal: number;
    netBalance: number;
}
