import { describe, it, expect, vi, beforeEach } from 'vitest';
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
        create: vi.fn().mockResolvedValue({ id: 'LOG-001' })
    }
}));

describe('Zero-Trust Hardened Expenses Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects hard deletion and enforces zero-trust soft-voiding', async () => {
        await expect(expensesService.delete('EXP-001')).rejects.toThrow(
            'Zero-Trust Policy Violation: Hard deletion of financial records is prohibited.'
        );
    });

    it('creates expense with Pending status and auto-escalates to CEO if exceeding country threshold', async () => {
        const insertMock = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: 'EXP-100',
                        amount: 75000,
                        category: 'Maintenance',
                        description: 'Generator Overhaul',
                        status: 'Pending',
                        site_id: 'ST-001',
                        country_code: 'ET',
                        expense_date: '2026-10-04',
                        created_by_id: 'EMP-001',
                        created_by_name: 'John Maker',
                        escalated_to_ceo: true,
                        escalation_reason: 'Amount exceeds country threshold (50,000). Requires executive CEO authorization.'
                    },
                    error: null
                })
            })
        });

        (supabase.from as any).mockReturnValue({ insert: insertMock });

        const created = await expensesService.create({
            siteId: 'ST-001',
            countryCode: 'ET',
            date: '2026-10-04',
            category: 'Maintenance',
            description: 'Generator Overhaul',
            amount: 75000,
            status: 'Pending',
            createdById: 'EMP-001',
            createdByName: 'John Maker',
            thresholdLimit: 50000
        });

        expect(created.status).toBe('Pending');
        expect(created.escalatedToCeo).toBe(true);
        expect(systemLogsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'EXPENSE_CREATED_ESCALATED',
                module: 'Financials'
            })
        );
    });

    it('enforces Maker-Checker: blocks creator from approving their own expense', async () => {
        vi.spyOn(expensesService, 'getById').mockResolvedValue({
            id: 'EXP-200',
            siteId: 'ST-001',
            date: '2026-10-04',
            category: 'Utilities',
            description: 'Water Bill',
            amount: 12000,
            status: 'Pending',
            createdById: 'EMP-MAKER-01',
            createdByName: 'Abebe Maker'
        });

        await expect(
            expensesService.approve('EXP-200', {
                id: 'EMP-MAKER-01', // Same ID as creator!
                name: 'Abebe Maker',
                role: 'finance_manager'
            })
        ).rejects.toThrow('Maker-Checker violation: Expense creator cannot approve their own expense (4-Eyes Principle).');
    });

    it('blocks regular finance manager from approving CEO-escalated expense', async () => {
        vi.spyOn(expensesService, 'getById').mockResolvedValue({
            id: 'EXP-300',
            siteId: 'ST-001',
            date: '2026-10-04',
            category: 'Rent',
            description: 'Warehouse Annual Rent',
            amount: 150000,
            status: 'Pending',
            createdById: 'EMP-STAFF-02',
            createdByName: 'Chala Staff',
            escalatedToCeo: true
        });

        await expect(
            expensesService.approve('EXP-300', {
                id: 'EMP-FIN-01',
                name: 'Fatuma Finance',
                role: 'finance_manager' // Not CEO!
            })
        ).rejects.toThrow('Executive Authorization required: This expense exceeds the sovereign threshold and requires CEO approval.');
    });

    it('allows CEO to approve escalated expense', async () => {
        vi.spyOn(expensesService, 'getById').mockResolvedValue({
            id: 'EXP-300',
            siteId: 'ST-001',
            date: '2026-10-04',
            category: 'Rent',
            description: 'Warehouse Annual Rent',
            amount: 150000,
            status: 'Pending',
            createdById: 'EMP-STAFF-02',
            createdByName: 'Chala Staff',
            escalatedToCeo: true
        });

        const updateMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'EXP-300',
                            amount: 150000,
                            category: 'Rent',
                            description: 'Warehouse Annual Rent',
                            status: 'Approved',
                            site_id: 'ST-001',
                            country_code: 'ET',
                            expense_date: '2026-10-04',
                            approved_by_id: 'EMP-CEO-01',
                            approved_by: 'Shukri CEO',
                            approved_at: '2026-10-04T00:00:00Z',
                            escalated_to_ceo: true
                        },
                        error: null
                    })
                })
            })
        });

        (supabase.from as any).mockReturnValue({ update: updateMock });

        const approved = await expensesService.approve('EXP-300', {
            id: 'EMP-CEO-01',
            name: 'Shukri CEO',
            role: 'CEO'
        });

        expect(approved.status).toBe('Approved');
        expect(approved.approvedBy).toBe('Shukri CEO');
    });

    it('records zero-trust soft-void with mandatory reason code', async () => {
        vi.spyOn(expensesService, 'getById').mockResolvedValue({
            id: 'EXP-400',
            siteId: 'ST-001',
            date: '2026-10-04',
            category: 'Marketing',
            description: 'Ad Campaign',
            amount: 8000,
            status: 'Pending'
        });

        await expect(
            expensesService.voidExpense('EXP-400', {
                reason: 'bad', // Too short (< 5 chars)
                voidedById: 'EMP-FIN-01',
                voidedByName: 'Fatuma Finance'
            })
        ).rejects.toThrow('Mandatory void reason required');

        const updateMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'EXP-400',
                            amount: 8000,
                            category: 'Marketing',
                            description: 'Ad Campaign',
                            status: 'Voided',
                            site_id: 'ST-001',
                            country_code: 'ET',
                            expense_date: '2026-10-04',
                            void_reason: 'Duplicate campaign invoice submitted in error',
                            voided_by_id: 'EMP-FIN-01',
                            voided_by_name: 'Fatuma Finance',
                            voided_at: '2026-10-04T00:00:00Z'
                        },
                        error: null
                    })
                })
            })
        });

        (supabase.from as any).mockReturnValue({ update: updateMock });

        const voided = await expensesService.voidExpense('EXP-400', {
            reason: 'Duplicate campaign invoice submitted in error',
            voidedById: 'EMP-FIN-01',
            voidedByName: 'Fatuma Finance'
        });

        expect(voided.status).toBe('Voided');
        expect(voided.voidReason).toBe('Duplicate campaign invoice submitted in error');
        expect(systemLogsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'EXPENSE_VOIDED',
                module: 'Financials'
            })
        );
    });
});
