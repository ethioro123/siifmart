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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="hidden md:block">
                <h3 className="font-bold text-white text-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-primary/30 to-blue-500/20 flex items-center justify-center">
                        <Package size={20} className="text-cyber-primary" />
                    </div>
                    {t('warehouse.pickQueue')}
                </h3>
                <p className="text-gray-500 text-sm mt-1">{t('warehouse.selectJobToAssign')}</p>
            </div>

            {/* ── MOBILE: Compact bar — just search + toggle ── */}
            <div className="md:hidden flex items-center gap-2 w-full relative z-10">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={pickSearch}
                        onChange={(e) => setPickSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-cyber-primary/50 transition-all outline-none"
                    />
                </div>
                <div className="bg-black/30 p-0.5 rounded-lg border border-white/10 flex flex-shrink-0">
                    <button
                        onClick={() => setViewMode('Process')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-cyber-primary text-black' : 'text-gray-400'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
                    >
                        History
                    </button>
                </div>
            </div>


            {/* ── DESKTOP: Quick Stats & Search ── */}
            <div className="hidden md:flex flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="relative group min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* Import Search explicitly if needed, assuming lucide-react is available */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-focus-within:text-cyber-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search Pick Jobs..."
                        value={pickSearch}
                        onChange={(e) => setPickSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-[12px] font-bold tracking-tight focus:border-cyber-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-gray-600"
                    />
                </div>

                <div className="h-8 w-px bg-white/10 hidden md:block" />

                <div className="bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/5 flex gap-1 hidden md:flex">
                    <button
                        onClick={() => setViewMode('Process')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        History
                    </button>
                </div>

                <div className="h-8 w-px bg-white/10 hidden md:block" />

                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl px-4 py-2 border border-yellow-500/20">
                    <p className="text-yellow-400 font-bold text-lg">{pendingCount}</p>
                    <p className="text-[10px] text-yellow-500/70 uppercase">Pending</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl px-4 py-2 border border-blue-500/20">
                    <p className="text-blue-400 font-bold text-lg">{inProgressCount}</p>
                    <p className="text-[10px] text-blue-500/70 uppercase">In Progress</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl px-4 py-2 border border-green-500/20">
                    <p className="text-green-400 font-bold text-lg">{completedCount}</p>
                    <p className="text-[10px] text-green-500/70 uppercase">Done</p>
                </div>
            </div>
        </div>
    );
};
