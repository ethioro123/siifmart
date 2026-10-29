import React, { useState, useMemo } from 'react';
import { Building2, Warehouse, Store, Truck, ChevronDown, ChevronUp, ShieldCheck, UserCheck, Search, X } from 'lucide-react';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable, type StagingQuickAccount, type StagingSiteType } from '../../utils/stagingQuickLogin';
import { getSiteTheme, POPULAR_ROLE_CHIPS, WORK_LOCATION_ORDER } from './quickLoginTheme';
export { checkIsLocalhost } from '../../utils/stagingQuickLogin';

interface StagingSiteGroup {
  siteCode: string;
  siteName: string;
  siteType: StagingQuickAccount['siteType'];
  country: StagingQuickAccount['country'];
  accounts: StagingQuickAccount[];
}

interface StagingQuickLoginProps {
  onSelectAccount: (email: string) => void;
  disabled?: boolean;
}

export function KenyanQuickLogin({ onSelectAccount, disabled = false }: StagingQuickLoginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KE' | 'ET'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const isLocalhost = isStagingQuickLoginAvailable();
  const { data: accounts = [], isLoading, error, refetch } = useStagingAccounts();

  const getSiteIcon = (type: StagingQuickAccount['siteType'], iconColor: string) => {
    switch (type) {
      case 'HQ':
        return <Building2 size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Regional Administration':
        return <Building2 size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Distribution Center':
        return <Truck size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Warehouse':
        return <Warehouse size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Store':
      default:
        return <Store size={13} className={`shrink-0 ${iconColor}`} />;
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
        return 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]';
      case 9:
        return 'bg-[var(--theme-status-info-bg)] bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]';
      case 10:
      default:
        return 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30';
    }
  };

  // Compute available role counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const acc of accounts) {
      if (countryFilter !== 'ALL' && acc.country !== 'GLOBAL' && acc.country !== countryFilter) {
        continue;
      }
      const id = acc.roleId.toLowerCase();
      const key = id;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [accounts, countryFilter]);

  const groupedSites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const searchTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    const filtered = accounts.filter(acc => {
      if (countryFilter !== 'ALL' && acc.country !== 'GLOBAL' && acc.country !== countryFilter) {
        return false;
      }
      if (roleFilter !== 'ALL') {
        const normRole = acc.roleId.toLowerCase();
        const target = roleFilter.toLowerCase();
        const isMatch = normRole === target;
        if (!isMatch) return false;
      }
      if (searchTerms.length > 0) {
        const roleIdText = acc.roleId.toLowerCase().replace(/_/g, ' ');
        const emailText = acc.email.toLowerCase().replace(/[.@]/g, ' ');
        const haystack = `${acc.name} ${acc.role} ${acc.roleId} ${roleIdText} ${acc.siteName} ${acc.siteCode} ${acc.siteType} ${acc.code} ${acc.email} ${emailText}`.toLowerCase();
        const matchesAll = searchTerms.every(term => haystack.includes(term));
        if (!matchesAll) return false;
      }
      return true;
    });

    const groups: Record<string, StagingSiteGroup> = {};
    for (const acc of filtered) {
      if (!groups[acc.siteCode]) {
        groups[acc.siteCode] = {
          siteCode: acc.siteCode,
          siteName: acc.siteName,
          siteType: acc.siteType,
          country: acc.country,
          accounts: []
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
  }, [accounts, countryFilter, roleFilter, searchQuery]);

  const totalFilteredAccounts = useMemo(() => {
    return groupedSites.reduce((sum, g) => sum + g.accounts.length, 0);
  }, [groupedSites]);

  if (!isLocalhost) return null;

  return (
    <div className="mt-6 pt-5 border-t border-[var(--theme-border)]/50 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.03] hover:bg-stone-200/60 dark:hover:bg-white/[0.06] border border-[var(--theme-border)]/60 dark:border-white/[0.06] transition-all duration-200 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
          <span className="text-xs font-semibold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
            Staging Quick Login
          </span>
          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary-muted)]/15 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
            {accounts.length} Roles
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-stone-500 dark:text-stone-400 transition-transform" />
        ) : (
          <ChevronDown size={14} className="text-stone-500 dark:text-stone-400 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-3 mt-3 animate-fade-in">
          {/* Controls: Country Filter + Search + Role Chips */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              {(['ALL', 'KE', 'ET'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCountryFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                    countryFilter === f
                      ? 'bg-[var(--theme-primary)] dark:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-primary)] font-bold'
                      : 'bg-stone-100 dark:bg-white/[0.05] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.1]'
                  }`}
                >
                  {f === 'ALL' ? `All (${accounts.length})` : `${f === 'KE' ? 'Kenya' : 'Ethiopia'} (${accounts.filter(a => a.country === f).length})`}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search role, name, facility (e.g. cashier, picker)..."
                className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg bg-white/80 dark:bg-black/40 border border-[var(--theme-border)]/60 dark:border-white/[0.08] focus:outline-none focus:border-[var(--theme-border)] dark:focus:border-[var(--theme-border)] text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
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

            {/* Popular Role Chips (Clean, Uncluttered) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 border ${
                  roleFilter === 'ALL'
                    ? 'bg-[var(--theme-primary)] dark:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-primary)] border-transparent font-bold'
                    : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-white/[0.06]'
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
                        ? 'bg-[var(--theme-primary)] dark:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-primary)] border-transparent font-bold shadow-xs'
                        : 'bg-stone-100/70 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/50 dark:border-white/[0.05]'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="text-[8px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Count summary */}
            {(roleFilter !== 'ALL' || searchQuery || countryFilter !== 'ALL') && (
              <div className="flex items-center justify-between text-[10px] text-stone-500 px-0.5">
                <span>Showing <strong>{totalFilteredAccounts}</strong> roles</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                    setCountryFilter('ALL');
                  }}
                  className="text-[9px] font-semibold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {isLoading ? (
              <p className="text-xs text-[var(--theme-text-secondary)] py-4">Loading test employees…</p>
            ) : error ? (
              <div role="alert" className="text-center py-4 space-y-1.5">
                <p className="text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-medium">{error.message}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-white/[0.08] hover:bg-stone-200 dark:hover:bg-white/[0.12] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] transition-colors cursor-pointer border border-[var(--theme-border)]/60 dark:border-white/[0.06]"
                >
                  Retry loading
                </button>
              </div>
            ) : groupedSites.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No matching roles found.</p>
            ) : (
              groupedSites.map(site => {
                const siteTheme = getSiteTheme(site.siteType as StagingSiteType);
                return (
                  <div
                    key={site.siteCode}
                    className={`rounded-xl border border-[var(--theme-border)]/60 dark:border-white/[0.06] ${siteTheme.borderLeft} ${siteTheme.bgLight} p-2 space-y-1.5`}
                  >
                    {/* Site Header: Color on site name, site type badge, and prominent worker count */}
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--theme-border)]/40 dark:border-white/[0.05]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getSiteIcon(site.siteType, siteTheme.iconColor)}
                        <span className={`text-[11px] font-bold ${siteTheme.nameColor} truncate`}>
                          {site.siteName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${siteTheme.badge}`}>
                          {siteTheme.shortLabel}
                        </span>
                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border ${siteTheme.countBadge}`}>
                          {site.accounts.length} {site.accounts.length === 1 ? 'Worker' : 'Workers'}
                        </span>
                        <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-500 dark:text-stone-400">
                          {site.siteCode}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {site.accounts.map(acc => (
                        <button
                          key={acc.email}
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelectAccount(acc.email)}
                          className={`p-2 text-left bg-white/85 dark:bg-black/35 hover:bg-stone-50 dark:hover:bg-white/[0.05] border border-[var(--theme-border)]/60 dark:border-white/[0.06] ${siteTheme.borderCard} rounded-xl transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-start justify-between gap-1 w-full">
                            <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-primary)] dark:group-hover:text-white transition-colors truncate">
                              {acc.role}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ${getLevelBadgeStyle(acc.level)}`}>
                                Rank L{acc.level}
                              </span>
                              <UserCheck size={10} className="text-stone-400 group-hover:text-[var(--theme-primary)] dark:group-hover:text-[var(--theme-text-secondary)] transition-colors" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-[10px] font-bold text-stone-800 dark:text-stone-100 truncate max-w-[130px]">
                              {acc.name}
                            </span>
                            <span className="text-[8px] font-mono tabular-nums text-stone-400 dark:text-stone-500 shrink-0">
                              {acc.code}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
