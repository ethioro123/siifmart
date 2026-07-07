/**
 * Enterprise-Grade Permissions & Access Control Service
 * Implements granular action-level permissions, separation of duties, and approval workflows
 */

import type { UserRole } from './auth.service';
import { ACTION_PERMISSIONS } from './permissions.matrix';

// ============================================================================
// ACTION-LEVEL PERMISSIONS
// ============================================================================

export type Permission =
    // Dashboard
    | 'dashboard.view' | 'admin.view'
    // POS
    | 'pos.view' | 'pos.create_sale' | 'pos.refund' | 'pos.hold_order' | 'pos.void_sale'
    // Inventory
    | 'inventory.view' | 'inventory.create' | 'inventory.edit' | 'inventory.delete'
    | 'inventory.adjust' | 'inventory.count' | 'inventory.transfer'
    // Warehouse
    | 'warehouse.view' | 'warehouse.view_tasks' | 'warehouse.receive' | 'warehouse.pick' | 'warehouse.pack'
    | 'warehouse.dispatch' | 'warehouse.putaway' | 'warehouse.count'
    // Procurement
    | 'procurement.view' | 'procurement.create_po' | 'procurement.edit_po'
    | 'procurement.approve_po' | 'procurement.delete_po' | 'procurement.receive'
    // Finance
    | 'finance.view' | 'finance.view_reports' | 'finance.create_expense'
    | 'finance.approve_expense' | 'finance.edit_expense' | 'finance.delete_expense'
    | 'finance.manage_payroll' | 'finance.view_payroll'
    // Sales
    | 'sales.view' | 'sales.view_reports' | 'sales.create' | 'sales.refund'
    // Customers
    | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete'
    | 'customers.view_history' | 'customers.manage_loyalty'
    // Employees
    | 'employees.view' | 'employees.create' | 'employees.edit' | 'employees.delete'
    | 'employees.approve' | 'employees.view_salary' | 'employees.edit_salary'
    | 'employees.manage_attendance'
    // Pricing
    | 'pricing.view' | 'pricing.edit' | 'pricing.create_promo' | 'pricing.approve_promo'
    // Settings
    | 'settings.view' | 'settings.edit' | 'settings.manage_sites' | 'settings.manage_roles'
    | 'settings.view_logs' | 'settings.manage_integrations';

// Re-export the matrix so existing consumers don't break
export { ACTION_PERMISSIONS };

// ============================================================================
// SEPARATION OF DUTIES (SoD)
// ============================================================================

/**
 * Conflicting duties that should not be assigned to the same user
 */
export const CONFLICTING_DUTIES: Record<Permission, Permission[]> = {
    // Financial Controls
    'finance.create_expense': ['finance.approve_expense'],
    'finance.approve_expense': ['finance.create_expense'],
    'procurement.create_po': ['procurement.approve_po'],
    'procurement.approve_po': ['procurement.create_po'],
    // Inventory Controls
    'warehouse.receive': ['warehouse.count', 'inventory.count'],
    'warehouse.count': ['warehouse.receive'],
    'inventory.count': ['warehouse.receive'],
    // Warehouse Controls
    'warehouse.pick': ['warehouse.pack'],
    'warehouse.pack': ['warehouse.pick'],
    // HR Controls
    'employees.create': ['employees.approve'],
    'employees.approve': ['employees.create'],
    // Payroll Controls
    'employees.edit_salary': ['finance.approve_expense'],
    'finance.manage_payroll': ['finance.approve_expense'],
    // Sales Controls
    'pos.create_sale': ['pos.void_sale'],
    'pos.void_sale': ['pos.create_sale'],
    // Default: No conflicts
    'dashboard.view': [], 'admin.view': [],
    'pos.view': [], 'pos.refund': [], 'pos.hold_order': [],
    'inventory.view': [], 'inventory.create': [], 'inventory.edit': [],
    'inventory.delete': [], 'inventory.adjust': [], 'inventory.transfer': [],
    'warehouse.view': [], 'warehouse.view_tasks': [],
    'warehouse.dispatch': [], 'warehouse.putaway': [],
    'procurement.view': [], 'procurement.edit_po': [],
    'procurement.delete_po': [], 'procurement.receive': [],
    'finance.view': [], 'finance.view_reports': [],
    'finance.edit_expense': [], 'finance.delete_expense': [], 'finance.view_payroll': [],
    'sales.view': [], 'sales.view_reports': [], 'sales.create': [], 'sales.refund': [],
    'customers.view': [], 'customers.create': [], 'customers.edit': [],
    'customers.delete': [], 'customers.view_history': [], 'customers.manage_loyalty': [],
    'employees.view': [], 'employees.edit': [], 'employees.delete': [],
    'employees.view_salary': [], 'employees.manage_attendance': [],
    'pricing.view': [], 'pricing.edit': [],
    'pricing.create_promo': [], 'pricing.approve_promo': [],
    'settings.view': [], 'settings.edit': [], 'settings.manage_sites': [],
    'settings.manage_roles': [], 'settings.view_logs': [], 'settings.manage_integrations': []
};

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

export interface ApprovalLevel {
    roles: UserRole[];
    threshold?: number;
}

export interface ApprovalWorkflow {
    name: string;
    levels: ApprovalLevel[];
}

