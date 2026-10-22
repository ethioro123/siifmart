import { UserRole } from '../types';

export const SYSTEM_ROLES: {
   id: UserRole,
   label: string,
   desc: string,
   level: number,
   styles: { text: string, bg: string, border: string, badge: string }
}[] = [
   // ═══ LEVEL 1 - GLOBAL EXECUTIVE ═══
   { id: 'group_ceo', label: 'Group Chief Executive Officer', desc: 'Multinational Enterprise Governance and Global Group Strategy', level: 1, styles: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-400/10', border: 'border-yellow-200 dark:border-yellow-400/20', badge: 'bg-yellow-100 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-400' } },
   { id: 'group_coo', label: 'Group Chief Operating Officer', desc: 'Enterprise Operational Execution and Multinational Country Governance', level: 1, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-100 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'super_admin', label: 'Chief Executive Officer', desc: 'Enterprise Ownership and Sovereign Executive Governance', level: 1, styles: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-400/10', border: 'border-yellow-200 dark:border-yellow-400/20', badge: 'bg-yellow-100 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-400' } },

   // ═══ LEVEL 2 - COUNTRY EXECUTIVE ═══
   { id: 'country_managing_director', label: 'Country Managing Director', desc: 'National Executive Leadership and Country Operations Governance', level: 2, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },
   { id: 'admin', label: 'Country Managing Director', desc: 'National Executive Leadership and Country Operations Governance', level: 2, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },

   // ═══ LEVEL 3 - CORPORATE HQ DIRECTORATE HEADS ═══
   { id: 'head_of_operations', label: 'Head of Operations', desc: 'Enterprise Operations Directorate and Network Standards', level: 3, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'head_of_finance', label: 'Head of Finance', desc: 'Enterprise Financial Strategy and Corporate Accounting', level: 3, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'head_of_hr', label: 'Head of Human Resources', desc: 'Enterprise People Operations and Payroll Governance', level: 3, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'head_of_procurement', label: 'Head of Procurement', desc: 'Enterprise Strategic Sourcing and Supplier Contracts', level: 3, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'head_of_supply_chain', label: 'Head of Supply Chain', desc: 'Enterprise Logistics and Fulfillment Networks', level: 3, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'head_of_merchandising', label: 'Head of Merchandising', desc: 'Enterprise Product Assortment and Pricing Strategy', level: 3, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'head_of_it', label: 'Head of IT & Systems', desc: 'Enterprise Technology Infrastructure and Security Policy', level: 3, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'head_of_audit', label: 'Head of Internal Audit', desc: 'Enterprise Risk, Compliance and Zero-Trust Governance', level: 3, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },

   // ═══ LEVEL 4 - REGIONAL OPERATIONS MANAGER ═══
   { id: 'regional_operations_manager', label: 'Regional Operations Manager', desc: 'Territorial Multi-Site Leadership and Area Oversight', level: 4, styles: { text: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-500' } },

   // ═══ LEVEL 5 - REGIONAL DEPARTMENT MANAGERS ═══
   { id: 'regional_procurement_manager', label: 'Regional Procurement Manager', desc: 'Territorial Sourcing and Local Vendor Agreements', level: 5, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'regional_finance_manager', label: 'Regional Finance Manager', desc: 'Territorial Financial Audits and Till Reconciliations', level: 5, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'regional_merchandising_manager', label: 'Regional Merchandising Manager', desc: 'Territorial pricing, campaigns, and planogram approvals', level: 5, styles: { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-100 dark:bg-amber-300/20 text-amber-800 dark:text-amber-300' } },
   { id: 'regional_hr_manager', label: 'Regional Human Resources Manager', desc: 'Territorial Staffing and Workforce Governance', level: 5, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'regional_logistics_manager', label: 'Regional Logistics Manager', desc: 'Territorial Fleet Transit and Inter-Facility Transfers', level: 5, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'regional_security_manager', label: 'Regional Security Manager', desc: 'Territorial Asset Protection and Supervisory Audit Governance', level: 5, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-50 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },

   // ═══ LEVEL 6 - FACILITY CAPTAINS ═══
   { id: 'store_manager', label: 'Store Manager', desc: 'Retail Store Operational Leadership', level: 6, styles: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-400/10', border: 'border-teal-200 dark:border-teal-400/20', badge: 'bg-teal-100 dark:bg-teal-400/20 text-teal-700 dark:text-teal-400' } },
   { id: 'warehouse_manager', label: 'Warehouse Manager', desc: 'Fulfillment Center Operational Leadership', level: 6, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },

   // ═══ LEVEL 7 - FUNCTIONAL & DEPARTMENT MANAGERS ═══
   { id: 'logistics_manager', label: 'Logistics Manager', desc: 'Facility Transit and Transport Operations', level: 7, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-50 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'inventory_manager', label: 'Inventory Manager', desc: 'Stock Accuracy and Physical Auditing', level: 7, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },
   { id: 'security_manager', label: 'Security Manager', desc: 'Site Asset Protection and Security Surveillance', level: 7, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-50 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'dispatch_manager', label: 'Dispatch Manager', desc: 'Order Staging and Transport Dispatch', level: 7, styles: { text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-400/10', border: 'border-lime-200 dark:border-lime-400/20', badge: 'bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400' } },
   { id: 'vendor_relations_manager', label: 'Vendor Relations Manager', desc: 'Supplier Onboarding and Commercial Partnerships', level: 7, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },

   // ═══ LEVEL 8 - DEPUTY & SHIFT SUPERVISORS ═══
   { id: 'assistant_manager', label: 'Assistant Store Manager', desc: 'Deputy Store Operations Management', level: 8, styles: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10', border: 'border-cyan-200 dark:border-cyan-400/20', badge: 'bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-400' } },
   { id: 'fleet_maintenance_supervisor', label: 'Fleet Maintenance Supervisor', desc: 'Vehicle Inspections and Transport Maintenance', level: 8, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-50 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'shift_lead', label: 'Shift Supervisor', desc: 'Operational Team Shift Supervision', level: 8, styles: { text: 'text-blue-600 dark:text-blue-200', bg: 'bg-blue-50 dark:bg-blue-200/10', border: 'border-blue-200 dark:border-blue-200/20', badge: 'bg-blue-50 dark:bg-blue-200/20 text-blue-700 dark:text-blue-200' } },

   // ═══ LEVEL 9 & 10 - SPECIALISTS & FRONTLINE STAFF ═══
   { id: 'cashier', label: 'Cashier', desc: 'Point of Sale Checkout and Cash Handling', level: 10, styles: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/10', border: 'border-green-200 dark:border-green-400/20', badge: 'bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-green-400' } },
   { id: 'sales_associate', label: 'Retail Sales Associate', desc: 'Customer Assistance and Floor Merchandising', level: 10, styles: { text: 'text-green-600 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-300/10', border: 'border-green-200 dark:border-green-300/20', badge: 'bg-green-50 dark:bg-green-300/20 text-green-700 dark:text-green-300' } },
   { id: 'stock_clerk', label: 'Inventory Clerk', desc: 'Shelf Replenishment and Stock Staging', level: 10, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'picker', label: 'Warehouse Order Picker', desc: 'Order Fulfillment and Wave Picking', level: 10, styles: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-400/10', border: 'border-orange-200 dark:border-orange-400/20', badge: 'bg-orange-100 dark:bg-orange-400/20 text-orange-700 dark:text-orange-400' } },
   { id: 'packer', label: 'Warehouse Packer', desc: 'Order Packaging and Shipping Staging', level: 10, styles: { text: 'text-orange-500 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-300/10', border: 'border-orange-200 dark:border-orange-300/20', badge: 'bg-orange-50 dark:bg-orange-300/20 text-orange-600 dark:text-orange-300' } },
   { id: 'receiver', label: 'Warehouse Receiving Specialist', desc: 'Dock Receiving and Inbound Verification', level: 10, styles: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10', border: 'border-cyan-200 dark:border-cyan-400/20', badge: 'bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-400' } },
   { id: 'driver', label: 'Delivery Driver', desc: 'Transport Delivery and Route Execution', level: 10, styles: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-400/10', border: 'border-slate-200 dark:border-slate-400/20', badge: 'bg-slate-100 dark:bg-slate-400/20 text-slate-700 dark:text-slate-400' } },
   { id: 'forklift_operator', label: 'Forklift Operator', desc: 'Material Handling and Pallet Racking', level: 10, styles: { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-400/10', border: 'border-gray-200 dark:border-gray-400/20', badge: 'bg-gray-100 dark:bg-gray-400/20 text-gray-700 dark:text-gray-400' } },
   { id: 'inventory_specialist', label: 'Inventory Control Specialist', desc: 'Stock Cycle Counting and Accuracy Control', level: 10, styles: { text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-50 dark:bg-amber-300/20 text-amber-700 dark:text-amber-300' } },
   { id: 'customer_service', label: 'Customer Service Representative', desc: 'Customer Inquiries and Return Resolution', level: 10, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'auditor', label: 'Internal Auditor', desc: 'Operational Compliance and Financial Risk Auditing', level: 9, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'it_support', label: 'IT Support Specialist', desc: 'Technical Support and Infrastructure Maintenance', level: 9, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'buyer', label: 'Procurement Buyer', desc: 'Supplier Quotes and Purchase Orders', level: 9, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'demand_planner', label: 'Demand Planner', desc: 'Inventory Forecasting and Capacity Planning', level: 9, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'replenishment_planner', label: 'Replenishment Planner', desc: 'Store Velocity and Stock Replenishment', level: 9, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },
   { id: 'customs_import_specialist', label: 'Customs and Import Specialist', desc: 'Cross-Border Freight and Customs Clearance', level: 9, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'inbound_qc_inspector', label: 'Quality Control Inspector', desc: 'Inbound Food Safety and Cold-Chain Compliance', level: 9, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'store_operations_auditor', label: 'Store Operations Auditor', desc: 'Field Operational and Compliance Audits', level: 9, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },

   // ═══ FUNCTIONAL SPECIALISTS & ADMINISTRATORS ═══
   { id: 'hr', label: 'Human Resources Officer', desc: 'Personnel Records and HR Administration', level: 3, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'pos', label: 'Point of Sale Cashier', desc: 'Register Checkout and Payment Processing', level: 10, styles: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/10', border: 'border-green-200 dark:border-green-400/20', badge: 'bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-green-400' } },
   { id: 'cs_manager', label: 'Customer Service Manager', desc: 'Customer Care and Support Operations', level: 7, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'store_supervisor', label: 'Store Supervisor', desc: 'Retail Floor and Customer Flow Supervision', level: 8, styles: { text: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-300/10', border: 'border-blue-200 dark:border-blue-300/20', badge: 'bg-blue-100 dark:bg-blue-300/20 text-blue-700 dark:text-blue-300' } },
   { id: 'dispatcher', label: 'Dispatcher', desc: 'Route Planning and Driver Scheduling', level: 9, styles: { text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-400/10', border: 'border-fuchsia-200 dark:border-fuchsia-400/20', badge: 'bg-fuchsia-100 dark:bg-fuchsia-400/20 text-fuchsia-700 dark:text-fuchsia-400' } },
   { id: 'returns_clerk', label: 'Returns Specialist', desc: 'Returned Goods Inspection and RMA Processing', level: 10, styles: { text: 'text-red-600 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-300/10', border: 'border-red-200 dark:border-red-300/20', badge: 'bg-red-100 dark:bg-red-300/20 text-red-700 dark:text-red-300' } },
   { id: 'merchandiser', label: 'Merchandiser', desc: 'Store Planogram and Display Execution', level: 10, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-100 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'loss_prevention', label: 'Loss Prevention Officer', desc: 'Store Shrinkage and Surveillance Monitoring', level: 9, styles: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-400/10', border: 'border-red-200 dark:border-red-400/20', badge: 'bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-400' } },
   { id: 'accountant', label: 'Accountant', desc: 'Financial Ledger and Balance Reconciliation', level: 9, styles: { text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-300/10', border: 'border-emerald-200 dark:border-emerald-300/20', badge: 'bg-emerald-100 dark:bg-emerald-300/20 text-emerald-700 dark:text-emerald-300' } },
   { id: 'data_analyst', label: 'Business Data Analyst', desc: 'Operational Reporting and Business Analytics', level: 9, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'training_coordinator', label: 'Training Coordinator', desc: 'Employee Training and Operational Onboarding', level: 9, styles: { text: 'text-yellow-600 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-300/10', border: 'border-yellow-200 dark:border-yellow-300/20', badge: 'bg-yellow-100 dark:bg-yellow-300/20 text-yellow-700 dark:text-yellow-300' } },
   { id: 'payroll_specialist', label: 'Payroll Specialist', desc: 'Employee Compensation and Statutory Benefits', level: 9, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'talent_recruiter', label: 'Talent Acquisition Specialist', desc: 'Candidate Sourcing and Recruitment', level: 9, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-50 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'hr_generalist', label: 'HR Generalist', desc: 'Employee case preparation and people operations support', level: 9, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-50 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'merchandising_specialist', label: 'Merchandising Specialist', desc: 'Country or regional assortment and campaign preparation', level: 9, styles: { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-50 dark:bg-amber-300/20 text-amber-800 dark:text-amber-300' } },
   { id: 'treasury_officer', label: 'Treasury Officer', desc: 'Cash Flow and Tender Reconciliation', level: 9, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'tax_compliance_officer', label: 'Tax Compliance Officer', desc: 'Sovereign Tax Filings and Statutory Compliance', level: 9, styles: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-400/10', border: 'border-teal-200 dark:border-teal-400/20', badge: 'bg-teal-100 dark:bg-teal-400/20 text-teal-700 dark:text-teal-400' } },
   { id: 'credit_control_officer', label: 'Credit Control Officer', desc: 'Commercial Credit and Accounts Receivable', level: 9, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },
];

export function getJobTitleForRole(role?: string | null): string {
   const normalizedRole = (role || '').trim().toLowerCase();
   if (normalizedRole === 'group_ceo') return 'Group Chief Executive Officer';
   if (normalizedRole === 'group_coo' || normalizedRole === 'coo') return 'Group Chief Operating Officer';
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
        'group_ceo': 100,
        'super_admin': 100,
        'CEO': 100,
        'ceo': 100,
        'group_coo': 99,
        'country_managing_director': 98,
        'admin': 98, // Country Managing Director (National Executive below Global CEO)

        // Level 2: Directors & Regional ("Head of...")
        'head_of_operations': 95,
        'regional_operations_manager': 90,
        'head_of_finance': 85,
        'head_of_hr': 85,
        'hr': 85, // Legacy HR
        'head_of_procurement': 82,
        'head_of_supply_chain': 82,
        'head_of_merchandising': 82,
        'head_of_it': 80,
        'head_of_audit': 80,
        'regional_procurement_manager': 81,
        'regional_finance_manager': 81,
        'regional_merchandising_manager': 81,
        'regional_hr_manager': 81,
        'regional_logistics_manager': 81,
        'regional_security_manager': 81,

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

    // Global CEO and Group COO can see everyone across operational facilities
    if (userRole === 'group_ceo' || userRole === 'group_coo' || userRole === 'super_admin' || userRole === 'ceo' || userRole === 'CEO') return true;

    // Country Managing Director and HR/Operations leadership can see anyone in their country except Global CEO & COO
    if ([
        'admin', 'country_managing_director',
        'hr', 'head_of_hr',
        'head_of_operations',
    ].includes(userRole)) {
        return targetRole !== 'group_ceo' && targetRole !== 'group_coo' && targetRole !== 'super_admin' && targetRole !== 'ceo' && targetRole !== 'CEO';
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
        'group_ceo', 'group_coo', 'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
        'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager',
        'head_of_operations',
        'head_of_finance',
        'head_of_procurement',
        'head_of_supply_chain',
        'head_of_merchandising',
        'head_of_audit',
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

    // Global CEO can employ anyone below CEO
    const normUserRole = (userRole || '').toLowerCase();
    const normCandidateRole = (candidateRole || '').toLowerCase();
    if (normUserRole === 'group_ceo' || normUserRole === 'super_admin' || normUserRole === 'ceo') {
        return normCandidateRole !== 'group_ceo' && normCandidateRole !== 'super_admin' && normCandidateRole !== 'ceo';
    }

    // Group COO can employ Country Managing Directors, Operations Directors, and subordinate staff
    if (normUserRole === 'group_coo') {
        return normCandidateRole !== 'group_ceo' && normCandidateRole !== 'super_admin' && normCandidateRole !== 'ceo' && normCandidateRole !== 'group_coo';
    }

    const userHierarchy = getRoleHierarchy(userRole);
    const candidateHierarchy = getRoleHierarchy(candidateRole);

    // Must be strictly below user in the role hierarchy rank
    if (candidateHierarchy >= userHierarchy) {
        return false;
    }

    const userLevel = SYSTEM_ROLES.find(r => r.id === userRole)?.level || 10;
    const candidateLevel = SYSTEM_ROLES.find(r => r.id === candidateRole)?.level || 10;

    // Specialists & Frontline Staff (Levels 9 & 10) have no hiring authority
    if (userLevel >= 9 || userHierarchy < 55) {
        return false;
    }

    // Corporate HQ Directors (Level 3) and Regional Operations Managers (Level 4) can ONLY be appointed by L1 CEO/COO or L2 Country Managing Director
    if (candidateLevel <= 4 && userLevel > 2) {
        return false;
    }

    // Facility Captains (store_manager, warehouse_manager at Level 6) can ONLY be hired by Executive Leadership, Head of Operations, Regional Operations Manager, or HR Leadership
    const isFacilityCaptain = candidateRole === 'store_manager' || candidateRole === 'warehouse_manager';
    if (isFacilityCaptain) {
        return [
            'group_ceo', 'group_coo', 'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
            'head_of_operations',
            'head_of_supply_chain',
            'regional_operations_manager', 'regional_hr_manager',
            'head_of_hr', 'hr'
        ].includes(userRole as string);
    }

    // Regional Department Managers (Level 5, hierarchy 81) can be employed by Executive Leadership, Operations Director, Regional Operations Manager, HR Leadership, or their Corporate Directorate Head
    const isRegionalDepartmentManager = [
        'regional_procurement_manager',
        'regional_merchandising_manager',
        'regional_finance_manager',
        'regional_hr_manager',
        'regional_logistics_manager',
        'regional_security_manager'
    ].includes(candidateRole as string);
    if (isRegionalDepartmentManager) {
        return [
            'group_ceo', 'group_coo', 'super_admin', 'ceo', 'CEO', 'admin', 'country_managing_director',
            'head_of_operations',
            'regional_operations_manager',
            'head_of_hr', 'hr',
            'head_of_procurement',
            'head_of_finance',
            'head_of_merchandising',
            'head_of_supply_chain',
            'head_of_audit', 'head_of_it',
        ].includes(userRole as string);
    }

    // Managers (Levels 1-8) can ONLY employ roles at a strictly lower hierarchy level (candidateLevel > userLevel)
    if (candidateLevel <= userLevel) {
        return false;
    }

    return true;
};

// Canonical list of Levels 1 through 8 managerial & leadership roles for selective egress loading
export const MANAGERIAL_ROLES: readonly string[] = [
    'group_ceo',
    'group_coo',
    'super_admin',
    'admin',
    'country_managing_director',
    'CEO',
    'ceo',
    'regional_operations_manager',
    'regional_procurement_manager',
    'regional_finance_manager',
    'regional_merchandising_manager',
    'regional_hr_manager',
    'regional_logistics_manager',
    'regional_security_manager',
    'head_of_operations',
    'head_of_finance',
    'head_of_hr',
    'hr',
    'head_of_procurement',
    'head_of_supply_chain',
    'head_of_merchandising',
    'head_of_it',
    'head_of_audit',
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

