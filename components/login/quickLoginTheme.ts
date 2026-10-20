import type { StagingSiteType } from '../../utils/stagingQuickLogin';

export interface SiteTheme {
  iconColor: string;
  badge: string;
  borderLeft: string;
  bgLight: string;
  label: string;
  shortLabel: string;
}

export interface RoleTheme {
  badge: string;
  dot: string;
  borderHover: string;
  text: string;
  label: string;
}

export function getSiteTheme(type: StagingSiteType): SiteTheme {
  switch (type) {
    case 'Store':
      return {
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
        borderLeft: 'border-l-4 border-l-emerald-500',
        bgLight: 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04]',
        label: 'Retail Store',
        shortLabel: 'Store',
      };
    case 'Warehouse':
      return {
        iconColor: 'text-amber-700 dark:text-amber-400',
        badge: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30',
        borderLeft: 'border-l-4 border-l-amber-500',
        bgLight: 'bg-amber-500/[0.03] dark:bg-amber-500/[0.04]',
        label: 'Warehouse',
        shortLabel: 'WH',
      };
    case 'Distribution Center':
      return {
        iconColor: 'text-cyan-700 dark:text-cyan-400',
        badge: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/30',
        borderLeft: 'border-l-4 border-l-cyan-500',
        bgLight: 'bg-cyan-500/[0.03] dark:bg-cyan-500/[0.04]',
        label: 'Distribution Center',
        shortLabel: 'DC',
      };
    case 'Online Store':
      return {
        iconColor: 'text-rose-700 dark:text-rose-400',
        badge: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30',
        borderLeft: 'border-l-4 border-l-rose-500',
        bgLight: 'bg-rose-500/[0.03] dark:bg-rose-500/[0.04]',
        label: 'Online / Dark Store',
        shortLabel: 'Online',
      };
    case 'Regional Administration':
      return {
        iconColor: 'text-violet-700 dark:text-violet-400',
        badge: 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-500/30',
        borderLeft: 'border-l-4 border-l-violet-500',
        bgLight: 'bg-violet-500/[0.03] dark:bg-violet-500/[0.04]',
        label: 'Regional Admin',
        shortLabel: 'Regional',
      };
    case 'HQ':
    default:
      return {
        iconColor: 'text-purple-700 dark:text-purple-400',
        badge: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/30',
        borderLeft: 'border-l-4 border-l-purple-500',
        bgLight: 'bg-purple-500/[0.03] dark:bg-purple-500/[0.04]',
        label: 'Headquarters',
        shortLabel: 'HQ',
      };
  }
}

