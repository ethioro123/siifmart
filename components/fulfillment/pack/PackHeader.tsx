import React from 'react';
import { Package, Filter, ChevronDown, CheckCircle, AlertTriangle, Clock, List, Search, X } from 'lucide-react';
import { SortDropdown } from '../../shared';

interface PackHeaderProps {
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    packJobFilter: 'all' | 'pending' | 'in-progress' | 'completed';
    setPackJobFilter: (val: 'all' | 'pending' | 'in-progress' | 'completed') => void;
    isPackFilterDropdownOpen: boolean;
    setIsPackFilterDropdownOpen: (val: boolean) => void;
    packSortBy: 'priority' | 'date' | 'items';
    setPackSortBy: (val: 'priority' | 'date' | 'items') => void;
    isPackSortDropdownOpen: boolean;
    setIsPackSortDropdownOpen: (val: boolean) => void;
    packSearch: string;
    setPackSearch: (val: string) => void;
    t: (key: string) => string;
}

export const PackHeader: React.FC<PackHeaderProps> = ({
    viewMode, setViewMode, packJobFilter, setPackJobFilter, isPackFilterDropdownOpen, setIsPackFilterDropdownOpen,
    packSortBy, setPackSortBy, isPackSortDropdownOpen, setIsPackSortDropdownOpen, packSearch, setPackSearch, t
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 mb-4 shadow-sm">
            {/* Title row */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                    <Package size={24} strokeWidth={1.75} />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">{t('warehouse.tabs.pack')}</h2>
                    <p className="text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider mt-0.5">{t('warehouse.packDesc')}</p>
                </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* View mode toggle */}
                    <div className="bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] flex gap-1 shrink-0 min-h-[44px] items-center">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                viewMode === 'Process' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.process')}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                viewMode === 'History' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.history')}
                        </button>
                    </div>

                    {/* Filter dropdown */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsPackFilterDropdownOpen(!isPackFilterDropdownOpen)}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider transition-colors min-h-[44px]"
                        >
                            <Filter size={14} className={packJobFilter !== 'all' ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'} />
                            <span className="inline truncate max-w-[90px]">{packJobFilter === 'all' ? t('warehouse.allStatus') : packJobFilter}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 text-[var(--theme-text-secondary)] ${isPackFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPackFilterDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsPackFilterDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-1.5 shadow-xl z-[51] animate-in fade-in zoom-in-95 duration-150">
                                    {['all', 'pending', 'in-progress', 'completed'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => { setPackJobFilter(status as any); setIsPackFilterDropdownOpen(false); }}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-between min-h-[38px] ${
                                                packJobFilter === status ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
                                            }`}
                                        >
                                            {status === 'all' ? t('warehouse.allStatus') : status}
                                            {packJobFilter === status && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sort — desktop only */}
                    <div className="hidden md:block shrink-0">
                        <SortDropdown
                            label={t('warehouse.sortByLabel')}
                            options={[
                                { id: 'priority', label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> },
                                { id: 'date', label: t('warehouse.timeSort'), icon: <Clock size={12} /> },
                                { id: 'items', label: t('warehouse.itemPlural'), icon: <List size={12} /> }
                            ]}
                            value={packSortBy}
                            onChange={(val: any) => setPackSortBy(val)}
                            isOpen={isPackSortDropdownOpen}
                            setIsOpen={setIsPackSortDropdownOpen}
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={16} className="text-[var(--theme-text-secondary)]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search SKU, barcode, order..."
                        aria-label="Search product, SKU, barcode, order"
                        title="Search product, SKU, barcode, order"
                        value={packSearch}
                        onChange={(e) => setPackSearch(e.target.value)}
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-10 pr-9 py-2.5 text-[var(--theme-text-primary)] text-xs font-medium focus:border-[var(--theme-accent)] outline-none transition-colors placeholder:text-[var(--theme-text-secondary)] min-h-[44px]"
                    />
                    {packSearch && (
                        <button
                            onClick={() => setPackSearch('')}
                            aria-label="Clear search"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[36px] justify-center"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
