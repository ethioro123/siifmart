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
    country_managing_director: {
        role: 'country_managing_director',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Executive',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['regional_manager', 'head_of_finance', 'head_of_operations', 'finance_manager', 'operations_manager'],
        isManagerial: true
    },
    head_of_operations: {
        role: 'head_of_operations',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Operations Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO / Executive Leadership',
        managesRoles: ['regional_manager', 'head_of_supply_chain', 'supply_chain_manager', 'store_manager', 'warehouse_manager', 'security_manager', 'cs_manager', 'store_operations_auditor'],
        isManagerial: true
    },
    head_of_finance: {
        role: 'head_of_finance',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Finance Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    head_of_hr: {
        role: 'head_of_hr',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 HR Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['hr', 'hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    head_of_procurement: {
        role: 'head_of_procurement',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Procurement Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['buyer', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector'],
        isManagerial: true
    },
    head_of_supply_chain: {
        role: 'head_of_supply_chain',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Supply Chain Director',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['demand_planner', 'replenishment_planner', 'logistics_manager', 'inventory_manager'],
        isManagerial: true
    },
    head_of_merchandising: {
        role: 'head_of_merchandising',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Merchandising Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['merchandiser'],
        isManagerial: true
    },
    head_of_it: {
        role: 'head_of_it',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 IT Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['it_support'],
        isManagerial: true
    },
    head_of_audit: {
        role: 'head_of_audit',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Audit Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO / Audit Committee',
        managesRoles: ['auditor', 'store_operations_auditor'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 2: CORPORATE & REGIONAL DIRECTORS
    // =========================================================================
    operations_manager: {
        role: 'operations_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Operations Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO / Executive Leadership',
        managesRoles: ['regional_manager', 'supply_chain_manager', 'store_manager', 'warehouse_manager', 'security_manager', 'cs_manager', 'store_operations_auditor'],
        isManagerial: true
    },
    regional_manager: {
        role: 'regional_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Regional Director',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager (Corporate HQ)',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Executive Oversight)',
        managesRoles: ['store_manager', 'warehouse_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor'],
        isManagerial: true
    },
    supply_chain_manager: {
        role: 'supply_chain_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Director',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
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
        managesRoles: ['hr', 'hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
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
    regional_procurement_lead: {
        role: 'regional_procurement_lead',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Regional Procurement',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'procurement_manager',
        dottedLineLabel: 'Procurement Manager (Corporate Sourcing)',
        managesRoles: ['buyer', 'vendor_relations_manager'],
        isManagerial: true
    },
    regional_finance_officer: {
        role: 'regional_finance_officer',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Regional Finance',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Finance Manager (Corporate Finance & Audit)',
        managesRoles: ['accountant', 'treasury_officer'],
        isManagerial: true
    },
    regional_hr_officer: {
        role: 'regional_hr_officer',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Regional HR',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'hr_manager',
        dottedLineLabel: 'HR Manager (Corporate People & Payroll)',
        managesRoles: ['hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    regional_logistics_lead: {
        role: 'regional_logistics_lead',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Regional Logistics',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'supply_chain_manager',
        dottedLineLabel: 'Supply Chain Manager (Corporate Fulfillment)',
        managesRoles: ['logistics_manager', 'dispatch_manager'],
        isManagerial: true
    },
    regional_security_supervisor: {
        role: 'regional_security_supervisor',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Regional Security',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'operations_manager',
        dottedLineLabel: 'Operations Manager (Enterprise Asset Protection)',
        managesRoles: ['security_manager', 'loss_prevention'],
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
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'operations_manager',
        dottedLineLabel: 'Operations Manager (HQ Operational Standards)',
        managesRoles: ['assistant_manager', 'store_supervisor', 'shift_lead', 'merchandiser', 'returns_clerk'],
        isManagerial: true
    },
    warehouse_manager: {
        role: 'warehouse_manager',
        level: 3,
        levelCategory: 'supervisor',
        levelTag: 'L3 Fulfillment Captain',
        reportsToRole: 'regional_manager',
        reportsToLabel: 'Regional Manager (Territory Administration)',
        dottedLineRole: 'operations_manager',
        dottedLineLabel: 'Operations Manager (HQ Operational Standards)',
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
