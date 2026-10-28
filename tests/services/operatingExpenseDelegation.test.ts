import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expensesService, DEFAULT_REGIONAL_EXPENSE_LIMIT, DEFAULT_COUNTRY_EXPENSE_LIMIT } from '../../services/expenses.service';
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

describe('Phase 3: Operating Expenses & Treasury Delegation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.rpc as any).mockResolvedValue({ data: { success: true }, error: null });
    });

    describe('1. Operating Expense Boundaries (2M Regional / 20M Country)', () => {
        it('allows Regional Operations Manager or Regional Finance Manager to approve expense <= 2,000,000 ETB', async () => {
            const pendingExp = {
                id: 'EXP-REG-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Maintenance' as const,
                description: 'Store Generator Service',
                amount: 1500000, // 1.5M <= 2M limit
                status: 'Pending' as const,
                createdById: 'EMP-CLERK-01',
                createdByName: 'Kebede Clerk'
            };
            const approvedExp = {
                ...pendingExp,
                status: 'Approved' as const,
                approvedBy: 'Fatuma Regional Finance',
                approved_by: 'Fatuma Regional Finance'
            };

            vi.spyOn(expensesService, 'getById')
                .mockResolvedValueOnce(pendingExp)
                .mockResolvedValueOnce(approvedExp);

            const approved = await expensesService.approve('EXP-REG-001', {
                id: 'EMP-REG-FIN-01',
                name: 'Fatuma Regional Finance',
                role: 'regional_finance_manager',
                countryCode: 'ET'
            });

            expect(approved.status).toBe('Approved');
            expect(supabase.rpc).toHaveBeenCalledWith('approve_expense', expect.objectContaining({
                p_expense_id: 'EXP-REG-001',
                p_approver_role: 'regional_finance_manager'
            }));
        });

        it('blocks Regional Manager from approving expense > 2,000,000 ETB', async () => {
            vi.spyOn(expensesService, 'getById').mockResolvedValue({
                id: 'EXP-MID-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Rent',
                description: 'Regional Warehouse Quarterly Lease',
                amount: 5000000, // 5M > 2M regional limit
                status: 'Pending',
                createdById: 'EMP-CLERK-01',
                createdByName: 'Kebede Clerk'
            });

            await expect(
                expensesService.approve('EXP-MID-001', {
                    id: 'EMP-REG-FIN-01',
                    name: 'Fatuma Regional Finance',
                    role: 'regional_finance_manager',
                    countryCode: 'ET'
                })
            ).rejects.toThrow('Autonomous Cap Exceeded: Expense amount exceeds regional autonomous limit (2,000,000)');
        });

        it('allows Country Finance Director or Country MD to approve expense between 2M and 20M ETB', async () => {
            const pendingExp = {
                id: 'EXP-MID-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Rent' as const,
                description: 'Regional Warehouse Quarterly Lease',
                amount: 15000000, // 15M (between 2M and 20M)
                status: 'Pending' as const,
                createdById: 'EMP-CLERK-01',
                createdByName: 'Kebede Clerk'
            };
            const approvedExp = {
                ...pendingExp,
                status: 'Approved' as const,
                approvedBy: 'Solomon Country Director',
                approved_by: 'Solomon Country Director'
            };

            vi.spyOn(expensesService, 'getById')
                .mockResolvedValueOnce(pendingExp)
                .mockResolvedValueOnce(approvedExp);

            const approved = await expensesService.approve('EXP-MID-001', {
                id: 'EMP-CMD-01',
                name: 'Solomon Country Director',
                role: 'country_managing_director',
                countryCode: 'ET'
            });

            expect(approved.status).toBe('Approved');
        });

        it('blocks Country Managing Director from approving expense > 20,000,000 ETB', async () => {
            vi.spyOn(expensesService, 'getById').mockResolvedValue({
                id: 'EXP-MEGA-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Software',
                description: 'Enterprise ERP Enterprise License Multi-Year',
                amount: 25000000, // 25M > 20M
                status: 'Pending',
                createdById: 'EMP-CLERK-01',
                createdByName: 'Kebede Clerk',
                escalatedToCeo: true
            });

            await expect(
                expensesService.approve('EXP-MEGA-001', {
                    id: 'EMP-CMD-01',
                    name: 'Solomon Country Director',
                    role: 'country_managing_director',
                    countryCode: 'ET'
                })
            ).rejects.toThrow('Executive Authorization required: This expense exceeds the country autonomous limit (20,000,000) and requires Group CFO / Group CEO approval.');
        });

        it('allows Group CFO / Group CEO to approve expense > 20,000,000 ETB', async () => {
            const pendingExp = {
                id: 'EXP-MEGA-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Software' as const,
                description: 'Enterprise ERP Enterprise License Multi-Year',
                amount: 25000000,
                status: 'Pending' as const,
                createdById: 'EMP-CLERK-01',
                createdByName: 'Kebede Clerk',
                escalatedToCeo: true
            };
            const approvedExp = {
                ...pendingExp,
                status: 'Approved' as const,
                approvedBy: 'Shukri Group CEO',
                approved_by: 'Shukri Group CEO'
            };

            vi.spyOn(expensesService, 'getById')
                .mockResolvedValueOnce(pendingExp)
                .mockResolvedValueOnce(approvedExp);

            const approved = await expensesService.approve('EXP-MEGA-001', {
                id: 'EMP-CEO-01',
                name: 'Shukri Group CEO',
                role: 'group_ceo'
            });

            expect(approved.status).toBe('Approved');
        });
    });

    describe('2. Treasury & Zero-Trust Invariants', () => {
        it('enforces Zero Self-Approval: An employee can NEVER approve their own expense request (even CEO)', async () => {
            vi.spyOn(expensesService, 'getById').mockResolvedValue({
                id: 'EXP-SELF-001',
                siteId: 'ST-HQ-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Other',
                description: 'Executive Travel Allowance',
                amount: 500000,
                status: 'Pending',
                createdById: 'EMP-CEO-01',
                createdByName: 'Shukri Group CEO'
            });

            // CEO attempts to approve their own request
            await expect(
                expensesService.approve('EXP-SELF-001', {
                    id: 'EMP-CEO-01',
                    name: 'Shukri Group CEO',
                    role: 'group_ceo'
                })
            ).rejects.toThrow('Maker-Checker violation: Expense creator cannot approve their own expense (4-Eyes Principle).');
        });

        it('enforces Zero Self-Approval by matching name if createdByName matches approver name', async () => {
            vi.spyOn(expensesService, 'getById').mockResolvedValue({
                id: 'EXP-SELF-002',
                siteId: 'ST-HQ-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Utilities',
                description: 'Substation Connection',
                amount: 800000,
                status: 'Pending',
                createdByName: 'Abdi Hassan'
            });

            await expect(
                expensesService.approve('EXP-SELF-002', {
                    id: 'DIFF-ID-999',
                    name: 'Abdi Hassan', // Same name
                    role: 'regional_finance_manager'
                })
            ).rejects.toThrow('Maker-Checker violation: Expense creator cannot approve their own expense (4-Eyes Principle).');
        });

        it('enforces Country Isolation: Approvers cannot approve expenses outside their country_code', async () => {
            vi.spyOn(expensesService, 'getById').mockResolvedValue({
                id: 'EXP-ET-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Logistics',
                description: 'Inland Transport',
                amount: 1000000,
                status: 'Pending',
                createdById: 'EMP-ETH-01',
                createdByName: 'Yohannes Staff'
            });

            // Kenyan approver attempts to approve Ethiopian expense
            await expect(
                expensesService.approve('EXP-ET-001', {
                    id: 'EMP-KE-FIN-01',
                    name: 'Kariuki Kenya Finance',
                    role: 'country_finance_director',
                    countryCode: 'KE' // Kenya != Ethiopia!
                })
            ).rejects.toThrow('Country Isolation Violation: Approver from KE cannot approve expenses in ET. Cross-border approvals are strictly prohibited.');
        });

        it('allows Group Executives to approve cross-border when operating at Group Tier', async () => {
            const pendingExp = {
                id: 'EXP-ET-001',
                siteId: 'ST-ADDIS-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Software' as const,
                description: 'Global Cloud Infrastructure',
                amount: 25000000, // > 20M Group level
                status: 'Pending' as const,
                createdById: 'EMP-ETH-01',
                createdByName: 'Yohannes Staff',
                escalatedToCeo: true
            };
            const approvedExp = {
                ...pendingExp,
                status: 'Approved' as const,
                approvedBy: 'Group CFO',
                approved_by: 'Group CFO'
            };

            vi.spyOn(expensesService, 'getById')
                .mockResolvedValueOnce(pendingExp)
                .mockResolvedValueOnce(approvedExp);

            const approved = await expensesService.approve('EXP-ET-001', {
                id: 'EMP-CFO-01',
                name: 'Group CFO',
                role: 'group_cfo',
                countryCode: 'GLOBAL'
            });

            expect(approved.status).toBe('Approved');
        });
    });

    describe('3. Expense Creation Limits & Auto-Escalation', () => {
        it('auto-escalates to CEO when creating an expense exceeding 20,000,000 ETB', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'EXP-NEW-001',
                            amount: 22000000,
                            category: 'Salaries',
                            description: 'Annual Bonuses Pool',
                            status: 'Pending',
                            escalated_to_ceo: true,
                            requires_hq_approval: true
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ insert: insertMock });

            const created = await expensesService.create({
                siteId: 'ST-HQ-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Salaries',
                description: 'Annual Bonuses Pool',
                amount: 22000000,
                status: 'Pending',
                createdById: 'EMP-HR-01',
                createdByName: 'Hawi HR'
            });

            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                escalated_to_ceo: true,
                requires_hq_approval: true
            }));
            expect(created.escalatedToCeo).toBe(true);
        });

        it('does NOT escalate to CEO when creating an expense <= 20,000,000 ETB', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'EXP-NEW-002',
                            amount: 1500000,
                            category: 'Packaging',
                            description: 'Biodegradable Bags Batch',
                            status: 'Pending',
                            escalated_to_ceo: false,
                            requires_hq_approval: false
                        },
                        error: null
                    })
                })
            });
            (supabase.from as any).mockReturnValue({ insert: insertMock });

            const created = await expensesService.create({
                siteId: 'ST-HQ-01',
                countryCode: 'ET',
                date: '2026-10-28',
                category: 'Packaging',
                description: 'Biodegradable Bags Batch',
                amount: 1500000,
                status: 'Pending',
                createdById: 'EMP-OPS-01',
                createdByName: 'Mulugeta Ops'
            });

            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                escalated_to_ceo: false,
                requires_hq_approval: false
            }));
            expect(created.escalatedToCeo).toBe(false);
        });
    });
});
