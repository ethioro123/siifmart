import { describe, it, expect, vi, beforeEach } from 'vitest';
import { regionsService } from '../../services/regions.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

describe('regionsService - Dynamic Budget & Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requests a server-side total without downloading purchase orders', async () => {
        const summary = { regionCode: 'MBA', currentMonthSpend: 880000, monthlyBudget: 1000000, isNearCap: true };
        vi.mocked(supabase.rpc).mockResolvedValue({ data: summary, error: null } as never);
        expect(await regionsService.getRegionBudgetStatus('MBA')).toEqual(summary);
        expect(supabase.rpc).toHaveBeenCalledWith('get_region_budget_status', { p_code: 'MBA' });
        expect(supabase.from).not.toHaveBeenCalled();
    });
    it('propagates a denied summary instead of reporting zero spend', async () => {
        const error = new Error('Budget access denied');
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as never);
        await expect(regionsService.getRegionBudgetStatus('MBA')).rejects.toBe(error);
    });
    it('rejects a summary for a different region', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { regionCode: 'ADD', currentMonthSpend: 0 }, error: null } as never);
        await expect(regionsService.getRegionBudgetStatus('MBA')).rejects.toThrow('Invalid regional budget response');
    });
    it('preserves a configured zero autonomous expense limit when loading lists and records', async () => {
        const row = { code: 'MBA', country: 'KE', autonomous_expense_limit: 0 };
        const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), maybeSingle: vi.fn() };
        chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
        chain.order.mockResolvedValue({ data: [row], error: null });
        chain.maybeSingle.mockResolvedValue({ data: row, error: null });
        vi.mocked(supabase.from).mockReturnValue(chain as never);
        expect((await regionsService.getRegions('KE'))[0].autonomous_expense_limit).toBe(0);
        expect((await regionsService.getRegionByCode('MBA'))?.autonomous_expense_limit).toBe(0);
    });

    it('propagates database error when getRegions fails', async () => {
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection refused' } })
        });

        await expect(regionsService.getRegions('KE')).rejects.toEqual({ message: 'Connection refused' });
    });

    it('standardizes country name to 2-letter ISO in createRegion', async () => {
        let insertedPayload: any = null;
        (supabase.rpc as any).mockImplementation((proc: string, args: any) => {
            insertedPayload = args.p_region;
            return Promise.resolve({
                data: { ...insertedPayload, code: 'ke_rift', id: '1' },
                error: null
            });
        });

        (supabase.from as any).mockImplementation((table: string) => {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { code: 'ke_rift', country: 'KE' },
                    error: null
                })
            };
        });

        await regionsService.createRegion({
            code: 'ke_rift',
            name: 'Rift Valley Region',
            country: 'Kenya',
            default_currency: 'KES',
            autonomous_po_limit: 0,
            change_reason: 'Initial regional authority'
        });

        expect(insertedPayload.country).toBe('KE');
        expect(insertedPayload.code).toBe('RIFT');
    });

    it('rejects duplicate region codes and propagates uniqueness error', async () => {
        (supabase.rpc as any).mockResolvedValue({
            data: null,
            error: { message: 'Region code ET-ADD already exists. Each region code must be unique', code: '23505' }
        });

        await expect(regionsService.createRegion({
            code: 'ET-ADD',
            name: 'Addis Ababa Central Region',
            country: 'ET',
            default_currency: 'ETB',
            autonomous_po_limit: 0,
            change_reason: 'Duplicate region test'
        })).rejects.toThrow('Region code ET-ADD already exists');
    });
});
