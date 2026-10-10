export interface HRCountryPolicy {
    country_code: string;
    annual_leave_days: number;
    sick_leave_days: number;
    maternity_leave_days: number;
    paternity_leave_days: number;
    carry_over_max_days: number;
    standard_work_hours_per_day: number;
    late_grace_period_mins: number;
    overtime_multiplier: number;
    geofence_radius_meters: number;
    dormant_account_threshold_days: number;
    two_tier_leave_approval_required: boolean;
    require_finance_approval_for_salary?: boolean;
    require_dept_approval_for_transfers?: boolean;
    require_compliance_approval_for_identity?: boolean;
    updated_at?: string;
    updated_by?: string;
}

export type DisciplinaryType = 
    | 'Verbal Warning' 
    | 'Written Warning' 
    | 'Final Warning' 
    | 'Suspension' 
    | 'Grievance' 
    | 'Formal Investigation';

export type DisciplinarySeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AppealStatus = 'None' | 'Pending Appeal' | 'Upheld' | 'Overturned';

export interface DisciplinaryRecord {
    id: string;
    country_code: string;
    site_id?: string;
    employee_id: string;
    employee_name: string;
    record_type: DisciplinaryType;
    severity: DisciplinarySeverity;
    title: string;
    description: string;
    action_taken: string;
    appeal_status: AppealStatus;
    issued_by: string;
    issued_by_role: string;
    issued_at: string;
    expires_at?: string;
    confidential_notes?: string;
    created_at?: string;
}

export type RequisitionStatus = 'pending_hq_approval' | 'approved' | 'active_recruiting' | 'closed' | 'cancelled';

export interface JobRequisition {
    id: string;
    country_code: string;
    site_id: string;
    title: string;
    department: string;
    role: string;
    headcount: number;
    target_salary: number;
    status: RequisitionStatus;
    justification: string;
    requested_by: string;
    requested_by_role: string;
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    updated_at: string;
}

export type CandidateStage = 'applied' | 'screening' | 'interview' | 'offered' | 'hired' | 'rejected';

export interface JobCandidate {
    id: string;
    requisition_id?: string;
    country_code: string;
    site_id?: string;
    role?: string;
    name: string;
    email: string;
    phone: string;
    stage: CandidateStage;
    interview_score: number;
    technical_score: number;
    culture_fit_score: number;
    interviewer_notes?: string;
    offered_salary?: number;
    resume_url?: string;
    hr_approved_by?: string;
    hr_approved_at?: string;
    hr_notes?: string;
    finance_approved_by?: string;
    finance_approved_at?: string;
    finance_notes?: string;
    hired_employee_id?: string;
    created_at: string;
    updated_at: string;
}

export interface PerformanceReview {
    id: string;
    country_code: string;
    employee_id: string;
    employee_name: string;
    review_period: string; // e.g. 'Q3 2026'
    operational_speed_score: number; // 0-100
    shrinkage_prevention_score: number; // 0-100
    attendance_score: number; // 0-100
    collaboration_score: number; // 0-100
    composite_score: number; // 0-100
    strengths: string;
    growth_areas: string;
    pip_required: boolean;
    reviewer_id: string;
    reviewer_name: string;
    reviewer_role: string;
    created_at: string;
}

export type TrainingModule = 
    | 'Cold Chain & FEFO Food Safety'
    | 'POS Anti-Theft & Drawer Balancing'
    | 'Heavy Equipment & Forklift Safety'
    | 'Zero-Trust Chain of Custody'
    | 'Customer Service Excellence'
    | 'Hazardous Materials & Fire Safety';

export type TrainingStatus = 'in_progress' | 'certified' | 'expired' | 'failed';

export interface TrainingRecord {
    id: string;
    country_code: string;
    employee_id: string;
    employee_name: string;
    module_name: TrainingModule;
    status: TrainingStatus;
    score?: number;
    trainer_name: string;
    certified_at: string;
    expires_at?: string;
    certificate_url?: string;
    created_at: string;
}

export interface AccessAuditRecord {
    user_id: string;
    employee_id?: string;
    name: string;
    email: string;
    role: string;
    site_id?: string;
    country_code: string;
    last_login_at?: string;
    is_dormant: boolean;
    days_since_last_login: number;
    deactivation_requested: boolean;
    deactivation_requested_by?: string;
}
