import { getRoleHierarchy, MANAGERIAL_ROLES } from '../supabase/functions/_shared/roleAuthority';
export { getRoleHierarchy, MANAGERIAL_ROLES } from '../supabase/functions/_shared/roleAuthority';
import { UserRole } from '../types';
import { SYSTEM_ROLES } from './systemRolesData';

export { SYSTEM_ROLES } from './systemRolesData';

export function getJobTitleForRole(role?: string | null): string {
   const normalizedRole = (role || '').trim().toLowerCase();
   if (!normalizedRole) return 'Unassigned role';

   const configuredRole = SYSTEM_ROLES.find(item => item.id.toLowerCase() === normalizedRole);
   return configuredRole?.label || 'Unrecognized role';
}

export function getEmployeeJobTitle(employee: {
   jobTitle?: string | null;
   job_title?: string | null;
   role?: string | null;
}): string {
   return employee.jobTitle?.trim() || employee.job_title?.trim() || getJobTitleForRole(employee.role);
}


export const canViewLocation = (
    userRole: string | undefined,
    targetRole: string,
    isOwn: boolean
): boolean => {
    if (isOwn) return true;
    if (!userRole) return false;

    const isGlobalExecutive = (r?: string) => ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae'].includes(r || '');

    // Global C-Suite executives can see everyone across operational facilities
    if (isGlobalExecutive(userRole)) return true;

    // Country Managing Director and HR/Operations leadership can see anyone in their country except Global C-Suite
    if (['country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'hr_generalist'].includes(userRole)) {
        return !isGlobalExecutive(targetRole);
    }

    // Otherwise, follow hierarchy: user role hierarchy level must be greater than target
    const userLevel = getRoleHierarchy(userRole);
    const targetLevel = getRoleHierarchy(targetRole);

    return userLevel > targetLevel;
};

export const canViewCostPrice = (role: string | undefined): boolean => {
    if (!role) return false;

    // Explicitly allow executive, regional/operations directors, finance, procurement, and merchandising leadership
    if (['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_compliance_manager', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'vendor_relations_manager'].includes(role)) {
        return true;
    }

    // Explicitly disallow store managers and inventory managers
    if (role === 'store_manager' || role === 'inventory_manager' || role === 'warehouse_manager') {
        return false;
    }

    // Disallow anyone with level <= 72 (e.g., cashier, shift_supervisor, etc.)
    const level = getRoleHierarchy(role);
    if (level <= 72) {
        return false;
    }

    return true;
};

// Re-export canEmployRole from dedicated hiring engine
export { canEmployRole } from './roleHiring';

// Canonical list of Levels 1 through 8 managerial & leadership roles for selective egress loading


export const isManagerialRole = (role?: string): boolean => {
    if (!role) return false;
    return MANAGERIAL_ROLES.includes(role);
};

