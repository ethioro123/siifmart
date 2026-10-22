import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, PERMISSIONS } from '../../utils/permissions';
import { getRecommendedDepartment } from '../../utils/roleSegregation';

describe('Departmental Sovereignty & Segregation of Duties (Zero-Trust Inter-Department Isolation)', () => {
    describe('1. Human Resources (HR) Department Isolation', () => {
        const hrRoles = ['hr', 'hr_manager'] as const;

        it('strictly blocks HR staff from Financial Command Center (/finance)', () => {
            hrRoles.forEach(role => {
                expect(canAccessModule(role, 'finance'), `HR role "${role}" must NOT access finance module`).toBe(false);
                expect(PERMISSIONS.ACCESS_FINANCE.includes(role as any), `HR role "${role}" must NOT be in ACCESS_FINANCE`).toBe(false);
            });
        });

        it('strictly blocks HR staff from IT System Settings (/settings)', () => {
            hrRoles.forEach(role => {
                expect(canAccessModule(role, 'settings'), `HR role "${role}" must NOT access settings module`).toBe(false);
                expect(PERMISSIONS.ACCESS_SETTINGS.includes(role as any), `HR role "${role}" must NOT be in ACCESS_SETTINGS`).toBe(false);
            });
        });

        it('allows HR staff to access corporate Employee Directory (/employees)', () => {
            hrRoles.forEach(role => {
                expect(canAccessModule(role, 'employees')).toBe(true);
            });
        });
    });

    describe('2. Finance & Accounting Department Isolation (Segregation of Duties)', () => {
        const financeRoles = ['finance_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer'] as const;

        it('strictly blocks Finance staff from corporate Procurement operations (/procurement)', () => {
            financeRoles.forEach(role => {
                expect(canAccessModule(role, 'procurement'), `Finance role "${role}" must NOT access procurement module`).toBe(false);
                expect(PERMISSIONS.ACCESS_PROCUREMENT.includes(role as any), `Finance role "${role}" must NOT be in ACCESS_PROCUREMENT`).toBe(false);
                expect(authService.checkPermission(role, 'procurement.view'), `Finance role "${role}" must NOT have procurement.view`).toBe(false);
            });
        });

        it('strictly blocks Finance staff from Warehouse Inventory (/inventory)', () => {
            financeRoles.forEach(role => {
                expect(canAccessModule(role, 'inventory'), `Finance role "${role}" must NOT access inventory module`).toBe(false);
                expect(PERMISSIONS.ACCESS_INVENTORY.includes(role as any), `Finance role "${role}" must NOT be in ACCESS_INVENTORY`).toBe(false);
                expect(authService.checkPermission(role, 'inventory.view'), `Finance role "${role}" must NOT have inventory.view`).toBe(false);
            });
        });

        it('maps finance roles to Finance department', () => {
            expect(getRecommendedDepartment('finance_manager')).toBe('Finance');
            expect(getRecommendedDepartment('accountant')).toBe('Finance');
            expect(getRecommendedDepartment('treasury_officer')).toBe('Finance');
            expect(getRecommendedDepartment('tax_compliance_officer')).toBe('Finance');
            expect(getRecommendedDepartment('credit_control_officer')).toBe('Finance');
        });
    });

    describe('3. Procurement Department Isolation', () => {
        const procurementRoles = ['procurement_manager', 'buyer', 'vendor_relations_manager', 'customs_import_specialist'] as const;

        it('strictly blocks Procurement staff from Financial Command Center (/finance)', () => {
            procurementRoles.forEach(role => {
                expect(canAccessModule(role, 'finance'), `Procurement role "${role}" must NOT access finance module`).toBe(false);
                expect(PERMISSIONS.ACCESS_FINANCE.includes(role as any), `Procurement role "${role}" must NOT be in ACCESS_FINANCE`).toBe(false);
                expect(authService.checkPermission(role, 'finance.view'), `Procurement role "${role}" must NOT have finance.view`).toBe(false);
            });
        });

        it('strictly blocks Sourcing Buyer from physical Warehouse Inventory (/inventory) and blocks all Procurement staff from stock mutations', () => {
            expect(canAccessModule('buyer', 'inventory')).toBe(false);
            expect(PERMISSIONS.ACCESS_INVENTORY.includes('buyer' as any)).toBe(false);
            expect(authService.checkPermission('buyer', 'inventory.view')).toBe(false);

            procurementRoles.forEach(role => {
                expect(authService.checkPermission(role, 'inventory.adjust'), `Procurement role "${role}" must NOT have inventory.adjust`).toBe(false);
                expect(authService.checkPermission(role, 'inventory.delete'), `Procurement role "${role}" must NOT have inventory.delete`).toBe(false);
            });
        });

        it('strictly blocks Sourcing Buyer & Customs Specialist from consumer retail pricing (/pricing) and blocks all Procurement staff from shelf price edits', () => {
            expect(canAccessModule('buyer', 'pricing')).toBe(false);
            expect(canAccessModule('customs_import_specialist', 'pricing')).toBe(false);

            procurementRoles.forEach(role => {
                expect(authService.checkPermission(role, 'pricing.edit'), `Procurement role "${role}" must NOT have pricing.edit`).toBe(false);
                expect(authService.checkPermission(role, 'pricing.approve_promo'), `Procurement role "${role}" must NOT have pricing.approve_promo`).toBe(false);
            });
        });
    });

    describe('4. Store Management & Floor Roles Isolation', () => {
        it('strictly blocks store_manager from corporate procurement', () => {
            expect(canAccessModule('store_manager', 'procurement')).toBe(false);
            expect(authService.checkPermission('store_manager', 'procurement.view')).toBe(false);
        });

        it('strictly blocks warehouse receiving dock staff from corporate procurement and blocks QC from PO creation/approval', () => {
            expect(canAccessModule('receiver', 'procurement')).toBe(false);
            expect(authService.checkPermission('receiver', 'procurement.view')).toBe(false);
            expect(authService.checkPermission('inbound_qc_inspector', 'procurement.create_po')).toBe(false);
            expect(authService.checkPermission('inbound_qc_inspector', 'procurement.approve_po')).toBe(false);
        });

        it('strictly blocks security from warehouse stock management and blocks fleet from stock mutations', () => {
            expect(canAccessModule('security_manager', 'inventory')).toBe(false);
            expect(authService.checkPermission('security_manager', 'inventory.view')).toBe(false);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'inventory.adjust')).toBe(false);
            expect(authService.checkPermission('fleet_maintenance_supervisor', 'inventory.create')).toBe(false);
        });
    });
});
