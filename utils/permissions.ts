/**
 * Role-Based Access Control (RBAC) Utilities
 * Migrated to use enterprise-grade permission system
 * Maintains backward compatibility with legacy code
 */

import { UserRole } from '../types';
import { authService } from '../services/auth.service';
import type { Permission } from '../services/permissions.service';
import { canSwitchCountry, getUserCountry, canSwitchRegion, getUserRegion } from './userCountry';
import { checkDynamicRolePermission } from '../services/zeroTrustPolicies.service';

// ============================================================================
// RE-EXPORT NEW PERMISSION SYSTEM
// ============================================================================

export { authService, canSwitchCountry, getUserCountry, canSwitchRegion, getUserRegion };
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
    VIEW_ADMIN_DASHBOARD: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'hr_generalist', 'auditor', 'it_support', 'store_operations_auditor', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_merchandising_manager', 'regional_it_manager', 'regional_compliance_manager'],
    ACCESS_ADMIN_MODULE: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'store_operations_auditor'],
    ACCESS_REGIONAL_OPS: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_merchandising_manager', 'regional_it_manager', 'regional_compliance_manager', 'auditor', 'store_operations_auditor', 'hr_generalist', 'talent_recruiter', 'payroll_specialist', 'training_coordinator', 'it_support', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'buyer', 'demand_planner', 'replenishment_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'regional_supply_chain_manager', 'inventory_manager', 'merchandiser', 'data_analyst', 'cs_manager'],
    VIEW_WMS_DASHBOARD: ['group_ceo', 'group_coo', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'dispatcher', 'picker', 'driver', 'country_commercial_director', 'inventory_specialist', 'inventory_manager', 'fleet_maintenance_supervisor'],
    VIEW_POS_DASHBOARD: ['group_ceo', 'group_coo', 'country_managing_director', 'country_operations_director', 'country_compliance_manager', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'cs_manager', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'country_finance_director', 'auditor', 'treasury_officer', 'store_operations_auditor'],

    // POS
    ACCESS_POS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'sales_associate', 'store_operations_auditor', 'treasury_officer', 'regional_finance_manager', 'regional_security_manager', 'country_compliance_manager', 'auditor'],
    PROCESS_SALE: ['group_ceo', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'sales_associate'],
    VOID_SALE: ['group_ceo', 'store_manager', 'shift_supervisor'],
    REFUND_SALE: ['group_ceo', 'regional_operations_manager', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cs_manager'],
    APPLY_DISCOUNT: ['group_ceo', 'store_manager', 'assistant_store_manager', 'shift_supervisor'],
    VIEW_ALL_TRANSACTIONS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'auditor', 'country_compliance_manager', 'country_finance_director', 'treasury_officer', 'store_operations_auditor'],

    // Inventory - Strictly Warehouse, Distribution Center, and Authorized Sourcing/Logistics Oversight
    ACCESS_INVENTORY: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'regional_logistics_manager', 'country_operations_director', 'country_supply_chain_director', 'country_commercial_director', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'dispatcher', 'auditor', 'country_compliance_manager', 'inventory_specialist', 'inventory_manager', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor', 'store_operations_auditor'],
    ADD_PRODUCT: ['group_ceo', 'country_managing_director', 'warehouse_manager'],
    EDIT_PRODUCT: ['group_ceo', 'country_managing_director', 'warehouse_manager'],
    DELETE_PRODUCT: ['group_ceo'],
    ADJUST_STOCK: ['group_ceo', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager'],
    TRANSFER_STOCK: ['group_ceo', 'regional_operations_manager', 'regional_logistics_manager', 'regional_procurement_manager', 'country_operations_director', 'country_supply_chain_director', 'regional_supply_chain_manager', 'dispatch_supervisor', 'inventory_manager', 'replenishment_planner'],
    VIEW_COST_PRICE: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'country_operations_director', 'auditor', 'country_compliance_manager', 'country_finance_director', 'country_commercial_director', 'vendor_relations_manager'],

    // Sales
    ACCESS_SALES: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'auditor', 'country_compliance_manager', 'country_finance_director', 'accountant', 'cs_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'],
    VIEW_SALES_REPORTS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'auditor', 'country_compliance_manager', 'country_finance_director', 'accountant', 'cs_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'],
    EXPORT_SALES_DATA: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'auditor', 'country_compliance_manager', 'country_finance_director', 'tax_compliance_officer'],
    DELETE_SALE: ['group_ceo'],
    EDIT_SALE: ['group_ceo'],

    // Customers
    ACCESS_CUSTOMERS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'sales_associate', 'cs_manager', 'credit_control_officer'],
    ADD_CUSTOMER: ['group_ceo', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cs_manager', 'cashier', 'sales_associate'],
    EDIT_CUSTOMER: ['group_ceo', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cs_manager'],
    DELETE_CUSTOMER: ['group_ceo'],
    VIEW_CUSTOMER_HISTORY: ['group_ceo', 'regional_operations_manager', 'regional_procurement_manager', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'auditor', 'country_compliance_manager', 'cs_manager', 'credit_control_officer'],

    // Employees
    ACCESS_EMPLOYEES: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'country_operations_director', 'hr_generalist', 'country_hr_director', 'warehouse_manager', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'regional_supply_chain_manager', 'dispatch_supervisor', 'inventory_manager', 'training_coordinator', 'payroll_specialist', 'talent_recruiter', 'fleet_maintenance_supervisor'],
    ADD_EMPLOYEE: ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'talent_recruiter', 'country_operations_director', 'regional_operations_manager', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager', 'store_manager', 'warehouse_manager', 'regional_supply_chain_manager', 'inventory_manager', 'dispatch_supervisor'],
    EDIT_EMPLOYEE: ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'it_support', 'country_technology_director', 'payroll_specialist', 'talent_recruiter', 'regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager'],
    DELETE_EMPLOYEE: ['group_ceo'],
    TERMINATE_EMPLOYEE: ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'regional_operations_manager', 'regional_hr_manager', 'country_operations_director'],
    MANAGE_SHIFTS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'country_operations_director', 'hr_generalist', 'country_hr_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'dispatcher'],
    VIEW_SALARY: ['group_cfo', 'group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'country_finance_director', 'payroll_specialist', 'regional_operations_manager', 'regional_hr_manager', 'regional_finance_manager'],
    PROPOSE_SALARY: ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'payroll_specialist', 'regional_operations_manager', 'regional_hr_manager'],
    APPROVE_SALARY: ['group_cfo', 'group_ceo', 'country_managing_director', 'country_finance_director'],
    RESET_PASSWORD: ['group_ceo', 'country_managing_director', 'it_support', 'country_technology_director'],
    CREATE_LOGIN_ACCOUNT: ['group_ceo', 'country_managing_director', 'it_support', 'country_technology_director'],
    APPROVE_EMPLOYEE: ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'regional_operations_manager', 'country_operations_director', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager'],

    // Procurement
    ACCESS_PROCUREMENT: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'regional_logistics_manager', 'country_operations_director', 'country_commercial_director', 'country_supply_chain_director', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'credit_control_officer'],
    CREATE_PO: ['group_ceo', 'country_managing_director', 'country_commercial_director', 'regional_procurement_manager', 'country_supply_chain_director', 'country_operations_director', 'regional_operations_manager', 'buyer', 'demand_planner', 'replenishment_planner'],
    APPROVE_PO: ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'regional_procurement_manager', 'regional_operations_manager'],
    RECEIVE_PO: ['group_ceo', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'receiver', 'regional_logistics_manager', 'regional_procurement_manager'],
    DELETE_PO: ['group_ceo', 'country_managing_director', 'country_commercial_director', 'regional_procurement_manager'],
    MANAGE_SUPPLIERS: ['group_ceo', 'country_managing_director', 'country_commercial_director', 'regional_procurement_manager', 'regional_operations_manager', 'buyer', 'vendor_relations_manager'],

    // Finance
    ACCESS_FINANCE: ['group_cfo', 'group_ceo', 'country_managing_director', 'country_finance_director', 'regional_operations_manager', 'country_operations_director', 'auditor', 'country_compliance_manager', 'accountant', 'payroll_specialist', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'regional_finance_manager'],
    VIEW_REVENUE: ['group_cfo', 'group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'country_operations_director', 'auditor', 'country_compliance_manager', 'country_finance_director', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    VIEW_EXPENSES: ['group_cfo', 'group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'country_operations_director', 'auditor', 'country_compliance_manager', 'country_finance_director', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    ADD_EXPENSE: ['group_cfo', 'group_ceo', 'country_finance_director', 'regional_finance_manager', 'regional_operations_manager', 'accountant'],
    VIEW_PAYROLL: ['group_cfo', 'group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'country_finance_director', 'payroll_specialist', 'regional_finance_manager', 'regional_hr_manager', 'regional_operations_manager'],
    PROCESS_PAYROLL: ['group_cfo', 'group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'country_finance_director', 'payroll_specialist'],
    EXPORT_FINANCIAL_DATA: ['group_cfo', 'group_ceo', 'country_managing_director', 'auditor', 'country_compliance_manager', 'country_finance_director', 'regional_finance_manager', 'regional_operations_manager', 'tax_compliance_officer'],

    // Pricing
    ACCESS_PRICING: ['group_cfo', 'group_ceo', 'country_managing_director', 'country_commercial_director', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser', 'regional_operations_manager', 'regional_procurement_manager', 'country_operations_director', 'country_finance_director', 'vendor_relations_manager', 'store_operations_auditor'],
    EDIT_PRICE: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_finance_director'],
    CREATE_PROMOTION: ['group_ceo', 'country_managing_director', 'country_commercial_director', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser', 'regional_operations_manager'],
    APPROVE_PRICE_CHANGE: ['group_ceo', 'country_managing_director', 'regional_merchandising_manager', 'country_finance_director'],

    // Warehouse
    ACCESS_WAREHOUSE: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'warehouse_manager', 'dispatch_supervisor', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'regional_supply_chain_manager', 'inventory_manager', 'inbound_qc_inspector', 'fleet_maintenance_supervisor', 'replenishment_planner', 'regional_logistics_manager', 'country_supply_chain_director'],
    MANAGE_WAREHOUSE: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_logistics_manager', 'country_operations_director', 'warehouse_manager', 'inventory_specialist'],
    ASSIGN_TASKS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'dispatcher', 'inventory_specialist', 'fleet_maintenance_supervisor'],
    COMPLETE_TASKS: ['group_ceo', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'packer', 'receiver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'inbound_qc_inspector'],
    VIEW_ALL_TASKS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'dispatcher', 'inventory_specialist'],
    PROCESS_RETURNS: ['group_ceo', 'warehouse_manager', 'dispatcher', 'returns_clerk', 'inventory_specialist'],
    MANAGE_WASTE: ['group_ceo', 'warehouse_manager', 'inventory_specialist'],
    INVENTORY_COUNT: ['group_ceo', 'warehouse_manager', 'inventory_specialist', 'stock_clerk'],
    MANAGE_REPLENISHMENT: ['group_ceo', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'replenishment_planner', 'stock_clerk'],

    // Settings
    ACCESS_SETTINGS: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'it_support', 'country_technology_director', 'regional_security_manager', 'auditor', 'country_compliance_manager', 'regional_it_manager', 'regional_compliance_manager'],
    EDIT_SYSTEM_SETTINGS: ['group_ceo', 'country_managing_director', 'it_support', 'country_technology_director'],
    EDIT_OPERATIONAL_SETTINGS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director'],
    EDIT_HR_SETTINGS: ['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director'],
    VIEW_AUDIT_LOGS: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'auditor', 'country_compliance_manager', 'it_support', 'country_technology_director', 'regional_security_manager'],
    MANAGE_ROLES: ['group_ceo', 'country_managing_director'],
    MANAGE_SITES: ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director'],
} as const;

