import { UserRole } from './auth';

export interface EmployeeTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  status: 'Pending' | 'In-Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  createdBy?: string; // Employee ID or name of who created the task
  regionCode?: string;
  region_code?: string;
  taskType?: string;
  task_type?: string;
}

export interface StaffSchedule {
  id: string;
  siteId: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  role: string; // Role for this specific shift
  notes?: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  regionCode?: string;
  region_code?: string;
  countryCode?: string;
  country_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  hoursWorked: number;
}

export interface Employee {
  id: string;
  code: string; // Simplified Display ID
  siteId: string;
  site_id?: string; // Supabase compatibility
  homeSiteId?: string;
  home_site_id?: string;
  isLoaned?: boolean;
  is_loaned?: boolean;
  loanedAt?: string;
  loaned_at?: string;
  regionCode?: string;
  region_code?: string;
  /** HQ = country-wide authority (default). REGIONAL = locked to regionCode. */
  scopeLevel?: 'HQ' | 'REGIONAL';
  country?: string;
  country_code?: string;
  name: string;
  jobTitle?: string;
  job_title?: string;
  age?: number;
  dateOfBirth?: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';
  joinDate: string;
  department: string;
  avatar: string;
  performanceScore: number;
  specialization?: string;
  salary?: number;
  badges?: string[];
  attendanceRate?: number;
  address?: string;
  emergencyContact?: string;
  nationalIdNumber?: string;
  nationalIdPhoto?: string;
  resumeUrl?: string;
  // Driver-specific fields
  driverType?: 'internal' | 'subcontracted' | 'owner_operator';
  vehicleType?: string; // e.g., "Van", "Truck", "Motorcycle"
  vehiclePlate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  lastLoginGps?: string;
  last_login_gps?: string;
  lastLoginAt?: string;
  last_login_at?: string;
  lastLoginDevice?: string;
  last_login_device?: string;
  loginHistory?: any[];
  login_history?: any[];
  quotaApprovedBy?: string;
  quota_approved_by?: string;
  onboardingTier?: 'FRONTLINE_FAST_TRACK' | 'HQ_GOVERNANCE';
  reportsToEmployeeId?: string;
  reports_to_employee_id?: string;
  functionalManagerEmployeeId?: string;
  functional_manager_employee_id?: string;
  onboarding_tier?: string;
  quotaStatus?: 'WITHIN_QUOTA' | 'EXCEEDED_QUOTA';
  quota_status?: string;
  credentialsHandedOverAt?: string;
  credentials_handed_over_at?: string;
  credentialsHandedOverBy?: string;
  credentials_handed_over_by?: string;
}

export interface FacilityHeadcountQuota {
  id: string;
  siteId: string;
  site_id?: string;
  role: UserRole;
  approvedQuota: number;
  approved_quota?: number;
  standardGrade: string;
  standard_grade?: string;
  maxMonthlySalary?: number;
  max_monthly_salary?: number;
  countryCode: string;
  country_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegionalDelegationRule {
  id: string;
  regionCode: string;
  region_code?: string;
  countryCode: string;
  country_code?: string;
  maxAutonomousPoAmount: number;
  max_autonomous_po_amount?: number;
  minMarginThresholdPct: number;
  min_margin_threshold_pct?: number;
  maxPettyCashVoucher: number;
  max_petty_cash_voucher?: number;
  autoActivateL4WithinQuota: boolean;
  auto_activate_l4_within_quota?: boolean;
}

export interface HeadcountQuotaRequest {
  id: string;
  siteId: string;
  site_id?: string;
  siteName?: string;
  site_name?: string;
  regionCode: string;
  region_code?: string;
  countryCode: string;
  country_code?: string;
  role: UserRole;
  currentQuota: number;
  current_quota?: number;
  requestedQuota: number;
  requested_quota?: number;
  increaseAmount: number;
  increase_amount?: number;
  requestType: 'TEMPORARY_SURGE' | 'PERMANENT_EXPANSION';
  request_type?: string;
  reason: string;
  justificationMetrics?: Record<string, any>;
  justification_metrics?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requested_by?: string;
  requestedByRole: string;
  requested_by_role?: string;
  requestedAt?: string;
  requested_at?: string;
  hrClearedBy?: string;
  hr_cleared_by?: string;
  hrClearedAt?: string;
  hr_cleared_at?: string;
  hrClearanceNotes?: string;
  hr_clearance_notes?: string;
  financeClearedBy?: string;
  finance_cleared_by?: string;
  financeClearedAt?: string;
  finance_cleared_at?: string;
  financeClearanceNotes?: string;
  finance_clearance_notes?: string;
  cmdApprovedBy?: string;
  cmd_approved_by?: string;
  cmdApprovedAt?: string;
  cmd_approved_at?: string;
  cmdNotes?: string;
  cmd_notes?: string;
  escalatedToGroup?: boolean;
  escalated_to_group?: boolean;
  groupApprovedBy?: string;
  group_approved_by?: string;
  groupApprovedAt?: string;
  group_approved_at?: string;
  groupNotes?: string;
  group_notes?: string;
  reviewedBy?: string;
  reviewed_by?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  reviewNotes?: string;
  review_notes?: string;
}
