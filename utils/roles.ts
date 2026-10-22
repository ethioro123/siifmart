import { UserRole } from '../types';
import { SYSTEM_ROLES } from './systemRolesData';

export { SYSTEM_ROLES } from './systemRolesData';

export function getJobTitleForRole(role?: string | null): string {
   const normalizedRole = (role || '').trim().toLowerCase();
   if (normalizedRole === 'group_ceo') return 'Group Chief Executive Officer';
   if (normalizedRole === 'group_coo' || normalizedRole === 'coo') return 'Group Chief Operating Officer';
   if (normalizedRole === 'group_cfo' || normalizedRole === 'cfo') return 'Group Chief Financial Officer';
   if (normalizedRole === 'group_cco' || normalizedRole === 'cco') return 'Group Chief Commercial Officer';
   if (normalizedRole === 'group_csco' || normalizedRole === 'csco') return 'Group Chief Supply Chain Officer';
   if (normalizedRole === 'group_chro' || normalizedRole === 'chro') return 'Group Chief Human Resources Officer';
   if (normalizedRole === 'group_cto' || normalizedRole === 'cto') return 'Group Chief Technology Officer';
   if (normalizedRole === 'group_cio' || normalizedRole === 'cio') return 'Group Chief Information Officer';
   if (normalizedRole === 'group_clco' || normalizedRole === 'clco') return 'Group Chief Legal & Compliance Officer';
   if (normalizedRole === 'group_cae' || normalizedRole === 'cae') return 'Chief Audit Executive';
   if (normalizedRole === 'group_ceo') return 'Chief Executive Officer';

   const configuredRole = SYSTEM_ROLES.find(item => item.id.toLowerCase() === normalizedRole);
   if (configuredRole) return configuredRole.label;

   return normalizedRole
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
}

export function getEmployeeJobTitle(employee: {
   jobTitle?: string | null;
   job_title?: string | null;
   role?: string | null;
}): string {
   return employee.jobTitle?.trim() || employee.job_title?.trim() || getJobTitleForRole(employee.role);
}

export const getRoleHierarchy = (role: UserRole | string): number => {
    const hierarchy: Partial<Record<UserRole | string, number>> = {
        // Level 1: Executive
        'group_ceo': 100,
        'group_coo': 99,
        'group_cfo': 99,
        'group_cco': 99,
        'group_cmo': 99,
        'group_csco': 99,
        'group_chro': 99,
        'group_cto': 99,
        'group_cio': 99,
        'group_clco': 99,
        'group_cae': 99,
        'country_managing_director': 98,
        'country_operations_director': 97,
        'country_finance_director': 97,
        'country_commercial_director': 97,
        'country_supply_chain_director': 97,
        'country_hr_director': 97,
        'country_technology_director': 97,
        'country_compliance_manager': 97,

        // Level 2: Directors & Regional ("Head of...")
        'regional_operations_manager': 90,
        'area_operations_manager': 88,
        'regional_supply_chain_manager': 83,
        'regional_procurement_manager': 81,
        'regional_finance_manager': 81,
        'regional_merchandising_manager': 81,
        'regional_hr_manager': 81,
        'regional_logistics_manager': 81,
        'regional_security_manager': 81,
        'regional_it_manager': 81,
        'regional_compliance_manager': 81,

        // Level 3: Site Managers & Department Heads
        'store_manager': 80,
        'warehouse_manager': 80,
        'warehouse_operations_manager': 78,
        'transport_fleet_manager': 78,
        'inventory_manager': 80,
        'cs_manager': 60,
        'assistant_store_manager': 60,
        'vendor_relations_manager': 60,
        'fleet_maintenance_supervisor': 58,
        'inventory_control_supervisor': 57,
        'shift_supervisor': 56,
        'stock_control_supervisor': 56,
        'receiving_supervisor': 56,
        'pos_supervisor': 56,
        'putaway_replenishment_supervisor': 56,
        'picking_supervisor': 56,
        'packing_supervisor': 56,
        'dispatch_supervisor': 56,
        'returns_waste_supervisor': 56,
        'inbound_operations_supervisor': 56,
        'outbound_operations_supervisor': 56,
        'receiving_team_leader': 50,
        'picking_team_leader': 50,
        'packing_team_leader': 50,
        'dispatch_team_leader': 50,

        // Support & Specialists
        'store_operations_auditor': 45,
        'auditor': 40,
        'payroll_specialist': 40,
        'treasury_officer': 38,
        'tax_compliance_officer': 38,
        'credit_control_officer': 36,
        'cash_office_officer': 36,
        'accountant': 35,
        'data_analyst': 35,
        'training_coordinator': 35,
        'talent_recruiter': 35,
        'hr_generalist': 35,
        'merchandising_specialist': 35,
        'customs_import_specialist': 35,
        'it_support': 35,
        'dispatcher': 35,

        // Level 4: Staff
        'buyer': 30,
        'demand_planner': 30,
        'replenishment_planner': 30,
        'inbound_qc_inspector': 30,
        'loss_prevention': 30,
        'cashier': 30,
        'store_associate': 28,
        'sales_associate': 28,
        'inventory_controller': 26,
        'stock_counter': 25,
        'merchandiser': 25,
        'inventory_specialist': 25,
        'customer_service': 25,
        'stock_clerk': 25,
        'receiving_operator': 24,
        'putaway_operator': 24,
        'replenishment_operator': 24,
        'dispatch_operator': 24,
        'returns_operator': 24,
        'fleet_mechanic': 24,
        'picker': 22,
        'packer': 22,
        'receiver': 22,
        'returns_clerk': 22,
        'driver': 20,
        'forklift_operator': 20,
        'warehouse_administrator': 24,
    };
    return hierarchy[role] || 0;
};

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
export const MANAGERIAL_ROLES: readonly string[] = ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'hr_generalist', 'store_manager', 'warehouse_manager', 'warehouse_operations_manager', 'transport_fleet_manager', 'inventory_manager', 'dispatch_supervisor', 'assistant_store_manager', 'vendor_relations_manager', 'fleet_maintenance_supervisor', 'shift_supervisor', 'stock_control_supervisor', 'receiving_supervisor', 'pos_supervisor', 'inventory_control_supervisor', 'putaway_replenishment_supervisor', 'picking_supervisor', 'packing_supervisor', 'returns_waste_supervisor', 'cs_manager', 'receiving_team_leader', 'picking_team_leader', 'packing_team_leader', 'dispatch_team_leader'] as const;

export const isManagerialRole = (role?: string): boolean => {
    if (!role) return false;
    return MANAGERIAL_ROLES.includes(role);
};

