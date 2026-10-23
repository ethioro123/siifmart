import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { purchaseOrdersLifecycleService } from '../../services/purchase-orders.lifecycle';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));
vi.mock('../../services/purchase-orders.read', () => ({ getById: vi.fn() }));
vi.mock('../../services/wms-jobs.service', () => ({ wmsJobsService: {} }));
describe('Putaway PO completion boundary', () => {
    beforeEach(() => vi.clearAllMocks());
    it('sends only the assigned job ID and accepts a confirmed minimal status response', async () => {
        const result = { state: 'synced', po_id: 'po', status: 'Received', changed: true };
        vi.mocked(supabase.rpc).mockResolvedValue({ data: result, error: null } as Awaited<ReturnType<typeof supabase.rpc>>);
        expect(await purchaseOrdersLifecycleService.completeFromPutaway('job')).toEqual(result);
        expect(supabase.rpc).toHaveBeenCalledWith('finalize_po_from_putaway', { p_job_id: 'job' });
        expect(supabase.from).not.toHaveBeenCalled();
    });
    it('propagates a scope rejection without falling back to general PO access', async () => {
        const error = { code: '42501', message: 'Assigned worker required' };
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as Awaited<ReturnType<typeof supabase.rpc>>);
        await expect(purchaseOrdersLifecycleService.completeFromPutaway('job')).rejects.toEqual(error);
        expect(supabase.from).not.toHaveBeenCalled();
    });
    it('rejects missing confirmation or an unsupported returned status', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: { state: 'synced', po_id: 'po', status: 'Approved' }, error: null } as Awaited<ReturnType<typeof supabase.rpc>>);
        await expect(purchaseOrdersLifecycleService.completeFromPutaway('job')).rejects.toThrow('did not confirm');
    });
});
