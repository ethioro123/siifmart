import { UserRole } from '../types';
import { getRoleReportingMeta } from '../components/org-chart/hooks/orgReportingLines';
import { SYSTEM_ROLES } from './systemRolesData';

/**
 * Determines whether a manager with `userRole` is authorized to hire/onboard `candidateRole`.
 * Codified under SOP-ORG-039 Enterprise Supervisory Hierarchy & Hiring Governance.
 */
export const canEmployRole = (
    userRole: UserRole | string | undefined,
    candidateRole: UserRole | string
): boolean => {
    if (!userRole) return false;
    const manager = userRole.toLowerCase().trim();
    const candidate = candidateRole.toLowerCase().trim();
    if (manager === candidate || !SYSTEM_ROLES.some(role => role.id === candidate)) return false;

    // Group CEO is the enterprise-wide appointing authority; the independent
    // Chief Audit Executive is appointed by the Board, not management.
    if (manager === 'group_ceo') return candidate !== 'group_cae';

    // All other hiring follows the candidate role's primary reporting line.
    // Dotted-line coordination does not confer appointment authority.
    return getRoleReportingMeta(candidate).reportsToRole === manager;
};

/** HR and the Group CEO provide the checker sign-off for submitted proposals. */
export const canApproveEmployeeOnboarding = (approverRole?: UserRole | string): boolean => {
    if (!approverRole) return false;
    return [
        'group_ceo',
        'group_chro',
        'country_hr_director',
        'regional_hr_manager',
        'hr_generalist'
    ].includes(approverRole.toLowerCase().trim());
};
