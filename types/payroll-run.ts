/**
 * Dual-Department Payroll Run Types (Zero-Trust Multi-Department Governance)
 * Enforces: Payroll must be verified and certified by HR (headcount, attendance, active status)
 * AND authorized by Finance (liquidity, statutory tax withholdings, budget) before disbursement.
 * Under 4-Eyes zero-trust, a single actor cannot sign off for both departments.
 */

export type PayrollRunStatus =
  | 'draft'
  | 'pending_verification'
  | 'pending_hr'
  | 'pending_finance'
  | 'approved'
  | 'disbursed'
  | 'rejected';

export interface PayrollRun {
  id: string;
  period: string; // e.g., "October 2026"
  countryCode: string; // 'ET' | 'KE' (Multi-Country Isolation)
  country_code?: string;
  siteId?: string; // specific site or undefined for national
  site_id?: string;
  employeeCount: number;
  employee_count?: number;
  currency: string; // 'ETB' | 'KSh'
  totalGrossSalaries: number;
  total_gross_salaries?: number;
  totalBonuses: number;
  total_bonuses?: number;
  totalDeductions: number;
  total_deductions?: number;
  totalNetPayout: number;
  total_net_payout?: number;
  status: PayrollRunStatus;

  // Initiation
  initiatedBy: string;
  initiated_by?: string;
  initiatedByRole: string;
  initiated_by_role?: string;
  initiatedAt?: string;
  initiated_at?: string;

  // HR Verification (Department 1: Headcount, Attendance, Leaves)
  hrApprovedBy?: string;
  hr_approved_by?: string;
  hrApprovedByRole?: string;
  hr_approved_by_role?: string;
  hrApprovedAt?: string;
  hr_approved_at?: string;
  hrNotes?: string;
  hr_notes?: string;

  // Finance Authorization (Department 2: Funds, Deductions, Bank Validation)
  financeApprovedBy?: string;
  finance_approved_by?: string;
  financeApprovedByRole?: string;
  finance_approved_by_role?: string;
  financeApprovedAt?: string;
  finance_approved_at?: string;
  financeNotes?: string;
  finance_notes?: string;

  // Final Disbursement
  disbursedBy?: string;
  disbursed_by?: string;
  disbursedAt?: string;
  disbursed_at?: string;
  expenseId?: string;
  expense_id?: string;

  // Rejection Tracking
  rejectionReason?: string;
  rejection_reason?: string;
  rejectedBy?: string;
  rejected_by?: string;
  rejectedByRole?: string;
  rejected_by_role?: string;
  rejectedAt?: string;
  rejected_at?: string;

  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}
