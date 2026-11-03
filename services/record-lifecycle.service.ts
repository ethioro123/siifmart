import { lifecycleRequestSchema, lifecycleDecisionSchema } from '../schemas/record-lifecycle.schema';
import { supabase } from '../lib/supabase';
import type { LifecycleKind, LifecycleRequest, LifecycleEvent, LifecycleTarget, LifecycleHold } from '../types/recordLifecycle';
const columns = 'id,kind,target_id,target_label,site_id,country_code,region_code,reason,evidence,original_state,status,requested_by,requester_name,requester_role,requested_at,operations_reviewer,finance_reviewer,reviewed_by,reviewed_at,decision_reason,applied_at';
export const recordLifecycleService = {
  async list(country: string, page: number, history: boolean) {
    let query = supabase.from('record_lifecycle_requests').select(columns, { count: 'exact' })
      .eq('country_code', country).order('requested_at', { ascending: false }).order('id').range((page - 1) * 25, page * 25 - 1);
    if (!history) query = query.in('status', ['Pending', 'Operations cleared', 'Finance cleared']);
    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: (data || []) as LifecycleRequest[], count: count || 0 };
  },
  async targets(kind: LifecycleKind, country: string, search: string, page: number): Promise<LifecycleTarget[]> {
    const { data, error } = await supabase.rpc('list_lifecycle_targets', { p_kind: kind, p_country: country, p_search: search, p_offset: (page - 1) * 25 });
    if (error) throw error;
    return data || [];
  },
  async request(kind: LifecycleKind, targetId: string, reason: string, evidence: Record<string, string | boolean> = {}): Promise<string> {
    lifecycleRequestSchema.parse({ kind, targetId, reason, evidence });
    const { data, error } = await supabase.rpc('request_record_lifecycle', { p_kind: kind, p_target_id: targetId, p_reason: reason.trim(), p_evidence: evidence });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('The server did not confirm the saved request.');
    return data;
  },
  async decide(id: string, decision: 'approve' | 'reject' | 'withdraw', reason: string): Promise<{ request_id: string; status: LifecycleRequest['status'] }> {
    lifecycleDecisionSchema.parse({ id, decision, reason });
    const { data, error } = decision === 'withdraw'
      ? await supabase.rpc('withdraw_record_lifecycle', { p_request_id: id, p_reason: reason.trim() })
      : await supabase.rpc('decide_record_lifecycle', { p_request_id: id, p_approve: decision === 'approve', p_reason: reason.trim() });
    if (error) throw error;
    if (data?.request_id !== id || !['Operations cleared', 'Finance cleared', 'Applied', 'Rejected', 'Withdrawn'].includes(data.status))
      throw new Error('The server did not confirm the decision.');
    return data;
  },
  async holds(kind: LifecycleKind, targetId: string, country: string, page: number): Promise<LifecycleHold[]> {
    const { data, error } = await supabase.from('record_lifecycle_holds')
      .select('id,kind,target_id,site_id,country_code,reason,placed_by,placed_by_name,placed_by_role,placed_at,released_by,released_by_name,released_by_role,released_at,release_reason')
      .eq('kind', kind).eq('target_id', targetId).eq('country_code', country)
      .order('placed_at', { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    return (data || []) as LifecycleHold[];
  },
  async setHold(kind: LifecycleKind, targetId: string, reason: string, release: boolean): Promise<string> {
    lifecycleRequestSchema.parse({ kind, targetId, reason, evidence: {} });
    const { data, error } = await supabase.rpc('set_record_lifecycle_hold', { p_kind: kind, p_target_id: targetId, p_reason: reason.trim(), p_release: release });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('The server did not confirm the hold decision.');
    return data;
  },
  async events(requestId: string, page: number): Promise<LifecycleEvent[]> {
    const { data, error } = await supabase.from('record_lifecycle_events')
      .select('id,request_id,actor_id,actor_name,actor_role,action,reason,before_state,after_state,occurred_at')
      .eq('request_id', requestId).order('id', { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    return (data || []) as LifecycleEvent[];
  }
};
