import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawerReconciliationService } from '../../services/drawer-reconciliation.service';
import { supabase } from '../../lib/supabase';
import { systemLogsService } from '../../services/system-logs.service';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn()
    }
}));

vi.mock('../../services/system-logs.service', () => ({
    systemLogsService: {
        create: vi.fn().mockResolvedValue({ id: 'LOG-001' })
    }
}));

describe('Drawer Reconciliation & Supervisory Co-Attribution (Rule 18)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('attaches on-duty supervisor co-attribution to shift with mandatory notes', async () => {
        const updateMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'SHIFT-001',
                            site_id: 'ST-001',
                            country_code: 'ET',
                            cashier_id: 'EMP-CSH-01',
                            cashier_name: 'Almaz Cashier',
                            opening_float: 1000,
                            cash_sales: 15000,
                            actual_cash: 15800,
                            expected_cash: 16000,
                            variance: -200,
                            supervisor_id: 'EMP-SUP-01',
                            supervisor_name: 'Mekonnen Supervisor',
                            supervisor_co_sign_notes: 'Reviewed drawer count at shift closure. Small shortage due to coin change availability.',
                            supervisor_signed_at: '2026-10-04T18:00:00Z',
                            reconciliation_status: 'Pending'
                        },
                        error: null
                    })
                })
            })
        });

        (supabase.from as any).mockReturnValue({ update: updateMock });

        const record = await drawerReconciliationService.coSignSupervisor(
            'SHIFT-001',
            { id: 'EMP-SUP-01', name: 'Mekonnen Supervisor' },
            'Reviewed drawer count at shift closure. Small shortage due to coin change availability.'
        );

        expect(record.supervisorId).toBe('EMP-SUP-01');
        expect(record.supervisorName).toBe('Mekonnen Supervisor');
        expect(record.supervisorCoSignNotes).toContain('coin change availability');
        expect(systemLogsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'SHIFT_SUPERVISOR_COSIGNED',
                module: 'Financials'
            })
        );
    });

    it('executes finance sign-off and flags discrepancy when cash variance exceeds threshold', async () => {
        const updateMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'SHIFT-002',
                            site_id: 'ST-001',
                            country_code: 'ET',
                            cashier_id: 'EMP-CSH-02',
                            cashier_name: 'Dawit Cashier',
                            opening_float: 1000,
                            cash_sales: 20000,
                            actual_cash: 19000,
                            expected_cash: 21000,
                            variance: -2000, // Short by 2,000 ETB!
                            reconciliation_status: 'Flagged',
                            status: 'Flagged',
                            variance_flagged: true,
                            finance_sign_off_by: 'EMP-FIN-01',
                            finance_sign_off_name: 'Fatuma Head of Finance',
                            finance_sign_off_at: '2026-10-04T20:00:00Z',
                            hq_notes: 'Excessive cash shortage of 2,000 ETB. Escalated for CCTV audit.'
                        },
                        error: null
                    })
                })
            })
        });

        (supabase.from as any).mockReturnValue({ update: updateMock });

        const signed = await drawerReconciliationService.signOff(
            'SHIFT-002',
            { id: 'EMP-FIN-01', name: 'Fatuma Head of Finance' },
            'Flagged',
            { hqNotes: 'Excessive cash shortage of 2,000 ETB. Escalated for CCTV audit.' }
        );

        expect(signed.reconciliationStatus).toBe('Flagged');
        expect(signed.varianceFlagged).toBe(true);
        expect(signed.financeSignOffName).toBe('Fatuma Head of Finance');
        expect(systemLogsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'DRAWER_VARIANCE_FLAGGED',
                module: 'Financials'
            })
        );
    });
});
