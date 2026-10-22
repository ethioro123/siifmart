import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 1 through 8: Executive, Directorates, Regional, Facility & Shift Management
export const L1_L3_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // =========================================================================
    // LEVEL 1: GLOBAL EXECUTIVE LEADERSHIP
    // =========================================================================
    group_ceo: {
        role: 'group_ceo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: null,
        reportsToLabel: 'Board of Directors / Ownership',
        managesRoles: ['country_managing_director', 'admin', 'regional_operations_manager', 'head_of_operations', 'head_of_finance', 'head_of_hr', 'head_of_procurement', 'head_of_merchandising', 'head_of_supply_chain', 'head_of_it', 'head_of_audit', 'it_support'],
        isManagerial: true
    },
    super_admin: {
        role: 'super_admin',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: null,
        reportsToLabel: 'Board of Directors / Ownership',
        managesRoles: ['country_managing_director', 'admin', 'regional_operations_manager', 'head_of_finance', 'head_of_hr', 'head_of_procurement', 'head_of_operations', 'it_support'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 2: COUNTRY EXECUTIVE LEADERSHIP
    // =========================================================================
    admin: {
        role: 'admin',
        level: 2,
        levelCategory: 'executive',
        levelTag: 'L2 Country Executive',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['regional_operations_manager', 'head_of_finance', 'head_of_operations'],
        isManagerial: true
    },
    country_managing_director: {
        role: 'country_managing_director',
        level: 2,
        levelCategory: 'executive',
        levelTag: 'L2 Country Executive',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['regional_operations_manager', 'head_of_finance', 'head_of_operations',],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 3: CORPORATE HQ DIRECTORATE HEADS
    // =========================================================================
    head_of_operations: {
        role: 'head_of_operations',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Operations Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO / Executive Leadership',
        managesRoles: ['regional_operations_manager', 'head_of_supply_chain', 'store_manager', 'warehouse_manager', 'security_manager', 'cs_manager', 'store_operations_auditor'],
        isManagerial: true
    },
    head_of_finance: {
        role: 'head_of_finance',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Finance Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    head_of_hr: {
        role: 'head_of_hr',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 HR Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['hr', 'hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    head_of_procurement: {
        role: 'head_of_procurement',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Procurement Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['buyer', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector'],
        isManagerial: true
    },
    head_of_supply_chain: {
        role: 'head_of_supply_chain',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Supply Chain Director',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['demand_planner', 'replenishment_planner', 'logistics_manager', 'inventory_manager'],
        isManagerial: true
    },
    head_of_merchandising: {
        role: 'head_of_merchandising',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Merchandising Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['regional_merchandising_manager', 'merchandising_specialist', 'merchandiser'],
        isManagerial: true
    },
    head_of_it: {
        role: 'head_of_it',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 IT Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        managesRoles: ['it_support'],
        isManagerial: true
    },
    head_of_audit: {
        role: 'head_of_audit',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Audit Director',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO / Audit Committee',
        managesRoles: ['auditor', 'store_operations_auditor'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 4: REGIONAL OPERATIONS MANAGERS
    // =========================================================================
    regional_operations_manager: {
        role: 'regional_operations_manager',
        level: 4,
        levelCategory: 'director',
        levelTag: 'L4 Regional Operations',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations (Corporate HQ)',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Executive Oversight)',
        managesRoles: ['store_manager', 'warehouse_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 5: REGIONAL DEPARTMENT MANAGERS
    // =========================================================================
    regional_merchandising_manager: {
        role: 'regional_merchandising_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Merchandising',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_merchandising',
        dottedLineLabel: 'Head of Merchandising (Country Pricing & Campaigns)',
        managesRoles: ['merchandising_specialist'],
        isManagerial: true
    },
    regional_procurement_manager: {
        role: 'regional_procurement_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Procurement',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_procurement',
        dottedLineLabel: 'Head of Procurement (Corporate Sourcing)',
        managesRoles: ['buyer', 'vendor_relations_manager'],
        isManagerial: true
    },
    regional_finance_manager: {
        role: 'regional_finance_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Finance',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_finance',
        dottedLineLabel: 'Head of Finance (Corporate Finance & Audit)',
        managesRoles: ['accountant', 'treasury_officer'],
        isManagerial: true
    },
    regional_hr_manager: {
        role: 'regional_hr_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional HR',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_hr',
        dottedLineLabel: 'Head of Human Resources (Corporate People & Payroll)',
        managesRoles: ['hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    regional_logistics_manager: {
        role: 'regional_logistics_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Logistics',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_supply_chain',
        dottedLineLabel: 'Head of Supply Chain (Corporate Fulfillment)',
        managesRoles: ['logistics_manager', 'dispatch_manager'],
        isManagerial: true
    },
    regional_security_manager: {
        role: 'regional_security_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Security',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (Enterprise Asset Protection)',
        managesRoles: ['security_manager', 'loss_prevention'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 6: FACILITY CAPTAINS (STORE & WAREHOUSE)
    // =========================================================================
    store_manager: {
        role: 'store_manager',
        level: 6,
        levelCategory: 'supervisor',
        levelTag: 'L6 Store Captain',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (HQ Operational Standards)',
        managesRoles: ['assistant_manager', 'store_supervisor', 'shift_lead', 'merchandiser', 'returns_clerk'],
        isManagerial: true
    },
    warehouse_manager: {
        role: 'warehouse_manager',
        level: 6,
        levelCategory: 'supervisor',
        levelTag: 'L6 Fulfillment Captain',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Territory Administration)',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (HQ Operational Standards)',
        managesRoles: ['receiver', 'picker', 'packer', 'forklift_operator'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 7: FUNCTIONAL & DEPARTMENT MANAGERS
    // =========================================================================
    logistics_manager: {
        role: 'logistics_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Logistics Lead',
        reportsToRole: 'head_of_supply_chain',
        reportsToLabel: 'Head of Supply Chain',
        managesRoles: ['dispatch_manager', 'fleet_maintenance_supervisor', 'driver', 'dispatcher'],
        isManagerial: true
    },
    inventory_manager: {
        role: 'inventory_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Stock Integrity Lead',
        reportsToRole: 'head_of_supply_chain',
        reportsToLabel: 'Head of Supply Chain',
        dottedLineRole: 'head_of_finance',
        dottedLineLabel: 'Internal Auditor (Variance Deep-Dives)',
        managesRoles: ['inventory_specialist', 'stock_clerk'],
        isManagerial: true
    },
    security_manager: {
        role: 'security_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Security Lead',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['loss_prevention'],
        isManagerial: true
    },
    dispatch_manager: {
        role: 'dispatch_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Fleet Lead',
        reportsToRole: 'logistics_manager',
        reportsToLabel: 'Logistics Manager',
        managesRoles: ['driver', 'dispatcher'],
        isManagerial: true
    },
    cs_manager: {
        role: 'cs_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Customer Lead',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['customer_service'],
        isManagerial: true
    },
    vendor_relations_manager: {
        role: 'vendor_relations_manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Vendor Lead',
        reportsToRole: 'head_of_procurement',
        reportsToLabel: 'Head of Procurement',
        managesRoles: ['buyer', 'customs_import_specialist'],
        isManagerial: true
    },
    manager: {
        role: 'manager',
        level: 7,
        levelCategory: 'supervisor',
        levelTag: 'L7 Manager',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        managesRoles: ['sales_associate', 'cashier'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 8: DEPUTY & SHIFT SUPERVISORS
    // =========================================================================
    assistant_manager: {
        role: 'assistant_manager',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Store Deputy',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['shift_lead', 'cashier', 'sales_associate'],
        isManagerial: true
    },
    fleet_maintenance_supervisor: {
        role: 'fleet_maintenance_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Transport Supervisor',
        reportsToRole: 'logistics_manager',
        reportsToLabel: 'Logistics Manager',
        dottedLineRole: 'dispatch_manager',
        dottedLineLabel: 'Dispatch Manager (Vehicle Availability)',
        managesRoles: ['driver'],
        isManagerial: true
    },
    store_supervisor: {
        role: 'store_supervisor',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Floor Supervisor',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        managesRoles: ['merchandiser', 'stock_clerk'],
        isManagerial: true
    },
    shift_lead: {
        role: 'shift_lead',
        level: 8,
        levelCategory: 'supervisor',
        levelTag: 'L8 Shift Lead',
        reportsToRole: 'assistant_manager',
        reportsToLabel: 'Assistant Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Floor Continuity)',
        managesRoles: ['cashier', 'sales_associate', 'pos'],
        isManagerial: true
    }
};
