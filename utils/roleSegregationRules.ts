import { UserRole } from '../types';

/**
 * AUTOMATIC ROLE SEGREGATION SYSTEM RULES
 * 
 * Defines which site type each role should be assigned to.
 */

export interface RoleSegregationRule {
    role: UserRole;
    siteType: 'Administration' | 'Warehouse' | 'Store' | 'Any';
    department?: string;
    description: string;
}

/**
 * Complete role segregation rules
 * Defines which site type each role should be assigned to
 */
export const ROLE_SEGREGATION_RULES: RoleSegregationRule[] = [
    // ========================================
    // HQ ROLES - Must be at SIIFMART HQ
    // ========================================
    { role: 'group_ceo', siteType: 'Administration', department: 'Management', description: 'Group CEO - Multinational enterprise leadership at Global HQ' },
    { role: 'group_coo', siteType: 'Administration', department: 'Management', description: 'Group COO - Global operational leadership at Global HQ' },
    { role: 'group_cfo', siteType: 'Administration', department: 'Finance', description: 'Group CFO - Global financial strategy and fiscal governance at Global HQ' },
    { role: 'super_admin', siteType: 'Administration', department: 'Management', description: 'CEO - Executive leadership at headquarters' },
    { role: 'country_managing_director', siteType: 'Administration', department: 'Management', description: 'Country Managing Director - National executive leadership at Country HQ' },
    { role: 'admin', siteType: 'Administration', department: 'Management', description: 'Country Managing Director - National executive leadership at Country HQ' },
    { role: 'head_of_operations', siteType: 'Any', department: 'Management', description: 'Head of Operations - Deploys across all facility types' },
    { role: 'head_of_finance', siteType: 'Administration', department: 'Finance', description: 'Head of Finance - Financial strategy and fiscal governance at HQ' },
    { role: 'head_of_hr', siteType: 'Administration', department: 'Human Resources', description: 'Head of Human Resources - People operations and workforce governance at HQ' },
    { role: 'hr', siteType: 'Administration', department: 'Human Resources', description: 'Head of Human Resources - Workforce management at HQ' },
    { role: 'head_of_procurement', siteType: 'Administration', department: 'Procurement', description: 'Head of Procurement - Enterprise strategic sourcing and supplier contracts at HQ' },
    { role: 'head_of_supply_chain', siteType: 'Administration', department: 'Management', description: 'Head of Supply Chain - Enterprise fulfillment networks at HQ' },
    { role: 'head_of_merchandising', siteType: 'Administration', department: 'Management', description: 'Head of Merchandising - Corporate pricing, margins & planograms at HQ' },
    { role: 'merchandising_specialist', siteType: 'Administration', department: 'Merchandising', description: 'Merchandising Specialist - Country or regional product and campaign preparation' },
    { role: 'head_of_it', siteType: 'Administration', department: 'Management', description: 'Head of IT - Enterprise systems and security at HQ' },
    { role: 'head_of_audit', siteType: 'Administration', department: 'Management', description: 'Head of Internal Audit - Compliance, risk, and fraud governance at HQ' },
    {
        role: 'accountant',
        siteType: 'Administration',
        department: 'Finance',
        description: 'Accountant - Financial tracking'
    },
    {
        role: 'treasury_officer',
        siteType: 'Administration',
        department: 'Finance',
        description: 'Treasury Officer - Daily cash and mobile money tender reconciliation'
    },
    {
        role: 'tax_compliance_officer',
        siteType: 'Administration',
        department: 'Finance',
        description: 'Tax Compliance Officer - Sovereign VAT and withholding tax filings'
    },
    {
        role: 'credit_control_officer',
        siteType: 'Administration',
        department: 'Finance',
        description: 'Credit Control Officer - B2B credit terms and institutional accounts'
    },
    {
        role: 'cs_manager',
        siteType: 'Administration',
        department: 'Management',
        description: 'Customer Service Manager - CS operations at HQ'
    },
    {
        role: 'auditor',
        siteType: 'Administration',
        department: 'Management',
        description: 'Auditor - Compliance and auditing at HQ'
    },
    {
        role: 'it_support',
        siteType: 'Administration',
        department: 'Management',
        description: 'IT Support - Technical support'
    },
    {
        role: 'data_analyst',
        siteType: 'Administration',
        department: 'Management',
        description: 'Data Analyst - Business intelligence'
    },
    {
        role: 'training_coordinator',
        siteType: 'Administration',
        department: 'Human Resources',
        description: 'Training Coordinator - Staff onboarding'
    },
    {
        role: 'payroll_specialist',
        siteType: 'Administration',
        department: 'Human Resources',
        description: 'Payroll Specialist - Compensation & Payroll Runs'
    },
    {
        role: 'talent_recruiter',
        siteType: 'Administration',
        department: 'Human Resources',
        description: 'Talent Recruiter - Candidate Sourcing & Hiring'
    },
    {
        role: 'hr_generalist',
        siteType: 'Administration',
        department: 'Human Resources',
        description: 'HR Generalist - Employee case preparation and people operations'
    },

    // ========================================
    // WAREHOUSE ROLES - Must be at Warehouse/DC
    // ========================================
    {
        role: 'warehouse_manager',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Warehouse Manager - Oversees warehouse operations'
    },
    {
        role: 'dispatch_manager',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Dispatch Manager - Oversees dispatch operations'
    },
    {
        role: 'dispatcher',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Dispatcher - Coordinates warehouse logistics'
    },
    {
        role: 'picker',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Picker - Order fulfillment at warehouse'
    },
    {
        role: 'packer',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Packer - Order packing at warehouse'
    },
    {
        role: 'receiver',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Receiver - Inbound shipment receiving'
    },
    {
        role: 'forklift_operator',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Forklift Operator - Heavy stock movement'
    },
    {
        role: 'driver',
        siteType: 'Warehouse',
        department: 'Transport',
        description: 'Driver - Delivery operations from warehouse'
    },

    // ========================================
    // RETAIL ROLES - Must be at Store
    // ========================================
    {
        role: 'store_manager',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Store Manager - Overall store leadership'
    },
    {
        role: 'store_supervisor',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Store Supervisor - Floor management at retail store'
    },
    {
        role: 'assistant_manager',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Assistant Manager - Store operations'
    },
    {
        role: 'shift_lead',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Shift Lead - Shift supervision'
    },
    {
        role: 'pos',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Legacy Cashier - Point of sale'
    },
    {
        role: 'cashier',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Cashier - Point of sale operations'
    },
    {
        role: 'sales_associate',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Sales Associate - Customer floor assistance'
    },
    {
        role: 'stock_clerk',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Stock Clerk - Shelf replenishment'
    },
    {
        role: 'customer_service',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Customer Service - Returns and assistance'
    },
    {
        role: 'inventory_specialist',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Inventory Specialist - Stock control'
    },
    {
        role: 'merchandiser',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Merchandiser - Display arrangement'
    },
    {
        role: 'loss_prevention',
        siteType: 'Store',
        department: 'Security',
        description: 'Loss Prevention - Store security'
    },
    {
        role: 'returns_clerk',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Returns Clerk - Product returns'
    },

    // ========================================
    // FLEXIBLE & REGIONAL ROLES - Can be at any location
    // ========================================
    {
        role: 'regional_operations_manager',
        siteType: 'Any',
        department: 'Management',
        description: 'Regional Operations Manager - Oversees multiple locations'
    },
    {
        role: 'regional_procurement_manager',
        siteType: 'Any',
        department: 'Procurement',
        description: 'Regional Procurement Manager - Territorial sourcing & local farm/port vendor POs'
    },
    {
        role: 'regional_merchandising_manager',
        siteType: 'Administration',
        department: 'Merchandising',
        description: 'Regional Merchandising Manager - Territory pricing, promotions, and planogram approvals'
    },
    {
        role: 'regional_finance_manager',
        siteType: 'Any',
        department: 'Finance',
        description: 'Regional Finance Manager - Branch cash drop audits and regional reconciliations'
    },
    {
        role: 'regional_hr_manager',
        siteType: 'Any',
        department: 'Human Resources',
        description: 'Regional HR Manager - Territorial branch hiring and shift rosters'
    },
    {
        role: 'regional_logistics_manager',
        siteType: 'Any',
        department: 'Transport',
        description: 'Regional Logistics Manager - Territorial fleet coordination & inter-store transit'
    },
    {
        role: 'regional_security_manager',
        siteType: 'Any',
        department: 'Security',
        description: 'Regional Security Manager - Loss prevention & supervisory audit investigations'
    },
    {
        role: 'logistics_manager',
        siteType: 'Any',
        department: 'Transport',
        description: 'Logistics Manager - Oversees transport and fleet'
    },
    {
        role: 'inventory_manager',
        siteType: 'Any',
        department: 'Logistics & Warehouse',
        description: 'Inventory Manager - Stock audit and accuracy control'
    },
    {
        role: 'security_manager',
        siteType: 'Any',
        department: 'Security',
        description: 'Security & LP Manager - Shrinkage and compliance audit'
    },
    {
        role: 'buyer',
        siteType: 'Administration',
        department: 'Procurement',
        description: 'Sourcing Buyer - Supplier purchase orders'
    },
    {
        role: 'demand_planner',
        siteType: 'Administration',
        department: 'Logistics & Warehouse',
        description: 'Demand Planner - Stock allocation forecasting'
    },
    {
        role: 'vendor_relations_manager',
        siteType: 'Administration',
        department: 'Procurement',
        description: 'Vendor Relations Manager - Supplier onboarding, scorecards & cooperatives'
    },
    {
        role: 'customs_import_specialist',
        siteType: 'Administration',
        department: 'Procurement',
        description: 'Customs & Import Specialist - Freight, LC & port clearances'
    },
    {
        role: 'inbound_qc_inspector',
        siteType: 'Warehouse',
        department: 'Logistics & Warehouse',
        description: 'Inbound QC Inspector - Food safety, cold-chain & dock QC compliance'
    },
    {
        role: 'replenishment_planner',
        siteType: 'Any',
        department: 'Logistics & Warehouse',
        description: 'Replenishment Planner - Store shelf velocity and automated RDC transfers'
    },
    {
        role: 'fleet_maintenance_supervisor',
        siteType: 'Warehouse',
        department: 'Transport',
        description: 'Fleet Maintenance Supervisor - Vehicle inspections, fuel cards, driver logs, transport maintenance'
    },
    {
        role: 'store_operations_auditor',
        siteType: 'Any',
        department: 'Management',
        description: 'Store Operations Auditor - Unannounced store walkthroughs, planogram/merchandising checks, and cash handling spot audits'
    }
];
