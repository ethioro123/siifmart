/**
 * Base Permission Sets for HQ & Directorate Roles
 * Split from permissions.matrix.ts to adhere to Rule 2 (500-line limit).
 */

import type { Permission } from './permissions.service';

export const FULL_ACCESS_PERMISSIONS: Permission[] = [
    // Full access to everything
    'dashboard.view', 'admin.view',
    'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
    'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
    'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po', 'procurement.receive',
    'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.edit_expense', 'finance.delete_expense', 'finance.void_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.manage_gl', 'finance.manage_budget', 'finance.manage_payroll', 'finance.view_payroll',
    'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.view_history', 'customers.manage_loyalty',
    'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.approve', 'employees.view_salary', 'employees.edit_salary', 'employees.propose_salary', 'employees.approve_salary', 'employees.manage_attendance',
    'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
    'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.manage_roles', 'settings.view_logs', 'settings.manage_integrations'
];

export const ADMIN_ACCESS_PERMISSIONS: Permission[] = FULL_ACCESS_PERMISSIONS.filter(
    permission => permission !== 'procurement.receive' && permission !== 'procurement.approve_po'
);

export const HEAD_OF_FINANCE_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'finance.view', 'finance.view_reports', 'finance.approve_expense', 'finance.edit_expense', 'finance.void_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.manage_gl', 'finance.manage_budget', 'finance.manage_payroll', 'finance.view_payroll',
    'sales.view', 'sales.view_reports',
    'pricing.view', 'pricing.edit', 'pricing.approve_promo',
    'employees.view', 'employees.view_salary', 'employees.approve_salary',
    'settings.view'
];

export const HEAD_OF_PROCUREMENT_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po',
    'inventory.view', 'pricing.view', 'settings.view'
];

export const HEAD_OF_OPERATIONS_PERMISSIONS: Permission[] = [
    'dashboard.view', 'admin.view',
    'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
    'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
    'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.delete_po', 'procurement.receive',
    'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.view_payroll',
    'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
    'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
    'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance',
    'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
    'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.view_logs'
];

export const HEAD_OF_HR_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.view_salary', 'employees.propose_salary', 'employees.manage_attendance',
    'finance.view_payroll', 'finance.manage_payroll',
    'settings.view'
];

export const HR_STAFF_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.view_salary', 'employees.propose_salary', 'employees.manage_attendance',
    'finance.view_payroll', 'finance.manage_payroll'
];

export const HEAD_OF_SUPPLY_CHAIN_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
    'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
    'procurement.view', 'procurement.edit_po', 'procurement.receive',
    'sales.view', 'sales.view_reports'
];

export const HEAD_OF_MERCHANDISING_PERMISSIONS: Permission[] = [
    'dashboard.view', 'admin.view',
    'inventory.view',
    'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
    'sales.view', 'sales.view_reports',
    'customers.view'
];

export const HEAD_OF_IT_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'settings.view', 'settings.edit', 'settings.view_logs', 'settings.manage_integrations',
    'employees.view'
];
