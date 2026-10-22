import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 1 through 5: Executive Leadership, Directorates, Regional Leadership
export const L1_L5_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // =========================================================================
    // LEVEL 1: GLOBAL EXECUTIVE LEADERSHIP (C-SUITE BOARD)
    // =========================================================================
    group_ceo: {
        role: 'group_ceo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: null,
        reportsToLabel: 'Board of Directors / Ownership',
        managesRoles: [
            'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro',
            'group_cto', 'group_cio', 'group_clco', 'group_cae',
            'country_managing_director', 'admin', 'head_of_operations'
        ],
        isManagerial: true
    },
    group_coo: {
        role: 'group_coo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_managing_director', 'country_operations_director', 'admin', 'head_of_operations', 'regional_operations_manager', 'head_of_supply_chain'],
        isManagerial: true
    },
    group_cfo: {
        role: 'group_cfo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_finance_director', 'head_of_finance', 'regional_finance_manager', 'auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'payroll_specialist'],
        isManagerial: true
    },
    group_cco: {
        role: 'group_cco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_commercial_director', 'head_of_procurement', 'head_of_merchandising', 'regional_procurement_manager', 'regional_merchandising_manager', 'buyer', 'merchandising_specialist', 'vendor_relations_manager'],
        isManagerial: true
    },
    group_csco: {
        role: 'group_csco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_supply_chain_director', 'head_of_supply_chain', 'regional_logistics_manager', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'demand_planner', 'replenishment_planner', 'fleet_maintenance_supervisor'],
        isManagerial: true
    },
    group_chro: {
        role: 'group_chro',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_hr_director', 'head_of_hr', 'regional_hr_manager', 'hr', 'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    group_cto: {
        role: 'group_cto',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_technology_director', 'head_of_it', 'it_support'],
        isManagerial: true
    },
    group_cio: {
        role: 'group_cio',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_technology_director', 'head_of_it', 'it_support', 'data_analyst'],
        isManagerial: true
    },
    group_clco: {
        role: 'group_clco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_compliance_manager', 'tax_compliance_officer', 'customs_import_specialist', 'auditor'],
        isManagerial: true
    },
    group_cae: {
        role: 'group_cae',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: null,
        reportsToLabel: 'Board Audit Committee / Ownership',
        dottedLineRole: 'group_ceo',
        dottedLineLabel: 'Group CEO (Administrative Oversight)',
        managesRoles: ['country_compliance_manager', 'head_of_audit', 'auditor', 'store_operations_auditor', 'loss_prevention'],
        isManagerial: true
    },
    super_admin: {
        role: 'super_admin',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: null,
        reportsToLabel: 'Board of Directors / Ownership',
        managesRoles: [
            'group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro',
            'group_cto', 'group_cio', 'group_clco', 'group_cae',
            'country_managing_director', 'admin', 'regional_operations_manager', 'head_of_finance', 'head_of_hr', 'head_of_procurement', 'head_of_operations', 'it_support'
        ],
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
        reportsToRole: 'group_coo',
        reportsToLabel: 'Group COO',
        dottedLineRole: 'group_ceo',
        dottedLineLabel: 'Group CEO (Executive Oversight)',
        managesRoles: [
            'country_operations_director', 'country_finance_director', 'country_commercial_director',
            'country_supply_chain_director', 'country_hr_director', 'country_technology_director',
            'country_compliance_manager', 'regional_operations_manager', 'head_of_finance', 'head_of_operations'
        ],
        isManagerial: true
    },
    country_managing_director: {
        role: 'country_managing_director',
        level: 2,
        levelCategory: 'executive',
        levelTag: 'L2 Country Executive',
        reportsToRole: 'group_coo',
        reportsToLabel: 'Group COO',
        dottedLineRole: 'group_ceo',
        dottedLineLabel: 'Group CEO (Executive Oversight)',
        managesRoles: [
            'country_operations_director', 'country_finance_director', 'country_commercial_director',
            'country_supply_chain_director', 'country_hr_director', 'country_technology_director',
            'country_compliance_manager', 'regional_operations_manager', 'head_of_finance', 'head_of_operations'
        ],
        isManagerial: true
    },
    country_operations_director: {
        role: 'country_operations_director',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country Operations Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_coo',
        dottedLineLabel: 'Group COO (Functional Oversight)',
        managesRoles: ['regional_operations_manager', 'area_operations_manager', 'store_manager'],
        isManagerial: true
    },
    country_finance_director: {
        role: 'country_finance_director',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country Finance Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cfo',
        dottedLineLabel: 'Group CFO (Functional Oversight)',
        managesRoles: ['regional_finance_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    country_commercial_director: {
        role: 'country_commercial_director',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country Commercial Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cco',
        dottedLineLabel: 'Group CCO (Functional Oversight)',
        managesRoles: ['regional_procurement_manager', 'regional_merchandising_manager', 'buyer', 'merchandising_specialist', 'vendor_relations_manager'],
        isManagerial: true
    },
    country_supply_chain_director: {
        role: 'country_supply_chain_director',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country Supply Chain Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_csco',
        dottedLineLabel: 'Group CSCO (Functional Oversight)',
        managesRoles: ['regional_logistics_manager', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'demand_planner', 'replenishment_planner', 'fleet_maintenance_supervisor'],
        isManagerial: true
    },
    country_hr_director: {
        role: 'country_hr_director',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country HR Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_chro',
        dottedLineLabel: 'Group CHRO (Functional Oversight)',
        managesRoles: ['regional_hr_manager', 'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    country_technology_director: {
        role: 'country_technology_director',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country Technology Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cto',
        dottedLineLabel: 'Group CTO / CIO (Functional Oversight)',
        managesRoles: ['it_support', 'data_analyst'],
        isManagerial: true
    },
    country_compliance_manager: {
        role: 'country_compliance_manager',
        level: 2,
        levelCategory: 'director',
        levelTag: 'L2 Country Compliance Manager',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cae',
        dottedLineLabel: 'Chief Audit Executive / Group CLCO (Functional Oversight)',
        managesRoles: ['auditor', 'store_operations_auditor', 'tax_compliance_officer', 'loss_prevention'],
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
        reportsToRole: 'group_coo',
        reportsToLabel: 'Group COO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Operational Oversight)',
        managesRoles: ['regional_operations_manager', 'head_of_supply_chain', 'store_manager', 'warehouse_manager', 'security_manager', 'cs_manager', 'store_operations_auditor'],
        isManagerial: true
    },
    head_of_finance: {
        role: 'head_of_finance',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Finance Director',
        reportsToRole: 'group_cfo',
        reportsToLabel: 'Group CFO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['regional_finance_manager', 'auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    head_of_hr: {
        role: 'head_of_hr',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 HR Director',
        reportsToRole: 'group_chro',
        reportsToLabel: 'Group CHRO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['hr', 'hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    head_of_procurement: {
        role: 'head_of_procurement',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Procurement Director',
        reportsToRole: 'group_cco',
        reportsToLabel: 'Group CCO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['buyer', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector'],
        isManagerial: true
    },
    head_of_supply_chain: {
        role: 'head_of_supply_chain',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Supply Chain Director',
        reportsToRole: 'group_csco',
        reportsToLabel: 'Group CSCO',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (Logistics Alignment)',
        managesRoles: ['demand_planner', 'replenishment_planner', 'logistics_manager', 'inventory_manager'],
        isManagerial: true
    },
    head_of_merchandising: {
        role: 'head_of_merchandising',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Merchandising Director',
        reportsToRole: 'group_cco',
        reportsToLabel: 'Group CCO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['regional_merchandising_manager', 'merchandising_specialist', 'merchandiser'],
        isManagerial: true
    },
    head_of_it: {
        role: 'head_of_it',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 IT Director',
        reportsToRole: 'group_cto',
        reportsToLabel: 'Group CTO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['it_support'],
        isManagerial: true
    },
    head_of_audit: {
        role: 'head_of_audit',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Audit Director',
        reportsToRole: 'group_cae',
        reportsToLabel: 'Chief Audit Executive',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO / Audit Committee',
        managesRoles: ['auditor', 'store_operations_auditor'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 4: REGIONAL OPERATIONS & AREA MANAGERS
    // =========================================================================
    regional_operations_manager: {
        role: 'regional_operations_manager',
        level: 4,
        levelCategory: 'director',
        levelTag: 'L4 Regional Operations',
        reportsToRole: 'country_operations_director',
        reportsToLabel: 'Country Operations Director',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Executive Oversight)',
        managesRoles: [
            'area_operations_manager', 'store_manager',
            'regional_procurement_manager', 'regional_finance_manager',
            'regional_merchandising_manager', 'regional_hr_manager', 'regional_security_manager'
        ],
        isManagerial: true
    },
    area_operations_manager: {
        role: 'area_operations_manager',
        level: 4,
        levelCategory: 'director',
        levelTag: 'L4 Area Operations',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager (Regional Territory Command)',
        dottedLineRole: 'country_operations_director',
        dottedLineLabel: 'Country Operations Director (National Retail Standards)',
        managesRoles: ['store_manager'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 5: REGIONAL DEPARTMENT MANAGERS
    // =========================================================================
    regional_supply_chain_manager: {
        role: 'regional_supply_chain_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Supply Chain',
        reportsToRole: 'country_supply_chain_director',
        reportsToLabel: 'Country Supply Chain Director (National Supply Chain Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Fulfillment Alignment)',
        managesRoles: ['warehouse_manager', 'transport_fleet_manager', 'logistics_manager'],
        isManagerial: true
    },
    regional_merchandising_manager: {
        role: 'regional_merchandising_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Merchandising',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director (National Commercial Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['merchandising_specialist'],
        isManagerial: true
    },
    regional_procurement_manager: {
        role: 'regional_procurement_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Procurement',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director (National Commercial Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['buyer', 'vendor_relations_manager'],
        isManagerial: true
    },
    regional_finance_manager: {
        role: 'regional_finance_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Finance',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director (National Finance Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['accountant', 'treasury_officer'],
        isManagerial: true
    },
    regional_hr_manager: {
        role: 'regional_hr_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional HR',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director (National HR Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    regional_logistics_manager: {
        role: 'regional_logistics_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Logistics',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager (Regional Logistics Execution)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['logistics_manager', 'dispatch_manager'],
        isManagerial: true
    },
    regional_security_manager: {
        role: 'regional_security_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Security',
        reportsToRole: 'country_compliance_manager',
        reportsToLabel: 'Country Compliance Manager (National Risk & Compliance)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['security_manager', 'loss_prevention'],
        isManagerial: true
    }
};

