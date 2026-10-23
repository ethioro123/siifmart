import React, { useState, useMemo } from 'react';
import { Building2, Landmark, Warehouse, Store, Truck, UserCheck, Search, ShieldCheck, X, Crown, ArrowRight } from 'lucide-react';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable, type StagingSiteType, type StagingQuickAccount } from '../../utils/stagingQuickLogin';
import { getSiteTheme, POPULAR_ROLE_CHIPS } from './quickLoginTheme';
export type { StagingQuickAccount } from '../../utils/stagingQuickLogin';

interface CountryQuickLoginPanelProps {
  country: 'ET' | 'KE';
  title: string;
  onSelectAccount: (email: string) => void;
  disabled?: boolean;
}

type FacilityCategory = 'ALL' | 'Store' | 'Warehouse' | 'Distribution Center' | 'ADMIN';

export function CountryQuickLoginPanel({
  country,
  title,
  onSelectAccount,
  disabled = false,
}: CountryQuickLoginPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<FacilityCategory>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const isLocalhost = isStagingQuickLoginAvailable();
  const { data: roster = [], isLoading, error, refetch } = useStagingAccounts();

  const isEthiopia = country === 'ET';
  const accounts = useMemo(() => {
    return roster.filter(acc => acc.country === country);
  }, [country, roster]);

  // Dedicated Regional Operations Lead for this sovereign country
  const regionalLead = useMemo(() => {
    return (
      accounts.find(a => a.roleId === 'regional_operations_manager') ||
      accounts.find(a => a.roleId === 'country_managing_director') ||
      accounts.find(a => a.roleId === 'country_operations_director')
    );
  }, [accounts]);

  // Compute available popular roles in this country for quick chips
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const acc of accounts) {
      const id = acc.roleId.toLowerCase();
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [accounts]);

  // Compute counts per facility category
  const facilityCounts = useMemo(() => {
    let store = 0;
    let wh = 0;
    let dc = 0;
    let admin = 0;
    for (const acc of accounts) {
      if (acc.siteType === 'Store') store++;
      else if (acc.siteType === 'Warehouse') wh++;
      else if (acc.siteType === 'Distribution Center') dc++;
      else if (acc.facilityTier === 'HQ' || acc.facilityTier === 'Regional Administration') admin++;
    }
    return { store, wh, dc, admin };
  }, [accounts]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const searchTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    const matches = accounts.filter(acc => {
      // 1. Unified Facility Category Filter
      if (facilityFilter === 'Store' && acc.siteType !== 'Store') return false;
      if (facilityFilter === 'Warehouse' && acc.siteType !== 'Warehouse') return false;
      if (facilityFilter === 'Distribution Center' && acc.siteType !== 'Distribution Center') return false;
      if (facilityFilter === 'ADMIN' && acc.facilityTier !== 'HQ' && acc.facilityTier !== 'Regional Administration') return false;

      // 2. Quick Role Filter (canonical role ID)
      if (roleFilter !== 'ALL') {
        const normRole = acc.roleId.toLowerCase();
        const target = roleFilter.toLowerCase();
        if (normRole !== target) return false;
      }

      // 3. Search Query (multi-word match across name, role, site, email, and code)
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
        accounts: StagingQuickAccount[];
      }
    > = {};

    for (const acc of matches) {
      if (!groups[acc.siteCode]) {
        groups[acc.siteCode] = {
          siteCode: acc.siteCode,
          siteName: acc.siteName,
          siteType: acc.siteType,
          accounts: [],
        };
      }
      groups[acc.siteCode].accounts.push(acc);
    }

    // Sort accounts within each site hierarchically (L2/L4/L6 leadership first, then staff)
    const sortedGroups = Object.values(groups).map(g => ({
      ...g,
      accounts: [...g.accounts].sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      })
    }));

    // Sort sites logically: HQ & Regional Admin first, then Stores, then Warehouses & DCs
    const getSiteSortRank = (type: StagingSiteType) => {
      switch (type) {
        case 'HQ':
          return 1;
        case 'Regional Administration':
          return 2;
        case 'Store':
          return 3;
        case 'Warehouse':
          return 4;
        case 'Distribution Center':
          return 5;
        default:
          return 6;
      }
    };

    return sortedGroups.sort((a, b) => getSiteSortRank(a.siteType) - getSiteSortRank(b.siteType) || a.siteCode.localeCompare(b.siteCode));
  }, [accounts, searchQuery, facilityFilter, roleFilter]);

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
        return <Building2 size={13} className="shrink-0 text-stone-500" />;
    }
  };

  const getLevelBadgeStyle = (level: number) => {
    switch (level) {
      case 1:
      case 2:
        return 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30';
      case 3:
      case 4:
      case 5:
        return 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30';
      case 6:
      case 7:
      case 8:
        return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30';
      case 9:
        return 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30';
      case 10:
      default:
        return 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30';
    }
  };

  const flagEmoji = isEthiopia ? '🇪🇹' : '🇰🇪';
  const badgeColor = isEthiopia
    ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
    : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

  return (
    <div
      role="region"
      aria-label={title}
      className="w-full lg:w-[360px] xl:w-[390px] bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] p-4 sm:p-5 shadow-[0_16px_50px_-10px_rgba(34,50,38,0.04)] dark:shadow-[0_20px_60px_-10px_rgba(5,8,6,0.5)] lg:backdrop-blur-xl flex flex-col h-[750px] max-h-[90vh] transition-all duration-300"
    >
      {/* 1. Header with Country Flag & Count */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">{flagEmoji}</span>
          <ShieldCheck size={16} className={isEthiopia ? 'text-amber-600 dark:text-amber-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} />
          <h3 className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
            {title}
          </h3>
        </div>
        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {accounts.length} Employees
        </span>
      </div>

      {/* 2. Pinned Regional Lead Quick Access Card */}
      {regionalLead && (
        <div className="mt-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelectAccount(regionalLead.email)}
            className={`w-full py-2 px-2.5 rounded-xl border transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between text-left group ${
              isEthiopia
                ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/25 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1 rounded-md shrink-0 ${isEthiopia ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                <Crown size={12} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate flex items-center gap-1.5 leading-tight">
                  <span className="truncate">{regionalLead.name}</span>
                  <span className="text-[8px] font-bold px-1 rounded bg-black/10 dark:bg-white/10 uppercase">
                    L{regionalLead.level} LEAD
                  </span>
                </div>
                <div className="text-[9.5px] opacity-75 truncate">{regionalLead.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold shrink-0 opacity-80 group-hover:opacity-100">
              <span>Sign In</span>
              <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* 3. Search Bar with Clear Button */}
      <div className="relative mt-2.5 mb-2">
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

      {/* 4. Streamlined Facility Segmented Tabs */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {(
          [
            { key: 'ALL' as const, label: `All (${accounts.length})` },
            { key: 'Store' as const, label: `Store (${facilityCounts.store})` },
            { key: 'Warehouse' as const, label: `WH (${facilityCounts.wh})` },
            { key: 'Distribution Center' as const, label: `DC (${facilityCounts.dc})` },
            { key: 'ADMIN' as const, label: `HQ (${facilityCounts.admin})` },
          ] as const
        ).map(tab => {
          const active = facilityFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFacilityFilter(tab.key)}
              className={`py-1 px-1 text-[9px] font-semibold rounded-lg transition-colors cursor-pointer text-center truncate ${
                active
                  ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] font-bold shadow-xs'
                  : 'bg-stone-100 dark:bg-white/[0.05] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. Essential Role Filter Chips (Clean, Curated) */}
      <div className="mb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 border ${
              roleFilter === 'ALL'
                ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-transparent font-bold'
                : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-white/[0.06] hover:bg-stone-200 dark:hover:bg-white/[0.08]'
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
                    ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-transparent font-bold shadow-xs'
                    : 'bg-stone-100/70 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/50 dark:border-white/[0.05] hover:bg-stone-200/60 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span>{chip.label}</span>
                <span className="text-[8px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Active Filter Counter */}
      {(roleFilter !== 'ALL' || facilityFilter !== 'ALL' || searchQuery) && (
        <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 px-1 mb-1.5">
          <span>
            Showing <strong className="text-[#1E3F27] dark:text-[#EAE5D9]">{totalFilteredAccounts}</strong> roles
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
              setFacilityFilter('ALL');
            }}
            className="text-[9px] font-semibold text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* 7. Scrollable Site Groups & Hierarchically-Sorted Personnel */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {isLoading ? (
          <p className="text-xs text-[var(--theme-text-secondary)] py-4 text-center">Loading test employees…</p>
        ) : error ? (
          <div role="alert" className="text-center py-6 px-3 space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-white/[0.08] hover:bg-stone-200 dark:hover:bg-white/[0.12] text-[#1E3F27] dark:text-[#EAE5D9] transition-colors cursor-pointer border border-[#E2DCCE]/60 dark:border-white/[0.06]"
            >
              Retry loading
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-stone-400">No matching roles found.</p>
            <p className="text-[10px] text-stone-500 mt-1">Try adjusting the filter or search query.</p>
          </div>
        ) : (
          filteredGroups.map(site => {
            const siteTheme = getSiteTheme(site.siteType);
            return (
              <div
                key={site.siteCode}
                className={`rounded-2xl border border-[#E2DCCE]/60 dark:border-white/[0.06] ${siteTheme.borderLeft} ${siteTheme.bgLight} p-2.5 space-y-1.5 transition-all`}
              >
                {/* Site Header: icon, name, site badge, worker count badge, site code */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E2DCCE]/40 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 rounded-md bg-white/70 dark:bg-black/30 shadow-xs">
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
                    <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-400 dark:text-stone-500">
                      {site.siteCode}
                    </span>
                  </div>
                </div>

                {/* Worker Cards: Sorted by level, clean layout */}
                <div className="space-y-1">
                  {site.accounts.map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelectAccount(acc.email)}
                      className={`w-full p-2 text-left bg-white/90 dark:bg-black/40 hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-[#E2DCCE]/70 dark:border-white/[0.07] ${siteTheme.borderCard} rounded-xl transition-all duration-150 flex items-center justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-[#1E3F27] dark:text-[#EAE5D9] group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors truncate">
                            {acc.role}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${getLevelBadgeStyle(acc.level)}`}>
                            L{acc.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-medium text-stone-600 dark:text-stone-300 truncate">
                            {acc.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8.5px] font-mono tabular-nums font-semibold text-stone-500 dark:text-stone-400">
                          {acc.code}
                        </span>
                        <UserCheck size={11} className="text-stone-300 dark:text-stone-600 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 8. Footer */}
      <div className="pt-2 border-t border-[#E2DCCE]/40 dark:border-white/[0.05] text-center">
        <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono">
          Select an employee to sign in to staging
        </span>
      </div>
    </div>
  );
}
