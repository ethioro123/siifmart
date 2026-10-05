/**
 * Role-Based Access Control (RBAC) Utilities
 * Migrated to use enterprise-grade permission system
 * Maintains backward compatibility with legacy code
 */

import { UserRole } from '../types';
import { authService } from '../services/auth.service';
import type { Permission } from '../services/permissions.service';
import { canSwitchCountry, getUserCountry } from './userCountry';

// ============================================================================
// RE-EXPORT NEW PERMISSION SYSTEM
// ============================================================================

export { authService, canSwitchCountry, getUserCountry };
export type { Permission };

// ============================================================================
// LEGACY PERMISSION DEFINITIONS (For Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use new Permission type from permissions.service.ts
 * This object is maintained for backward compatibility only
 */
export const PERMISSIONS = {
    // Dashboard
    VIEW_ADMIN_DASHBOARD: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'hr', 'auditor', 'finance_manager', 'it_support', 'store_operations_auditor'],
    ACCESS_ADMIN_MODULE: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'store_operations_auditor'],
    VIEW_WMS_DASHBOARD: ['super_admin', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'procurement_manager', 'inventory_specialist', 'inventory_manager', 'logistics_manager', 'fleet_maintenance_supervisor'],
    VIEW_POS_DASHBOARD: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor', 'cs_manager', 'operations_manager', 'regional_manager', 'finance_manager', 'auditor', 'treasury_officer', 'store_operations_auditor'],

    // POS
    ACCESS_POS: ['super_admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor', 'store_operations_auditor'],
    PROCESS_SALE: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor'],
    VOID_SALE: ['super_admin', 'store_manager', 'store_supervisor'],
    REFUND_SALE: ['super_admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'store_supervisor', 'cs_manager'],
    APPLY_DISCOUNT: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor'],
    VIEW_ALL_TRANSACTIONS: ['super_admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'finance_manager', 'store_supervisor', 'treasury_officer', 'store_operations_auditor'],

    // Inventory
    ACCESS_INVENTORY: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'warehouse_manager', 'dispatcher', 'auditor', 'procurement_manager', 'inventory_specialist', 'store_supervisor', 'pos', 'logistics_manager', 'inventory_manager', 'demand_planner', 'security_manager', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor', 'store_operations_auditor'],
    ADD_PRODUCT: ['super_admin', 'admin', 'warehouse_manager'],
    EDIT_PRODUCT: ['super_admin', 'admin', 'warehouse_manager'],
    DELETE_PRODUCT: ['super_admin'],
    ADJUST_STOCK: ['super_admin', 'regional_manager', 'operations_manager', 'warehouse_manager'],
    TRANSFER_STOCK: ['super_admin', 'regional_manager', 'operations_manager', 'supply_chain_manager', 'logistics_manager', 'inventory_manager', 'replenishment_planner'],
    VIEW_COST_PRICE: ['super_admin', 'regional_manager', 'operations_manager', 'auditor', 'finance_manager', 'procurement_manager', 'vendor_relations_manager'],

    // Sales
    ACCESS_SALES: ['super_admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'finance_manager', 'cs_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'],
    VIEW_SALES_REPORTS: ['super_admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'finance_manager', 'cs_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'],
    EXPORT_SALES_DATA: ['super_admin', 'auditor', 'finance_manager', 'tax_compliance_officer'],
    DELETE_SALE: ['super_admin'],
    EDIT_SALE: ['super_admin'],

    // Customers
    ACCESS_CUSTOMERS: ['super_admin', 'regional_manager', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cs_manager', 'store_supervisor', 'credit_control_officer'],
    ADD_CUSTOMER: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'cs_manager', 'pos'],
    EDIT_CUSTOMER: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'cs_manager'],
    DELETE_CUSTOMER: ['super_admin'],
    VIEW_CUSTOMER_HISTORY: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'cs_manager', 'credit_control_officer'],

    // Employees
    ACCESS_EMPLOYEES: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'hr', 'hr_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor', 'security_manager', 'logistics_manager', 'inventory_manager', 'training_coordinator', 'payroll_specialist', 'talent_recruiter', 'fleet_maintenance_supervisor'],
    ADD_EMPLOYEE: ['super_admin', 'admin', 'hr', 'hr_manager', 'talent_recruiter'],
    EDIT_EMPLOYEE: ['super_admin', 'admin', 'hr', 'hr_manager', 'it_support', 'payroll_specialist', 'talent_recruiter'],
    DELETE_EMPLOYEE: ['super_admin'],
    TERMINATE_EMPLOYEE: ['super_admin', 'hr'],
    MANAGE_SHIFTS: ['super_admin', 'regional_manager', 'operations_manager', 'hr', 'store_manager', 'assistant_manager', 'shift_lead', 'warehouse_manager', 'dispatcher', 'store_supervisor'],
    VIEW_SALARY: ['super_admin', 'CEO', 'ceo', 'hr', 'hr_manager', 'finance_manager', 'payroll_specialist'],
    PROPOSE_SALARY: ['super_admin', 'CEO', 'ceo', 'hr', 'hr_manager'],
    APPROVE_SALARY: ['super_admin', 'CEO', 'ceo', 'finance_manager'],
    RESET_PASSWORD: ['super_admin', 'admin', 'it_support'],
    CREATE_LOGIN_ACCOUNT: ['super_admin', 'admin', 'it_support'],
    APPROVE_EMPLOYEE: ['super_admin', 'admin', 'hr', 'regional_manager', 'operations_manager'],

    // Procurement
    ACCESS_PROCUREMENT: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'procurement_manager', 'finance_manager', 'supply_chain_manager', 'buyer', 'demand_planner', 'credit_control_officer', 'vendor_relations_manager', 'customs_import_specialist', 'replenishment_planner'],
    CREATE_PO: ['super_admin', 'admin', 'procurement_manager', 'buyer', 'supply_chain_manager'],
    APPROVE_PO: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'procurement_manager', 'finance_manager'],
    RECEIVE_PO: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    DELETE_PO: ['super_admin', 'admin', 'procurement_manager'],
    MANAGE_SUPPLIERS: ['super_admin', 'admin', 'procurement_manager', 'vendor_relations_manager'],

    // Finance
    ACCESS_FINANCE: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'auditor', 'finance_manager', 'hr_manager', 'hr', 'accountant', 'payroll_specialist', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    VIEW_REVENUE: ['super_admin', 'regional_manager', 'operations_manager', 'auditor', 'finance_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    VIEW_EXPENSES: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'auditor', 'finance_manager', 'procurement_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    ADD_EXPENSE: ['super_admin', 'finance_manager'],
    VIEW_PAYROLL: ['super_admin', 'hr', 'hr_manager', 'finance_manager', 'payroll_specialist'],
    PROCESS_PAYROLL: ['super_admin', 'hr', 'hr_manager', 'finance_manager', 'payroll_specialist'],
    EXPORT_FINANCIAL_DATA: ['super_admin', 'auditor', 'finance_manager', 'tax_compliance_officer'],

    // Pricing
    ACCESS_PRICING: ['super_admin', 'regional_manager', 'operations_manager', 'finance_manager', 'procurement_manager', 'vendor_relations_manager', 'store_operations_auditor'],
    EDIT_PRICE: ['super_admin', 'regional_manager', 'finance_manager'],
    CREATE_PROMOTION: ['super_admin', 'regional_manager'],
    APPROVE_PRICE_CHANGE: ['super_admin', 'regional_manager', 'finance_manager'],

    // Warehouse
    ACCESS_WAREHOUSE: ['super_admin', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist', 'packer', 'receiver', 'logistics_manager', 'inventory_manager', 'inbound_qc_inspector', 'fleet_maintenance_supervisor', 'replenishment_planner'],
    MANAGE_WAREHOUSE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    ASSIGN_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'logistics_manager', 'fleet_maintenance_supervisor'],
    COMPLETE_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'packer', 'receiver'],
    VIEW_ALL_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    PROCESS_RETURNS: ['super_admin', 'warehouse_manager', 'dispatcher'],
    MANAGE_WASTE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    INVENTORY_COUNT: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    MANAGE_REPLENISHMENT: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'replenishment_planner'],

    // Settings
    ACCESS_SETTINGS: ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'hr', 'it_support', 'security_manager', 'auditor'],
    EDIT_SYSTEM_SETTINGS: ['super_admin', 'admin', 'it_support'],
    EDIT_OPERATIONAL_SETTINGS: ['super_admin', 'admin'],
    EDIT_HR_SETTINGS: ['super_admin', 'admin', 'hr'],
    VIEW_AUDIT_LOGS: ['super_admin', 'admin', 'auditor', 'it_support', 'security_manager'],
    MANAGE_ROLES: ['super_admin', 'admin'],
    MANAGE_SITES: ['super_admin', 'admin'],
} as const;

