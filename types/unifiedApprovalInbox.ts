export type ApprovalReviewType = 'specialist_clearance' | 'final_line_approval';

export interface ApprovalQueueSummary {
  key: string;
  count: number | null;
  status: 'ready' | 'unavailable';
  reviewType?: ApprovalReviewType;
}

export interface ApprovalQueueConfig {
  label: string;
  area: string;
  href: string;
  table: string;
  reviewType: ApprovalReviewType;
  clearanceBadge: string;
  governanceScope: string;
}

export interface UnifiedApprovalInbox {
  total: number;
  unavailable: number;
  checkedAt: string;
  queues: ApprovalQueueSummary[];
}
