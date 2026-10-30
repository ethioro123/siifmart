import { beforeEach, describe, expect, it, vi } from 'vitest';
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { functions: { invoke } } }));
import { employeeAccessService } from '../../services/employee-access.service';
beforeEach(() => vi.clearAllMocks());
describe('employee access confirmations', () => {
    it('uses the shared server command without client credentials or role claims', async () => {
        invoke.mockResolvedValue({ data: { employeeId: 'staff', email: 'staff@example.invalid', accountStatus: 'existing' }, error: null });
        await employeeAccessService.prepare('staff', 'KE');
        expect(invoke).toHaveBeenCalledWith('employee-access', { body: { action: 'prepare', employeeId: 'staff', countryCode: 'KE' } });
    });
    it.each([
        { data: { employeeId: 'other', email: 'staff@example.invalid', accountStatus: 'existing' }, error: null },
        { data: { employeeId: 'staff', email: 'staff@example.invalid', accountStatus: 'created' }, error: null },
        { data: { error: 'Access denied' }, error: null },
        { data: null, error: new Error('Function unavailable') }
    ])('rejects unconfirmed or mismatched login access', async result => {
        invoke.mockResolvedValue(result);
        await expect(employeeAccessService.prepare('staff', 'KE')).rejects.toThrow();
    });
    it('requires a matching employee and saved server timestamp to confirm handover', async () => {
        invoke.mockResolvedValue({ data: { employeeId: 'staff' }, error: null });
        await expect(employeeAccessService.complete('staff', 'KE')).rejects.toThrow('not saved');
        invoke.mockResolvedValue({ data: { employeeId: 'staff', handedOverAt: '2026-10-30T10:00:00Z' }, error: null });
        await expect(employeeAccessService.complete('staff', 'KE')).resolves.toBe('2026-10-30T10:00:00Z');
    });
});
