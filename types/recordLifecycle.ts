export type LifecycleKind = 'employee' | 'site' | 'purchase_order' | 'transfer';
export interface LifecycleRequest {
  id: string; kind: LifecycleKind; target_id: string; target_label: string;
  site_id: string; country_code: string; region_code: string | null;
  reason: string; evidence: Record<string, string | boolean>; original_state: Record<string, string | number | null>;
  status: 'Pending' | 'Operations cleared' | 'Finance cleared' | 'Applied' | 'Rejected' | 'Withdrawn';
  requested_by: string; requester_name: string; requester_role: string; requested_at: string;
  operations_reviewer: string | null; finance_reviewer: string | null;
  reviewed_by: string | null; reviewed_at: string | null; decision_reason: string | null; applied_at: string | null;
}
export interface LifecycleEvent {
  id: number; request_id: string; actor_id: string; actor_name: string; actor_role: string;
  action: string; reason: string; before_state: Record<string, unknown>; after_state: Record<string, unknown>; occurred_at: string;
}
export interface LifecycleTarget { id: string; label: string; state: string }
export const lifecycleLabels: Record<LifecycleKind, string> = {
  employee: 'Employee offboarding', site: 'Facility closure', purchase_order: 'PO cancellation', transfer: 'Transfer cancellation'
};
