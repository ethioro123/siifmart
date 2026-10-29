import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
import { supabase } from '../../lib/supabase';
import { counterControlService } from '../../services/counter-control.service';
import { counterDropService } from '../../services/counter-drop.service';
import type { ShiftRecord } from '../../types';
beforeEach(() => vi.resetAllMocks());
describe('Trusted counter operations', () => {
 it('submits only a blind count and notes, never browser financial totals or reviewer identity', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: { id: 's1', count_submitted_at: '2026-10-30', actual_cash: 100, expected_cash: 95, variance: 5 }, error: null } as never);
  const result = await counterControlService.close({ id: 's1', denominations: { '100': 1 }, discrepancyReason: 'Counted', expectedCash: 0, variance: 0, supervisorId: 'spoof' } as unknown as ShiftRecord);
  expect(supabase.rpc).toHaveBeenCalledWith('submit_counter_count', { p_shift: 's1', p_denominations: { '100': 1 }, p_reason: 'Counted' });
  expect(result.expectedCash).toBe(95); expect(result.variance).toBe(5);
 });
 it('does not claim opening or count success without acknowledgement', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);
  await expect(counterControlService.open('site', 'Counter 1', 100, 'id')).rejects.toThrow('confirmed');
  await expect(counterControlService.close({ id: 's1' } as ShiftRecord)).rejects.toThrow('confirmed');
 });
 it('propagates server authorization failures', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('Denied') } as never);
  await expect(counterControlService.review('s1','finance','Reconciled','Checked independently')).rejects.toThrow('Denied');
 });
 it('does not submit browser identities for supervisor or Finance review', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: { id: 's1' }, error: null } as never);
  await counterControlService.review('s1','supervisor','Flagged','Checked independently');
  expect(supabase.rpc).toHaveBeenCalledWith('review_counter_shift', { p_shift:'s1', p_stage:'supervisor', p_action:'Flagged', p_notes:'Checked independently' });
 });
 it('requests a pending drop without supplying an approver', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: { id: 'd1', status: 'pending_supervisor' }, error: null } as never);
  const result = await counterDropService.request('s1', 25, ' BAG ');
  expect(result.status).toBe('pending_supervisor');
  expect(supabase.rpc).toHaveBeenCalledWith('request_counter_drop', { p_shift:'s1',p_amount:25,p_bag:'BAG',p_reason:'',p_request:expect.any(String) });
 });
 it('validates drop amount and bag before persistence', async () => {
  await expect(counterDropService.request('s1',NaN,'BAG')).rejects.toThrow('Valid');
  await expect(counterDropService.request('s1',25,'')).rejects.toThrow('Valid');
  expect(supabase.rpc).not.toHaveBeenCalled();
 });
});
