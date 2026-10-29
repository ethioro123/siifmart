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
  switch (type) {
    case 'Store':
      return {
        iconColor: 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]',
        nameColor: 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]',
        badge: 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
        countBadge: 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
        borderLeft: 'border-l-4 border-l-emerald-500',
        borderCard: 'border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)]',
        bgLight: 'bg-[var(--theme-status-success-bg)]/[0.04] bg-[var(--theme-status-success-bg)]/[0.05]',
        label: 'Retail Store',
        shortLabel: 'Store',
      };
    case 'Warehouse':
      return {
        iconColor: 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
        nameColor: 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
        badge: 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
        countBadge: 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
        borderLeft: 'border-l-4 border-l-amber-500',
        borderCard: 'border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]',
        bgLight: 'bg-[var(--theme-status-warning-bg)]/[0.04] bg-[var(--theme-status-warning-bg)]/[0.05]',
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

export const WORK_LOCATION_ORDER: Record<StagingSiteType, number> = {
  'HQ': 1,
  'Regional Administration': 2,
  'Distribution Center': 3,
  'Warehouse': 4,
  'Store': 5,
};

const MANAGER_AND_DIRECTOR_ROLE_CHIPS = SYSTEM_ROLES
  .filter(role => /\b(manager|director)\b/i.test(role.label))
  .map(({ id, label }) => ({ id, label }));

export const POPULAR_ROLE_CHIPS = [
  ...MANAGER_AND_DIRECTOR_ROLE_CHIPS,
  { id: 'cashier', label: 'Cashier' },
  { id: 'picker', label: 'Picker' },
  { id: 'packer', label: 'Packer' },
  { id: 'driver', label: 'Driver' },
  { id: 'receiver', label: 'Receiver' },
] as const;
