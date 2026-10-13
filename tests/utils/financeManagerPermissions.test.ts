import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';

describe('Finance Manager Role & Fiscal Governance Engine (SOP-MGT-022)', () => {
    describe('Module Access Controls', () => {
        it('allows finance_manager to access core financial and governance modules', () => {
            expect(canAccessModule('finance_manager', 'finance')).toBe(true);
            expect(canAccessModule('finance_manager', 'pricing')).toBe(true);
            expect(canAccessModule('finance_manager', 'sales')).toBe(true);
        });

        it('strictly blocks finance_manager from cross-department operations (procurement, warehouse, pos, settings)', () => {
            expect(canAccessModule('finance_manager', 'procurement')).toBe(false);
            expect(canAccessModule('finance_manager', 'pos')).toBe(false);
            expect(canAccessModule('finance_manager', 'inventory')).toBe(false);
            expect(canAccessModule('finance_manager', 'warehouse')).toBe(false);
            expect(canAccessModule('finance_manager', 'settings')).toBe(false);
        });
    });

    describe('Action-Level Granular Permissions (services/permissions.matrix.ts)', () => {
        it('grants pricing governance and margin protection permissions', () => {
            expect(authService.checkPermission('finance_manager', 'pricing.view')).toBe(true);
            expect(authService.checkPermission('finance_manager', 'pricing.edit')).toBe(true);
            expect(authService.checkPermission('finance_manager', 'pricing.approve_promo')).toBe(true);
            expect(hasPermission('finance_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('finance_manager', 'EDIT_PRICE')).toBe(true);
            expect(hasPermission('finance_manager', 'APPROVE_PRICE_CHANGE')).toBe(true);
        });

        it('blocks inventory stock view while granting cost price viewing for valuation', () => {
            expect(authService.checkPermission('finance_manager', 'inventory.view')).toBe(false);
            expect(hasPermission('finance_manager', 'VIEW_COST_PRICE')).toBe(true);
        });

        it('blocks till execution and POS store access under departmental isolation', () => {
            expect(authService.checkPermission('finance_manager', 'pos.view')).toBe(false);

            // Prohibited till operations (Zero Live Till Operation)
            expect(authService.checkPermission('finance_manager', 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission('finance_manager', 'pos.void_sale')).toBe(false);
            expect(authService.checkPermission('finance_manager', 'pos.refund')).toBe(false);
            expect(hasPermission('finance_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('finance_manager', 'VOID_SALE')).toBe(false);
            expect(hasPermission('finance_manager', 'REFUND_SALE')).toBe(false);
        });

        it('grants auditor pos monitoring for daily shift review', () => {
            expect(authService.checkPermission('auditor', 'pos.view')).toBe(true);
            expect(hasPermission('auditor', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(authService.checkPermission('auditor', 'pos.create_sale')).toBe(false);
        });
    });

    describe('Approval Workflow Thresholds (SOP-MGT-022)', () => {
        it('includes finance_manager in purchase order approval workflows above 10,000 threshold', () => {
            const poWorkflow = APPROVAL_WORKFLOWS.purchase_order;
            const midTier = poWorkflow.levels.find(l => l.threshold === 50000);
            expect(midTier?.roles).toContain('finance_manager');

            const highTier = poWorkflow.levels.find(l => l.threshold === Infinity);
            expect(highTier?.roles).toContain('finance_manager');
        });

        it('includes finance_manager in expense approval workflows above 1,000 threshold', () => {
            const expenseWorkflow = APPROVAL_WORKFLOWS.expense;
            const midTier = expenseWorkflow.levels.find(l => l.threshold === 5000);
            expect(midTier?.roles).toContain('finance_manager');

            const highTier = expenseWorkflow.levels.find(l => l.threshold === Infinity);
            expect(highTier?.roles).toContain('finance_manager');
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
