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
