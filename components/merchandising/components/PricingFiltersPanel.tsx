import React from 'react';
import {
    Search, Tags, Map, Calculator, Zap, Percent, RefreshCw, XCircle, CheckCircle
} from 'lucide-react';
import { useMerchandising } from '../MerchandisingContext';
import { ALL_CATEGORY_OPTIONS } from '../../../constants';

export const PricingFiltersPanel: React.FC = () => {
    const {
        searchTerm,
        setSearchTerm,
        isFilterPanelOpen,
        filters,
        setFilters,
        sites,
        currencySymbol
    } = useMerchandising();

    if (!isFilterPanelOpen) {
        return (
            /* Renders only active chips if closed */
            <ActiveFilterChips />
        );
    }

    return (
        <div className="mt-4 p-6 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm animate-in slide-in-from-top-3 duration-200">
            {/* Categories Section */}
            <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--theme-border)]">
                    <Tags size={15} className="text-[var(--theme-accent)]" />
                    <label className="text-xs uppercase text-[var(--theme-text-primary)] font-semibold tracking-wider">Categories</label>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {ALL_CATEGORY_OPTIONS.map(cat => (
                        <label
                            key={cat}
                            className="flex items-center gap-2.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer group transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={filters.categories.includes(cat)}
                                onChange={(e) => {
                                    const next = e.target.checked
                                        ? [...filters.categories, cat]
                                        : filters.categories.filter(c => c !== cat);
                                    setFilters({ ...filters, categories: next });
                                }}
                                className="accent-[var(--theme-accent)] w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sites Section */}
            <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--theme-border)]">
                    <Map size={15} className="text-[var(--theme-accent)]" />
                    <label className="text-xs uppercase text-[var(--theme-text-primary)] font-semibold tracking-wider">Store Locations</label>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {sites.map(site => (
                        <label
                            key={site.id}
                            className="flex items-center gap-2.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer group transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={filters.sites.includes(site.id)}
                                onChange={(e) => {
                                    const next = e.target.checked ? [...filters.sites, site.id] : filters.sites.filter(s => s !== site.id);
                                    setFilters({ ...filters, sites: next });
                                }}
                                className="accent-[var(--theme-accent)] w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform">{site.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price & Margin Range Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--theme-border)]">
                    <Calculator size={15} className="text-[var(--theme-accent)]" />
                    <label className="text-xs uppercase text-[var(--theme-text-primary)] font-semibold tracking-wider">Market Position</label>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Price Range ({currencySymbol})</span>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20 transition-all font-mono tabular-nums"
                                value={filters.minPrice}
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20 transition-all font-mono tabular-nums"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Target Margin (%)</span>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min %"
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20 transition-all font-mono tabular-nums"
                                value={filters.minMargin}
                                onChange={(e) => setFilters({ ...filters, minMargin: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Max %"
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20 transition-all font-mono tabular-nums"
                                value={filters.maxMargin}
                                onChange={(e) => setFilters({ ...filters, maxMargin: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Velocity & Automation Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--theme-border)]">
                    <Zap size={15} className="text-[var(--theme-accent)]" />
                    <label className="text-xs uppercase text-[var(--theme-text-primary)] font-semibold tracking-wider">Performance</label>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Sales Velocity</span>
                        <div className="flex flex-wrap gap-1.5">
                            {['High', 'Medium', 'Low'].map(v => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => {
                                        const next = filters.velocities.includes(v)
                                            ? filters.velocities.filter(item => item !== v)
                                            : [...filters.velocities, v];
                                        setFilters({ ...filters, velocities: next });
                                    }}
                                    className={`h-7 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        filters.velocities.includes(v)
                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                            : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                    }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Campaign Status</span>
                        <button
                            type="button"
                            onClick={() => setFilters({ ...filters, onSale: filters.onSale === true ? null : true })}
                            className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                filters.onSale === true
                                    ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/30'
                                    : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Percent
                                    size={14}
                                    className={filters.onSale === true ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}
                                />
                                <span>On Sale / Active Promo</span>
                            </div>
                            <div
                                className={`w-8 h-4.5 rounded-full relative transition-colors ${
                                    filters.onSale === true ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${
                                        filters.onSale === true ? 'left-4' : 'left-0.5'
                                    }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setFilters({
                            categories: [],
                            sites: [],
                            velocities: [],
                            onSale: null,
                            minPrice: '',
                            maxPrice: '',
                            minMargin: '',
                            maxMargin: ''
                        });
                        setSearchTerm('');
                    }}
                    className="w-full h-9 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-all flex items-center justify-center gap-1.5 rounded-xl border border-[var(--theme-border)] cursor-pointer active:scale-[0.98]"
                >
                    <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span>Reset All Filters</span>
                </button>
            </div>
        </div>
    );
};

export const ActiveFilterChips: React.FC = () => {
    const {
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        sites,
        currencySymbol
    } = useMerchandising();

    const hasActiveFilters = searchTerm || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '');

    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in duration-300">
            {searchTerm && (
                <div className="flex items-center gap-2 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 px-3 py-1 rounded-full text-xs text-[var(--theme-accent)] font-medium">
                    <Search size={12} />
                    <span>"{searchTerm}"</span>
                    <button
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                        className="text-[var(--theme-status-danger-text)] transition-colors opacity-70 hover:opacity-100"
                    >
                        <XCircle size={13} />
                    </button>
                </div>
            )}
            {filters.categories.map(cat => (
                <div
                    key={cat}
                    className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1 rounded-full text-xs text-[var(--theme-text-primary)] font-medium"
                >
                    <Tags size={12} className="text-[var(--theme-text-secondary)]" />
                    <span>{cat}</span>
                    <button
                        onClick={() => setFilters({ ...filters, categories: filters.categories.filter(c => c !== cat) })}
                        aria-label={`Remove category filter ${cat}`}
                        className="text-[var(--theme-status-danger-text)] transition-colors text-[var(--theme-text-secondary)] hover:opacity-100"
                    >
                        <XCircle size={13} />
                    </button>
                </div>
            ))}
            {filters.sites.map(sid => (
                <div
                    key={sid}
                    className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1 rounded-full text-xs text-[var(--theme-text-primary)] font-medium"
                >
                    <Map size={12} className="text-[var(--theme-accent)]" />
                    <span>{sites.find(s => s.id === sid)?.name}</span>
                    <button
                        onClick={() => setFilters({ ...filters, sites: filters.sites.filter(s => s !== sid) })}
                        aria-label="Remove site filter"
                        className="text-[var(--theme-status-danger-text)] transition-colors text-[var(--theme-text-secondary)] hover:opacity-100"
                    >
                        <XCircle size={13} />
                    </button>
                </div>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
                <div
                    className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1 rounded-full text-xs text-[var(--theme-text-primary)] font-medium"
                >
                    <Calculator size={12} className="text-[var(--theme-status-success-text)]" />
                    <span className="font-mono tabular-nums">
                        {currencySymbol} {filters.minPrice || '0'} - {currencySymbol} {filters.maxPrice || '∞'}
                    </span>
                    <button
                        onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}
                        aria-label="Clear price range filter"
                        className="text-[var(--theme-status-danger-text)] transition-colors text-[var(--theme-text-secondary)] hover:opacity-100"
                    >
                        <XCircle size={13} />
                    </button>
                </div>
            )}
            {filters.onSale && (
                <div className="flex items-center gap-2 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] px-3 py-1 rounded-full text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium">
                    <Percent size={12} />
                    <span>On Sale</span>
                    <button
                        onClick={() => setFilters({ ...filters, onSale: null })}
                        aria-label="Remove sale filter"
                        className="text-[var(--theme-status-danger-text)] transition-colors opacity-70 hover:opacity-100"
                    >
                        <XCircle size={13} />
                    </button>
                </div>
            )}
        </div>
    );
};
