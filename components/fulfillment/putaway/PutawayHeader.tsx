import React from 'react';
import { Layers, Search, AlertTriangle, Clock, List, RefreshCw } from 'lucide-react';
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
    setViewMode
}) => {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-3xl p-2 md:p-6 shadow-2xl relative overflow-hidden group">
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* ── DESKTOP: Full header with title + stats ── */}
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Layers className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Putaway Operations Hub</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Storage Matrix Active</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 w-auto">
                    {[
                        { label: 'Pending Jobs', value: filteredJobsCount.pending, color: 'blue' },
                        { label: 'Active Jobs', value: filteredJobsCount.active, color: 'yellow' },
                        { label: 'Total Items', value: filteredJobsCount.inboundItems, color: 'green' },
                        { label: 'Capacity', value: '88%', color: 'purple' }
                    ].map((stat, i) => (
                        <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
                            <p className={`text-lg font-mono font-black text-${stat.color}-400`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MOBILE: Compact bar — just search + toggle ── */}
            <div className="md:hidden flex items-center gap-2 relative z-10">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={putawaySearch}
                        onChange={(e) => setPutawaySearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 transition-all outline-none"
                    />
                </div>
                <div className="bg-black/30 p-0.5 rounded-lg border border-white/10 flex flex-shrink-0">
                    <button
                        onClick={() => setViewMode('Process')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
                    >
                        Jobs
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-cyber-primary text-black' : 'text-gray-400'}`}
                    >
                        History
                    </button>
                </div>
                <button
                    onClick={() => refreshData()}
                    disabled={isSubmitting}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-blue-400 active:scale-95 disabled:opacity-50 flex-shrink-0"
                    title="Refresh"
                >
                    <RefreshCw size={16} className={isSubmitting ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── DESKTOP: Full filters row ── */}
            <div className="hidden md:flex flex-row gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Scan Job ID or SKU..."
                        value={putawaySearch}
                        onChange={(e) => setPutawaySearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex mr-2">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Process
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>

                    {viewMode === 'Process' && (
                        <>
                            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 shrink-0">
                                {(['All', 'Pending', 'In-Progress'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setPutawayStatusFilter(status)}
                                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${putawayStatusFilter === status ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <SortDropdown
                                label="Sort"
                                options={[
                                    { id: 'priority' as const, label: 'Priority', icon: <AlertTriangle size={12} /> },
                                    { id: 'date' as const, label: 'Date', icon: <Clock size={12} /> },
                                    { id: 'items' as const, label: 'Items', icon: <List size={12} /> }
                                ]}
                                value={putawaySortBy}
                                onChange={(val) => setPutawaySortBy(val)}
                                isOpen={isPutawaySortDropdownOpen}
                                setIsOpen={setIsPutawaySortDropdownOpen}
                            />
                        </>
                    )}

                    <button
                        onClick={() => refreshData()}
                        disabled={isSubmitting}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-blue-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync Operations"
                    >
                        <RefreshCw size={18} className={isSubmitting ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
        </div>
    );
};
