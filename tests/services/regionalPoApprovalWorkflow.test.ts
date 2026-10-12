import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchaseOrdersApprovalService } from '../../services/purchase-orders.approval';
import { regionsService } from '../../services/regions.service';
import * as poReadModule from '../../services/purchase-orders.read';
import { supabase } from '../../lib/supabase';
import type { PurchaseOrder } from '../../types';

describe('Regional Autonomous PO Approval & National HQ Escalation', () => {
    const mockRegionalPO: Partial<PurchaseOrder> = {
        id: 'po-test-regional-1',
        poNumber: 'PO-TEST-001',
        status: 'Draft',
        totalAmount: 100000,
        currency: 'KES',
        country_code: 'KE',
        regionCode: 'ke_mombasa',
        createdBy: 'Maker Staff',
        requestedBy: 'Store Staff',
        lineItems: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock getById
        vi.spyOn(poReadModule, 'getById').mockResolvedValue(mockRegionalPO as PurchaseOrder);

        // Mock region retrieval with dynamic 150,000 KES autonomous limit
        vi.spyOn(regionsService, 'getRegionByCode').mockResolvedValue({
            code: 'ke_mombasa',
            name: 'Mombasa Coastal',
            country: 'Kenya',
            default_currency: 'KES',
            autonomous_po_limit: 150000,
            monthly_procurement_budget: 5000000,
            status: 'active'
        });

        // Mock RPC to trigger fallback direct update for test simplicity
        vi.spyOn(supabase, 'rpc').mockResolvedValue({
            data: null,
            error: { code: '42883', message: 'function public.approve_purchase_order does not exist' } as any,
            count: null,
            status: 400,
            statusText: 'Bad Request'
        } as any);

        // Mock supabase update
        const updateMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        });
        vi.spyOn(supabase, 'from').mockReturnValue({
            update: updateMock,
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ count: 1 })
                })
            })
        } as any);
    });

    it('allows Regional Manager to approve PO autonomously when total is within dynamic limit', async () => {
        const result = await purchaseOrdersApprovalService.approve({
            poId: 'po-test-regional-1',
            approverId: 'emp-rm-1',
            approverName: 'Mombasa Regional Manager',
            approverRole: 'regional_manager',
            reasonCode: 'STANDARD_REPLENISHMENT' as any,
            notes: 'Within autonomous limit'
        });

        expect(result).toBeDefined();
    });

    it('blocks Regional Manager when order exceeds dynamic autonomous PO limit and demands HQ sign-off', async () => {
        // High-value order exceeding 150,000 KES limit
        const highValuePO: Partial<PurchaseOrder> = {
            ...mockRegionalPO,
            totalAmount: 450000
        };
        vi.spyOn(poReadModule, 'getById').mockResolvedValue(highValuePO as PurchaseOrder);

        await expect(
            purchaseOrdersApprovalService.approve({
                poId: 'po-test-regional-1',
                approverId: 'emp-rm-1',
                approverName: 'Mombasa Regional Manager',
                approverRole: 'regional_manager',
                reasonCode: 'STANDARD_REPLENISHMENT' as any
            })
        ).rejects.toThrow(/Autonomous Cap Exceeded.*requires National HQ sign-off/);
    });

    it('permits National HQ Executive (CEO/super_admin) to approve high-value escalated PO', async () => {
        const highValuePO: Partial<PurchaseOrder> = {
            ...mockRegionalPO,
            totalAmount: 450000,
            requiresHqApproval: true
        };
        vi.spyOn(poReadModule, 'getById').mockResolvedValue(highValuePO as PurchaseOrder);

        const result = await purchaseOrdersApprovalService.approve({
            poId: 'po-test-regional-1',
            approverId: 'emp-ceo-1',
            approverName: 'Chief Executive Officer',
            approverRole: 'super_admin',
            reasonCode: 'STANDARD_REPLENISHMENT' as any,
            notes: 'Authorized by National HQ executive review'
        });

        expect(result).toBeDefined();
    });
});
