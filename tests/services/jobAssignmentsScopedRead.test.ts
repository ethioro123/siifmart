import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ range: vi.fn(), select: vi.fn(), in: vi.fn(), order: vi.fn(), from: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mocks.from } }));
import { jobAssignmentsService } from '../../services/job-assignments.service';
beforeEach(() => {
 vi.clearAllMocks(); mocks.from.mockReturnValue(mocks); mocks.select.mockReturnValue(mocks);
 mocks.in.mockReturnValue(mocks); mocks.order.mockReturnValue(mocks);
 mocks.range.mockResolvedValue({ data: [], error: null });
});
describe('active job assignment reads', () => {
 it('filters by authorized site job IDs and avoids the WMS join', async () => {
  await jobAssignmentsService.getForJobs([{ id: 'a', siteId: 'site' }, { id: 'b', siteId: 'foreign' }], 'site');
  expect(mocks.in).toHaveBeenCalledWith('job_id', ['a']);
  expect(mocks.select.mock.calls[0][0]).not.toContain('wms_jobs');
  expect(mocks.range).toHaveBeenCalledWith(0, 99);
 });
 it('does not query without authorized jobs', async () => {
  await expect(jobAssignmentsService.getForJobs([], 'site')).resolves.toEqual([]);
  expect(mocks.from).not.toHaveBeenCalled();
 });
 it('paginates rather than truncating assignment results', async () => {
  mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 100 }, (_, id) => ({ id: String(id), job_id: 'a' })), error: null }).mockResolvedValueOnce({ data: [{ id: 'last', job_id: 'a' }], error: null });
  expect(await jobAssignmentsService.getForJobs([{ id: 'a', siteId: 'site' }], 'site')).toHaveLength(101);
  expect(mocks.range).toHaveBeenLastCalledWith(100, 199);
 });
 it('propagates failed reads', async () => {
  mocks.range.mockResolvedValue({ data: null, error: new Error('Timeout') });
  await expect(jobAssignmentsService.getForJobs([{ id: 'a', siteId: 'site' }], 'site')).rejects.toThrow('Timeout');
 });
});
