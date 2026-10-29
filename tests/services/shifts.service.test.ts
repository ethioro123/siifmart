import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shiftsService } from '../../services/shifts.service';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    return {
        supabase: {
            from: mockFrom, rpc: vi.fn()
        },
        isSupabaseConfigured: () => true
    };
});

describe('shiftsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens through a trusted counter operation without client identity', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data:{ id:'shift-123', opening_float:500 },error:null } as never);
        const created=await shiftsService.create({id:'shift-123',siteId:'site-bole',cashierId:'untrusted',openingFloat:500,status:'Open'});
        expect(supabase.rpc).toHaveBeenCalledWith('open_counter_shift',{p_site:'site-bole',p_counter:'Counter 1',p_float:500,p_request:'shift-123'});
        expect(created.openingFloat).toBe(500);
    });
    it('submits denominations instead of trusting client totals', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({data:{id:'shift-123',count_submitted_at:'2026-10-30'},error:null} as never);
        await shiftsService.update('shift-123',{status:'Closed',denominations:{100:12},actualCash:1200,variance:50,discrepancyReason:'Counted'});
        expect(supabase.rpc).toHaveBeenCalledWith('submit_counter_count',{p_shift:'shift-123',p_denominations:{100:12},p_reason:'Counted'});
    });
    it('reconciles using the authenticated Finance actor', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({data:{id:'shift-123'},error:null} as never);
        await shiftsService.reconcile('shift-123','Untrusted name','Reconciled','Drawer verified');
        expect(supabase.rpc).toHaveBeenCalledWith('review_counter_shift',{p_shift:'shift-123',p_stage:'finance',p_action:'Reconciled',p_notes:'Drawer verified'});
    });

    it('generates a compliant Z-Report thermal receipt HTML with multi-tender and drawer variance', async () => {
        const { generateZReportReceiptHtml } = await import('../../components/pos-command/utils/receiptTemplate');
        const html = generateZReportReceiptHtml(
            {
                id: 'shf-test-001',
                shiftNumber: 'SHF-2026-001',
                cashierName: 'Abebe Cashier',
                startTime: '2026-09-24T08:00:00Z',
                endTime: '2026-09-24T17:00:00Z',
                openingFloat: 2000,
                cashSales: 15400,
                cardSales: 4200,
                mobileSales: 8900,
                expectedCash: 17400,
                actualCash: 17400,
                variance: 0,
                status: 'Closed',
                denominations: { '200': 87 }
            },
            undefined,
            'Merkato Retail Store',
            'HQ Auditor Selam'
        );

        expect(html).toContain('OFFICIAL Z-REPORT');
        expect(html).toContain('SHF-2026-001');
        expect(html).toContain('Abebe Cashier');
        expect(html).toContain('Merkato Retail Store');
        expect(html).toContain('BALANCED');
        expect(html).toContain('200 ETB note x 87');
        expect(html).toContain('HQ Audit Verified By: HQ Auditor Selam');
    });
});
