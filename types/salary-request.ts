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
