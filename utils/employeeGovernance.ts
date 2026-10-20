import { Employee } from '../types';
import { 
    ApprovingAuthority, 
    FieldChangeDiff, 
    GovernanceCategory, 
    GovernanceRuleResult 
} from '../types/employee-change';
import { getRoleHierarchy } from './roles';

/**
 * Checks if the acting user is the CEO or Super Admin with sovereign universal override authority.
 * Country Managing Director ('admin') is Level 98 and NOT sovereign CEO (Level 100).
 */
export function isSovereignCEO(role?: string): boolean {
    if (!role) return false;
    return ['super_admin', 'ceo'].includes(role.toLowerCase().trim());
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
    actingUserRole?: string,
    actingUserId?: string
): GovernanceRuleResult {
    const isTargetCEO = isSovereignCEO(original.role);
    const isActorCEO = isSovereignCEO(actingUserRole);

    // 1. CEO Sovereign Override: Global CEO editing anyone (including themselves) always bypasses approval
    if (isActorCEO) {
        return {
            requiresApproval: false,
            governanceCategories: [],
            requiredApprovers: [],
            diffs: []
        };
    }

    // 2. Protection of Global CEO Profile: Subordinate roles (including Country MD) CANNOT modify Global CEO
    if (isTargetCEO) {
        return {
            requiresApproval: true,
            governanceCategories: ['role_privilege', 'compensation'],
            requiredApprovers: ['Executive / Compliance'],
            diffs: [],
            blockedReason: 'Global CEO profile is sovereignly protected. Subordinate roles cannot modify the Global CEO.'
        };
    }

    // 3. Anti-Self-Compensation & Anti-Self-Promotion Guard
    if (actingUserId && original.id === actingUserId) {
        if (proposed.salary !== undefined && Number(proposed.salary) !== Number(original.salary || 0)) {
            return {
                requiresApproval: true,
                governanceCategories: ['compensation'],
                requiredApprovers: ['Finance Department'],
                diffs: [],
                blockedReason: 'Zero-Trust Anti-Fraud Violation: You cannot alter or propose your own salary.'
            };
        }
        if (proposed.role !== undefined && proposed.role !== original.role) {
            return {
                requiresApproval: true,
                governanceCategories: ['role_privilege'],
                requiredApprovers: ['Executive / Compliance'],
                diffs: [],
                blockedReason: 'Zero-Trust Anti-Fraud Violation: You cannot alter or escalate your own role clearance.'
            };
        }
    }

    // 4. Hierarchy Rank Guard: Non-CEOs cannot modify compensation or role of superiors or equal peers
    if (actingUserRole && original.role) {
        const actorLevel = getRoleHierarchy(actingUserRole);
        const targetLevel = getRoleHierarchy(original.role);
        if (actorLevel <= targetLevel) {
            const hasGovernedChanges = 
                (proposed.salary !== undefined && Number(proposed.salary) !== Number(original.salary || 0)) ||
                (proposed.role !== undefined && proposed.role !== original.role) ||
                (proposed.status !== undefined && proposed.status !== original.status) ||
                (proposed.name !== undefined && proposed.name.trim() !== original.name.trim()) ||
                (proposed.nationalIdNumber !== undefined && proposed.nationalIdNumber.trim() !== (original.nationalIdNumber || '').trim());

            if (hasGovernedChanges) {
                return {
                    requiresApproval: true,
                    governanceCategories: ['role_privilege', 'compensation'],
                    requiredApprovers: ['Executive / Compliance'],
                    diffs: [],
                    blockedReason: `Hierarchy Violation: Subordinate or peer role "${actingUserRole}" (Level ${actorLevel}) cannot modify profile of "${original.role}" (Level ${targetLevel}).`
                };
            }
        }
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
        approverId?: string;
        targetEmployeeId?: string;
        targetEmployeeRole?: string;
        requesterName?: string;
        approverName?: string;
    }
): boolean {
    const isActorCEO = isSovereignCEO(userRole);
    if (isActorCEO) return true; // CEO can approve ANY request

    // Target is CEO: ONLY CEO can approve changes targeting the CEO
    if (context?.targetEmployeeRole && isSovereignCEO(context.targetEmployeeRole)) {
        return false;
    }

    // Anti-Self-Approval: cannot approve changes to own profile
    if (context?.approverId && context?.targetEmployeeId && context.approverId === context.targetEmployeeId) {
        return false;
    }

    // 4-Eyes Principle: Requester cannot approve their own change request
    if (context?.approverName && context?.requesterName && 
        context.approverName.trim().toLowerCase() === context.requesterName.trim().toLowerCase()) {
        return false;
    }

    // Hierarchy Rank Check: Subordinate or peer cannot approve superior or peer request
    if (context?.targetEmployeeRole) {
        const actorLevel = getRoleHierarchy(userRole);
        const targetLevel = getRoleHierarchy(context.targetEmployeeRole);
        if (actorLevel <= targetLevel) {
            return false;
        }
    }

    // Regional Boundary Guard: Regional managers are locked to their own region
    if (userRole === 'regional_manager') {
        if (context?.userRegionCode && context?.targetRegionCode) {
            if (context.userRegionCode.toLowerCase().trim() !== context.targetRegionCode.toLowerCase().trim()) {
                return false;
            }
        }
    }

    switch (authority) {
        case 'Human Resources':
            return ['country_managing_director', 'admin', 'head_of_hr', 'hr_head', 'hr_manager', 'regional_hr_officer', 'hr'].includes(userRole);
        case 'Finance Department':
            return ['country_managing_director', 'admin', 'head_of_finance', 'finance_head', 'finance_manager', 'regional_finance_officer', 'cfo'].includes(userRole);
        case 'Operations Management':
            return ['country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_manager', 'store_manager'].includes(userRole);
        case 'Logistics & Warehouse':
            return ['country_managing_director', 'admin', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_logistics_lead', 'regional_manager', 'warehouse_manager', 'logistics_manager'].includes(userRole);
        case 'Procurement':
            return ['country_managing_director', 'admin', 'head_of_procurement', 'procurement_head', 'procurement_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_procurement_lead', 'regional_manager'].includes(userRole);
        case 'Security Management':
            return ['country_managing_director', 'admin', 'head_of_audit', 'audit_head', 'head_of_it', 'it_head', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_security_supervisor', 'regional_manager', 'security_manager'].includes(userRole);
        case 'Executive / Compliance':
            return ['super_admin', 'country_managing_director', 'admin', 'head_of_audit', 'audit_head', 'compliance_officer'].includes(userRole);
        default:
            return false;
    }
}
