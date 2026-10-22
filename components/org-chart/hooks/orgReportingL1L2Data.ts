import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 1 & 2: Global Executive Board & Country Leadership
export const L1_L2_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
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
        managesRoles: ['group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae', 'group_cmo', 'country_managing_director', 'country_operations_director'],
        isManagerial: true
    },
    group_coo: {
        role: 'group_coo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_managing_director', 'country_operations_director', 'country_supply_chain_director'],
        isManagerial: true
    },
    group_cfo: {
        role: 'group_cfo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_finance_director', 'regional_finance_manager', 'auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'payroll_specialist'],
        isManagerial: true
    },
    group_cco: {
        role: 'group_cco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_commercial_director', 'regional_procurement_manager', 'regional_merchandising_manager', 'buyer', 'merchandising_specialist', 'vendor_relations_manager'],
        isManagerial: true
    },
    group_cmo: {
        role: 'group_cmo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_commercial_director', 'regional_merchandising_manager', 'merchandising_specialist'],
        isManagerial: true
    },
    group_csco: {
        role: 'group_csco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_supply_chain_director', 'regional_logistics_manager', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'demand_planner', 'replenishment_planner', 'fleet_maintenance_supervisor'],
        isManagerial: true
    },
    group_chro: {
        role: 'group_chro',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_hr_director', 'regional_hr_manager', 'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    group_cto: {
        role: 'group_cto',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_technology_director', 'it_support'],
        isManagerial: true
    },
    group_cio: {
        role: 'group_cio',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_technology_director', 'it_support', 'data_analyst'],
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
        managesRoles: ['country_compliance_manager', 'auditor', 'store_operations_auditor', 'loss_prevention'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 2: COUNTRY EXECUTIVE LEADERSHIP
    // =========================================================================
    country_managing_director: {
        role: 'country_managing_director',
        level: 2,
        levelCategory: 'executive',
        levelTag: 'L2 Country Executive',
        reportsToRole: 'group_coo',
        reportsToLabel: 'Group COO',
        dottedLineRole: 'group_ceo',
        dottedLineLabel: 'Group CEO (Executive Oversight)',
        managesRoles: ['country_operations_director', 'country_finance_director', 'country_commercial_director', 'country_supply_chain_director', 'country_hr_director', 'country_technology_director', 'country_compliance_manager'],
        isManagerial: true
    },
    country_operations_director: {
        role: 'country_operations_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Operations Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_coo',
        dottedLineLabel: 'Group COO (Functional Oversight)',
        managesRoles: ['regional_operations_manager'],
        isManagerial: true
    },
    country_finance_director: {
        role: 'country_finance_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Finance Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cfo',
        dottedLineLabel: 'Group CFO (Functional Oversight)',
        managesRoles: ['regional_finance_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    country_commercial_director: {
        role: 'country_commercial_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Commercial Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cco',
        dottedLineLabel: 'Group CCO (Functional Oversight)',
        managesRoles: ['regional_procurement_manager', 'regional_merchandising_manager', 'buyer', 'merchandising_specialist', 'vendor_relations_manager'],
        isManagerial: true
    },
    country_supply_chain_director: {
        role: 'country_supply_chain_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Supply Chain Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_csco',
        dottedLineLabel: 'Group CSCO (Functional Oversight)',
        managesRoles: ['regional_logistics_manager', 'warehouse_manager', 'regional_supply_chain_manager', 'dispatch_supervisor', 'demand_planner', 'replenishment_planner', 'fleet_maintenance_supervisor'],
        isManagerial: true
    },
    country_hr_director: {
        role: 'country_hr_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country HR Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_chro',
        dottedLineLabel: 'Group CHRO (Functional Oversight)',
        managesRoles: ['regional_hr_manager', 'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    country_technology_director: {
        role: 'country_technology_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Technology Director',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cto',
        dottedLineLabel: 'Group CTO / CIO (Functional Oversight)',
        managesRoles: ['regional_it_manager', 'it_support', 'data_analyst'],
        isManagerial: true
    },
    country_compliance_manager: {
        role: 'country_compliance_manager',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Compliance Manager',
        reportsToRole: 'country_managing_director',
        reportsToLabel: 'Country Managing Director',
        dottedLineRole: 'group_cae',
        dottedLineLabel: 'Chief Audit Executive / Group CLCO (Functional Oversight)',
        managesRoles: ['regional_compliance_manager', 'auditor', 'store_operations_auditor', 'tax_compliance_officer', 'loss_prevention'],
        isManagerial: true
    }
};
