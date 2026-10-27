import { describe, expect, it } from 'vitest';
import { canVoteProductEdit, productEditFields } from '../../utils/productEditApproval';
import type { PendingInventoryChange } from '../../types';
const request = { requestedByEmployeeId: 'requester', productEditApprovals: [] } as unknown as PendingInventoryChange;
describe('regional product edit approval', () => {
    it('allows only the three required regional roles', () => {
        for (const role of ['regional_operations_manager', 'regional_supply_chain_manager', 'regional_merchandising_manager']) {
            expect(canVoteProductEdit(request, role, 'approver')).toBe(true);
        }
        expect(canVoteProductEdit(request, 'group_ceo', 'ceo')).toBe(false);
        expect(canVoteProductEdit(request, 'regional_procurement_manager', 'procurement')).toBe(false);
    });
    it('prevents self approval and repeat approvals by role or person', () => {
        expect(canVoteProductEdit(request, 'regional_operations_manager', 'requester')).toBe(false);
        const voted = { ...request, productEditApprovals: [{ employeeId: 'ops', role: 'regional_operations_manager', name: 'Ops', approvedAt: '2026-10-28' }] };
        expect(canVoteProductEdit(voted, 'regional_operations_manager', 'other')).toBe(false);
        expect(canVoteProductEdit(voted, 'regional_supply_chain_manager', 'ops')).toBe(false);
    });
    it('preserves packaging fields inside the approved attribute snapshot', () => {
        expect(productEditFields({ packageType: 'box', caseSize: 12 }).customAttributes).toEqual({ package_type: 'box', packageType: 'box', case_size: 12, caseSize: 12 });
    });
    it('keeps catalog edits separate from stock, custody, ownership and approval fields', () => {
        expect(productEditFields({ name: 'New name', minStock: 0, stock: 23, siteId: 'elsewhere', location: 'A-01-02', approvedBy: 'CEO', approvalStatus: 'approved' }))
            .toEqual({ name: 'New name', minStock: 0 });
    });
});
