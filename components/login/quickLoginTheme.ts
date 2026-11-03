import type { StagingSiteType } from '../../utils/stagingQuickLogin';
import { SYSTEM_ROLES } from '../../utils/roles';

export interface SiteTheme {
  iconColor: string;
  nameColor: string;
  badge: string;
  countBadge: string;
  borderLeft: string;
  borderCard: string;
  bgLight: string;
  label: string;
  shortLabel: string;
}

export function getSiteTheme(type: StagingSiteType): SiteTheme {
  const themes: Record<StagingSiteType, Omit<SiteTheme, 'label' | 'shortLabel'>> = {
    Store: {
      iconColor: 'text-[var(--theme-status-success-text)]', nameColor: 'text-[var(--theme-text-primary)]',
      badge: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
      countBadge: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
      borderLeft: 'border-l-4 border-l-[var(--theme-status-success-border)]', borderCard: 'border-[var(--theme-status-success-border)]', bgLight: 'bg-[var(--theme-status-success-bg)]'
    },
    Warehouse: {
      iconColor: 'text-[var(--theme-status-warning-text)]', nameColor: 'text-[var(--theme-text-primary)]',
      badge: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
      countBadge: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
      borderLeft: 'border-l-4 border-l-[var(--theme-status-warning-border)]', borderCard: 'border-[var(--theme-status-warning-border)]', bgLight: 'bg-[var(--theme-status-warning-bg)]'
    },
    'Distribution Center': {
      iconColor: 'text-[var(--theme-status-info-text)]', nameColor: 'text-[var(--theme-text-primary)]',
      badge: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]',
      countBadge: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]',
      borderLeft: 'border-l-4 border-l-[var(--theme-status-info-border)]', borderCard: 'border-[var(--theme-status-info-border)]', bgLight: 'bg-[var(--theme-status-info-bg)]'
    },
    'Regional Administration': {
      iconColor: 'text-[var(--theme-chart-4)]', nameColor: 'text-[var(--theme-text-primary)]',
      badge: 'bg-[var(--theme-chart-4)]/10 text-[var(--theme-chart-4)] border-[var(--theme-chart-4)]/30',
      countBadge: 'bg-[var(--theme-chart-4)]/10 text-[var(--theme-chart-4)] border-[var(--theme-chart-4)]/30',
      borderLeft: 'border-l-4 border-l-[var(--theme-chart-4)]', borderCard: 'border-[var(--theme-chart-4)]/30', bgLight: 'bg-[var(--theme-chart-4)]/10'
    },
    HQ: {
      iconColor: 'text-[var(--theme-accent)]', nameColor: 'text-[var(--theme-text-primary)]',
      badge: 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-[var(--theme-border-focus)]',
      countBadge: 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-[var(--theme-border-focus)]',
      borderLeft: 'border-l-4 border-l-[var(--theme-accent)]', borderCard: 'border-[var(--theme-border-focus)]', bgLight: 'bg-[var(--theme-accent-muted)]'
    }
  };
  const labels: Record<StagingSiteType, [string, string]> = {
    Store: ['Retail Store', 'Store'], Warehouse: ['Warehouse', 'WH'],
    'Distribution Center': ['Distribution Center', 'DC'],
    'Regional Administration': ['Regional Admin', 'Regional'], HQ: ['Headquarters', 'HQ']
  };
  const theme = themes[type] || themes.HQ;
  const [label, shortLabel] = labels[type] || labels.HQ;
  return { ...theme, label, shortLabel };
}

export const WORK_LOCATION_ORDER: Record<StagingSiteType, number> = {
  'HQ': 1,
  'Regional Administration': 2,
  'Distribution Center': 3,
  'Warehouse': 4,
  'Store': 5,
};

export const ROLE_PRIORITY_ORDER: Record<string, number> = {
  // Level 1-3 Corporate Leadership
  group_ceo: 1, country_managing_director: 2, country_finance_director: 3,
  country_operations_director: 4, country_supply_chain_director: 5,
  // Level 4-5 Regional Administration Leadership (Finance & Operations paramount for transfers & approvals)
  regional_operations_manager: 10,
  regional_finance_manager: 11,
  regional_supply_chain_manager: 12,
  regional_procurement_manager: 13,
  area_operations_manager: 14,
  regional_merchandising_manager: 15,
  regional_logistics_manager: 16,
  regional_security_manager: 17,
  regional_hr_manager: 18,
  regional_compliance_manager: 19,
  regional_it_manager: 20,
  // Facility Leadership
  store_manager: 30, warehouse_manager: 31, dispatch_supervisor: 32, inventory_manager: 33,
  assistant_store_manager: 34, shift_supervisor: 35,
  // Accounting & Procurement
  accountant: 40, buyer: 41,
  // Floor Operations
  cashier: 50, receiver: 51, picker: 52, packer: 53, driver: 54, inventory_specialist: 55, forklift_operator: 56, stock_clerk: 57,
};

export function compareStagingAccounts(
  a: { level: number; roleId: string; name: string },
  b: { level: number; roleId: string; name: string }
): number {
  if (a.level !== b.level) return a.level - b.level;
  const prioA = ROLE_PRIORITY_ORDER[a.roleId] ?? 99;
  const prioB = ROLE_PRIORITY_ORDER[b.roleId] ?? 99;
  if (prioA !== prioB) return prioA - prioB;
  return a.name.localeCompare(b.name);
}

export const POPULAR_ROLE_CHIPS = [
  // 1. Regional Administration Leadership (Approvals, Transfers, Finance)
  { id: 'regional_finance_manager', label: 'Regional Finance Mgr' },
  { id: 'regional_operations_manager', label: 'Regional Ops Mgr' },
  { id: 'area_operations_manager', label: 'Area Ops Mgr' },
  { id: 'regional_supply_chain_manager', label: 'Regional Supply Chain' },
  { id: 'regional_procurement_manager', label: 'Regional Procurement' },
  // 2. Operational Facility Management
  { id: 'store_manager', label: 'Store Manager' },
  { id: 'warehouse_manager', label: 'Warehouse Manager' },
  { id: 'dispatch_supervisor', label: 'Dispatch Supervisor' },
  { id: 'inventory_manager', label: 'Inventory Manager' },
  // 3. Accounting & Store / Floor Staff
  { id: 'accountant', label: 'Accountant' },
  { id: 'cashier', label: 'Cashier' },
  { id: 'picker', label: 'Picker' },
  { id: 'packer', label: 'Packer' },
  { id: 'driver', label: 'Driver' },
  { id: 'receiver', label: 'Receiver' },
  { id: 'forklift_operator', label: 'Forklift' },
  // 4. Country Directorate
  { id: 'country_managing_director', label: 'Country Director' },
  { id: 'country_finance_director', label: 'Country Finance Dir' },
  { id: 'country_operations_director', label: 'Country Ops Dir' },
] as const;
