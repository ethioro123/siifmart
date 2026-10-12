import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pettyCashService } from '../../services/petty-cash.service';
import { budgetReconciliationService } from '../../services/budget-reconciliation.service';
import { marginApprovalService } from '../../services/margin-approval.service';
import { expensesService } from '../../services/expenses.service';
import { supabase } from '../../lib/supabase';
import { systemLogsService } from '../../services/system-logs.service';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

vi.mock('../../services/system-logs.service', () => ({
    systemLogsService: {
        create: vi.fn().mockResolvedValue({ id: 'LOG-TEST-02' })
    }
}));

describe('SIIFMART Finance - Operations, Float, Margins & Zero-Trust Governance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Petty Cash Float & Replenishment Lifecycle', () => {
        it('records petty cash voucher and executes balance decrement', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'PCV-001',
                            voucher_number: 'PCV-123456',
                            site_id: 'ST-001',
                            country_code: 'ET',
                            voucher_date: '2026-10-12',
                            category: 'Office Supplies',
                            description: 'Printer ink and reams',
                            amount: 1500,
                            receipt_attached: true,
                            paid_to: 'Bole Stationery',
                            status: 'Approved'
                        },
                        error: null
                    })
                })
            });

            (supabase.from as any).mockReturnValue({ insert: insertMock });
            (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

            const voucher = await pettyCashService.recordVoucher(
                {
                    siteId: 'ST-001',
                    countryCode: 'ET',
                    voucherDate: '2026-10-12',
                    category: 'Other',
                    description: 'Printer ink and reams',
                    amount: 1500,
                    receiptAttached: true,
                    paidTo: 'Bole Stationery',
                    createdById: 'EMP-CSH-01',
                    createdByName: 'Custody Officer'
                },
                { id: 'EMP-CSH-01', name: 'Custody Officer' }
            );

            expect(voucher.amount).toBe(1500);
            expect(voucher.receiptAttached).toBe(true);
            expect(supabase.rpc).toHaveBeenCalledWith('decrement_petty_cash_balance', {
                p_site_id: 'ST-001',
                p_amount: 1500
            });
            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PETTY_CASH_VOUCHER_ISSUED' })
            );
        });
    });

    describe('2. Payment Gateway & Tender Reconciliation', () => {
        it('computes tender variances and flags discrepancies exceeding threshold', async () => {
            const insertFlagged = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'TR-01',
                            tender_type: 'Telebirr',
                            pos_reported_amount: 50000,
                            statement_amount: 48000,
                            fee_deductions: 500,
                            variance: -2500,
                            status: 'Variance_Flagged'
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ insert: insertFlagged });

            const rec = await budgetReconciliationService.submitTenderReconciliation(
                {
                    countryCode: 'ET',
                    siteId: 'ST-001',
                    reconciliationDate: '2026-10-12',
                    tenderType: 'Telebirr',
                    posReportedAmount: 50000,
                    statementAmount: 48000,
                    feeDeductions: 500,
                    statementReference: 'TLB-OCT12-STMT'
                },
                { id: 'EMP-TR-01', name: 'Treasury Officer' }
            );

            expect(rec.status).toBe('Variance_Flagged');
            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'TENDER_VARIANCE_FLAGGED' })
            );
        });
    });

    describe('3. Margin Protection & Exception Approval', () => {
        it('submits low-margin approval request and processes managerial sign-off', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'MAR-001',
                            request_number: 'MAR-998877',
                            product_id: 'PROD-OIL-5L',
                            product_name: 'Sunflower Cooking Oil 5L',
                            sku: 'ET-OIL-01',
                            cost_price: 450,
                            proposed_retail_price: 470,
                            proposed_margin_pct: 4.25,
                            target_margin_pct: 12.0,
                            margin_variance_pct: -7.75,
                            status: 'Pending',
                            reason: 'Match competitor weekend promotion'
                        },
                        error: null
                    })
                })
            });
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'margin_approval_requests') {
                    return { insert: insertMock, update: updateMock };
                }
                return {};
            });

            const req = await marginApprovalService.createRequest(
                {
                    productId: 'PROD-OIL-5L',
                    productName: 'Sunflower Cooking Oil 5L',
                    sku: 'ET-OIL-01',
                    countryCode: 'ET',
                    costPrice: 450,
                    proposedRetailPrice: 470,
                    proposedMarginPct: 4.25,
                    targetMarginPct: 12.0,
                    marginVariancePct: -7.75,
                    reason: 'Match competitor weekend promotion'
                },
                { id: 'EMP-BUY-01', name: 'Pricing Specialist' }
            );

            expect(req.status).toBe('Pending');
            expect(req.proposedMarginPct).toBe(4.25);

            await marginApprovalService.signOff(
                'MAR-001',
                'Approved',
                { id: 'EMP-FIN-01', name: 'Fatuma Finance Manager' }
            );

            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'MARGIN_CHANGE_APPROVED' })
            );
        });
    });

    describe('4. Expenses Governance & Zero-Trust Audit Invariants', () => {
        it('strictly prohibits hard deletion of expenses', async () => {
            await expect(expensesService.delete('EXP-001')).rejects.toThrow(
                'Zero-Trust Policy Violation: Hard deletion of financial records is prohibited'
            );
        });

        it('enforces 4-Eyes Maker-Checker: creators cannot approve their own expenses', async () => {
            const selectMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'EXP-101',
                            created_by_id: 'EMP-SAM-01',
                            amount: 5000,
                            category: 'Office Supplies'
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ select: selectMock });

            await expect(
                expensesService.approve('EXP-101', {
                    id: 'EMP-SAM-01',
                    name: 'Sam Creator',
                    role: 'finance_manager'
                })
            ).rejects.toThrow('Maker-Checker violation: Expense creator cannot approve their own expense');
        });

        it('enforces Executive Authorization: amounts > 50,000 require CEO role', async () => {
            const selectMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'EXP-102',
                            created_by_id: 'EMP-STAFF-01',
                            amount: 75000,
                            escalated_to_ceo: true
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ select: selectMock });

            await expect(
                expensesService.approve('EXP-102', {
                    id: 'EMP-FIN-01',
                    name: 'Fatuma Finance Manager',
                    role: 'finance_manager'
                })
            ).rejects.toThrow('Executive Authorization required: This expense exceeds the sovereign threshold and requires CEO approval.');
        });
    });
});
