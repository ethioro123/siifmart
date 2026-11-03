import { recordLifecycleService } from './record-lifecycle.service';
import type { TerminationRequestRecord, TerminationReasonCode } from '../types/hr-zero-trust';
import type { LifecycleRequest } from '../types/recordLifecycle';
import { supabase } from '../lib/supabase';
const columns = 'id,kind,target_id,target_label,site_id,country_code,region_code,reason,evidence,original_state,status,requested_by,requester_name,requester_role,requested_at,operations_reviewer,finance_reviewer,reviewed_by,reviewed_at,decision_reason,applied_at';
function mapRequest(row: LifecycleRequest): TerminationRequestRecord {
  return {
    id: row.id, country_code: row.country_code, site_id: row.site_id, employee_id: row.target_id,
    employee_name: row.target_label, employee_role: String(row.original_state.role || ''),
    reason_code: row.evidence.reason_code as TerminationReasonCode, reason_details: row.reason,
    effective_date: String(row.evidence.effective_date || ''),
    assets_returned: row.evidence.assets_returned === true, pos_access_revoked: row.evidence.pos_access_revoked === true,
    wms_badge_deactivated: row.evidence.wms_badge_deactivated === true, keys_surrendered: row.evidence.keys_surrendered === true,
    cash_drawer_reconciled: row.evidence.cash_drawer_reconciled === true,
    status: row.status === 'Applied' ? 'approved' : row.status === 'Rejected' ? 'rejected' : row.status === 'Withdrawn' ? 'cancelled' : 'pending_approval',
    proposed_by: row.requested_by, proposed_by_name: row.requester_name, proposed_by_role: row.requester_role,
    proposed_at: row.requested_at, approved_by: row.reviewed_by || undefined, approved_at: row.reviewed_at || undefined,
    rejection_reason: row.status === 'Rejected' ? row.decision_reason || undefined : undefined,
    reconciliation_notes: String(row.evidence.reconciliation_notes || ''), created_at: row.requested_at
  };
}
export interface OffboardingProposal {
  country_code: string; site_id?: string; employee_id: string; employee_name: string; employee_role: string;
  reason_code: TerminationReasonCode; reason_details: string; effective_date: string;
  assets_returned: boolean; pos_access_revoked: boolean; wms_badge_deactivated: boolean;
  keys_surrendered: boolean; cash_drawer_reconciled: boolean;
  proposed_by: string; proposed_by_name: string; proposed_by_role: string; reconciliation_notes?: string;
}
export const terminationsService = {
  _clearCache(): void { /* Offboarding evidence is never cached in browser storage. */ },
  async fetchTerminations(countryCode: string = 'ET', page = 1): Promise<TerminationRequestRecord[]> {
    const { data, error } = await supabase.from('record_lifecycle_requests').select(columns)
      .eq('kind', 'employee').eq('country_code', countryCode.toUpperCase())
      .order('requested_at', { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    return ((data || []) as LifecycleRequest[]).map(mapRequest);
  },
  async proposeTermination(input: OffboardingProposal): Promise<TerminationRequestRecord> {
    const id = await recordLifecycleService.request('employee', input.employee_id, input.reason_details, {
      reason_code: input.reason_code, effective_date: input.effective_date,
      assets_returned: input.assets_returned, pos_access_revoked: input.pos_access_revoked,
      wms_badge_deactivated: input.wms_badge_deactivated, keys_surrendered: input.keys_surrendered,
      cash_drawer_reconciled: input.cash_drawer_reconciled, reconciliation_notes: input.reconciliation_notes || ''
    });
    const { data, error } = await supabase.from('record_lifecycle_requests').select(columns).eq('id', id).single();
    if (error) throw error;
    if (!data || data.id !== id || data.status !== 'Pending') throw new Error('The saved offboarding request could not be verified.');
    return mapRequest(data as LifecycleRequest);
  },
  async approveTermination(_requestId: string, _approver: { id: string; name: string; role: string }): Promise<boolean> {
    throw new Error('Review offboarding evidence and enter a decision reason in Approvals → Record lifecycle.');
  }
};
