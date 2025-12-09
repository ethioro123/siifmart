import { UserRole } from '../types';

/**
 * AUTOMATIC ROLE SEGREGATION SYSTEM
 * 
 * This utility ensures employees are automatically assigned to the correct site
 * based on their role when they are hired/created.
 */

export interface RoleSegregationRule {
    role: UserRole;
    siteType: 'Administration' | 'Warehouse' | 'Store' | 'Any';
    department?: string;
    description: string;
}

/**
 * Complete role segregation rules
 * Defines which site type each role should be assigned to
 */
export const ROLE_SEGREGATION_RULES: RoleSegregationRule[] = [
    // ========================================
    // HQ ROLES - Must be at SIIFMART HQ
    // ========================================
    {
        role: 'super_admin',
        siteType: 'Administration',
        department: 'Management',
        description: 'CEO - Executive leadership at headquarters'
    },
    {
        role: 'admin',
        siteType: 'Administration',
        department: 'Management',
        description: 'System Administrator - Central IT operations at HQ'
    },
    {
        role: 'hr',
        siteType: 'Administration',
        department: 'Human Resources',
        description: 'HR Manager - Workforce management at HQ'
    },
    {
        role: 'finance_manager',
        siteType: 'Administration',
        department: 'Management',
        description: 'Finance Manager - Financial oversight at HQ'
    },
    {
        role: 'procurement_manager',
        siteType: 'Administration',
        department: 'Management',
        description: 'Procurement Manager - Supply chain management at HQ'
    },
    {
        role: 'cs_manager',
        siteType: 'Administration',
        department: 'Management',
        description: 'Customer Service Manager - CS operations at HQ'
    },
    {
        role: 'auditor',
        siteType: 'Administration',
        department: 'Management',
        description: 'Auditor - Compliance and auditing at HQ'
    },
    {
        role: 'it_support',
        siteType: 'Administration',
        department: 'Management',
        description: 'IT Support - Technical support at HQ'
    },

    // ========================================
    // WAREHOUSE ROLES - Must be at Warehouse/DC
    // ========================================
    {
        role: 'warehouse_manager',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Warehouse Manager - Oversees warehouse operations'
    },
    {
        role: 'dispatcher',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Dispatcher - Coordinates warehouse logistics'
    },
    {
        role: 'picker',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Picker - Order fulfillment at warehouse'
    },
    {
        role: 'driver',
        siteType: 'Warehouse',
        department: 'Transport',
        description: 'Driver - Delivery operations from warehouse'
    },

    // ========================================
    // RETAIL ROLES - Must be at Store
    // ========================================
    {
        role: 'store_supervisor',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Store Supervisor - Floor management at retail store'
    },
    {
        role: 'pos',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Cashier - Point of sale at retail store'
    },
    {
        role: 'inventory_specialist',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Inventory Specialist - Stock control at retail store'
    },

    // ========================================
    // FLEXIBLE ROLES - Can be at any location
    // ========================================
    {
        role: 'manager',
        siteType: 'Any',
        description: 'Department Manager - Can manage any location type'
    }
];

/**
 * Get the required site type for a given role
 */
export function getRequiredSiteType(role: UserRole): 'Administration' | 'Warehouse' | 'Store' | 'Any' {
    const rule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
    return rule?.siteType || 'Any';
}

/**
 * Get the recommended department for a given role
 */
export function getRecommendedDepartment(role: UserRole): string {
    const rule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
    return rule?.department || 'Management';
}

/**
 * Get the description for a role's location requirements
 */
export function getRoleLocationDescription(role: UserRole): string {
    const rule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
    return rule?.description || 'No specific location requirement';
}

/**
 * Check if a role can be assigned to a specific site type
 */
export function canRoleBeAtSiteType(role: UserRole, siteType: string): boolean {
    const requiredType = getRequiredSiteType(role);

    if (requiredType === 'Any') return true;

    // Normalize site types
    const normalizedSiteType = normalizeSiteType(siteType);

    return requiredType === normalizedSiteType;
}

/**
 * Normalize site type names to standard categories
 */
function normalizeSiteType(siteType: string): 'Administration' | 'Warehouse' | 'Store' | 'Any' {
    const lower = siteType.toLowerCase();

    // Check for HQ/Headquarters/Administrative
    if (lower === 'hq' || lower.includes('headquarters') || lower.includes('administrative')) {
        return 'Administration';
    }

    if (lower.includes('warehouse') || lower.includes('logistics') || lower.includes('storage') || lower.includes('distribution center')) {
        return 'Warehouse';
    }

    if (lower.includes('store') || lower.includes('retail') || lower.includes('market') || lower.includes('grocery') || lower.includes('dark store')) {
        return 'Store';
    }

    return 'Any';
}

/**
 * Get validation message if role-site assignment is invalid
 */
export function validateRoleSiteAssignment(role: UserRole, siteType: string): string | null {
    const requiredType = getRequiredSiteType(role);
    const normalizedSiteType = normalizeSiteType(siteType);

    if (requiredType === 'Any') return null;

    if (requiredType !== normalizedSiteType) {
        const roleRule = ROLE_SEGREGATION_RULES.find(r => r.role === role);
        return `⚠️ Role Segregation Error:\n\n${roleRule?.description || role} must be assigned to a ${requiredType} location.\n\nCurrent site type: ${siteType}\nRequired site type: ${requiredType}`;
    }

    return null;
}

/**
 * Get all roles that can be assigned to a specific site type
 */
export function getRolesForSiteType(siteType: string): UserRole[] {
    const normalizedType = normalizeSiteType(siteType);

    return ROLE_SEGREGATION_RULES
        .filter(rule => rule.siteType === normalizedType || rule.siteType === 'Any')
        .map(rule => rule.role);
}

/**
 * Get role segregation summary for display
 */
export function getRoleSegregationSummary(): {
    hqRoles: UserRole[];
    warehouseRoles: UserRole[];
    storeRoles: UserRole[];
    flexibleRoles: UserRole[];
} {
    return {
        hqRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Administration').map(r => r.role),
        warehouseRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Warehouse').map(r => r.role),
        storeRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Store').map(r => r.role),
        flexibleRoles: ROLE_SEGREGATION_RULES.filter(r => r.siteType === 'Any').map(r => r.role)
    };
}

/**
 * Auto-select the correct site for a role
 * Returns the site ID that matches the role's requirements
 */
export function autoSelectSiteForRole(
    role: UserRole,
    sites: Array<{ id: string; name: string; type: string }>
): string | null {
    const requiredType = getRequiredSiteType(role);

    if (requiredType === 'Any') {
        // For flexible roles, return the first available site
        return sites.length > 0 ? sites[0].id : null;
    }

    // Find a site that matches the required type
    const matchingSite = sites.find(site => {
        const normalizedType = normalizeSiteType(site.type);
        return normalizedType === requiredType;
    });

    return matchingSite?.id || null;
}
