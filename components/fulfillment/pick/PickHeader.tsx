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
        <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl md:rounded-[2.5rem] p-4 md:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-all">
            {/* Background Accent Glow */}
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="hidden md:block absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                {/* Title Section */}
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[1.25rem] bg-cyan-600 dark:bg-cyber-primary/20 border border-cyan-700 dark:border-cyber-primary/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Package size={28} className="text-white dark:text-cyber-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none mb-2">
                            {t('warehouse.pickQueue')}
                        </h3>
                        <div className="flex items-center gap-2 font-mono">
                            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                {t('warehouse.selectJobToAssign')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Controls */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
                    {/* Search Hub */}
                    <div className="relative group/search flex-1 xl:w-72 lg:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-zinc-600 group-focus-within/search:text-cyan-600 dark:group-focus-within/search:text-cyber-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search Pick Jobs..."
                            value={pickSearch}
                            onChange={(e) => setPickSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-xs font-black tracking-tight focus:border-cyan-500/50 dark:focus:border-cyber-primary/50 focus:bg-white dark:focus:bg-black/60 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700 shadow-inner"
                        />
                    </div>

                    {/* View Switcher */}
                    <div className="bg-slate-100 dark:bg-black/30 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 flex shadow-inner shrink-0">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'Process' ? 'bg-white dark:bg-cyber-primary text-slate-900 dark:text-black shadow-md' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'History' ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { count: pendingCount, label: 'Pending', theme: 'amber' },
                            { count: inProgressCount, label: 'Active', theme: 'blue' },
                            { count: completedCount, label: 'Relocated', theme: 'emerald' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-inner group/stat hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-300">
                                <p className={`text-lg md:text-xl font-mono font-black tabular-nums leading-none mb-1 ${
                                    stat.theme === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                                    stat.theme === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                    'text-emerald-600 dark:text-emerald-400'
                                }`}>{stat.count}</p>
                                <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
