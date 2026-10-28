/**
 * Salary Change Request Types (Dual-Control 4-Eyes Governance)
 * Strictly separates HR proposal from Finance/Executive approval.
 */

export interface SalaryChangeRequest {
  id: string;
  employeeId: string;
  employee_id?: string;
  employeeName: string;
  employee_name?: string;
  currentSalary: number;
  current_salary?: number;
  proposedSalary: number;
  proposed_salary?: number;
  currency: string;
  siteId?: string;
  site_id?: string;
  countryCode: string;
  country_code?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requested_by?: string;
  requestedByRole: string;
  requested_by_role?: string;
  requestedAt: string;
  requested_at?: string;
  hrClearedBy?: string;
  hr_cleared_by?: string;
  hrClearedAt?: string;
  hr_cleared_at?: string;
  hrNotes?: string;
  hr_notes?: string;
  financeClearedBy?: string;
  finance_cleared_by?: string;
  financeClearedAt?: string;
  finance_cleared_at?: string;
  financeNotes?: string;
  finance_notes?: string;
  cmdApprovedBy?: string;
  cmd_approved_by?: string;
  cmdApprovedAt?: string;
  cmd_approved_at?: string;
  escalatedToGroup?: boolean;
  escalated_to_group?: boolean;
  groupApprovedBy?: string;
  group_approved_by?: string;
  groupApprovedAt?: string;
  group_approved_at?: string;
  approvedBy?: string;
  approved_by?: string;
  approvedByRole?: string;
  approved_by_role?: string;
  approvedAt?: string;
  approved_at?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  rejectedBy?: string;
  rejected_by?: string;
  rejectedAt?: string;
  rejected_at?: string;
}
