import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generalLedgerService } from '../../services/general-ledger.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

describe('General Ledger & Period Close Governance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects posting journal entries to a closed/locked fiscal period', async () => {
        vi.spyOn(generalLedgerService, 'getPeriodStatus').mockResolvedValue({
            periodKey: '2026-09',
            countryCode: 'ET',
            status: 'Closed',
            openedAt: '2026-09-01T00:00:00Z',
            closedAt: '2026-09-30T23:59:59Z'
        });

        await expect(
            generalLedgerService.postJournalEntry(
                {
                    entryNumber: 'JE-202609-001',
                    entryDate: '2026-09-25',
                    periodKey: '2026-09',
                    countryCode: 'ET',
                    siteId: 'ST-001',
                    sourceModule: 'Expenses',
                    memo: 'Backdated Expense Entry',
                    totalDebit: 5000,
                    totalCredit: 5000,
                    lines: [
                        { accountCode: '6010', accountName: 'Rent', debit: 5000, credit: 0 },
                        { accountCode: '1030', accountName: 'Bank', debit: 0, credit: 5000 }
                    ]
                },
                { id: 'EMP-01', name: 'Accountant' }
            )
        ).rejects.toThrow('Period Close Lock: Fiscal period 2026-09 is Closed.');
    });

    it('rejects unbalanced journal entries where Debits != Credits', async () => {
        vi.spyOn(generalLedgerService, 'getPeriodStatus').mockResolvedValue({
            periodKey: '2026-10',
            countryCode: 'ET',
            status: 'Open',
            openedAt: '2026-10-01T00:00:00Z'
        });

        await expect(
            generalLedgerService.postJournalEntry(
                {
                    entryNumber: 'JE-202610-002',
                    entryDate: '2026-10-04',
                    periodKey: '2026-10',
                    countryCode: 'ET',
                    siteId: 'ST-001',
                    sourceModule: 'Manual',
                    memo: 'Unbalanced entry attempt',
                    totalDebit: 5000,
                    totalCredit: 4000, // Debits != Credits!
                    lines: [
                        { accountCode: '6010', accountName: 'Rent', debit: 5000, credit: 0 },
                        { accountCode: '1030', accountName: 'Bank', debit: 0, credit: 4000 }
                    ]
                },
                { id: 'EMP-01', name: 'Accountant' }
            )
        ).rejects.toThrow('Unbalanced Journal Entry: Total Debits (5000) must equal Total Credits (4000).');
    });
});
