import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { assignmentWorkloadsService } from '../../services/assignment-workloads.service';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
const site = '11111111-1111-4111-8111-111111111111';
const reply = (data: unknown, error: unknown = null) => vi.mocked(supabase.rpc).mockResolvedValue({ data, error } as Awaited<ReturnType<typeof supabase.rpc>>);
beforeEach(() => vi.clearAllMocks());
describe('assignment workload persistence', () => {
    it('loads scoped, deduplicated employee counts instead of partial job history', async () => {
        reply({ workers: [{ employeeId: site, active: 99, completedToday: 12 }], timezone: 'Africa/Addis_Ababa', day: '2026-10-27' });
        const result = await assignmentWorkloadsService.load(site, 'ET', [site, site]);
        expect(result.workers[0]).toEqual({ employeeId: site, active: 99, completedToday: 12 });
        expect(supabase.rpc).toHaveBeenCalledWith('assignment_workloads', { p_site_id: site, p_country_code: 'ET', p_employee_ids: [site] });
    });
    it('propagates capacity rejections without claiming assignment success', async () => {
        const error = { message: 'This employee already has 100 active jobs.' };
        reply(null, error);
        await expect(assignmentWorkloadsService.assign(site, site)).rejects.toEqual(error);
    });
    it('rejects an unconfirmed assignment', async () => {
        reply({ job: { id: site, assigned_to: site } });
        await expect(assignmentWorkloadsService.assign(site, site)).rejects.toThrow('did not confirm');
    });
    it('bounds large team requests to 100 employee IDs', async () => {
        reply({ workers: [], timezone: 'UTC', day: '2026-10-27' });
        const ids = Array.from({ length: 101 }, (_, i) => `11111111-1111-4111-8111-${String(i).padStart(12,'0')}`);
        await assignmentWorkloadsService.load(site, 'ET', ids);
        expect(supabase.rpc).toHaveBeenCalledTimes(2);
        expect(vi.mocked(supabase.rpc).mock.calls[0][1]?.p_employee_ids).toHaveLength(100);
    });
});
