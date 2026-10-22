import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 3, 4 & 5: Corporate Directorate Heads, Regional & Area Leadership
export const L3_L5_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // =========================================================================
    // LEVEL 3: CORPORATE HQ DIRECTORATE HEADS
    // =========================================================================
    country_operations_director: {
        role: 'country_operations_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Operations Director',
        reportsToRole: 'group_coo',
        reportsToLabel: 'Group COO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Operational Oversight)',
        managesRoles: ['regional_operations_manager'],
        isManagerial: true
    },
    country_finance_director: {
        role: 'country_finance_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Finance Director',
        reportsToRole: 'group_cfo',
        reportsToLabel: 'Group CFO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['regional_finance_manager', 'accountant', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'],
        isManagerial: true
    },
    country_hr_director: {
        role: 'country_hr_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 HR Director',
        reportsToRole: 'group_chro',
        reportsToLabel: 'Group CHRO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    country_commercial_director: {
        role: 'country_commercial_director',
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
    country_supply_chain_director: {
        role: 'country_supply_chain_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Supply Chain Director',
        reportsToRole: 'group_csco',
        reportsToLabel: 'Group CSCO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['demand_planner', 'replenishment_planner', 'regional_supply_chain_manager', 'inventory_manager'],
        isManagerial: true
    },
    country_technology_director: {
        role: 'country_technology_director',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 IT Director',
        reportsToRole: 'group_cio',
        reportsToLabel: 'Group CIO',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['regional_it_manager', 'it_support', 'data_analyst'],
        isManagerial: true
    },
    country_compliance_manager: {
        role: 'country_compliance_manager',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 Country Compliance Manager',
        reportsToRole: 'group_clco',
        reportsToLabel: 'Group General Counsel & Compliance Officer',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Country Executive Coordination)',
        managesRoles: ['regional_compliance_manager', 'tax_compliance_officer', 'loss_prevention'],
        isManagerial: true
    },

    // =========================================================================
    // LEVEL 4: REGIONAL OPERATIONS MANAGER; LEVEL 5: AREA MANAGER
    // =========================================================================
    regional_operations_manager: {
        role: 'regional_operations_manager',
        level: 4,
        levelCategory: 'manager',
        levelTag: 'L4 Regional Operations Manager',
        reportsToRole: 'country_operations_director',
        reportsToLabel: 'Country Operations Director',
        dottedLineRole: 'country_managing_director',
        dottedLineLabel: 'Country Managing Director (Executive Oversight)',
        managesRoles: ['area_operations_manager'],
        isManagerial: true
    },
    area_operations_manager: {
        role: 'area_operations_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Area Manager',
        reportsToRole: 'regional_operations_manager',
        reportsToLabel: 'Regional Operations Manager',
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
        levelCategory: 'manager',
        levelTag: 'L5 Regional Supply Chain Manager',
        reportsToRole: 'country_supply_chain_director',
        reportsToLabel: 'Country Supply Chain Director (National Supply Chain Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Performance Alignment)',
        managesRoles: ['warehouse_manager', 'regional_logistics_manager', 'inventory_manager'],
        isManagerial: true
    },
    regional_merchandising_manager: {
        role: 'regional_merchandising_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional Merchandising',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director (National Commercial Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['merchandising_specialist'],
        isManagerial: true
    },
    regional_procurement_manager: {
        role: 'regional_procurement_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional Procurement',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director (National Commercial Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['buyer', 'vendor_relations_manager'],
        isManagerial: true
    },
    regional_finance_manager: {
        role: 'regional_finance_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional Finance',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director (National Finance Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['accountant', 'treasury_officer'],
        isManagerial: true
    },
    regional_hr_manager: {
        role: 'regional_hr_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional HR',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director (National HR Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['hr_generalist', 'talent_recruiter', 'training_coordinator', 'payroll_specialist'],
        isManagerial: true
    },
    regional_logistics_manager: {
        role: 'regional_logistics_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional Logistics',
        reportsToRole: 'regional_supply_chain_manager',
        reportsToLabel: 'Regional Supply Chain Manager (Regional Logistics Execution)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['dispatch_supervisor', 'fleet_maintenance_supervisor'],
        isManagerial: true
    },
    regional_security_manager: {
        role: 'regional_security_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional Security',
        reportsToRole: 'country_compliance_manager',
        reportsToLabel: 'Country Compliance Manager (National Risk & Compliance)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['loss_prevention'],
        isManagerial: true
    },
    regional_it_manager: {
        role: 'regional_it_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional IT',
        reportsToRole: 'country_technology_director',
        reportsToLabel: 'Country Technology Director (National Technology Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['it_support'],
        isManagerial: true
    },
    regional_compliance_manager: {
        role: 'regional_compliance_manager',
        level: 5,
        levelCategory: 'manager',
        levelTag: 'L5 Regional Compliance',
        reportsToRole: 'country_compliance_manager',
        reportsToLabel: 'Country Compliance Manager (National Quality & Compliance)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Regional Leadership)',
        managesRoles: ['auditor', 'store_operations_auditor', 'loss_prevention'],
        isManagerial: true
    }
};
