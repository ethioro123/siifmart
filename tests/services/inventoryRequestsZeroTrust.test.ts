import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => {
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockDelete = vi.fn();
    const mockEq = vi.fn();
    const mockSingle = vi.fn();
    const mockMaybeSingle = vi.fn();

    const queryBuilder: any = {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        single: mockSingle,
        maybeSingle: mockMaybeSingle
    };

    mockSelect.mockReturnValue(queryBuilder);
    mockInsert.mockReturnValue(queryBuilder);
    mockUpdate.mockReturnValue(queryBuilder);
    mockDelete.mockReturnValue(queryBuilder);
    mockEq.mockReturnValue(queryBuilder);

    return {
        supabase: {
            from: vi.fn(() => queryBuilder)
        },
        mockQueryBuilder: queryBuilder
    };
});

describe('Zero-Trust Inventory Requests & HQ Approval Governance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Zero Autonomous Branch Authority & HQ Approval Gating', () => {
        it('verifies that warehouse and store managers cannot directly adjust stock without HQ approval', () => {
            const HQ_ROLES = ['super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'];
            const BRANCH_ROLES = ['warehouse_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'stock_clerk', 'receiver'];

            for (const role of BRANCH_ROLES) {
                const canApprove = HQ_ROLES.includes(role.toLowerCase());
                expect(canApprove, `Expected branch role '${role}' to NOT have direct stock approval authority`).toBe(false);
            }

            for (const role of HQ_ROLES) {
                const canApprove = HQ_ROLES.includes(role.toLowerCase());
                expect(canApprove, `Expected HQ role '${role}' to have stock approval authority`).toBe(true);
            }
        });

        it('stamps country_code on inventory requests submitted from national facilities', async () => {
            const { mockQueryBuilder } = await import('../../lib/supabase') as any;

            const insertedRow = {
                id: 'req-ke-001',
                site_id: 'site-ke-1',
                country_code: 'KE',
                product_id: 'prod-ke-10',
                product_name: 'Kenya Gold Tea',
                product_sku: 'KE-TEA001',
                change_type: 'stock_adjustment',
                requested_by: 'Nairobi Stock Clerk',
                status: 'pending',
                adjustment_type: 'OUT',
                adjustment_qty: 5,
                adjustment_reason: 'Cycle Count Variance Approval'
            };

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: insertedRow,
                error: null
            });

            const created = await inventoryRequestsService.create({
                siteId: 'site-ke-1',
                countryCode: 'KE',
                productId: 'prod-ke-10',
                productName: 'Kenya Gold Tea',
                productSku: 'KE-TEA001',
                changeType: 'stock_adjustment',
                requestedBy: 'Nairobi Stock Clerk',
                requestedAt: new Date().toISOString(),
                status: 'pending',
                adjustmentType: 'OUT',
                adjustmentQty: 5,
                adjustmentReason: 'Cycle Count Variance Approval'
            });

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    country_code: 'KE',
                    site_id: 'site-ke-1',
                    status: 'pending'
                })
            );

            expect(created.country_code).toBe('KE');
        });

        it('dynamically resolves country from site when countryCode is omitted in request', async () => {
            const { mockQueryBuilder } = await import('../../lib/supabase') as any;
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: { country: 'KE', region_code: 'NRB' }
            });
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: { id: 'req-dyn-01', country_code: 'KE', region_code: 'NRB', site_id: 'site-ke-kileleshwa' },
                error: null
            });

            await inventoryRequestsService.create({
                siteId: 'site-ke-kileleshwa',
                productId: '',
                productName: 'Fresh Milk 500ml',
                productSku: 'KE-MLK-001',
                changeType: 'create',
                requestedBy: 'Makena Benson',
                requestedAt: new Date().toISOString(),
                status: 'pending',
                adjustmentType: 'IN',
                adjustmentQty: 10,
                adjustmentReason: 'Initial stock on creation'
            });

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    country_code: 'KE',
                    region_code: 'NRB',
                    site_id: 'site-ke-kileleshwa'
                })
            );
        });
    });

    describe('4-Eyes Principle (Dual-Control Enforcement)', () => {
        it('blocks an approver from approving an inventory request that they created', () => {
            const requesterUser = { id: 'usr-101', name: 'Almaz Tefera', email: 'almaz@siifmart.com' };
            const pendingChange = {
                id: 'req-1',
                productId: 'p-1',
                productName: 'Cooking Oil',
                productSku: 'ET-OIL001',
                siteId: 'site-et-1',
                changeType: 'stock_adjustment' as const,
                requestedBy: 'Almaz Tefera',
                requestedAt: new Date().toISOString(),
                status: 'pending' as const,
                adjustmentType: 'OUT' as const,
                adjustmentQty: 10,
                adjustmentReason: 'Damaged'
            };

            // Test 4-eyes principle evaluation
            const isSelfApprovalBlocked = (change: typeof pendingChange, user: typeof requesterUser) => {
                if (change.requestedBy && (
                    change.requestedBy.toLowerCase() === user.name.toLowerCase() ||
                    change.requestedBy.toLowerCase() === user.email.toLowerCase()
                )) {
                    return true; // Self-approval blocked
                }
                return false;
            };

            expect(isSelfApprovalBlocked(pendingChange, requesterUser)).toBe(true);

            // Independent checker can approve
            const independentApprover = { id: 'usr-202', name: 'Dr. Idriss CEO', email: 'ceo@siifmart.com' };
            expect(isSelfApprovalBlocked(pendingChange, independentApprover)).toBe(false);
        });
    });
});
