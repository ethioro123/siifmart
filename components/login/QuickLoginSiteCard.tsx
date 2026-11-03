import React from 'react';
import { UserCheck } from 'lucide-react';
import type { StagingQuickAccount, StagingSiteType, FacilityTierType } from '../../utils/stagingQuickLogin';
import { getSiteTheme } from './quickLoginTheme';

export interface QuickLoginSiteGroup {
  siteCode: string;
  siteName: string;
  siteType: StagingSiteType;
  facilityTier: FacilityTierType;
  regionCode?: string;
  regionName?: string;
  accounts: StagingQuickAccount[];
}

interface QuickLoginSiteCardProps {
  site: QuickLoginSiteGroup;
  disabled?: boolean;
  onSelectAccount: (email: string) => void;
  getSiteIcon: (type: StagingSiteType, iconColor: string) => React.ReactNode;
  getLevelBadgeStyle: (level: number) => string;
}

export function QuickLoginSiteCard({
  site,
  disabled = false,
  onSelectAccount,
  getSiteIcon,
  getLevelBadgeStyle,
}: QuickLoginSiteCardProps) {
  const siteTheme = getSiteTheme(site.siteType);

  return (
    <div
      className={`rounded-2xl border border-[var(--theme-border)] ${siteTheme.borderLeft} ${siteTheme.bgLight} p-2.5 space-y-2 transition-all`}
    >
      {/* Site Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="p-1 rounded-md bg-[var(--theme-bg-subtle)] shadow-xs">
            {getSiteIcon(site.siteType, siteTheme.iconColor)}
          </span>
          <span className={`text-[11.5px] font-bold ${siteTheme.nameColor} truncate`}>
            {site.siteName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {site.regionCode && (
            <span
              title={site.regionName ? `${site.regionName} Region (${site.regionCode})` : `Region: ${site.regionCode}`}
              className="text-[8px] font-bold px-1.5 py-0.2 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-mono"
            >
              {site.regionCode}
            </span>
          )}
          <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-md border ${siteTheme.badge}`}>
            {siteTheme.shortLabel}
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${siteTheme.countBadge}`}>
            {site.accounts.length} {site.accounts.length === 1 ? 'Worker' : 'Workers'}
          </span>
          <span className="text-[9px] font-mono tabular-nums font-semibold text-[var(--theme-text-muted)]">
            {site.siteCode}
          </span>
        </div>
      </div>

      {/* Worker Cards */}
      <div className="space-y-1.5">
        {site.accounts.map(acc => (
          <button
            key={acc.email}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAccount(acc.email)}
            className={`w-full p-2.5 text-left bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] ${siteTheme.borderCard} rounded-xl transition-all duration-150 flex items-center justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
          >
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                  {acc.role}
                </span>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${getLevelBadgeStyle(acc.level)}`}>
                  Rank L{acc.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-[var(--theme-text-primary)] truncate">
                  {acc.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[8.5px] font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)]">
                {acc.code}
              </span>
              <UserCheck size={11} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-primary)] transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
