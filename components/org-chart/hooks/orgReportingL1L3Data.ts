import { RoleReportingMeta } from './orgReportingTypes';
import { L6_L8_REPORTING_REGISTRY } from './orgReportingL6L8Data';

// Hierarchy Levels 1 through 5: Executive Leadership, Directorates, Regional Leadership
const L1_L5_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
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
        managesRoles: ['country_managing_director', 'admin', 'head_of_operations', 'regional_operations_manager', 'head_of_supply_chain'],
        isManagerial: true
    },
    group_cfo: {
        role: 'group_cfo',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['head_of_finance', 'regional_finance_manager', 'auditor', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'payroll_specialist'],
        isManagerial: true
    },
    group_cco: {
        role: 'group_cco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['head_of_procurement', 'head_of_merchandising', 'regional_procurement_manager', 'regional_merchandising_manager', 'buyer', 'merchandising_specialist', 'vendor_relations_manager'],
        isManagerial: true
    },
    group_csco: {
        role: 'group_csco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['head_of_supply_chain', 'regional_logistics_manager', 'warehouse_manager', 'logistics_manager', 'dispatch_manager', 'demand_planner', 'replenishment_planner', 'fleet_maintenance_supervisor'],
        isManagerial: true
    },
    group_chro: {
        role: 'group_chro',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['head_of_hr', 'regional_hr_manager', 'hr', 'hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    group_cto: {
        role: 'group_cto',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['head_of_it', 'it_support'],
        isManagerial: true
    },
    group_cio: {
        role: 'group_cio',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['head_of_it', 'it_support', 'data_analyst'],
        isManagerial: true
    },
    group_clco: {
        role: 'group_clco',
        level: 1,
        levelCategory: 'executive',
        levelTag: 'L1 Global Executive',
        reportsToRole: 'group_ceo',
        reportsToLabel: 'Group CEO',
        managesRoles: ['tax_compliance_officer', 'customs_import_specialist', 'auditor'],
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
        managesRoles: ['head_of_audit', 'auditor', 'store_operations_auditor', 'loss_prevention'],
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
        managesRoles: ['regional_operations_manager', 'head_of_finance', 'head_of_operations'],
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
        managesRoles: ['regional_operations_manager', 'head_of_finance', 'head_of_operations'],
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
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance (Corporate Finance Directorate)',
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
    }
};

export const L1_L3_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    ...L1_L5_REPORTING_REGISTRY,
    ...L6_L8_REPORTING_REGISTRY
};
