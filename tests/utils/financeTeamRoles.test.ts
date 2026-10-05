import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessRoute } from '../../services/auth.rbac';
import { canAccessModule, hasPermission, canSwitchCountry, getUserCountry } from '../../utils/permissions';
import { getRoleHierarchy, canEmployRole, SYSTEM_ROLES } from '../../utils/roles';
import { getRequiredSiteType } from '../../utils/roleSegregation';
import { getRoleDept, getRoleLevel, getRoleRank } from '../../components/org-chart/hooks/orgRoles';
import { HIERARCHY_TREE, ROLE_COLORS } from '../../components/org-chart/types';

describe('Finance Directorate Team Roles Integration', () => {
    describe('1. Treasury Officer (treasury_officer)', () => {
        const role = 'treasury_officer' as const;

        it('has correct route and module access', () => {
            expect(canAccessRoute(role, '/finance')).toBe(true);
            expect(canAccessRoute(role, '/sales')).toBe(true);
            expect(canAccessRoute(role, '/pos-dashboard')).toBe(true);
            expect(canAccessRoute(role, '/profile')).toBe(true);

            expect(canAccessRoute(role, '/warehouse')).toBe(false);
            expect(canAccessRoute(role, '/procurement')).toBe(false);
            expect(canAccessRoute(role, '/settings')).toBe(false);

            expect(canAccessModule(role, 'finance')).toBe(true);
            expect(canAccessModule(role, 'sales')).toBe(true);
            expect(canAccessModule(role, 'pos')).toBe(true);
            expect(canAccessModule(role, 'warehouse')).toBe(false);
        });

        it('has granular action permissions for cash and shift reconciliation', () => {
            expect(authService.checkPermission(role, 'dashboard.view')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view_reports')).toBe(true);
            expect(authService.checkPermission(role, 'pos.view')).toBe(true);
            expect(authService.checkPermission(role, 'sales.view')).toBe(true);
            expect(authService.checkPermission(role, 'sales.view_reports')).toBe(true);

            // Segregation of duties: Cannot operate live register or void sales
            expect(authService.checkPermission(role, 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission(role, 'pos.void_sale')).toBe(false);
            expect(authService.checkPermission(role, 'pos.refund')).toBe(false);
        });

        it('satisfies legacy permission checks', () => {
            expect(hasPermission(role, 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission(role, 'VIEW_REVENUE')).toBe(true);
            expect(hasPermission(role, 'VIEW_EXPENSES')).toBe(true);
            expect(hasPermission(role, 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(hasPermission(role, 'VIEW_ALL_TRANSACTIONS')).toBe(true);

            expect(hasPermission(role, 'PROCESS_SALE')).toBe(false);
            expect(hasPermission(role, 'VOID_SALE')).toBe(false);
        });

        it('has Level 4 ranking and hierarchy rank 38', () => {
            expect(getRoleHierarchy(role)).toBe(38);
            const sysRole = SYSTEM_ROLES.find(r => r.id === role);
            expect(sysRole?.level).toBe(4);
            expect(sysRole?.label).toBe('Treasury Officer');
        });
    });

    describe('2. Tax Compliance Officer (tax_compliance_officer)', () => {
        const role = 'tax_compliance_officer' as const;

        it('has correct route and module access', () => {
            expect(canAccessRoute(role, '/finance')).toBe(true);
            expect(canAccessRoute(role, '/sales')).toBe(true);
            expect(canAccessRoute(role, '/profile')).toBe(true);

            expect(canAccessRoute(role, '/pos')).toBe(false);
            expect(canAccessRoute(role, '/warehouse')).toBe(false);
            expect(canAccessRoute(role, '/procurement')).toBe(false);

            expect(canAccessModule(role, 'finance')).toBe(true);
            expect(canAccessModule(role, 'sales')).toBe(true);
            expect(canAccessModule(role, 'warehouse')).toBe(false);
        });

        it('has granular action permissions for tax filing and financial review', () => {
            expect(authService.checkPermission(role, 'dashboard.view')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view_reports')).toBe(true);
            expect(authService.checkPermission(role, 'sales.view')).toBe(true);
            expect(authService.checkPermission(role, 'sales.view_reports')).toBe(true);

            expect(authService.checkPermission(role, 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission(role, 'pricing.edit')).toBe(false);
        });

        it('satisfies legacy permission checks', () => {
            expect(hasPermission(role, 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission(role, 'VIEW_REVENUE')).toBe(true);
            expect(hasPermission(role, 'VIEW_EXPENSES')).toBe(true);
            expect(hasPermission(role, 'EXPORT_FINANCIAL_DATA')).toBe(true);
            expect(hasPermission(role, 'EXPORT_SALES_DATA')).toBe(true);

            expect(hasPermission(role, 'EDIT_PRICE')).toBe(false);
            expect(hasPermission(role, 'PROCESS_SALE')).toBe(false);
        });

        it('has Level 4 ranking and hierarchy rank 38', () => {
            expect(getRoleHierarchy(role)).toBe(38);
            const sysRole = SYSTEM_ROLES.find(r => r.id === role);
            expect(sysRole?.level).toBe(4);
            expect(sysRole?.label).toBe('Tax Compliance Officer');
        });
    });

    describe('3. Credit Control Officer (credit_control_officer)', () => {
        const role = 'credit_control_officer' as const;

        it('has correct route and module access', () => {
            expect(canAccessRoute(role, '/finance')).toBe(true);
            expect(canAccessRoute(role, '/sales')).toBe(true);
            expect(canAccessRoute(role, '/customers')).toBe(true);
            expect(canAccessRoute(role, '/procurement')).toBe(true);
            expect(canAccessRoute(role, '/profile')).toBe(true);

            expect(canAccessRoute(role, '/warehouse')).toBe(false);
            expect(canAccessRoute(role, '/pos')).toBe(false);

            expect(canAccessModule(role, 'finance')).toBe(true);
            expect(canAccessModule(role, 'sales')).toBe(true);
            expect(canAccessModule(role, 'customers')).toBe(true);
            expect(canAccessModule(role, 'procurement')).toBe(true);
            expect(canAccessModule(role, 'warehouse')).toBe(false);
        });

        it('has granular action permissions for customer credit and procurement accounts', () => {
            expect(authService.checkPermission(role, 'dashboard.view')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view')).toBe(true);
            expect(authService.checkPermission(role, 'finance.view_reports')).toBe(true);
            expect(authService.checkPermission(role, 'sales.view')).toBe(true);
            expect(authService.checkPermission(role, 'sales.view_reports')).toBe(true);
            expect(authService.checkPermission(role, 'customers.view')).toBe(true);
            expect(authService.checkPermission(role, 'customers.view_history')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.view')).toBe(true);

            // Segregation of duties: Cannot unilaterally approve PO or refund sales
            expect(authService.checkPermission(role, 'procurement.approve_po')).toBe(false);
            expect(authService.checkPermission(role, 'sales.refund')).toBe(false);
        });

        it('satisfies legacy permission checks', () => {
            expect(hasPermission(role, 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission(role, 'ACCESS_CUSTOMERS')).toBe(true);
            expect(hasPermission(role, 'VIEW_CUSTOMER_HISTORY')).toBe(true);
            expect(hasPermission(role, 'ACCESS_PROCUREMENT')).toBe(true);

            expect(hasPermission(role, 'APPROVE_PO')).toBe(false);
            expect(hasPermission(role, 'REFUND_SALE')).toBe(false);
        });

        it('has Level 4 ranking and hierarchy rank 36', () => {
            expect(getRoleHierarchy(role)).toBe(36);
            const sysRole = SYSTEM_ROLES.find(r => r.id === role);
            expect(sysRole?.level).toBe(4);
            expect(sysRole?.label).toBe('Credit Control Officer');
        });
    });

    describe('4. Managerial Authority & Hiring Governance', () => {
        it('allows finance_manager to employ all three finance team roles', () => {
            expect(canEmployRole('finance_manager', 'treasury_officer')).toBe(true);
            expect(canEmployRole('finance_manager', 'tax_compliance_officer')).toBe(true);
            expect(canEmployRole('finance_manager', 'credit_control_officer')).toBe(true);
        });

        it('blocks Level 4 staff from employing finance team roles', () => {
            expect(canEmployRole('cashier', 'treasury_officer')).toBe(false);
            expect(canEmployRole('accountant', 'tax_compliance_officer')).toBe(false);
            expect(canEmployRole('auditor', 'credit_control_officer')).toBe(false);
        });
    });

    describe('5. Org Chart & Department Mapping', () => {
        const roles = ['treasury_officer', 'tax_compliance_officer', 'credit_control_officer'] as const;

        it('maps all three roles to finance department', () => {
            roles.forEach(role => {
                expect(getRoleDept(role)).toBe('finance');
                expect(getRoleLevel(role)).toBe(4);
            });
            expect(getRoleRank('treasury_officer')).toBe(51);
            expect(getRoleRank('tax_compliance_officer')).toBe(52);
            expect(getRoleRank('credit_control_officer')).toBe(53);
        });

        it('includes all three roles in HIERARCHY_TREE under finance_manager', () => {
            const findNode = (nodes: typeof HIERARCHY_TREE, targetRole: string): boolean => {
                for (const node of nodes) {
                    if (node.role === targetRole) return true;
                    if (node.children && findNode(node.children, targetRole)) return true;
                }
                return false;
            };

            roles.forEach(role => {
                expect(findNode(HIERARCHY_TREE, role)).toBe(true);
                expect(ROLE_COLORS[role]).toBeDefined();
            });
        });
    });

    describe('6. Site Segregation & Location Access', () => {
        it('enforces Administration (HQ) site assignment for all three roles', () => {
            expect(getRequiredSiteType('treasury_officer')).toBe('Administration');
            expect(getRequiredSiteType('tax_compliance_officer')).toBe('Administration');
            expect(getRequiredSiteType('credit_control_officer')).toBe('Administration');
        });
    });

    describe('7. Multi-Country Isolation & Sovereign Security', () => {
        it('strictly blocks country switching for all three roles (CEO only)', () => {
            expect(canSwitchCountry({ role: 'treasury_officer' })).toBe(false);
            expect(canSwitchCountry({ role: 'tax_compliance_officer' })).toBe(false);
            expect(canSwitchCountry({ role: 'credit_control_officer' })).toBe(false);
        });

        it('pins employees to their sovereign country via assigned site or profile', () => {
            const mockSites = [
                { id: 'site-et-hq', country: 'ET', currency: 'ETB' },
                { id: 'site-ke-hq', country: 'KE', currency: 'KES' }
            ];

            const etUser = { id: 'usr-1', role: 'treasury_officer', siteId: 'site-et-hq' };
            const keUser = { id: 'usr-2', role: 'tax_compliance_officer', siteId: 'site-ke-hq' };

            expect(getUserCountry(etUser, mockSites)).toBe('ET');
            expect(getUserCountry(keUser, mockSites)).toBe('KE');
        });
    });
});
