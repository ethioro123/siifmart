/**
 * Enterprise-Grade Permissions & Access Control Service
 * Implements granular action-level permissions, separation of duties, and approval workflows
 */

import type { UserRole } from './auth.service';

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
    | 'warehouse.view' | 'warehouse.receive' | 'warehouse.pick' | 'warehouse.pack'
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

/**
 * Role-based action permissions matrix
 */
export const ACTION_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [
        // Full access to everything
        'dashboard.view', 'admin.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po', 'procurement.receive',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.edit_expense', 'finance.delete_expense', 'finance.manage_payroll', 'finance.view_payroll',
        'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.view_history', 'customers.manage_loyalty',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.approve', 'employees.view_salary', 'employees.edit_salary', 'employees.manage_attendance',
        'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
        'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.manage_roles', 'settings.view_logs', 'settings.manage_integrations'
    ],

    admin: [
        // System/IT administration
        'dashboard.view',
        'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.manage_roles', 'settings.view_logs', 'settings.manage_integrations',
        'employees.view', 'employees.create', 'employees.edit'
    ],

    manager: [
        // Store operations manager
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'inventory.view', 'inventory.count',
        'sales.view', 'sales.view_reports', 'sales.create',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'pricing.view', 'pricing.edit',
        'employees.view', 'employees.manage_attendance'
    ],

    warehouse_manager: [
        // Warehouse operations manager
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],

    dispatcher: [
        // Warehouse dispatcher
        'dashboard.view',
        'inventory.view',
        'warehouse.view', 'warehouse.dispatch',
        'procurement.view'
    ],

    finance_manager: [
        // Financial controller
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.edit_expense', 'finance.manage_payroll', 'finance.view_payroll',
        'sales.view', 'sales.view_reports',
        'procurement.view', 'procurement.approve_po',
        'employees.view', 'employees.view_salary', 'employees.edit_salary'
    ],

    procurement_manager: [
        // Procurement/purchasing manager
        'dashboard.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.receive',
        'inventory.view', 'inventory.transfer',
        'warehouse.view', 'warehouse.receive',
        'finance.view'
    ],

    cs_manager: [
        // Customer service manager
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'sales.view', 'sales.view_reports', 'sales.refund'
    ],

    it_support: [
        // IT support specialist
        'dashboard.view',
        'settings.view', 'settings.edit', 'settings.view_logs', 'settings.manage_integrations',
        'employees.view'
    ],

    store_supervisor: [
        // Store floor supervisor
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.hold_order',
        'inventory.view', 'inventory.count',
        'sales.view',
        'sales.view',
        'customers.view', 'customers.create', 'customers.edit',
        'employees.view', 'employees.manage_attendance'
    ],

    inventory_specialist: [
        // Inventory control specialist
        'dashboard.view',
        'inventory.view', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.count'
    ],

    pos: [
        // POS cashier
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.hold_order',
        'customers.view', 'customers.create',
        'inventory.view'
    ],

    picker: [
        // Warehouse picker
        'dashboard.view',
        'warehouse.view', 'warehouse.pick',
        'inventory.view'
    ],

    hr: [
        // HR manager
        'dashboard.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.view_salary', 'employees.edit_salary', 'employees.manage_attendance',
        'finance.view_payroll', 'finance.manage_payroll'
    ],

    auditor: [
        // Internal auditor (read-only)
        'dashboard.view',
        'sales.view', 'sales.view_reports',
        'inventory.view',
        'finance.view', 'finance.view_reports', 'finance.view_payroll',
        'employees.view',
        'settings.view_logs'
    ],

    driver: [
        // Delivery driver
        'dashboard.view',
        'warehouse.view', 'warehouse.dispatch'
    ],

    packer: [
        // Warehouse packer
        'dashboard.view',
        'warehouse.view', 'warehouse.pack',
        'inventory.view'
    ]
};

// ============================================================================
// SEPARATION OF DUTIES (SoD)
// ============================================================================

/**
 * Conflicting duties that should not be assigned to the same user
 * Key: Permission that conflicts with values
 */
