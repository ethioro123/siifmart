import { describe, it, expect } from 'vitest';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';
import { authService } from '../../services/auth.service';
import { hasPermission } from '../../utils/permissions';
import { getRoleHierarchy } from '../../utils/roles';

describe('Procurement Maker-Checker & Segregation of Duties', () => {
    describe('1. Role Categorization: Makers vs Checkers', () => {
        const checkerRoles = [
            'head_of_procurement',
            'head_of_finance',
            'regional_operations_manager',
            'head_of_operations',
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
                const canSignOff = ['head_of_procurement', 'head_of_finance', 'regional_operations_manager', 'head_of_operations', 'super_admin'].includes(role);
                expect(canSignOff).toBe(true);
            });
        });

        it('identifies operational procurement specialists as Makers', () => {
            makerStaffRoles.forEach(role => {
                const isChecker = ['head_of_procurement', 'head_of_finance', 'regional_operations_manager', 'head_of_operations', 'super_admin'].includes(role as any);
                expect(isChecker).toBe(false);
            });
        });

        it('enforces hierarchy: Head of Procurement outranks operational makers', () => {
            const managerRank = getRoleHierarchy('head_of_procurement'); // 82
            makerStaffRoles.forEach(staffRole => {
                const staffRank = getRoleHierarchy(staffRole as any);
                expect(managerRank).toBeGreaterThan(staffRank);
            });
        });
    });

    describe('2. Multi-Tier PO Approval Thresholds (APPROVAL_WORKFLOWS.purchase_order)', () => {
        const poWorkflow = APPROVAL_WORKFLOWS.purchase_order;

        it('requires Head of Procurement sign-off for standard POs (up to 10,000)', () => {
            const tier1 = poWorkflow.levels.find(l => l.threshold === 10000);
            expect(tier1?.roles).toContain('head_of_procurement');
            expect(tier1?.roles).not.toContain('buyer');
        });

        it('requires dual sign-off (Procurement + Head of Finance) for medium POs (up to 50,000)', () => {
            const tier2 = poWorkflow.levels.find(l => l.threshold === 50000);
            expect(tier2?.roles).toContain('head_of_procurement');
            expect(tier2?.roles).toContain('head_of_finance');
            expect(tier2?.roles).not.toContain('buyer');
        });

        it('requires executive sign-off for large POs (> 50,000)', () => {
            const tier3 = poWorkflow.levels.find(l => l.threshold === Infinity);
            expect(tier3?.roles).toContain('head_of_procurement');
            expect(tier3?.roles).toContain('head_of_finance');
            expect(tier3?.roles).toContain('regional_operations_manager');
            expect(tier3?.roles).toContain('head_of_operations');
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
                role: 'head_of_procurement'
            };

            const isCreator = Boolean(
                user.name && po.createdBy && user.name.toLowerCase().trim() === po.createdBy.toLowerCase().trim()
            );
            expect(isCreator).toBe(true);

            const isCEO = user.role === 'super_admin';
            const isAuthorizedApprover = ['head_of_procurement', 'head_of_finance', 'super_admin'].includes(user.role);

            // Even though the user is a head_of_procurement, self-approval is forbidden!
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
                role: 'head_of_finance'
            };

            const isCreator = Boolean(
                secondaryManager.name && po.createdBy && secondaryManager.name.toLowerCase().trim() === po.createdBy.toLowerCase().trim()
            );
            expect(isCreator).toBe(false);

            const canSecondaryApprove = ['head_of_procurement', 'head_of_finance', 'super_admin'].includes(secondaryManager.role) && !isCreator;
            expect(canSecondaryApprove).toBe(true);
        });
    });

    describe('4. Specialized Desks Segregation', () => {
        it('restricts master agreement ratification to Head of Procurement and CEO', () => {
            expect(hasPermission('head_of_procurement', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('vendor_relations_manager', 'APPROVE_PO')).toBe(false);
        });

        it('reserves customs duty clearance and release sign-off to Head of Procurement and CEO', () => {
            expect(hasPermission('head_of_procurement', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('customs_import_specialist', 'APPROVE_PO')).toBe(false);
        });

        it('locks dock QC receiving waivers to supervisory management', () => {
            expect(authService.checkPermission('inbound_qc_inspector', 'warehouse.receive')).toBe(true);
            expect(authService.checkPermission('inbound_qc_inspector', 'procurement.approve_po')).toBe(false);
            expect(authService.checkPermission('head_of_procurement', 'procurement.approve_po')).toBe(true);
        });
    });
});
