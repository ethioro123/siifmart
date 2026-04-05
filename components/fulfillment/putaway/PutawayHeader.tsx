import React from 'react';
import { Layers, Search, AlertTriangle, Clock, List, RefreshCw, Smartphone, Loader2, CheckCircle } from 'lucide-react';
import { SortDropdown } from '../FulfillmentShared';

interface PutawayHeaderProps {
    filteredJobsCount: {
        pending: number;
        active: number;
        inboundItems: number;
    };
    putawaySearch: string;
    setPutawaySearch: (val: string) => void;
    putawayStatusFilter: 'All' | 'Pending' | 'In-Progress';
    setPutawayStatusFilter: (val: 'All' | 'Pending' | 'In-Progress') => void;
    putawaySortBy: 'priority' | 'date' | 'items';
    setPutawaySortBy: (val: 'priority' | 'date' | 'items') => void;
    isPutawaySortDropdownOpen: boolean;
    setIsPutawaySortDropdownOpen: (val: boolean) => void;
    refreshData: () => void;
    isSubmitting: boolean;
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    onStartScanning?: () => void;
    onCompleteJob?: () => Promise<void>;
}

export const PutawayHeader: React.FC<PutawayHeaderProps> = ({
    filteredJobsCount,
    putawaySearch,
    setPutawaySearch,
    putawayStatusFilter,
    setPutawayStatusFilter,
    putawaySortBy,
    setPutawaySortBy,
    isPutawaySortDropdownOpen,
    setIsPutawaySortDropdownOpen,
    refreshData,
    isSubmitting,
    viewMode,
    setViewMode,
    onStartScanning,
    onCompleteJob
}) => {
    return (
        <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl md:rounded-3xl p-2 md:p-6 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-all">
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* ── DESKTOP: Full header with title + stats ── */}
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-500/20 rounded-2xl shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-100 dark:border-blue-500/30 transition-all">
                        <Layers className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Putaway</h3>
                        <div className="flex items-center gap-2 mt-1.5 font-mono">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">Active</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3 md:gap-4 w-auto">
                    {[
                        { label: 'Pending', value: filteredJobsCount.pending, theme: 'blue' },
                        { label: 'Active', value: filteredJobsCount.active, theme: 'amber' },
                        { label: 'Total Items', value: filteredJobsCount.inboundItems, theme: 'emerald' },
                        { label: 'System', value: 'ONLINE', theme: 'violet' }
                    ].map((stat, i) => (
                        <div key={i} className="px-4 md:px-5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl transition-all shadow-inner hover:bg-slate-100 dark:hover:bg-white/10 group">
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className={`text-sm md:text-lg font-mono font-black tabular-nums transition-colors ${
                                stat.theme === 'blue' ? 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700' :
                                stat.theme === 'amber' ? 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700' :
                                stat.theme === 'emerald' ? 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700' :
                                'text-violet-600 dark:text-violet-400 group-hover:text-violet-700'
                            }`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MOBILE: Compact bar — just search + toggle + actions ── */}
            <div className="md:hidden flex flex-col gap-3 relative z-10 p-1">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={putawaySearch}
                            onChange={(e) => setPutawaySearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none"
                        />
                    </div>
                    
                    <div className="bg-slate-100 dark:bg-black/30 p-1 rounded-xl border border-slate-200 dark:border-white/10 flex shrink-0">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                        >
                            Process
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                        >
                            History
                        </button>
                    </div>

                    <button
                        onClick={() => refreshData()}
                        disabled={isSubmitting}
                        className="p-2.5 bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 rounded-xl text-blue-500 active:scale-95 disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={isSubmitting ? 'animate-spin' : ''} />
                    </button>
                </div>

                {onStartScanning && viewMode === 'Process' && (
                    <button
                        onClick={onStartScanning}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                    >
                        <Smartphone size={16} /> Open Scanner
                    </button>
                )}
            </div>

            {/* ── DESKTOP: Full filters row ── */}
            <div className="hidden md:flex flex-row gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div className="flex-1 relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within/search:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search Job ID, SKU or Location..."
                        value={putawaySearch}
                        onChange={(e) => setPutawaySearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 transition-all outline-none font-mono"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="bg-gray-100 dark:bg-black/30 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10 flex mr-2 shadow-inner">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-white dark:bg-blue-600 text-gray-900 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Process
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-white dark:bg-indigo-600 text-gray-900 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>

                    {viewMode === 'Process' && (
                        <>
                            <div className="flex bg-slate-50 dark:bg-white/5 rounded-2xl p-1.5 border border-slate-200 dark:border-white/10 shrink-0 shadow-inner">
                                {(['All', 'Pending', 'In-Progress'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setPutawayStatusFilter(status)}
                                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${putawayStatusFilter === status ? 'bg-white dark:bg-blue-600 text-gray-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <SortDropdown
                                label="Sort By"
                                options={[
                                    { id: 'priority' as const, label: 'Priority', icon: <AlertTriangle size={14} /> },
                                    { id: 'date' as const, label: 'Date', icon: <Clock size={14} /> },
                                    { id: 'items' as const, label: 'Items', icon: <List size={14} /> }
                                ]}
                                value={putawaySortBy}
                                onChange={(val) => setPutawaySortBy(val)}
                                isOpen={isPutawaySortDropdownOpen}
                                setIsOpen={setIsPutawaySortDropdownOpen}
                            />
                        </>
                    )}

                    {onCompleteJob && (
                        <button
                            onClick={onCompleteJob}
                            disabled={isSubmitting}
                            className="px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-[10px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} className="stroke-[3]" /> Finish Job
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => refreshData()}
                        disabled={isSubmitting}
                        className="p-3.5 bg-blue-50 dark:bg-white/5 hover:bg-blue-100 dark:hover:bg-white/10 border border-blue-100 dark:border-white/10 rounded-2xl text-blue-600 dark:text-blue-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/5 group"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={`transform group-hover:rotate-180 transition-transform duration-700 ${isSubmitting ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};
