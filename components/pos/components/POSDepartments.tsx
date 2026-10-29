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
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Layers size={10} />
                    </span>
                    <span>{t('pos.deptLabel')} <strong className="font-semibold">{selectedDepartment}</strong></span>
                    <button type="button" onClick={() => setSelectedDepartment('All')} title={`${t('common.remove')} ${t('pos.deptLabel')}`} aria-label={`${t('common.remove')} ${t('pos.deptLabel')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] flex items-center justify-center shrink-0">
                        <Folder size={10} />
                    </span>
                    <span>{t('pos.catLabel')} <strong className="font-semibold">{selectedCategory}</strong></span>
                    <button type="button" onClick={() => setSelectedCategory('All')} title={`${t('common.remove')} ${t('pos.catLabel')}`} aria-label={`${t('common.remove')} ${t('pos.catLabel')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {minPriceFilter !== '' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                        <Coins size={10} />
                    </span>
                    <span>{t('pos.minPrice')}: <strong className="font-semibold font-mono">{CURRENCY_SYMBOL} {minPriceFilter}</strong></span>
                    <button type="button" onClick={() => setMinPriceFilter('')} title={`${t('common.remove')} ${t('pos.minPrice')}`} aria-label={`${t('common.remove')} ${t('pos.minPrice')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {maxPriceFilter !== '' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                        <Coins size={10} />
                    </span>
                    <span>{t('pos.maxPrice')}: <strong className="font-semibold font-mono">{CURRENCY_SYMBOL} {maxPriceFilter}</strong></span>
                    <button type="button" onClick={() => setMaxPriceFilter('')} title={`${t('common.remove')} ${t('pos.maxPrice')}`} aria-label={`${t('common.remove')} ${t('pos.maxPrice')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {selectedBrands.map(brand => (
                <span key={brand} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Sparkles size={10} />
                    </span>
                    <span>{t('pos.brandLabel')} <strong className="font-semibold">{brand}</strong></span>
                    <button type="button" onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))} title={`${t('common.remove')} ${brand}`} aria-label={`${t('common.remove')} ${brand}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            ))}

            {selectedVelocities.map(vel => (
                <span key={vel} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <Zap size={10} />
                    </span>
                    <span>{t('pos.velocityLabel')} <strong className="font-semibold">{vel}</strong></span>
                    <button type="button" onClick={() => setSelectedVelocities(prev => prev.filter(v => v !== vel))} title={`${t('common.remove')} ${vel}`} aria-label={`${t('common.remove')} ${vel}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            ))}

            {stockStatusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] flex items-center justify-center shrink-0">
                        <Package size={10} />
                    </span>
                    <span>{t('pos.stockLabel')} <strong className="font-semibold">{stockStatusFilter === 'in_stock' ? t('pos.inStockOnly') : stockStatusFilter === 'low_stock' ? t('pos.lowStockAlertsOnly') : t('pos.outOfStockOnly')}</strong></span>
                    <button type="button" onClick={() => setStockStatusFilter('all')} title={`${t('common.remove')} ${t('pos.stockLabel')}`} aria-label={`${t('common.remove')} ${t('pos.stockLabel')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-text-muted)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {onSaleOnly && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                        <Tag size={10} />
                    </span>
                    <strong className="font-semibold">{t('pos.onSale')}</strong>
                    <button type="button" onClick={() => setOnSaleOnly(false)} title={`${t('common.remove')} ${t('pos.onSale')}`} aria-label={`${t('common.remove')} ${t('pos.onSale')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {competitorMatchedOnly && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-border-accent)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Scale size={10} />
                    </span>
                    <strong className="font-semibold">{t('pos.compPrice')}</strong>
                    <button type="button" onClick={() => setCompetitorMatchedOnly(false)} title={`${t('common.remove')} ${t('pos.compPrice')}`} aria-label={`${t('common.remove')} ${t('pos.compPrice')}`} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[var(--theme-accent-muted)] hover:text-[var(--theme-accent)] text-[var(--theme-accent)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)] shadow-xs">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] flex items-center justify-center shrink-0">
                        <SlidersHorizontal size={10} />
                    </span>
                    <span>{t('pos.sortLabel')} <strong className="font-semibold">{sortBy === 'price-asc' ? t('pos.sortPriceAsc') : sortBy === 'price-desc' ? t('pos.sortPriceDesc') : sortBy === 'name-asc' ? t('pos.sortNameAsc') : sortBy}</strong></span>
                    <button type="button" onClick={() => setSortBy('default')} title={`${t('common.remove')} ${t('pos.sortLabel')}`} aria-label={`${t('common.remove')} ${t('pos.sortLabel')}`} className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"><X size={12} /></button>
                </span>
            )}

            <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] active:scale-95 border border-[var(--theme-status-danger-border)] transition-all ml-auto cursor-pointer"
            >
                <RotateCcw size={11} />
                <span>{t('pos.resetAll')}</span>
            </button>
        </div>
    );
};
export default POSDepartments;
