import React from 'react';
import { X, RotateCcw, Tag, Scale } from 'lucide-react';
import { usePOS } from '../POSContext';
import { CURRENCY_SYMBOL } from '../../../constants';

export const POSDepartments: React.FC = () => {
    const {
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

    // When no filters are active, render nothing so the product catalog has maximum breathing room and space
    if (activeFiltersCount === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--theme-border)] animate-in fade-in duration-200">
            <span className="text-xs font-bold text-[var(--theme-text-secondary)]">Active Filters:</span>
            
            {selectedDepartment !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Dept: {selectedDepartment}
                    <button onClick={() => setSelectedDepartment('All')} title="Remove department filter" aria-label="Remove department filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}
            
            {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Cat: {selectedCategory}
                    <button onClick={() => setSelectedCategory('All')} title="Remove category filter" aria-label="Remove category filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}
            
            {minPriceFilter !== '' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Min: {CURRENCY_SYMBOL} {minPriceFilter}
                    <button onClick={() => setMinPriceFilter('')} title="Remove minimum price filter" aria-label="Remove minimum price filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}

            {maxPriceFilter !== '' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Max: {CURRENCY_SYMBOL} {maxPriceFilter}
                    <button onClick={() => setMaxPriceFilter('')} title="Remove maximum price filter" aria-label="Remove maximum price filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}

            {selectedBrands.map(brand => (
                <span key={brand} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Brand: {brand}
                    <button onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))} title={`Remove brand filter: ${brand}`} aria-label={`Remove brand filter: ${brand}`} className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            ))}

            {selectedVelocities.map(vel => (
                <span key={vel} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Velocity: {vel}
                    <button onClick={() => setSelectedVelocities(prev => prev.filter(v => v !== vel))} title={`Remove velocity filter: ${vel}`} aria-label={`Remove velocity filter: ${vel}`} className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            ))}

            {stockStatusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Stock: {stockStatusFilter === 'in_stock' ? 'In Stock' : stockStatusFilter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                    <button onClick={() => setStockStatusFilter('all')} title="Remove stock status filter" aria-label="Remove stock status filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}

            {onSaleOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>On Sale</span>
                    <button onClick={() => setOnSaleOnly(false)} title="Remove sale filter" aria-label="Remove sale filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}

            {competitorMatchedOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Comp Price</span>
                    <button onClick={() => setCompetitorMatchedOnly(false)} title="Remove competitor price matched filter" aria-label="Remove competitor price matched filter" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}

            {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border)]">
                    Sort: {sortBy === 'price-asc' ? 'Price Asc' : sortBy === 'price-desc' ? 'Price Desc' : sortBy === 'name-asc' ? 'A-Z' : sortBy === 'name-desc' ? 'Z-A' : sortBy === 'stock-desc' ? 'Stock Desc' : sortBy === 'velocity-desc' ? 'Velocity' : 'Expiry'}
                    <button onClick={() => setSortBy('default')} title="Reset sorting to default" aria-label="Reset sorting to default" className="hover:text-rose-500 ml-0.5 cursor-pointer"><X size={12} /></button>
                </span>
            )}

            <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/20 transition-colors ml-auto cursor-pointer"
            >
                <RotateCcw size={12} />
                Reset All
            </button>
        </div>
    );
};
export default POSDepartments;
