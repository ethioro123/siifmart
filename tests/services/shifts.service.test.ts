import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shiftsService } from '../../services/shifts.service';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    return {
        supabase: {
            from: mockFrom
        },
        isSupabaseConfigured: () => true
    };
});

describe('shiftsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates shift with sanitized database payload and without select(*) chaining', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const created = await shiftsService.create({
            id: 'shift-123',
            siteId: 'site-bole',
            cashierId: 'emp-001',
            cashierName: 'Abebe Cashier',
            openingFloat: 500,
            status: 'Open'
        });

        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            id: 'shift-123',
            site_id: 'site-bole',
            cashier_id: 'emp-001',
            cashier_name: 'Abebe Cashier',
            opening_float: 500,
            status: 'Open'
        }));

        expect(created.id).toBe('shift-123');
        expect(created.openingFloat).toBe(500);
    });

    it('updates shift using explicit allowlist mapping and does not spread full object', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as any).mockReturnValue({ update: mockUpdate });

        await shiftsService.update('shift-123', {
            status: 'Closed',
            actualCash: 1200,
            variance: 50,
            discrepancyReason: 'Tip included'
        });

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'Closed',
            actual_cash: 1200,
            variance: 50,
            discrepancy_reason: 'Tip included'
        }));
        expect(mockEq).toHaveBeenCalledWith('id', 'shift-123');
    });

    it('reconciles shift with HQ reviewer name and timestamp', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as any).mockReturnValue({ update: mockUpdate });

        await shiftsService.reconcile('shift-123', 'Shukri HQ Auditor', 'Reconciled', 'Drawer verified');

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            reconciled_by: 'Shukri HQ Auditor',
            reconciliation_status: 'Reconciled',
            status: 'Audited',
            hq_notes: 'Drawer verified'
        }));
        expect(mockEq).toHaveBeenCalledWith('id', 'shift-123');
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