export const CONFLICTING_DUTIES: Record<Permission, Permission[]> = {
    // Financial Controls - No one should create AND approve
    'finance.create_expense': ['finance.approve_expense'],
    'finance.approve_expense': ['finance.create_expense'],
    'procurement.create_po': ['procurement.approve_po'],
    'procurement.approve_po': ['procurement.create_po'],

    // Inventory Controls - Separation between receiving and counting
    'warehouse.receive': ['warehouse.count', 'inventory.count'],
    'warehouse.count': ['warehouse.receive'],
    'inventory.count': ['warehouse.receive'],

    // Warehouse Controls - Separation between picking and packing
    'warehouse.pick': ['warehouse.pack'],
    'warehouse.pack': ['warehouse.pick'],

    // HR Controls - Separation between hiring and approval
    'employees.create': ['employees.approve'],
    'employees.approve': ['employees.create'],

    // Payroll Controls - Separation between management and approval
    'employees.edit_salary': ['finance.approve_expense'],
    'finance.manage_payroll': ['finance.approve_expense'],

    // Sales Controls - Separation between sales and refunds
    'pos.create_sale': ['pos.void_sale'],
    'pos.void_sale': ['pos.create_sale'],

    // Default: No conflicts for other permissions
    'dashboard.view': [],
    'admin.view': [],
    'pos.view': [],
    'pos.refund': [],
    'pos.hold_order': [],
    'inventory.view': [],
    'inventory.create': [],
    'inventory.edit': [],
    'inventory.delete': [],
    'inventory.adjust': [],
    'inventory.transfer': [],
    'warehouse.view': [],
    'warehouse.dispatch': [],
    'warehouse.putaway': [],
    'procurement.view': [],
    'procurement.edit_po': [],
    'procurement.delete_po': [],
    'procurement.receive': [],
    'finance.view': [],
    'finance.view_reports': [],
    'finance.edit_expense': [],
    'finance.delete_expense': [],
    'finance.view_payroll': [],
    'sales.view': [],
    'sales.view_reports': [],
    'sales.create': [],
    'sales.refund': [],
    'customers.view': [],
    'customers.create': [],
    'customers.edit': [],
    'customers.delete': [],
    'customers.view_history': [],
    'customers.manage_loyalty': [],
    'employees.view': [],
    'employees.edit': [],
    'employees.delete': [],
    'employees.view_salary': [],
    'employees.manage_attendance': [],
    'pricing.view': [],
    'pricing.edit': [],
    'pricing.create_promo': [],
    'pricing.approve_promo': [],
    'settings.view': [],
    'settings.edit': [],
    'settings.manage_sites': [],
    'settings.manage_roles': [],
    'settings.view_logs': [],
    'settings.manage_integrations': []
};

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

export interface ApprovalLevel {
    roles: UserRole[];
    threshold?: number; // Amount threshold for this level
}

export interface ApprovalWorkflow {
    name: string;
    levels: ApprovalLevel[];
}

/**
 * Multi-level approval workflows for sensitive operations
 */
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
            { roles: ['manager'], threshold: 1000 },
            { roles: ['finance_manager'], threshold: 5000 },
            { roles: ['finance_manager', 'super_admin'], threshold: Infinity }
        ]
    },
    employee_hire: {
        name: 'Employee Hiring Approval',
        levels: [
            { roles: ['hr', 'manager', 'super_admin'] }
        ]
    },
    inventory_adjustment: {
        name: 'Inventory Adjustment Approval',
        levels: [
            { roles: ['warehouse_manager'], threshold: 100 }, // 100 units
            { roles: ['warehouse_manager', 'super_admin'], threshold: Infinity }
        ]
    },
    price_change: {
        name: 'Price Change Approval',
        levels: [
            { roles: ['manager'], threshold: 10 }, // 10% change
            { roles: ['manager', 'super_admin'], threshold: Infinity }
        ]
    },
    refund: {
        name: 'Refund Approval',
        levels: [
            { roles: ['manager', 'cs_manager'], threshold: 500 },
            { roles: ['manager', 'cs_manager', 'super_admin'], threshold: Infinity }
        ]
    }
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ACTION_PERMISSIONS[userRole];
    return rolePermissions.includes(permission);
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
    return ACTION_PERMISSIONS[userRole];
}

/**
 * Check for separation of duties violations
 * Returns array of conflicting permissions if violations exist
 */
