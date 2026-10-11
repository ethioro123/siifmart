/**
 * Role-based action permissions matrix
 * Extracted from permissions.service.ts to keep file size manageable.
 */

import type { UserRole } from './auth.service';
import type { Permission } from './permissions.service';

const FULL_ACCESS_PERMISSIONS: Permission[] = [
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

export const ACTION_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: FULL_ACCESS_PERMISSIONS,
    CEO: FULL_ACCESS_PERMISSIONS,
    ceo: FULL_ACCESS_PERMISSIONS,

    admin: [
        'dashboard.view', 'admin.view',
        'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.manage_roles', 'settings.view_logs', 'settings.manage_integrations',
        'employees.view', 'employees.create', 'employees.edit',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po',
        'inventory.view', 'inventory.create', 'inventory.edit',
        'finance.view'
    ],

    warehouse_manager: [
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],

    dispatcher: [
        'dashboard.view',
        'inventory.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch',
        'employees.view', 'employees.manage_attendance'
    ],

    finance_manager: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.approve_expense', 'finance.edit_expense', 'finance.void_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.manage_gl', 'finance.manage_budget', 'finance.manage_payroll', 'finance.view_payroll',
        'sales.view', 'sales.view_reports',
        'pricing.view', 'pricing.edit', 'pricing.approve_promo',
        'inventory.view',
        'pos.view',
        'procurement.view', 'procurement.approve_po',
        'employees.view', 'employees.view_salary', 'employees.approve_salary'
    ],

    procurement_manager: [
        'dashboard.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po',
        'pricing.view',
        'inventory.view', 'inventory.transfer',
        'warehouse.view',
        'finance.view'
    ],

    cs_manager: [
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'sales.view', 'sales.view_reports', 'sales.refund'
    ],

    it_support: [
        'dashboard.view',
        'settings.view', 'settings.edit', 'settings.view_logs', 'settings.manage_integrations',
        'employees.view'
    ],

    store_supervisor: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'inventory.view', 'inventory.count',
        'sales.view',
        'customers.view', 'customers.create', 'customers.edit',
        'employees.view', 'employees.manage_attendance'
    ],

    inventory_specialist: [
        'dashboard.view',
        'inventory.view', 'inventory.count', 'inventory.adjust', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.count'
    ],

    pos: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.hold_order',
        'customers.view', 'customers.create',
        'inventory.view'
    ],

    picker: [
        'dashboard.view',
        'warehouse.view', 'warehouse.pick', 'warehouse.receive', 'warehouse.pack', 'warehouse.putaway',
        'inventory.view'
    ],

    hr: [
        'dashboard.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.view_salary', 'employees.propose_salary', 'employees.manage_attendance',
        'finance.view_payroll', 'finance.manage_payroll'
    ],

    auditor: [
        'dashboard.view',
        'sales.view', 'sales.view_reports',
        'inventory.view',
        'pos.view',
        'finance.view', 'finance.view_reports', 'finance.view_payroll',
        'employees.view',
        'settings.view', 'settings.view_logs'
    ],

    driver: [
        'dashboard.view',
        'warehouse.view', 'warehouse.dispatch', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.putaway'
    ],

    packer: [
        'dashboard.view',
        'warehouse.view', 'warehouse.pack', 'warehouse.receive', 'warehouse.pick', 'warehouse.putaway',
        'inventory.view'
    ],

    // ============================================================================
    // Warehouse Operations
    // ============================================================================

    receiver: [
        'dashboard.view',
        'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.putaway',
        'inventory.view',
        'procurement.view', 'procurement.receive'
    ],

    forklift_operator: [
        'dashboard.view',
        'warehouse.view', 'warehouse.putaway',
        'inventory.view'
    ],

    dispatch_manager: [
        'dashboard.view',
        'warehouse.view', 'warehouse.dispatch',
        'inventory.view', 'inventory.transfer',
        'employees.view', 'employees.manage_attendance'
    ],

    returns_clerk: [
        'dashboard.view',
        'warehouse.view',
        'inventory.view', 'inventory.adjust',
        'customers.view', 'customers.view_history',
        'sales.refund'
    ],

    // ============================================================================
    // Store Operations
    // ============================================================================

    cashier: [
        'dashboard.view',
        'pos.view', 'pos.create_sale',
        'customers.view'
    ],

    shift_lead: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'inventory.view', 'inventory.count',
        'customers.view', 'customers.create', 'customers.edit',
        'employees.view', 'employees.manage_attendance'
    ],

    merchandiser: [
        'dashboard.view',
        'inventory.view', 'inventory.count',
        'pricing.view', 'pricing.create_promo'
    ],

    loss_prevention: [
        'dashboard.view',
        'inventory.view', 'inventory.count',
        'sales.view', 'sales.view_reports',
        'settings.view_logs'
    ],

    // ============================================================================
    // Administrative
    // ============================================================================

    accountant: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.manage_gl', 'finance.manage_budget', 'finance.view_payroll',
        'sales.view', 'sales.view_reports',
        'procurement.view'
    ],

    data_analyst: [
        'dashboard.view',
        'sales.view', 'sales.view_reports',
        'inventory.view',
        'finance.view', 'finance.view_reports',
        'customers.view', 'customers.view_history'
    ],

    training_coordinator: [
        'dashboard.view',
        'employees.view', 'employees.edit', 'employees.manage_attendance'
    ],

    // ============================================================================
    // LEVEL 2 - Regional/Directors
    // ============================================================================

    regional_manager: [
        'dashboard.view', 'admin.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po', 'procurement.receive',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.view_payroll',
        'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance',
        'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
        'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.view_logs'
    ],

    operations_manager: [
        'dashboard.view', 'admin.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po', 'procurement.receive',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.view_payroll',
        'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance',
        'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
        'settings.view', 'settings.edit', 'settings.manage_sites', 'settings.view_logs'
    ],

    hr_manager: [
        'dashboard.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.view_salary', 'employees.propose_salary', 'employees.manage_attendance',
        'finance.view_payroll', 'finance.manage_payroll'
    ],

    supply_chain_manager: [
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.receive',
        'finance.view'
    ],

    merchandising_manager: [
        'dashboard.view', 'admin.view',
        'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
        'inventory.view', 'inventory.create', 'inventory.edit',
        'sales.view', 'sales.view_reports',
        'procurement.view',
        'customers.view'
    ],

    // ============================================================================
    // LEVEL 3 - Site Managers
    // ============================================================================

    store_manager: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
        'inventory.view', 'inventory.edit', 'inventory.count',
        'procurement.view',
        'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'employees.view', 'employees.edit', 'employees.manage_attendance'
    ],

    assistant_manager: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'inventory.view', 'inventory.count',
        'sales.view', 'sales.view_reports',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history',
        'employees.view', 'employees.manage_attendance'
    ],

    // ============================================================================
    // LEVEL 4 - Staff
    // ============================================================================

    sales_associate: [
        'dashboard.view',
        'pos.view', 'pos.create_sale',
        'inventory.view',
        'customers.view', 'customers.create'
    ],

    stock_clerk: [
        'dashboard.view',
        'inventory.view', 'inventory.count',
        'warehouse.view'
    ],

    customer_service: [
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history',
        'sales.view', 'sales.refund'
    ],

    buyer: [
        'dashboard.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po'
    ],

    demand_planner: [
        'dashboard.view',
        'inventory.view',
        'procurement.view',
        'sales.view'
    ],

    inventory_manager: [
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.count',
        'employees.view'
    ],

    logistics_manager: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'inventory.view', 'inventory.transfer',
        'employees.view', 'employees.manage_attendance'
    ],

    security_manager: [
        'dashboard.view',
        'settings.view', 'settings.view_logs',
        'inventory.view',
        'employees.view', 'employees.manage_attendance'
    ],

    payroll_specialist: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.view_payroll', 'finance.manage_payroll',
        'employees.view', 'employees.view_salary', 'employees.propose_salary'
    ],

    talent_recruiter: [
        'dashboard.view',
        'employees.view', 'employees.create', 'employees.edit'
    ],

    treasury_officer: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.reconcile_drawer', 'finance.manage_budget',
        'pos.view',
        'sales.view', 'sales.view_reports'
    ],

    tax_compliance_officer: [
        'dashboard.view',
        'finance.view', 'finance.view_reports',
        'sales.view', 'sales.view_reports'
    ],

    credit_control_officer: [
        'dashboard.view',
        'finance.view', 'finance.view_reports',
        'sales.view', 'sales.view_reports',
        'customers.view', 'customers.view_history',
        'procurement.view'
    ],

    vendor_relations_manager: [
        'dashboard.view',
        'procurement.view',
        'pricing.view',
        'inventory.view'
    ],

    customs_import_specialist: [
        'dashboard.view',
        'procurement.view',
        'inventory.view'
    ],

    inbound_qc_inspector: [
        'dashboard.view',
        'procurement.view',
        'warehouse.view',
        'warehouse.view_tasks',
        'warehouse.receive',
        'inventory.view'
    ],

    replenishment_planner: [
        'dashboard.view',
        'inventory.view',
        'inventory.transfer',
        'warehouse.view',
        'warehouse.view_tasks',
        'procurement.view',
        'sales.view'
    ],

    fleet_maintenance_supervisor: [
        'dashboard.view',
        'warehouse.view',
        'warehouse.view_tasks',
        'warehouse.dispatch',
        'inventory.view',
        'employees.view',
        'employees.manage_attendance'
    ],

    store_operations_auditor: [
        'dashboard.view',
        'pos.view',
        'sales.view',
        'sales.view_reports',
        'inventory.view',
        'inventory.count',
        'pricing.view',
        'settings.view_logs'
    ]
};
