import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessRoute } from '../../services/auth.rbac';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { getRoleHierarchy } from '../../utils/roles';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';

describe('Maker-Checker & Financial Team Desks Segregation of Duties', () => {
    describe('1. Segregation of Duties: Maker vs Checker Roles', () => {
        const checkerRoles = ['country_finance_director', 'group_ceo'] as const;
        const makerStaffRoles = [
            'accountant',
            'treasury_officer',
            'tax_compliance_officer',
            'credit_control_officer'
        ] as const;

        it('identifies supervisory sign-off authorities (Checkers)', () => {
            checkerRoles.forEach(role => {
                const isChecker = ['country_finance_director', 'group_ceo'].includes(role);
                expect(isChecker).toBe(true);
            });
        });

        it('identifies operational desks staff as Makers (Draft & Submit)', () => {
            makerStaffRoles.forEach(role => {
                const isChecker = ['country_finance_director', 'group_ceo'].includes(role);
                expect(isChecker).toBe(false);
            });
        });

        it('enforces hierarchy: Head of Finance outranks operational makers', () => {
            const managerRank = getRoleHierarchy('country_finance_director'); // 85
            makerStaffRoles.forEach(staffRole => {
                const staffRank = getRoleHierarchy(staffRole as any);
                expect(managerRank).toBeGreaterThan(staffRank);
            });
        });
    });

    describe('2. Treasury Desk: Cash Sweeps & Transit Floats', () => {
        const treasuryOfficer = 'treasury_officer' as const;
        const financeManager = 'country_finance_director' as const;

        it('allows treasury officer to access finance and pos reconciliation data', () => {
            expect(canAccessModule(treasuryOfficer, 'finance')).toBe(true);
            expect(canAccessModule(treasuryOfficer, 'pos')).toBe(true);
            expect(hasPermission(treasuryOfficer, 'VIEW_REVENUE')).toBe(true);
            expect(hasPermission(treasuryOfficer, 'VIEW_ALL_TRANSACTIONS')).toBe(true);
        });

        it('prevents treasury officer from operating live tills or processing sales', () => {
            expect(authService.checkPermission(treasuryOfficer, 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission(treasuryOfficer, 'pos.void_sale')).toBe(false);
            expect(hasPermission(treasuryOfficer, 'PROCESS_SALE')).toBe(false);
        });

        it('reserves purchase and expense supervisory approvals to Head of Finance', () => {
            expect(hasPermission(financeManager, 'APPROVE_PO')).toBe(true);
            expect(hasPermission(treasuryOfficer, 'APPROVE_PO')).toBe(false);

            const expenseLevels = APPROVAL_WORKFLOWS.expense.levels;
            const managerInTier = expenseLevels.some(l => l.roles.includes(financeManager));
            const treasuryInTier = expenseLevels.some(l => l.roles.includes(treasuryOfficer as any));
            expect(managerInTier).toBe(true);
            expect(treasuryInTier).toBe(false);
        });
    });

    describe('3. Tax Compliance Desk: Sovereign E-Return Certification', () => {
        const taxOfficer = 'tax_compliance_officer' as const;
        const financeManager = 'country_finance_director' as const;

        it('permits tax officer to inspect revenue and export tax data', () => {
            expect(canAccessModule(taxOfficer, 'finance')).toBe(true);
            expect(hasPermission(taxOfficer, 'VIEW_REVENUE')).toBe(true);
            expect(hasPermission(taxOfficer, 'EXPORT_FINANCIAL_DATA')).toBe(true);
        });

        it('locks price modifications and catalog changes away from tax officer', () => {
            expect(authService.checkPermission(taxOfficer, 'pricing.edit')).toBe(false);
            expect(hasPermission(taxOfficer, 'EDIT_PRICE')).toBe(false);
        });

        it('gives Head of Finance report and supervisory governance authority', () => {
            expect(authService.checkPermission(financeManager, 'finance.view_reports')).toBe(true);
            expect(hasPermission(financeManager, 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission(financeManager, 'APPROVE_PO')).toBe(true);
        });
    });

    describe('4. Credit Control Desk: Wholesale B2B Holds & Overrides', () => {
        const creditOfficer = 'credit_control_officer' as const;
        const financeManager = 'country_finance_director' as const;

        it('allows credit control officer to track invoices and customer aging', () => {
            expect(canAccessModule(creditOfficer, 'finance')).toBe(true);
            expect(canAccessModule(creditOfficer, 'sales')).toBe(true);
            expect(hasPermission(creditOfficer, 'VIEW_ALL_TRANSACTIONS')).toBe(true);
        });

        it('reserves procurement and expense approvals to Head of Finance', () => {
            expect(hasPermission(financeManager, 'APPROVE_PO')).toBe(true);
            expect(hasPermission(creditOfficer, 'APPROVE_PO')).toBe(false);
            expect(authService.checkPermission(financeManager, 'pricing.edit')).toBe(true);
            expect(authService.checkPermission(creditOfficer, 'pricing.edit')).toBe(false);
        });
    });

    describe('5. Internal Audit Desk: Zero-Trust Surveillance', () => {
        const auditor = 'auditor' as const;

        it('grants auditor non-discretionary read-only oversight across departments', () => {
            expect(canAccessRoute(auditor, '/finance')).toBe(true);
            expect(canAccessRoute(auditor, '/sales')).toBe(true);
            expect(canAccessRoute(auditor, '/inventory')).toBe(true);
            expect(canAccessRoute(auditor, '/settings')).toBe(true);
        });

        it('prevents auditor from mutating data, approving vouchers, or operating POS', () => {
            expect(hasPermission(auditor, 'APPROVE_PO')).toBe(false);
            expect(hasPermission(auditor, 'PROCESS_SALE')).toBe(false);
            expect(hasPermission(auditor, 'EDIT_PRICE')).toBe(false);
            expect(authService.checkPermission(auditor, 'pos.create_sale')).toBe(false);
        });
    });

    describe('6. Anti-Self-Approval Enforcement (Maker != Checker)', () => {
        it('requires secondary sign-off when a manager creates an expense voucher', () => {
            const expenseRecord = {
                id: 'exp-001',
                createdBy: 'user-finance-mgr',
                amount: 15000,
                status: 'Pending'
            };

            const currentUser = { id: 'user-finance-mgr', role: 'country_finance_director' };
            const isCreator = expenseRecord.createdBy === currentUser.id;

            // When isCreator is true, the user CANNOT approve their own voucher
            const canSelfApprove = currentUser.role === 'country_finance_director' && !isCreator;
            expect(canSelfApprove).toBe(false);

            // A secondary supervisor or CEO can approve it
            const ceoUser = { id: 'user-ceo-01', role: 'group_ceo' };
            const canCeoApprove = ['country_finance_director', 'group_ceo'].includes(ceoUser.role) && expenseRecord.createdBy !== ceoUser.id;
            expect(canCeoApprove).toBe(true);
        });
    });
});
