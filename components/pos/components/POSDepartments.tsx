import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { usePOS } from '../POSContext';

export const POSDepartments: React.FC = () => {
    const {
        categories,
        selectedCategory,
        setSelectedCategory,
        selectedDepartment,
        setSelectedDepartment,
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

    const activeFiltersCount = React.useMemo(() => {
        let count = 0;
        if (selectedDepartment !== 'All') count++;
        if (selectedCategory !== 'All') count++;
        if (minPriceFilter !== '') count++;
        if (maxPriceFilter !== '') count++;
        if (selectedBrands.length > 0) count++;
        if (selectedVelocities.length > 0) count++;
        if (stockStatusFilter !== 'all') count++;
        if (onSaleOnly) count++;
        if (competitorMatchedOnly) count++;
        if (sortBy !== 'default') count++;
        return count;
    }, [selectedDepartment, selectedCategory, minPriceFilter, maxPriceFilter, selectedBrands, selectedVelocities, stockStatusFilter, onSaleOnly, competitorMatchedOnly, sortBy]);

    return (
        <div className="space-y-2">
            {/* Departments Row */}
            <div className="space-y-2 pt-1 border-t border-stone-200/40 dark:border-white/5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide px-1 -mx-2">
                    {['All', 'Fresh Food & Deli', 'Pantry & Groceries', 'Frozen Food', 'Household & Personal', 'General Merchandise', 'Other'].map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDepartment(dept)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-300 ${selectedDepartment === dept
                                ? 'bg-[#2C5E3B] text-white shadow-sm scale-[1.02]'
                                : 'text-[#4D6E56] dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-white bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/15'
                                 }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subcategories Row */}
            {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide px-1 -mx-2 border-t border-stone-150/40 dark:border-white/5 pt-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 shadow-sm'
                                : 'text-[#4D6E56]/90 dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-white bg-white/50 dark:bg-black/15 border border-[#E2DCCE]/60 dark:border-emerald-950/10'
                                 }`}
                            >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Active Filter Pills Row */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-150/40 dark:border-white/5">
                    <span className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83]">Filters:</span>
                    
                    {selectedDepartment !== 'All' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                            Dept: {selectedDepartment}
                            <button onClick={() => setSelectedDepartment('All')} title="Remove department filter" aria-label="Remove department filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}
                    
                    {selectedCategory !== 'All' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                            Cat: {selectedCategory}
                            <button onClick={() => setSelectedCategory('All')} title="Remove category filter" aria-label="Remove category filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}
                    
                    {minPriceFilter !== '' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-600/10 text-amber-700 dark:text-amber-500 border border-amber-600/20">
                            Min: ${minPriceFilter}
                            <button onClick={() => setMinPriceFilter('')} title="Remove minimum price filter" aria-label="Remove minimum price filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}

                    {maxPriceFilter !== '' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-600/10 text-amber-700 dark:text-amber-500 border border-amber-600/20">
                            Max: ${maxPriceFilter}
                            <button onClick={() => setMaxPriceFilter('')} title="Remove maximum price filter" aria-label="Remove maximum price filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}

                    {selectedBrands.map(brand => (
                        <span key={brand} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                            Brand: {brand}
                            <button onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))} title={`Remove brand filter: ${brand}`} aria-label={`Remove brand filter: ${brand}`} className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    ))}

                    {selectedVelocities.map(vel => (
                        <span key={vel} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                            Velocity: {vel}
                            <button onClick={() => setSelectedVelocities(prev => prev.filter(v => v !== vel))} title={`Remove velocity filter: ${vel}`} aria-label={`Remove velocity filter: ${vel}`} className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    ))}

                    {stockStatusFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-600/10 text-blue-700 dark:text-blue-500 border border-blue-600/20">
                            Stock: {stockStatusFilter === 'in_stock' ? 'In Stock' : stockStatusFilter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                            <button onClick={() => setStockStatusFilter('all')} title="Remove stock status filter" aria-label="Remove stock status filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}

                    {onSaleOnly && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-600/10 text-red-700 dark:text-red-500 border border-red-600/20">
                            🏷️ On Sale
                            <button onClick={() => setOnSaleOnly(false)} title="Remove sale filter" aria-label="Remove sale filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}

                    {competitorMatchedOnly && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-600/10 text-purple-700 dark:text-purple-500 border border-purple-600/20">
                            ⚖️ Comp Price
                            <button onClick={() => setCompetitorMatchedOnly(false)} title="Remove competitor price matched filter" aria-label="Remove competitor price matched filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}

                    {sortBy !== 'default' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-600/10 text-indigo-700 dark:text-indigo-500 border border-indigo-600/20">
                            Sort: {sortBy === 'price-asc' ? 'Price Asc' : sortBy === 'price-desc' ? 'Price Desc' : sortBy === 'name-asc' ? 'A-Z' : sortBy === 'name-desc' ? 'Z-A' : sortBy === 'stock-desc' ? 'Stock Desc' : sortBy === 'velocity-desc' ? 'Velocity' : 'Expiry'}
                            <button onClick={() => setSortBy('default')} title="Reset sorting to default" aria-label="Reset sorting to default" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                        </span>
                    )}

                    <button
                        onClick={resetAllFilters}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors ml-auto"
                    >
                        <RotateCcw size={8} />
                        Reset All
                    </button>
                </div>
            )}
        </div>
    );
};
