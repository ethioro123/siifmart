import React, { useState, useMemo } from 'react';
import { Building2, Warehouse, Store, UserCheck, Search, ShieldCheck } from 'lucide-react';
import stagingAccountsData from './stagingAccounts.json';
import { checkIsLocalhost } from './KenyanQuickLogin';

export interface StagingQuickAccount {
  name: string;
  role: string;
  code: string;
  email: string;
  password: string;
  country: 'KE' | 'ET' | 'GLOBAL';
  siteCode: string;
  siteName: string;
  siteType: 'HQ' | 'Administration' | 'Warehouse' | 'Store';
}

interface CountryQuickLoginPanelProps {
  country: 'ET' | 'KE';
  title: string;
  onSelectAccount: (email: string, password: string) => void;
  disabled?: boolean;
}

export function CountryQuickLoginPanel({
  country,
  title,
  onSelectAccount,
  disabled = false,
}: CountryQuickLoginPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<'ALL' | 'HQ' | 'DC' | 'STORE'>('ALL');
  const isLocalhost = checkIsLocalhost();

  const accounts = useMemo(() => {
    return (stagingAccountsData as StagingQuickAccount[]).filter(
      acc => acc.country === country
    );
  }, [country]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matches = accounts.filter(acc => {
      if (facilityFilter === 'HQ' && acc.siteType !== 'HQ' && acc.siteType !== 'Administration') return false;
      if (facilityFilter === 'DC' && acc.siteType !== 'Warehouse') return false;
      if (facilityFilter === 'STORE' && acc.siteType !== 'Store') return false;

      if (!q) return true;
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        acc.siteName.toLowerCase().includes(q) ||
        acc.code.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q)
      );
    });

    const groups: Record<string, { siteCode: string; siteName: string; siteType: StagingQuickAccount['siteType']; accounts: StagingQuickAccount[] }> = {};
    for (const acc of matches) {
      if (!groups[acc.siteCode]) {
        groups[acc.siteCode] = {
          siteCode: acc.siteCode,
          siteName: acc.siteName,
          siteType: acc.siteType,
          accounts: []
        };
      }
      groups[acc.siteCode].accounts.push(acc);
    }
    return Object.values(groups);
  }, [accounts, searchQuery, facilityFilter]);

  if (!isLocalhost) {
    return null;
  }

  const getSiteIcon = (type: StagingQuickAccount['siteType']) => {
    switch (type) {
      case 'HQ':
      case 'Administration':
        return <Building2 size={13} className="shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]" />;
      case 'Warehouse':
        return <Warehouse size={13} className="shrink-0 text-amber-700 dark:text-amber-400" />;
      case 'Store':
        return <Store size={13} className="shrink-0 text-blue-700 dark:text-blue-400" />;
      default:
        return <Building2 size={13} className="shrink-0 text-stone-500" />;
    }
  };

  const isEthiopia = country === 'ET';
  const badgeColor = isEthiopia
    ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
    : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

  return (
    <div className="w-full lg:w-[330px] xl:w-[360px] bg-white/80 dark:bg-[#18201B]/55 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] p-5 shadow-[0_16px_50px_-10px_rgba(34,50,38,0.04)] dark:shadow-[0_20px_60px_-10px_rgba(5,8,6,0.5)] lg:backdrop-blur-xl flex flex-col h-[680px] max-h-[85vh] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={isEthiopia ? 'text-amber-600 dark:text-amber-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} />
          <h3 className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
            {title}
          </h3>
        </div>
        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {isEthiopia ? 'ETB • 42 Roles' : 'KES • 42 Roles'}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mt-3 mb-2">
        <Search size={12} className="absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${isEthiopia ? 'Ethiopia' : 'Kenya'} roles (e.g. cashier, picker)...`}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-100/70 dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/[0.06] focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
        />
      </div>

      {/* Facility Filter Tabs */}
      <div className="flex items-center gap-1 mb-2">
        {(
          [
            { key: 'ALL', label: 'All (42)' },
            { key: 'HQ', label: 'HQ (17)' },
            { key: 'DC', label: 'DC (13)' },
            { key: 'STORE', label: 'Store (12)' },
          ] as const
        ).map(tab => {
          const active = facilityFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFacilityFilter(tab.key)}
              className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer text-center ${
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

      {/* Scrollable Role List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {filteredGroups.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-8">No matching roles found.</p>
        ) : (
          filteredGroups.map(site => (
            <div key={site.siteCode} className="space-y-1.5">
              <div className="flex items-center justify-between pt-1 pb-1 border-b border-[#E2DCCE]/30 dark:border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  {getSiteIcon(site.siteType)}
                  <span className="text-[11px] font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                    {site.siteName}
                  </span>
                </div>
                <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-400 dark:text-stone-500">
                  {site.siteCode}
                </span>
              </div>

              <div className="space-y-1">
                {site.accounts.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectAccount(acc.email, acc.password)}
                    className="w-full p-2 text-left bg-white/60 dark:bg-white/[0.02] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-[#E2DCCE]/50 dark:border-white/[0.05] hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-xl transition-all duration-150 flex items-center justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[11px] font-semibold text-[#1E3F27] dark:text-[#EAE5D9] group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors truncate">
                        {acc.name}
                      </span>
                      <span className="text-[9px] font-medium text-[#4D6E56] dark:text-[#A9CBA2] truncate">
                        {acc.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[8px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                        {acc.code}
                      </span>
                      <UserCheck size={11} className="text-stone-300 dark:text-stone-600 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="pt-2 border-t border-[#E2DCCE]/40 dark:border-white/[0.05] text-center">
        <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono">
          Click any role to 1-click authenticate
        </span>
      </div>
    </div>
  );
}
