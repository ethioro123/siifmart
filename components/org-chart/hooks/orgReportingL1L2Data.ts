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
        managesRoles: ['group_coo', 'group_cfo', 'group_cco', 'group_csco', 'group_chro', 'group_cio', 'group_clco', 'group_cae', 'country_managing_director'],
        isManagerial: true
    },
    group_coo: {
        role: 'group_coo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_managing_director', 'country_operations_director'],
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
        managesRoles: ['group_cmo', 'country_commercial_director', 'regional_procurement_manager', 'regional_merchandising_manager', 'buyer', 'merchandising_specialist', 'vendor_relations_manager'],
        isManagerial: true
    },
    group_cmo: {
        role: 'group_cmo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['regional_merchandising_manager', 'merchandising_specialist'],
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
        reportsToRole: 'group_cio',
        reportsToLabel: 'Group CIO',
        managesRoles: [],
        isManagerial: true
    },
    group_cio: {
        role: 'group_cio',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['group_cto', 'country_technology_director'],
        isManagerial: true
    },
    group_clco: {
        role: 'group_clco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['country_compliance_manager', 'tax_compliance_officer', 'customs_import_specialist'],
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
        managesRoles: ['auditor', 'store_operations_auditor'],
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
    }
};
