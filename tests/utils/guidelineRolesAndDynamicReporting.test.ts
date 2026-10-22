import { describe, it, expect } from 'vitest';
import { SYSTEM_ROLES, getRoleHierarchy } from '../../utils/roles';
import { getRoleReportingMeta, ROLE_REPORTING_REGISTRY } from '../../components/org-chart/hooks/orgReportingLines';
import { canEmployRole } from '../../utils/roleHiring';
import { ROLE_PERMISSIONS, canAccessRoute, canAccessSite } from '../../services/auth.rbac';
import { ACTION_PERMISSIONS } from '../../services/permissions.matrix';
import { isAdmin, canViewAllSites, canViewAllEmployees } from '../../utils/permissions';
import type { Employee } from '../../types';

describe('Guideline Role Extensions & Dual-Control Reporting', () => {
    describe('1. Role Catalog & Hierarchy Configuration', () => {
        const expectedNewRoles = [
            { id: 'group_cmo', level: 1, expectedRank: 99, category: 'executive', isManagerial: true },
            { id: 'regional_it_manager', level: 5, expectedRank: 81, category: 'director', isManagerial: true },
            { id: 'regional_compliance_manager', level: 5, expectedRank: 81, category: 'director', isManagerial: true },
            { id: 'inbound_operations_supervisor', level: 8, expectedRank: 56, category: 'supervisor', isManagerial: true },
            { id: 'outbound_operations_supervisor', level: 8, expectedRank: 56, category: 'supervisor', isManagerial: true },
            { id: 'cash_office_officer', level: 9, expectedRank: 36, category: 'specialist', isManagerial: false },
            { id: 'warehouse_administrator', level: 10, expectedRank: 24, category: 'specialist', isManagerial: false }
        ];

        it('has all 7 guideline roles registered in SYSTEM_ROLES with correct metadata', () => {
            expectedNewRoles.forEach(r => {
                const found = SYSTEM_ROLES.find(sys => sys.id === r.id);
                expect(found, `Role ${r.id} must be in SYSTEM_ROLES`).toBeDefined();
                expect(found?.level).toBe(r.level);
                expect(getRoleHierarchy(r.id)).toBe(r.expectedRank);
            });
        });

        it('registers reporting lines in ROLE_REPORTING_REGISTRY', () => {
            expectedNewRoles.forEach(r => {
                const meta = getRoleReportingMeta(r.id);
                expect(meta.level).toBe(r.level);
                expect(meta.levelCategory).toBe(r.category);
                expect(meta.isManagerial).toBe(r.isManagerial);
            });
        });

        it('verifies solid and dotted-line connections for new roles', () => {
            // Group CMO reports to Group CEO
            const cmo = getRoleReportingMeta('group_cmo');
            expect(cmo.reportsToRole).toBe('group_ceo');
            expect(cmo.reportsToLabel).toContain('Group CEO');

            // Regional IT Manager: solid to Country Tech Director, dotted to Regional Ops
            const regIt = getRoleReportingMeta('regional_it_manager');
            expect(regIt.reportsToRole).toBe('country_technology_director');
            expect(regIt.dottedLineRole).toBe('regional_operations_manager');

            // Regional Compliance Manager: solid to Country Compliance Manager, dotted to Regional Ops
            const regComp = getRoleReportingMeta('regional_compliance_manager');
            expect(regComp.reportsToRole).toBe('country_compliance_manager');
            expect(regComp.dottedLineRole).toBe('regional_operations_manager');

            // Inbound Supervisor: solid to Warehouse Ops Manager, dotted to Warehouse Manager
            const inSup = getRoleReportingMeta('inbound_operations_supervisor');
            expect(inSup.reportsToRole).toBe('warehouse_operations_manager');
            expect(inSup.dottedLineRole).toBe('warehouse_manager');

            // Outbound Supervisor: solid to Warehouse Ops Manager, dotted to Warehouse Manager
            const outSup = getRoleReportingMeta('outbound_operations_supervisor');
            expect(outSup.reportsToRole).toBe('warehouse_operations_manager');
            expect(outSup.dottedLineRole).toBe('warehouse_manager');

            // Cash Office Officer: solid to POS Supervisor, dotted to Regional Finance Manager
            const cashOffice = getRoleReportingMeta('cash_office_officer');
            expect(cashOffice.reportsToRole).toBe('pos_supervisor');
            expect(cashOffice.dottedLineRole).toBe('regional_finance_manager');

            // Warehouse Administrator: solid to Dispatch Supervisor, dotted to Warehouse Ops Manager
            const whAdmin = getRoleReportingMeta('warehouse_administrator');
            expect(whAdmin.reportsToRole).toBe('dispatch_supervisor');
            expect(whAdmin.dottedLineRole).toBe('warehouse_operations_manager');
        });
    });

    describe('2. Hiring Governance & Authority', () => {
        it('Group CEO can employ Group CMO, but Group CMO cannot employ Group CEO or C-Suite peers', () => {
            expect(canEmployRole('group_ceo', 'group_cmo')).toBe(true);
            expect(canEmployRole('group_ceo', 'group_cmo')).toBe(true);

            expect(canEmployRole('group_cmo', 'group_ceo')).toBe(false);
            expect(canEmployRole('group_cmo', 'group_coo')).toBe(false);
            expect(canEmployRole('group_cmo', 'group_cfo')).toBe(false);
            expect(canEmployRole('group_cmo', 'group_cmo')).toBe(false);

            // Group CMO can employ subordinates in marketing / commercial operations
            expect(canEmployRole('group_cmo', 'merchandising_specialist')).toBe(true);
            expect(canEmployRole('group_cmo', 'buyer')).toBe(true);
            expect(canEmployRole('group_cmo', 'store_manager')).toBe(true);
        });

        it('Executive and Functional Directors can employ regional department managers', () => {
            expect(canEmployRole('country_technology_director', 'regional_it_manager')).toBe(true);
            expect(canEmployRole('group_cto', 'regional_it_manager')).toBe(true);
            expect(canEmployRole('country_managing_director', 'regional_it_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'regional_it_manager')).toBe(true);

            expect(canEmployRole('country_compliance_manager', 'regional_compliance_manager')).toBe(true);
            expect(canEmployRole('group_cae', 'regional_compliance_manager')).toBe(true);
            expect(canEmployRole('country_managing_director', 'regional_compliance_manager')).toBe(true);
            expect(canEmployRole('country_operations_director', 'regional_compliance_manager')).toBe(true);
        });

        it('Facility leadership can employ warehouse supervisors and documentation staff', () => {
            expect(canEmployRole('warehouse_manager', 'inbound_operations_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'outbound_operations_supervisor')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'warehouse_administrator')).toBe(true);

            // Frontline and Shift Supervisors cannot hire
            expect(canEmployRole('pos_supervisor', 'cash_office_officer')).toBe(false);
            expect(canEmployRole('picking_supervisor', 'warehouse_administrator')).toBe(false);
            expect(canEmployRole('cashier', 'store_associate')).toBe(false);
        });
    });

    describe('3. RBAC, Route Access & Permissions Matrix', () => {
        it('verifies Group CMO has executive access and admin status', () => {
            expect(isAdmin('group_cmo')).toBe(true);
            expect(canViewAllSites('group_cmo')).toBe(true);
            expect(canViewAllEmployees('group_cmo')).toBe(true);
            expect(canAccessRoute('group_cmo', '/admin')).toBe(true);
            expect(canAccessRoute('group_cmo', '/sales')).toBe(true);
            expect(canAccessRoute('group_cmo', '/pricing')).toBe(true);
            expect(ACTION_PERMISSIONS.group_cmo.length).toBeGreaterThan(10);
        });

        it('verifies Regional IT Manager and Compliance Manager permissions', () => {
            expect(canViewAllSites('regional_it_manager')).toBe(true);
            expect(canViewAllSites('regional_compliance_manager')).toBe(true);
            expect(canAccessRoute('regional_it_manager', '/settings')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/pos')).toBe(true);
            expect(ACTION_PERMISSIONS.regional_it_manager).toBeDefined();
            expect(ACTION_PERMISSIONS.regional_compliance_manager).toBeDefined();
        });

        it('verifies Inbound and Outbound Supervisors warehouse access', () => {
            expect(canAccessRoute('inbound_operations_supervisor', '/warehouse')).toBe(true);
            expect(canAccessRoute('outbound_operations_supervisor', '/warehouse')).toBe(true);
            expect(ACTION_PERMISSIONS.inbound_operations_supervisor).toContain('warehouse.receive');
            expect(ACTION_PERMISSIONS.outbound_operations_supervisor).toContain('warehouse.dispatch');
        });

        it('verifies Cash Office Officer and Warehouse Administrator permissions', () => {
            expect(canAccessRoute('cash_office_officer', '/pos')).toBe(true);
            expect(ACTION_PERMISSIONS.cash_office_officer).toContain('finance.reconcile_drawer');
            expect(canAccessRoute('warehouse_administrator', '/warehouse')).toBe(true);
            expect(ACTION_PERMISSIONS.warehouse_administrator).toContain('warehouse.dispatch');
        });

        it('enforces multi-site isolation invariant strictly for CEO only', () => {
            const ceo = 'group_ceo';
            const cmo = 'group_cmo';
            const regMgr = 'regional_operations_manager';
            const siteA = 'site-store-nairobi';
            const siteB = 'site-store-mombasa';

            expect(canAccessSite(ceo, siteA, siteB)).toBe(true);
            expect(canAccessSite(cmo, siteA, siteB)).toBe(false);
            expect(canAccessSite(regMgr, siteA, siteB)).toBe(false);
        });
    });

    describe('4. Dynamic Per-Employee Supervisor Reporting Metadata', () => {
        it('supports both reports_to_employee_id (solid) and functional_manager_employee_id (dotted)', () => {
            const storeCashier: Partial<Employee> = {
                id: 'emp-cashier-001',
                name: 'Amina Kimani',
                role: 'cashier',
                siteId: 'site-nairobi-westlands',
                reports_to_employee_id: 'emp-pos-sup-002',
                reportsToEmployeeId: 'emp-pos-sup-002',
                functional_manager_employee_id: 'emp-reg-fin-003',
                functionalManagerEmployeeId: 'emp-reg-fin-003'
            };

            expect(storeCashier.reports_to_employee_id).toBe('emp-pos-sup-002');
            expect(storeCashier.functional_manager_employee_id).toBe('emp-reg-fin-003');

            // Default supervisor meta aligns with dual line expectations
            const cashierMeta = getRoleReportingMeta(storeCashier.role!);
            expect(cashierMeta.reportsToRole).toBe('pos_supervisor');
            expect(cashierMeta.dottedLineRole).toBe('regional_finance_manager');
        });

        it('handles combined inbound and outbound warehouse supervisor reporting', () => {
            const inboundLead: Partial<Employee> = {
                id: 'emp-inbound-001',
                name: 'Tesfaye Alemu',
                role: 'inbound_operations_supervisor',
                reports_to_employee_id: 'emp-wh-ops-mgr-010',
                functional_manager_employee_id: 'emp-wh-gen-mgr-005'
            };

            const meta = getRoleReportingMeta(inboundLead.role!);
            expect(meta.reportsToRole).toBe('warehouse_operations_manager');
            expect(meta.dottedLineRole).toBe('warehouse_manager');
        });
    });
});
