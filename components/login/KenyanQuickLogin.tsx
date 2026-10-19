import React, { useState, useMemo } from 'react';
import { Building2, Warehouse, Store, ChevronDown, ChevronUp, ShieldCheck, UserCheck, Crown, Search } from 'lucide-react';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable, type StagingQuickAccount } from '../../utils/stagingQuickLogin';
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
  const [searchQuery, setSearchQuery] = useState('');
  const isLocalhost = isStagingQuickLoginAvailable();
  const { data: accounts = [], isLoading, error } = useStagingAccounts();

  const getSiteIcon = (type: StagingQuickAccount['siteType']) => {
    switch (type) {
      case 'HQ':
        return <Crown size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />;
      case 'Regional Administration':
        return <Building2 size={13} className="shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]" />;
      case 'Distribution Center':
      case 'Warehouse':
        return <Warehouse size={13} className="shrink-0 text-amber-700 dark:text-amber-400" />;
      case 'Online Store':
      case 'Store':
        return <Store size={13} className="shrink-0 text-blue-700 dark:text-blue-400" />;
    }
  };

  const groupedSites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = accounts.filter(acc => {
      if (countryFilter !== 'ALL' && acc.country !== 'GLOBAL' && acc.country !== countryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        acc.siteName.toLowerCase().includes(q) ||
        acc.siteCode.toLowerCase().includes(q) ||
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
  }, [accounts, countryFilter, searchQuery]);

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
            {accounts.length} Employees Available
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
          {/* Controls: Country Filter + Role Search */}
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
                placeholder="Search role, name, facility (e.g. cashier, picker, manager)..."
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-white/80 dark:bg-black/40 border border-[#E2DCCE]/60 dark:border-white/[0.08] focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
              />
            </div>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {isLoading ? <p className="text-xs text-[var(--theme-text-secondary)] py-4">Loading test employees…</p> : error ? <p role="alert" className="text-xs text-[var(--theme-text-secondary)] py-4">{error.message}</p> : groupedSites.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No matching roles found.</p>
            ) : (
              groupedSites.map((site) => (
                <div key={site.siteCode} className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E2DCCE]/40 dark:border-white/[0.05]">
                    <div className="flex items-center gap-1.5">
                      {getSiteIcon(site.siteType)}
                      <span className="text-[11px] font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        {site.siteName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-500 dark:text-stone-400">
                      {site.siteCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {site.accounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectAccount(acc.email)}
                        className="p-2 text-left bg-white/70 dark:bg-black/30 hover:bg-stone-50 dark:hover:bg-white/[0.05] border border-[#E2DCCE]/60 dark:border-white/[0.06] hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-xl transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between gap-1 w-full">
                          <span className="text-[11px] font-semibold text-[#1E3F27] dark:text-[#EAE5D9] group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors truncate">
                            {acc.name}
                          </span>
                          <UserCheck size={10} className="shrink-0 text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors mt-0.5" />
                        </div>
                        <div className="flex items-center justify-between w-full mt-0.5">
                          <span className="text-[10px] font-medium text-[#4D6E56] dark:text-[#A9CBA2] truncate max-w-[140px]">
                            {acc.role}
                          </span>
                          <span className="text-[8px] font-mono tabular-nums text-stone-400 dark:text-stone-500 shrink-0">
                            {acc.code}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
