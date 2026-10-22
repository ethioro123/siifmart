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
    { role: 'group_cco', siteType: 'Administration', department: 'Procurement', description: 'Group CCO - Global procurement, category strategy, and supplier relationships at Global HQ' },
    { role: 'group_csco', siteType: 'Administration', department: 'Management', description: 'Group CSCO - Global fulfillment networks, logistics, and supply chain governance at Global HQ' },
    { role: 'group_chro', siteType: 'Administration', department: 'Human Resources', description: 'Group CHRO - Global people strategy, executive talent, and workforce governance at Global HQ' },
    { role: 'group_cto', siteType: 'Administration', department: 'Management', description: 'Group CTO - Global engineering architecture, infrastructure, and core platforms at Global HQ' },
    { role: 'group_cio', siteType: 'Administration', department: 'Management', description: 'Group CIO - Enterprise business systems, IT operations, and information governance at Global HQ' },
    { role: 'group_clco', siteType: 'Administration', department: 'Management', description: 'Group CLCO - Global legal affairs, regulatory compliance, and risk governance at Global HQ' },
    { role: 'group_cae', siteType: 'Administration', department: 'Management', description: 'Chief Audit Executive - Independent enterprise audit and zero-trust assurance at Global HQ' },
    { role: 'country_managing_director', siteType: 'Administration', department: 'Management', description: 'Country Managing Director - National executive leadership at Country HQ' },
    { role: 'country_operations_director', siteType: 'Any', department: 'Operations', description: 'Country Operations Director - Retail and store network operational execution' },
    { role: 'country_finance_director', siteType: 'Administration', department: 'Finance', description: 'Country Finance Director - National fiscal governance and tax' },
    { role: 'country_commercial_director', siteType: 'Administration', department: 'Procurement', description: 'Country Commercial Director - Local sourcing and merchandising' },
    { role: 'country_supply_chain_director', siteType: 'Administration', department: 'Management', description: 'Country Supply Chain Director - Enterprise fulfillment networks at HQ' },
    { role: 'country_hr_director', siteType: 'Administration', department: 'Human Resources', description: 'Country HR Director - National workforce and payroll governance' },
    { role: 'country_technology_director', siteType: 'Administration', department: 'Information Technology', description: 'Country Technology Director - National IT and systems continuity' },
    { role: 'country_compliance_manager', siteType: 'Administration', department: 'Legal & Compliance', description: 'Country Compliance Manager - Statutory and risk governance' },
    { role: 'merchandising_specialist', siteType: 'Administration', department: 'Merchandising', description: 'Merchandising Specialist - Country or regional product and campaign preparation' },
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
        role: 'dispatch_supervisor',
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
        role: 'shift_supervisor',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Store Supervisor - Floor management at retail store'
    },
    {
        role: 'assistant_store_manager',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Assistant Manager - Store operations'
    },
    {
        role: 'shift_supervisor',
        siteType: 'Store',
        department: 'Retail Operations',
        description: 'Shift Lead - Shift supervision'
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
        role: 'area_operations_manager',
        siteType: 'Any',
        department: 'Management',
        description: 'Area Manager - Oversees store cluster and district retail performance'
    },
    {
        role: 'regional_supply_chain_manager',
        siteType: 'Any',
        department: 'Logistics',
        description: 'Regional Supply Chain Manager - Territorial distribution centers and fleet logistics'
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
        role: 'regional_supply_chain_manager',
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
        role: 'regional_security_manager',
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
