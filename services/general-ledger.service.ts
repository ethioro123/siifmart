import { supabase } from '../lib/supabase';
import type {
    AccountRecord,
    JournalEntry,
    JournalLine,
    FiscalPeriod,
    TrialBalanceRow
} from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

export const STANDARD_CHART_OF_ACCOUNTS: Omit<AccountRecord, 'countryCode'>[] = [
    { code: '1010', name: 'Cash in Register Drawer', category: 'Asset', normalBalance: 'Debit', isActive: true },
    { code: '1020', name: 'Mobile Money Clearing (Telebirr / M-Pesa)', category: 'Asset', normalBalance: 'Debit', isActive: true },
    { code: '1030', name: 'Commercial Bank Account', category: 'Asset', normalBalance: 'Debit', isActive: true },
    { code: '1200', name: 'Merchandise Inventory Asset', category: 'Asset', normalBalance: 'Debit', isActive: true },
    { code: '2010', name: 'Accounts Payable (Trade)', category: 'Liability', normalBalance: 'Credit', isActive: true },
    { code: '2020', name: 'VAT / Tax Payable to Authority', category: 'Liability', normalBalance: 'Credit', isActive: true },
    { code: '2030', name: 'Accrued Payroll & Wage Liabilities', category: 'Liability', normalBalance: 'Credit', isActive: true },
    { code: '3010', name: 'Retained Earnings / Enterprise Capital', category: 'Equity', normalBalance: 'Credit', isActive: true },
    { code: '4010', name: 'Retail Store Sales Revenue', category: 'Revenue', normalBalance: 'Credit', isActive: true },
    { code: '5010', name: 'Cost of Goods Sold (Inventory Depletion)', category: 'COGS', normalBalance: 'Debit', isActive: true },
    { code: '6010', name: 'Store & Warehouse Rent Expense', category: 'Expense', normalBalance: 'Debit', isActive: true },
    { code: '6020', name: 'Utilities & Power Expense', category: 'Expense', normalBalance: 'Debit', isActive: true },
    { code: '6030', name: 'Staff Salaries & Benefits Expense', category: 'Expense', normalBalance: 'Debit', isActive: true },
    { code: '6040', name: 'Repairs & Maintenance Expense', category: 'Expense', normalBalance: 'Debit', isActive: true },
    { code: '6050', name: 'Marketing & Promotions Expense', category: 'Expense', normalBalance: 'Debit', isActive: true },
    { code: '6090', name: 'General & Administrative OpEx', category: 'Expense', normalBalance: 'Debit', isActive: true }
];

