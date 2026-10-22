import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';

describe('Head of Finance Role & Fiscal Governance Engine (SOP-MGT-022)', () => {
    describe('Module Access Controls', () => {
        it('allows head_of_finance to access core financial and governance modules', () => {
            expect(canAccessModule('head_of_finance', 'finance')).toBe(true);
            expect(canAccessModule('head_of_finance', 'pricing')).toBe(true);
            expect(canAccessModule('head_of_finance', 'sales')).toBe(true);
        });

        it('strictly blocks head_of_finance from cross-department operations (procurement, warehouse, pos, inventory)', () => {
            expect(canAccessModule('head_of_finance', 'procurement')).toBe(false);
            expect(canAccessModule('head_of_finance', 'pos')).toBe(false);
            expect(canAccessModule('head_of_finance', 'inventory')).toBe(false);
            expect(canAccessModule('head_of_finance', 'warehouse')).toBe(false);
            expect(canAccessModule('head_of_finance', 'settings')).toBe(true); // Authorized for Financial & Tax Policy settings
        });
    });

    describe('Action-Level Granular Permissions (services/permissions.matrix.ts)', () => {
        it('grants pricing governance and margin protection permissions', () => {
            expect(authService.checkPermission('head_of_finance', 'pricing.view')).toBe(true);
            expect(authService.checkPermission('head_of_finance', 'pricing.edit')).toBe(true);
            expect(authService.checkPermission('head_of_finance', 'pricing.approve_promo')).toBe(true);
            expect(hasPermission('head_of_finance', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('head_of_finance', 'EDIT_PRICE')).toBe(true);
            expect(hasPermission('head_of_finance', 'APPROVE_PRICE_CHANGE')).toBe(true);
        });

        it('blocks inventory stock view while granting cost price viewing for valuation', () => {
            expect(authService.checkPermission('head_of_finance', 'inventory.view')).toBe(false);
            expect(hasPermission('head_of_finance', 'VIEW_COST_PRICE')).toBe(true);
        });

        it('blocks till execution and POS store access under departmental isolation', () => {
            expect(authService.checkPermission('head_of_finance', 'pos.view')).toBe(false);

            // Prohibited till operations (Zero Live Till Operation)
            expect(authService.checkPermission('head_of_finance', 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission('head_of_finance', 'pos.void_sale')).toBe(false);
            expect(authService.checkPermission('head_of_finance', 'pos.refund')).toBe(false);
            expect(hasPermission('head_of_finance', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('head_of_finance', 'VOID_SALE')).toBe(false);
            expect(hasPermission('head_of_finance', 'REFUND_SALE')).toBe(false);
        });

        it('grants auditor pos monitoring for daily shift review', () => {
            expect(authService.checkPermission('auditor', 'pos.view')).toBe(true);
            expect(hasPermission('auditor', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(authService.checkPermission('auditor', 'pos.create_sale')).toBe(false);
        });
    });

    describe('Approval Workflow Thresholds (SOP-MGT-022)', () => {
        it('includes head_of_finance in purchase order approval workflows above 10,000 threshold', () => {
            const poWorkflow = APPROVAL_WORKFLOWS.purchase_order;
            const midTier = poWorkflow.levels.find(l => l.threshold === 50000);
            expect(midTier?.roles).toContain('head_of_finance');

            const highTier = poWorkflow.levels.find(l => l.threshold === Infinity);
            expect(highTier?.roles).toContain('head_of_finance');
        });

        it('includes head_of_finance in expense approval workflows above 1,000 threshold', () => {
            const expenseWorkflow = APPROVAL_WORKFLOWS.expense;
            const midTier = expenseWorkflow.levels.find(l => l.threshold === 5000);
            expect(midTier?.roles).toContain('head_of_finance');

            const highTier = expenseWorkflow.levels.find(l => l.threshold === Infinity);
            expect(highTier?.roles).toContain('head_of_finance');
        });
    });

    describe('Accountant & Auditor Financial Access Coverage', () => {
        it('allows accountant to access finance and sales modules while strictly blocking procurement', () => {
            expect(canAccessModule('accountant', 'finance')).toBe(true);
            expect(canAccessModule('accountant', 'procurement')).toBe(false);
            expect(canAccessModule('accountant', 'sales')).toBe(true);
            expect(hasPermission('accountant', 'ACCESS_FINANCE')).toBe(true);
        });

        it('allows auditor to access settings for audit log inspection and compliance review', () => {
            expect(canAccessModule('auditor', 'settings')).toBe(true);
            expect(hasPermission('auditor', 'ACCESS_SETTINGS')).toBe(true);
            expect(authService.checkPermission('auditor', 'settings.view')).toBe(true);
        });
    });

    describe('Sovereign Bank & Tax Filing File Generation', () => {
        it('generates sovereign Ethiopian CBE/Telebirr bank file and ERCA Form 21 tax filing', async () => {
            const { exportSovereignBankFile, exportSovereignTaxFiling } = await import('../../hooks/financialsHelpers');
            const bankFile = exportSovereignBankFile('ET', 'ETB', [
                { id: '1', code: 'ET-EMP001', name: 'Almaz Tadesse', salary: 15000, status: 'Active', department: 'Finance' }
            ], () => 500);
            expect(bankFile).toContain('et_cbe_telebirr_payroll');

            const taxFile = exportSovereignTaxFiling('ET', 'ETB', {
                authority: 'Ministry of Revenues (ERCA)',
                taxName: 'ERCA Form 21',
                rate: 15
            }, {
                totalRevenue: 100000,
                totalRefunds: 2000,
                totalOpEx: 30000,
                estimatedTaxLiability: 14700,
                inputTaxCredit: 4500,
                netTaxPayable: 10200
            });
            expect(taxFile).toContain('et_erca_form_21');
        });

        it('generates sovereign Kenyan M-Pesa B2C bank file and KRA VAT 3 tax filing', async () => {
            const { exportSovereignBankFile, exportSovereignTaxFiling } = await import('../../hooks/financialsHelpers');
            const bankFile = exportSovereignBankFile('KE', 'KSh', [
                { id: '2', code: 'KE-EMP002', name: 'Juma Otieno', salary: 45000, status: 'Active', department: 'Retail Operations' }
            ], () => 1000);
            expect(bankFile).toContain('ke_mpesa_b2c_payroll');

            const taxFile = exportSovereignTaxFiling('KE', 'KSh', {
                authority: 'Kenya Revenue Authority (KRA)',
                taxName: 'KRA VAT 3',
                rate: 16
            }, {
                totalRevenue: 250000,
                totalRefunds: 5000,
                totalOpEx: 70000,
                estimatedTaxLiability: 39200,
                inputTaxCredit: 11200,
                netTaxPayable: 28000
            });
            expect(taxFile).toContain('ke_kra_vat_3');
        });
    });
});
