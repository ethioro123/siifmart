import { UserRole } from '../types';

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const displayNames: Partial<Record<UserRole, string>> = {
        // Level 1 - Executive
        super_admin: 'Chief Executive Officer',
        CEO: 'Chief Executive Officer',
        ceo: 'Chief Executive Officer',
        country_managing_director: 'Country Managing Director',
        admin: 'Country Managing Director',

        // Level 2 - Corporate & Regional Directors
        head_of_operations: 'Head of Operations',
        operations_head: 'Head of Operations',
        operations_manager: 'Head of Operations',
        regional_manager: 'Regional Operations Director',
        head_of_finance: 'Head of Finance',
        finance_head: 'Head of Finance',
        finance_manager: 'Head of Finance',
        head_of_hr: 'Head of Human Resources',
        hr_head: 'Head of Human Resources',
        hr_manager: 'Head of Human Resources',
        head_of_procurement: 'Head of Procurement',
        procurement_head: 'Head of Procurement',
        procurement_manager: 'Head of Procurement',
        head_of_supply_chain: 'Head of Supply Chain',
        supply_chain_head: 'Head of Supply Chain',
        supply_chain_manager: 'Head of Supply Chain',
        head_of_merchandising: 'Head of Merchandising',
        merchandising_head: 'Head of Merchandising',
        merchandising_manager: 'Head of Merchandising',
        merchandising_specialist: 'Merchandising Specialist',
        regional_merchandising_lead: 'Regional Merchandising Lead',
        head_of_it: 'Head of IT',
        it_head: 'Head of IT',
        head_of_audit: 'Head of Internal Audit',
        audit_head: 'Head of Internal Audit',
        regional_procurement_lead: 'Regional Procurement Manager',
        regional_finance_officer: 'Regional Finance Manager',
        regional_hr_officer: 'Regional Human Resources Manager',
        regional_logistics_lead: 'Regional Logistics Manager',
        regional_security_supervisor: 'Regional Security and Loss Prevention Manager',

        // Level 3 - Site Managers & Supervisors
        store_manager: 'Store Manager',
        warehouse_manager: 'Warehouse Manager',
        logistics_manager: 'Site Logistics Manager',
        inventory_manager: 'Inventory Control Manager',
        security_manager: 'Loss Prevention and Security Manager',
        dispatch_manager: 'Dispatch Operations Manager',
        assistant_manager: 'Assistant Store Manager',
        vendor_relations_manager: 'Vendor Relations Manager',
        fleet_maintenance_supervisor: 'Fleet Maintenance Supervisor',
        shift_lead: 'Shift Operations Supervisor',

        // Level 4 - Staff & Specialists
        cashier: 'Retail Cashier',
        sales_associate: 'Customer Sales Associate',
        stock_clerk: 'Store Inventory Clerk',
        picker: 'Warehouse Order Picker',
        packer: 'Warehouse Order Packer',
        receiver: 'Inbound Receiving Specialist',
        driver: 'Logistics Fleet Driver',
        forklift_operator: 'Heavy Equipment and Forklift Operator',
        inventory_specialist: 'Inventory Cycle Counter',
        customer_service: 'Customer Service Representative',
        auditor: 'Internal Financial Auditor',
        it_support: 'IT Systems and Support Specialist',
        buyer: 'Procurement Sourcing Specialist',
        demand_planner: 'Demand and Supply Planner',
        replenishment_planner: 'Replenishment Inventory Planner',
        customs_import_specialist: 'Customs and Import Specialist',
        inbound_qc_inspector: 'Quality Control Inspector',
        store_operations_auditor: 'Store Operations Compliance Auditor',

        // Functional Specialists & Administrators
        hr: 'Human Resources Administrator',
        pos: 'Point of Sale Cashier',
        cs_manager: 'Customer Service Manager',
        store_supervisor: 'Store Floor Supervisor',
        dispatcher: 'Logistics Fleet Dispatcher',
        returns_clerk: 'Returns and RMA Specialist',
        merchandiser: 'Visual Merchandising Specialist',
        loss_prevention: 'Site Loss Prevention Specialist',
        accountant: 'Corporate Accountant',
        data_analyst: 'Business Intelligence Analyst',
        training_coordinator: 'Training and Development Coordinator',
        payroll_specialist: 'Payroll and Benefits Specialist',
        talent_recruiter: 'Talent Acquisition Specialist',
        hr_generalist: 'HR Generalist',
        treasury_officer: 'Treasury Officer',
        tax_compliance_officer: 'Tax Compliance Officer',
        credit_control_officer: 'Credit Control Officer',
    };

    return displayNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
    const descriptions: Partial<Record<UserRole, string>> = {
        // Level 1 - Executive
        super_admin: 'Chief Executive Officer - Full enterprise executive oversight and cross-border governance',
        admin: 'Assistant Chief Executive Officer - Enterprise deputy and executive administrator',

        // Level 2 - Corporate & Regional Directors
        operations_manager: 'Head of Operations - Enterprise operations directorate and operational standards',
        regional_manager: 'Regional Operations Director - Territorial multi-site operational leadership and store network oversight',
        finance_manager: 'Head of Finance - Enterprise financial oversight, budgeting, and fiscal governance',
        hr_manager: 'Head of Human Resources - Enterprise people operations, compensation runs, and organizational governance',
        procurement_manager: 'Head of Procurement - Enterprise strategic sourcing, master vendor agreements, and contract management',
        supply_chain_manager: 'Head of Supply Chain - Enterprise fulfillment networks, logistics coordination, and replenishment planning',
        merchandising_manager: 'Head of Merchandising - Enterprise retail pricing strategy, gross margin control, and planograms',
        merchandising_specialist: 'Merchandising Specialist - Scoped product, pricing, promotion, and planogram preparation',
        regional_merchandising_lead: 'Regional Merchandising Lead - Territorial product and campaign approvals',
        regional_procurement_lead: 'Regional Procurement Manager - Territorial sourcing and local vendor agreements',
        regional_finance_officer: 'Regional Finance Manager - Regional financial reconciliations, drawer audits, and expense monitoring',
        regional_hr_officer: 'Regional Human Resources Manager - Regional branch staffing, rosters, and workforce governance',
        regional_logistics_lead: 'Regional Logistics Manager - Territorial fleet transit, route execution, and inter-facility transfers',
        regional_security_supervisor: 'Regional Security and Loss Prevention Manager - Territorial asset protection and supervisory overrides audit',

        // Level 3 - Site Managers & Supervisors
        store_manager: 'Store Manager - Retail store leadership, team management, and daily branch performance',
        warehouse_manager: 'Warehouse Manager - Fulfillment center leadership, storage utilization, and dispatch workflows',
        logistics_manager: 'Site Logistics Manager - Facility transit operations, fleet maintenance, and transport management',
        inventory_manager: 'Inventory Control Manager - Physical stock auditing, cycle counts, and ledger accuracy',
        security_manager: 'Loss Prevention and Security Manager - Site asset protection, shrinkage mitigation, and surveillance',
        dispatch_manager: 'Dispatch Operations Manager - Vehicle dispatching, route scheduling, and order staging',
        assistant_manager: 'Assistant Store Manager - Deputy store management, register oversight, and floor operations',
        vendor_relations_manager: 'Vendor Relations Manager - Supplier performance reviews, commercial contracts, and vendor onboarding',
        fleet_maintenance_supervisor: 'Fleet Maintenance Supervisor - Transport fleet safety, vehicle inspections, and servicing schedules',
        shift_lead: 'Shift Operations Supervisor - Floor supervision, task allocation, and operational shift execution',

        // Level 4 - Staff & Specialists
        cashier: 'Retail Cashier - Point of sale checkout, digital transactions, and cash drawer custody',
        sales_associate: 'Customer Sales Associate - Customer service, product recommendations, and aisle replenishment',
        stock_clerk: 'Store Inventory Clerk - Shelving, stock placement, and retail floor staging',
        picker: 'Warehouse Order Picker - Order fulfillment, picking lists, and staging area transfers',
        packer: 'Warehouse Order Packer - Order packing, parcel labeling, and shipment protection',
        receiver: 'Inbound Receiving Specialist - Inbound goods inspection, PO verification, and dock unloading',
        driver: 'Logistics Fleet Driver - Transport delivery, route fulfillment, and customer handover',
        forklift_operator: 'Heavy Equipment and Forklift Operator - High-bay racking, pallet putaway, and dock maneuvering',
        inventory_specialist: 'Inventory Cycle Counter - Bin counts, discrepancy investigations, and inventory auditing',
        customer_service: 'Customer Service Representative - Inquiries, order support, and return resolution',
        auditor: 'Internal Financial Auditor - Internal compliance, forensic auditing, and transaction sampling',
        it_support: 'IT Systems and Support Specialist - Technical workstations, handheld scanners, and systems support',
        buyer: 'Procurement Sourcing Specialist - RFQ management, supplier purchase orders, and price benchmarking',
        demand_planner: 'Demand and Supply Planner - Sales forecasting, order replenishment, and buffer stock planning',
        replenishment_planner: 'Replenishment Inventory Planner - Distribution center inventory rebalancing and store velocity',
        customs_import_specialist: 'Customs and Import Specialist - Port clearances, import documentation, and freight forwarding',
        inbound_qc_inspector: 'Quality Control Inspector - Food safety compliance, cold-chain checks, and intake standards',
        store_operations_auditor: 'Store Operations Compliance Auditor - Unannounced store walkthroughs and cash spot audits',

        // Functional Specialists & Administrators
        hr: 'Human Resources Administrator - Personnel onboarding, leave records, and administrative support',
        pos: 'Point of Sale Cashier - Checkout transactions and customer payment processing',
        cs_manager: 'Customer Service Manager - Customer relations, resolution metrics, and support leadership',
        store_supervisor: 'Store Floor Supervisor - Retail floor execution, customer flow, and staff coordination',
        dispatcher: 'Logistics Fleet Dispatcher - Transport coordination, dispatch logs, and route assignment',
        returns_clerk: 'Returns and RMA Specialist - Customer returns, item classification, and credit processing',
        merchandiser: 'Visual Merchandising Specialist - Shelf displays, endcap presentations, and planogram compliance',
        loss_prevention: 'Site Loss Prevention Specialist - Asset protection surveillance, shrinkage checks, and incident reports',
        accountant: 'Corporate Accountant - General ledger entries, bank reconciliations, and balance auditing',
        data_analyst: 'Business Intelligence Analyst - Operational dashboards, KPI reports, and trend analytics',
        training_coordinator: 'Training and Development Coordinator - Onboarding curricula, equipment certifications, and SOP training',
        payroll_specialist: 'Payroll and Benefits Specialist - Monthly compensation calculation, payroll runs, and tax deductions',
        talent_recruiter: 'Talent Acquisition Specialist - Candidate pipelines, interviewing, and recruitment coordination',
        hr_generalist: 'HR Generalist - Employee case preparation and people operations support',
        treasury_officer: 'Treasury and Reconciliation Officer - Cash drawer audits and digital tender reconciliation',
        tax_compliance_officer: 'Tax and Regulatory Compliance Officer - Sovereign VAT filings, statutory declarations, and tax audits',
        credit_control_officer: 'Credit Control Officer - Commercial credit terms, B2B account limits, and payment collection',
    };

    return descriptions[role] || 'Standard user access';
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
    const colors: Partial<Record<UserRole, string>> = {
        // Level 1
        super_admin: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20',
        admin: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-400/10 border-purple-200 dark:border-purple-400/20',

        // Level 2
        operations_manager: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20',
        regional_manager: 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
        finance_manager: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20',
        hr_manager: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-400/10 border-pink-200 dark:border-pink-400/20',
        procurement_manager: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-400/20',
        supply_chain_manager: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-400/10 border-violet-200 dark:border-violet-400/20',
        merchandising_manager: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20',
        merchandising_specialist: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-300/10 border-amber-200 dark:border-amber-300/20',
        regional_merchandising_lead: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-300/10 border-amber-200 dark:border-amber-300/20',
        regional_procurement_lead: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-400/20',
        regional_finance_officer: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20',
        regional_hr_officer: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-400/10 border-pink-200 dark:border-pink-400/20',
        regional_logistics_lead: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-400/10 border-violet-200 dark:border-violet-400/20',
        regional_security_supervisor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border-rose-200 dark:border-rose-400/20',

        // Level 3
        store_manager: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-400/10 border-teal-200 dark:border-teal-400/20',
        warehouse_manager: 'text-teal-700 dark:text-teal-500 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
        logistics_manager: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-400/20',
        inventory_manager: 'text-teal-700 dark:text-teal-500 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
        security_manager: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border-rose-200 dark:border-rose-400/20',
        dispatch_manager: 'text-lime-600 dark:text-lime-400 bg-lime-100 dark:bg-lime-400/10 border-lime-200 dark:border-lime-400/20',
        assistant_manager: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-400/10 border-cyan-200 dark:border-cyan-400/20',
        vendor_relations_manager: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-400/20',
        fleet_maintenance_supervisor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-400/20',
        shift_lead: 'text-blue-600 dark:text-blue-200 bg-blue-50 dark:bg-blue-200/10 border-blue-200 dark:border-blue-200/20',

        // Level 4
        cashier: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 border-green-200 dark:border-green-400/20',
        sales_associate: 'text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-300/10 border-green-200 dark:border-green-300/20',
        stock_clerk: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20',
        picker: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-400/10 border-orange-200 dark:border-orange-400/20',
        packer: 'text-orange-500 dark:text-orange-300 bg-orange-50 dark:bg-orange-300/10 border-orange-200 dark:border-orange-300/20',
        receiver: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-400/10 border-cyan-200 dark:border-cyan-400/20',
        driver: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-400/10 border-slate-200 dark:border-slate-400/20',
        forklift_operator: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-400/10 border-gray-200 dark:border-gray-400/20',
        inventory_specialist: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-300/10 border-amber-200 dark:border-amber-300/20',
        customer_service: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-400/10 border-sky-200 dark:border-sky-400/20',
        auditor: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-400/10 border-rose-200 dark:border-rose-400/20',
        it_support: 'text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-300/10 border-purple-200 dark:border-purple-300/20',
        buyer: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20',
        demand_planner: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-400/10 border-violet-200 dark:border-violet-400/20',
        replenishment_planner: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-400/10 border-violet-200 dark:border-violet-400/20',
        customs_import_specialist: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-400/10 border-sky-200 dark:border-sky-400/20',
        inbound_qc_inspector: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20',
        store_operations_auditor: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-400/10 border-purple-200 dark:border-purple-400/20',

        // Legacy roles
        hr: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-400/10 border-pink-200 dark:border-pink-400/20',
        pos: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 border-green-200 dark:border-green-400/20',
        cs_manager: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-400/10 border-sky-200 dark:border-sky-400/20',
        store_supervisor: 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-300/10 border-blue-200 dark:border-blue-300/20',
        dispatcher: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-400/10 border-fuchsia-200 dark:border-fuchsia-400/20',
        returns_clerk: 'text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-300/10 border-red-200 dark:border-red-300/20',
        merchandiser: 'text-pink-600 dark:text-pink-300 bg-pink-100 dark:bg-pink-300/10 border-pink-200 dark:border-pink-300/20',
        loss_prevention: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 border-red-200 dark:border-red-400/20',
        accountant: 'text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-300/10 border-emerald-200 dark:border-emerald-300/20',
        data_analyst: 'text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-300/10 border-purple-200 dark:border-purple-300/20',
        training_coordinator: 'text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-300/10 border-yellow-200 dark:border-yellow-300/20',
        payroll_specialist: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-400/10 border-pink-200 dark:border-pink-400/20',
        talent_recruiter: 'text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-300/10 border-pink-200 dark:border-pink-300/20',
        treasury_officer: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20',
        tax_compliance_officer: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-400/10 border-teal-200 dark:border-teal-400/20',
        credit_control_officer: 'text-teal-700 dark:text-teal-500 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
    };

    return colors[role] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
}
