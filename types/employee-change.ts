import { Employee } from './employee';
import { UserRole } from './auth';

export type GovernanceCategory = 
    | 'identity'             // Legal Name, Age / DOB, National ID
    | 'compensation'         // Salary, Pay rate
    | 'department_transfer'  // Department, Primary Facility
    | 'role_privilege'       // Role, System Clearance, Status
    | 'contact_general'      // Phone, Address, Emergency Contact
    | 'composite';           // Multiple categories combined

export type ApprovingAuthority =
    | 'Executive / Compliance'
    | 'Finance Department'
    | 'Operations Management'
    | 'Logistics & Warehouse'
    | 'Procurement'
    | 'Security Management';

export interface FieldChangeDiff {
    field: keyof Employee | string;
    label: string;
    oldValue: any;
    newValue: any;
    governanceCategory: GovernanceCategory;
    approvingDepartment: ApprovingAuthority;
}

export interface EmployeeProfileChangeRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    countryCode: string;
    siteId?: string;
    requestedBy: string;
    requestedByRole: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    governanceCategory: GovernanceCategory;
    requiredApprovers: ApprovingAuthority[];
    diffs: FieldChangeDiff[];
    fullProposedEmployee: Partial<Employee>;
    reason: string;
    approvedBy?: string;
    approvedByRole?: string;
    approvedAt?: string;
    rejectionReason?: string;
    rejectedBy?: string;
    rejectedAt?: string;
}

export interface GovernanceRuleResult {
    requiresApproval: boolean;
    governanceCategories: GovernanceCategory[];
    requiredApprovers: ApprovingAuthority[];
    diffs: FieldChangeDiff[];
    blockedReason?: string;
}
