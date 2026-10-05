import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cashDropsService } from '../../services/cash-drops.service';
import { posOverridesService } from '../../services/pos-overrides.service';
import { SOVEREIGN_CASH_POLICIES } from '../../types/pos-zero-trust';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    return {
        supabase: {
            from: mockFrom
        },
        isSupabaseConfigured: () => true
    };
});

describe('Zero-Trust POS & Cash Governance Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Cash Drops Service (4-Eyes Maker-Checker)', () => {
        it('blocks cash drop when cashier and supervisor are the same person', async () => {
            await expect(
                cashDropsService.createCashDrop({
                    country_code: 'ET',
                    site_id: 'SITE-001',
                    shift_id: 'SHIFT-101',
                    amount: 5000,
                    denominations: {},
                    cashier: { id: 'EMP-001', name: 'Shukri Cashier', code: '1234' },
                    supervisor: { id: 'EMP-001', name: 'Shukri Supervisor', role: 'store_manager', code: '1234' }
                })
            ).rejects.toThrow(/4-Eyes Violation/i);
        });

        it('blocks cash drop when amount is zero or negative', async () => {
            await expect(
                cashDropsService.createCashDrop({
                    country_code: 'ET',
                    site_id: 'SITE-001',
                    shift_id: 'SHIFT-101',
                    amount: 0,
                    denominations: {},
                    cashier: { id: 'EMP-001', name: 'Cashier Staff', code: '1234' },
                    supervisor: { id: 'EMP-002', name: 'Store Manager', role: 'store_manager', code: '9999' }
                })
            ).rejects.toThrow(/Invalid cash drop amount/i);
        });

        it('successfully records cash drop with distinct cashier and supervisor', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockReturnValue({
                insert: mockInsert,
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                id: 'SHIFT-101',
                                opening_float: 2000,
                                cash_sales: 15000,
                                cash_drops: 0
                            },
                            error: null
                        })
                    })
                }),
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            });

            const drop = await cashDropsService.createCashDrop({
                country_code: 'ET',
                site_id: 'SITE-001',
                shift_id: 'SHIFT-101',
                amount: 8000,
                safe_bag_number: 'BAG-9921',
                denominations: { '200': 40 },
                cashier: { id: 'EMP-001', name: 'Cashier Staff', code: '1234' },
                supervisor: { id: 'EMP-002', name: 'Store Manager', role: 'store_manager', code: '9999' }
            });

            expect(drop.amount).toBe(8000);
            expect(drop.status).toBe('deposited_in_safe');
            expect(drop.safe_bag_number).toBe('BAG-9921');
            expect(drop.supervisor_id).toBe('EMP-002');
            expect(mockInsert).toHaveBeenCalled();
        });
    });

    describe('Supervisory Overrides & Velocity Service (Rule 18)', () => {
        it('blocks override when cashier and supervisor are the same person', async () => {
            await expect(
                posOverridesService.logOverride({
                    country_code: 'ET',
                    site_id: 'SITE-001',
                    cashier: { id: 'EMP-001', name: 'Cashier Staff', code: '1111' },
                    supervisor: { id: 'EMP-001', name: 'Manager Self', role: 'store_manager', code: '1111' },
                    override_type: 'cart_void',
                    reason_code: 'customer_walkout'
                })
            ).rejects.toThrow(/4-Eyes Violation/i);
        });

        it('records supervisory override with reason code and manager role', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockReturnValue({ insert: mockInsert });

            const record = await posOverridesService.logOverride({
                country_code: 'ET',
                site_id: 'SITE-001',
                cashier: { id: 'EMP-001', name: 'Cashier Staff', code: '1111' },
                supervisor: { id: 'EMP-002', name: 'Manager Authorized', role: 'store_manager', code: '2222' },
                override_type: 'cart_void',
                reason_code: 'customer_walkout',
                original_value: 3500
            });

            expect(record.override_type).toBe('cart_void');
            expect(record.reason_code).toBe('customer_walkout');
            expect(record.supervisor_id).toBe('EMP-002');
            expect(mockInsert).toHaveBeenCalled();
        });

        it('correctly calculates override velocity and flags excessive overrides (> 3.0%)', async () => {
            // Mock getRecentOverrides returning 5 overrides
            const todayIso = new Date().toISOString();
            const mockOverrides = Array.from({ length: 5 }, (_, i) => ({
                id: `ov-${i}`,
                country_code: 'ET',
                site_id: 'SITE-001',
                cashier_id: 'c1',
                cashier_name: 'Cashier 1',
                supervisor_id: 's1',
                supervisor_name: 'Sup 1',
                supervisor_role: 'store_manager',
                override_type: 'cart_void' as const,
                reason_code: 'customer_walkout' as const,
                original_value: 100,
                override_value: 0,
                created_at: todayIso
            }));

            const mockLimit = vi.fn().mockResolvedValue({
                data: mockOverrides,
                error: null
            });
            const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: mockEq,
                    order: mockOrder
                })
            });

            // 5 overrides out of 100 transactions = 5.0% (> 3.0% threshold)
            const statsExcessive = await posOverridesService.computeVelocityStats('SITE-001', 100);
            expect(statsExcessive.overrideVelocityRate).toBe(5.0);
            expect(statsExcessive.isExcessive).toBe(true);

            // 5 overrides out of 300 transactions = 1.7% (<= 3.0% threshold)
            const statsNormal = await posOverridesService.computeVelocityStats('SITE-001', 300);
            expect(statsNormal.overrideVelocityRate).toBe(1.7);
            expect(statsNormal.isExcessive).toBe(false);
        });
    });

    describe('Sovereign Multi-Country Cash Policies', () => {
        it('isolates Ethiopia vs Kenya cash thresholds and denominations', () => {
            const et = SOVEREIGN_CASH_POLICIES.ET;
            const ke = SOVEREIGN_CASH_POLICIES.KE;

            expect(et.currency).toBe('ETB');
            expect(et.maximum_threshold).toBe(20000);
            expect(et.denominations).toEqual([200, 100, 50, 10, 5, 1]);

            expect(ke.currency).toBe('KSh');
            expect(ke.maximum_threshold).toBe(50000);
            expect(ke.denominations).toContain(1000);
            expect(ke.denominations).toContain(500);
        });
    });
});