export const generalLedgerService = {
    /**
     * Get chart of accounts for country
     */
    async getChartOfAccounts(countryCode: string = 'ET'): Promise<AccountRecord[]> {
        try {
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('*')
                .eq('country_code', countryCode)
                .order('code', { ascending: true });

            if (error || !data || data.length === 0) {
                // Return standard COA formatted with active country
                return STANDARD_CHART_OF_ACCOUNTS.map(acc => ({
                    ...acc,
                    countryCode
                }));
            }

            return data.map((d: any) => ({
                code: d.code,
                name: d.name,
                category: d.category,
                subCategory: d.sub_category,
                normalBalance: d.normal_balance,
                countryCode: d.country_code,
                isActive: d.is_active
            }));
        } catch (error) {
            logger.error('generalLedgerService', 'getChartOfAccounts fallback:', error);
            return STANDARD_CHART_OF_ACCOUNTS.map(acc => ({ ...acc, countryCode }));
        }
    },

    /**
     * Get status of fiscal period
     */
    async getPeriodStatus(periodKey: string, countryCode: string = 'ET'): Promise<FiscalPeriod> {
        try {
            const { data, error } = await supabase
                .from('fiscal_periods')
                .select('*')
                .eq('period_key', periodKey)
                .eq('country_code', countryCode)
                .single();

            if (error || !data) {
                return {
                    periodKey,
                    countryCode,
                    status: 'Open',
                    openedAt: new Date().toISOString()
                };
            }

            return {
                periodKey: data.period_key,
                countryCode: data.country_code,
                status: data.status,
                openedAt: data.opened_at,
                closedAt: data.closed_at,
                closedById: data.closed_by_id,
                closedByName: data.closed_by_name,
                lockReason: data.lock_reason
            };
        } catch {
            return {
                periodKey,
                countryCode,
                status: 'Open',
                openedAt: new Date().toISOString()
            };
        }
    },

    /**
     * Post a balanced double-entry journal entry with Period Close Verification
     */
    async postJournalEntry(
        entry: Omit<JournalEntry, 'id' | 'isBalanced' | 'isPosted' | 'createdAt'>,
        creator: { id: string; name: string }
    ): Promise<JournalEntry> {
        // 1. Period Close Lock Verification
        const period = await this.getPeriodStatus(entry.periodKey, entry.countryCode);
        if (period.status === 'Closed' || period.status === 'Locked') {
            throw new Error(`Period Close Lock: Fiscal period ${entry.periodKey} is ${period.status}. Posting new transactions is strictly blocked.`);
        }

        // 2. Debits = Credits verification
        const totalDebit = entry.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
        const totalCredit = entry.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.009) {
            throw new Error(`Unbalanced Journal Entry: Total Debits (${totalDebit}) must equal Total Credits (${totalCredit}).`);
        }

        const dbEntry = {
            entry_number: entry.entryNumber,
            entry_date: entry.entryDate,
            period_key: entry.periodKey,
            country_code: entry.countryCode,
            site_id: entry.siteId,
            source_module: entry.sourceModule,
            source_reference_id: entry.sourceReferenceId || null,
            memo: entry.memo,
            total_debit: totalDebit,
            total_credit: totalCredit,
            is_balanced: true,
            is_posted: true,
            created_by_id: creator.id
        };

        const { data: headerData, error: headerError } = await supabase
            .from('journal_entries')
            .insert(dbEntry)
            .select()
            .single();

        if (headerError) {
            logger.error('generalLedgerService', 'postJournalEntry header error:', headerError);
            throw headerError;
        }

        const lineRows = entry.lines.map(line => ({
            journal_id: headerData.id,
            account_code: line.accountCode,
            account_name: line.accountName,
            debit: line.debit,
            credit: line.credit,
            description: line.description || entry.memo
        }));

        const { error: lineError } = await supabase
            .from('journal_lines')
            .insert(lineRows);

        if (lineError) {
            logger.error('generalLedgerService', 'postJournalEntry lines error:', lineError);
            throw lineError;
        }

        await systemLogsService.create({
            user_name: creator.name,
            action: 'JOURNAL_ENTRY_POSTED',
            module: 'Financials',
            details: `Posted Journal Entry ${entry.entryNumber} (${entry.sourceModule}) for ${totalDebit} ${entry.countryCode}. Memo: "${entry.memo}".`
        });

        return {
            id: headerData.id,
            entryNumber: headerData.entry_number,
            entryDate: headerData.entry_date,
            periodKey: headerData.period_key,
            countryCode: headerData.country_code,
            siteId: headerData.site_id,
            sourceModule: headerData.source_module,
            sourceReferenceId: headerData.source_reference_id,
            memo: headerData.memo,
            totalDebit: Number(headerData.total_debit),
            totalCredit: Number(headerData.total_credit),
            isBalanced: true,
            isPosted: true,
            createdById: headerData.created_by_id,
            lines: entry.lines,
            createdAt: headerData.created_at
        };
    },

    /**
     * Compute Trial Balance across accounts
     */
    async getTrialBalance(periodKey?: string, countryCode: string = 'ET'): Promise<TrialBalanceRow[]> {
        const coa = await this.getChartOfAccounts(countryCode);

        let query = supabase
            .from('journal_lines')
            .select('account_code, debit, credit, journal_entries!inner(country_code, period_key)')
            .eq('journal_entries.country_code', countryCode);

        if (periodKey) {
            query = query.eq('journal_entries.period_key', periodKey);
        }

        const { data, error } = await query;
        if (error) {
            logger.error('generalLedgerService', 'getTrialBalance failed:', error);
            return coa.map(acc => ({
                accountCode: acc.code,
                accountName: acc.name,
                category: acc.category,
                debitTotal: 0,
                creditTotal: 0,
                netBalance: 0
            }));
        }

        const totalsByAccount = new Map<string, { debit: number; credit: number }>();
        (data || []).forEach((row: any) => {
            const current = totalsByAccount.get(row.account_code) || { debit: 0, credit: 0 };
            totalsByAccount.set(row.account_code, {
                debit: current.debit + (Number(row.debit) || 0),
                credit: current.credit + (Number(row.credit) || 0)
            });
        });

        return coa.map(acc => {
            const totals = totalsByAccount.get(acc.code) || { debit: 0, credit: 0 };
            const net = acc.normalBalance === 'Debit'
                ? totals.debit - totals.credit
                : totals.credit - totals.debit;

            return {
                accountCode: acc.code,
                accountName: acc.name,
                category: acc.category,
                debitTotal: totals.debit,
                creditTotal: totals.credit,
                netBalance: net
            };
        });
    },

    /**
     * Close and Lock Fiscal Period
     */
    async closeFiscalPeriod(
        periodKey: string,
        countryCode: string,
        user: { id: string; name: string },
        reason: string
    ): Promise<FiscalPeriod> {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('fiscal_periods')
            .upsert({
                period_key: periodKey,
                country_code: countryCode,
                status: 'Closed',
                closed_at: now,
                closed_by_id: user.id,
                closed_by_name: user.name,
                lock_reason: reason
            })
            .select()
            .single();

        if (error) {
            logger.error('generalLedgerService', 'closeFiscalPeriod failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: user.name,
            action: 'FISCAL_PERIOD_CLOSED',
            module: 'Financials',
            details: `Fiscal period ${periodKey} (${countryCode}) closed by ${user.name}. Reason: "${reason}".`
        });

        return {
            periodKey: data.period_key,
            countryCode: data.country_code,
            status: data.status,
            openedAt: data.opened_at,
            closedAt: data.closed_at,
            closedById: data.closed_by_id,
            closedByName: data.closed_by_name,
            lockReason: data.lock_reason
        };
    }
};
