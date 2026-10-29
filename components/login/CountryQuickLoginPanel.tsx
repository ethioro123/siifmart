import React, { useState, useMemo } from 'react';
import { Building2, Landmark, Warehouse, Store, Truck, UserCheck, Search, ShieldCheck, X } from 'lucide-react';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable, type FacilityTierType, type StagingSiteType, type StagingQuickAccount } from '../../utils/stagingQuickLogin';
import { getSiteTheme, POPULAR_ROLE_CHIPS, WORK_LOCATION_ORDER } from './quickLoginTheme';
export type { StagingQuickAccount } from '../../utils/stagingQuickLogin';

interface CountryQuickLoginPanelProps {
  country: 'ET' | 'KE';
  title: string;
  onSelectAccount: (email: string) => void;
  disabled?: boolean;
}

type TierFilter = 'ALL' | 'HQ' | 'REGIONAL' | 'OPS';
type OpsSiteFilter = 'ALL_OPS' | 'Store' | 'Warehouse' | 'Distribution Center';

export function CountryQuickLoginPanel({
  country,
  title,
  onSelectAccount,
  disabled = false,
}: CountryQuickLoginPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [opsSiteFilter, setOpsSiteFilter] = useState<OpsSiteFilter>('ALL_OPS');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const isLocalhost = isStagingQuickLoginAvailable();
  const { data: roster = [], isLoading, error, refetch } = useStagingAccounts();

  const accounts = useMemo(() => {
    return roster.filter(acc => acc.country === country);
  }, [country, roster]);

  // Compute available popular roles in this country for quick chips
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const acc of accounts) {
      const id = acc.roleId.toLowerCase();
      const key = id;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [accounts]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const searchTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    const matches = accounts.filter(acc => {
      // 1. Facility Tier Filter
      if (tierFilter === 'HQ' && acc.facilityTier !== 'HQ') return false;
      if (tierFilter === 'REGIONAL' && acc.facilityTier !== 'Regional Administration') return false;
      if (tierFilter === 'OPS') {
        if (acc.facilityTier !== 'Operation Sites') return false;
        if (opsSiteFilter !== 'ALL_OPS' && acc.siteType !== opsSiteFilter) return false;
      }

      // 2. Hierarchy Level Filter
      if (levelFilter !== 'ALL' && acc.level !== levelFilter) return false;

      // 3. Quick Role Filter (canonical role IDs only)
      if (roleFilter !== 'ALL') {
        const normRole = acc.roleId.toLowerCase();
        const target = roleFilter.toLowerCase();
        const isMatch = normRole === target;
        if (!isMatch) return false;
      }

      // 4. Search Query (multi-word role ID and account details)
      if (searchTerms.length > 0) {
        const roleIdText = acc.roleId.toLowerCase().replace(/_/g, ' ');
        const emailText = acc.email.toLowerCase().replace(/[.@]/g, ' ');
        const haystack = `${acc.name} ${acc.role} ${acc.roleId} ${roleIdText} ${acc.siteName} ${acc.siteCode} ${acc.siteType} ${acc.code} ${acc.email} ${emailText}`.toLowerCase();
        const matchesAll = searchTerms.every(term => haystack.includes(term));
        if (!matchesAll) return false;
      }

      return true;
    });

    const groups: Record<
      string,
      {
        siteCode: string;
        siteName: string;
        siteType: StagingSiteType;
        facilityTier: FacilityTierType;
        accounts: StagingQuickAccount[];
      }
    > = {};

    for (const acc of matches) {
      if (!groups[acc.siteCode]) {
        groups[acc.siteCode] = {
          siteCode: acc.siteCode,
          siteName: acc.siteName,
          siteType: acc.siteType,
          facilityTier: acc.facilityTier,
          accounts: [],
        };
      }
      groups[acc.siteCode].accounts.push(acc);
    }

    // 1. Organize work locations by facility hierarchy & location name
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const orderA = WORK_LOCATION_ORDER[a.siteType] ?? 99;
      const orderB = WORK_LOCATION_ORDER[b.siteType] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.siteName.localeCompare(b.siteName);
    });

    // 2. Inside each work location, organize accounts by ranking (Level 1..10)
    for (const group of sortedGroups) {
      group.accounts.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
    }

    return sortedGroups;
  }, [accounts, searchQuery, tierFilter, opsSiteFilter, levelFilter, roleFilter]);

  const totalFilteredAccounts = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + g.accounts.length, 0);
  }, [filteredGroups]);

  if (!isLocalhost) {
    return null;
  }

  const getSiteIcon = (type: StagingSiteType, iconColor: string) => {
    switch (type) {
      case 'HQ':
        return <Building2 size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Regional Administration':
        return <Landmark size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Store':
        return <Store size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Warehouse':
        return <Warehouse size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Distribution Center':
        return <Truck size={13} className={`shrink-0 ${iconColor}`} />;
      default:
        return <Building2 size={13} className="shrink-0 text-[var(--theme-text-secondary)]" />;
    }
  };

  const getLevelBadgeStyle = (level: number) => {
    switch (level) {
      case 1:
      case 2:
        return 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-border-focus)]';
      case 3:
      case 4:
      case 5:
        return 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]';
      case 6:
      case 7:
      case 8:
        return 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]';
      case 9:
        return 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]';
      case 10:
      default:
        return 'bg-[var(--theme-status-neutral-bg)] text-[var(--theme-status-neutral-text)] border border-[var(--theme-status-neutral-border)]';
    }
  };

  const isEthiopia = country === 'ET';
  const badgeColor = isEthiopia
    ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
    : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]';

  return (
    <div role="region" aria-label={title} className="w-full lg:w-[360px] xl:w-[390px] bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-[28px] p-4 sm:p-5 shadow-sm flex flex-col h-[750px] max-h-[90vh] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={isEthiopia ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-primary)]'} />
          <h3 className="text-xs font-bold text-[var(--theme-text-primary)] tracking-tight">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {accounts.length} Employees
          </span>
        </div>
      </div>

      {/* Search Input with Clear Button */}
      <div className="relative mt-3 mb-2">
        <Search size={12} className="absolute left-3 top-2.5 text-[var(--theme-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${isEthiopia ? 'Ethiopia' : 'Kenya'} roles, titles, or sites...`}
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:outline-none focus:border-[var(--theme-border-focus)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] cursor-pointer"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Quick Role Filter Chips (Clean, Uncluttered) */}
      <div className="mb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 border ${
              roleFilter === 'ALL'
                ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-transparent font-bold'
                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
            }`}
          >
            All Roles
          </button>
          {POPULAR_ROLE_CHIPS.map(chip => {
            const count = roleCounts[chip.id] || 0;
            if (count === 0) return null;
            const active = roleFilter.toLowerCase() === chip.id.toLowerCase();
            return (
              <button
                key={chip.id}
                type="button"
                aria-label={`Filter by ${chip.label}`}
                aria-pressed={active}
                onClick={() => setRoleFilter(active ? 'ALL' : chip.id)}
                className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-all cursor-pointer shrink-0 flex items-center gap-1 border ${
                  active
                    ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-transparent font-bold shadow-xs'
                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-card-hover)]'
                }`}
              >
                <span>{chip.label}</span>
                <span className="text-[8px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Level Facility Hierarchy Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 mb-1.5">
        {(
          [
            { key: 'ALL', label: `All (${accounts.length})` },
            { key: 'HQ', label: `HQ (${accounts.filter(a => a.facilityTier === 'HQ').length})` },
            { key: 'REGIONAL', label: `Reg Admin (${accounts.filter(a => a.facilityTier === 'Regional Administration').length})` },
            { key: 'OPS', label: `Ops (${accounts.filter(a => a.facilityTier === 'Operation Sites').length})` },
          ] as const
        ).map(tab => {
          const active = tierFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTierFilter(tab.key);
                if (tab.key !== 'OPS') setOpsSiteFilter('ALL_OPS');
              }}
              className={`py-1 px-1 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer text-center truncate ${
                active
                  ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)]'
                  : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-hover)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Operation Site Sub-Filters (Store, Warehouse, DC) with Site Colors */}
      <div className="grid grid-cols-4 gap-1 mb-1.5">
        {(
          [
            { key: 'ALL_OPS' as const, label: 'All Ops', siteType: null },
            { key: 'Store' as const, label: `Store (${accounts.filter(a => a.siteType === 'Store').length})`, siteType: 'Store' as StagingSiteType },
            { key: 'Warehouse' as const, label: `WH (${accounts.filter(a => a.siteType === 'Warehouse').length})`, siteType: 'Warehouse' as StagingSiteType },
            { key: 'Distribution Center' as const, label: `DC (${accounts.filter(a => a.siteType === 'Distribution Center').length})`, siteType: 'Distribution Center' as StagingSiteType },
          ] as const
        ).map(sub => {
          const active = tierFilter === 'OPS' && opsSiteFilter === sub.key;
          const siteTheme = sub.siteType ? getSiteTheme(sub.siteType) : null;
          return (
            <button
              key={sub.key}
              type="button"
              onClick={() => {
                setTierFilter('OPS');
                setOpsSiteFilter(sub.key);
              }}
              className={`py-0.5 px-1 text-[9px] font-semibold rounded-md transition-colors cursor-pointer text-center truncate border ${
                active
                  ? siteTheme
                    ? `${siteTheme.badge} font-bold shadow-xs`
                    : 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-transparent'
                  : siteTheme
                    ? `${siteTheme.bgLight} ${siteTheme.nameColor} border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]`
                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Hierarchy Level Filter Tabs (L1 - L10) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 custom-scrollbar">
        {(['ALL', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(lvl => {
          const active = levelFilter === lvl;
          const label = lvl === 'ALL' ? 'All Ranks' : `L${lvl}`;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-colors cursor-pointer text-center shrink-0 border ${
                active
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent'
                  : 'bg-transparent text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Active Filter Counter */}
      {(roleFilter !== 'ALL' || tierFilter !== 'ALL' || levelFilter !== 'ALL' || searchQuery) && (
        <div className="flex items-center justify-between text-[10px] text-[var(--theme-text-secondary)] px-1 mb-1.5">
          <span>
            Showing <strong className="text-[var(--theme-text-primary)]">{totalFilteredAccounts}</strong> roles
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
              setTierFilter('ALL');
              setOpsSiteFilter('ALL_OPS');
              setLevelFilter('ALL');
            }}
            className="text-[9px] font-semibold text-[var(--theme-primary)] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Scrollable Site & Role List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
        {isLoading ? (
          <p className="text-xs text-[var(--theme-text-secondary)] py-4">Loading test employees…</p>
        ) : error ? (
          <div role="alert" className="text-center py-6 px-3 space-y-2">
            <p className="text-xs text-[var(--theme-status-danger-text)] font-medium">{error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] transition-colors cursor-pointer border border-[var(--theme-border)]"
            >
              Retry loading
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[var(--theme-text-muted)]">No matching roles found.</p>
            <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">Try adjusting the role chip or search text.</p>
          </div>
        ) : (
          filteredGroups.map(site => {
            const siteTheme = getSiteTheme(site.siteType);
            return (
              <div
                key={site.siteCode}
                className={`rounded-2xl border border-[var(--theme-border)] ${siteTheme.borderLeft} ${siteTheme.bgLight} p-2.5 space-y-2 transition-all`}
              >
                {/* Site Header: Color on site name, site type badge, and prominent worker count */}
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

                {/* Worker Cards: Clean, readable titles without rainbow title pills */}
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
                          {/* Clean Worker Role Title without rainbow color pills */}
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
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="pt-2 border-t border-[var(--theme-border-subtle)] text-center">
        <span className="text-[9px] text-[var(--theme-text-muted)] font-mono">
          Select an employee to sign in to staging
        </span>
      </div>
    </div>
  );
}