// Permission mapping to new system
const PERMISSION_MAP: Record<string, Permission> = {
    'VIEW_ADMIN_DASHBOARD': 'dashboard.view',
    'ACCESS_ADMIN_MODULE': 'admin.view',
    'VIEW_WMS_DASHBOARD': 'dashboard.view',
    'VIEW_POS_DASHBOARD': 'dashboard.view',
    'ACCESS_POS': 'pos.view',
    'PROCESS_SALE': 'pos.create_sale',
    'VOID_SALE': 'pos.void_sale',
    'REFUND_SALE': 'pos.refund',
    'APPLY_DISCOUNT': 'pos.create_sale',
    'VIEW_ALL_TRANSACTIONS': 'sales.view',
    'ACCESS_INVENTORY': 'inventory.view',
    'ADD_PRODUCT': 'inventory.create',
    'EDIT_PRODUCT': 'inventory.edit',
    'DELETE_PRODUCT': 'inventory.delete',
    'ADJUST_STOCK': 'inventory.adjust',
    'TRANSFER_STOCK': 'inventory.transfer',
    'VIEW_COST_PRICE': 'finance.view',
    'ACCESS_SALES': 'sales.view',
    'VIEW_SALES_REPORTS': 'sales.view_reports',
    'EXPORT_SALES_DATA': 'sales.view_reports',
    'DELETE_SALE': 'sales.view',
    'EDIT_SALE': 'sales.view',
    'ACCESS_CUSTOMERS': 'customers.view',
    'ADD_CUSTOMER': 'customers.create',
    'EDIT_CUSTOMER': 'customers.edit',
    'DELETE_CUSTOMER': 'customers.delete',
    'VIEW_CUSTOMER_HISTORY': 'customers.view_history',
    'ACCESS_EMPLOYEES': 'employees.view',
    'ADD_EMPLOYEE': 'employees.create',
    'EDIT_EMPLOYEE': 'employees.edit',
    'DELETE_EMPLOYEE': 'employees.delete',
    'TERMINATE_EMPLOYEE': 'employees.delete',
    'MANAGE_SHIFTS': 'employees.manage_attendance',
    'VIEW_SALARY': 'employees.view_salary',
    'PROPOSE_SALARY': 'employees.propose_salary',
    'APPROVE_SALARY': 'employees.approve_salary',
    'RESET_PASSWORD': 'employees.edit',
    'CREATE_LOGIN_ACCOUNT': 'employees.create',
    'APPROVE_EMPLOYEE': 'employees.approve',
    'ACCESS_PROCUREMENT': 'procurement.view',
    'CREATE_PO': 'procurement.create_po',
    'APPROVE_PO': 'procurement.approve_po',
    'RECEIVE_PO': 'procurement.receive',
    'DELETE_PO': 'procurement.delete_po',
    'MANAGE_SUPPLIERS': 'procurement.view',
    'ACCESS_FINANCE': 'finance.view',
    'VIEW_REVENUE': 'finance.view_reports',
    'VIEW_EXPENSES': 'finance.view',
    'ADD_EXPENSE': 'finance.create_expense',
    'VIEW_PAYROLL': 'finance.view_payroll',
    'PROCESS_PAYROLL': 'finance.manage_payroll',
    'EXPORT_FINANCIAL_DATA': 'finance.view_reports',
    'ACCESS_PRICING': 'pricing.view',
    'EDIT_PRICE': 'pricing.edit',
    'CREATE_PROMOTION': 'pricing.create_promo',
    'APPROVE_PRICE_CHANGE': 'pricing.approve_promo',
    'ACCESS_WAREHOUSE': 'warehouse.view',
    'MANAGE_WAREHOUSE': 'warehouse.view',
    'ASSIGN_TASKS': 'warehouse.view',
    'COMPLETE_TASKS': 'warehouse.pick',
    'VIEW_ALL_TASKS': 'warehouse.view',
    'PROCESS_RETURNS': 'warehouse.receive',
    'MANAGE_WASTE': 'warehouse.view',
    'INVENTORY_COUNT': 'inventory.count',
    'MANAGE_REPLENISHMENT': 'warehouse.putaway',
    'ACCESS_SETTINGS': 'settings.view',
    'EDIT_SYSTEM_SETTINGS': 'settings.edit',
    'EDIT_OPERATIONAL_SETTINGS': 'settings.edit',
    'EDIT_HR_SETTINGS': 'settings.edit',
    'VIEW_AUDIT_LOGS': 'settings.view_logs',
    'MANAGE_ROLES': 'settings.manage_roles',
    'MANAGE_SITES': 'settings.manage_sites',
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS (Using New System)
// ============================================================================

/**
 * Check if a user has a specific permission
 * Now uses the new enterprise permission system
 */
export function hasPermission(userRole: UserRole | undefined, permission: keyof typeof PERMISSIONS): boolean {
    if (!userRole) return false;

    // Map old permission to new
    const newPermission = PERMISSION_MAP[permission];
    if (!newPermission) {
        console.warn(`Unknown permission: ${permission}`);
        return false;
    }

    return authService.checkPermission(userRole, newPermission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | undefined, permissions: (keyof typeof PERMISSIONS)[]): boolean {
    return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole | undefined, permissions: (keyof typeof PERMISSIONS)[]): boolean {
    return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if user can access a specific module
 */
export function canAccessModule(userRole: UserRole | undefined, module: string): boolean {
    const modulePermissions: Record<string, keyof typeof PERMISSIONS> = {
        'dashboard': 'VIEW_ADMIN_DASHBOARD',
        'admin': 'ACCESS_ADMIN_MODULE',
        'pos': 'ACCESS_POS',
        'inventory': 'ACCESS_INVENTORY',
        'sales': 'ACCESS_SALES',
        'customers': 'ACCESS_CUSTOMERS',
        'employees': 'ACCESS_EMPLOYEES',
        'procurement': 'ACCESS_PROCUREMENT',
        'finance': 'ACCESS_FINANCE',
        'pricing': 'ACCESS_PRICING',
        'warehouse': 'ACCESS_WAREHOUSE',
        'settings': 'ACCESS_SETTINGS',
        'profile': 'ACCESS_EMPLOYEES', // Map to employees access for now, or we can just allow it
    };

    const permission = modulePermissions[module.toLowerCase()];
    if (module.toLowerCase() === 'profile') return true;
    return permission ? hasPermission(userRole, permission) : false;
}

/**
 * Get user's accessible modules
 */
export function getAccessibleModules(userRole: UserRole | undefined): string[] {
    const modules = [
        'dashboard', 'pos', 'inventory', 'sales', 'customers',
        'employees', 'procurement', 'finance', 'pricing', 'warehouse', 'settings', 'profile'
    ];

    return modules.filter(module => canAccessModule(userRole, module));
}

/**
 * Check if user is admin level (super_admin or admin)
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'super_admin';
}

/**
 * Check if user is CEO
 */
export function isSuperAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'super_admin';
}

/**
 * Role UI Display Helpers (Extracted to ./roleDisplay to preserve file size limits)
 */
import { getRoleDisplayName, getRoleDescription, getRoleColor } from './roleDisplay';
export { getRoleDisplayName, getRoleDescription, getRoleColor };

// ============================================================================
// DATA FILTERING
// ============================================================================

/**
 * Check if user should see all sites or just their own
 */
export function canViewAllSites(userRole: UserRole | undefined): boolean {
    return ['super_admin', 'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager', 'supply_chain_manager', 'hr', 'auditor', 'it_support', 'cs_manager', 'logistics_manager', 'inventory_manager', 'security_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'store_operations_auditor'].includes(userRole || '');
}

/**
 * Check if user should see all employees or filtered
 */
export function canViewAllEmployees(userRole: UserRole | undefined): boolean {
    return ['super_admin', 'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager', 'supply_chain_manager', 'hr', 'it_support', 'logistics_manager', 'inventory_manager', 'security_manager'].includes(userRole || '');
}

/**
 * Check if data should be filtered by site for this user
 */
export function shouldFilterBySite(userRole: UserRole | undefined): boolean {
    return !canViewAllSites(userRole);
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    getAccessibleModules,
    isAdmin,
    isSuperAdmin,
    getRoleDisplayName,
    getRoleDescription,
    getRoleColor,
    canViewAllSites,
    canViewAllEmployees,
    shouldFilterBySite,
    canSwitchCountry,
    getUserCountry,
    PERMISSIONS,
    authService,
};
