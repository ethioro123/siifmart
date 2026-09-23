import React from 'react';
import { Package } from 'lucide-react';

interface PickHeaderProps {
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    t: (key: string) => string;
    pickSearch: string;
    setPickSearch: (val: string) => void;
}

export const PickHeader: React.FC<PickHeaderProps> = ({
    pendingCount,
    inProgressCount,
    completedCount,
    viewMode,
    setViewMode,
    t,
    pickSearch,
    setPickSearch
}) => {
    return (
        <div className="glass-panel p-3 sm:p-5 md:p-8 relative overflow-hidden group">
            {/* Background Accent Glow */}
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="hidden md:block absolute -bottom-24 -left-24 w-48 h-48 bg-[#A9CBA2]/5 dark:bg-[#A9CBA2]/10 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6 xl:gap-8">
                {/* Title Section */}
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0 w-full sm:w-auto">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl md:rounded-[1.25rem] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center shadow-sm shrink-0">
                        <Package size={22} className="sm:w-7 sm:h-7 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-1.5 truncate">
                            {t('warehouse.pickQueue')}
                        </h3>
                        <div className="flex items-center gap-2 font-mono">
                            <span className="flex h-2 w-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse shrink-0" />
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-[0.15em] truncate">
                                {t('warehouse.selectJobToAssign')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
                    {/* Search Hub */}
                    <div className="relative group/search flex-1 xl:w-72 lg:w-96 min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-zinc-500 group-focus-within/search:text-[#2C5E3B] dark:group-focus-within/search:text-[#A9CBA2] transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder={`${t('warehouse.searchByIdOrOrder')}`}
                            aria-label={t('warehouse.searchByIdOrOrder')}
                            title={t('warehouse.searchByIdOrOrder')}
                            value={pickSearch}
                            onChange={(e) => setPickSearch(e.target.value)}
                            className="woody-input w-full !pl-10 pr-4 py-2.5 sm:py-3 text-xs min-h-[44px]"
                        />
                    </div>

                    {/* View Switcher & Stats wrapper for mobile */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* View Switcher */}
                        <div className="glass-panel-pushed p-1 flex shadow-inner shrink-0 min-h-[44px] items-center">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-[0.12em] min-h-[36px] transition-colors ${viewMode === 'Process' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-[#2C5E3B] dark:hover:text-white'}`}
                            >
                                {t('warehouse.putaway.process')}
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-[0.12em] min-h-[36px] transition-colors ${viewMode === 'History' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-[#2C5E3B] dark:hover:text-white'}`}
                            >
                                {t('warehouse.history')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full sm:w-auto">
                        {[
                            { count: pendingCount, label: t('warehouse.pending'), theme: 'amber' },
                            { count: inProgressCount, label: t('warehouse.inProgress'), theme: 'blue' },
                            { count: completedCount, label: t('warehouse.completed'), theme: 'emerald' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-stone-50 dark:bg-white/5 border border-stone-200/50 dark:border-white/10 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-center sm:text-left shadow-inner transition-colors">
                                <p className={`text-base sm:text-lg md:text-xl font-mono font-black tabular-nums leading-none mb-1 ${
                                    stat.theme === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                                    stat.theme === 'blue' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' :
                                    'text-emerald-600 dark:text-emerald-400'
                                }`}>{stat.count}</p>
                                <p className="text-[9px] text-slate-400 dark:text-zinc-400 font-black uppercase tracking-wider truncate">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
