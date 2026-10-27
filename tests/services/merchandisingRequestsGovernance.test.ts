import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
    let mockData: any = [];
    let mockCount = 0;
    let mockProducts: any = [];

    const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((from, to) => {
            return Promise.resolve({
                data: mockData.slice(from, to + 1),
                error: null,
                count: mockCount
            });
        })
    };

    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });

    return {
        supabase: {
            from: vi.fn((table: string) => {
                if (table === 'products') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockImplementation(() => Promise.resolve({ data: mockProducts, error: null }))
                    };
                }
                return queryBuilder;
            }),
            rpc: rpcMock
        },
        __setMockData: (data: any[], count: number, products: any[] = []) => {
            mockData = data;
            mockCount = count;
            mockProducts = products;
        },
        __rpcMock: rpcMock,
        __queryBuilder: queryBuilder
    };
});

describe('Merchandising Requests Bounded Pagination & Review Governance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('paginates merchandising proposals with exact count and bounded ranges', async () => {
        const mockRows = Array.from({ length: 50 }, (_, i) => ({
            id: `req-${i + 1}`,
            product_id: `prod-${i + 1}`,
            product_name: `Product ${i + 1}`,
            product_sku: `ET-SKU-${i + 1}`,
            site_id: 'ET-ADD-STR-01',
            country_code: 'ET',
            change_type: 'edit',
            requested_by: 'Specialist A',
            requested_at: new Date(2026, 9, 28, 1, i).toISOString(),
            status: 'pending',
            proposed_changes: { price: 100 + i },
            adjustment_reason: 'PRICE_CHANGE: Regular promo'
        }));

        const mockProducts = [
            {
                id: 'prod-1',
                name: 'Product 1',
                sku: 'ET-SKU-1',
                price: 150,
                cost_price: 120
            }
        ];

        const { __setMockData, __queryBuilder } = await import('../../lib/supabase') as any;
        __setMockData(mockRows, 50, mockProducts);

        const result = await inventoryRequestsService.getMerchandisingRequests('ET', {
            page: 1,
            limit: 20,
            status: 'pending'
        });

        expect(result.data.length).toBe(20);
        expect(result.totalCount).toBe(50);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.totalPages).toBe(3);
        expect(result.hasMore).toBe(true);

        // Verify country code filter was applied
        expect(__queryBuilder.eq).toHaveBeenCalledWith('country_code', 'ET');
        expect(__queryBuilder.eq).toHaveBeenCalledWith('status', 'pending');
        expect(__queryBuilder.range).toHaveBeenCalledWith(0, 19);

        // Verify baseline product enrichment
        const firstItem = result.data[0];
        expect(firstItem.currentProduct).toBeDefined();
        expect(firstItem.currentProduct?.costPrice).toBe(120);
    });

    it('filters review history for completed proposals', async () => {
        const { __setMockData, __queryBuilder } = await import('../../lib/supabase') as any;
        __setMockData([], 0);

        await inventoryRequestsService.getMerchandisingRequests('ET', {
            page: 1,
            limit: 25,
            status: 'completed'
        });

        expect(__queryBuilder.in).toHaveBeenCalledWith('status', ['approved', 'rejected']);
    });

    it('rejectProductEdit invokes reject_product_edit RPC with non-empty reason', async () => {
        const { __rpcMock } = await import('../../lib/supabase') as any;

        await inventoryRequestsService.rejectProductEdit('req-123', 'Margin below floor and supplier cost increased');

        expect(__rpcMock).toHaveBeenCalledWith('reject_product_edit', {
            p_request_id: 'req-123',
            p_reason: 'Margin below floor and supplier cost increased'
        });
    });

    it('rejectProductEdit rejects empty or whitespace reasons', async () => {
        await expect(inventoryRequestsService.rejectProductEdit('req-123', '   '))
            .rejects.toThrow('A rejection reason is required');
    });
});
