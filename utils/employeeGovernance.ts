import { Employee } from '../types';
import { 
    ApprovingAuthority, 
    FieldChangeDiff, 
    GovernanceCategory, 
    GovernanceRuleResult 
} from '../types/employee-change';

/**
 * Checks if the acting user is the CEO or Super Admin with sovereign universal override authority.
 */
export function isSovereignCEO(role?: string): boolean {
    if (!role) return false;
    return ['super_admin', 'admin', 'ceo'].includes(role.toLowerCase());
}

/**
 * Determines the target department's approving authority.
 */
export function getDepartmentApprovingAuthority(department?: string): ApprovingAuthority {
    if (!department) return 'Operations Management';
    const dept = department.toLowerCase();
    if (dept.includes('warehouse') || dept.includes('logistics')) {
        return 'Logistics & Warehouse';
    }
    if (dept.includes('procurement')) {
        return 'Procurement';
    }
    if (dept.includes('security')) {
        return 'Security Management';
    }
    if (dept.includes('finance') || dept.includes('accounting')) {
        return 'Finance Department';
    }
    return 'Operations Management';
}

/**
 * Evaluates whether an employee profile update can be directly applied or requires
 * cross-departmental approval based on the actor's role and the fields being changed.
 *
 * Rules:
 * 1. CEO (super_admin) has sovereign universal override: can edit EVERYTHING directly (0 approvals).
 * 2. HR can initiate edits, but:
 *    - Name, Age / DOB, National ID -> Requires Executive / Compliance approval (ERCA/KRA fraud protection).
 *    - Salary -> Requires Finance Department approval (Segregation of Duties).
 *    - Department / Site Transfer -> Requires Target Department Head approval (Headcount acceptance).
 *    - Role / Status -> Requires Operations Management approval (Security clearance escalation).
 *    - Phone, Address, Emergency Contact, Specialization -> Direct update (No approval required).
 */
