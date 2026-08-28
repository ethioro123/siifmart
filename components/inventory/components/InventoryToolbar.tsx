import React, { useState, useMemo } from 'react';
import {
    Search, Map, Package, SlidersHorizontal, ChevronDown,
    ArrowUpDown, X, AlertTriangle, Box, MapPin, Clock, Tag, DollarSign
} from 'lucide-react';
import { Product, Site } from '../../../types';
import Button from '../../shared/Button';
import { GROCERY_CATEGORIES } from '../../../constants';
import { InventoryAdvancedFilters, AdvancedFilterState } from './InventoryAdvancedFilters';

interface InventoryToolbarProps {
    products: Product[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filters: AdvancedFilterState;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    handleSort: (key: string, direction?: 'asc' | 'desc') => void;
    activeSite: Site | null;
    isReadOnly: boolean;
    sites: Site[];
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    handleBulkAction: (action: string) => void;
}

const SORT_OPTIONS = [
    { value: 'createdAt-desc', label: '🕒 Date Added (Newest First)', key: 'createdAt', direction: 'desc' as const },
    { value: 'createdAt-asc', label: '🕒 Date Added (Oldest First)', key: 'createdAt', direction: 'asc' as const },
    { value: 'name-asc', label: '🔤 Name (A → Z)', key: 'name', direction: 'asc' as const },
    { value: 'name-desc', label: '🔤 Name (Z → A)', key: 'name', direction: 'desc' as const },
    { value: 'stock-asc', label: '📊 Stock (Low to High)', key: 'stock', direction: 'asc' as const },
    { value: 'stock-desc', label: '📊 Stock (High to Low)', key: 'stock', direction: 'desc' as const },
    { value: 'price-asc', label: '💲 Price (Low to High)', key: 'price', direction: 'asc' as const },
    { value: 'price-desc', label: '💲 Price (High to Low)', key: 'price', direction: 'desc' as const },
    { value: 'sku-asc', label: '🏷️ SKU (A → Z)', key: 'sku', direction: 'asc' as const },
    { value: 'location-asc', label: '📍 Bay Location (A → Z)', key: 'location', direction: 'asc' as const },
];

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
    products,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    activeSite,
    isReadOnly,
    sites,
    selectedIds,
    setSelectedIds,
    handleBulkAction
}) => {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // Flatten all category options
    const allCategories = useMemo(() => {
        const categorySet = new Set<string>();
        Object.values(GROCERY_CATEGORIES).forEach(items => {
            items.forEach(cat => categorySet.add(cat));
        });
        products.forEach(p => {
            if (p.category) categorySet.add(p.category);
        });
        return Array.from(categorySet).sort();
    }, [products]);

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.category && filters.category !== 'All') count++;
        if (filters.status && filters.status !== 'All') count++;
        if (filters.stockHealth && filters.stockHealth !== 'All') count++;
        if (filters.brand && filters.brand.trim() !== '') count++;
        if (filters.minPrice !== undefined && filters.minPrice !== '') count++;
        if (filters.maxPrice !== undefined && filters.maxPrice !== '') count++;
        if (filters.minStock !== undefined && filters.minStock !== '') count++;
        if (filters.maxStock !== undefined && filters.maxStock !== '') count++;
        if (filters.locationStatus && filters.locationStatus !== 'All') count++;
        if (filters.hasBarcode && filters.hasBarcode !== 'All') count++;
        if (filters.approvalStatus && filters.approvalStatus !== 'All') count++;
        if (filters.siteId && filters.siteId !== 'All') count++;
        return count;
    }, [filters]);

    const handleResetAll = () => {
        setFilters({
            category: 'All',
            status: 'All',
            abc: 'All',
            priceRange: 'All',
            siteId: 'All',
            brand: '',
            minPrice: '',
            maxPrice: '',
            minStock: '',
            maxStock: '',
            stockHealth: 'All',
            locationStatus: 'All',
            approvalStatus: 'All',
            hasBarcode: 'All'
        });
    };

    // Quick filter preset buttons
    const quickPresets = [
        {
            id: 'all',
            label: 'All Items',
            isActive: !filters.stockHealth || filters.stockHealth === 'All',
            onClick: () => setFilters((prev: any) => ({ ...prev, stockHealth: 'All', status: 'All', locationStatus: 'All' }))
        },
        {
            id: 'out_of_stock',
            label: '🚨 Out of Stock',
            isActive: filters.stockHealth === 'out_of_stock' || filters.status === 'Out of Stock',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                stockHealth: prev.stockHealth === 'out_of_stock' ? 'All' : 'out_of_stock',
                status: 'All'
            }))
        },
        {
            id: 'low_stock',
            label: '⚠️ Low Stock',
            isActive: filters.stockHealth === 'low_stock' || filters.status === 'Low Stock',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                stockHealth: prev.stockHealth === 'low_stock' ? 'All' : 'low_stock',
                status: 'All'
            }))
        },
        {
            id: 'no_bay',
            label: '📍 Missing Bay',
            isActive: filters.locationStatus === 'missing',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                locationStatus: prev.locationStatus === 'missing' ? 'All' : 'missing'
            }))
        },
        {
            id: 'pending',
            label: '⏳ Review',
            isActive: filters.approvalStatus === 'pending',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                approvalStatus: prev.approvalStatus === 'pending' ? 'All' : 'pending'
            }))
        }
    ];

    const currentSortValue = `${sortConfig?.key || 'createdAt'}-${sortConfig?.direction || 'desc'}`;

    return (
        <div className="space-y-0">
            {/* Main Toolbar */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 space-y-4 bg-gray-50/50 dark:bg-white/[0.02]">
                {/* Top Search & Records Count Row */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-2.5 flex-1 focus-within:border-[#2C5E3B]/50 dark:focus-within:border-[#A9CBA2]/50 focus-within:ring-4 focus-within:ring-[#2C5E3B]/10 dark:focus-within:ring-[#A9CBA2]/10 transition-all shadow-inner group">
                        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors shrink-0" />
                        <input
                            type="text"
                            aria-label="Search products"
                            placeholder="Search SKU, Name, Brand, Location, Barcode..."
                            className="bg-transparent border-none ml-3 flex-1 text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="text-[11px] text-gray-500 font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3.5 py-3 rounded-2xl border border-gray-200 dark:border-white/5 whitespace-nowrap">
                        {products.length} Records
                    </div>
                </div>

                {/* Quick-Access Filter Presets & Controls */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Left: Quick Filter Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
                        {quickPresets.map(preset => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={preset.onClick}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                    preset.isActive
                                        ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-black shadow-sm font-black'
                                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: Dropdowns & Advanced Toggle */}
                    <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                        {/* Site Filter (If HQ / Read-Only) */}
                        {(!activeSite || isReadOnly) && (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Map size={12} className="text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <select
                                    value={filters.siteId || 'All'}
                                    aria-label="Filter by Site"
                                    onChange={(e) => setFilters((prev: any) => ({ ...prev, siteId: e.target.value }))}
                                    className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-blue-500/30 transition-all max-w-[150px]"
                                >
                                    <option value="All">All Sites</option>
                                    {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {/* Category Dropdown */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Package size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2] opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <select
                                value={filters.category || 'All'}
                                aria-label="Filter by Category"
                                onChange={(e) => setFilters((prev: any) => ({ ...prev, category: e.target.value }))}
                                className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 transition-all max-w-[160px]"
                            >
                                <option value="All">All Categories</option>
                                {allCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort Selector Dropdown */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ArrowUpDown size={12} className="text-amber-600 dark:text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <select
                                value={currentSortValue}
                                aria-label="Sort products"
                                onChange={(e) => {
                                    const selected = SORT_OPTIONS.find(opt => opt.value === e.target.value);
                                    if (selected) handleSort(selected.key, selected.direction);
                                }}
                                className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-amber-500/30 transition-all"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Advanced Filters Button Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                isAdvancedOpen || activeFiltersCount > 0
                                    ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] border-[#2C5E3B]/30 dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2] dark:border-[#A9CBA2]/30 shadow-sm'
                                    : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-white/10'
                            }`}
                        >
                            <SlidersHorizontal size={13} />
                            <span>Filters</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-black flex items-center justify-center text-[9px] font-black">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Filter Badges Bar */}
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200/60 dark:border-white/5">
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Active:
                        </span>

                        {filters.category && filters.category !== 'All' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                <Package size={10} /> {filters.category}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, category: 'All' }))} className="hover:text-red-500 ml-1">
                                    <X size={10} />
                                </button>
                            </span>
                        )}

                        {filters.brand && filters.brand.trim() !== '' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Tag size={10} /> Brand: {filters.brand}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, brand: '' }))} className="hover:text-red-500 ml-1">
                                    <X size={10} />
                                </button>
                            </span>
                        )}

                        {(filters.minPrice || filters.maxPrice) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <DollarSign size={10} /> {filters.minPrice || 0} - {filters.maxPrice || '∞'} ETB
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, minPrice: '', maxPrice: '' }))} className="hover:text-red-500 ml-1">
                                    <X size={10} />
                                </button>
                            </span>
                        )}

                        {(filters.minStock || filters.maxStock) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <Box size={10} /> Stock: {filters.minStock || 0} - {filters.maxStock || '∞'}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, minStock: '', maxStock: '' }))} className="hover:text-red-500 ml-1">
                                    <X size={10} />
                                </button>
                            </span>
                        )}

                        {filters.locationStatus && filters.locationStatus !== 'All' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                <MapPin size={10} /> {filters.locationStatus === 'assigned' ? 'Located' : 'No Bay'}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, locationStatus: 'All' }))} className="hover:text-red-500 ml-1">
                                    <X size={10} />
                                </button>
                            </span>
                        )}

                        {filters.hasBarcode && filters.hasBarcode !== 'All' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-500/10 text-stone-600 dark:text-stone-300 border border-stone-500/20">
                                {filters.hasBarcode === 'with_barcode' ? 'Has Barcode' : 'No Barcode'}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, hasBarcode: 'All' }))} className="hover:text-red-500 ml-1">
                                    <X size={10} />
                                </button>
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="text-[10px] font-black uppercase text-red-500 dark:text-red-400 hover:underline ml-auto"
                        >
                            Reset All
                        </button>
                    </div>
                )}
            </div>

            {/* Expandable Advanced Filters Drawer */}
            <InventoryAdvancedFilters
                isOpen={isAdvancedOpen}
                onClose={() => setIsAdvancedOpen(false)}
                filters={filters}
                setFilters={setFilters}
                onReset={handleResetAll}
                activeCount={activeFiltersCount}
            />

            {/* Bulk Selection Toolbar */}
            {selectedIds.size > 0 && (
                <div className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-b border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 p-2.5 flex items-center justify-between px-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">
                            {selectedIds.size} Selected
                        </span>
                        <Button onClick={() => handleBulkAction('Print Labels')} size="sm" variant="secondary" className="px-3.5 py-1.5 bg-black/20 hover:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-wider text-white">
                            Print Labels
                        </Button>
                        <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost" className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
