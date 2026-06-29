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
    t: (key: string) => string;
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
    onCompleteJob,
    t
}) => {
    return (
        <div className="glass-panel p-2 md:p-6 relative overflow-hidden group">
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 blur-[120px] rounded-full pointer-events-none" />

            {/* ── DESKTOP: Full header with title + stats ── */}
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 rounded-2xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 transition-all">
                        <Layers className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('warehouse.putaway.putaway')}</h3>
                        <div className="flex items-center gap-2 mt-1.5 font-mono">
                            <span className="flex h-2 w-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse shadow-[0_0_8px_rgba(44,94,59,0.4)]" />
                            <p className="text-[10px] text-gray-555 dark:text-gray-400 font-black uppercase tracking-widest">{t('warehouse.putaway.active')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3 md:gap-4 w-auto">
                    {[
                        { label: t('warehouse.putaway.pending'), value: filteredJobsCount.pending, theme: 'blue' },
                        { label: t('warehouse.putaway.active'), value: filteredJobsCount.active, theme: 'amber' },
                        { label: t('warehouse.putaway.totalItems'), value: filteredJobsCount.inboundItems, theme: 'emerald' },
                        { label: t('warehouse.putaway.system'), value: 'ONLINE', theme: 'violet' }
                    ].map((stat, i) => (
                        <div key={i} className="px-4 md:px-5 py-2.5 bg-stone-50 dark:bg-white/5 border border-stone-200/50 dark:border-white/10 rounded-2xl transition-all shadow-inner hover:bg-stone-100 dark:hover:bg-white/10 group">
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-gray-555 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className={`text-sm md:text-lg font-mono font-black tabular-nums transition-colors ${
                                stat.theme === 'blue' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:text-[#1B3520]' :
                                stat.theme === 'amber' ? 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700' :
                                stat.theme === 'emerald' ? 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700' :
                                'text-stone-600 dark:text-stone-400'
                            }`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MOBILE: Compact bar ── */}
            <div className="md:hidden flex flex-col gap-3 relative z-10 p-1">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder={`${t('warehouse.putaway.search')}`}
                            value={putawaySearch}
                            onChange={(e) => setPutawaySearch(e.target.value)}
                            className="woody-input w-full pl-10 pr-4 text-sm"
                        />
                    </div>
                    
                    <div className="glass-panel-pushed p-1 flex shrink-0">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                        >
                            {t('warehouse.putaway.process')}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                        >
                            {t('warehouse.putaway.history')}
                        </button>
                    </div>

                    <button
                        onClick={() => refreshData()}
                        disabled={isSubmitting}
                        className="woody-btn-secondary p-2.5 text-stone-600 hover:text-[#2C5E3B]"
                        title={t('warehouse.putaway.syncOperations')}
                    >
                        <RefreshCw size={18} className={isSubmitting ? 'animate-spin' : ''} />
                    </button>
                </div>

                {onStartScanning && viewMode === 'Process' && (
                    <button
                        onClick={onStartScanning}
                        disabled={isSubmitting}
                        className="woody-btn-primary w-full h-12 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Smartphone size={16} /> {t('warehouse.scanBarcode')}
                    </button>
                )}
            </div>

            {/* ── DESKTOP: Full filters row ── */}
            <div className="hidden md:flex flex-row gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div className="flex-1 relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within/search:text-[#2C5E3B] dark:group-focus-within/search:text-[#A9CBA2] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder={`${t('warehouse.putaway.search')}`}
                        value={putawaySearch}
                        onChange={(e) => setPutawaySearch(e.target.value)}
                        className="woody-input w-full py-3.5 pl-12 pr-4 font-mono"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="glass-panel-pushed p-1.5 flex mr-2 shadow-inner">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-md' : 'text-gray-555 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('warehouse.putaway.process')}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-md' : 'text-gray-555 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('warehouse.putaway.history')}
                        </button>
                    </div>

                    {viewMode === 'Process' && (
                        <>
                            <div className="flex glass-panel-pushed p-1.5 shrink-0 shadow-inner">
                                {(['All', 'Pending', 'In-Progress'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setPutawayStatusFilter(status)}
                                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${putawayStatusFilter === status ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-md' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                    >
                                        {status === 'All' ? t('warehouse.allStatus') : status === 'Pending' ? t('warehouse.pending') : t('warehouse.inProgress')}
                                    </button>
                                ))}
                            </div>

                            <SortDropdown
                                label={t('warehouse.priority')}
                                options={[
                                    { id: 'priority' as const, label: t('warehouse.priority'), icon: <AlertTriangle size={14} /> },
                                    { id: 'date' as const, label: t('warehouse.date'), icon: <Clock size={14} /> },
                                    { id: 'items' as const, label: t('warehouse.items'), icon: <List size={14} /> }
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
                            className="woody-btn-primary px-6 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} className="stroke-[3]" /> {t('warehouse.completeJob')}
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => refreshData()}
                        disabled={isSubmitting}
                        className="woody-btn-secondary p-3.5 text-stone-600 dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                        title={t('warehouse.putaway.syncOperations')}
                    >
                        <RefreshCw size={20} className={`transform group-hover:rotate-180 transition-transform duration-700 ${isSubmitting ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};
