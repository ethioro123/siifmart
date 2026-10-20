import { RoleReportingMeta } from './orgReportingTypes';

// Hierarchy Level 4: Operational Specialists & Frontline Workforce
export const L4_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    // =========================================================================
    // LEVEL 4: OPERATIONAL SPECIALISTS & FRONTLINE WORKFORCE
    // =========================================================================
    cashier: {
        role: 'cashier',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 POS Specialist',
        reportsToRole: 'shift_lead',
        reportsToLabel: 'Shift Lead',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Finance Manager (Daily Drawer Reconciliations)',
        managesRoles: [],
        isManagerial: false
    },
    pos: {
        role: 'pos',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Register Staff',
        reportsToRole: 'shift_lead',
        reportsToLabel: 'Shift Lead',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Finance Manager (Till Auditing)',
        managesRoles: [],
        isManagerial: false
    },
    sales_associate: {
        role: 'sales_associate',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Retail Associate',
        reportsToRole: 'shift_lead',
        reportsToLabel: 'Shift Lead',
        managesRoles: [],
        isManagerial: false
    },
    stock_clerk: {
        role: 'stock_clerk',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Stock Specialist',
        reportsToRole: 'inventory_manager',
        reportsToLabel: 'Inventory Manager',
        managesRoles: [],
        isManagerial: false
    },
    merchandiser: {
        role: 'merchandiser',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Store Display Specialist',
        reportsToRole: 'store_supervisor',
        reportsToLabel: 'Store Supervisor',
        dottedLineRole: 'merchandising_manager',
        dottedLineLabel: 'Merchandising Manager (Planogram & Shelf Facing)',
        managesRoles: [],
        isManagerial: false
    },
    merchandising_specialist: {
        role: 'merchandising_specialist',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Merchandising Specialist',
        reportsToRole: 'regional_merchandising_lead',
        reportsToLabel: 'Regional Merchandising Lead / Head of Merchandising',
        managesRoles: [],
        isManagerial: false
    },
    returns_clerk: {
        role: 'returns_clerk',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Returns Specialist',
        reportsToRole: 'store_manager',
        reportsToLabel: 'Store Manager',
        dottedLineRole: 'cs_manager',
        dottedLineLabel: 'Customer Service (RMA Escalations)',
        managesRoles: [],
        isManagerial: false
    },
    customer_service: {
        role: 'customer_service',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Support Specialist',
        reportsToRole: 'cs_manager',
        reportsToLabel: 'CS Manager',
        managesRoles: [],
        isManagerial: false
    },
    receiver: {
        role: 'receiver',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Inbound Specialist',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager',
        dottedLineRole: 'procurement_manager',
        dottedLineLabel: 'Procurement QC (PO Variance Handshake)',
        managesRoles: [],
        isManagerial: false
    },
    picker: {
        role: 'picker',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Fulfillment Specialist',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager',
        managesRoles: [],
        isManagerial: false
    },
    packer: {
        role: 'packer',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Outbound Specialist',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager',
        managesRoles: [],
        isManagerial: false
    },
    forklift_operator: {
        role: 'forklift_operator',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Equipment Operator',
        reportsToRole: 'warehouse_manager',
        reportsToLabel: 'Warehouse Manager',
        managesRoles: [],
        isManagerial: false
    },
    driver: {
        role: 'driver',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Transport Driver',
        reportsToRole: 'dispatch_manager',
        reportsToLabel: 'Dispatch Manager',
        dottedLineRole: 'fleet_maintenance_supervisor',
        dottedLineLabel: 'Fleet Maint. Supervisor (Pre-Trip Inspection)',
        managesRoles: [],
        isManagerial: false
    },
    dispatcher: {
        role: 'dispatcher',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Dispatch Specialist',
        reportsToRole: 'dispatch_manager',
        reportsToLabel: 'Dispatch Manager',
        managesRoles: [],
        isManagerial: false
    },
    inventory_specialist: {
        role: 'inventory_specialist',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Audit Specialist',
        reportsToRole: 'inventory_manager',
        reportsToLabel: 'Inventory Manager',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Senior Auditor (Blind Cycle Count Verifications)',
        managesRoles: [],
        isManagerial: false
    },
    store_operations_auditor: {
        role: 'store_operations_auditor',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Field Auditor',
        reportsToRole: 'operations_manager',
        reportsToLabel: 'Operations Manager',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Direct HQ Oversight)',
        managesRoles: [],
        isManagerial: false
    },
    demand_planner: {
        role: 'demand_planner',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Forecasting Specialist',
        reportsToRole: 'supply_chain_manager',
        reportsToLabel: 'Supply Chain Manager',
        managesRoles: [],
        isManagerial: false
    },
    replenishment_planner: {
        role: 'replenishment_planner',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Replenishment Specialist',
        reportsToRole: 'supply_chain_manager',
        reportsToLabel: 'Supply Chain Manager',
        dottedLineRole: 'regional_manager',
        dottedLineLabel: 'Regional Manager (Store Stock Balances)',
        managesRoles: [],
        isManagerial: false
    },
    buyer: {
        role: 'buyer',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Sourcing Specialist',
        reportsToRole: 'procurement_manager',
        reportsToLabel: 'Procurement Manager',
        managesRoles: [],
        isManagerial: false
    },
    vendor_relations_manager: {
        role: 'vendor_relations_manager',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Vendor Specialist',
        reportsToRole: 'procurement_manager',
        reportsToLabel: 'Procurement Manager',
        managesRoles: [],
        isManagerial: false
    },
    customs_import_specialist: {
        role: 'customs_import_specialist',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Customs Specialist',
        reportsToRole: 'procurement_manager',
        reportsToLabel: 'Procurement Manager',
        managesRoles: [],
        isManagerial: false
    },
    inbound_qc_inspector: {
        role: 'inbound_qc_inspector',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 QC Specialist',
        reportsToRole: 'procurement_manager',
        reportsToLabel: 'Procurement Manager',
        dottedLineRole: 'warehouse_manager',
        dottedLineLabel: 'Warehouse Manager (Inbound Dock Staging)',
        managesRoles: [],
        isManagerial: false
    },
    auditor: {
        role: 'auditor',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Internal Auditor',
        reportsToRole: 'finance_manager',
        reportsToLabel: 'Finance Manager',
        dottedLineRole: 'super_admin',
        dottedLineLabel: 'CEO (Independent Fraud Hotline)',
        managesRoles: [],
        isManagerial: false
    },
    accountant: {
        role: 'accountant',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Corporate Accountant',
        reportsToRole: 'finance_manager',
        reportsToLabel: 'Finance Manager',
        managesRoles: [],
        isManagerial: false
    },
    treasury_officer: {
        role: 'treasury_officer',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Treasury Officer',
        reportsToRole: 'finance_manager',
        reportsToLabel: 'Finance Manager',
        managesRoles: [],
        isManagerial: false
    },
    tax_compliance_officer: {
        role: 'tax_compliance_officer',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Tax Officer',
        reportsToRole: 'finance_manager',
        reportsToLabel: 'Finance Manager',
        managesRoles: [],
        isManagerial: false
    },
    credit_control_officer: {
        role: 'credit_control_officer',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Credit Officer',
        reportsToRole: 'finance_manager',
        reportsToLabel: 'Finance Manager',
        managesRoles: [],
        isManagerial: false
    },
    data_analyst: {
        role: 'data_analyst',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Analytics Specialist',
        reportsToRole: 'finance_manager',
        reportsToLabel: 'Finance Manager',
        managesRoles: [],
        isManagerial: false
    },
    hr: {
        role: 'hr',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 HR Specialist',
        reportsToRole: 'hr_manager',
        reportsToLabel: 'HR Manager',
        managesRoles: [],
        isManagerial: false
    },
    talent_recruiter: {
        role: 'talent_recruiter',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Talent Recruiter',
        reportsToRole: 'hr_manager',
        reportsToLabel: 'HR Manager',
        managesRoles: [],
        isManagerial: false
    },
    hr_generalist: {
        role: 'hr_generalist',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 HR Generalist',
        reportsToRole: 'hr_manager',
        reportsToLabel: 'HR Manager',
        managesRoles: [],
        isManagerial: false
    },
    training_coordinator: {
        role: 'training_coordinator',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Training Specialist',
        reportsToRole: 'hr_manager',
        reportsToLabel: 'HR Manager',
        managesRoles: [],
        isManagerial: false
    },
    payroll_specialist: {
        role: 'payroll_specialist',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Payroll Specialist',
        reportsToRole: 'hr_manager',
        reportsToLabel: 'HR Manager',
        dottedLineRole: 'finance_manager',
        dottedLineLabel: 'Finance Manager (Payroll Funds Dual-Control Release)',
        managesRoles: [],
        isManagerial: false
    },
    loss_prevention: {
        role: 'loss_prevention',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Asset Protection',
        reportsToRole: 'security_manager',
        reportsToLabel: 'Security & LP Manager',
        dottedLineRole: 'store_manager',
        dottedLineLabel: 'Store Manager (Daily Physical Security)',
        managesRoles: [],
        isManagerial: false
    },
    it_support: {
        role: 'it_support',
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Systems Specialist',
        reportsToRole: 'super_admin',
        reportsToLabel: 'CEO',
        dottedLineRole: 'operations_manager',
        dottedLineLabel: 'Operations Manager (POS Terminal Uptime)',
        managesRoles: [],
        isManagerial: false
    }
};
