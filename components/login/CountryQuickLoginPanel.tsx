import React, { useState, useMemo } from 'react';
import { Building2, Landmark, Warehouse, Store, Truck, ShoppingBag, UserCheck, Search, ShieldCheck } from 'lucide-react';
import stagingAccountsData from './stagingAccounts.json';
import { checkIsLocalhost } from './KenyanQuickLogin';

export type FacilityTierType = 'HQ' | 'Regional Administration' | 'Operation Sites';
export type StagingSiteType =
  | 'HQ'
  | 'Regional Administration'
  | 'Store'
  | 'Warehouse'
  | 'Distribution Center'
  | 'Online Store';

export interface StagingQuickAccount {
  name: string;
  role: string;
  roleId: string;
  level: number;
  levelTag: string;
  code: string;
  email: string;
  password: string;
  country: 'KE' | 'ET' | 'GLOBAL';
  facilityTier: FacilityTierType;
  siteCode: string;
  siteName: string;
  siteType: StagingSiteType;
}

interface CountryQuickLoginPanelProps {
  country: 'ET' | 'KE';
  title: string;
  onSelectAccount: (email: string, password: string) => void;
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
  const isLocalhost = checkIsLocalhost();

  const accounts = useMemo(() => {
    return (stagingAccountsData as StagingQuickAccount[]).filter(
      acc => acc.country === country
    );
  }, [country]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matches = accounts.filter(acc => {
      // 1. Facility Tier Filter (HQ vs Regional Administration vs Operation Sites)
      if (tierFilter === 'HQ' && acc.facilityTier !== 'HQ') return false;
      if (tierFilter === 'REGIONAL' && acc.facilityTier !== 'Regional Administration') return false;
      if (tierFilter === 'OPS') {
        if (acc.facilityTier !== 'Operation Sites') return false;
        if (opsSiteFilter !== 'ALL_OPS' && acc.siteType !== opsSiteFilter) return false;
      }

      // 2. Hierarchy Level Filter
      if (levelFilter !== 'ALL' && acc.level !== levelFilter) return false;

      // 3. Search Query
      if (!q) return true;
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        acc.roleId.toLowerCase().includes(q) ||
        acc.siteName.toLowerCase().includes(q) ||
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
  }, [accounts, searchQuery, tierFilter, opsSiteFilter, levelFilter]);

  if (!isLocalhost) {
    return null;
  }

  const getSiteIcon = (type: StagingSiteType) => {
    switch (type) {
      case 'HQ':
        return <Building2 size={13} className="shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]" />;
      case 'Regional Administration':
        return <Landmark size={13} className="shrink-0 text-violet-700 dark:text-violet-400" />;
      case 'Store':
        return <Store size={13} className="shrink-0 text-emerald-700 dark:text-emerald-400" />;
      case 'Warehouse':
        return <Warehouse size={13} className="shrink-0 text-amber-700 dark:text-amber-400" />;
      case 'Distribution Center':
        return <Truck size={13} className="shrink-0 text-cyan-700 dark:text-cyan-400" />;
      case 'Online Store':
        return <ShoppingBag size={13} className="shrink-0 text-orange-700 dark:text-orange-400" />;
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
    <div className="w-full lg:w-[350px] xl:w-[380px] bg-white/80 dark:bg-[#18201B]/55 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] p-4 sm:p-5 shadow-[0_16px_50px_-10px_rgba(34,50,38,0.04)] dark:shadow-[0_20px_60px_-10px_rgba(5,8,6,0.5)] lg:backdrop-blur-xl flex flex-col h-[720px] max-h-[88vh] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={isEthiopia ? 'text-amber-600 dark:text-amber-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} />
          <h3 className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
            {title}
          </h3>
        </div>
        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {isEthiopia ? 'ETB • 55 Roles' : 'KES • 55 Roles'}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mt-3 mb-2">
        <Search size={12} className="absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${isEthiopia ? 'Ethiopia' : 'Kenya'} roles, titles, or sites...`}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-100/70 dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/[0.06] focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
        />
      </div>

      {/* 3-Level Facility Hierarchy Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 mb-1.5">
        {(
          [
            { key: 'ALL', label: 'All (55)' },
            { key: 'HQ', label: 'HQ (23)' },
            { key: 'REGIONAL', label: 'Regional (6)' },
            { key: 'OPS', label: 'Ops Sites (26)' },
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

      {/* Operation Site Sub-Filters (Store, Warehouse, Distribution Center, Online Store) */}
      <div className="grid grid-cols-5 gap-1 mb-1.5">
        {(
          [
            { key: 'ALL_OPS', label: 'All Ops' },
            { key: 'Store', label: 'Store (7)' },
            { key: 'Warehouse', label: 'WH (7)' },
            { key: 'Distribution Center', label: 'DC (7)' },
            { key: 'Online Store', label: 'Online (5)' },
          ] as const
        ).map(sub => {
          const active = tierFilter === 'OPS' && opsSiteFilter === sub.key;
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
                  ? 'bg-emerald-700 dark:bg-emerald-300 text-white dark:text-stone-950 border-transparent'
                  : 'bg-stone-50/80 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-white/[0.07] hover:bg-stone-100 dark:hover:bg-white/[0.06]'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Hierarchy Level Filter Tabs */}
      <div className="grid grid-cols-5 gap-1 mb-2.5">
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

      {/* Scrollable Role List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {filteredGroups.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-8">No matching roles found.</p>
        ) : (
          filteredGroups.map(site => (
            <div key={site.siteCode} className="space-y-1.5">
              <div className="flex items-center justify-between pt-1 pb-1 border-b border-[#E2DCCE]/30 dark:border-white/[0.04]">
                <div className="flex items-center gap-1.5 min-w-0">
                  {getSiteIcon(site.siteType)}
                  <span className="text-[11px] font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                    {site.siteName}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300">
                    {site.siteType}
                  </span>
                  <span className="text-[9px] font-mono tabular-nums font-semibold text-stone-400 dark:text-stone-500">
                    {site.siteCode}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {site.accounts.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectAccount(acc.email, acc.password)}
                    className="w-full p-2.5 text-left bg-white/60 dark:bg-white/[0.02] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-[#E2DCCE]/50 dark:border-white/[0.05] hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-xl transition-all duration-150 flex items-center justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400 truncate">
                          {acc.name}
                        </span>
                        <span className="text-[8px] font-mono text-stone-400 dark:text-stone-500 truncate">
                          ({acc.roleId})
                        </span>
                      </div>
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
