import { UserRole } from '../types';

export const SYSTEM_ROLES: {
   id: UserRole,
   label: string,
   desc: string,
   level: number,
   styles: { text: string, bg: string, border: string, badge: string }
}[] = [
   // ═══ LEVEL 1 - EXECUTIVE ═══
   { id: 'super_admin', label: 'CEO', desc: 'Unrestricted Access (Owner)', level: 1, styles: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-400/10', border: 'border-yellow-200 dark:border-yellow-400/20', badge: 'bg-yellow-100 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-400' } },

   // ═══ LEVEL 2 - REGIONAL/DIRECTORS ═══
   { id: 'regional_manager', label: 'Regional Manager', desc: 'Multi-Store Oversight', level: 2, styles: { text: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-500' } },
   { id: 'operations_manager', label: 'Operations Manager', desc: 'HQ Operations', level: 2, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'finance_manager', label: 'Finance Manager', desc: 'Financial Oversight', level: 2, styles: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20', badge: 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' } },
   { id: 'hr_manager', label: 'HR Manager', desc: 'Staff & Payroll Management', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'procurement_manager', label: 'Procurement Manager', desc: 'Supply Chain & Purchasing', level: 2, styles: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-400/10', border: 'border-indigo-200 dark:border-indigo-400/20', badge: 'bg-indigo-100 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400' } },
   { id: 'supply_chain_manager', label: 'Supply Chain Manager', desc: 'End-to-End Logistics', level: 2, styles: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/20', badge: 'bg-violet-100 dark:bg-violet-400/20 text-violet-700 dark:text-violet-400' } },

   // ═══ LEVEL 3 - SITE MANAGERS ═══
   { id: 'store_manager', label: 'Store Manager', desc: 'Single Store Operations', level: 3, styles: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-400/10', border: 'border-teal-200 dark:border-teal-400/20', badge: 'bg-teal-100 dark:bg-teal-400/20 text-teal-700 dark:text-teal-400' } },
   { id: 'warehouse_manager', label: 'Warehouse Manager', desc: 'Warehouse Operations Lead', level: 3, styles: { text: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', badge: 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-500' } },
   { id: 'dispatch_manager', label: 'Dispatch Manager', desc: 'Fleet & Delivery Management', level: 3, styles: { text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-400/10', border: 'border-lime-200 dark:border-lime-400/20', badge: 'bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400' } },
   { id: 'assistant_manager', label: 'Assistant Manager', desc: 'Deputy Management', level: 3, styles: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10', border: 'border-cyan-200 dark:border-cyan-400/20', badge: 'bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-400' } },
   { id: 'shift_lead', label: 'Shift Lead', desc: 'Team Lead', level: 3, styles: { text: 'text-blue-600 dark:text-blue-200', bg: 'bg-blue-50 dark:bg-blue-200/10', border: 'border-blue-200 dark:border-blue-200/20', badge: 'bg-blue-50 dark:bg-blue-200/20 text-blue-700 dark:text-blue-200' } },

   // ═══ LEVEL 4 - STAFF ═══
   { id: 'cashier', label: 'Cashier', desc: 'POS Operations', level: 4, styles: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/10', border: 'border-green-200 dark:border-green-400/20', badge: 'bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-green-400' } },
   { id: 'sales_associate', label: 'Sales Associate', desc: 'Floor Sales', level: 4, styles: { text: 'text-green-600 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-300/10', border: 'border-green-200 dark:border-green-300/20', badge: 'bg-green-50 dark:bg-green-300/20 text-green-700 dark:text-green-300' } },
   { id: 'stock_clerk', label: 'Stock Clerk', desc: 'Shelving & Stocking', level: 4, styles: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20', badge: 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400' } },
   { id: 'picker', label: 'Picker', desc: 'Order Picking', level: 4, styles: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-400/10', border: 'border-orange-200 dark:border-orange-400/20', badge: 'bg-orange-100 dark:bg-orange-400/20 text-orange-700 dark:text-orange-400' } },
   { id: 'packer', label: 'Packer', desc: 'Order Packing', level: 4, styles: { text: 'text-orange-500 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-300/10', border: 'border-orange-200 dark:border-orange-300/20', badge: 'bg-orange-50 dark:bg-orange-300/20 text-orange-600 dark:text-orange-300' } },
   { id: 'receiver', label: 'Receiver', desc: 'Goods Receiving', level: 4, styles: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10', border: 'border-cyan-200 dark:border-cyan-400/20', badge: 'bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-400' } },
   { id: 'driver', label: 'Driver', desc: 'Delivery', level: 4, styles: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-400/10', border: 'border-slate-200 dark:border-slate-400/20', badge: 'bg-slate-100 dark:bg-slate-400/20 text-slate-700 dark:text-slate-400' } },
   { id: 'forklift_operator', label: 'Forklift Operator', desc: 'Equipment Operator', level: 4, styles: { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-400/10', border: 'border-gray-200 dark:border-gray-400/20', badge: 'bg-gray-100 dark:bg-gray-400/20 text-gray-700 dark:text-gray-400' } },
   { id: 'inventory_specialist', label: 'Inventory Specialist', desc: 'Stock Control', level: 4, styles: { text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-300/10', border: 'border-amber-200 dark:border-amber-300/20', badge: 'bg-amber-50 dark:bg-amber-300/20 text-amber-700 dark:text-amber-300' } },
   { id: 'customer_service', label: 'Customer Service', desc: 'Returns & Inquiries', level: 4, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'auditor', label: 'Auditor', desc: 'Compliance & Audit', level: 4, styles: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-400/20', badge: 'bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400' } },
   { id: 'it_support', label: 'IT Support', desc: 'Technical Assistance', level: 4, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },

   // ═══ LEGACY ROLES (backwards compatibility) ═══
   { id: 'admin', label: 'Assistant CEO', desc: 'System Admin', level: 2, styles: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-400/10', border: 'border-purple-200 dark:border-purple-400/20', badge: 'bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-400' } },
   { id: 'manager', label: 'Manager (Legacy)', desc: 'Department Manager', level: 3, styles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20', badge: 'bg-blue-100 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400' } },
   { id: 'hr', label: 'HR Admin', desc: 'Human Resources', level: 2, styles: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-400/10', border: 'border-pink-200 dark:border-pink-400/20', badge: 'bg-pink-100 dark:bg-pink-400/20 text-pink-700 dark:text-pink-400' } },
   { id: 'pos', label: 'POS Staff (Legacy)', desc: 'Point of Sale', level: 4, styles: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/10', border: 'border-green-200 dark:border-green-400/20', badge: 'bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-green-400' } },
   { id: 'cs_manager', label: 'CS Manager', desc: 'Customer Service Lead', level: 3, styles: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-400/10', border: 'border-sky-200 dark:border-sky-400/20', badge: 'bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-400' } },
   { id: 'store_supervisor', label: 'Store Supervisor', desc: 'Floor Management', level: 3, styles: { text: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-300/10', border: 'border-blue-200 dark:border-blue-300/20', badge: 'bg-blue-100 dark:bg-blue-300/20 text-blue-700 dark:text-blue-300' } },
   { id: 'dispatcher', label: 'Dispatcher', desc: 'Logistics Coordination', level: 4, styles: { text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-400/10', border: 'border-fuchsia-200 dark:border-fuchsia-400/20', badge: 'bg-fuchsia-100 dark:bg-fuchsia-400/20 text-fuchsia-700 dark:text-fuchsia-400' } },
   { id: 'returns_clerk', label: 'Returns Clerk', desc: 'Returns & RMA Processing', level: 4, styles: { text: 'text-red-600 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-300/10', border: 'border-red-200 dark:border-red-300/20', badge: 'bg-red-100 dark:bg-red-300/20 text-red-700 dark:text-red-300' } },
   { id: 'merchandiser', label: 'Merchandiser', desc: 'Displays & Planograms', level: 4, styles: { text: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-300/10', border: 'border-pink-200 dark:border-pink-300/20', badge: 'bg-pink-100 dark:bg-pink-300/20 text-pink-700 dark:text-pink-300' } },
   { id: 'loss_prevention', label: 'Loss Prevention', desc: 'Security & Shrinkage', level: 4, styles: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-400/10', border: 'border-red-200 dark:border-red-400/20', badge: 'bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-400' } },
   { id: 'accountant', label: 'Accountant', desc: 'Financial Records', level: 4, styles: { text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-300/10', border: 'border-emerald-200 dark:border-emerald-300/20', badge: 'bg-emerald-100 dark:bg-emerald-300/20 text-emerald-700 dark:text-emerald-300' } },
   { id: 'data_analyst', label: 'Data Analyst', desc: 'Reports & Analytics', level: 4, styles: { text: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-300/10', border: 'border-purple-200 dark:border-purple-300/20', badge: 'bg-purple-100 dark:bg-purple-300/20 text-purple-700 dark:text-purple-300' } },
   { id: 'training_coordinator', label: 'Training Coordinator', desc: 'Employee Training', level: 4, styles: { text: 'text-yellow-600 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-300/10', border: 'border-yellow-200 dark:border-yellow-300/20', badge: 'bg-yellow-100 dark:bg-yellow-300/20 text-yellow-700 dark:text-yellow-300' } },
];

export const getRoleHierarchy = (role: UserRole | string): number => {
    const hierarchy: Partial<Record<UserRole | string, number>> = {
        // Level 1: Executive
        'super_admin': 100,

        // Level 2: Directors & Regional
        'regional_manager': 95,
        'operations_manager': 90,
        'admin': 90, // Legacy admin
        'finance_manager': 85,
        'hr_manager': 85,
        'hr': 85, // Legacy HR
        'procurement_manager': 82,
        'supply_chain_manager': 80,

        // Level 3: Site Managers & Department Heads
        'store_manager': 70,
        'warehouse_manager': 68,
        'dispatch_manager': 65,
        'manager': 65, // Legacy generic manager
        'cs_manager': 60,
        'assistant_manager': 60,
        'store_supervisor': 55,
        'shift_lead': 55,

        // Support & Supervisors
        'auditor': 40,
        'accountant': 35,
        'data_analyst': 35,
        'training_coordinator': 35,
        'it_support': 35,
        'dispatcher': 35,

        // Level 4: Staff
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
