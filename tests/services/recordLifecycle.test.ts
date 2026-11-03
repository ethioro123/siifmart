import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordLifecycleService } from '../../services/record-lifecycle.service';
const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: mock }));
const id = '00000000-0000-4000-8000-000000000001';
const target = '00000000-0000-4000-8000-000000000002';
describe('trusted record lifecycle commands', () => {
  beforeEach(() => vi.clearAllMocks());
  it('sends the requested record and evidence without claimed actor identity or approval authority', async () => {
    mock.rpc.mockResolvedValue({ data: id, error: null });
    expect(await recordLifecycleService.request('site', target, 'Close the empty facility')).toBe(id);
    expect(mock.rpc).toHaveBeenCalledWith('request_record_lifecycle', { p_kind: 'site', p_target_id: target, p_reason: 'Close the empty facility', p_evidence: {} });
  });
  it('validates a meaningful reason and record identity before sending a mutation', async () => {
    await expect(recordLifecycleService.request('site', 'not-a-record', 'delete')).rejects.toThrow();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('propagates a server denial without claiming that a review was saved', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: new Error('Independent reviewer required') });
    await expect(recordLifecycleService.decide(id, 'approve', 'Reviewed the supporting evidence')).rejects.toThrow('Independent reviewer required');
  });
  it('rejects a response for another request and an unconfirmed status', async () => {
    mock.rpc.mockResolvedValueOnce({ data: { request_id: target, status: 'Applied' }, error: null });
    await expect(recordLifecycleService.decide(id, 'approve', 'Reviewed the supporting evidence')).rejects.toThrow('did not confirm');
    mock.rpc.mockResolvedValueOnce({ data: { request_id: id, status: 'Pending' }, error: null });
    await expect(recordLifecycleService.decide(id, 'approve', 'Reviewed the supporting evidence')).rejects.toThrow('did not confirm');
  });
  it('distinguishes departmental clearance from an applied action', async () => {
    mock.rpc.mockResolvedValue({ data: { request_id: id, status: 'Operations cleared' }, error: null });
    expect((await recordLifecycleService.decide(id, 'approve', 'Operations reviewed the closure')).status).toBe('Operations cleared');
  });
  it('withdraws through the server operation rather than deleting evidence', async () => {
    mock.rpc.mockResolvedValue({ data: { request_id: id, status: 'Withdrawn' }, error: null });
    await recordLifecycleService.decide(id, 'withdraw', 'Withdraw for corrected supporting evidence');
    expect(mock.rpc).toHaveBeenCalledWith('withdraw_record_lifecycle', { p_request_id: id, p_reason: 'Withdraw for corrected supporting evidence' });
  });
  it('loads only a bounded country queue and defers terminal history by default', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), in: vi.fn() };
    for (const method of Object.values(query)) method.mockReturnValue(query);
    query.in.mockResolvedValue({ data: [], count: 0, error: null });
    mock.from.mockReturnValue(query);
    await recordLifecycleService.list('ET', 2, false);
    expect(query.eq).toHaveBeenCalledWith('country_code', 'ET');
    expect(query.range).toHaveBeenCalledWith(25, 49);
    expect(query.in).toHaveBeenCalledWith('status', ['Pending', 'Operations cleared', 'Finance cleared']);
  });
});
