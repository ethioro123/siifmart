import React, { useState, useMemo } from 'react';
import { Building2, Landmark, Warehouse, Store, Truck, ShoppingBag, UserCheck, Search, ShieldCheck, X } from 'lucide-react';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable, type FacilityTierType, type StagingSiteType, type StagingQuickAccount } from '../../utils/stagingQuickLogin';
import { getSiteTheme, getRoleTheme, POPULAR_ROLE_CHIPS } from './quickLoginTheme';
export type { StagingQuickAccount } from '../../utils/stagingQuickLogin';

interface CountryQuickLoginPanelProps {
  country: 'ET' | 'KE';
  title: string;
  onSelectAccount: (email: string) => void;
  disabled?: boolean;
}

type TierFilter = 'ALL' | 'HQ' | 'REGIONAL' | 'OPS';
type OpsSiteFilter = 'ALL_OPS' | 'Store' | 'Warehouse' | 'Distribution Center' | 'Online Store';

export function CountryQuickLoginPanel({
  country,
  title,
  onSelectAccount,
  disabled = false,
}: CountryQuickLoginPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [opsSiteFilter, setOpsSiteFilter] = useState<OpsSiteFilter>('ALL_OPS');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const isLocalhost = isStagingQuickLoginAvailable();
  const { data: roster = [], isLoading, error } = useStagingAccounts();

  const accounts = useMemo(() => {
    return roster.filter(acc => acc.country === country);
  }, [country, roster]);

  // Compute available popular roles in this country for quick chips
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const acc of accounts) {
      const id = acc.roleId.toLowerCase();
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [accounts]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
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

      // 3. Quick Role Filter
      if (roleFilter !== 'ALL' && acc.roleId.toLowerCase() !== roleFilter.toLowerCase()) return false;

      // 4. Search Query
      if (!q) return true;
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        acc.roleId.toLowerCase().includes(q) ||
        acc.siteName.toLowerCase().includes(q) ||
        acc.siteCode.toLowerCase().includes(q) ||
        acc.siteType.toLowerCase().includes(q) ||
        acc.code.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q)
      );
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
    return Object.values(groups);
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
      case 'Online Store':
        return <ShoppingBag size={13} className={`shrink-0 ${iconColor}`} />;
      default:
        return <Building2 size={13} className="shrink-0 text-stone-500" />;
    }
  };

  const getLevelBadgeStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30';
      case 2:
        return 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30';
      case 3:
        return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30';
      case 4:
      default:
        return 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30';
    }
  };

  const isEthiopia = country === 'ET';
  const badgeColor = isEthiopia
    ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
    : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

  return (
    <div role="region" aria-label={title} className="w-full lg:w-[360px] xl:w-[390px] bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] p-4 sm:p-5 shadow-[0_16px_50px_-10px_rgba(34,50,38,0.04)] dark:shadow-[0_20px_60px_-10px_rgba(5,8,6,0.5)] lg:backdrop-blur-xl flex flex-col h-[750px] max-h-[90vh] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={isEthiopia ? 'text-amber-600 dark:text-amber-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} />
          <h3 className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
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
        <Search size={12} className="absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${isEthiopia ? 'Ethiopia' : 'Kenya'} roles, titles, or sites...`}
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-stone-100/70 dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/[0.06] focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Quick Role Filter Chips ("Same Roles with Same Colors") */}
      <div className="mb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 border ${
              roleFilter === 'ALL'
                ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-transparent'
                : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-white/[0.06] hover:bg-stone-200 dark:hover:bg-white/[0.08]'
            }`}
          >
            All Roles
          </button>
          {POPULAR_ROLE_CHIPS.map(chip => {
            const count = roleCounts[chip.id] || 0;
            if (count === 0) return null;
            const theme = getRoleTheme(chip.id);
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
                    ? `${theme.badge} ring-1 ring-offset-0 font-bold shadow-xs`
                    : 'bg-stone-100/70 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/50 dark:border-white/[0.05] hover:bg-stone-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
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
            { key: 'REGIONAL', label: `Regional (${accounts.filter(a => a.facilityTier === 'Regional Administration').length})` },
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
                  ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24]'
                  : 'bg-stone-100 dark:bg-white/[0.05] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Operation Site Sub-Filters (Store, Warehouse, DC, Online Store) with Site Colors */}
      <div className="grid grid-cols-5 gap-1 mb-1.5">
        {(
          [
            { key: 'ALL_OPS' as const, label: 'All Ops', siteType: null },
            { key: 'Store' as const, label: `Store (${accounts.filter(a => a.siteType === 'Store').length})`, siteType: 'Store' as StagingSiteType },
            { key: 'Warehouse' as const, label: `WH (${accounts.filter(a => a.siteType === 'Warehouse').length})`, siteType: 'Warehouse' as StagingSiteType },
            { key: 'Distribution Center' as const, label: `DC (${accounts.filter(a => a.siteType === 'Distribution Center').length})`, siteType: 'Distribution Center' as StagingSiteType },
            { key: 'Online Store' as const, label: `Online (${accounts.filter(a => a.siteType === 'Online Store').length})`, siteType: 'Online Store' as StagingSiteType },
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
                    : 'bg-emerald-700 dark:bg-emerald-300 text-white dark:text-stone-950 border-transparent'
                  : 'bg-stone-50/80 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-white/[0.07] hover:bg-stone-100 dark:hover:bg-white/[0.06]'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Hierarchy Level Filter Tabs */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {(
          [
            { key: 'ALL', label: 'All Ranks' },
            { key: 1, label: 'L1 Exec' },
            { key: 2, label: 'L2 Director' },
            { key: 3, label: 'L3 Manager' },
            { key: 4, label: 'L4 Staff' },
          ] as const
        ).map(tab => {
          const active = levelFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setLevelFilter(tab.key)}
              className={`py-0.5 text-[9px] font-semibold rounded-md transition-colors cursor-pointer text-center border ${
                active
                  ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-transparent'
                  : 'bg-transparent text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/[0.08] hover:bg-stone-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Filter Counter */}
      {(roleFilter !== 'ALL' || tierFilter !== 'ALL' || levelFilter !== 'ALL' || searchQuery) && (
        <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 px-1 mb-1.5">
          <span>
            Showing <strong className="text-[#1E3F27] dark:text-[#EAE5D9]">{totalFilteredAccounts}</strong> roles
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
            className="text-[9px] font-semibold text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Scrollable Role List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
        {isLoading ? (
          <p className="text-xs text-[var(--theme-text-secondary)] py-4">Loading test employees…</p>
        ) : error ? (
          <p role="alert" className="text-xs text-[var(--theme-text-secondary)] py-4">{error.message}</p>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-stone-400">No matching roles found.</p>
            <p className="text-[10px] text-stone-500 mt-1">Try adjusting the role chip or search text.</p>
          </div>
        ) : (
          filteredGroups.map(site => {
            const siteTheme = getSiteTheme(site.siteType);
            return (
              <div
                key={site.siteCode}
                className={`rounded-2xl border border-[#E2DCCE]/60 dark:border-white/[0.06] ${siteTheme.borderLeft} ${siteTheme.bgLight} p-2.5 space-y-2 transition-all`}
              >
                {/* Site Header: Color-coded by facility type */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E2DCCE]/40 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 rounded-md bg-white/70 dark:bg-black/30 shadow-xs">
                      {getSiteIcon(site.siteType, siteTheme.iconColor)}
                    </span>
                    <span className="text-[11px] font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                      {site.siteName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-md border ${siteTheme.badge}`}>
                      {siteTheme.shortLabel}
                    </span>
                    <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-400 dark:text-stone-500">
                      {site.siteCode}
                    </span>
                  </div>
                </div>

                {/* Account Cards: Roles of the same type share the exact same color */}
                <div className="space-y-1.5">
                  {site.accounts.map(acc => {
                    const roleTheme = getRoleTheme(acc.roleId);
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectAccount(acc.email)}
                        className={`w-full p-2 text-left bg-white/80 dark:bg-black/35 hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-[#E2DCCE]/60 dark:border-white/[0.06] ${roleTheme.borderHover} rounded-xl transition-all duration-150 flex items-center justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {/* Role Color Dot Indicator */}
                          <span className={`w-1.5 h-6 rounded-full shrink-0 ${roleTheme.dot}`} />

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              {/* Uniform Role Pill with Same Color for Same Role */}
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border shrink-0 truncate max-w-[150px] ${roleTheme.badge}`}>
                                {acc.role}
                              </span>
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ${getLevelBadgeStyle(acc.level)}`}>
                                L{acc.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300 truncate">
                                {acc.name}
                              </span>
                              <span className="text-[8px] font-mono text-stone-400 dark:text-stone-500 truncate">
                                ({acc.roleId})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8.5px] font-mono tabular-nums font-semibold text-stone-500 dark:text-stone-400">
                            {acc.code}
                          </span>
                          <UserCheck size={11} className="text-stone-300 dark:text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="pt-2 border-t border-[#E2DCCE]/40 dark:border-white/[0.05] text-center">
        <span className="text-[9px] text-stone-400 dark:text-stone-400 font-mono">
          Select an employee to sign in to staging
        </span>
      </div>
    </div>
  );
}
