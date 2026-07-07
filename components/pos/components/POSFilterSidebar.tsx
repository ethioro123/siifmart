import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { usePOS } from '../POSContext';

interface POSFilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    availableBrands: string[];
    activeFiltersCount: number;
}

export const POSFilterSidebar: React.FC<POSFilterSidebarProps> = ({
    isOpen,
    onClose,
    availableBrands,
    activeFiltersCount
}) => {
    const {
        sortBy,
        setSortBy,
        minPriceFilter,
        setMinPriceFilter,
        maxPriceFilter,
        setMaxPriceFilter,
        selectedBrands,
        setSelectedBrands,
        selectedVelocities,
        setSelectedVelocities,
        stockStatusFilter,
        setStockStatusFilter,
        onSaleOnly,
        setOnSaleOnly,
        competitorMatchedOnly,
        setCompetitorMatchedOnly,
        resetAllFilters
    } = usePOS();

    if (!isOpen) return null;

    const toggleBrand = (brand: string) => {
        setSelectedBrands(prev => {
            if (prev.includes(brand)) return prev.filter(b => b !== brand);
            return [...prev, brand];
        });
    };

    const toggleVelocity = (vel: string) => {
        setSelectedVelocities(prev => {
            if (prev.includes(vel)) return prev.filter(v => v !== vel);
            return [...prev, vel];
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            />
            
            {/* Sidebar Container */}
            <div className="relative w-full max-w-md bg-[#FAF6EE] dark:bg-[#121915] h-full shadow-2xl flex flex-col z-10 border-l border-[#E2DCCE]/50 dark:border-emerald-950/20 transform transition-transform duration-300 animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-4 border-b border-[#E2DCCE] dark:border-emerald-950/30 flex items-center justify-between bg-white/50 dark:bg-black/20">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <h2 className="text-base font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">Advanced Filters</h2>
                        {activeFiltersCount > 0 && (
                            <span className="bg-[#2C5E3B] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        title="Close filter panel"
                        aria-label="Close filter panel"
                        className="w-8 h-8 rounded-full bg-stone-200/50 hover:bg-stone-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 flex items-center justify-center text-stone-600 dark:text-[#A9CBA2] transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                
                {/* Body / Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                    {/* Sort Options */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Sort Products By</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'default', label: 'Default' },
                                { id: 'name-asc', label: 'Name: A-Z' },
                                { id: 'name-desc', label: 'Name: Z-A' },
                                { id: 'price-asc', label: 'Price: Low-High' },
                                { id: 'price-desc', label: 'Price: High-Low' },
                                { id: 'stock-desc', label: 'Stock Level' },
                                { id: 'velocity-desc', label: 'Sales Velocity' },
                                { id: 'expiry-asc', label: 'Closest Expiry' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSortBy(opt.id)}
                                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all ${sortBy === opt.id
                                        ? 'bg-[#2C5E3B] text-white border-transparent shadow-sm'
                                        : 'bg-white dark:bg-white/5 border-[#E2DCCE] dark:border-emerald-950/15 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Price Range</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center bg-white dark:bg-black/35 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-3 py-2">
                                <span className="text-stone-400 dark:text-stone-600 text-xs font-bold mr-1.5">$</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    aria-label="Minimum Price"
                                    className="bg-transparent border-none w-full text-xs font-bold text-[#1E3F27] dark:text-white outline-none"
                                    value={minPriceFilter}
                                    onChange={(e) => setMinPriceFilter(e.target.value)}
                                />
                            </div>
                            <span className="text-[#4D6E56] text-xs font-bold">to</span>
                            <div className="flex-1 flex items-center bg-white dark:bg-black/35 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-3 py-2">
                                <span className="text-stone-400 dark:text-stone-600 text-xs font-bold mr-1.5">$</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    aria-label="Maximum Price"
                                    className="bg-transparent border-none w-full text-xs font-bold text-[#1E3F27] dark:text-white outline-none"
                                    value={maxPriceFilter}
                                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brands Filter */}
                    {availableBrands.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Filter by Brand</label>
                            <div className="bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/15 rounded-2xl p-4 max-h-[160px] overflow-y-auto custom-scrollbar space-y-2">
                                {availableBrands.map(brand => {
                                    const isChecked = selectedBrands.includes(brand);
                                    return (
                                        <div
                                            key={brand}
                                            onClick={() => toggleBrand(brand)}
                                            role="button"
                                            className="w-full flex items-center gap-3 py-1.5 hover:bg-stone-50/50 dark:hover:bg-white/5 px-2 rounded-xl text-left cursor-pointer select-none"
                                        >
                                            <div className={`w-4 h-4 border border-stone-350 dark:border-white/20 rounded flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2] border-transparent' : 'bg-white/5'}`}>
                                                {isChecked && (
                                                    <svg className="w-2.5 h-2.5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{brand}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Velocity Options */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Sales Velocity</label>
                        <div className="flex gap-2">
                            {['Fast', 'Medium', 'Slow'].map(vel => {
                                const isActive = selectedVelocities.includes(vel);
                                return (
                                    <button
                                        key={vel}
                                        onClick={() => toggleVelocity(vel)}
                                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${isActive
                                            ? 'bg-[#2C5E3B] text-white border-transparent shadow-sm'
                                            : 'bg-white dark:bg-white/5 border-[#E2DCCE] dark:border-emerald-950/15 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {vel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stock Status Switch */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Stock Availability</label>
                        <select
                            value={stockStatusFilter}
                            onChange={(e) => setStockStatusFilter(e.target.value as any)}
                            aria-label="Stock Availability Selector"
                            className="w-full bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E3F27] dark:text-white outline-none cursor-pointer"
                        >
                            <option value="all">Show All Items</option>
                            <option value="in_stock">In Stock Only</option>
                            <option value="low_stock">Low Stock Alerts Only</option>
                            <option value="out_of_stock">Out of Stock Only</option>
                        </select>
                    </div>

                    {/* Checkbox Switches */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => setOnSaleOnly(!onSaleOnly)}
                            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-emerald-950/15 rounded-2xl cursor-pointer"
                        >
                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">🏷️ Only Show Promotional Items</span>
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${onSaleOnly ? 'bg-red-500' : 'bg-stone-300 dark:bg-stone-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${onSaleOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setCompetitorMatchedOnly(!competitorMatchedOnly)}
                            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-emerald-950/15 rounded-2xl cursor-pointer"
                        >
                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">⚖️ Show Competitor Price-Matched</span>
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${competitorMatchedOnly ? 'bg-purple-600' : 'bg-stone-300 dark:bg-stone-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${competitorMatchedOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-[#E2DCCE] dark:border-emerald-950/30 flex items-center gap-3 bg-white/50 dark:bg-black/25">
                    <button
                        onClick={resetAllFilters}
                        className="flex-1 py-3 bg-stone-100 hover:bg-stone-250 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-stone-200 dark:border-emerald-950/15 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RotateCcw size={14} />
                        Reset All
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#2C5E3B] text-white hover:bg-[#1E3F27] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};
export default POSFilterSidebar;
