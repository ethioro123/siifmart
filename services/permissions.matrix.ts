/**
 * Role-based action permissions matrix
 * Extracted from permissions.service.ts to keep file size manageable.
 */

import type { UserRole } from './auth.service';
import type { Permission } from './permissions.service';
import { HEAD_OF_AUDIT_PERMISSIONS } from './permissions.matrix-audit';
import {
    FULL_ACCESS_PERMISSIONS,
    ADMIN_ACCESS_PERMISSIONS,
    HEAD_OF_FINANCE_PERMISSIONS,
    HEAD_OF_PROCUREMENT_PERMISSIONS,
    HEAD_OF_OPERATIONS_PERMISSIONS,
    HEAD_OF_HR_PERMISSIONS,
    HR_STAFF_PERMISSIONS,
    HEAD_OF_SUPPLY_CHAIN_PERMISSIONS,
    HEAD_OF_MERCHANDISING_PERMISSIONS,
    HEAD_OF_IT_PERMISSIONS
} from './permissions.matrix-base';
import { FRONTLINE_PERMISSIONS } from './permissions.matrix-frontline';

export const ACTION_PERMISSIONS: Record<UserRole, Permission[]> = {
    // ═══ LEVEL 1: GLOBAL EXECUTIVE ═══
    group_ceo: FULL_ACCESS_PERMISSIONS,
    // Database PO insert policy reserves PO creation to the Group CEO among Group executives.
    group_coo: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_cfo: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_cco: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_cmo: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_csco: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_chro: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_cto: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_cio: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_clco: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
    group_cae: FULL_ACCESS_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),

    // ═══ LEVEL 2: COUNTRY EXECUTIVE (Segregation of Duties: no dock self-receiving) ═══
    country_managing_director: ADMIN_ACCESS_PERMISSIONS,
    country_operations_director: HEAD_OF_OPERATIONS_PERMISSIONS,
    country_finance_director: HEAD_OF_FINANCE_PERMISSIONS,
    country_commercial_director: [
        'dashboard.view', 'admin.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po', 'procurement.delete_po',
        'inventory.view', 'pricing.view',
        'sales.view', 'sales.view_reports', 'customers.view'
    ],
    country_supply_chain_director: [...HEAD_OF_SUPPLY_CHAIN_PERMISSIONS, 'procurement.create_po', 'pricing.view'],
    country_hr_director: HEAD_OF_HR_PERMISSIONS,
    country_technology_director: HEAD_OF_IT_PERMISSIONS,
    country_compliance_manager: HEAD_OF_AUDIT_PERMISSIONS,

    // ═══ LEVEL 3: CORPORATE HQ DIRECTORATE HEADS ═══
    it_support: HEAD_OF_IT_PERMISSIONS,
    auditor: HEAD_OF_AUDIT_PERMISSIONS,

    // ═══ LEVEL 4: REGIONAL OPERATIONS & AREA MANAGERS ═══
    regional_operations_manager: HEAD_OF_OPERATIONS_PERMISSIONS.filter(
        permission => !['pos.create_sale', 'pos.hold_order', 'pos.void_sale', 'sales.create', 'procurement.delete_po'].includes(permission)
    ),
    area_operations_manager: HEAD_OF_OPERATIONS_PERMISSIONS.filter(
        permission => !['pos.create_sale', 'pos.hold_order', 'pos.void_sale', 'sales.create', 'procurement.create_po', 'procurement.delete_po'].includes(permission)
    ),

    // ═══ LEVEL 5: REGIONAL DEPARTMENT MANAGERS ═══
    regional_supply_chain_manager: [
        ...HEAD_OF_SUPPLY_CHAIN_PERMISSIONS.filter(permission => permission !== 'procurement.create_po'),
        'pricing.view'
    ],
    regional_procurement_manager: [
        'dashboard.view', 'admin.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po', 'procurement.approve_po',
        'inventory.view', 'inventory.transfer',
        'pricing.view',
        'sales.view', 'sales.view_reports',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],
    regional_merchandising_manager: [
        'dashboard.view', 'admin.view',
        'inventory.view',
        'pricing.view', 'pricing.edit', 'pricing.create_promo', 'pricing.approve_promo',
        'sales.view', 'sales.view_reports',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],
    regional_finance_manager: [
        'dashboard.view', 'admin.view',
        'procurement.view', 'procurement.approve_po',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.approve_expense', 'finance.edit_expense', 'finance.void_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.manage_budget', 'finance.view_payroll',
        'sales.view', 'sales.view_reports',
        'pricing.view',
        'pos.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance', 'employees.view_salary'
    ],
    regional_hr_manager: [
        'dashboard.view', 'admin.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance', 'employees.view_salary', 'employees.propose_salary',
        'finance.view_payroll'
    ],
    regional_logistics_manager: [
        'dashboard.view', 'admin.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch', 'warehouse.receive', 'warehouse.putaway',
        'inventory.view', 'inventory.transfer',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],
    regional_security_manager: [
        'dashboard.view', 'admin.view',
        'settings.view', 'settings.view_logs',
        'pos.view',
        'sales.view', 'sales.view_reports',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],
    regional_it_manager: [
        'dashboard.view', 'admin.view',
        'settings.view', 'settings.edit', 'settings.view_logs', 'settings.manage_integrations',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],
    regional_compliance_manager: [
        ...HEAD_OF_AUDIT_PERMISSIONS,
        'admin.view',
        'pricing.view',
        'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],

    // ═══ LEVEL 6: FACILITY CAPTAINS (Store & Warehouse Command) ═══
    store_manager: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order', 'pos.void_sale',
        'sales.view', 'sales.view_reports', 'sales.create', 'sales.refund',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'employees.view', 'employees.edit', 'employees.manage_attendance'
    ],
    warehouse_manager: [
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],

    // ═══ LEVEL 7: FUNCTIONAL & DEPARTMENT MANAGERS ═══
    warehouse_operations_manager: [
        'dashboard.view',
        'inventory.view', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.putaway', 'warehouse.count',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],
    transport_fleet_manager: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch',
        'inventory.view', 'inventory.transfer',
        'employees.view', 'employees.manage_attendance'
    ],
    inventory_manager: [
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.count',
        'employees.view'
    ],
    cs_manager: [
        'dashboard.view', 'admin.view', 'pos.view',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history', 'customers.manage_loyalty',
        'sales.view', 'sales.view_reports', 'sales.refund',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],
    vendor_relations_manager: [
        'dashboard.view', 'admin.view',
        'procurement.view', 'pricing.view', 'inventory.view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.approve', 'employees.manage_attendance'
    ],

    // ═══ LEVEL 8: DEPUTY MANAGERS, SUPERVISORS & TEAM LEADERS ═══
    assistant_store_manager: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'sales.view', 'sales.view_reports',
        'customers.view', 'customers.create', 'customers.edit', 'customers.view_history',
        'employees.view', 'employees.manage_attendance'
    ],
    shift_supervisor: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'sales.view',
        'customers.view', 'customers.create', 'customers.edit',
        'employees.view', 'employees.manage_attendance'
    ],
    receiving_supervisor: [
        'dashboard.view',
        'inventory.view', 'inventory.count',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],
    stock_control_supervisor: [
        'dashboard.view',
        'inventory.view', 'inventory.count', 'inventory.adjust', 'inventory.transfer',
        'employees.view', 'employees.manage_attendance'
    ],
    pos_supervisor: [
        'dashboard.view',
        'pos.view', 'pos.create_sale', 'pos.refund', 'pos.hold_order',
        'sales.view', 'sales.view_reports',
        'customers.view', 'customers.create', 'customers.edit',
        'employees.view', 'employees.manage_attendance'
    ],
    inventory_control_supervisor: [
        'dashboard.view',
        'inventory.view', 'inventory.adjust', 'inventory.count', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.count',
        'employees.view', 'employees.manage_attendance'
    ],
    putaway_replenishment_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.putaway',
        'inventory.view', 'inventory.transfer',
        'employees.view', 'employees.manage_attendance'
    ],
    picking_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.pick',
        'inventory.view',
        'employees.view', 'employees.manage_attendance'
    ],
    packing_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.pack',
        'inventory.view',
        'employees.view', 'employees.manage_attendance'
    ],
    dispatch_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch',
        'inventory.view', 'inventory.transfer',
        'employees.view', 'employees.manage_attendance'
    ],
    inbound_operations_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.putaway', 'warehouse.count',
        'inventory.view', 'inventory.count',
        'procurement.view', 'procurement.receive',
        'employees.view', 'employees.manage_attendance'
    ],
    outbound_operations_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.pick', 'warehouse.pack', 'warehouse.dispatch', 'warehouse.count',
        'inventory.view', 'inventory.count',
        'employees.view', 'employees.manage_attendance'
    ],
    returns_waste_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks',
        'inventory.view', 'inventory.adjust',
        'sales.refund', 'customers.view',
        'employees.view', 'employees.manage_attendance'
    ],
    fleet_maintenance_supervisor: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch',
        'inventory.view',
        'employees.view', 'employees.manage_attendance'
    ],
    receiving_team_leader: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'warehouse.putaway',
        'inventory.view', 'procurement.receive'
    ],
    picking_team_leader: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.pick',
        'inventory.view'
    ],
    packing_team_leader: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.pack',
        'inventory.view'
    ],
    dispatch_team_leader: [
        'dashboard.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch',
        'inventory.view'
    ],

    // ═══ LEVEL 9: DOMAIN SPECIALISTS, AUDITORS & ANALYSTS (Maker/Reviewer) ═══
    store_operations_auditor: [
        'dashboard.view', 'pos.view', 'sales.view', 'sales.view_reports',
        'inventory.view', 'inventory.count', 'pricing.view', 'settings.view_logs'
    ],
    payroll_specialist: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.view_payroll', 'finance.manage_payroll',
        'employees.view', 'employees.view_salary', 'employees.propose_salary'
    ],
    treasury_officer: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.reconcile_drawer',
        'sales.view', 'sales.view_reports', 'pos.view'
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
    accountant: [
        'dashboard.view',
        'finance.view', 'finance.view_reports', 'finance.create_expense', 'finance.reconcile_drawer', 'finance.manage_ap', 'finance.view_payroll',
        'sales.view', 'sales.view_reports'
    ],
    data_analyst: [
        'dashboard.view',
        'sales.view', 'sales.view_reports', 'inventory.view',
        'finance.view', 'finance.view_reports', 'customers.view', 'customers.view_history'
    ],
    training_coordinator: [
        'dashboard.view',
        'employees.view', 'employees.edit', 'employees.manage_attendance'
    ],
    talent_recruiter: [
        'dashboard.view',
        'employees.view', 'employees.create', 'employees.edit'
    ],
    hr_generalist: [
        'dashboard.view',
        'employees.view', 'employees.edit', 'employees.view_salary', 'employees.propose_salary'
    ],
    merchandising_specialist: [
        'dashboard.view', 'inventory.view', 'pricing.view', 'pricing.create_promo',
        'sales.view', 'sales.view_reports'
    ],
    customs_import_specialist: [
        'dashboard.view', 'procurement.view', 'inventory.view'
    ],
    dispatcher: [
        'dashboard.view', 'inventory.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.dispatch',
        'employees.view', 'employees.manage_attendance'
    ],
    buyer: [
        'dashboard.view',
        'procurement.view', 'procurement.create_po', 'procurement.edit_po'
    ],
    demand_planner: [
        'dashboard.view', 'inventory.view', 'procurement.view', 'procurement.create_po', 'sales.view'
    ],
    replenishment_planner: [
        'dashboard.view', 'inventory.view', 'inventory.transfer',
        'warehouse.view', 'warehouse.view_tasks', 'procurement.view', 'procurement.create_po', 'sales.view'
    ],
    inbound_qc_inspector: [
        'dashboard.view', 'procurement.view',
        'warehouse.view', 'warehouse.view_tasks', 'warehouse.receive', 'inventory.view'
    ],
    loss_prevention: [
        'dashboard.view', 'sales.view', 'sales.view_reports', 'settings.view_logs'
    ],
    cash_office_officer: [
        'dashboard.view',
        'pos.view',
        'finance.view', 'finance.reconcile_drawer',
        'sales.view', 'sales.view_reports'
    ],

    // ═══ LEVEL 10: FRONTLINE STORE & WAREHOUSE STAFF (Extracted to permissions.matrix-frontline.ts) ═══
    ...FRONTLINE_PERMISSIONS
};
