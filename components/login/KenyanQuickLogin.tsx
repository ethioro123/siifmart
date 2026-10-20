import React, { useState, useMemo } from 'react';
import { Building2, Warehouse, Store, Truck, ShoppingBag, ChevronDown, ChevronUp, ShieldCheck, UserCheck, Search, X } from 'lucide-react';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable, type StagingQuickAccount, type StagingSiteType } from '../../utils/stagingQuickLogin';
import { getSiteTheme, getRoleTheme, POPULAR_ROLE_CHIPS } from './quickLoginTheme';
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
  const { data: accounts = [], isLoading, error } = useStagingAccounts();

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
      case 'Online Store':
        return <ShoppingBag size={13} className={`shrink-0 ${iconColor}`} />;
      case 'Store':
      default:
        return <Store size={13} className={`shrink-0 ${iconColor}`} />;
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
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [accounts, countryFilter]);

  const groupedSites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = accounts.filter(acc => {
      if (countryFilter !== 'ALL' && acc.country !== 'GLOBAL' && acc.country !== countryFilter) {
        return false;
      }
      if (roleFilter !== 'ALL' && acc.roleId.toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
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
    return Object.values(groups);
  }, [accounts, countryFilter, roleFilter, searchQuery]);

  const totalFilteredAccounts = useMemo(() => {
    return groupedSites.reduce((sum, g) => sum + g.accounts.length, 0);
  }, [groupedSites]);

  if (!isLocalhost) return null;

  return (
    <div className="mt-6 pt-5 border-t border-[#E2DCCE]/50 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.03] hover:bg-stone-200/60 dark:hover:bg-white/[0.06] border border-[#E2DCCE]/60 dark:border-white/[0.06] transition-all duration-200 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
          <span className="text-xs font-semibold text-[#1E3F27] dark:text-[#EAE5D9]">
            Staging Quick Login
          </span>
          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2]">
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
                      ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24]'
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
                className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg bg-white/80 dark:bg-black/40 border border-[#E2DCCE]/60 dark:border-white/[0.08] focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
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

            {/* Popular Role Chips ("Same Roles with Same Colors") */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`py-0.5 px-2 text-[9px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 border ${
                  roleFilter === 'ALL'
                    ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-transparent'
                    : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-white/[0.06]'
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
                    className={`py-0.5 px-1.5 text-[9px] font-semibold rounded-md transition-all cursor-pointer shrink-0 flex items-center gap-1 border ${
                      active
                        ? `${theme.badge} ring-1 font-bold shadow-xs`
                        : 'bg-stone-100/70 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/50 dark:border-white/[0.05]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
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
                  className="text-[9px] font-semibold text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline cursor-pointer"
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
              <p role="alert" className="text-xs text-[var(--theme-text-secondary)] py-4">{error.message}</p>
            ) : groupedSites.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No matching roles found.</p>
            ) : (
              groupedSites.map(site => {
                const siteTheme = getSiteTheme(site.siteType as StagingSiteType);
                return (
                  <div
                    key={site.siteCode}
                    className={`rounded-xl border border-[#E2DCCE]/60 dark:border-white/[0.06] ${siteTheme.borderLeft} ${siteTheme.bgLight} p-2 space-y-1.5`}
                  >
                    {/* Site Header: Color-coded */}
                    <div className="flex items-center justify-between pb-1 border-b border-[#E2DCCE]/40 dark:border-white/[0.05]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getSiteIcon(site.siteType, siteTheme.iconColor)}
                        <span className="text-[11px] font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                          {site.siteName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${siteTheme.badge}`}>
                          {siteTheme.shortLabel}
                        </span>
                        <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-500 dark:text-stone-400">
                          {site.siteCode}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {site.accounts.map(acc => {
                        const roleTheme = getRoleTheme(acc.roleId);
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelectAccount(acc.email)}
                            className={`p-2 text-left bg-white/80 dark:bg-black/35 hover:bg-stone-50 dark:hover:bg-white/[0.05] border border-[#E2DCCE]/60 dark:border-white/[0.06] ${roleTheme.borderHover} rounded-xl transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-start justify-between gap-1 w-full">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-1.5 h-4 rounded-full shrink-0 ${roleTheme.dot}`} />
                                <span className="text-[11px] font-semibold text-[#1E3F27] dark:text-[#EAE5D9] group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors truncate">
                                  {acc.name}
                                </span>
                              </div>
                              <UserCheck size={10} className="shrink-0 text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors mt-0.5" />
                            </div>
                            <div className="flex items-center justify-between w-full mt-1">
                              <span className={`text-[9px] font-bold px-1 py-0.2 rounded border truncate max-w-[130px] ${roleTheme.badge}`}>
                                {acc.role}
                              </span>
                              <span className="text-[8px] font-mono tabular-nums text-stone-400 dark:text-stone-500 shrink-0">
                                {acc.code}
                              </span>
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
        </div>
      )}
    </div>
  );
}