export function checkSoDViolations(userRole: UserRole): Permission[] {
    const userPermissions = getRolePermissions(userRole);
    const violations: Permission[] = [];

    for (const permission of userPermissions) {
        const conflicts = CONFLICTING_DUTIES[permission] || [];
        const hasConflict = conflicts.some(conflict => userPermissions.includes(conflict));

        if (hasConflict) {
            violations.push(permission);
        }
    }

    return violations;
}

/**
 * Get required approvers for a workflow at a given amount
 */
export function getRequiredApprovers(workflowName: string, amount?: number): UserRole[] {
    const workflow = APPROVAL_WORKFLOWS[workflowName];
    if (!workflow) return [];

    // If no amount specified, return first level
    if (amount === undefined) {
        return workflow.levels[0].roles;
    }

    // Find the appropriate approval level based on amount
    for (const level of workflow.levels) {
        if (amount < (level.threshold || Infinity)) {
            return level.roles;
        }
    }

    // Return last level if amount exceeds all thresholds
    return workflow.levels[workflow.levels.length - 1].roles;
}

/**
 * Check if user can approve at the given workflow level
 */
export function canApprove(userRole: UserRole, workflowName: string, amount?: number): boolean {
    const requiredApprovers = getRequiredApprovers(workflowName, amount);
    return requiredApprovers.includes(userRole);
}

/**
 * Get human-readable permission description
 */
export function getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
        'dashboard.view': 'View dashboard',
        'admin.view': 'View Central Operations',
        'pos.view': 'View POS',
        'pos.create_sale': 'Create sales',
        'pos.refund': 'Process refunds',
        'pos.hold_order': 'Hold orders',
        'pos.void_sale': 'Void sales',
        'inventory.view': 'View inventory',
        'inventory.create': 'Create inventory items',
        'inventory.edit': 'Edit inventory',
        'inventory.delete': 'Delete inventory',
        'inventory.adjust': 'Adjust inventory levels',
        'inventory.count': 'Perform inventory counts',
        'inventory.transfer': 'Transfer inventory',
        'warehouse.view': 'View warehouse',
        'warehouse.receive': 'Receive goods',
        'warehouse.pick': 'Pick orders',
        'warehouse.pack': 'Pack orders',
        'warehouse.dispatch': 'Dispatch shipments',
        'warehouse.putaway': 'Putaway inventory',
        'warehouse.count': 'Perform warehouse counts',
        'procurement.view': 'View procurement',
        'procurement.create_po': 'Create purchase orders',
        'procurement.edit_po': 'Edit purchase orders',
        'procurement.approve_po': 'Approve purchase orders',
        'procurement.delete_po': 'Delete purchase orders',
        'procurement.receive': 'Receive purchases',
        'finance.view': 'View finance',
        'finance.view_reports': 'View financial reports',
        'finance.create_expense': 'Create expenses',
        'finance.approve_expense': 'Approve expenses',
        'finance.edit_expense': 'Edit expenses',
        'finance.delete_expense': 'Delete expenses',
        'finance.manage_payroll': 'Manage payroll',
        'finance.view_payroll': 'View payroll',
        'sales.view': 'View sales',
        'sales.view_reports': 'View sales reports',
        'sales.create': 'Create sales',
        'sales.refund': 'Process refunds',
        'customers.view': 'View customers',
        'customers.create': 'Create customers',
        'customers.edit': 'Edit customers',
        'customers.delete': 'Delete customers',
        'customers.view_history': 'View customer history',
        'customers.manage_loyalty': 'Manage loyalty program',
        'employees.view': 'View employees',
        'employees.create': 'Create employees',
        'employees.edit': 'Edit employees',
        'employees.delete': 'Delete employees',
        'employees.approve': 'Approve employee changes',
        'employees.view_salary': 'View salaries',
        'employees.edit_salary': 'Edit salaries',
        'employees.manage_attendance': 'Manage attendance',
        'pricing.view': 'View pricing',
        'pricing.edit': 'Edit prices',
        'pricing.create_promo': 'Create promotions',
        'pricing.approve_promo': 'Approve promotions',
        'settings.view': 'View settings',
        'settings.edit': 'Edit settings',
        'settings.manage_sites': 'Manage sites',
        'settings.manage_roles': 'Manage roles',
        'settings.view_logs': 'View audit logs',
        'settings.manage_integrations': 'Manage integrations'
    };

    return descriptions[permission] || permission;
}
