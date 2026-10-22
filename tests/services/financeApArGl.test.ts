import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountsPayableService } from '../../services/accounts-payable.service';
import { accountsReceivableService } from '../../services/accounts-receivable.service';
import { generalLedgerService } from '../../services/general-ledger.service';
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
        create: vi.fn().mockResolvedValue({ id: 'LOG-TEST-01' })
    }
}));

describe('SIIFMART Finance - AP, AR & General Ledger Engine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Accounts Payable (3-Way Match & Payment Run)', () => {
        it('evaluates 3-Way Match: flags quantity and price variances', () => {
            // Quantity discrepancy: invoiced > received
            const qtyDiscrepancyItems = [
                {
                    productId: 'PROD-01',
                    sku: 'ET-OIL-01',
                    itemName: 'Sunflower Cooking Oil 5L',
                    poQuantity: 100,
                    receivedQuantity: 90,
                    invoicedQuantity: 100,
                    poUnitPrice: 500,
                    invoicedUnitPrice: 500,
                    taxRate: 15,
                    totalPrice: 57500
                }
            ];

            const resultQty = accountsPayableService.evaluateThreeWayMatch(qtyDiscrepancyItems);
            expect(resultQty.status).toBe('Discrepancy_Quantity');
            expect(resultQty.notes).toContain('exceeds received dock count');

            // Price discrepancy: invoiced > authorized PO
            const priceDiscrepancyItems = [
                {
                    productId: 'PROD-02',
                    sku: 'ET-FLOUR-01',
                    itemName: 'Wheat Flour 25kg',
                    poQuantity: 50,
                    receivedQuantity: 50,
                    invoicedQuantity: 50,
                    poUnitPrice: 1200,
                    invoicedUnitPrice: 1300,
                    taxRate: 0,
                    totalPrice: 65000
                }
            ];

            const resultPrice = accountsPayableService.evaluateThreeWayMatch(priceDiscrepancyItems);
            expect(resultPrice.status).toBe('Discrepancy_Price');
            expect(resultPrice.notes).toContain('exceeds authorized PO unit price');
            expect(resultPrice.evaluatedItems[0].matchVariancePct).toBeCloseTo(8.33, 1);

            // Clean match
            const cleanItems = [
                {
                    productId: 'PROD-03',
                    sku: 'ET-SUGAR-01',
                    itemName: 'White Sugar 50kg',
                    poQuantity: 20,
                    receivedQuantity: 20,
                    invoicedQuantity: 20,
                    poUnitPrice: 2000,
                    invoicedUnitPrice: 2000,
                    taxRate: 15,
                    totalPrice: 46000
                }
            ];
            const resultClean = accountsPayableService.evaluateThreeWayMatch(cleanItems);
            expect(resultClean.status).toBe('Matched');
            expect(resultClean.notes).toContain('matched');
        });

        it('creates vendor invoice and sets status based on match evaluation', async () => {
            const mockInvoiceRow = {
                id: 'INV-AP-001',
                invoice_number: 'INV-2026-001',
                vendor_id: 'VEND-01',
                vendor_name: 'Habesha Mills PLC',
                site_id: 'ST-001',
                country_code: 'ET',
                subtotal: 40000,
                tax_amount: 6000,
                total_amount: 46000,
                amount_paid: 0,
                currency: 'ETB',
                match_status: 'Matched',
                status: 'Pending_Approval'
            };

            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockInvoiceRow, error: null })
                })
            });
            const linesInsertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: [], error: null })
            });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'vendor_invoices') return { insert: insertMock };
                if (table === 'invoice_items') return { insert: linesInsertMock };
                return {};
            });

            const created = await accountsPayableService.createInvoice(
                {
                    invoiceNumber: 'INV-2026-001',
                    invoiceDate: '2026-10-01',
                    vendorId: 'VEND-01',
                    vendorName: 'Habesha Mills PLC',
                    siteId: 'ST-001',
                    countryCode: 'ET',
                    dueDate: '2026-11-01',
                    subtotal: 40000,
                    taxAmount: 6000,
                    totalAmount: 46000,
                    currency: 'ETB'
                },
                [
                    {
                        productId: 'PROD-03',
                        itemName: 'White Sugar 50kg',
                        poQuantity: 20,
                        receivedQuantity: 20,
                        invoicedQuantity: 20,
                        poUnitPrice: 2000,
                        invoicedUnitPrice: 2000,
                        taxRate: 15,
                        totalPrice: 46000
                    }
                ],
                { id: 'EMP-ACC-01', name: 'Almaz Accountant' }
            );

            expect(created.invoiceNumber).toBe('INV-2026-001');
            expect(created.matchStatus).toBe('Matched');
            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'INVOICE_CREATED', module: 'Financials' })
            );
        });

        it('enforces supervisory override rules on AP discrepancies', async () => {
            await expect(
                accountsPayableService.overrideDiscrepancy(
                    'INV-AP-002',
                    { id: 'EMP-FIN-01', name: 'Fatuma Manager', role: 'head_of_finance' },
                    'short'
                )
            ).rejects.toThrow('Mandatory reason required: Provide at least 10 characters');

            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                id: 'INV-AP-002',
                                invoice_number: 'INV-2026-002',
                                match_status: 'Manual_Override',
                                status: 'Approved',
                                approved_by_id: 'EMP-FIN-01',
                                override_reason: 'Price increase agreed in addendum #3.'
                            },
                            error: null
                        })
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ update: updateMock });

            const overridden = await accountsPayableService.overrideDiscrepancy(
                'INV-AP-002',
                { id: 'EMP-FIN-01', name: 'Fatuma Manager', role: 'head_of_finance' },
                'Price increase agreed in addendum #3.'
            );

            expect(overridden.matchStatus).toBe('Manual_Override');
            expect(overridden.status).toBe('Approved');
            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'INVOICE_DISCREPANCY_OVERRIDDEN' })
            );
        });
    });

    describe('2. Accounts Receivable (B2B Aging & Credit Controls)', () => {
        it('calculates AR aging brackets correctly', async () => {
            const now = Date.now();
            const dayMs = 24 * 3600 * 1000;

            const mockInvoices = [
                { id: 'AR-01', balance_due: 10000, due_date: new Date(now + 5 * dayMs).toISOString(), status: 'Sent' },
                { id: 'AR-02', balance_due: 20000, due_date: new Date(now - 15 * dayMs).toISOString(), status: 'Overdue' },
                { id: 'AR-03', balance_due: 30000, due_date: new Date(now - 45 * dayMs).toISOString(), status: 'Overdue' },
                { id: 'AR-04', balance_due: 40000, due_date: new Date(now - 100 * dayMs).toISOString(), status: 'Overdue' },
                { id: 'AR-05', balance_due: 0, due_date: new Date(now - 30 * dayMs).toISOString(), status: 'Paid' }
            ];

            const selectMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        range: vi.fn().mockResolvedValue({ data: mockInvoices, error: null })
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ select: selectMock });

            const aging = await accountsReceivableService.getAgingReport('ET');

            expect(aging.current).toBe(10000);
            expect(aging.days31to60).toBe(20000);
            expect(aging.days61to90).toBe(30000);
            expect(aging.days90Plus).toBe(40000);
            expect(aging.totalOutstanding).toBe(100000);
        });

        it('updates customer credit limit and logs audit trail', async () => {
            const upsertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            customer_id: 'CUST-001',
                            customer_name: 'Addis Supermarket Chain',
                            credit_limit: 500000,
                            current_outstanding: 150000,
                            is_hold: false,
                            country_code: 'ET'
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ upsert: upsertMock });

            const res = await accountsReceivableService.setCreditLimit(
                'CUST-001',
                'Addis Supermarket Chain',
                500000,
                'ET',
                { id: 'EMP-CRD-01', name: 'Credit Officer' }
            );

            expect(res.creditLimit).toBe(500000);
            expect(res.availableCredit).toBe(350000);
            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CREDIT_LIMIT_UPDATED' })
            );
        });
    });

    describe('3. General Ledger & Double-Entry Accounting (SOP-ACC-004)', () => {
        it('rejects unbalanced journal entries (Debits != Credits)', async () => {
            const selectMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { status: 'Open' }, error: null })
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ select: selectMock });

            await expect(
                generalLedgerService.postJournalEntry(
                    {
                        entryNumber: 'JE-2026-001',
                        entryDate: '2026-10-12',
                        periodKey: '2026-10',
                        countryCode: 'ET',
                        siteId: 'ST-001',
                        sourceModule: 'Manual',
                        memo: 'Test unbalanced entry',
                        totalDebit: 1000,
                        totalCredit: 800,
                        lines: [
                            { accountCode: '1010', accountName: 'Cash', debit: 1000, credit: 0 },
                            { accountCode: '4010', accountName: 'Revenue', debit: 0, credit: 800 }
                        ]
                    },
                    { id: 'EMP-ACC-01', name: 'Accountant' }
                )
            ).rejects.toThrow('Unbalanced Journal Entry');
        });

        it('strictly blocks journal entries to closed/locked fiscal periods', async () => {
            const selectMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { period_key: '2026-09', country_code: 'ET', status: 'Closed' },
                            error: null
                        })
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ select: selectMock });

            await expect(
                generalLedgerService.postJournalEntry(
                    {
                        entryNumber: 'JE-2026-002',
                        entryDate: '2026-09-30',
                        periodKey: '2026-09',
                        countryCode: 'ET',
                        siteId: 'ST-001',
                        sourceModule: 'Manual',
                        memo: 'Attempted backdated entry',
                        totalDebit: 500,
                        totalCredit: 500,
                        lines: [
                            { accountCode: '1010', accountName: 'Cash', debit: 500, credit: 0 },
                            { accountCode: '4010', accountName: 'Revenue', debit: 0, credit: 500 }
                        ]
                    },
                    { id: 'EMP-ACC-01', name: 'Accountant' }
                )
            ).rejects.toThrow('Period Close Lock: Fiscal period 2026-09 is Closed');
        });

        it('successfully closes and locks a fiscal period with audit logging', async () => {
            const upsertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            period_key: '2026-10',
                            country_code: 'ET',
                            status: 'Closed',
                            closed_at: '2026-10-31T23:59:59Z',
                            closed_by_id: 'EMP-FIN-01',
                            closed_by_name: 'Fatuma Head of Finance',
                            lock_reason: 'End of month audit completed and reconciliation verified.'
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ upsert: upsertMock });

            const period = await generalLedgerService.closeFiscalPeriod(
                '2026-10',
                'ET',
                { id: 'EMP-FIN-01', name: 'Fatuma Head of Finance' },
                'End of month audit completed and reconciliation verified.'
            );

            expect(period.status).toBe('Closed');
            expect(period.closedByName).toBe('Fatuma Head of Finance');
            expect(systemLogsService.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'FISCAL_PERIOD_CLOSED' })
            );
        });
    });
});
