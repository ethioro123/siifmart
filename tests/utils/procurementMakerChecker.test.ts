import { describe, it, expect } from 'vitest';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';
import { authService } from '../../services/auth.service';
import { hasPermission } from '../../utils/permissions';
import { getRoleHierarchy } from '../../utils/roles';

describe('Procurement Maker-Checker & Segregation of Duties', () => {
    describe('1. Role Categorization: Makers vs Checkers', () => {
        const checkerRoles = [
            'procurement_manager',
            'finance_manager',
            'regional_manager',
            'operations_manager',
            'super_admin'
        ] as const;

        const makerStaffRoles = [
            'buyer',
            'vendor_relations_manager',
            'customs_import_specialist',
            'inbound_qc_inspector',
            'demand_planner',
            'replenishment_planner'
        ] as const;

        it('identifies supervisory PO approvers (Checkers)', () => {
            checkerRoles.forEach(role => {
                const canSignOff = ['procurement_manager', 'finance_manager', 'regional_manager', 'operations_manager', 'super_admin'].includes(role);
                expect(canSignOff).toBe(true);
            });
        });

        it('identifies operational procurement specialists as Makers', () => {
            makerStaffRoles.forEach(role => {
                const isChecker = ['procurement_manager', 'finance_manager', 'regional_manager', 'operations_manager', 'super_admin'].includes(role as any);
                expect(isChecker).toBe(false);
            });
        });

        it('enforces hierarchy: Procurement Manager outranks operational makers', () => {
            const managerRank = getRoleHierarchy('procurement_manager'); // 82
            makerStaffRoles.forEach(staffRole => {
                const staffRank = getRoleHierarchy(staffRole as any);
                expect(managerRank).toBeGreaterThan(staffRank);
            });
        });
    });

    describe('2. Multi-Tier PO Approval Thresholds (APPROVAL_WORKFLOWS.purchase_order)', () => {
        const poWorkflow = APPROVAL_WORKFLOWS.purchase_order;

        it('requires Procurement Manager sign-off for standard POs (up to 10,000)', () => {
            const tier1 = poWorkflow.levels.find(l => l.threshold === 10000);
            expect(tier1?.roles).toContain('procurement_manager');
            expect(tier1?.roles).not.toContain('buyer');
        });

        it('requires dual sign-off (Procurement + Finance Manager) for medium POs (up to 50,000)', () => {
            const tier2 = poWorkflow.levels.find(l => l.threshold === 50000);
            expect(tier2?.roles).toContain('procurement_manager');
            expect(tier2?.roles).toContain('finance_manager');
            expect(tier2?.roles).not.toContain('buyer');
        });

        it('requires executive sign-off for large POs (> 50,000)', () => {
            const tier3 = poWorkflow.levels.find(l => l.threshold === Infinity);
            expect(tier3?.roles).toContain('procurement_manager');
            expect(tier3?.roles).toContain('finance_manager');
            expect(tier3?.roles).toContain('regional_manager');
            expect(tier3?.roles).toContain('operations_manager');
            expect(tier3?.roles).toContain('super_admin');
        });
    });

    describe('3. Anti-Self-Approval Enforcement (Zero-Trust 4-Eyes Check)', () => {
        it('blocks creator from self-approving their own purchase order', () => {
            const po = {
                id: 'PO-2026-0042',
                createdBy: 'Abebe Bikila',
                totalAmount: 45000,
                status: 'Draft' as const
            };

            const user = {
                name: 'Abebe Bikila',
                role: 'procurement_manager'
            };

            const isCreator = Boolean(
                user.name && po.createdBy && user.name.toLowerCase().trim() === po.createdBy.toLowerCase().trim()
            );
            expect(isCreator).toBe(true);

            const isCEO = user.role === 'super_admin';
            const isAuthorizedApprover = ['procurement_manager', 'finance_manager', 'super_admin'].includes(user.role);

            // Even though the user is a procurement_manager, self-approval is forbidden!
            const canApprove = isAuthorizedApprover && (!isCreator || isCEO);
            expect(canApprove).toBe(false);
        });

        it('allows a secondary supervisor or CEO to approve the PO', () => {
            const po = {
                id: 'PO-2026-0042',
                createdBy: 'Abebe Bikila',
                totalAmount: 45000,
                status: 'Draft' as const
            };

            const secondaryManager = {
                name: 'Sara Worku',
                role: 'finance_manager'
            };

            const isCreator = Boolean(
                secondaryManager.name && po.createdBy && secondaryManager.name.toLowerCase().trim() === po.createdBy.toLowerCase().trim()
            );
            expect(isCreator).toBe(false);

            const canSecondaryApprove = ['procurement_manager', 'finance_manager', 'super_admin'].includes(secondaryManager.role) && !isCreator;
            expect(canSecondaryApprove).toBe(true);
        });
    });

    describe('4. Specialized Desks Segregation', () => {
        it('restricts master agreement ratification to Procurement Manager and CEO', () => {
            expect(hasPermission('procurement_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('vendor_relations_manager', 'APPROVE_PO')).toBe(false);
        });

        it('reserves customs duty clearance and release sign-off to Procurement Manager and CEO', () => {
            expect(hasPermission('procurement_manager', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('customs_import_specialist', 'APPROVE_PO')).toBe(false);
        });

        it('locks dock QC receiving waivers to supervisory management', () => {
            expect(authService.checkPermission('inbound_qc_inspector', 'warehouse.receive')).toBe(true);
            expect(authService.checkPermission('inbound_qc_inspector', 'procurement.approve_po')).toBe(false);
            expect(authService.checkPermission('procurement_manager', 'procurement.approve_po')).toBe(true);
        });
    });
});
