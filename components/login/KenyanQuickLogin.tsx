import React, { useState } from 'react';
import { Building2, Warehouse, Store, ChevronDown, ChevronUp, ShieldCheck, UserCheck, Crown } from 'lucide-react';

export interface StagingQuickAccount {
  name: string;
  role: string;
  code: string;
  email: string;
  password: string;
}

export interface StagingSiteGroup {
  siteCode: string;
  siteName: string;
  siteType: 'HQ' | 'Administration' | 'Warehouse' | 'Store';
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
        password: 'kenya123'
      },
      {
        name: 'Omondi Samuel',
        role: 'Operations Manager',
        code: 'KE-SIIF0041',
        email: 'ke-siif0041@siifmart.com',
        password: 'kenya123'
      },
      {
        name: 'Musyoka Kioko',
        role: 'HR Manager',
        code: 'KE-SIIF0043',
        email: 'ke-siif0043@siifmart.com',
        password: 'kenya123'
      },
      {
        name: 'Oscar Kennedy',
        role: 'Procurement Manager',
        code: 'KE-SIIF0045',
        email: 'ke-siif0045@siifmart.com',
        password: 'kenya123'
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
        password: 'kenya123'
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
        password: 'kenya123'
      }
    ]
  }
];

/**
 * Live, verified staging accounts seeded in Supabase Staging Auth & employees.
 * Password for all staging accounts: StagingPassword123!
 */
export const STAGING_QUICK_SITES: StagingSiteGroup[] = [
  {
    siteCode: 'HQ-GLOBAL',
    siteName: 'Global Executive Authority',
    siteType: 'HQ',
    country: 'GLOBAL',
    accounts: [
      {
        name: 'Staging Executive Admin',
        role: 'CEO / Super Admin',
        code: 'EMP-STG-001',
        email: 'admin@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  },
  {
    siteCode: 'KE-NRB',
    siteName: 'Kenya Regional Administration',
    siteType: 'Administration',
    country: 'KE',
    accounts: [
      {
        name: 'Kamau Ndenga',
        role: 'Regional Operations Manager',
        code: 'KE-EMP-001',
        email: 'ke.manager@staging.siifmart.com',
        password: 'StagingPassword123!'
      },
      {
        name: 'Oscar Kennedy',
        role: 'Regional Procurement Lead',
        code: 'KE-EMP-002',
        email: 'ke.procurement@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  },
  {
    siteCode: 'NBO-DC01',
    siteName: 'Nairobi Central DC',
    siteType: 'Warehouse',
    country: 'KE',
    accounts: [
      {
        name: 'Kennedy Odhiambo',
        role: 'Warehouse Operations Manager',
        code: 'KE-EMP-003',
        email: 'ke.warehouse@staging.siifmart.com',
        password: 'StagingPassword123!'
      },
      {
        name: 'Gideon Jakaranda',
        role: 'Lead Fulfillment Picker',
        code: 'KE-EMP-004',
        email: 'ke.picker@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  },
  {
    siteCode: 'NBO-RET01',
    siteName: 'Westlands Supermarket',
    siteType: 'Store',
    country: 'KE',
    accounts: [
      {
        name: 'Makena Benson',
        role: 'Retail Store Manager',
        code: 'KE-EMP-005',
        email: 'ke.storemanager@staging.siifmart.com',
        password: 'StagingPassword123!'
      },
      {
        name: 'Amina Wanjiku',
        role: 'Senior Cashier & POS Operator',
        code: 'KE-EMP-006',
        email: 'ke.cashier@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  },
  {
    siteCode: 'ET-ADD',
    siteName: 'Addis Ababa Regional Administration',
    siteType: 'Administration',
    country: 'ET',
    accounts: [
      {
        name: 'Henok Tadesse',
        role: 'Regional Operations Manager',
        code: 'ET-EMP-001',
        email: 'et.manager@staging.siifmart.com',
        password: 'StagingPassword123!'
      },
      {
        name: 'Yohannes Bekele',
        role: 'Regional Procurement Lead',
        code: 'ET-EMP-002',
        email: 'et.procurement@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  },
  {
    siteCode: 'ADD-DC01',
    siteName: 'Addis Ababa Central DC',
    siteType: 'Warehouse',
    country: 'ET',
    accounts: [
      {
        name: 'Chala Adam',
        role: 'Warehouse Operations Manager',
        code: 'ET-EMP-003',
        email: 'et.warehouse@staging.siifmart.com',
        password: 'StagingPassword123!'
      },
      {
        name: 'Tola Bekele',
        role: 'Inbound Receiver & Dock Specialist',
        code: 'ET-EMP-004',
        email: 'et.picker@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  },
  {
    siteCode: 'ADD-RET01',
    siteName: 'Bole Supermarket',
    siteType: 'Store',
    country: 'ET',
    accounts: [
      {
        name: 'Amina Ali',
        role: 'Retail Store Manager',
        code: 'ET-EMP-005',
        email: 'et.storemanager@staging.siifmart.com',
        password: 'StagingPassword123!'
      },
      {
        name: 'Selamawit Girma',
        role: 'Senior Cashier & POS Operator',
        code: 'ET-EMP-006',
        email: 'et.cashier@staging.siifmart.com',
        password: 'StagingPassword123!'
      }
    ]
  }
];

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
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'KE' | 'ET'>('ALL');
  const isLocalhost = checkIsLocalhost();

  if (!isLocalhost) {
    return null;
  }

  const getSiteIcon = (type: StagingSiteGroup['siteType']) => {
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

  const filteredSites = STAGING_QUICK_SITES.filter(site => {
    if (selectedFilter === 'ALL') return true;
    return site.country === selectedFilter || site.country === 'GLOBAL';
  });

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
            Staging Sandbox
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
          {/* Quick Filter Pill */}
          <div className="flex items-center gap-1.5 px-0.5">
            {(['ALL', 'KE', 'ET'] as const).map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24]'
                    : 'bg-stone-100 dark:bg-white/[0.05] text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {filter === 'ALL' ? 'All Roles' : filter === 'KE' ? 'Kenya (KES)' : 'Ethiopia (ETB)'}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {filteredSites.map((site) => (
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
                      className="p-2.5 text-left bg-white/70 dark:bg-black/30 hover:bg-stone-50 dark:hover:bg-white/[0.05] border border-[#E2DCCE]/60 dark:border-white/[0.06] hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-xl transition-all duration-200 flex flex-col justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <span className="text-xs font-semibold text-[#1E3F27] dark:text-[#EAE5D9] group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors truncate">
                          {acc.name}
                        </span>
                        <UserCheck size={11} className="shrink-0 text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors mt-0.5" />
                      </div>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-[10px] font-medium text-[#4D6E56] dark:text-[#A9CBA2] truncate">
                          {acc.role}
                        </span>
                        <span className="text-[9px] font-mono tabular-nums text-stone-400 dark:text-stone-500 shrink-0">
                          {acc.code}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