export const APPROVAL_WORKFLOWS: Record<string, ApprovalWorkflow> = {
    purchase_order: {
        name: 'Purchase Order Approval',
        levels: [
            { roles: ['procurement_manager'], threshold: 10000 },
            { roles: ['procurement_manager', 'finance_manager'], threshold: 50000 },
            { roles: ['procurement_manager', 'finance_manager', 'super_admin'], threshold: Infinity }
        ]
    },
    expense: {
        name: 'Expense Approval',
        levels: [
            { roles: ['store_manager', 'warehouse_manager', 'regional_manager', 'operations_manager'], threshold: 1000 },
            { roles: ['finance_manager'], threshold: 5000 },
            { roles: ['finance_manager', 'super_admin'], threshold: Infinity }
        ]
    },
    employee_hire: {
        name: 'Employee Hiring Approval',
        levels: [{ roles: ['hr', 'hr_manager', 'super_admin'] }]
    },
    inventory_adjustment: {
        name: 'Inventory Adjustment Approval',
        levels: [
            { roles: ['warehouse_manager'], threshold: 100 },
            { roles: ['warehouse_manager', 'super_admin'], threshold: Infinity }
        ]
    },
    price_change: {
        name: 'Price Change Approval',
        levels: [
            { roles: ['store_manager', 'regional_manager'], threshold: 10 },
            { roles: ['regional_manager', 'super_admin'], threshold: Infinity }
        ]
    },
    refund: {
        name: 'Refund Approval',
        levels: [
            { roles: ['store_manager', 'cs_manager'], threshold: 500 },
            { roles: ['store_manager', 'cs_manager', 'super_admin'], threshold: Infinity }
        ]
    }
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ACTION_PERMISSIONS[userRole];
    if (!rolePermissions) {
        console.warn(`User role "${userRole}" not found in permissions matrix.`);
        return false;
    }
    return rolePermissions.includes(permission);
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(userRole, permission));
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(userRole, permission));
}

export function getRolePermissions(userRole: UserRole): Permission[] {
    return ACTION_PERMISSIONS[userRole];
}

export function checkSoDViolations(userRole: UserRole): Permission[] {
    const userPermissions = getRolePermissions(userRole);
    const violations: Permission[] = [];
    for (const permission of userPermissions) {
        const conflicts = CONFLICTING_DUTIES[permission] || [];
        const hasConflict = conflicts.some(conflict => userPermissions.includes(conflict));
        if (hasConflict) violations.push(permission);
    }
    return violations;
}

export function getRequiredApprovers(workflowName: string, amount?: number): UserRole[] {
    const workflow = APPROVAL_WORKFLOWS[workflowName];
    if (!workflow) return [];
    if (amount === undefined) return workflow.levels[0].roles;
    for (const level of workflow.levels) {
        if (amount < (level.threshold || Infinity)) return level.roles;
    }
    return workflow.levels[workflow.levels.length - 1].roles;
}

export function canApprove(userRole: UserRole, workflowName: string, amount?: number): boolean {
    const requiredApprovers = getRequiredApprovers(workflowName, amount);
    return requiredApprovers.includes(userRole);
}

export function getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
        'dashboard.view': 'View dashboard', 'admin.view': 'View Central Operations',
        'pos.view': 'View POS', 'pos.create_sale': 'Create sales',
        'pos.refund': 'Process refunds', 'pos.hold_order': 'Hold orders', 'pos.void_sale': 'Void sales',
        'inventory.view': 'View inventory', 'inventory.create': 'Create inventory items',
        'inventory.edit': 'Edit inventory', 'inventory.delete': 'Delete inventory',
        'inventory.adjust': 'Adjust inventory levels', 'inventory.count': 'Perform inventory counts',
        'inventory.transfer': 'Transfer inventory',
        'warehouse.view': 'View warehouse', 'warehouse.view_tasks': 'View task details (read-only)',
        'warehouse.receive': 'Receive goods', 'warehouse.pick': 'Pick orders',
        'warehouse.pack': 'Pack orders', 'warehouse.dispatch': 'Dispatch shipments',
        'warehouse.putaway': 'Putaway inventory', 'warehouse.count': 'Perform warehouse counts',
        'procurement.view': 'View procurement', 'procurement.create_po': 'Create purchase orders',
        'procurement.edit_po': 'Edit purchase orders', 'procurement.approve_po': 'Approve purchase orders',
        'procurement.delete_po': 'Delete purchase orders', 'procurement.receive': 'Receive purchases',
        'finance.view': 'View finance', 'finance.view_reports': 'View financial reports',
        'finance.create_expense': 'Create expenses', 'finance.approve_expense': 'Approve expenses',
        'finance.edit_expense': 'Edit expenses', 'finance.delete_expense': 'Delete expenses',
        'finance.manage_payroll': 'Manage payroll', 'finance.view_payroll': 'View payroll',
        'sales.view': 'View sales', 'sales.view_reports': 'View sales reports',
        'sales.create': 'Create sales', 'sales.refund': 'Process refunds',
        'customers.view': 'View customers', 'customers.create': 'Create customers',
        'customers.edit': 'Edit customers', 'customers.delete': 'Delete customers',
        'customers.view_history': 'View customer history', 'customers.manage_loyalty': 'Manage loyalty program',
        'employees.view': 'View employees', 'employees.create': 'Create employees',
        'employees.edit': 'Edit employees', 'employees.delete': 'Delete employees',
        'employees.approve': 'Approve employee changes', 'employees.view_salary': 'View salaries',
        'employees.edit_salary': 'Edit salaries', 'employees.manage_attendance': 'Manage attendance',
        'pricing.view': 'View pricing', 'pricing.edit': 'Edit prices',
        'pricing.create_promo': 'Create promotions', 'pricing.approve_promo': 'Approve promotions',
        'settings.view': 'View settings', 'settings.edit': 'Edit settings',
        'settings.manage_sites': 'Manage sites', 'settings.manage_roles': 'Manage roles',
        'settings.view_logs': 'View audit logs', 'settings.manage_integrations': 'Manage integrations'
    };
    return descriptions[permission] || permission;
}
