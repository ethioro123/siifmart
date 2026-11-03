import { beforeEach, describe, expect, it, vi } from 'vitest';
import { terminationsService } from '../../services/terminations.service';
import type { LifecycleRequest } from '../../types/recordLifecycle';
const mock = vi.hoisted(() => ({ request: vi.fn(), single: vi.fn(), from: vi.fn() }));
vi.mock('../../services/record-lifecycle.service', () => ({ recordLifecycleService: { request: mock.request } }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mock.from } }));
const target = '00000000-0000-4000-8000-000000000002';
const id = '00000000-0000-4000-8000-000000000001';
const input = {
  country_code: 'KE', site_id: 'untrusted-site', employee_id: target, employee_name: 'Client claimed name', employee_role: 'cashier',
  reason_code: 'voluntary_resignation' as const, reason_details: 'Verified employee resignation notice', effective_date: '2026-11-03',
  assets_returned: false, pos_access_revoked: false, wms_badge_deactivated: false, keys_surrendered: false, cash_drawer_reconciled: false,
  proposed_by: 'claimed-actor', proposed_by_name: 'Claimed director', proposed_by_role: 'group_ceo'
};
const saved: LifecycleRequest = {
  id, kind: 'employee', target_id: target, target_label: 'Verified employee', site_id: 'verified-site', country_code: 'ET', region_code: 'ADD',
  reason: input.reason_details, evidence: { reason_code: input.reason_code, effective_date: input.effective_date }, original_state: { role: 'cashier', status: 'Active' },
  status: 'Pending', requested_by: 'signed-in-manager', requester_name: 'Verified manager', requester_role: 'store_manager', requested_at: '2026-11-03T10:00:00Z',
  operations_reviewer: null, finance_reviewer: null, reviewed_by: null, reviewed_at: null, decision_reason: null, applied_at: null
};
describe('offboarding evidence persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', { removeItem: vi.fn(), setItem: vi.fn(), getItem: vi.fn() });
    const query = { select: vi.fn(), eq: vi.fn(), single: mock.single };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); mock.from.mockReturnValue(query);
    mock.request.mockResolvedValue(id); mock.single.mockResolvedValue({ data: saved, error: null });
  });
  it('fails closed when the server rejects the request', async () => {
    mock.request.mockRejectedValueOnce(new Error('Request denied'));
    await expect(terminationsService.proposeTermination(input)).rejects.toThrow('Request denied');
    expect(mock.from).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('uses server-derived actor, country and employee identity and never stores evidence locally', async () => {
    const record = await terminationsService.proposeTermination(input);
    expect(record.employee_name).toBe('Verified employee');
    expect(record.country_code).toBe('ET');
    expect(record.proposed_by).toBe('signed-in-manager');
    expect(mock.request).toHaveBeenCalledWith('employee', target, input.reason_details, expect.not.objectContaining({ proposed_by: input.proposed_by }));
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('does not claim a pending request when its saved state cannot be verified', async () => {
    mock.single.mockResolvedValue({ data: { ...saved, status: 'Applied' }, error: null });
    await expect(terminationsService.proposeTermination(input)).rejects.toThrow('could not be verified');
  });
  it('rejects claimed executive approval through the old client-authority method', async () => {
    await expect(terminationsService.approveTermination(id, { id: 'claimed-ceo', name: 'Claimed CEO', role: 'group_ceo' })).rejects.toThrow('Review offboarding evidence');
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('removes legacy browser backups without writing new sensitive data', () => {
    terminationsService._clearCache();
    expect(localStorage.removeItem).toHaveBeenCalledWith('siifmart_terminations_backup');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
