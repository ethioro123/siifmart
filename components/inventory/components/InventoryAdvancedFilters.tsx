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
    activeCount
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
        <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-white/10 bg-gray-50/90 dark:bg-black/40 backdrop-blur-md animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200/80 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2]" />
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">
                        Advanced Filter Suite
                    </h4>
                    {activeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                            {activeCount} Active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <RotateCcw size={11} /> Reset All
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Close advanced filters"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Brand / Manufacturer */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Brand / Manufacturer
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Coca-Cola, Nike..."
                        value={filters.brand || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#2C5E3B]/60 dark:focus:border-[#A9CBA2]/60 font-medium transition-all"
                    />
                </div>

                {/* 2. Price Range (Min & Max) + Quick Presets */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={12} className="text-emerald-500" /> Price Range ({CURRENCY_SYMBOL.trim()})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            min="0"
                            value={filters.minPrice ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#2C5E3B]/60 font-medium"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            min="0"
                            value={filters.maxPrice ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#2C5E3B]/60 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {PRICE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => handlePricePreset(preset.min, preset.max)}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                                    String(filters.minPrice) === String(preset.min) && String(filters.maxPrice) === String(preset.max)
                                        ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-black'
                                        : 'bg-gray-200/70 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Stock Level Range */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Box size={12} className="text-blue-500" /> Quantity on Hand
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Min Qty"
                            min="0"
                            value={filters.minStock ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, minStock: e.target.value }))}
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500/60 font-medium"
                        />
                        <input
                            type="number"
                            placeholder="Max Qty"
                            min="0"
                            value={filters.maxStock ?? ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxStock: e.target.value }))}
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500/60 font-medium"
                        />
                    </div>
                </div>

                {/* 4. Warehouse & Logistics Statuses */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={12} className="text-orange-500" /> Bay & Logistics
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={filters.locationStatus || 'All'}
                            aria-label="Filter by Location Status"
                            onChange={(e) => setFilters(prev => ({ ...prev, locationStatus: e.target.value }))}
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                        >
                            <option value="All">All Locations</option>
                            <option value="assigned">📍 Located</option>
                            <option value="missing">❓ No Bay</option>
                        </select>
                        <select
                            value={filters.hasBarcode || 'All'}
                            aria-label="Filter by Barcode Status"
                            onChange={(e) => setFilters(prev => ({ ...prev, hasBarcode: e.target.value }))}
                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
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
