import type { StagingSiteType } from '../../utils/stagingQuickLogin';

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
  switch (type) {
    case 'Store':
      return {
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        nameColor: 'text-emerald-800 dark:text-emerald-300',
        badge: 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
        countBadge: 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 border-emerald-500/40',
        borderLeft: 'border-l-4 border-l-emerald-500',
        borderCard: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50',
        bgLight: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.05]',
        label: 'Retail Store',
        shortLabel: 'Store',
      };
    case 'Warehouse':
      return {
        iconColor: 'text-amber-700 dark:text-amber-400',
        nameColor: 'text-amber-800 dark:text-amber-300',
        badge: 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-amber-500/30',
        countBadge: 'bg-amber-500/20 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 border-amber-500/40',
        borderLeft: 'border-l-4 border-l-amber-500',
        borderCard: 'hover:border-amber-500/50 dark:hover:border-amber-400/50',
        bgLight: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.05]',
        label: 'Warehouse',
        shortLabel: 'WH',
      };
    case 'Distribution Center':
      return {
        iconColor: 'text-cyan-700 dark:text-cyan-400',
        nameColor: 'text-cyan-800 dark:text-cyan-300',
        badge: 'bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-800 dark:text-cyan-300 border-cyan-500/30',
        countBadge: 'bg-cyan-500/20 dark:bg-cyan-500/30 text-cyan-900 dark:text-cyan-200 border-cyan-500/40',
        borderLeft: 'border-l-4 border-l-cyan-500',
        borderCard: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50',
        bgLight: 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.05]',
        label: 'Distribution Center',
        shortLabel: 'DC',
      };
    case 'Regional Administration':
      return {
        iconColor: 'text-violet-700 dark:text-violet-400',
        nameColor: 'text-violet-800 dark:text-violet-300',
        badge: 'bg-violet-500/15 dark:bg-violet-500/25 text-violet-800 dark:text-violet-300 border-violet-500/30',
        countBadge: 'bg-violet-500/20 dark:bg-violet-500/30 text-violet-900 dark:text-violet-200 border-violet-500/40',
        borderLeft: 'border-l-4 border-l-violet-500',
        borderCard: 'hover:border-violet-500/50 dark:hover:border-violet-400/50',
        bgLight: 'bg-violet-500/[0.04] dark:bg-violet-500/[0.05]',
        label: 'Regional Admin',
        shortLabel: 'Regional',
      };
    case 'HQ':
    default:
      return {
        iconColor: 'text-purple-700 dark:text-purple-400',
        nameColor: 'text-purple-800 dark:text-purple-300',
        badge: 'bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-300 border-purple-500/30',
        countBadge: 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-900 dark:text-purple-200 border-purple-500/40',
        borderLeft: 'border-l-4 border-l-purple-500',
        borderCard: 'hover:border-purple-500/50 dark:hover:border-purple-400/50',
        bgLight: 'bg-purple-500/[0.04] dark:bg-purple-500/[0.05]',
        label: 'Headquarters',
        shortLabel: 'HQ',
      };
  }
}

export const POPULAR_ROLE_CHIPS = [
  { id: 'store_manager', label: 'Store Manager' },
  { id: 'warehouse_manager', label: 'Warehouse Manager' },
  { id: 'regional_operations_manager', label: 'Regional Ops' },
  { id: 'cashier', label: 'Cashier' },
  { id: 'picker', label: 'Picker' },
  { id: 'packer', label: 'Packer' },
  { id: 'driver', label: 'Driver' },
  { id: 'receiver', label: 'Receiver' },
  { id: 'accountant', label: 'Finance' },
] as const;
