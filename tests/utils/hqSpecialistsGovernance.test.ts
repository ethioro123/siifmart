import { describe, it, expect } from 'vitest';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { canViewCostPrice } from '../../utils/roles';
import { canApprove } from '../../services/permissions.service';
import { ROLE_PERMISSIONS } from '../../services/auth.rbac';

describe('HQ Specialists & Directorate Governance Suite', () => {
    describe('Procurement Buyer (buyer)', () => {
        it('authorizes purchase order drafting and supplier management', () => {
            expect(hasPermission('buyer', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('buyer', 'CREATE_PO')).toBe(true);
            expect(hasPermission('buyer', 'MANAGE_SUPPLIERS')).toBe(true);
            expect(canAccessModule('buyer', 'procurement')).toBe(true);
        });

        it('strictly denies final purchase order sign-off authority (Maker-Checker)', () => {
            expect(hasPermission('buyer', 'APPROVE_PO')).toBe(false);
            expect(canApprove('buyer', 'purchase_order', 50000)).toBe(false);
        });

        it('strictly denies access to sensitive HR compensation and general ledger modules', () => {
            expect(canAccessModule('buyer', 'employees')).toBe(false);
            expect(canAccessModule('buyer', 'finance')).toBe(false);
            expect(canAccessModule('buyer', 'pos')).toBe(false);
        });
    });

    describe('Demand Planner (demand_planner)', () => {
        it('authorizes network inventory planning and historical sales analytics', () => {
            expect(hasPermission('demand_planner', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('demand_planner', 'ACCESS_INVENTORY')).toBe(true);
            expect(hasPermission('demand_planner', 'ACCESS_SALES')).toBe(true);
            expect(canAccessModule('demand_planner', 'inventory')).toBe(true);
            expect(canAccessModule('demand_planner', 'sales')).toBe(true);
        });

        it('masks confidential supplier cost price from Demand Planner', () => {
            expect(canViewCostPrice('demand_planner')).toBe(false);
        });

        it('strictly denies cashier point-of-sale checkout register operations', () => {
            expect(hasPermission('demand_planner', 'PROCESS_SALE')).toBe(false);
            expect(canAccessModule('demand_planner', 'pos')).toBe(false);
        });
    });

    describe('Customs and Import Specialist (customs_import_specialist)', () => {
        it('authorizes freight manifests and import clearance tracking', () => {
            expect(hasPermission('customs_import_specialist', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(canAccessModule('customs_import_specialist', 'procurement')).toBe(true);
        });

        it('strictly denies final PO approval and general ledger access', () => {
            expect(hasPermission('customs_import_specialist', 'APPROVE_PO')).toBe(false);
            expect(canAccessModule('customs_import_specialist', 'finance')).toBe(false);
            expect(canAccessModule('customs_import_specialist', 'employees')).toBe(false);
        });
    });

    describe('Head of Internal Audit (head_of_audit / head_of_audit / auditor)', () => {
        it('authorizes system audit inspection, forensic logs, and financial review', () => {
            expect(hasPermission('country_compliance_manager', 'VIEW_AUDIT_LOGS')).toBe(true);
            expect(hasPermission('country_compliance_manager', 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission('country_compliance_manager', 'ACCESS_SETTINGS')).toBe(true);
            expect(canAccessModule('country_compliance_manager', 'finance')).toBe(true);
            expect(canAccessModule('country_compliance_manager', 'settings')).toBe(true);
        });

        it('authorizes POS Command monitoring while strictly denying cashier checkout (PROCESS_SALE)', () => {
            expect(hasPermission('country_compliance_manager', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('country_compliance_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('country_compliance_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('auditor', 'PROCESS_SALE')).toBe(false);
        });

        it('strictly denies purchase order creation to maintain independent audit integrity', () => {
            expect(hasPermission('country_compliance_manager', 'CREATE_PO')).toBe(false);
            expect(hasPermission('country_compliance_manager', 'CREATE_PO')).toBe(false);
            expect(hasPermission('auditor', 'CREATE_PO')).toBe(false);
        });
    });
});
