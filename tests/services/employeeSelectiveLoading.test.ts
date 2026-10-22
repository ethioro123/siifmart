import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isManagerialRole, MANAGERIAL_ROLES } from '../../utils/roles';
import { employeesService } from '../../services/employees.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('Selective Employee Loading & Egress Policy (Rule 10)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isManagerialRole helper', () => {
        it('identifies Level 1 executive roles as managerial', () => {
            expect(isManagerialRole('super_admin')).toBe(true);
            expect(isManagerialRole('admin')).toBe(true);
            expect(isManagerialRole('CEO')).toBe(true);
        });

        it('identifies Level 2 corporate directorates as managerial', () => {
            expect(isManagerialRole('regional_operations_manager')).toBe(true);
            expect(isManagerialRole('head_of_operations')).toBe(true);
            expect(isManagerialRole('head_of_finance')).toBe(true);
            expect(isManagerialRole('head_of_hr')).toBe(true);
            expect(isManagerialRole('head_of_procurement')).toBe(true);
            expect(isManagerialRole('head_of_supply_chain')).toBe(true);
            expect(isManagerialRole('head_of_merchandising')).toBe(true);
        });

        it('identifies Level 3 site managers and supervisors as managerial', () => {
            expect(isManagerialRole('store_manager')).toBe(true);
            expect(isManagerialRole('warehouse_manager')).toBe(true);
            expect(isManagerialRole('logistics_manager')).toBe(true);
            expect(isManagerialRole('inventory_manager')).toBe(true);
            expect(isManagerialRole('security_manager')).toBe(true);
            expect(isManagerialRole('dispatch_manager')).toBe(true);
            expect(isManagerialRole('assistant_manager')).toBe(true);
            expect(isManagerialRole('shift_lead')).toBe(true);
            expect(isManagerialRole('store_supervisor')).toBe(true);
        });

        it('identifies Level 4 frontline operators as non-managerial', () => {
            expect(isManagerialRole('cashier')).toBe(false);
            expect(isManagerialRole('sales_associate')).toBe(false);
            expect(isManagerialRole('stock_clerk')).toBe(false);
            expect(isManagerialRole('picker')).toBe(false);
            expect(isManagerialRole('packer')).toBe(false);
            expect(isManagerialRole('receiver')).toBe(false);
            expect(isManagerialRole('driver')).toBe(false);
            expect(isManagerialRole('forklift_operator')).toBe(false);
            expect(isManagerialRole(undefined)).toBe(false);
            expect(isManagerialRole('')).toBe(false);
        });
    });

    describe('employeesService selective fetching queries', () => {
        it('filters by MANAGERIAL_ROLES when onlyManagers is true in getAll', async () => {
            const orMock = vi.fn().mockResolvedValue({
                data: [
                    { id: '1', role: 'super_admin', name: 'CEO' },
                    { id: '2', role: 'store_manager', name: 'Store Lead' }
                ],
                error: null
            });

            const orderMock = vi.fn().mockReturnValue({
                or: orMock
            });

            const selectMock = vi.fn().mockReturnValue({
                order: orderMock
            });

            (supabase.from as any).mockReturnValue({
                select: selectMock
            });

            const res = await employeesService.getAll(undefined, true);
            expect(supabase.from).toHaveBeenCalledWith('employees');
            expect(orMock).toHaveBeenCalledWith(expect.stringContaining('role.in.'));
            expect(res).toHaveLength(2);
        });

        it('scopes by site_id without onlyManagers restriction when a specific site is queried in getAll', async () => {
            const queryResult = {
                data: [
                    { id: '10', site_id: 'store-1', role: 'cashier', name: 'Cashier 1' },
                    { id: '11', site_id: 'store-1', role: 'store_manager', name: 'Manager' }
                ],
                error: null
            };

            const eqMock = vi.fn().mockResolvedValue(queryResult);

            const selectMock = vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                    eq: eqMock
                })
            });

            (supabase.from as any).mockReturnValue({
                select: selectMock
            });

            const res = await employeesService.getAll('store-1', false);
            expect(res).toHaveLength(2);
            expect(eqMock).toHaveBeenCalledWith('site_id', 'store-1');
        });

        it('applies onlyManagers in getPaginated for initial un-filtered view', async () => {
            const orMock = vi.fn().mockResolvedValue({
                data: [
                    { id: '1', role: 'super_admin', name: 'CEO', created_at: '2026-01-01' }
                ],
                error: null,
                count: 1
            });

            // Mock query chain for getPaginated lightweight query
            const mockChain: any = {
                eq: vi.fn().mockReturnThis(),
                or: orMock
            };

            const selectLightMock = vi.fn().mockReturnValue(mockChain);

            // Mock second query for details
            const inDetailsMock = vi.fn().mockResolvedValue({
                data: [{ id: '1', role: 'super_admin', name: 'CEO' }],
                error: null
            });
            const selectDetailsMock = vi.fn().mockReturnValue({
                in: inDetailsMock
            });

            (supabase.from as any)
                .mockReturnValueOnce({ select: selectLightMock })
                .mockReturnValueOnce({ select: selectDetailsMock });

            const result = await employeesService.getPaginated(
                undefined,
                1,
                20,
                '',
                { onlyManagers: true }
            );

            expect(mockChain.or).toHaveBeenCalledWith(expect.stringContaining('role.in.'));
            expect(result.data).toHaveLength(1);
        });
    });
});
