import React from 'react';
import {
    Search, Tags, Map, Calculator, Zap, Percent, RefreshCw, XCircle, CheckCircle
} from 'lucide-react';
import { useMerchandising } from '../MerchandisingContext';
import { CURRENCY_SYMBOL, ALL_CATEGORY_OPTIONS } from '../../../constants';

export const PricingFiltersPanel: React.FC = () => {
    const {
        searchTerm,
        setSearchTerm,
        isFilterPanelOpen,
        filters,
        setFilters,
        sites
    } = useMerchandising();

    if (!isFilterPanelOpen) {
        return (
            /* Renders only active chips if closed */
            <ActiveFilterChips />
        );
    }

    return (
        <div className="mt-4 p-8 glass-panel grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            {/* Categories Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                    <Tags size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Categories</label>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                    {ALL_CATEGORY_OPTIONS.map(cat => (
                        <label
                            key={cat}
                            className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white cursor-pointer group transition-colors"
                        >
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={filters.categories.includes(cat)}
                                    onChange={(e) => {
                                        const next = e.target.checked
                                            ? [...filters.categories, cat]
                                            : filters.categories.filter(c => c !== cat);
                                        setFilters({ ...filters, categories: next });
                                    }}
                                    className="peer appearance-none w-4 h-4 border border-[#E2DCCE] dark:border-emerald-950/40 rounded-lg bg-white dark:bg-black/25 checked:bg-[#2C5E3B] dark:checked:bg-[#A9CBA2] checked:border-transparent transition-all cursor-pointer"
                                />
                                <CheckCircle
                                    size={10}
                                    className="absolute text-white dark:text-[#1E3B24] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                />
                            </div>
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sites Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                    <Map size={14} className="text-blue-500 dark:text-blue-400" />
                    <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Store Locations</label>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                    {sites.map(site => (
                        <label
                            key={site.id}
                            className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white cursor-pointer group transition-colors"
                        >
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={filters.sites.includes(site.id)}
                                    onChange={(e) => {
                                        const next = e.target.checked ? [...filters.sites, site.id] : filters.sites.filter(s => s !== site.id);
                                        setFilters({ ...filters, sites: next });
                                    }}
                                    className="peer appearance-none w-4 h-4 border border-[#E2DCCE] dark:border-emerald-950/40 rounded-lg bg-white dark:bg-black/25 checked:bg-[#2C5E3B] dark:checked:bg-[#A9CBA2] checked:border-transparent transition-all cursor-pointer"
                                />
                                <CheckCircle
                                    size={10}
                                    className="absolute text-white dark:text-[#1E3B24] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                />
                            </div>
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform">{site.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price & Margin Range Section */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                        <Calculator size={14} className="text-green-600 dark:text-green-400" />
                        <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Market Position</label>
                    </div>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Price Range ({CURRENCY_SYMBOL})</span>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Target Margin (%)</span>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min %"
                                    className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                    value={filters.minMargin}
                                    onChange={(e) => setFilters({ ...filters, minMargin: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max %"
                                    className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                    value={filters.maxMargin}
                                    onChange={(e) => setFilters({ ...filters, maxMargin: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Velocity & Automation Section */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                        <Zap size={14} className="text-yellow-600 dark:text-yellow-400" />
                        <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Performance</label>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Sales Velocity</span>
                            <div className="flex flex-wrap gap-2">
                                {['High', 'Medium', 'Low'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            const next = filters.velocities.includes(v)
                                                ? filters.velocities.filter(item => item !== v)
                                                : [...filters.velocities, v];
                                            setFilters({ ...filters, velocities: next });
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                            filters.velocities.includes(v)
                                                ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] border-transparent shadow-sm'
                                                : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white'
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Campaign Status</span>
                            <button
                                onClick={() => setFilters({ ...filters, onSale: filters.onSale === true ? null : true })}
                                className={`group flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                    filters.onSale === true
                                        ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 shadow-sm'
                                        : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:border-[#CFC6B4] dark:hover:border-emerald-900/15'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Percent
                                        size={14}
                                        className={filters.onSale === true ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'}
                                    />
                                    <span>On Sale / Active Promo</span>
                                </div>
                                <div
                                    className={`w-8 h-4 rounded-full relative transition-colors ${
                                        filters.onSale === true ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-stone-300 dark:bg-stone-700'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 w-2 h-2 rounded-full bg-white dark:bg-[#1E3B24] transition-all ${
                                            filters.onSale === true ? 'left-5' : 'left-1'
                                        }`}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
                <button
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
                    className="w-full py-2.5 text-[10px] uppercase font-bold text-stone-500 hover:text-[#1E3F27] dark:hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-[#2C5E3B]/5 dark:hover:bg-[#A9CBA2]/5 rounded-xl border border-transparent"
                >
                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Reset All Studio Filters
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
        sites
    } = useMerchandising();

    const hasActiveFilters = searchTerm || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '');

    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-6 animate-in fade-in duration-700">
            {searchTerm && (
                <div className="flex items-center gap-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-3 py-1.5 rounded-full text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                    <Search size={10} />
                    <span>"{searchTerm}"</span>
                    <button
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                        className="hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                    >
                        <XCircle size={12} />
                    </button>
                </div>
            )}
            {filters.categories.map(cat => (
                <div
                    key={cat}
                    className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                >
                    <Tags size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <span>{cat}</span>
                    <button
                        onClick={() => setFilters({ ...filters, categories: filters.categories.filter(c => c !== cat) })}
                        aria-label={`Remove category filter ${cat}`}
                        className="hover:text-red-500 transition-colors"
                    >
                        <XCircle size={12} className="opacity-60 hover:opacity-100" />
                    </button>
                </div>
            ))}
            {filters.sites.map(sid => (
                <div
                    key={sid}
                    className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                >
                    <Map size={10} className="text-blue-500 dark:text-blue-400" />
                    <span>{sites.find(s => s.id === sid)?.name}</span>
                    <button
                        onClick={() => setFilters({ ...filters, sites: filters.sites.filter(s => s !== sid) })}
                        aria-label="Remove site filter"
                        className="hover:text-red-500 transition-colors"
                    >
                        <XCircle size={12} className="opacity-60 hover:opacity-100" />
                    </button>
                </div>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
                <div
                    className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                >
                    <Calculator size={10} className="text-green-600 dark:text-green-400" />
                    <span>
                        {CURRENCY_SYMBOL}
                        {filters.minPrice || '0'} - {CURRENCY_SYMBOL}
                        {filters.maxPrice || '∞'}
                    </span>
                    <button
                        onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}
                        aria-label="Clear price range filter"
                        className="hover:text-red-500 transition-colors"
                    >
                        <XCircle size={12} className="opacity-60 hover:opacity-100" />
                    </button>
                </div>
            )}
            {filters.onSale && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                    <Percent size={10} />
                    <span>On Sale</span>
                    <button
                        onClick={() => setFilters({ ...filters, onSale: null })}
                        aria-label="Remove sale filter"
                        className="hover:text-red-500 transition-colors"
                    >
                        <XCircle size={12} className="opacity-60 hover:opacity-100" />
                    </button>
                </div>
            )}
        </div>
    );
};
