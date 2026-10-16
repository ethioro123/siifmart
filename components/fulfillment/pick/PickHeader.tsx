import React from 'react';
import { Package, Search } from 'lucide-react';

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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6">
                {/* Title Section */}
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                        <Package size={24} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase leading-tight truncate">
                            {t('warehouse.pickQueue')}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-[var(--theme-accent)] shrink-0" />
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider truncate">
                                {t('warehouse.selectJobToAssign')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    {/* Search Hub */}
                    <div className="relative flex-1 xl:w-72 lg:w-80 min-w-0">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        <input
                            type="text"
                            placeholder={`${t('warehouse.searchByIdOrOrder')}`}
                            aria-label={t('warehouse.searchByIdOrOrder')}
                            title={t('warehouse.searchByIdOrOrder')}
                            value={pickSearch}
                            onChange={(e) => setPickSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] text-xs font-medium focus:outline-none focus:border-[var(--theme-accent)] transition-colors min-h-[44px]"
                        />
                    </div>

                    {/* View Switcher Segmented Control */}
                    <div className="bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] flex items-center shrink-0 min-h-[44px] w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider min-h-[36px] transition-colors ${
                                viewMode === 'Process'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.process') || 'Queue'}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider min-h-[36px] transition-colors ${
                                viewMode === 'History'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.history')}
                        </button>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                        {[
                            { count: pendingCount, label: t('warehouse.pending'), color: 'text-amber-500' },
                            { count: inProgressCount, label: t('warehouse.inProgress'), color: 'text-[var(--theme-accent)]' },
                            { count: completedCount, label: t('warehouse.completed'), color: 'text-emerald-500' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 sm:px-3 py-2 text-center sm:text-left min-w-0">
                                <p className={`text-sm sm:text-lg font-mono font-bold tabular-nums leading-none mb-1 ${stat.color}`}>
                                    {stat.count}
                                </p>
                                <p className="text-[9.5px] sm:text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-tight sm:tracking-wider leading-none">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
