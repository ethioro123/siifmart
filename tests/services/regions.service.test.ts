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

    it('calculates dynamic budget status with real-time spend and cap alerts', async () => {
        // Mock getRegionByCode
        const mockRegion = {
            code: 'ke_mombasa',
            name: 'Mombasa Coastal Region',
            country: 'Kenya',
            default_currency: 'KES',
            monthly_procurement_budget: 1000000, // 1M KES
            autonomous_po_limit: 150000,        // 150k KES
            status: 'active'
        };

        const mockSites = [{ id: 'site-001' }, { id: 'site-002' }];
        const mockPOs = [
            { total_amount: 500000, status: 'approved' },
            { total_amount: 380000, status: 'completed' }
        ];

        const poChain: any = {
            select: vi.fn(() => poChain),
            in: vi.fn(() => poChain),
            gte: vi.fn(() => poChain),
            lt: vi.fn(() => poChain),
            then: (resolve: any) => Promise.resolve({ data: mockPOs, error: null }).then(resolve)
        };

        // Mock Supabase chained calls
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'regions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockRegion, error: null })
                };
            }
            if (table === 'sites') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ data: mockSites, error: null })
                };
            }
            if (table === 'purchase_orders') {
                return poChain;
            }
            return {
                select: vi.fn().mockReturnThis()
            };
        });

        const status = await regionsService.getRegionBudgetStatus('ke_mombasa');

        expect(status).not.toBeNull();
        expect(status?.regionCode).toBe('ke_mombasa');
        expect(status?.monthlyBudget).toBe(1000000);
        expect(status?.autonomousPoLimit).toBe(150000);
        // Total spent: 500,000 + 380,000 = 880,000
        expect(status?.currentMonthSpend).toBe(880000);
        expect(status?.remainingBudget).toBe(120000);
        // 88% used -> should trigger isNearCap (>= 85%)
        expect(status?.percentUsed).toBe(88);
        expect(status?.isNearCap).toBe(true);
        expect(status?.isOverBudget).toBe(false);
    });

    it('flags isOverBudget when spend exceeds configured dynamic cap', async () => {
        const mockRegion = {
            code: 'ke_nairobi',
            name: 'Nairobi Metro Region',
            country: 'Kenya',
            default_currency: 'KES',
            monthly_procurement_budget: 500000,
            autonomous_po_limit: 100000,
            status: 'active'
        };

        const mockSites = [{ id: 'site-hq' }];
        const mockPOs = [{ total_amount: 550000, status: 'approved' }];

        const poChain: any = {
            select: vi.fn(() => poChain),
            in: vi.fn(() => poChain),
            gte: vi.fn(() => poChain),
            lt: vi.fn(() => poChain),
            then: (resolve: any) => Promise.resolve({ data: mockPOs, error: null }).then(resolve)
        };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'regions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockRegion, error: null })
                };
            }
            if (table === 'sites') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ data: mockSites, error: null })
                };
            }
            if (table === 'purchase_orders') {
                return poChain;
            }
            return {};
        });

        const status = await regionsService.getRegionBudgetStatus('ke_nairobi');

        expect(status?.isOverBudget).toBe(true);
        expect(status?.remainingBudget).toBe(0);
    });

    it('throws error when sites query fails during budget calculation', async () => {
        const mockRegion = {
            code: 'ke_nairobi',
            name: 'Nairobi Metro Region',
            country: 'KE',
            default_currency: 'KES',
            monthly_procurement_budget: 500000,
            status: 'active'
        };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'regions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockRegion, error: null })
                };
            }
            if (table === 'sites') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network timeout' } })
                };
            }
            return {};
        });

        await expect(regionsService.getRegionBudgetStatus('ke_nairobi')).rejects.toThrow('Unable to fetch sites for region budget: Network timeout');
    });

    it('throws error when purchase orders query fails during budget calculation', async () => {
        const mockRegion = {
            code: 'ke_nairobi',
            name: 'Nairobi Metro Region',
            country: 'KE',
            default_currency: 'KES',
            monthly_procurement_budget: 500000,
            status: 'active'
        };

        const mockSites = [{ id: 'site-hq' }];

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'regions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockRegion, error: null })
                };
            }
            if (table === 'sites') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ data: mockSites, error: null })
                };
            }
            if (table === 'purchase_orders') {
                const poErrChain: any = {
                    select: vi.fn(() => poErrChain),
                    in: vi.fn(() => poErrChain),
                    gte: vi.fn(() => poErrChain),
                    lt: vi.fn(() => poErrChain),
                    then: (resolve: any, reject: any) => Promise.resolve({ data: null, error: { message: 'PO query timeout' } }).then(resolve, reject)
                };
                return poErrChain;
            }
            return {};
        });

        await expect(regionsService.getRegionBudgetStatus('ke_nairobi')).rejects.toThrow('Unable to fetch PO spend for region budget: PO query timeout');
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
        expect(insertedPayload.code).toBe('KE-RIF');
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
