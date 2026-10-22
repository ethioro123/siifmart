import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Levels 3, 4 & 5: Corporate Directorate Heads, Regional & Area Leadership
export const L3_L5_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
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
            'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager',
            'regional_merchandising_manager', 'regional_hr_manager', 'regional_security_manager',
            'regional_it_manager', 'regional_compliance_manager'
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
    },
    regional_it_manager: {
        role: 'regional_it_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional IT',
        reportsToRole: 'country_technology_director',
        reportsToLabel: 'Country Technology Director (National Technology Directorate)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['it_support'],
        isManagerial: true
    },
    regional_compliance_manager: {
        role: 'regional_compliance_manager',
        level: 5,
        levelCategory: 'director',
        levelTag: 'L5 Regional Compliance',
        reportsToRole: 'country_compliance_manager',
        reportsToLabel: 'Country Compliance Manager (National Quality & Compliance)',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Territory Administration)',
        managesRoles: ['auditor', 'store_operations_auditor', 'loss_prevention'],
        isManagerial: true
    }
};
