import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 1, 2 & 3: Executive, Directorates & Facility Management
export const L1_L3_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // =========================================================================
    // LEVEL 1: EXECUTIVE LEADERSHIP
    // =========================================================================
    super_admin: {
        role: 'super_admin',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Executive',
        reportsToRole: null,
        reportsToLabel: 'Enterprise Board / Ownership',
        managesRoles: ['regional_manager', 'finance_manager', 'hr_manager', 'procurement_manager', 'operations_manager', 'it_support'],
        isManagerial: true
    },
    admin: {
        role: 'admin',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Executive',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['regional_manager', 'finance_manager', 'operations_manager'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 2: CORPORATE & REGIONAL DIRECTORS
    // =========================================================================
    regional_manager: {
        role: 'regional_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['operations_manager', 'supply_chain_manager', 'store_manager', 'warehouse_manager'],
        isManagerial: true
    },
    operations_manager: {
        role: 'operations_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (HQ Executive Reporting)',
        managesRoles: ['store_manager', 'warehouse_manager', 'security_manager', 'cs_manager', 'store_operations_auditor'],
        isManagerial: true
    },
    supply_chain_manager: {
        role: 'supply_chain_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Strategic Sourcing & Logistics)',
        managesRoles: ['demand_planner', 'replenishment_planner', 'logistics_manager', 'inventory_manager'],
        isManagerial: true
    },
    procurement_manager: {
        role: 'procurement_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['buyer', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector'],
        isManagerial: true
    },
    finance_manager: {
        role: 'finance_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    hr_manager: {
        role: 'hr_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['hr', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    merchandising_manager: {
        role: 'merchandising_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Merchandising Lead',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Finance Manager (Margin Protection & Pricing Rules)',
        managesRoles: ['merchandiser'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 3: FACILITY OPERATIONS MANAGERS & SUPERVISORS
    // =========================================================================
    store_manager: {
        role: 'store_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Store Captain',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Finance Manager (Daily Drawer & Z-Reports)',
        managesRoles: ['assistant_manager', 'store_supervisor', 'shift_lead', 'merchandiser', 'returns_clerk'],
        isManagerial: true
    },
    warehouse_manager: {
        role: 'warehouse_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Fulfillment Captain',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
        dottedLineRole: 'supply_chain_manager',
        dottedLineLabel: 'Supply Chain Mgr (Cross-Dock & DC Flow)',
        managesRoles: ['receiver', 'picker', 'packer', 'forklift_operator'],
        isManagerial: true
    },
    logistics_manager: {
        role: 'logistics_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Logistics Lead',
        reportsToRole: 'supply_chain_manager',
        reportsToLabel: 'Supply Chain Manager',
        managesRoles: ['dispatch_manager', 'fleet_maintenance_supervisor', 'driver', 'dispatcher'],
        isManagerial: true
    },
    inventory_manager: {
        role: 'inventory_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Stock Integrity Lead',
        reportsToRole: 'supply_chain_manager',
        reportsToLabel: 'Supply Chain Manager',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Internal Auditor (Variance Deep-Dives)',
        managesRoles: ['inventory_specialist', 'stock_clerk'],
        isManagerial: true
    },
    security_manager: {
        role: 'security_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Security Lead',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
        managesRoles: ['loss_prevention'],
        isManagerial: true
    },
    dispatch_manager: {
        role: 'dispatch_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Fleet Lead',
        reportsToRole: 'logistics_manager',
        reportsToLabel: 'Logistics Manager',
        managesRoles: ['driver', 'dispatcher'],
        isManagerial: true
    },
    cs_manager: {
        role: 'cs_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Customer Lead',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
        managesRoles: ['customer_service'],
        isManagerial: true
    },
    assistant_manager: {
        role: 'assistant_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Store Deputy',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['shift_lead', 'cashier', 'sales_associate'],
        isManagerial: true
    },
    fleet_maintenance_supervisor: {
        role: 'fleet_maintenance_supervisor',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Transport Supervisor',
        reportsToRole: 'logistics_manager',
        reportsToLabel: 'Logistics Manager',
        dottedLineRole: 'dispatch_manager',
        dottedLineLabel: 'Dispatch Manager (Vehicle Availability)',
        managesRoles: ['driver'],
        isManagerial: true
    },
    store_supervisor: {
        role: 'store_supervisor',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Floor Supervisor',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['merchandiser', 'stock_clerk'],
        isManagerial: true
    },
    shift_lead: {
        role: 'shift_lead',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Shift Lead',
        reportsToRole: 'assistant_manager',
        reportsToLabel: 'Assistant Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Floor Continuity)',
        managesRoles: ['cashier', 'sales_associate', 'pos'],
        isManagerial: true
    },
    manager: {
        role: 'manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Manager',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
        managesRoles: ['sales_associate', 'cashier'],
        isManagerial: true
    }
};
