import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Level 9: Corporate, Audit & Planning Specialists
export const L9_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    dispatcher: {
        role: 'dispatcher',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Dispatch Specialist',
        reportsToRole: 'dispatch_supervisor',
        reportsToLabel: 'Dispatch Manager',
        managesRoles: [],
        isManagerial: false
    },
    store_operations_auditor: {
        role: 'store_operations_auditor',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Field Auditor',
        reportsToRole: 'country_operations_director',
        reportsToLabel: 'Country Operations Director',
        dottedLineRole: 'group_ceo',
        dottedLineLabel: 'CEO (Direct HQ Oversight)',
        managesRoles: [],
        isManagerial: false
    },
    demand_planner: {
        role: 'demand_planner',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Forecasting Specialist',
        reportsToRole: 'country_supply_chain_director',
        reportsToLabel: 'Country Supply Chain Director',
        managesRoles: [],
        isManagerial: false
    },
    replenishment_planner: {
        role: 'replenishment_planner',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Replenishment Specialist',
        reportsToRole: 'country_supply_chain_director',
        reportsToLabel: 'Country Supply Chain Director',
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
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director',
        managesRoles: [],
        isManagerial: false
    },
    customs_import_specialist: {
        role: 'customs_import_specialist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Customs Specialist',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director',
        managesRoles: [],
        isManagerial: false
    },
    inbound_qc_inspector: {
        role: 'inbound_qc_inspector',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 QC Specialist',
        reportsToRole: 'country_commercial_director',
        reportsToLabel: 'Country Commercial Director',
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
        reportsToLabel: 'Regional Merchandising Manager / Country Commercial Director',
        managesRoles: [],
        isManagerial: false
    },
    auditor: {
        role: 'auditor',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Internal Auditor',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director',
        dottedLineRole: 'group_ceo',
        dottedLineLabel: 'CEO (Independent Fraud Hotline)',
        managesRoles: [],
        isManagerial: false
    },
    accountant: {
        role: 'accountant',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Corporate Accountant',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director',
        managesRoles: [],
        isManagerial: false
    },
    treasury_officer: {
        role: 'treasury_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Treasury Officer',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director',
        managesRoles: [],
        isManagerial: false
    },
    tax_compliance_officer: {
        role: 'tax_compliance_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Tax Officer',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director',
        managesRoles: [],
        isManagerial: false
    },
    credit_control_officer: {
        role: 'credit_control_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Credit Officer',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director',
        managesRoles: [],
        isManagerial: false
    },
    data_analyst: {
        role: 'data_analyst',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Analytics Specialist',
        reportsToRole: 'country_finance_director',
        reportsToLabel: 'Country Finance Director',
        managesRoles: [],
        isManagerial: false
    },
    hr: {
        role: 'hr',
        level: 3,
        levelCategory: 'director',
        levelTag: 'L3 HR Officer',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director',
        managesRoles: ['hr_generalist', 'training_coordinator', 'talent_recruiter', 'payroll_specialist'],
        isManagerial: true
    },
    talent_recruiter: {
        role: 'talent_recruiter',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Talent Recruiter',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director',
        managesRoles: [],
        isManagerial: false
    },
    hr_generalist: {
        role: 'hr_generalist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 HR Generalist',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director',
        managesRoles: [],
        isManagerial: false
    },
    training_coordinator: {
        role: 'training_coordinator',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Training Specialist',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director',
        managesRoles: [],
        isManagerial: false
    },
    payroll_specialist: {
        role: 'payroll_specialist',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Payroll Specialist',
        reportsToRole: 'country_hr_director',
        reportsToLabel: 'Country HR Director',
        dottedLineRole: 'country_finance_director',
        dottedLineLabel: 'Country Finance Director (Payroll Funds Dual-Control Release)',
        managesRoles: [],
        isManagerial: false
    },
    loss_prevention: {
        role: 'loss_prevention',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Asset Protection',
        reportsToRole: 'regional_security_manager',
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
        reportsToRole: 'group_ceo',
        reportsToLabel: 'CEO',
        dottedLineRole: 'country_operations_director',
        dottedLineLabel: 'Country Operations Director (POS Terminal Uptime)',
        managesRoles: [],
        isManagerial: false
    },
    cash_office_officer: {
        role: 'cash_office_officer',
        level: 9,
        levelCategory: 'specialist',
        levelTag: 'L9 Cash Office Control',
        reportsToRole: 'pos_supervisor',
        reportsToLabel: 'POS Supervisor (Front-of-House Lead)',
        dottedLineRole: 'regional_finance_manager',
        dottedLineLabel: 'Regional Finance Manager (Cash Auditing & Safe Reconciliation)',
        managesRoles: [],
        isManagerial: false
    }
};