export function getRoleTheme(roleId: string): RoleTheme {
  const normalized = roleId.toLowerCase();

  // Cashier & POS (Emerald)
  if (['cashier', 'pos'].includes(normalized)) {
    return {
      badge: 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-500/30',
      dot: 'bg-emerald-500',
      borderHover: 'hover:border-emerald-500/60 dark:hover:border-emerald-400/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      label: 'Cashier',
    };
  }

  // Pickers (Orange)
  if (normalized === 'picker') {
    return {
      badge: 'bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-200 border-orange-500/30',
      dot: 'bg-orange-500',
      borderHover: 'hover:border-orange-500/60 dark:hover:border-orange-400/60',
      text: 'text-orange-700 dark:text-orange-300',
      label: 'Picker',
    };
  }

  // Packers (Amber)
  if (normalized === 'packer') {
    return {
      badge: 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200 border-amber-500/30',
      dot: 'bg-amber-500',
      borderHover: 'hover:border-amber-500/60 dark:hover:border-amber-400/60',
      text: 'text-amber-700 dark:text-amber-300',
      label: 'Packer',
    };
  }

  // Receivers & Quality Control (Cyan)
  if (['receiver', 'inbound_qc_inspector'].includes(normalized)) {
    return {
      badge: 'bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-800 dark:text-cyan-200 border-cyan-500/30',
      dot: 'bg-cyan-500',
      borderHover: 'hover:border-cyan-500/60 dark:hover:border-cyan-400/60',
      text: 'text-cyan-700 dark:text-cyan-300',
      label: 'Receiver',
    };
  }

  // Drivers (Blue)
  if (normalized === 'driver') {
    return {
      badge: 'bg-blue-500/15 dark:bg-blue-500/25 text-blue-800 dark:text-blue-200 border-blue-500/30',
      dot: 'bg-blue-500',
      borderHover: 'hover:border-blue-500/60 dark:hover:border-blue-400/60',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Driver',
    };
  }

  // Inventory & Stock Clerks (Yellow)
  if (['stock_clerk', 'inventory_specialist', 'inventory_manager'].includes(normalized)) {
    return {
      badge: 'bg-yellow-500/15 dark:bg-yellow-500/25 text-yellow-800 dark:text-yellow-200 border-yellow-500/30',
      dot: 'bg-yellow-500',
      borderHover: 'hover:border-yellow-500/60 dark:hover:border-yellow-400/60',
      text: 'text-yellow-700 dark:text-yellow-300',
      label: 'Inventory',
    };
  }

  // Store & Warehouse Managers, Leads (Indigo)
  if (['store_manager', 'assistant_manager', 'warehouse_manager', 'shift_lead', 'store_supervisor'].includes(normalized)) {
    return {
      badge: 'bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200 border-indigo-500/30',
      dot: 'bg-indigo-500',
      borderHover: 'hover:border-indigo-500/60 dark:hover:border-indigo-400/60',
      text: 'text-indigo-700 dark:text-indigo-300',
      label: 'Manager',
    };
  }

  // Logistics, Dispatch, Forklift (Sky)
  if (['logistics_manager', 'dispatch_manager', 'dispatcher', 'regional_logistics_lead', 'fleet_maintenance_supervisor', 'forklift_operator'].includes(normalized)) {
    return {
      badge: 'bg-sky-500/15 dark:bg-sky-500/25 text-sky-800 dark:text-sky-200 border-sky-500/30',
      dot: 'bg-sky-500',
      borderHover: 'hover:border-sky-500/60 dark:hover:border-sky-400/60',
      text: 'text-sky-700 dark:text-sky-300',
      label: 'Logistics',
    };
  }

  // Finance & Accounting (Teal)
  if (['finance_manager', 'regional_finance_officer', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'].includes(normalized)) {
    return {
      badge: 'bg-teal-500/15 dark:bg-teal-500/25 text-teal-800 dark:text-teal-200 border-teal-500/30',
      dot: 'bg-teal-500',
      borderHover: 'hover:border-teal-500/60 dark:hover:border-teal-400/60',
      text: 'text-teal-700 dark:text-teal-300',
      label: 'Finance',
    };
  }

  // Procurement & Buying (Violet)
  if (['procurement_manager', 'regional_procurement_lead', 'supply_chain_manager', 'buyer', 'vendor_relations_manager', 'demand_planner', 'replenishment_planner', 'customs_import_specialist'].includes(normalized)) {
    return {
      badge: 'bg-violet-500/15 dark:bg-violet-500/25 text-violet-800 dark:text-violet-200 border-violet-500/30',
      dot: 'bg-violet-500',
      borderHover: 'hover:border-violet-500/60 dark:hover:border-violet-400/60',
      text: 'text-violet-700 dark:text-violet-300',
      label: 'Procurement',
    };
  }

  // Sales & Merchandising & Customer Service (Fuchsia)
  if (['sales_associate', 'merchandiser', 'merchandising_manager', 'customer_service', 'cs_manager', 'returns_clerk'].includes(normalized)) {
    return {
      badge: 'bg-fuchsia-500/15 dark:bg-fuchsia-500/25 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-500/30',
      dot: 'bg-fuchsia-500',
      borderHover: 'hover:border-fuchsia-500/60 dark:hover:border-fuchsia-400/60',
      text: 'text-fuchsia-700 dark:text-fuchsia-300',
      label: 'Sales/Service',
    };
  }

  // HR & Training (Pink)
  if (['hr_manager', 'regional_hr_officer', 'hr', 'payroll_specialist', 'talent_recruiter', 'training_coordinator'].includes(normalized)) {
    return {
      badge: 'bg-pink-500/15 dark:bg-pink-500/25 text-pink-800 dark:text-pink-200 border-pink-500/30',
      dot: 'bg-pink-500',
      borderHover: 'hover:border-pink-500/60 dark:hover:border-pink-400/60',
      text: 'text-pink-700 dark:text-pink-300',
      label: 'HR',
    };
  }

  // Security & Loss Prevention & Auditing (Rose)
  if (['security_manager', 'regional_security_supervisor', 'loss_prevention', 'auditor', 'store_operations_auditor'].includes(normalized)) {
    return {
      badge: 'bg-rose-500/15 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 border-rose-500/30',
      dot: 'bg-rose-500',
      borderHover: 'hover:border-rose-500/60 dark:hover:border-rose-400/60',
      text: 'text-rose-700 dark:text-rose-300',
      label: 'Security/Audit',
    };
  }

  // Executive & Directors (Purple)
  if (['super_admin', 'ceo', 'admin', 'operations_manager', 'regional_manager'].includes(normalized)) {
    return {
      badge: 'bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-200 border-purple-500/30',
      dot: 'bg-purple-500',
      borderHover: 'hover:border-purple-500/60 dark:hover:border-purple-400/60',
      text: 'text-purple-700 dark:text-purple-300',
      label: 'Executive',
    };
  }

  // IT & Data (Slate)
  if (['it_support', 'data_analyst'].includes(normalized)) {
    return {
      badge: 'bg-slate-500/15 dark:bg-slate-500/25 text-slate-800 dark:text-slate-200 border-slate-500/30',
      dot: 'bg-slate-500',
      borderHover: 'hover:border-slate-500/60 dark:hover:border-slate-400/60',
      text: 'text-slate-700 dark:text-slate-300',
      label: 'IT/Data',
    };
  }

  // Neutral Fallback
  return {
    badge: 'bg-stone-500/15 dark:bg-stone-500/25 text-stone-800 dark:text-stone-200 border-stone-500/30',
    dot: 'bg-stone-500',
    borderHover: 'hover:border-stone-500/60 dark:hover:border-stone-400/60',
    text: 'text-stone-700 dark:text-stone-300',
    label: roleId.replace(/_/g, ' '),
  };
}

export const POPULAR_ROLE_CHIPS = [
  { id: 'cashier', label: 'Cashier' },
  { id: 'store_manager', label: 'Store Mgr' },
  { id: 'picker', label: 'Picker' },
  { id: 'packer', label: 'Packer' },
  { id: 'warehouse_manager', label: 'WH Mgr' },
  { id: 'driver', label: 'Driver' },
  { id: 'receiver', label: 'Receiver' },
  { id: 'inventory_specialist', label: 'Inventory' },
  { id: 'admin', label: 'Admin' },
] as const;
