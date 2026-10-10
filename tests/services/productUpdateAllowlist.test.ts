import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '../../services/products.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    return {
        supabase: {
            from: mockFrom
        },
        isSupabaseConfigured: () => true
    };
});

describe('productsService.update Allowlist & Schema Safety', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('folds packageType and caseSize into custom_attributes and strips them from top-level columns', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'prod-123',
                            name: 'Cooking Oil 5L',
                            sku: 'KE-OIL01',
                            price: 1500,
                            custom_attributes: {
                                package_type: 'Carton',
                                case_size: 4
                            }
                        },
                        error: null
                    })
                })
            })
        });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'products') {
                return {
                    update: mockUpdate,
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { stock: 10, min_stock: 2, status: 'active', price: 1500, cost_price: 1200 },
                                error: null
                            })
                        })
                    })
                };
            }
            return {};
        });

        await productsService.update('prod-123', {
            name: 'Cooking Oil 5L',
            packageType: 'Carton',
            caseSize: 4,
            brand: 'Pwani'
        } as any);

        expect(mockUpdate).toHaveBeenCalledTimes(1);
        const updatePayload = mockUpdate.mock.calls[0][0];

        // Should NOT send packageType or caseSize as top-level columns (causes PGRST204)
        expect(updatePayload.packageType).toBeUndefined();
        expect(updatePayload.caseSize).toBeUndefined();

        // Should have allowed valid columns
        expect(updatePayload.name).toBe('Cooking Oil 5L');
        expect(updatePayload.brand).toBe('Pwani');

        // Should fold them into custom_attributes
        expect(updatePayload.custom_attributes).toBeDefined();
        expect(updatePayload.custom_attributes.package_type).toBe('Carton');
        expect(updatePayload.custom_attributes.case_size).toBe(4);
    });
});
