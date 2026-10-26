import { UserRole } from '../types';
import { SYSTEM_ROLES, getRoleHierarchy } from './roles';

/**
 * Roles that are strictly supervisory or frontline with zero hiring authority.
 */
const NON_HIRING_ROLES = new Set([
    'shift_supervisor',
    'pos_supervisor',
    'stock_control_supervisor',
    'receiving_supervisor',
    'picking_supervisor',
    'packing_supervisor',
    'returns_waste_supervisor',
    'inbound_operations_supervisor',
    'outbound_operations_supervisor',
    'fleet_maintenance_supervisor',
    'inventory_control_supervisor',
    'receiving_team_leader',
    'picking_team_leader',
    'packing_team_leader',
    'dispatch_team_leader',
    'cashier',
    'store_associate',
    'sales_associate',
    'customer_service',
    'stock_clerk',
    'picker',
    'packer',
    'receiver',
    'driver',
    'forklift_operator',
    'stock_counter',
    'inventory_controller',
    'fleet_mechanic'
]);

/**
 * Store-domain roles that a Store Manager can hire.
 */
const STORE_DOMAIN_ROLES = new Set([
    'assistant_store_manager',
    'shift_supervisor',
    'pos_supervisor',
    'stock_control_supervisor',
    'cashier',
    'sales_associate',
    'store_associate',
    'merchandiser',
    'stock_clerk',
    'customer_service',
    'returns_clerk'
]);

/**
 * Frontline retail roles that an Assistant Store Manager can hire.
 */
const STORE_FRONTLINE_ROLES = new Set([
    'cashier',
    'store_associate',
    'sales_associate',
    'stock_clerk',
    'merchandiser',
    'returns_clerk',
    'customer_service'
]);

/**
 * Warehouse-domain roles that a Warehouse Manager can hire.
 */
const WAREHOUSE_DOMAIN_ROLES = new Set([
    'warehouse_operations_manager',
    'transport_fleet_manager',
    'receiving_supervisor',
    'inventory_control_supervisor',
    'putaway_replenishment_supervisor',
    'picking_supervisor',
    'packing_supervisor',
    'dispatch_supervisor',
    'returns_waste_supervisor',
    'inbound_operations_supervisor',
    'outbound_operations_supervisor',
    'fleet_maintenance_supervisor',
    'picker',
    'packer',
    'receiver',
    'forklift_operator',
    'driver',
    'stock_clerk',
    'inventory_specialist',
    'returns_clerk',
    'warehouse_administrator'
]);

const ROLE_ALIASES: Record<string, string> = {
    super_admin: 'group_ceo',
    ceo: 'group_ceo',
    admin: 'country_managing_director',
    hr: 'country_hr_director',
    head_of_operations: 'country_operations_director',
    head_of_hr: 'country_hr_director',
    head_of_finance: 'country_finance_director',
    head_of_procurement: 'country_commercial_director',
    head_of_supply_chain: 'country_supply_chain_director'
};

/**
 * Determines whether a manager with `userRole` is authorized to hire/onboard `candidateRole`.
 * Codified under SOP-ORG-039 Enterprise Supervisory Hierarchy & Hiring Governance.
 */
export const canEmployRole = (
    userRole: UserRole | string | undefined,
    candidateRole: UserRole | string
): boolean => {
    if (!userRole) return false;
    const rawManager = userRole.toLowerCase().trim();
    const rawCandidate = candidateRole.toLowerCase().trim();
    const manager = ROLE_ALIASES[rawManager] || rawManager;
    const candidate = ROLE_ALIASES[rawCandidate] || rawCandidate;

    // Cannot hire self, and candidate must be recognized in the system
    if (manager === candidate) return false;
    const candidateObj = SYSTEM_ROLES.find(r => r.id === candidate);
    // Allow legacy / alias role names if present in getRoleHierarchy
    const candidateRank = getRoleHierarchy(candidate);
    const managerRank = getRoleHierarchy(manager);
    if (!candidateObj && candidateRank === 10) return false;

    // Strict rank requirement: Manager must strictly outrank candidate
    if (managerRank <= candidateRank) return false;

    // Non-hiring roles (supervisors & frontline staff) have zero hiring authority
    if (NON_HIRING_ROLES.has(manager) || managerRank <= 30) {
        return false;
    }

    // 1. Group CEO: top enterprise appointing authority
    if (manager === 'group_ceo') {
        return candidate !== 'group_ceo';
    }

    // 2. Group C-Suite & Country Managing Director
    if (manager === 'group_coo') {
        return !['group_ceo', 'group_coo'].includes(candidate);
    }
    if (manager === 'country_managing_director') {
        return !['group_ceo', 'group_coo', 'country_managing_director'].includes(candidate);
    }
    if (manager === 'group_cfo') {
        return !['group_ceo', 'group_coo', 'group_cfo'].includes(candidate);
    }
    if (manager === 'group_cco') {
        return !['group_ceo', 'group_coo', 'group_cco'].includes(candidate);
    }
    if (manager === 'group_csco') {
        return !['group_ceo', 'group_coo', 'group_csco'].includes(candidate);
    }
    if (manager === 'group_chro') {
        return !['group_ceo', 'group_coo', 'group_chro'].includes(candidate);
    }

    // 3. Country Functional Directors (Operations, Supply Chain, Finance, HR)
    if (manager === 'country_operations_director') {
        return !['group_ceo', 'group_coo', 'country_managing_director', 'country_operations_director'].includes(candidate);
    }
    if (manager === 'country_supply_chain_director') {
        return !['group_ceo', 'group_coo', 'country_managing_director', 'country_supply_chain_director'].includes(candidate);
    }
    if (manager === 'country_finance_director') {
        return !['group_ceo', 'group_coo', 'country_managing_director', 'country_finance_director'].includes(candidate);
    }
    if (manager === 'country_hr_director' || manager === 'hr_generalist') {
        // HR Directors & Generalists cannot hire C-suite or country managing directors
        return candidateRank < 88;
    }

    // 4. Regional and Area Operations Managers
    if (manager === 'regional_operations_manager') {
        return candidateRank < 90;
    }
    if (manager === 'area_operations_manager') {
        return candidateRank < 88;
    }
    if (manager === 'regional_supply_chain_manager') {
        return candidateRank < 83;
    }
    if (manager === 'regional_security_manager') {
        return candidate === 'loss_prevention';
    }
    if (manager === 'regional_logistics_manager') {
        return ['driver', 'dispatcher', 'fleet_mechanic', 'transport_fleet_manager'].includes(candidate);
    }
    if (manager === 'inventory_manager') {
        return ['inventory_specialist', 'stock_counter', 'inventory_controller', 'stock_clerk'].includes(candidate);
    }
    if (manager === 'dispatch_supervisor') {
        return ['driver', 'dispatcher', 'dispatch_team_leader', 'dispatch_operator'].includes(candidate);
    }

    // 5. Facility Captains: Store Manager & Warehouse Manager
    if (manager === 'store_manager') {
        return STORE_DOMAIN_ROLES.has(candidate);
    }
    if (manager === 'assistant_store_manager') {
        return STORE_FRONTLINE_ROLES.has(candidate);
    }
    if (manager === 'warehouse_manager') {
        return WAREHOUSE_DOMAIN_ROLES.has(candidate);
    }

    return candidateRank < managerRank;
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
