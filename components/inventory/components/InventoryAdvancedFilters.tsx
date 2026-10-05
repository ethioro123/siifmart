import React from 'react';
import { Tag, DollarSign, Box, MapPin, Barcode, ShieldAlert, X, RotateCcw } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';

export interface AdvancedFilterState {
    category: string;
    status: string;
    abc: string;
    priceRange: string;
    siteId: string;
    brand?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
    minStock?: string | number;
    maxStock?: string | number;
    stockHealth?: string;
    locationStatus?: string;
    approvalStatus?: string;
    hasBarcode?: string;
}

interface InventoryAdvancedFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: AdvancedFilterState;
    setFilters: React.Dispatch<React.SetStateAction<AdvancedFilterState>>;
    onReset: () => void;
    activeCount: number;
    currencySymbol?: string;
}

const PRICE_PRESETS = [
    { label: `< 100`, min: '', max: 100 },
    { label: `100 - 500`, min: 100, max: 500 },
    { label: `500 - 2,000`, min: 500, max: 2000 },
    { label: `2,000+`, min: 2000, max: '' },
];

export const InventoryAdvancedFilters: React.FC<InventoryAdvancedFiltersProps> = ({
    isOpen,
    onClose,
    filters,
    setFilters,
    onReset,
    activeCount,
    currencySymbol = CURRENCY_SYMBOL
}) => {
    if (!isOpen) return null;

    const handlePricePreset = (min: string | number, max: string | number) => {
        setFilters(prev => ({
            ...prev,
            minPrice: min,
            maxPrice: max
        }));
    };

    return (
        <div className="p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)]" />
                    <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                        Advanced Filter Suite
                    </h4>
                    {activeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {activeCount} Active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="text-[10px] font-bold uppercase text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <RotateCcw size={11} /> Reset All
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                        aria-label="Close advanced filters"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Brand / Manufacturer */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={12} className="text-emerald-500" /> Brand / Manufacturer
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Coca-Cola, Nike..."
                        value={filters.brand || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-border-focus)] font-medium transition-all"
                    />
                </div>

                {/* 2. Price Range (Min & Max) + Quick Presets */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={12} className="text-emerald-500" /> Price Range ({currencySymbol.trim()})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            min="0"
                            value={filters.minPrice ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-border-focus)] font-medium"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            min="0"
                            value={filters.maxPrice ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-border-focus)] font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {PRICE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => handlePricePreset(preset.min, preset.max)}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                                    String(filters.minPrice) === String(preset.min) && String(filters.maxPrice) === String(preset.max)
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                                        : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Stock Level Range */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <Box size={12} className="text-blue-500" /> Quantity on Hand
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Min Qty"
                            min="0"
                            value={filters.minStock ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, minStock: e.target.value }))}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-blue-500/60 font-medium"
                        />
                        <input
                            type="number"
                            placeholder="Max Qty"
                            min="0"
                            value={filters.maxStock ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxStock: e.target.value }))}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-blue-500/60 font-medium"
                        />
                    </div>
                </div>

                {/* 4. Warehouse & Logistics Statuses */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={12} className="text-orange-500" /> Bay & Logistics
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={filters.locationStatus || 'All'}
                            aria-label="Filter by Location Status"
                            onChange={(e) => setFilters(prev => ({ ...prev, locationStatus: e.target.value }))}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-2 py-2 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer"
                        >
                            <option value="All">All Locations</option>
                            <option value="assigned">Located</option>
                            <option value="missing">No Bay</option>
                        </select>
                        <select
                            value={filters.hasBarcode || 'All'}
                            aria-label="Filter by Barcode Status"
                            onChange={(e) => setFilters(prev => ({ ...prev, hasBarcode: e.target.value }))}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-2 py-2 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer"
                        >
                            <option value="All">All Barcodes</option>
                            <option value="with_barcode">Barcoded</option>
                            <option value="no_barcode">No Barcode</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
