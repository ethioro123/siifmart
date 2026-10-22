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
    VIEW_ADMIN_DASHBOARD: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'super_admin', 'admin', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'head_of_operations', 'hr', 'head_of_hr', 'auditor', 'head_of_audit', 'head_of_finance', 'it_support', 'head_of_it', 'store_operations_auditor', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_merchandising_manager', 'regional_it_manager', 'regional_compliance_manager'],
    ACCESS_ADMIN_MODULE: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'super_admin', 'admin', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'regional_operations_manager', 'head_of_operations', 'store_operations_auditor'],
    ACCESS_REGIONAL_OPS: ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'super_admin', 'CEO', 'ceo', 'admin', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager', 'head_of_operations', 'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_merchandising_manager', 'regional_it_manager', 'regional_compliance_manager', 'auditor', 'head_of_audit', 'store_operations_auditor', 'hr', 'hr_generalist', 'talent_recruiter', 'payroll_specialist', 'training_coordinator', 'it_support', 'security_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'buyer', 'demand_planner', 'replenishment_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'logistics_manager', 'inventory_manager', 'merchandiser', 'data_analyst', 'cs_manager'],
    VIEW_WMS_DASHBOARD: ['group_ceo', 'group_coo', 'super_admin', 'admin', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'regional_operations_manager', 'regional_logistics_manager', 'head_of_operations', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'dispatcher', 'picker', 'driver', 'head_of_procurement', 'head_of_supply_chain', 'inventory_specialist', 'inventory_manager', 'fleet_maintenance_supervisor'],
    VIEW_POS_DASHBOARD: ['group_ceo', 'group_coo', 'super_admin', 'admin', 'country_managing_director', 'country_operations_director', 'country_compliance_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor', 'cs_manager', 'head_of_operations', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'head_of_finance', 'auditor', 'head_of_audit', 'treasury_officer', 'store_operations_auditor'],

    // POS
    ACCESS_POS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'head_of_operations', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cashier', 'sales_associate', 'store_supervisor', 'store_operations_auditor', 'treasury_officer', 'regional_finance_manager', 'regional_security_manager', 'head_of_audit', 'auditor'],
    PROCESS_SALE: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cashier', 'sales_associate', 'store_supervisor'],
    VOID_SALE: ['super_admin', 'store_manager', 'store_supervisor'],
    REFUND_SALE: ['super_admin', 'regional_operations_manager', 'head_of_operations', 'store_manager', 'assistant_manager', 'store_supervisor', 'cs_manager'],
    APPLY_DISCOUNT: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor'],
    VIEW_ALL_TRANSACTIONS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'head_of_operations', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'head_of_audit', 'head_of_finance', 'store_supervisor', 'treasury_officer', 'store_operations_auditor'],

    // Inventory - Strictly Warehouse, Distribution Center, and Authorized Sourcing/Logistics Oversight
    ACCESS_INVENTORY: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'regional_logistics_manager', 'regional_security_manager', 'head_of_operations', 'head_of_supply_chain', 'head_of_procurement', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'dispatcher', 'auditor', 'head_of_audit', 'inventory_specialist', 'inventory_manager', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor', 'store_operations_auditor'],
    ADD_PRODUCT: ['super_admin', 'admin', 'country_managing_director', 'warehouse_manager'],
    EDIT_PRODUCT: ['super_admin', 'admin', 'country_managing_director', 'warehouse_manager'],
    DELETE_PRODUCT: ['super_admin'],
    ADJUST_STOCK: ['super_admin', 'regional_operations_manager', 'head_of_operations', 'warehouse_manager'],
    TRANSFER_STOCK: ['super_admin', 'regional_operations_manager', 'regional_logistics_manager', 'regional_procurement_manager', 'head_of_operations', 'head_of_supply_chain', 'logistics_manager', 'dispatch_manager', 'inventory_manager', 'replenishment_planner'],
    VIEW_COST_PRICE: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'head_of_operations', 'auditor', 'head_of_audit', 'head_of_finance', 'head_of_procurement', 'vendor_relations_manager'],

    // Sales
    ACCESS_SALES: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'head_of_operations', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'head_of_audit', 'head_of_finance', 'accountant', 'cs_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'],
    VIEW_SALES_REPORTS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'head_of_operations', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'head_of_audit', 'head_of_finance', 'accountant', 'cs_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'],
    EXPORT_SALES_DATA: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'auditor', 'head_of_audit', 'head_of_finance', 'tax_compliance_officer'],
    DELETE_SALE: ['super_admin'],
    EDIT_SALE: ['super_admin'],

    // Customers
    ACCESS_CUSTOMERS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'head_of_operations', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cashier', 'sales_associate', 'cs_manager', 'store_supervisor', 'credit_control_officer'],
    ADD_CUSTOMER: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'cs_manager', 'pos', 'cashier', 'sales_associate'],
    EDIT_CUSTOMER: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'cs_manager'],
    DELETE_CUSTOMER: ['super_admin'],
    VIEW_CUSTOMER_HISTORY: ['super_admin', 'regional_operations_manager', 'regional_procurement_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'head_of_audit', 'cs_manager', 'credit_control_officer'],

    // Employees
    ACCESS_EMPLOYEES: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'head_of_operations', 'hr', 'head_of_hr', 'warehouse_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor', 'security_manager', 'logistics_manager', 'dispatch_manager', 'inventory_manager', 'training_coordinator', 'payroll_specialist', 'talent_recruiter', 'hr_generalist', 'fleet_maintenance_supervisor'],
    ADD_EMPLOYEE: ['super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'talent_recruiter', 'head_of_operations', 'regional_operations_manager', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager', 'store_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager', 'security_manager', 'dispatch_manager'],
    EDIT_EMPLOYEE: ['super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'it_support', 'head_of_it', 'payroll_specialist', 'talent_recruiter', 'hr_generalist', 'regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager'],
    DELETE_EMPLOYEE: ['super_admin'],
    TERMINATE_EMPLOYEE: ['super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'regional_operations_manager', 'regional_hr_manager', 'head_of_operations',],
    MANAGE_SHIFTS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'head_of_operations', 'hr', 'head_of_hr', 'store_manager', 'assistant_manager', 'shift_lead', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'dispatcher', 'store_supervisor'],
    VIEW_SALARY: ['group_cfo', 'super_admin', 'CEO', 'ceo', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'head_of_finance', 'payroll_specialist', 'regional_operations_manager', 'regional_hr_manager', 'regional_finance_manager'],
    PROPOSE_SALARY: ['super_admin', 'CEO', 'ceo', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'payroll_specialist', 'regional_operations_manager', 'regional_hr_manager'],
    APPROVE_SALARY: ['group_cfo', 'super_admin', 'CEO', 'ceo', 'admin', 'country_managing_director', 'head_of_finance',],
    RESET_PASSWORD: ['super_admin', 'admin', 'country_managing_director', 'it_support', 'head_of_it',],
    CREATE_LOGIN_ACCOUNT: ['super_admin', 'admin', 'country_managing_director', 'it_support', 'head_of_it',],
    APPROVE_EMPLOYEE: ['super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'regional_operations_manager', 'head_of_operations', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager'],

    // Procurement
    ACCESS_PROCUREMENT: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_procurement_manager', 'regional_logistics_manager', 'head_of_operations', 'head_of_procurement', 'head_of_supply_chain', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'credit_control_officer'],
    CREATE_PO: ['super_admin', 'admin', 'country_managing_director', 'head_of_procurement', 'regional_procurement_manager', 'regional_operations_manager', 'buyer', 'head_of_supply_chain',],
    APPROVE_PO: ['group_ceo', 'super_admin', 'admin', 'country_managing_director', 'head_of_procurement', 'regional_procurement_manager', 'regional_operations_manager'],
    RECEIVE_PO: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'receiver', 'regional_logistics_manager', 'regional_procurement_manager'],
    DELETE_PO: ['super_admin', 'admin', 'country_managing_director', 'head_of_procurement', 'regional_procurement_manager'],
    MANAGE_SUPPLIERS: ['super_admin', 'admin', 'country_managing_director', 'head_of_procurement', 'regional_procurement_manager', 'regional_operations_manager', 'buyer', 'vendor_relations_manager'],

    // Finance
    ACCESS_FINANCE: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'head_of_finance', 'regional_operations_manager', 'head_of_operations', 'auditor', 'head_of_audit', 'accountant', 'payroll_specialist', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'regional_finance_manager'],
    VIEW_REVENUE: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'head_of_operations', 'auditor', 'head_of_audit', 'head_of_finance', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    VIEW_EXPENSES: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_finance_manager', 'head_of_operations', 'auditor', 'head_of_audit', 'head_of_finance', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
    ADD_EXPENSE: ['group_cfo', 'super_admin', 'head_of_finance', 'regional_finance_manager', 'regional_operations_manager', 'accountant'],
    VIEW_PAYROLL: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'head_of_finance', 'payroll_specialist', 'regional_finance_manager', 'regional_hr_manager', 'regional_operations_manager'],
    PROCESS_PAYROLL: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr', 'head_of_finance', 'payroll_specialist'],
    EXPORT_FINANCIAL_DATA: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'auditor', 'head_of_audit', 'head_of_finance', 'regional_finance_manager', 'regional_operations_manager', 'tax_compliance_officer'],

    // Pricing
    ACCESS_PRICING: ['group_cfo', 'super_admin', 'admin', 'country_managing_director', 'head_of_merchandising', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser', 'regional_operations_manager', 'regional_procurement_manager', 'head_of_operations', 'head_of_finance', 'head_of_procurement', 'vendor_relations_manager', 'store_operations_auditor'],
    EDIT_PRICE: ['super_admin', 'admin', 'country_managing_director', 'head_of_merchandising', 'regional_operations_manager', 'head_of_finance',],
    CREATE_PROMOTION: ['super_admin', 'admin', 'country_managing_director', 'head_of_merchandising', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser', 'regional_operations_manager'],
    APPROVE_PRICE_CHANGE: ['super_admin', 'admin', 'country_managing_director', 'head_of_merchandising', 'regional_merchandising_manager', 'head_of_finance',],

    // Warehouse
    ACCESS_WAREHOUSE: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'head_of_operations', 'warehouse_manager', 'dispatch_manager', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'logistics_manager', 'inventory_manager', 'inbound_qc_inspector', 'fleet_maintenance_supervisor', 'replenishment_planner', 'regional_logistics_manager', 'head_of_supply_chain',],
    MANAGE_WAREHOUSE: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_logistics_manager', 'head_of_operations', 'warehouse_manager', 'inventory_specialist'],
    ASSIGN_TASKS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'dispatcher', 'inventory_specialist', 'fleet_maintenance_supervisor'],
    COMPLETE_TASKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'packer', 'receiver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'inbound_qc_inspector'],
    VIEW_ALL_TASKS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'dispatcher', 'inventory_specialist'],
    PROCESS_RETURNS: ['super_admin', 'warehouse_manager', 'dispatcher', 'returns_clerk', 'inventory_specialist'],
    MANAGE_WASTE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    INVENTORY_COUNT: ['super_admin', 'warehouse_manager', 'inventory_specialist', 'stock_clerk'],
    MANAGE_REPLENISHMENT: ['super_admin', 'regional_operations_manager', 'regional_logistics_manager', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'replenishment_planner', 'stock_clerk'],

    // Settings
    ACCESS_SETTINGS: [
        'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
        'super_admin', 'admin', 'country_managing_director', 'regional_operations_manager',
        'head_of_operations',
        'head_of_finance',
        'head_of_hr',
        'head_of_procurement',
        'it_support', 'head_of_it', 'security_manager',
        'auditor', 'head_of_audit', 'regional_security_manager',
        'regional_it_manager', 'regional_compliance_manager'
    ],
    EDIT_SYSTEM_SETTINGS: ['super_admin', 'admin', 'country_managing_director', 'it_support', 'head_of_it',],
    EDIT_OPERATIONAL_SETTINGS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'head_of_operations',],
    EDIT_HR_SETTINGS: ['super_admin', 'admin', 'country_managing_director', 'hr', 'head_of_hr',],
    VIEW_AUDIT_LOGS: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'auditor', 'head_of_audit', 'it_support', 'head_of_it', 'security_manager', 'regional_security_manager'],
    MANAGE_ROLES: ['super_admin', 'admin', 'country_managing_director'],
    MANAGE_SITES: ['super_admin', 'admin', 'country_managing_director', 'regional_operations_manager', 'head_of_operations',],
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

    // Level 1 Global CEO (super_admin / ceo / group_ceo) has 100% sovereign module & action access
    if (userRole === 'group_ceo' || userRole === 'super_admin' || (userRole as string)?.toLowerCase() === 'ceo') return true;

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
    const norm = (userRole as string).toLowerCase().trim().replace(/[\s-]/g, '_');
    // Level 1 Global CEO and Level 2 Country Managing Director have complete module access
    if (norm === 'super_admin' || norm === 'ceo' || norm === 'admin' || norm === 'country_managing_director') return true;

    const modulePermissions: Record<string, keyof typeof PERMISSIONS> = {
        'dashboard': 'VIEW_ADMIN_DASHBOARD',
        'admin': 'ACCESS_ADMIN_MODULE',
        'regional-ops': 'ACCESS_REGIONAL_OPS',
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
        'dashboard', 'admin', 'regional-ops', 'pos', 'inventory', 'sales', 'customers',
        'employees', 'procurement', 'finance', 'pricing', 'warehouse', 'settings', 'profile'
    ];

    return modules.filter(module => canAccessModule(userRole, module));
}

