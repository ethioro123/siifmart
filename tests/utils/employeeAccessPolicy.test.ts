import { describe, expect, it } from 'vitest';
import { canManageEmployeeAccess, hasEmployeeAccessScope, newEmployeePassword, type AccessEmployee } from '../../supabase/functions/employee-access/policy';
const actor: AccessEmployee = { id: 'manager', role: 'store_manager', status: 'Active', site_id: 'store', email: 'manager@example.invalid', name: 'Manager' };
const target: AccessEmployee = { id: 'cashier', role: 'cashier', status: 'Active', site_id: 'store', email: 'cashier@example.invalid', name: 'Cashier' };
describe('trusted employee access policy', () => {
    it('permits managers to hand over approved subordinate access', () => {
        expect(canManageEmployeeAccess(actor, target)).toBe(true);
        expect(canManageEmployeeAccess({ ...actor, role: 'hr_generalist' }, target)).toBe(true);
    });
    it.each([
        [{ ...actor, status: 'Suspended' }, target], [actor, { ...target, status: 'Pending Approval' }],
        [actor, { ...target, id: actor.id }], [actor, { ...target, role: actor.role }],
        [{ ...actor, role: 'cashier' }, { ...target, role: 'picker' }],
        [actor, { ...target, role: 'unknown_role' }], [actor, { ...target, badges: ['No App Account'] }]
    ])('denies self, peer, inactive, unauthorized or opted-out targets', (source, employee) => {
        expect(canManageEmployeeAccess(source, employee)).toBe(false);
    });
    it('denies foreign country/site scope even when role authority is valid', () => {
        expect(hasEmployeeAccessScope('store_manager', 'KE', 'KE', 'KE', true)).toBe(true);
        expect(hasEmployeeAccessScope('store_manager', 'KE', 'ET', 'KE', true)).toBe(false);
        expect(hasEmployeeAccessScope('store_manager', 'KE', 'KE', 'KE', false)).toBe(false);
        expect(hasEmployeeAccessScope('group_ceo', 'KE', 'ET', 'ET', true)).toBe(false);
        expect(hasEmployeeAccessScope('group_ceo', 'KE', 'ET', 'KE', true)).toBe(true);
    });
    it('generates unpredictable credentials that satisfy high complexity', () => {
        const first = newEmployeePassword(), second = newEmployeePassword();
        expect(first).not.toBe(second); expect(first.length).toBeGreaterThanOrEqual(48);
        expect(first).toMatch(/[A-Z]/); expect(first).toMatch(/[a-z]/); expect(first).toMatch(/[0-9]/); expect(first).toMatch(/[^a-z0-9]/i);
    });
});