// Permission mapping to new system
const PERMISSION_MAP: Record<string, Permission> = {
    'VIEW_ADMIN_DASHBOARD': 'dashboard.view',
    'ACCESS_ADMIN_MODULE': 'admin.view',
    'ACCESS_REGIONAL_OPS': 'admin.view',
    'VIEW_WMS_DASHBOARD': 'dashboard.view',
    'VIEW_POS_DASHBOARD': 'dashboard.view',
    'ACCESS_POS': 'pos.view',
    'PROCESS_SALE': 'pos.create_sale',
    'VOID_SALE': 'pos.void_sale',
    'REFUND_SALE': 'pos.refund',
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
    'ACCESS_CUSTOMERS': 'customers.view',
    'ADD_CUSTOMER': 'customers.create',
    'EDIT_CUSTOMER': 'customers.edit',
    'DELETE_CUSTOMER': 'customers.delete',
    'VIEW_CUSTOMER_HISTORY': 'customers.view_history',
    'ACCESS_EMPLOYEES': 'employees.view',
    'ADD_EMPLOYEE': 'employees.create',
    'EDIT_EMPLOYEE': 'employees.edit',
    'DELETE_EMPLOYEE': 'employees.delete',
    'TERMINATE_EMPLOYEE': 'employees.edit',
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
    'EDIT_OPERATIONAL_SETTINGS': 'settings.edit',
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

    // The canonical group_ceo role has sovereign module and action access
    if (userRole === 'group_ceo') return true;

    // Keep this high-impact action aligned with the database insert allowlist;
    // editable role settings must not expose a create button the RLS policy rejects.
    if (permission === 'CREATE_PO') {
        return (PERMISSIONS.CREATE_PO as readonly string[]).includes(userRole);
    }

    // Zero-Trust dynamic policy override from RoleSettings
    const dynamicCheck = checkDynamicRolePermission(userRole as string, permission as string);
    if (dynamicCheck !== undefined) {
        return dynamicCheck;
    }

    // Check direct legacy/explicit permission list if specified
    const explicitRoles = PERMISSIONS[permission];
    if (explicitRoles && Array.isArray(explicitRoles) && (explicitRoles as string[]).includes(userRole)) {
        return true;
    }

    // Map old permission to new
    const newPermission = PERMISSION_MAP[permission];
    if (!newPermission) {
        if (!(permission in PERMISSIONS)) {
            console.warn(`Unknown permission: ${permission}`);
        }
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
    if (!userRole) return false;
    const norm = userRole as string;
    // Level 1 Global CEO and Level 2 Country Managing Director have complete module access
    if (norm === 'group_ceo' || norm === 'country_managing_director') return true;

    const modulePermissions: Record<string, keyof typeof PERMISSIONS> = {
        'dashboard': 'VIEW_ADMIN_DASHBOARD',
        'admin': 'ACCESS_ADMIN_MODULE',
        country_managing_director: 'ACCESS_ADMIN_MODULE',
        'regional-ops': 'ACCESS_REGIONAL_OPS',
        'pos': 'ACCESS_POS',
        cashier: 'ACCESS_POS',
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
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'sales', 'customers',
        'employees', 'procurement', 'finance', 'pricing', 'warehouse', 'settings', 'profile'
    ];

    return modules.filter(module => canAccessModule(userRole, module));
}

/**
 * Check if user is admin level (group_ceo, group_coo, group_cfo, group_ceo or admin)
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
    const adminRoles = ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager'];
    return adminRoles.includes((userRole || '').toLowerCase());
}

/**
 * Check if user is CEO
 */
export function isSuperAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'group_ceo';
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
    return ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'hr_generalist', 'it_support', 'auditor', 'store_operations_auditor', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_it_manager', 'regional_compliance_manager', 'cs_manager', 'inventory_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'].includes(userRole || '');
}

/**
 * Check if user should see all employees or filtered
 */
export function canViewAllEmployees(userRole: UserRole | undefined): boolean {
    return ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'hr_generalist', 'it_support', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_it_manager', 'regional_compliance_manager', 'inventory_manager', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'].includes(userRole || '');
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
    canSwitchRegion,
    getUserRegion,
    PERMISSIONS,
    authService,
};
