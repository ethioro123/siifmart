export type LeaveType = 
    | 'Annual Leave' 
    | 'Sick Leave' 
    | 'Maternity/Paternity' 
    | 'Bereavement' 
    | 'Unpaid Leave' 
    | 'Compensatory';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequestRecord {
    id: string;
    country_code: string;
    site_id?: string;
    employee_id: string;
    employee_name: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: LeaveStatus;
    requested_by: string;
    requested_at: string;
    reviewed_by?: string;
    reviewed_by_name?: string;
    reviewed_by_role?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    created_at?: string;
    updated_at?: string;
}

export type DocumentType = 
    | 'National ID' 
    | 'Passport' 
    | 'Driver License' 
    | 'Resume / CV' 
    | 'Employment Contract' 
    | 'Police Clearance' 
    | 'Educational Certificate' 
    | 'Other';

export interface EmployeeDocumentRecord {
    id: string;
    country_code: string;
    employee_id: string;
    name: string;
    doc_type: DocumentType;
    file_url: string;
    file_size?: number;
    mime_type?: string;
    expiry_date?: string;
    verified: boolean;
    verified_by?: string;
    verified_at?: string;
    uploaded_by: string;
    created_at: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Half-Day' | 'On-Leave';

export interface EmployeeAttendanceRecord {
    id: string;
    country_code: string;
    site_id: string;
    employee_id: string;
    employee_name: string;
    date: string;
    clock_in: string;
    clock_out?: string;
    status: AttendanceStatus;
    hours_worked: number;
    device_info?: string;
    gps_coordinates?: string;
    verified_by?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export type TerminationReasonCode = 
    | 'gross_misconduct'
    | 'job_abandonment'
    | 'voluntary_resignation'
    | 'performance_incompetence'
    | 'contract_expiration'
    | 'redundancy_downsizing'
    | 'medical_incapacity';

export interface TerminationRequestRecord {
    id: string;
    country_code: string;
    site_id?: string;
    employee_id: string;
    employee_name: string;
    employee_role: string;
    reason_code: TerminationReasonCode;
    reason_details: string;
    effective_date: string;
    assets_returned: boolean;
    pos_access_revoked: boolean;
    wms_badge_deactivated: boolean;
    keys_surrendered: boolean;
    cash_drawer_reconciled: boolean;
    status: 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
    proposed_by: string;
    proposed_by_name: string;
    proposed_by_role: string;
    proposed_at: string;
    approved_by?: string;
    approved_by_name?: string;
    approved_by_role?: string;
    approved_at?: string;
    rejection_reason?: string;
    reconciliation_notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface StatutoryLeaveConfig {
    countryCode: string;
    annualLeaveDays: number;
    sickLeaveDays: number;
    maternityLeaveDays: number;
    paternityLeaveDays: number;
    carryOverAllowed: boolean;
    maxCarryOverDays: number;
}
