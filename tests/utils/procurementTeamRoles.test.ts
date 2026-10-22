import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessRoute } from '../../services/auth.rbac';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { getRoleHierarchy, SYSTEM_ROLES } from '../../utils/roles';
import { getRoleDept, getRoleLevel } from '../../components/org-chart/hooks/orgRoles';

describe('Procurement Directorate Team Roles & Hierarchy', () => {
    describe('1. Procurement Manager (procurement_manager)', () => {
        const role = 'procurement_manager' as const;

        it('has correct route and module access', () => {
            expect(canAccessRoute(role, '/procurement')).toBe(true);
            expect(canAccessRoute(role, '/inventory')).toBe(true);
            expect(canAccessRoute(role, '/warehouse')).toBe(true);
            expect(canAccessRoute(role, '/finance')).toBe(true);
            expect(canAccessRoute(role, '/profile')).toBe(true);

            expect(canAccessModule(role, 'procurement')).toBe(true);
            expect(canAccessModule(role, 'inventory')).toBe(true);
            expect(canAccessModule(role, 'finance')).toBe(true); // Read-only cross-reference for budgets and cost prices
        });

        it('has supervisory PO approval and deletion permissions', () => {
            expect(authService.checkPermission(role, 'procurement.view')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.create_po')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.edit_po')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.approve_po')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.delete_po')).toBe(true);

            expect(hasPermission(role, 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission(role, 'APPROVE_PO')).toBe(true);
        });

        it('has Level 3 ranking and hierarchy rank 82', () => {
            expect(getRoleHierarchy(role)).toBe(82);
            expect(getRoleLevel(role)).toBe(3);
            expect(getRoleDept(role)).toBe('procurement');
            const sysRole = SYSTEM_ROLES.find(r => r.id === role);
            expect(sysRole?.level).toBe(3);
            expect(sysRole?.label).toBe('Head of Procurement');
        });
    });

    describe('2. Sourcing Buyer (buyer)', () => {
        const role = 'buyer' as const;

        it('has procurement route and module access', () => {
            expect(canAccessRoute(role, '/procurement')).toBe(true);
            expect(canAccessRoute(role, '/profile')).toBe(true);
            expect(canAccessRoute(role, '/warehouse')).toBe(false);
            expect(canAccessRoute(role, '/finance')).toBe(false);

            expect(canAccessModule(role, 'procurement')).toBe(true);
            expect(canAccessModule(role, 'finance')).toBe(false);
        });

        it('is a Maker: can create and edit POs, but CANNOT approve them', () => {
            expect(authService.checkPermission(role, 'procurement.view')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.create_po')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.edit_po')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.approve_po')).toBe(false);
            expect(authService.checkPermission(role, 'procurement.delete_po')).toBe(false);

            expect(hasPermission(role, 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission(role, 'CREATE_PO')).toBe(true);
            expect(hasPermission(role, 'APPROVE_PO')).toBe(false);
        });

        it('has Level 9 ranking and hierarchy rank 30', () => {
            expect(getRoleHierarchy(role)).toBe(30);
            expect(getRoleLevel(role)).toBe(9);
            expect(getRoleDept(role)).toBe('procurement');
        });
    });

    describe('3. Vendor Relations Manager (vendor_relations_manager)', () => {
        const role = 'vendor_relations_manager' as const;

        it('has procurement and pricing route access for supplier governance', () => {
            expect(canAccessRoute(role, '/procurement')).toBe(true);
            expect(canAccessRoute(role, '/pricing')).toBe(true);
            expect(canAccessRoute(role, '/inventory')).toBe(true);
            expect(canAccessModule(role, 'procurement')).toBe(true);
        });

        it('has Level 7 ranking and hierarchy rank 60', () => {
            expect(getRoleHierarchy(role)).toBe(60);
            expect(getRoleLevel(role)).toBe(7); // Functional & Department Manager tier
            expect(getRoleDept(role)).toBe('procurement');
            const sysRole = SYSTEM_ROLES.find(r => r.id === role);
            expect(sysRole?.level).toBe(7);
            expect(sysRole?.label).toBe('Vendor Relations Manager');
        });
    });

    describe('4. Customs & Import Specialist (customs_import_specialist)', () => {
        const role = 'customs_import_specialist' as const;

        it('has procurement and inventory route access for port clearance', () => {
            expect(canAccessRoute(role, '/procurement')).toBe(true);
            expect(canAccessRoute(role, '/inventory')).toBe(true);
            expect(canAccessModule(role, 'procurement')).toBe(true);
        });

        it('is a Maker: cannot approve purchase orders unilaterally', () => {
            expect(authService.checkPermission(role, 'procurement.approve_po')).toBe(false);
            expect(hasPermission(role, 'APPROVE_PO')).toBe(false);
        });

        it('has Level 4 ranking and hierarchy rank 35', () => {
            expect(getRoleHierarchy(role)).toBe(35);
            expect(getRoleDept(role)).toBe('procurement');
        });
    });

    describe('5. Inbound QC Inspector (inbound_qc_inspector)', () => {
        const role = 'inbound_qc_inspector' as const;

        it('has procurement, warehouse and inventory route access for dock receiving QC', () => {
            expect(canAccessRoute(role, '/procurement')).toBe(true);
            expect(canAccessRoute(role, '/warehouse')).toBe(true);
            expect(canAccessRoute(role, '/inventory')).toBe(true);
            expect(canAccessModule(role, 'procurement')).toBe(true);
            expect(canAccessModule(role, 'warehouse')).toBe(true);
        });

        it('has receiving inspection permissions while blocking PO approval', () => {
            expect(authService.checkPermission(role, 'warehouse.receive')).toBe(true);
            expect(authService.checkPermission(role, 'procurement.approve_po')).toBe(false);
            expect(hasPermission(role, 'APPROVE_PO')).toBe(false);
        });

        it('has Level 4 ranking and hierarchy rank 30', () => {
            expect(getRoleHierarchy(role)).toBe(30);
            expect(getRoleDept(role)).toBe('procurement');
        });
    });
});