export function evaluateEmployeeProfileChanges(
    original: Employee,
    proposed: Partial<Employee>,
    actingUserRole?: string
): GovernanceRuleResult {
    // 1. CEO Sovereign Override: always bypasses approval
    if (isSovereignCEO(actingUserRole)) {
        return {
            requiresApproval: false,
            governanceCategories: [],
            requiredApprovers: [],
            diffs: []
        };
    }

    const diffs: FieldChangeDiff[] = [];

    // --- Identity & Legal Compliance ---
    if (proposed.name !== undefined && proposed.name.trim() !== original.name.trim()) {
        diffs.push({
            field: 'name',
            label: 'Legal Full Name',
            oldValue: original.name,
            newValue: proposed.name,
            governanceCategory: 'identity',
            approvingDepartment: 'Executive / Compliance'
        });
    }

    if (proposed.age !== undefined && Number(proposed.age) !== Number(original.age || 0)) {
        diffs.push({
            field: 'age',
            label: 'Employee Age',
            oldValue: original.age || 'Not set',
            newValue: proposed.age,
            governanceCategory: 'identity',
            approvingDepartment: 'Executive / Compliance'
        });
    }

    if (proposed.dateOfBirth !== undefined && proposed.dateOfBirth !== (original.dateOfBirth || '')) {
        diffs.push({
            field: 'dateOfBirth',
            label: 'Date of Birth',
            oldValue: original.dateOfBirth || 'Not set',
            newValue: proposed.dateOfBirth,
            governanceCategory: 'identity',
            approvingDepartment: 'Executive / Compliance'
        });
    }

    if (proposed.nationalIdNumber !== undefined && proposed.nationalIdNumber.trim() !== (original.nationalIdNumber || '').trim()) {
        diffs.push({
            field: 'nationalIdNumber',
            label: 'National ID / Passport',
            oldValue: original.nationalIdNumber || 'Not set',
            newValue: proposed.nationalIdNumber,
            governanceCategory: 'identity',
            approvingDepartment: 'Executive / Compliance'
        });
    }

    // --- Compensation & Financials ---
    if (proposed.salary !== undefined && Number(proposed.salary) !== Number(original.salary || 0)) {
        diffs.push({
            field: 'salary',
            label: 'Monthly Base Salary',
            oldValue: original.salary || 0,
            newValue: proposed.salary,
            governanceCategory: 'compensation',
            approvingDepartment: 'Finance Department'
        });
    }

    // --- Department Transfer ---
    if (proposed.department !== undefined && proposed.department !== (original.department || 'Retail Operations')) {
        const targetAuthority = getDepartmentApprovingAuthority(proposed.department);
        diffs.push({
            field: 'department',
            label: 'Assigned Department',
            oldValue: original.department || 'Retail Operations',
            newValue: proposed.department,
            governanceCategory: 'department_transfer',
            approvingDepartment: targetAuthority
        });
    }

    // --- Location / Site Transfer ---
    if (proposed.siteId !== undefined && proposed.siteId !== (original.siteId || '')) {
        diffs.push({
            field: 'siteId',
            label: 'Primary Operating Site',
            oldValue: original.siteId,
            newValue: proposed.siteId,
            governanceCategory: 'department_transfer',
            approvingDepartment: 'Operations Management'
        });
    }

    // --- Role & Clearance Escalation ---
    if (proposed.role !== undefined && proposed.role !== original.role) {
        diffs.push({
            field: 'role',
            label: 'System Access Role',
            oldValue: original.role,
            newValue: proposed.role,
            governanceCategory: 'role_privilege',
            approvingDepartment: 'Operations Management'
        });
    }

    // --- Status Escalation ---
    if (proposed.status !== undefined && proposed.status !== original.status) {
        diffs.push({
            field: 'status',
            label: 'Employment Status',
            oldValue: original.status,
            newValue: proposed.status,
            governanceCategory: 'role_privilege',
            approvingDepartment: 'Operations Management'
        });
    }

    // Check if any governed diffs exist
    const requiresApproval = diffs.length > 0;
    const governanceCategories = Array.from(new Set(diffs.map(d => d.governanceCategory)));
    const requiredApprovers = Array.from(new Set(diffs.map(d => d.approvingDepartment)));

    return {
        requiresApproval,
        governanceCategories,
        requiredApprovers,
        diffs
    };
}

/**
 * Checks if a specific manager or executive has the authority to approve a change request.
 * Enforces regional sovereign boundary: Regional managers can ONLY approve requests within their assigned region.
 */
export function canApproveChangeRequest(
    userRole: string,
    authority: ApprovingAuthority,
    context?: {
        userRegionCode?: string;
        targetRegionCode?: string;
    }
): boolean {
    if (isSovereignCEO(userRole)) return true; // CEO can approve ANY request

    // Regional Boundary Guard: Regional managers are locked to their own region
    if (userRole === 'regional_manager') {
        if (context?.userRegionCode && context?.targetRegionCode) {
            if (context.userRegionCode.toLowerCase().trim() !== context.targetRegionCode.toLowerCase().trim()) {
                return false;
            }
        }
    }

    switch (authority) {
        case 'Finance Department':
            return ['finance_manager', 'cfo', 'accountant'].includes(userRole);
        case 'Operations Management':
            return ['operations_manager', 'regional_manager', 'store_manager'].includes(userRole);
        case 'Logistics & Warehouse':
            return ['warehouse_manager', 'logistics_manager', 'operations_manager'].includes(userRole);
        case 'Procurement':
            return ['procurement_manager', 'supply_chain_manager', 'operations_manager'].includes(userRole);
        case 'Security Management':
            return ['security_manager', 'operations_manager'].includes(userRole);
        case 'Executive / Compliance':
            return ['super_admin', 'regional_manager', 'compliance_officer'].includes(userRole);
        default:
            return false;
    }
}
