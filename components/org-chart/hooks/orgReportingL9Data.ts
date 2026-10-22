import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Level 9: Corporate, Audit & Planning Specialists
export const L9_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    dispatcher: {
        role: 'dispatcher',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Dispatch Specialist',
        reportsToRole: 'dispatch_manager',
        reportsToLabel: 'Dispatch Manager',
        managesRoles: [],
        isManagerial: false
    },
    store_operations_auditor: {
        role: 'store_operations_auditor',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Field Auditor',
        reportsToRole: 'head_of_operations',
        reportsToLabel: 'Head of Operations',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Direct HQ Oversight)',
        managesRoles: [],
        isManagerial: false
    },
    demand_planner: {
        role: 'demand_planner',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Forecasting Specialist',
        reportsToRole: 'head_of_supply_chain',
        reportsToLabel: 'Head of Supply Chain',
        managesRoles: [],
        isManagerial: false
    },
    replenishment_planner: {
        role: 'replenishment_planner',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Replenishment Specialist',
        reportsToRole: 'head_of_supply_chain',
        reportsToLabel: 'Head of Supply Chain',
        dottedLineRole: 'regional_operations_manager',
        dottedLineLabel: 'Regional Operations Manager (Store Stock Balances)',
        managesRoles: [],
        isManagerial: false
    },
    buyer: {
        role: 'buyer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Sourcing Specialist',
        reportsToRole: 'head_of_procurement',
        reportsToLabel: 'Head of Procurement',
        managesRoles: [],
        isManagerial: false
    },
    customs_import_specialist: {
        role: 'customs_import_specialist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Customs Specialist',
        reportsToRole: 'head_of_procurement',
        reportsToLabel: 'Head of Procurement',
        managesRoles: [],
        isManagerial: false
    },
    inbound_qc_inspector: {
        role: 'inbound_qc_inspector',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 QC Specialist',
        reportsToRole: 'head_of_procurement',
        reportsToLabel: 'Head of Procurement',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Inbound Dock Staging)',
        managesRoles: [],
        isManagerial: false
    },
    merchandising_specialist: {
        role: 'merchandising_specialist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Merchandising Specialist',
        reportsToRole: 'regional_merchandising_manager',
        reportsToLabel: 'Regional Merchandising Manager / Head of Merchandising',
        managesRoles: [],
        isManagerial: false
    },
    auditor: {
        role: 'auditor',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Internal Auditor',
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Independent Fraud Hotline)',
        managesRoles: [],
        isManagerial: false
    },
    accountant: {
        role: 'accountant',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Corporate Accountant',
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance',
        managesRoles: [],
        isManagerial: false
    },
    treasury_officer: {
        role: 'treasury_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Treasury Officer',
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance',
        managesRoles: [],
        isManagerial: false
    },
    tax_compliance_officer: {
        role: 'tax_compliance_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Tax Officer',
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance',
        managesRoles: [],
        isManagerial: false
    },
    credit_control_officer: {
        role: 'credit_control_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Credit Officer',
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance',
        managesRoles: [],
        isManagerial: false
    },
    data_analyst: {
        role: 'data_analyst',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Analytics Specialist',
        reportsToRole: 'head_of_finance',
        reportsToLabel: 'Head of Finance',
        managesRoles: [],
        isManagerial: false
    },
    hr: {
        role: 'hr',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 HR Officer',
        reportsToRole: 'head_of_hr',
        reportsToLabel: 'Head of Human Resources',
        managesRoles: ['hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    talent_recruiter: {
        role: 'talent_recruiter',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Talent Recruiter',
        reportsToRole: 'head_of_hr',
        reportsToLabel: 'Head of Human Resources',
        managesRoles: [],
        isManagerial: false
    },
    hr_generalist: {
        role: 'hr_generalist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 HR Generalist',
        reportsToRole: 'head_of_hr',
        reportsToLabel: 'Head of Human Resources',
        managesRoles: [],
        isManagerial: false
    },
    training_coordinator: {
        role: 'training_coordinator',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Training Specialist',
        reportsToRole: 'head_of_hr',
        reportsToLabel: 'Head of Human Resources',
        managesRoles: [],
        isManagerial: false
    },
    payroll_specialist: {
        role: 'payroll_specialist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Payroll Specialist',
        reportsToRole: 'head_of_hr',
        reportsToLabel: 'Head of Human Resources',
        dottedLineRole: 'head_of_finance',
        dottedLineLabel: 'Head of Finance (Payroll Funds Dual-Control Release)',
        managesRoles: [],
        isManagerial: false
    },
    loss_prevention: {
        role: 'loss_prevention',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Asset Protection',
        reportsToRole: 'security_manager',
        reportsToLabel: 'Security & LP Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Daily Physical Security)',
        managesRoles: [],
        isManagerial: false
    },
    it_support: {
        role: 'it_support',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Systems Specialist',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        dottedLineRole: 'head_of_operations',
        dottedLineLabel: 'Head of Operations (POS Terminal Uptime)',
        managesRoles: [],
        isManagerial: false
    }
};
