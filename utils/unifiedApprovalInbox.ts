import type { ApprovalQueueConfig, ApprovalReviewType } from '../types/unifiedApprovalInbox';

export const APPROVAL_INBOX_KEY = 'unified-approval-inbox';
export const APPROVAL_INBOX_ROLES = new Set([
  'area_operations_manager',
  'buyer',
  'compliance_officer',
  'country_commercial_director',
  'country_compliance_manager',
  'country_finance_director',
  'country_hr_director',
  'country_managing_director',
  'country_operations_director',
  'country_supply_chain_director',
  'country_technology_director',
  'demand_planner',
  'group_ceo',
  'group_cfo',
  'group_chro',
  'hr_generalist',
  'inventory_manager',
  'merchandising_specialist',
  'regional_finance_manager',
  'regional_hr_manager',
  'regional_logistics_manager',
  'regional_merchandising_manager',
  'regional_operations_manager',
  'regional_procurement_manager',
  'regional_security_manager',
  'regional_supply_chain_manager',
  'store_manager',
  'vendor_relations_manager',
  'warehouse_manager'
]);

export const APPROVAL_QUEUES: Record<string, ApprovalQueueConfig> = {
  inventory: {
    label: 'Inventory requests',
    area: 'Inventory',
    href: '/inventory?tab=pending',
    table: 'inventory_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Stock Variance & Adjustment Sign-Off'
  },
  product: {
    label: 'Product changes',
    area: 'Merchandising',
    href: '/pricing?tab=reviews',
    table: 'inventory_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Single Merchandising Sign-Off (Metadata/Images)'
  },
  price: {
    label: 'Price changes',
    area: 'Merchandising',
    href: '/pricing?tab=reviews',
    table: 'inventory_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Single Commercial Sign-Off (In-Policy)'
  },
  planogram: {
    label: 'Shelf layouts',
    area: 'Merchandising',
    href: '/pricing?tab=reviews',
    table: 'inventory_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Shelf Layout & Space Revision'
  },
  price_finance: {
    label: 'Price finance sign-off',
    area: 'Finance',
    href: '/pricing?tab=reviews',
    table: 'inventory_requests',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'Finance Clearance Required',
    governanceScope: 'Below-15% Margin Clearance'
  },
  campaigns: {
    label: 'Campaign proposals',
    area: 'Merchandising',
    href: '/pricing?tab=promos',
    table: 'merchandising_campaign_proposals',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Commercial Promotion Sign-Off'
  },
  purchase_orders: {
    label: 'Purchase orders',
    area: 'Procurement',
    href: '/procurement?tab=orders',
    table: 'purchase_orders',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Tiered PO Authority (≤10M Reg / ≤100M Country / >100M HQ)'
  },
  po_finance: {
    label: 'PO finance clearance',
    area: 'Finance',
    href: '/finance?tab=po_approvals',
    table: 'purchase_orders',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'Finance Clearance Required',
    governanceScope: 'Spend & Terms Gate (>10M ETB/KES)'
  },
  purchase_requests: {
    label: 'Purchase requests',
    area: 'Procurement',
    href: '/purchase-requests?view=stock',
    table: 'purchase_requisitions',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Procurement Sourcing Requisition'
  },
  product_suggestions: {
    label: 'Product suggestions',
    area: 'Procurement',
    href: '/purchase-requests?view=suggestions',
    table: 'product_suggestions',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Catalog Sourcing Evaluation'
  },
  expenses: {
    label: 'Expense approvals',
    area: 'Finance',
    href: '/finance?tab=expenses',
    table: 'expenses',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Tiered OpEx Authority (≤2M Reg / ≤20M Country / >20M HQ)'
  },
  margin: {
    label: 'Margin exceptions',
    area: 'Finance',
    href: '/finance?tab=margin',
    table: 'margin_approval_requests',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'Finance Clearance Required',
    governanceScope: 'Statutory Margin Exception Gate'
  },
  transfers: {
    label: 'Transfer picking release',
    area: 'Transfers',
    href: '/wms-ops?tab=TRANSFER',
    table: 'wms_jobs',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Warehouse Transfer Dispatch Release'
  },
  hiring_requests: {
    label: 'Hiring requisitions',
    area: 'HR',
    href: '/employees?approval=recruitment',
    table: 'job_requisitions',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Facility Recruitment Authorization'
  },
  candidate_hr: {
    label: 'Candidate HR checks',
    area: 'HR',
    href: '/employees?approval=recruitment',
    table: 'job_candidates',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'HR Band Clearance',
    governanceScope: 'Credentials & Pay Band Verification'
  },
  candidate_finance: {
    label: 'Candidate salary sign-off',
    area: 'HR / Finance',
    href: '/employees?approval=recruitment',
    table: 'job_candidates',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'Finance Clearance Required',
    governanceScope: 'Remuneration & Site Budget Gate'
  },
  salary: {
    label: 'Salary changes',
    area: 'HR / Finance',
    href: '/employees?approval=salary',
    table: 'salary_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Compensation Adjustment Sign-Off'
  },
  headcount: {
    label: 'Headcount requests',
    area: 'HR',
    href: '/employees?approval=headcount',
    table: 'headcount_quota_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Country MD (+10 Quota) / Group HQ Escalation'
  },
  employee_changes: {
    label: 'Employee profile changes',
    area: 'HR',
    href: '/employees?approval=changes',
    table: 'employee_change_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Cross-Department Profile Authorization'
  },
  onboarding: {
    label: 'Employee onboarding',
    area: 'HR',
    href: '/employees?approval=onboarding',
    table: 'employees',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'HR Onboarding Verification'
  },
  payroll_attestation: {
    label: 'Regional payroll attestation',
    area: 'HR',
    href: '/employees?approval=payroll',
    table: 'payroll_runs',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'HR Band Clearance',
    governanceScope: 'Regional Attendance & Hours Verification'
  },
  payroll_hr: {
    label: 'Payroll HR certification',
    area: 'HR',
    href: '/finance?tab=payroll',
    table: 'payroll_runs',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'HR Band Clearance',
    governanceScope: 'Statutory Compliance & Benefits Gate'
  },
  payroll_finance: {
    label: 'Payroll finance sign-off',
    area: 'Finance',
    href: '/finance?tab=payroll',
    table: 'payroll_runs',
    reviewType: 'specialist_clearance',
    clearanceBadge: 'Finance Clearance Required',
    governanceScope: 'Treasury Funding Authorization'
  },
  leave: {
    label: 'Leave requests',
    area: 'HR',
    href: '/employees',
    table: 'leave_requests',
    reviewType: 'final_line_approval',
    clearanceBadge: 'Final Line Approval',
    governanceScope: 'Operational Leave Authorization'
  }
};

export function isSpecialistClearance(key: string): boolean {
  return APPROVAL_QUEUES[key]?.reviewType === 'specialist_clearance';
}

export function getQueueClearanceBadge(key: string): string {
  return APPROVAL_QUEUES[key]?.clearanceBadge || 'Final Line Approval';
}

export function getQueueReviewType(key: string): ApprovalReviewType {
  return APPROVAL_QUEUES[key]?.reviewType || 'final_line_approval';
}

export function approvalSummaryLabel(total: number, unavailable: number): string {
  return `${total}${unavailable ? '+' : ''} approval task${total === 1 ? '' : 's'} awaiting your review${unavailable ? '; some queues unavailable' : ''}`;
}
