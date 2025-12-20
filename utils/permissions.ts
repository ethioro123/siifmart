/**
 * Role-Based Access Control (RBAC) Utilities
 * Migrated to use enterprise-grade permission system
 * Maintains backward compatibility with legacy code
 */

import { UserRole } from '../types';
import { authService } from '../services/auth.service';
import type { Permission } from '../services/permissions.service';

// ============================================================================
// RE-EXPORT NEW PERMISSION SYSTEM
// ============================================================================

export { authService };
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
    VIEW_ADMIN_DASHBOARD: ['super_admin', 'admin', 'hr', 'auditor', 'finance_manager', 'it_support'],
    ACCESS_ADMIN_MODULE: ['super_admin'],
    VIEW_WMS_DASHBOARD: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'procurement_manager', 'inventory_specialist'],
    VIEW_POS_DASHBOARD: ['super_admin', 'manager', 'pos', 'store_supervisor', 'cs_manager'],

    // POS
    ACCESS_POS: ['super_admin', 'manager', 'pos', 'store_supervisor'],
    PROCESS_SALE: ['super_admin', 'manager', 'pos', 'store_supervisor'],
    VOID_SALE: ['super_admin', 'manager', 'store_supervisor'],
    REFUND_SALE: ['super_admin', 'manager', 'store_supervisor', 'cs_manager'],
    APPLY_DISCOUNT: ['super_admin', 'manager', 'store_supervisor'],
    VIEW_ALL_TRANSACTIONS: ['super_admin', 'manager', 'auditor', 'finance_manager', 'store_supervisor'],

    // Inventory
    ACCESS_INVENTORY: ['super_admin', 'manager', 'warehouse_manager', 'dispatcher', 'auditor', 'procurement_manager', 'inventory_specialist', 'store_supervisor', 'pos'],
    ADD_PRODUCT: ['super_admin', 'warehouse_manager'],
    EDIT_PRODUCT: ['super_admin', 'warehouse_manager'],
    DELETE_PRODUCT: ['super_admin'],
    ADJUST_STOCK: ['super_admin', 'warehouse_manager'],
    TRANSFER_STOCK: ['super_admin'],
    VIEW_COST_PRICE: ['super_admin', 'auditor', 'finance_manager', 'procurement_manager'],

    // Sales
    ACCESS_SALES: ['super_admin', 'manager', 'auditor', 'finance_manager', 'cs_manager'],
    VIEW_SALES_REPORTS: ['super_admin', 'manager', 'auditor', 'finance_manager', 'cs_manager'],
    EXPORT_SALES_DATA: ['super_admin', 'auditor', 'finance_manager'],
    DELETE_SALE: ['super_admin'],
    EDIT_SALE: ['super_admin'],

    // Customers
    ACCESS_CUSTOMERS: ['super_admin', 'manager', 'pos', 'cs_manager', 'store_supervisor'],
    ADD_CUSTOMER: ['super_admin', 'manager', 'cs_manager', 'pos'],
    EDIT_CUSTOMER: ['super_admin', 'manager', 'cs_manager'],
    DELETE_CUSTOMER: ['super_admin'],
    VIEW_CUSTOMER_HISTORY: ['super_admin', 'manager', 'auditor', 'cs_manager'],

    // Employees
    ACCESS_EMPLOYEES: ['super_admin', 'admin', 'hr', 'manager', 'store_supervisor'],
    ADD_EMPLOYEE: ['super_admin', 'hr'],
    EDIT_EMPLOYEE: ['super_admin', 'hr', 'it_support'],
    DELETE_EMPLOYEE: ['super_admin'],
    TERMINATE_EMPLOYEE: ['super_admin', 'admin', 'hr'],
    MANAGE_SHIFTS: ['super_admin', 'admin', 'hr', 'manager', 'warehouse_manager', 'dispatcher', 'store_supervisor'],
    VIEW_SALARY: ['super_admin', 'hr', 'finance_manager'],
    RESET_PASSWORD: ['super_admin', 'admin', 'it_support'],
    CREATE_LOGIN_ACCOUNT: ['super_admin', 'admin', 'it_support'],
    APPROVE_EMPLOYEE: ['super_admin', 'hr'],

    // Procurement
    ACCESS_PROCUREMENT: ['super_admin', 'warehouse_manager', 'procurement_manager', 'finance_manager'],
    CREATE_PO: ['super_admin', 'warehouse_manager', 'procurement_manager'],
    APPROVE_PO: ['super_admin', 'procurement_manager', 'finance_manager'],
    RECEIVE_PO: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    DELETE_PO: ['super_admin', 'procurement_manager'],
    MANAGE_SUPPLIERS: ['super_admin', 'procurement_manager'],

    // Finance
    ACCESS_FINANCE: ['super_admin', 'hr', 'auditor', 'finance_manager'],
    VIEW_REVENUE: ['super_admin', 'auditor', 'finance_manager'],
    VIEW_EXPENSES: ['super_admin', 'auditor', 'finance_manager', 'procurement_manager'],
    ADD_EXPENSE: ['super_admin', 'finance_manager'],
    VIEW_PAYROLL: ['super_admin', 'hr', 'finance_manager'],
    PROCESS_PAYROLL: ['super_admin', 'hr', 'finance_manager'],
    EXPORT_FINANCIAL_DATA: ['super_admin', 'auditor', 'finance_manager'],

    // Pricing
    ACCESS_PRICING: ['super_admin', 'manager', 'finance_manager', 'procurement_manager'],
    EDIT_PRICE: ['super_admin', 'finance_manager'],
    CREATE_PROMOTION: ['super_admin', 'manager', 'store_supervisor'],
    APPROVE_PRICE_CHANGE: ['super_admin', 'finance_manager'],

    // Warehouse
    ACCESS_WAREHOUSE: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist'],
    MANAGE_WAREHOUSE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    ASSIGN_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    COMPLETE_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'driver'],
    VIEW_ALL_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    PROCESS_RETURNS: ['super_admin', 'warehouse_manager', 'dispatcher'],
    MANAGE_WASTE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    INVENTORY_COUNT: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    MANAGE_REPLENISHMENT: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],

    // Settings
    ACCESS_SETTINGS: ['super_admin', 'admin', 'hr', 'it_support'],
    EDIT_SYSTEM_SETTINGS: ['super_admin', 'it_support'],
    EDIT_OPERATIONAL_SETTINGS: ['super_admin', 'manager'],
    EDIT_HR_SETTINGS: ['super_admin', 'hr'],
    VIEW_AUDIT_LOGS: ['super_admin', 'admin', 'auditor', 'it_support'],
    MANAGE_ROLES: ['super_admin'],
    MANAGE_SITES: ['super_admin'],
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
    'VIEW_COST_PRICE': 'inventory.view',
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
    return userRole === 'super_admin' || userRole === 'admin';
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'super_admin';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
        super_admin: 'CEO',
        admin: 'Administrator',
        manager: 'Store Manager',
        hr: 'HR Manager',
        warehouse_manager: 'Warehouse Manager',
        dispatcher: 'Warehouse Dispatcher',
        pos: 'Cashier',
        picker: 'Pick/Packer',
        driver: 'Delivery Driver',
        auditor: 'Auditor',
        finance_manager: 'Finance Manager',
        procurement_manager: 'Procurement Manager',
        store_supervisor: 'Store Supervisor',
        inventory_specialist: 'Inventory Specialist',
        cs_manager: 'Customer Service Manager',
        it_support: 'IT Support',
        packer: 'Packer',
    };

    return displayNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
        super_admin: 'Chief Executive Officer - Full system access and executive oversight',
        admin: 'System Administrator - Technical and IT operations',
        manager: 'Store Manager - Retail operations and customer service',
        hr: 'Human Resources Manager - Employee management and payroll',
        warehouse_manager: 'Warehouse Manager - Logistics and inventory operations',
        dispatcher: 'Warehouse Dispatcher - Task assignment and workflow coordination',
        pos: 'Cashier - Point of sale and customer transactions',
        picker: 'Warehouse Picker - Order fulfillment and picking tasks',
        driver: 'Delivery Driver - Logistics and delivery operations',
        auditor: 'Auditor - Read-only financial and operational oversight',
        finance_manager: 'Finance Manager - Financial oversight and expense management',
        procurement_manager: 'Procurement Manager - Supply chain and purchasing',
        store_supervisor: 'Store Supervisor - Floor management and staff supervision',
        inventory_specialist: 'Inventory Specialist - Stock control and accuracy',
        cs_manager: 'Customer Service Manager - Customer relations and support',
        it_support: 'IT Support - Technical support and system maintenance',
        packer: 'Warehouse Packer - Order packing and shipping preparation',
    };

    return descriptions[role] || 'Standard user access';
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        super_admin: 'text-red-400 bg-red-500/10 border-red-500/20',
        admin: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        hr: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        warehouse_manager: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        dispatcher: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        pos: 'text-green-400 bg-green-500/10 border-green-500/20',
        picker: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        driver: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        auditor: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        finance_manager: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        procurement_manager: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        store_supervisor: 'text-blue-300 bg-blue-300/10 border-blue-300/20',
        inventory_specialist: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
        cs_manager: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        it_support: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        packer: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
    };

    return colors[role] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
}

// ============================================================================
// DATA FILTERING
// ============================================================================

/**
 * Check if user should see all sites or just their own
 */
export function canViewAllSites(userRole: UserRole | undefined): boolean {
    return ['super_admin', 'admin', 'auditor', 'hr', 'finance_manager', 'procurement_manager', 'cs_manager', 'it_support'].includes(userRole || '');
}

/**
 * Check if user should see all employees or filtered
 */
export function canViewAllEmployees(userRole: UserRole | undefined): boolean {
    return ['super_admin', 'admin', 'hr', 'manager', 'store_supervisor'].includes(userRole || '');
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
    PERMISSIONS,
    authService,
};
