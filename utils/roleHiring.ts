import { UserRole } from '../types';
import { SYSTEM_ROLES, getRoleHierarchy } from './roles';

/**
 * Determines whether a manager with `userRole` is authorized to hire/onboard `candidateRole`.
 * Codified under SOP-ORG-039 Enterprise Supervisory Hierarchy & Hiring Governance.
 */
export const canEmployRole = (
    userRole: UserRole | string | undefined,
    candidateRole: UserRole | string
): boolean => {
    if (!userRole) return false;

    // 1. Global CEO can employ anyone below CEO
    const normUserRole = (userRole || '').toLowerCase();
    const normCandidateRole = (candidateRole || '').toLowerCase();
    if (normUserRole === 'group_ceo' || normUserRole === 'super_admin' || normUserRole === 'ceo') {
        return normCandidateRole !== 'group_ceo' && normCandidateRole !== 'super_admin' && normCandidateRole !== 'ceo';
    }

    // 2. Global Level 1 C-Suite Executives can employ subordinate roles in their vertical domain
    const isLevelOneCSuite = [
        'group_coo', 'group_cfo', 'group_cco', 'group_csco',
        'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae'
    ].includes(normUserRole);
    if (isLevelOneCSuite) {
        const topLeadershipRoles = [
            'group_ceo', 'super_admin', 'ceo', 'group_coo', 'group_cfo',
            'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio',
            'group_clco', 'group_cae'
        ];
        return !topLeadershipRoles.includes(normCandidateRole);
    }

    // 3. Country Managing Director can employ any subordinate country directors, regional managers, and staff
    const isCountryManagingDirector = normUserRole === 'country_managing_director' || normUserRole === 'admin';
    if (isCountryManagingDirector) {
        const topLeadershipAndPeers = [
            'group_ceo', 'super_admin', 'ceo', 'group_coo', 'group_cfo',
            'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio',
            'group_clco', 'group_cae', 'country_managing_director', 'admin'
        ];
        return !topLeadershipAndPeers.includes(normCandidateRole);
    }

    const userHierarchy = getRoleHierarchy(userRole);
    const candidateHierarchy = getRoleHierarchy(candidateRole);

    // Must be strictly below user in the role hierarchy rank
    if (candidateHierarchy >= userHierarchy) {
        return false;
    }

    const userLevel = SYSTEM_ROLES.find(r => r.id === userRole)?.level || 10;
    const candidateLevel = SYSTEM_ROLES.find(r => r.id === candidateRole)?.level || 10;

    // Specialists & Frontline Staff (Levels 9 & 10) have no hiring authority
    if (userLevel >= 9 || userHierarchy < 55) {
        return false;
    }

    // Corporate HQ Directors (Level 3) and Regional Operations Managers (Level 4) can ONLY be appointed by L1 CEO/COO or L2 Country Managing Director
    if (candidateLevel <= 4 && userLevel > 2) {
        return false;
    }

    // Facility Captains (store_manager, warehouse_manager at Level 6) can ONLY be hired by Executive Leadership, Operations Directors, Area Managers, or HR Leadership
    const isFacilityCaptain = candidateRole === 'store_manager' || candidateRole === 'warehouse_manager';
    if (isFacilityCaptain) {
        return [
            'group_ceo', 'group_coo', 'group_csco', 'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
            'country_operations_director', 'country_supply_chain_director', 'country_hr_director',
            'head_of_operations',
            'head_of_supply_chain',
            'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager',
            'regional_hr_manager', 'head_of_hr', 'hr'
        ].includes(userRole as string);
    }

    // Regional Department Managers (Level 5, hierarchy 81-83) can be employed by Executive Leadership, Operations Directors, Regional Operations Manager, HR Leadership, or their Functional Directorate Head
    const isRegionalDepartmentManager = [
        'regional_supply_chain_manager',
        'regional_procurement_manager',
        'regional_merchandising_manager',
        'regional_finance_manager',
        'regional_hr_manager',
        'regional_logistics_manager',
        'regional_security_manager'
    ].includes(candidateRole as string);
    if (isRegionalDepartmentManager) {
        return [
            'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
            'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
            'country_operations_director', 'country_finance_director', 'country_commercial_director',
            'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager',
            'head_of_operations',
            'regional_operations_manager',
            'head_of_hr', 'hr',
            'head_of_procurement',
            'head_of_finance',
            'head_of_merchandising',
            'head_of_supply_chain',
            'head_of_audit', 'head_of_it',
        ].includes(userRole as string);
    }

    // Managers (Levels 1-8) can ONLY employ roles at a strictly lower hierarchy level (candidateLevel > userLevel)
    if (candidateLevel <= userLevel) {
        return false;
    }

    return true;
};
