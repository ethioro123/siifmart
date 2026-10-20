import { UserRole } from '../types';

export const SYSTEM_ROLES: {
   id: UserRole,
   label: string,
   desc: string,
   level: number,
   styles: { text: string, bg: string, border: string, badge: string }
}[] = [
   // ═══ LEVEL 1 - EXECUTIVE ═══
   { id: 'super_admin', label: 'Chief Executive Officer', desc: 'Enterprise Ownership and Sovereign Executive Governance', level: 1, styles: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-400/10', border: 'border-yellow-200 dark:border-yellow-400/20', badge: 'bg-yellow-100 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-400' } },
   { id: 'country_managing_director', label: 'Country Managing Director', desc: 'National Executive Leadership and Country Operations Governance', level: 1, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },
   { id: 'admin', label: 'Country Managing Director', desc: 'National Executive Leadership and Country Operations Governance', level: 1, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },

   // ═══ LEVEL 2 - CORPORATE & REGIONAL DIRECTORS ═══
   { id: 'head_of_operations', label: 'Head of Operations', desc: 'Enterprise Operations Directorate and Network Standards', level: 2, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'operations_head', label: 'Head of Operations', desc: 'Enterprise Operations Directorate and Network Standards', level: 2, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'operations_manager', label: 'Head of Operations', desc: 'Enterprise Operations Directorate and Network Standards', level: 2, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'head_of_finance', label: 'Head of Finance', desc: 'Enterprise Financial Strategy and Corporate Accounting', level: 2, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'finance_head', label: 'Head of Finance', desc: 'Enterprise Financial Strategy and Corporate Accounting', level: 2, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'finance_manager', label: 'Head of Finance', desc: 'Enterprise Financial Strategy and Corporate Accounting', level: 2, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'head_of_hr', label: 'Head of Human Resources', desc: 'Enterprise People Operations and Payroll Governance', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'hr_head', label: 'Head of Human Resources', desc: 'Enterprise People Operations and Payroll Governance', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'hr_manager', label: 'Head of Human Resources', desc: 'Enterprise People Operations and Payroll Governance', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'head_of_procurement', label: 'Head of Procurement', desc: 'Enterprise Strategic Sourcing and Supplier Contracts', level: 2, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'procurement_head', label: 'Head of Procurement', desc: 'Enterprise Strategic Sourcing and Supplier Contracts', level: 2, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'procurement_manager', label: 'Head of Procurement', desc: 'Enterprise Strategic Sourcing and Supplier Contracts', level: 2, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'head_of_supply_chain', label: 'Head of Supply Chain', desc: 'Enterprise Logistics and Fulfillment Networks', level: 2, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'supply_chain_head', label: 'Head of Supply Chain', desc: 'Enterprise Logistics and Fulfillment Networks', level: 2, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'supply_chain_manager', label: 'Head of Supply Chain', desc: 'Enterprise Logistics and Fulfillment Networks', level: 2, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'head_of_merchandising', label: 'Head of Merchandising', desc: 'Enterprise Product Assortment and Pricing Strategy', level: 2, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'merchandising_head', label: 'Head of Merchandising', desc: 'Enterprise Product Assortment and Pricing Strategy', level: 2, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'merchandising_manager', label: 'Head of Merchandising', desc: 'Enterprise Product Assortment and Pricing Strategy', level: 2, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'head_of_it', label: 'Head of IT & Systems', desc: 'Enterprise Technology Infrastructure and Security Policy', level: 2, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'it_head', label: 'Head of IT & Systems', desc: 'Enterprise Technology Infrastructure and Security Policy', level: 2, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'head_of_audit', label: 'Head of Internal Audit', desc: 'Enterprise Risk, Compliance and Zero-Trust Governance', level: 2, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'audit_head', label: 'Head of Internal Audit', desc: 'Enterprise Risk, Compliance and Zero-Trust Governance', level: 2, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'regional_manager', label: 'Regional Operations Manager', desc: 'Territorial Multi-Site Leadership and Area Oversight', level: 2, styles: { text: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-500' } },
   { id: 'regional_procurement_lead', label: 'Regional Procurement Lead', desc: 'Territorial Sourcing and Local Vendor Agreements', level: 2, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'regional_finance_officer', label: 'Regional Finance Officer', desc: 'Territorial Financial Audits and Till Reconciliations', level: 2, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'regional_merchandising_lead', label: 'Regional Merchandising Lead', desc: 'Territorial pricing, campaigns, and planogram approvals', level: 2, styles: { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-100 dark:bg-amber-300/20 text-amber-800 dark:text-amber-300' } },
   { id: 'regional_hr_officer', label: 'Regional Human Resources Officer', desc: 'Territorial Staffing and Workforce Governance', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'regional_logistics_lead', label: 'Regional Logistics Lead', desc: 'Territorial Fleet Transit and Inter-Facility Transfers', level: 2, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'regional_security_supervisor', label: 'Regional Security Supervisor', desc: 'Territorial Asset Protection and Supervisory Audit Governance', level: 2, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-50 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },

   // ═══ LEVEL 3 - SITE MANAGERS & SUPERVISORS ═══
   { id: 'store_manager', label: 'Store Manager', desc: 'Retail Store Operational Leadership', level: 3, styles: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-400/10', border: 'border-teal-200 dark:border-teal-400/20', badge: 'bg-teal-100 dark:bg-teal-400/20 text-teal-700 dark:text-teal-400' } },
   { id: 'warehouse_manager', label: 'Warehouse Manager', desc: 'Fulfillment Center Operational Leadership', level: 3, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },
   { id: 'logistics_manager', label: 'Logistics Manager', desc: 'Facility Transit and Transport Operations', level: 3, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-50 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'inventory_manager', label: 'Inventory Manager', desc: 'Stock Accuracy and Physical Auditing', level: 3, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },
   { id: 'security_manager', label: 'Security Manager', desc: 'Site Asset Protection and Security Surveillance', level: 3, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-50 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'dispatch_manager', label: 'Dispatch Manager', desc: 'Order Staging and Transport Dispatch', level: 3, styles: { text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-400/10', border: 'border-lime-200 dark:border-lime-400/20', badge: 'bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400' } },
   { id: 'assistant_manager', label: 'Assistant Store Manager', desc: 'Deputy Store Operations Management', level: 3, styles: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10', border: 'border-cyan-200 dark:border-cyan-400/20', badge: 'bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-400' } },
   { id: 'vendor_relations_manager', label: 'Vendor Relations Manager', desc: 'Supplier Onboarding and Commercial Partnerships', level: 3, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'fleet_maintenance_supervisor', label: 'Fleet Maintenance Supervisor', desc: 'Vehicle Inspections and Transport Maintenance', level: 3, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-50 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'shift_lead', label: 'Shift Supervisor', desc: 'Operational Team Shift Supervision', level: 3, styles: { text: 'text-blue-600 dark:text-blue-200', bg: 'bg-blue-50 dark:bg-blue-200/10', border: 'border-blue-200 dark:border-blue-200/20', badge: 'bg-blue-50 dark:bg-blue-200/20 text-blue-700 dark:text-blue-200' } },

   // ═══ LEVEL 4 - STAFF & SPECIALISTS ═══
   { id: 'cashier', label: 'Cashier', desc: 'Point of Sale Checkout and Cash Handling', level: 4, styles: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/10', border: 'border-green-200 dark:border-green-400/20', badge: 'bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-green-400' } },
   { id: 'sales_associate', label: 'Retail Sales Associate', desc: 'Customer Assistance and Floor Merchandising', level: 4, styles: { text: 'text-green-600 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-300/10', border: 'border-green-200 dark:border-green-300/20', badge: 'bg-green-50 dark:bg-green-300/20 text-green-700 dark:text-green-300' } },
   { id: 'stock_clerk', label: 'Inventory Clerk', desc: 'Shelf Replenishment and Stock Staging', level: 4, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'picker', label: 'Warehouse Order Picker', desc: 'Order Fulfillment and Wave Picking', level: 4, styles: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-400/10', border: 'border-orange-200 dark:border-orange-400/20', badge: 'bg-orange-100 dark:bg-orange-400/20 text-orange-700 dark:text-orange-400' } },
   { id: 'packer', label: 'Warehouse Packer', desc: 'Order Packaging and Shipping Staging', level: 4, styles: { text: 'text-orange-500 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-300/10', border: 'border-orange-200 dark:border-orange-300/20', badge: 'bg-orange-50 dark:bg-orange-300/20 text-orange-600 dark:text-orange-300' } },
   { id: 'receiver', label: 'Warehouse Receiving Specialist', desc: 'Dock Receiving and Inbound Verification', level: 4, styles: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10', border: 'border-cyan-200 dark:border-cyan-400/20', badge: 'bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-400' } },
   { id: 'driver', label: 'Delivery Driver', desc: 'Transport Delivery and Route Execution', level: 4, styles: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-400/10', border: 'border-slate-200 dark:border-slate-400/20', badge: 'bg-slate-100 dark:bg-slate-400/20 text-slate-700 dark:text-slate-400' } },
   { id: 'forklift_operator', label: 'Forklift Operator', desc: 'Material Handling and Pallet Racking', level: 4, styles: { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-400/10', border: 'border-gray-200 dark:border-gray-400/20', badge: 'bg-gray-100 dark:bg-gray-400/20 text-gray-700 dark:text-gray-400' } },
   { id: 'inventory_specialist', label: 'Inventory Control Specialist', desc: 'Stock Cycle Counting and Accuracy Control', level: 4, styles: { text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-50 dark:bg-amber-300/20 text-amber-700 dark:text-amber-300' } },
   { id: 'customer_service', label: 'Customer Service Representative', desc: 'Customer Inquiries and Return Resolution', level: 4, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'auditor', label: 'Internal Auditor', desc: 'Operational Compliance and Financial Risk Auditing', level: 4, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'it_support', label: 'IT Support Specialist', desc: 'Technical Support and Infrastructure Maintenance', level: 4, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'buyer', label: 'Procurement Buyer', desc: 'Supplier Quotes and Purchase Orders', level: 4, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'demand_planner', label: 'Demand Planner', desc: 'Inventory Forecasting and Capacity Planning', level: 4, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'replenishment_planner', label: 'Replenishment Planner', desc: 'Store Velocity and Stock Replenishment', level: 4, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'customs_import_specialist', label: 'Customs and Import Specialist', desc: 'Cross-Border Freight and Customs Clearance', level: 4, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'inbound_qc_inspector', label: 'Quality Control Inspector', desc: 'Inbound Food Safety and Cold-Chain Compliance', level: 4, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'store_operations_auditor', label: 'Store Operations Auditor', desc: 'Field Operational and Compliance Audits', level: 4, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },

   // ═══ FUNCTIONAL SPECIALISTS & ADMINISTRATORS ═══
   { id: 'hr', label: 'Human Resources Officer', desc: 'Personnel Records and HR Administration', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'pos', label: 'Point of Sale Cashier', desc: 'Register Checkout and Payment Processing', level: 4, styles: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/10', border: 'border-green-200 dark:border-green-400/20', badge: 'bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-green-400' } },
   { id: 'cs_manager', label: 'Customer Service Manager', desc: 'Customer Care and Support Operations', level: 3, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'store_supervisor', label: 'Store Supervisor', desc: 'Retail Floor and Customer Flow Supervision', level: 3, styles: { text: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-300/10', border: 'border-blue-200 dark:border-blue-300/20', badge: 'bg-blue-100 dark:bg-blue-300/20 text-blue-700 dark:text-blue-300' } },
   { id: 'dispatcher', label: 'Dispatcher', desc: 'Route Planning and Driver Scheduling', level: 4, styles: { text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-400/10', border: 'border-fuchsia-200 dark:border-fuchsia-400/20', badge: 'bg-fuchsia-100 dark:bg-fuchsia-400/20 text-fuchsia-700 dark:text-fuchsia-400' } },
   { id: 'returns_clerk', label: 'Returns Specialist', desc: 'Returned Goods Inspection and RMA Processing', level: 4, styles: { text: 'text-red-600 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-300/10', border: 'border-red-200 dark:border-red-300/20', badge: 'bg-red-100 dark:bg-red-300/20 text-red-700 dark:text-red-300' } },
   { id: 'merchandiser', label: 'Merchandiser', desc: 'Store Planogram and Display Execution', level: 4, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-100 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'loss_prevention', label: 'Loss Prevention Officer', desc: 'Store Shrinkage and Surveillance Monitoring', level: 4, styles: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-400/10', border: 'border-red-200 dark:border-red-400/20', badge: 'bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-400' } },
   { id: 'accountant', label: 'Accountant', desc: 'Financial Ledger and Balance Reconciliation', level: 4, styles: { text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-300/10', border: 'border-emerald-200 dark:border-emerald-300/20', badge: 'bg-emerald-100 dark:bg-emerald-300/20 text-emerald-700 dark:text-emerald-300' } },
   { id: 'data_analyst', label: 'Business Data Analyst', desc: 'Operational Reporting and Business Analytics', level: 4, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'training_coordinator', label: 'Training Coordinator', desc: 'Employee Training and Operational Onboarding', level: 4, styles: { text: 'text-yellow-600 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-300/10', border: 'border-yellow-200 dark:border-yellow-300/20', badge: 'bg-yellow-100 dark:bg-yellow-300/20 text-yellow-700 dark:text-yellow-300' } },
   { id: 'payroll_specialist', label: 'Payroll Specialist', desc: 'Employee Compensation and Statutory Benefits', level: 4, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'talent_recruiter', label: 'Talent Acquisition Specialist', desc: 'Candidate Sourcing and Recruitment', level: 4, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-50 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'hr_generalist', label: 'HR Generalist', desc: 'Employee case preparation and people operations support', level: 4, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-50 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'merchandising_specialist', label: 'Merchandising Specialist', desc: 'Country or regional assortment and campaign preparation', level: 4, styles: { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-50 dark:bg-amber-300/20 text-amber-800 dark:text-amber-300' } },
   { id: 'treasury_officer', label: 'Treasury Officer', desc: 'Cash Flow and Tender Reconciliation', level: 4, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'tax_compliance_officer', label: 'Tax Compliance Officer', desc: 'Sovereign Tax Filings and Statutory Compliance', level: 4, styles: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-400/10', border: 'border-teal-200 dark:border-teal-400/20', badge: 'bg-teal-100 dark:bg-teal-400/20 text-teal-700 dark:text-teal-400' } },
   { id: 'credit_control_officer', label: 'Credit Control Officer', desc: 'Commercial Credit and Accounts Receivable', level: 4, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },
];

export function getJobTitleForRole(role?: string | null): string {
   const normalizedRole = (role || '').trim().toLowerCase();
   if (normalizedRole === 'ceo') return 'Chief Executive Officer';

   const configuredRole = SYSTEM_ROLES.find(item => item.id.toLowerCase() === normalizedRole);
   if (configuredRole) return configuredRole.label;

   return normalizedRole
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
}

export function getEmployeeJobTitle(employee: {
   jobTitle?: string | null;
   job_title?: string | null;
   role?: string | null;
}): string {
   return employee.jobTitle?.trim() || employee.job_title?.trim() || getJobTitleForRole(employee.role);
}

export const getRoleHierarchy = (role: UserRole | string): number => {
    const hierarchy: Partial<Record<UserRole | string, number>> = {
        // Level 1: Executive
        'super_admin': 100,
        'CEO': 100,
        'ceo': 100,
        'country_managing_director': 98,
        'admin': 98, // Country Managing Director (National Executive below Global CEO)

        // Level 2: Directors & Regional ("Head of...")
        'head_of_operations': 95,
        'operations_head': 95,
        'operations_manager': 95,
        'regional_manager': 90,
        'head_of_finance': 85,
        'finance_head': 85,
        'finance_manager': 85,
        'head_of_hr': 85,
        'hr_head': 85,
        'hr_manager': 85,
        'hr': 85, // Legacy HR
        'head_of_procurement': 82,
        'procurement_head': 82,
        'procurement_manager': 82,
        'head_of_supply_chain': 82,
        'supply_chain_head': 82,
        'supply_chain_manager': 82,
        'head_of_merchandising': 82,
        'merchandising_head': 82,
        'merchandising_manager': 82,
        'head_of_it': 80,
        'it_head': 80,
        'head_of_audit': 80,
        'audit_head': 80,
        'regional_procurement_lead': 81,
        'regional_finance_officer': 81,
        'regional_merchandising_lead': 81,
        'regional_hr_officer': 81,
        'regional_logistics_lead': 81,
        'regional_security_supervisor': 81,

        // Level 3: Site Managers & Department Heads
        'logistics_manager': 80,
        'inventory_manager': 80,
        'security_manager': 75,
        'store_manager': 80,
        'warehouse_manager': 80,
        'dispatch_manager': 75,
        'cs_manager': 60,
        'assistant_manager': 60,
        'vendor_relations_manager': 60,
        'fleet_maintenance_supervisor': 58,
        'store_supervisor': 55,
        'shift_lead': 55,

        // Support & Supervisors
        'store_operations_auditor': 45,
        'auditor': 40,
        'payroll_specialist': 40,
        'treasury_officer': 38,
        'tax_compliance_officer': 38,
        'credit_control_officer': 36,
        'accountant': 35,
        'data_analyst': 35,
        'training_coordinator': 35,
        'talent_recruiter': 35,
        'hr_generalist': 35,
        'merchandising_specialist': 35,
        'customs_import_specialist': 35,
        'it_support': 35,
        'dispatcher': 35,

        // Level 4: Staff
        'buyer': 30,
        'demand_planner': 30,
        'replenishment_planner': 30,
        'inbound_qc_inspector': 30,
        'loss_prevention': 30,
        'cashier': 30,
        'sales_associate': 28,
        'pos': 28, // Legacy POS
        'merchandiser': 25,
        'inventory_specialist': 25,
        'customer_service': 25,
        'stock_clerk': 25,
        'picker': 22,
        'packer': 22,
        'receiver': 22,
        'returns_clerk': 22,
        'driver': 20,
        'forklift_operator': 20,
    };
    return hierarchy[role] || 0;
};

export const canViewLocation = (
    userRole: string | undefined,
    targetRole: string,
    isOwn: boolean
): boolean => {
    if (isOwn) return true;
    if (!userRole) return false;

    // Global CEO can see everyone
    if (userRole === 'super_admin') return true;

    // Country Managing Director and HR/Operations leadership can see anyone in their country except Global CEO
    if ([
        'admin', 'country_managing_director',
        'hr', 'hr_manager', 'head_of_hr', 'hr_head',
        'operations_manager', 'head_of_operations', 'operations_head'
    ].includes(userRole)) {
        return targetRole !== 'super_admin' && targetRole !== 'ceo' && targetRole !== 'CEO';
    }

    // Otherwise, follow hierarchy: user role hierarchy level must be greater than target
    const userLevel = getRoleHierarchy(userRole);
    const targetLevel = getRoleHierarchy(targetRole);

    return userLevel > targetLevel;
};

export const canViewCostPrice = (role: string | undefined): boolean => {
    if (!role) return false;

    // Explicitly allow executive, regional/operations directors, finance, procurement, and merchandising leadership
    if ([
        'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
        'regional_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_merchandising_lead',
        'operations_manager', 'head_of_operations', 'operations_head',
        'finance_manager', 'head_of_finance', 'finance_head',
        'procurement_manager', 'head_of_procurement', 'procurement_head',
        'supply_chain_manager', 'head_of_supply_chain', 'supply_chain_head',
        'merchandising_manager', 'head_of_merchandising', 'merchandising_head',
        'head_of_audit', 'audit_head',
        'vendor_relations_manager'
    ].includes(role)) {
        return true;
    }

    // Explicitly disallow store managers and inventory managers
    if (role === 'store_manager' || role === 'inventory_manager' || role === 'warehouse_manager') {
        return false;
    }

    // Disallow anyone with level <= 72 (e.g., cashier, shift_lead, etc.)
    const level = getRoleHierarchy(role);
    if (level <= 72) {
        return false;
    }

    return true;
};

/**
 * Determines whether a manager with `userRole` is authorized to hire/onboard `candidateRole`.
 * Core Rule: HR and above employees cannot employ their level or above; they can only employ roles strictly less than their own role.
 */
export const canEmployRole = (
    userRole: UserRole | string | undefined,
    candidateRole: UserRole | string
): boolean => {
    if (!userRole) return false;

    // CEO / Super Admin can employ anyone below CEO
    if (userRole === 'super_admin' || userRole === 'CEO') {
        return candidateRole !== 'super_admin' && candidateRole !== 'CEO';
    }

    const userHierarchy = getRoleHierarchy(userRole);
    const candidateHierarchy = getRoleHierarchy(candidateRole);

    // Must be strictly below user in the role hierarchy rank
    if (candidateHierarchy >= userHierarchy) {
        return false;
    }

    const userLevel = SYSTEM_ROLES.find(r => r.id === userRole)?.level || 4;
    const candidateLevel = SYSTEM_ROLES.find(r => r.id === candidateRole)?.level || 4;

    // Staff (Level 4) have no hiring authority
    if (userLevel >= 4 || userHierarchy < 55) {
        return false;
    }

    // Facility Captains (store_manager, warehouse_manager) can ONLY be hired by Executive Leadership, Operations Director, Regional Director, or HR Leadership
    const isFacilityCaptain = candidateRole === 'store_manager' || candidateRole === 'warehouse_manager';
    if (isFacilityCaptain) {
        return [
            'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
            'operations_manager', 'head_of_operations', 'operations_head',
            'supply_chain_manager', 'head_of_supply_chain', 'supply_chain_head',
            'regional_manager', 'regional_hr_officer',
            'hr_manager', 'head_of_hr', 'hr_head', 'hr'
        ].includes(userRole as string);
    }

    // Regional Functional Leads (hierarchy 81) can be employed by Executive Leadership, Operations Director, Regional Manager, HR Leadership, or their Corporate Directorate Head
    const isRegionalFunctionalLead = [
        'regional_procurement_lead',
        'regional_merchandising_lead',
        'regional_finance_officer',
        'regional_hr_officer',
        'regional_logistics_lead',
        'regional_security_supervisor'
    ].includes(candidateRole as string);
    if (isRegionalFunctionalLead) {
        return [
            'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
            'operations_manager', 'head_of_operations', 'operations_head',
            'regional_manager',
            'hr_manager', 'head_of_hr', 'hr_head', 'hr',
            'procurement_manager', 'head_of_procurement', 'procurement_head',
            'finance_manager', 'head_of_finance', 'finance_head',
            'merchandising_manager', 'head_of_merchandising', 'merchandising_head',
            'supply_chain_manager', 'head_of_supply_chain', 'supply_chain_head',
            'head_of_audit', 'audit_head', 'head_of_it', 'it_head'
        ].includes(userRole as string);
    }

    // HR and above (Level 2 & above, hierarchy >= 82) cannot employ their level or above
    // They can ONLY employ roles strictly less than their role (Level 3 Site Managers & Level 4 Staff)
    const isHrOrAbove = userLevel <= 2 || userHierarchy >= 82;
    if (isHrOrAbove && candidateLevel <= userLevel) {
        return false;
    }

    return true;
};

// Canonical list of Level 1, 2, and 3 managerial & leadership roles for selective egress loading
export const MANAGERIAL_ROLES: readonly string[] = [
    'super_admin',
    'admin',
    'country_managing_director',
    'CEO',
    'ceo',
    'regional_manager',
    'regional_procurement_lead',
    'regional_finance_officer',
    'regional_merchandising_lead',
    'regional_hr_officer',
    'regional_logistics_lead',
    'regional_security_supervisor',
    'head_of_operations',
    'operations_head',
    'operations_manager',
    'head_of_finance',
    'finance_head',
    'finance_manager',
    'head_of_hr',
    'hr_head',
    'hr_manager',
    'hr',
    'head_of_procurement',
    'procurement_head',
    'procurement_manager',
    'head_of_supply_chain',
    'supply_chain_head',
    'supply_chain_manager',
    'head_of_merchandising',
    'merchandising_head',
    'merchandising_manager',
    'head_of_it',
    'it_head',
    'head_of_audit',
    'audit_head',
    'store_manager',
    'warehouse_manager',
    'logistics_manager',
    'inventory_manager',
    'security_manager',
    'dispatch_manager',
    'assistant_manager',
    'vendor_relations_manager',
    'fleet_maintenance_supervisor',
    'shift_lead',
    'cs_manager',
    'store_supervisor',
    'manager'
] as const;

export const isManagerialRole = (role?: string): boolean => {
    if (!role) return false;
    return MANAGERIAL_ROLES.includes(role);
};

