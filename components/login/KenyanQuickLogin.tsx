import React, { useState, useMemo } from 'react';
import { Building2, Warehouse, Store, ChevronDown, ChevronUp, ShieldCheck, UserCheck, Crown, Search } from 'lucide-react';
import stagingAccountsData from './stagingAccounts.json';

export interface StagingQuickAccount {
  name: string;
  role: string;
  code: string;
  email: string;
  password: string;
  country: 'KE' | 'ET' | 'GLOBAL';
  siteCode: string;
  siteName: string;
  siteType: 'HQ' | 'Administration' | 'Regional Administration' | 'Warehouse' | 'Store' | 'Distribution Center' | 'Online Store';
}

export interface StagingSiteGroup {
  siteCode: string;
  siteName: string;
  siteType: 'HQ' | 'Administration' | 'Regional Administration' | 'Warehouse' | 'Store' | 'Distribution Center' | 'Online Store';
  country?: 'KE' | 'ET' | 'GLOBAL';
  accounts: StagingQuickAccount[];
}

export type KenyanQuickAccount = StagingQuickAccount;
export type KenyanSiteGroup = StagingSiteGroup;

/**
 * Backward compatibility export for Kenyan worker topology tests.
 */
export const KENYAN_QUICK_SITES: KenyanSiteGroup[] = [
  {
    siteCode: 'KE-01',
    siteName: 'Kenya Central Operations',
    siteType: 'Administration',
    country: 'KE',
    accounts: [
      {
        name: 'Kamau Ndenga',
        role: 'Regional Manager',
        code: 'KE-SIIF0040',
        email: 'ke-siif0040@siifmart.com',
        password: 'kenya123',
        country: 'KE',
        siteCode: 'KE-01',
        siteName: 'Kenya Central Operations',
        siteType: 'Administration'
      },
      {
        name: 'Omondi Samuel',
        role: 'Operations Manager',
        code: 'KE-SIIF0041',
        email: 'ke-siif0041@siifmart.com',
        password: 'kenya123',
        country: 'KE',
        siteCode: 'KE-01',
        siteName: 'Kenya Central Operations',
        siteType: 'Administration'
      },
      {
        name: 'Musyoka Kioko',
        role: 'HR Manager',
        code: 'KE-SIIF0043',
        email: 'ke-siif0043@siifmart.com',
        password: 'kenya123',
        country: 'KE',
        siteCode: 'KE-01',
        siteName: 'Kenya Central Operations',
        siteType: 'Administration'
      },
      {
        name: 'Oscar Kennedy',
        role: 'Procurement Manager',
        code: 'KE-SIIF0045',
        email: 'ke-siif0045@siifmart.com',
        password: 'kenya123',
        country: 'KE',
        siteCode: 'KE-01',
        siteName: 'Kenya Central Operations',
        siteType: 'Administration'
      }
    ]
  },
  {
    siteCode: 'KE-02',
    siteName: 'Eastleigh 01',
    siteType: 'Warehouse',
    country: 'KE',
    accounts: [
      {
        name: 'Kennedy Odhiambo Odhiambo',
        role: 'Warehouse Manager',
        code: 'KE-SIIF0044',
        email: 'ke-siif0044@siifmart.com',
        password: 'kenya123',
        country: 'KE',
        siteCode: 'KE-02',
        siteName: 'Eastleigh 01',
        siteType: 'Warehouse'
      }
    ]
  },
  {
    siteCode: 'KE-03',
    siteName: 'Kileleshwa',
    siteType: 'Store',
    country: 'KE',
    accounts: [
      {
        name: 'Makena Benson',
        role: 'Store Manager',
        code: 'KE-SIIF0042',
        email: 'ke-siif0042@siifmart.com',
        password: 'kenya123',
        country: 'KE',
        siteCode: 'KE-03',
        siteName: 'Kileleshwa',
        siteType: 'Store'
      }
    ]
  }
];

export const ALL_STAGING_ACCOUNTS: StagingQuickAccount[] = stagingAccountsData as StagingQuickAccount[];

export function checkIsLocalhost(hostname?: string, isDev?: boolean): boolean {
  const currentDev = isDev !== undefined ? isDev : Boolean(import.meta.env.DEV);
  if (!currentDev) return false;

  const currentHost = hostname !== undefined 
    ? hostname 
    : (typeof window !== 'undefined' ? window.location.hostname : '');
  
  if (!currentHost) return false;

  const blockedDomains = ['vercel.app', 'siifmart.com', 'netlify.app', 'github.io', 'onrender.com'];
  if (blockedDomains.some(domain => currentHost.includes(domain))) {
    return false;
  }

  return (
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    currentHost === '::1' ||
    currentHost.endsWith('.localhost')
  );
}

interface StagingQuickLoginProps {
  onSelectAccount: (email: string, password: string) => void;
  disabled?: boolean;
}

export function KenyanQuickLogin({ onSelectAccount, disabled = false }: StagingQuickLoginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KE' | 'ET'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const isLocalhost = checkIsLocalhost();

  if (!isLocalhost) {
    return null;
  }

  const getSiteIcon = (type: StagingQuickAccount['siteType']) => {
    switch (type) {
      case 'HQ':
        return <Crown size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />;
      case 'Administration':
        return <Building2 size={13} className="shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]" />;
      case 'Warehouse':
        return <Warehouse size={13} className="shrink-0 text-amber-700 dark:text-amber-400" />;
      case 'Store':
        return <Store size={13} className="shrink-0 text-blue-700 dark:text-blue-400" />;
    }
  };

  const groupedSites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = ALL_STAGING_ACCOUNTS.filter(acc => {
      if (countryFilter !== 'ALL' && acc.country !== 'GLOBAL' && acc.country !== countryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        acc.siteName.toLowerCase().includes(q) ||
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
  }, [countryFilter, searchQuery]);

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
            84 Roles Available
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
                  {f === 'ALL' ? 'All (84 Roles)' : f === 'KE' ? 'Kenya (42)' : 'Ethiopia (42)'}
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
            {groupedSites.length === 0 ? (
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
                        onClick={() => onSelectAccount(acc.email, acc.password)}
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
