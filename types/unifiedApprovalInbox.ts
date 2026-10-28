export interface ApprovalQueueSummary {
  key: string;
  count: number | null;
  status: 'ready' | 'unavailable';
}
export interface UnifiedApprovalInbox {
  total: number;
  unavailable: number;
  checkedAt: string;
  queues: ApprovalQueueSummary[];
}
