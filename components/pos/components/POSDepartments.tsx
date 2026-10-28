import React from 'react';
import {
    X, RotateCcw, Tag, Scale, Layers, Folder,
    Coins, Sparkles, Zap, Package, SlidersHorizontal
} from 'lucide-react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';

export const POSDepartments: React.FC = () => {
    const { t } = useLanguage();
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
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 pb-0.5 border-t border-[var(--theme-border-subtle)] animate-in fade-in duration-200">
            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mr-1">{t('pos.activeLabel')}</span>
            
            {selectedDepartment !== 'All' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Layers size={10} />
                    </span>
                    <span>{t('pos.deptLabel')} <strong className="font-semibold">{selectedDepartment}</strong></span>
                    <button onClick={() => setSelectedDepartment('All')} title="Remove department filter" aria-label="Remove department filter" className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}
            
            {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Folder size={10} />
                    </span>
                    <span>{t('pos.catLabel')} <strong className="font-semibold">{selectedCategory}</strong></span>
                    <button onClick={() => setSelectedCategory('All')} title="Remove category filter" aria-label="Remove category filter" className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}
            
            {minPriceFilter !== '' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Coins size={10} />
                    </span>
                    <span>{t('pos.minPrice')}: <strong className="font-semibold font-mono">{CURRENCY_SYMBOL} {minPriceFilter}</strong></span>
                    <button onClick={() => setMinPriceFilter('')} title="Remove minimum price filter" aria-label="Remove minimum price filter" className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}

            {maxPriceFilter !== '' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Coins size={10} />
                    </span>
                    <span>{t('pos.maxPrice')}: <strong className="font-semibold font-mono">{CURRENCY_SYMBOL} {maxPriceFilter}</strong></span>
                    <button onClick={() => setMaxPriceFilter('')} title="Remove maximum price filter" aria-label="Remove maximum price filter" className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}

            {selectedBrands.map(brand => (
                <span key={brand} className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <Sparkles size={10} />
                    </span>
                    <span>{t('pos.brandLabel')} <strong className="font-semibold">{brand}</strong></span>
                    <button onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))} title={`Remove brand filter: ${brand}`} aria-label={`Remove brand filter: ${brand}`} className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            ))}

            {selectedVelocities.map(vel => (
                <span key={vel} className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Zap size={10} />
                    </span>
                    <span>{t('pos.velocityLabel')} <strong className="font-semibold">{vel}</strong></span>
                    <button onClick={() => setSelectedVelocities(prev => prev.filter(v => v !== vel))} title={`Remove velocity filter: ${vel}`} aria-label={`Remove velocity filter: ${vel}`} className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            ))}

            {stockStatusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                        <Package size={10} />
                    </span>
                    <span>{t('pos.stockLabel')} <strong className="font-semibold">{stockStatusFilter === 'in_stock' ? t('pos.inStockOnly') : stockStatusFilter === 'low_stock' ? t('pos.lowStockAlertsOnly') : t('pos.outOfStockOnly')}</strong></span>
                    <button onClick={() => setStockStatusFilter('all')} title="Remove stock status filter" aria-label="Remove stock status filter" className="hover:bg-rose-500/15 hover:text-rose-500 text-[var(--theme-text-muted)] rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}

            {onSaleOnly && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                        <Tag size={10} />
                    </span>
                    <strong className="font-semibold">{t('pos.onSale')}</strong>
                    <button onClick={() => setOnSaleOnly(false)} title="Remove sale filter" aria-label="Remove sale filter" className="hover:bg-rose-500/25 hover:text-rose-600 text-rose-500 rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}

            {competitorMatchedOnly && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-500 border border-violet-500/20 shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center shrink-0">
                        <Scale size={10} />
                    </span>
                    <strong className="font-semibold">{t('pos.compPrice')}</strong>
                    <button onClick={() => setCompetitorMatchedOnly(false)} title="Remove competitor price matched filter" aria-label="Remove competitor price matched filter" className="hover:bg-violet-500/25 hover:text-violet-600 text-violet-500 rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}

            {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
                        <SlidersHorizontal size={10} />
                    </span>
                    <span>{t('pos.sortLabel')} <strong className="font-semibold">{sortBy === 'price-asc' ? t('pos.sortPriceAsc') : sortBy === 'price-desc' ? t('pos.sortPriceDesc') : sortBy === 'name-asc' ? t('pos.sortNameAsc') : sortBy}</strong></span>
                    <button onClick={() => setSortBy('default')} title="Reset sorting to default" aria-label="Reset sorting to default" className="hover:bg-sky-500/25 hover:text-sky-600 text-sky-500 rounded-full p-0.5 transition-colors cursor-pointer"><X size={11} /></button>
                </span>
            )}

            <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 transition-all ml-auto cursor-pointer"
            >
                <RotateCcw size={11} />
                <span>{t('pos.resetAll')}</span>
            </button>
        </div>
    );
};
export default POSDepartments;
