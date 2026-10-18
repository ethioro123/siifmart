import React, { useState, useEffect } from 'react';
import { Layers, Search, AlertTriangle, Clock, List, RefreshCw, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { SortDropdown } from '../FulfillmentShared';

/** Returns true when viewport < 768 px (md breakpoint). SSR-safe. */
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

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
    const isMobile = useIsMobile();
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl md:rounded-2xl p-2.5 md:p-6 mb-2 md:mb-4 relative overflow-hidden shadow-[var(--shadow-sm)]">
            {/* DESKTOP: Full header with title + stats */}
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                        <Layers size={22} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight">{t('warehouse.putaway.putaway')}</h3>
                        <div className="flex items-center gap-2 mt-1 font-mono">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">{t('warehouse.putaway.active')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 md:gap-3 w-auto">
                    {[
                        { label: t('warehouse.putaway.pending'), value: filteredJobsCount.pending },
                        { label: t('warehouse.putaway.active'), value: filteredJobsCount.active },
                        { label: t('warehouse.putaway.totalItems'), value: filteredJobsCount.inboundItems },
                        { label: t('warehouse.putaway.system'), value: 'ONLINE' }
                    ].map((stat, i) => (
                        <div key={i} className="px-4 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl transition-colors">
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">{stat.label}</p>
                            <p className="text-sm md:text-base font-mono font-bold tabular-nums text-[var(--theme-text-primary)]">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {isMobile ? (
                /* MOBILE: Compact bar */
                <div className="flex flex-col gap-2 relative z-10">
                    {/* View mode toggle + dot numbers + sync on top row */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="p-0.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center shrink-0">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] ${viewMode === 'Process' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)]'}`}
                            >
                                {t('warehouse.putaway.process')}
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] ${viewMode === 'History' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)]'}`}
                            >
                                {t('warehouse.putaway.history')}
                            </button>
                        </div>

                        {/* Mobile Dot Numbers */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-[10px] font-mono shrink-0">
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold" title="Active">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {filteredJobsCount.active}
                            </span>
                        </div>

                        <button
                            onClick={() => refreshData()}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors shrink-0"
                            title={t('warehouse.putaway.syncOperations')}
                        >
                            <RefreshCw size={15} className={isSubmitting ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Full-width Search row */}
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={15} />
                        <input
                            type="text"
                            placeholder={`${t('warehouse.putaway.search')}`}
                            aria-label={t('warehouse.putaway.search')}
                            title={t('warehouse.putaway.search')}
                            value={putawaySearch}
                            onChange={(e) => setPutawaySearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono text-[var(--theme-text-primary)] min-h-[38px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {onStartScanning && viewMode === 'Process' && (
                        <button
                            onClick={onStartScanning}
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                        >
                            <Smartphone size={16} /> {t('warehouse.scanBarcode')}
                        </button>
                    )}
                </div>
            ) : (
                /* DESKTOP: Full filters row */
                <div className="flex flex-row gap-3 mt-6 pt-5 border-t border-[var(--theme-border)] relative z-10 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                        <input
                            type="text"
                            placeholder={`${t('warehouse.putaway.search')}`}
                            aria-label={t('warehouse.putaway.search')}
                            title={t('warehouse.putaway.search')}
                            value={putawaySearch}
                            onChange={(e) => setPutawaySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl font-mono text-xs md:text-sm text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center shrink-0">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${viewMode === 'Process' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                            >
                                {t('warehouse.putaway.process')}
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${viewMode === 'History' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                            >
                                {t('warehouse.putaway.history')}
                            </button>
                        </div>

                        {viewMode === 'Process' && (
                            <>
                                <div className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center shrink-0">
                                    {(['All', 'Pending', 'In-Progress'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setPutawayStatusFilter(status)}
                                            className={`px-4 py-2 text-xs font-semibold transition-all rounded-lg min-h-[36px] ${putawayStatusFilter === status ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
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
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider min-h-[44px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle size={18} /> {t('warehouse.completeJob')}
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => refreshData()}
                            disabled={isSubmitting}
                            className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-all group"
                            title={t('warehouse.putaway.syncOperations')}
                        >
                            <RefreshCw size={18} className={`transform group-hover:rotate-180 transition-transform duration-700 ${isSubmitting ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
