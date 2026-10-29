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
    currencySymbol?: string;
}

const SORT_OPTIONS = [
    { value: 'createdAt-desc', label: 'Date Added (Newest First)', key: 'createdAt', direction: 'desc' as const },
    { value: 'createdAt-asc', label: 'Date Added (Oldest First)', key: 'createdAt', direction: 'asc' as const },
    { value: 'name-asc', label: 'Name (A → Z)', key: 'name', direction: 'asc' as const },
    { value: 'name-desc', label: 'Name (Z → A)', key: 'name', direction: 'desc' as const },
    { value: 'stock-asc', label: 'Stock (Low to High)', key: 'stock', direction: 'asc' as const },
    { value: 'stock-desc', label: 'Stock (High to Low)', key: 'stock', direction: 'desc' as const },
    { value: 'price-asc', label: 'Price (Low to High)', key: 'price', direction: 'asc' as const },
    { value: 'price-desc', label: 'Price (High to Low)', key: 'price', direction: 'desc' as const },
    { value: 'sku-asc', label: 'SKU (A → Z)', key: 'sku', direction: 'asc' as const },
    { value: 'location-asc', label: 'Bay Location (A → Z)', key: 'location', direction: 'asc' as const },
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
    handleBulkAction,
    currencySymbol = 'ETB'
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
            label: 'Out of Stock',
            isActive: filters.stockHealth === 'out_of_stock' || filters.status === 'Out of Stock',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                stockHealth: prev.stockHealth === 'out_of_stock' ? 'All' : 'out_of_stock',
                status: 'All'
            }))
        },
        {
            id: 'low_stock',
            label: 'Low Stock',
            isActive: filters.stockHealth === 'low_stock' || filters.status === 'Low Stock',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                stockHealth: prev.stockHealth === 'low_stock' ? 'All' : 'low_stock',
                status: 'All'
            }))
        },
        {
            id: 'no_bay',
            label: 'Missing Bay',
            isActive: filters.locationStatus === 'missing',
            onClick: () => setFilters((prev: any) => ({
                ...prev,
                locationStatus: prev.locationStatus === 'missing' ? 'All' : 'missing'
            }))
        }
    ];

    const currentSortValue = `${sortConfig?.key || 'createdAt'}-${sortConfig?.direction || 'desc'}`;

    return (
        <div className="space-y-0">
            {/* Main Toolbar */}
            <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] space-y-4 bg-[var(--theme-bg-subtle)]">
                {/* Top Search & Records Count Row */}
                <div className="flex items-center gap-3">
                    <div className="min-h-[48px] min-w-0 flex items-center bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 flex-1 focus-within:border-[var(--theme-accent)] focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/20 transition-all shadow-xs group">
                        <Search className="w-4 h-4 text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-accent)] transition-colors shrink-0" />
                        <input
                            type="text"
                            aria-label="Search products"
                            placeholder="Search products, SKU or bin…"
                            className="bg-transparent border-none ml-2.5 min-w-0 w-full flex-1 text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-muted)] font-medium text-[13px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear product search"
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="hidden sm:flex min-h-[48px] items-center text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider bg-[var(--theme-bg-card)] px-3.5 rounded-xl border border-[var(--theme-border)] whitespace-nowrap tabular-nums">
                        {products.length} on this page
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
                                aria-pressed={preset.isActive}
                                onClick={preset.onClick}
                                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98] ${
                                    preset.isActive
                                        ? 'bg-[var(--theme-accent)] text-[var(--theme-btn-primary-text)]'
                                        : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
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
                                    <Map size={14} className="text-[var(--theme-accent)] opacity-70 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <select
                                    value={filters.siteId || 'All'}
                                    aria-label="Filter by Site"
                                    onChange={(e) => setFilters((prev: any) => ({ ...prev, siteId: e.target.value }))}
                                    className="min-h-[44px] max-w-full appearance-none bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-all max-w-[150px]"
                                >
                                    <option value="All">All Sites</option>
                                    {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration' && s.type !== 'Administrative').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                            </div>
                        )}

                        {/* Category Dropdown */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Package size={14} className="text-[var(--theme-status-success-text)] opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <select
                                value={filters.category || 'All'}
                                aria-label="Filter by Category"
                                onChange={(e) => setFilters((prev: any) => ({ ...prev, category: e.target.value }))}
                                className="min-h-[44px] max-w-full appearance-none bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-all max-w-[160px]"
                            >
                                <option value="All">All Categories</option>
                                {allCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                        </div>

                        {/* Sort Selector Dropdown */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ArrowUpDown size={14} className="text-[var(--theme-status-warning-text)] opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <select
                                value={currentSortValue}
                                aria-label="Sort products"
                                onChange={(e) => {
                                    const selected = SORT_OPTIONS.find(opt => opt.value === e.target.value);
                                    if (selected) handleSort(selected.key, selected.direction);
                                }}
                                className="min-h-[44px] max-w-full appearance-none bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-all"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                        </div>

                        {/* Advanced Filters Button Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer active:scale-[0.98] ${
                                isAdvancedOpen || activeFiltersCount > 0
                                    ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] border-[var(--theme-accent)] shadow-xs'
                                    : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                        >
                            <SlidersHorizontal size={14} />
                            <span>Filters</span>
                            {activeFiltersCount > 0 && (
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold ${isAdvancedOpen || activeFiltersCount > 0 ? 'bg-[color-mix(in_srgb,var(--theme-bg-card)_20%,transparent)] text-[var(--theme-text-primary)]' : 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)]'}`}>
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Filter Badges Bar */}
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Active:
                        </span>

                        {filters.category && filters.category !== 'All' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-status-success-bg)]/10 text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]/20">
                                <Package size={12} /> {filters.category}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, category: 'All' }))} className="text-[var(--theme-status-danger-text)] ml-1 cursor-pointer">
                                    <X size={12} />
                                </button>
                            </span>
                        )}

                        {filters.brand && filters.brand.trim() !== '' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-status-warning-bg)]/10 text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]/20">
                                <Tag size={12} /> Brand: {filters.brand}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, brand: '' }))} className="text-[var(--theme-status-danger-text)] ml-1 cursor-pointer">
                                    <X size={12} />
                                </button>
                            </span>
                        )}

                        {(filters.minPrice || filters.maxPrice) && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-status-success-bg)]/10 text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]/20">
                                <DollarSign size={12} /> {filters.minPrice || 0} - {filters.maxPrice || '∞'} {currencySymbol}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, minPrice: '', maxPrice: '' }))} className="text-[var(--theme-status-danger-text)] ml-1 cursor-pointer">
                                    <X size={12} />
                                </button>
                            </span>
                        )}

                        {(filters.minStock || filters.maxStock) && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                <Box size={12} /> Stock: {filters.minStock || 0} - {filters.maxStock || '∞'}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, minStock: '', maxStock: '' }))} className="text-[var(--theme-status-danger-text)] ml-1 cursor-pointer">
                                    <X size={12} />
                                </button>
                            </span>
                        )}

                        {filters.locationStatus && filters.locationStatus !== 'All' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-status-warning-bg)]/10 text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]/20">
                                <MapPin size={12} /> {filters.locationStatus === 'assigned' ? 'Located' : 'No Bay'}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, locationStatus: 'All' }))} className="text-[var(--theme-status-danger-text)] ml-1 cursor-pointer">
                                    <X size={12} />
                                </button>
                            </span>
                        )}

                        {filters.hasBarcode && filters.hasBarcode !== 'All' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                {filters.hasBarcode === 'with_barcode' ? 'Has Barcode' : 'No Barcode'}
                                <button type="button" onClick={() => setFilters((p: any) => ({ ...p, hasBarcode: 'All' }))} className="text-[var(--theme-status-danger-text)] ml-1 cursor-pointer">
                                    <X size={12} />
                                </button>
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="text-[11px] font-semibold uppercase text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] transition-colors ml-auto cursor-pointer"
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
                currencySymbol={currencySymbol}
            />

            {/* Bulk Selection Toolbar */}
            {selectedIds.size > 0 && (
                <div className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] p-3 flex items-center justify-between px-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider">
                            {selectedIds.size} Selected
                        </span>
                        <Button onClick={() => handleBulkAction('Print Labels')} size="sm" variant="secondary" className="px-3.5 py-1.5 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-text-primary)] font-semibold text-[11px] uppercase tracking-wider hover:opacity-90">
                            Print Labels
                        </Button>
                        <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost" className="px-3 py-1.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
