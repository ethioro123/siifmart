/**
 * Role-based action permissions matrix
 * Extracted from permissions.service.ts to keep file size manageable.
 */

import type { UserRole } from './auth.service';
import type { Permission } from './permissions.service';
import { HEAD_OF_AUDIT_PERMISSIONS } from './permissions.matrix-audit';

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

const HEAD_OF_FINANCE_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'finance.view', 'finance.view_reports', 'finance.approve_expense', 'finance.edit_expense', 'finance.void_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.manage_gl', 'finance.manage_budget', 'finance.manage_payroll', 'finance.view_payroll',
    'sales.view', 'sales.view_reports',
    'pricing.view', 'pricing.edit', 'pricing.approve_promo',
    'employees.view', 'employees.view_salary', 'employees.approve_salary'
];

const HEAD_OF_PROCUREMENT_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po'
];

const HEAD_OF_OPERATIONS_PERMISSIONS: Permission[] = [
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
];

const HEAD_OF_HR_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.view_salary', 'employees.propose_salary', 'employees.manage_attendance',
    'finance.view_payroll', 'finance.manage_payroll'
];

const HEAD_OF_SUPPLY_CHAIN_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
    'warehouse.view', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
    'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.receive',
    'sales.view', 'sales.view_reports'
];

const HEAD_OF_MERCHANDISING_PERMISSIONS: Permission[] = [
    'dashboard.view', 'admin.view',
    'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
    'sales.view', 'sales.view_reports',
    'customers.view'
];

const HEAD_OF_IT_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'settings.view', 'settings.edit', 'settings.view_logs', 'settings.manage_integrations',
    'employees.view'
];

export const ACTION_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: FULL_ACCESS_PERMISSIONS,
    CEO: FULL_ACCESS_PERMISSIONS,
    ceo: FULL_ACCESS_PERMISSIONS,

    // Country Managing Director — Full executive access within their authorized country
    country_managing_director: FULL_ACCESS_PERMISSIONS,
    admin: FULL_ACCESS_PERMISSIONS,

    head_of_finance: HEAD_OF_FINANCE_PERMISSIONS,
    finance_head: HEAD_OF_FINANCE_PERMISSIONS,
    finance_manager: HEAD_OF_FINANCE_PERMISSIONS,

    head_of_procurement: HEAD_OF_PROCUREMENT_PERMISSIONS,
    procurement_head: HEAD_OF_PROCUREMENT_PERMISSIONS,
    procurement_manager: HEAD_OF_PROCUREMENT_PERMISSIONS,

    head_of_it: HEAD_OF_IT_PERMISSIONS,
    it_head: HEAD_OF_IT_PERMISSIONS,
    it_support: HEAD_OF_IT_PERMISSIONS,

    head_of_audit: HEAD_OF_AUDIT_PERMISSIONS,
    audit_head: HEAD_OF_AUDIT_PERMISSIONS,
    auditor: HEAD_OF_AUDIT_PERMISSIONS,

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



    cs_manager: [
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'sales.view', 'sales.view_reports', 'sales.refund'
    ],



    store_supervisor: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
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
        'customers.view', 'customers.create'
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
        'procurement.receive'
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
        'inventory.view',
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
        'sales.view', 'sales.view_reports',
        'settings.view_logs'
    ],

    // ============================================================================
    // Administrative
    // ============================================================================

    accountant: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.view_payroll',
        'sales.view', 'sales.view_reports'
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

    hr_generalist: [
        'dashboard.view',
        'employees.view', 'employees.edit'
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

    regional_procurement_lead: [
        'dashboard.view', 'admin.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po', 'procurement.receive',
        'inventory.view', 'inventory.transfer',
        'pricing.view',
        'customers.view', 'customers.view_history'
    ],

    regional_finance_officer: [
        'dashboard.view', 'admin.view',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.reconcile_drawer', 'finance.view_payroll',
        'sales.view', 'sales.view_reports',
        'pos.view'
    ],

    regional_hr_officer: [
        'dashboard.view', 'admin.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance', 'employees.view_salary', 'employees.propose_salary',
        'finance.view_payroll'
    ],

    regional_logistics_lead: [
        'dashboard.view', 'admin.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch', 'warehouse.receive', 'warehouse.putaway',
        'inventory.view', 'inventory.transfer',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],

    regional_security_supervisor: [
        'dashboard.view', 'admin.view',
        'settings.view', 'settings.view_logs',
        'pos.view',
        'sales.view', 'sales.view_reports',
        'inventory.view',
        'employees.view', 'employees.manage_attendance'
    ],

    head_of_operations: HEAD_OF_OPERATIONS_PERMISSIONS,
    operations_head: HEAD_OF_OPERATIONS_PERMISSIONS,
    operations_manager: HEAD_OF_OPERATIONS_PERMISSIONS,

    head_of_hr: HEAD_OF_HR_PERMISSIONS,
    hr_head: HEAD_OF_HR_PERMISSIONS,
    hr_manager: HEAD_OF_HR_PERMISSIONS,

    head_of_supply_chain: HEAD_OF_SUPPLY_CHAIN_PERMISSIONS,
    supply_chain_head: HEAD_OF_SUPPLY_CHAIN_PERMISSIONS,
    supply_chain_manager: HEAD_OF_SUPPLY_CHAIN_PERMISSIONS,

    head_of_merchandising: HEAD_OF_MERCHANDISING_PERMISSIONS,
    merchandising_head: HEAD_OF_MERCHANDISING_PERMISSIONS,
    merchandising_manager: HEAD_OF_MERCHANDISING_PERMISSIONS,
    merchandising_specialist: [
        'dashboard.view', 'inventory.view', 'pricing.view', 'pricing.create_promo',
        'sales.view', 'sales.view_reports'
    ],
    regional_merchandising_lead: [
        'dashboard.view', 'inventory.view', 'pricing.view', 'pricing.edit',
        'pricing.create_promo', 'pricing.approve_promo', 'sales.view', 'sales.view_reports'
    ],

    // ============================================================================
    // LEVEL 3 - Site Managers
    // ============================================================================

    store_manager: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
        'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'employees.view', 'employees.edit', 'employees.manage_attendance'
    ],

    assistant_manager: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
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
        'finance.view', 'finance.view_reports', 'finance.reconcile_drawer',
        'sales.view', 'sales.view_reports',
        'pos.view'
    ],

    tax_compliance_officer: [
        'dashboard.view',
        'finance.view', 'finance.view_reports',
        'sales.view', 'sales.view_reports'
    ],

    credit_control_officer: [
        'dashboard.view', 'procurement.view',
        'finance.view', 'finance.view_reports',
        'sales.view', 'sales.view_reports',
        'customers.view', 'customers.view_history'
    ],

    vendor_relations_manager: [
        'dashboard.view',
        'procurement.view'
    ],

    customs_import_specialist: [
        'dashboard.view',
        'procurement.view'
    ],

    inbound_qc_inspector: [
        'dashboard.view',
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
