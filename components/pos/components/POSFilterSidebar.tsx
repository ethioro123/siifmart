import React from 'react';
import { Filter, X, RotateCcw, Tag, Scale, Zap, Activity, Clock, Layers, Folder, Coins, Sparkles, Check } from 'lucide-react';
import { usePOS } from '../POSContext';
import { CURRENCY_SYMBOL } from '../../../constants';

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
                className="absolute inset-0 bg-black/60 transition-opacity duration-200 animate-in fade-in"
                onClick={onClose}
            />
            
            {/* Sidebar Container */}
            <div className="relative w-full max-w-md bg-[var(--theme-bg-panel)] h-full shadow-xl flex flex-col z-10 border-l border-[var(--theme-border)] transform transition-transform duration-200 animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-4 border-b border-[var(--theme-border-subtle)] flex items-center justify-between bg-[var(--theme-bg-card)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <Filter size={16} />
                        </div>
                        <h2 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">Filters & Sort</h2>
                        {activeFiltersCount > 0 && (
                            <span className="bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[11px] font-bold px-2 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        title="Close filter panel"
                        aria-label="Close filter panel"
                        className="w-8 h-8 rounded-full bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>
                
                {/* Body / Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                    {/* Department Selector */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">Department</label>
                            {selectedDepartment !== 'All' && (
                                <button
                                    onClick={() => setSelectedDepartment('All')}
                                    className="text-xs font-bold text-[var(--theme-primary)] hover:underline cursor-pointer"
                                >
                                    Reset to All
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['All', 'Fresh Food & Deli', 'Pantry & Groceries', 'Frozen Food', 'Household & Personal', 'General Merchandise', 'Other'].map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDepartment(dept)}
                                    className={`px-3 py-2 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${selectedDepartment === dept
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent shadow-xs'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                    }`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subcategories Selector (when available) */}
                    {categories.length > 1 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">Category</label>
                                {selectedCategory !== 'All' && (
                                    <button
                                        onClick={() => setSelectedCategory('All')}
                                        className="text-xs font-bold text-[var(--theme-primary)] hover:underline cursor-pointer"
                                    >
                                        Reset to All
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-2 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${selectedCategory === cat
                                            ? 'bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border-focus)] shadow-xs font-bold'
                                            : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sort Options */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">Sort Products By</label>
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
                                    className={`px-3 py-2 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${sortBy === opt.id
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent shadow-xs'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">Price Range</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2">
                                <span className="text-[var(--theme-text-muted)] text-xs font-bold mr-1.5">{CURRENCY_SYMBOL}</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    aria-label="Minimum Price"
                                    className="bg-transparent border-none w-full text-xs font-bold text-[var(--theme-text-primary)] outline-none"
                                    value={minPriceFilter}
                                    onChange={(e) => setMinPriceFilter(e.target.value)}
                                />
                            </div>
                            <span className="text-[var(--theme-text-secondary)] text-xs font-bold">to</span>
                            <div className="flex-1 flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2">
                                <span className="text-[var(--theme-text-muted)] text-xs font-bold mr-1.5">{CURRENCY_SYMBOL}</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    aria-label="Maximum Price"
                                    className="bg-transparent border-none w-full text-xs font-bold text-[var(--theme-text-primary)] outline-none"
                                    value={maxPriceFilter}
                                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brands Filter */}
                    {availableBrands.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">Filter by Brand</label>
                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-1">
                                {availableBrands.map(brand => {
                                    const isChecked = selectedBrands.includes(brand);
                                    return (
                                        <div
                                            key={brand}
                                            onClick={() => toggleBrand(brand)}
                                            role="button"
                                            className="w-full flex items-center gap-2.5 py-1.5 hover:bg-[var(--theme-bg-card-hover)] px-2 rounded-lg text-left cursor-pointer select-none"
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${isChecked ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'}`}>
                                                {isChecked && (
                                                    <svg className="w-2.5 h-2.5 text-[var(--theme-primary-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-[var(--theme-text-primary)]">{brand}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Velocity Options */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">Sales Velocity</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'Fast', label: 'Fast', icon: Zap, color: 'text-amber-500' },
                                { id: 'Medium', label: 'Medium', icon: Activity, color: 'text-blue-500' },
                                { id: 'Slow', label: 'Slow', icon: Clock, color: 'text-slate-400' }
                            ].map(({ id, label, icon: Icon, color }) => {
                                const isActive = selectedVelocities.includes(id);
                                return (
                                    <button
                                        key={id}
                                        onClick={() => toggleVelocity(id)}
                                        className={`flex-1 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${isActive
                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent shadow-xs'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        <Icon size={13} className={isActive ? 'text-current' : color} />
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stock Status Switch */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">Stock Availability</label>
                        <select
                            value={stockStatusFilter}
                            onChange={(e) => setStockStatusFilter(e.target.value as any)}
                            aria-label="Stock Availability Selector"
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer tracking-tight"
                        >
                            <option value="all">Show All Items</option>
                            <option value="in_stock">In Stock Only</option>
                            <option value="low_stock">Low Stock Alerts Only</option>
                            <option value="out_of_stock">Out of Stock Only</option>
                        </select>
                    </div>

                    {/* Checkbox Switches */}
                    <div className="space-y-2 pt-1">
                        <button
                            onClick={() => setOnSaleOnly(!onSaleOnly)}
                            className="w-full flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-colors"
                        >
                            <span className="inline-flex items-center gap-2.5 text-xs font-medium text-[var(--theme-text-primary)] tracking-tight">
                                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                    <Tag className="w-3.5 h-3.5" />
                                </div>
                                <span>Only Promotional Items</span>
                            </span>
                            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${onSaleOnly ? 'bg-rose-500' : 'bg-[var(--theme-border)]'}`}>
                                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${onSaleOnly ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setCompetitorMatchedOnly(!competitorMatchedOnly)}
                            className="w-full flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-colors"
                        >
                            <span className="inline-flex items-center gap-2.5 text-xs font-medium text-[var(--theme-text-primary)] tracking-tight">
                                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                                    <Scale className="w-3.5 h-3.5" />
                                </div>
                                <span>Competitor Price-Matched</span>
                            </span>
                            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${competitorMatchedOnly ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-border)]'}`}>
                                <div className={`w-3.5 h-3.5 rounded-full bg-[var(--theme-primary-text)] transition-transform ${competitorMatchedOnly ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-[var(--theme-border-subtle)] flex items-center gap-3 bg-[var(--theme-bg-card)]">
                    <button
                        onClick={resetAllFilters}
                        className="flex-1 py-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs rounded-2xl transition-all border border-[var(--theme-border)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer tracking-tight shadow-xs"
                    >
                        <RotateCcw size={13} />
                        <span>Reset All</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-semibold text-xs rounded-2xl transition-all shadow-xs active:scale-95 cursor-pointer tracking-tight"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};
export default POSFilterSidebar;