/**
 * Check if user is admin level (group_ceo, group_coo, group_cfo, super_admin or admin)
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
    const adminRoles = [
        'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco',
        'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
        'super_admin', 'admin', 'country_managing_director', 'ceo',
        'country_operations_director', 'country_finance_director',
        'country_commercial_director', 'country_supply_chain_director',
        'country_hr_director', 'country_technology_director',
        'country_compliance_manager',
        'regional_operations_manager', 'area_operations_manager',
        'regional_supply_chain_manager'
    ];
    return adminRoles.includes((userRole || '').toLowerCase());
}

/**
 * Check if user is CEO
 */
export function isSuperAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'group_ceo' || userRole === 'super_admin';
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
    return [
        'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco',
        'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
        'super_admin', 'country_managing_director', 'admin',
        'country_operations_director', 'country_finance_director', 'country_commercial_director',
        'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager',
        'head_of_operations',
        'head_of_finance',
        'head_of_hr', 'hr',
        'head_of_procurement',
        'head_of_supply_chain',
        'head_of_merchandising',
        'head_of_it', 'it_support',
        'head_of_audit', 'auditor', 'store_operations_auditor',
        'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager',
        'regional_procurement_manager', 'regional_finance_manager',
        'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager',
        'regional_it_manager', 'regional_compliance_manager',
        'cs_manager', 'logistics_manager', 'inventory_manager', 'security_manager',
        'treasury_officer', 'tax_compliance_officer', 'credit_control_officer',
        'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'
    ].includes(userRole || '');
}

/**
 * Check if user should see all employees or filtered
 */
export function canViewAllEmployees(userRole: UserRole | undefined): boolean {
    return [
        'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco',
        'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
        'super_admin', 'country_managing_director', 'admin',
        'country_operations_director', 'country_finance_director', 'country_commercial_director',
        'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager',
        'head_of_operations',
        'head_of_finance',
        'head_of_hr', 'hr',
        'head_of_procurement',
        'head_of_supply_chain',
        'head_of_it', 'it_support',
        'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager',
        'regional_procurement_manager', 'regional_finance_manager',
        'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager',
        'regional_it_manager', 'regional_compliance_manager',
        'logistics_manager', 'inventory_manager', 'security_manager',
        'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'
    ].includes(userRole || '');
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
