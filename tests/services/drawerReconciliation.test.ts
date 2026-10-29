import { describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
import { supabase } from '../../lib/supabase';
import { drawerReconciliationService } from '../../services/drawer-reconciliation.service';
describe('Authenticated drawer reviews', () => {
 it('ignores client-supplied supervisor attribution', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: { id:'s1', supervisor_name:'Authenticated reviewer' },error:null } as never);
  const saved = await drawerReconciliationService.coSignSupervisor('s1',{id:'spoof',name:'Spoof'},'Independent review');
  expect(saved.supervisorName).toBe('Authenticated reviewer');
  expect(supabase.rpc).toHaveBeenCalledWith('review_counter_shift', {p_shift:'s1',p_stage:'supervisor',p_action:'Flagged',p_notes:'Independent review'});
 });
 it('uses the trusted Finance decision instead of updating arbitrary financial fields', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data:{id:'s1',status:'Audited',finance_sign_off_name:'Finance actor'},error:null } as never);
  const saved=await drawerReconciliationService.signOff('s1',{id:'spoof',name:'Spoof'},'Reconciled',{hqNotes:'Finance reviewed'});
  expect(saved.financeSignOffName).toBe('Finance actor');
  expect(supabase.rpc).toHaveBeenCalledWith('review_counter_shift',{p_shift:'s1',p_stage:'finance',p_action:'Reconciled',p_notes:'Finance reviewed'});
 });
});
