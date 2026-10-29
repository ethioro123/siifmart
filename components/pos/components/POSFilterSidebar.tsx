import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Tag, Layers, Folder, Package, Check } from 'lucide-react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface POSFilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    availableBrands?: string[];
    activeFiltersCount: number;
}

export const POSFilterSidebar: React.FC<POSFilterSidebarProps> = ({
    isOpen,
    onClose,
    activeFiltersCount
}) => {
    const { t } = useLanguage();
    const {
        categories,
        selectedCategory,
        setSelectedCategory,
        selectedDepartment,
        setSelectedDepartment,
        sortBy,
        setSortBy,
        stockStatusFilter,
        setStockStatusFilter,
        onSaleOnly,
        setOnSaleOnly,
        resetAllFilters
    } = usePOS();

    const closeButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const departments = [
        { id: 'All', labelKey: 'pos.deptAll' },
        { id: 'Fresh Food & Deli', labelKey: 'pos.deptFreshFood' },
        { id: 'Pantry & Groceries', labelKey: 'pos.deptPantry' },
        { id: 'Frozen Food', labelKey: 'pos.deptFrozen' },
        { id: 'Household & Personal', labelKey: 'pos.deptHousehold' },
        { id: 'General Merchandise', labelKey: 'pos.deptGeneral' },
        { id: 'Other', labelKey: 'pos.deptOther' }
    ] as const;

    const sortOptions = [
        { id: 'default', labelKey: 'pos.sortDefault' },
        { id: 'name-asc', labelKey: 'pos.sortNameAsc' },
        { id: 'price-asc', labelKey: 'pos.sortPriceAsc' },
        { id: 'price-desc', labelKey: 'pos.sortPriceDesc' }
    ] as const;

    const stockOptions = [
        { id: 'all', labelKey: 'pos.allStock' },
        { id: 'in_stock', labelKey: 'pos.inStock' },
        { id: 'low_stock', labelKey: 'pos.lowStock' }
    ] as const;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-label={t('pos.filtersAndSort')}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 transition-opacity duration-200 animate-in fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar Container */}
            <div className="relative w-full max-w-md bg-[var(--theme-bg-panel)] h-full shadow-xl flex flex-col z-10 border-l border-[var(--theme-border)] transform transition-transform duration-200 animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-4 border-b border-[var(--theme-border-subtle)] flex items-center justify-between bg-[var(--theme-bg-card)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <SlidersHorizontal size={17} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                    {t('pos.filtersAndSort')}
                                </h2>
                                {activeFiltersCount > 0 && (
                                    <span className="bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[11px] font-bold px-2 py-0.5 rounded-full">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        title={t('common.close')}
                        aria-label={t('common.close')}
                        className="min-h-11 min-w-11 rounded-full bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body / Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                    {/* 1. Department Selection */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                <Layers size={13} className="text-indigo-500" />
                                {t('pos.department')}
                            </span>
                            {selectedDepartment !== 'All' && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedDepartment('All')}
                                    className="text-xs font-semibold text-[var(--theme-primary)] hover:underline cursor-pointer"
                                >
                                    {t('pos.resetToAll')}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {departments.map(dept => {
                                const isSelected = selectedDepartment === dept.id;
                                return (
                                    <button
                                        type="button"
                                        key={dept.id}
                                        onClick={() => setSelectedDepartment(dept.id)}
                                        className={`min-h-11 px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent shadow-xs font-bold'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        {isSelected && <Check size={12} className="shrink-0" />}
                                        <span className="truncate">{t(dept.labelKey)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subcategories (when department is chosen or categories are available) */}
                    {categories.length > 1 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                    <Folder size={13} className="text-[var(--theme-status-info-text)]" />
                                    {t('pos.categories')}
                                </span>
                                {selectedCategory !== 'All' && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory('All')}
                                        className="text-xs font-semibold text-[var(--theme-primary)] hover:underline cursor-pointer"
                                    >
                                        {t('pos.resetToAll')}
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-2 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                {categories.map(cat => {
                                    const isSelected = selectedCategory === cat;
                                    return (
                                        <button
                                            type="button"
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`min-h-11 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                                                isSelected
                                                    ? 'bg-[var(--theme-pill-bg)] text-[var(--theme-pill-text)] border border-[var(--theme-border-focus)] shadow-xs font-bold'
                                                    : 'bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                            }`}
                                        >
                                            {cat === 'All' ? t('common.all') : cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. Stock Availability */}
                    <div className="space-y-2.5">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Package size={13} className="text-cyan-500" />
                            {t('pos.stockAvailability')}
                        </span>
                        <div className="grid grid-cols-3 gap-2 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                            {stockOptions.map(opt => {
                                const isSelected = stockStatusFilter === opt.id;
                                return (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setStockStatusFilter(opt.id as any)}
                                        className={`min-h-11 py-2 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center ${
                                            isSelected
                                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)] font-bold'
                                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        {t(opt.labelKey)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Sort Options */}
                    <div className="space-y-2.5">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <SlidersHorizontal size={13} className="text-[var(--theme-status-info-text)]" />
                            {t('pos.sortProductsBy')}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {sortOptions.map(opt => {
                                const isSelected = sortBy === opt.id;
                                return (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setSortBy(opt.id)}
                                        className={`min-h-11 px-3 py-2 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent shadow-xs'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                        }`}
                                    >
                                        {isSelected && <Check size={12} className="shrink-0" />}
                                        <span>{t(opt.labelKey)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Deals & Promotions Toggle */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setOnSaleOnly(!onSaleOnly)}
                            aria-pressed={onSaleOnly}
                            className="w-full min-h-11 flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-colors"
                        >
                            <span className="inline-flex items-center gap-2.5 text-xs font-medium text-[var(--theme-text-primary)] tracking-tight">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <span className="font-semibold">{t('pos.onlyPromotionalItems')}</span>
                            </span>
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${onSaleOnly ? 'bg-[var(--theme-status-danger-bg)]' : 'bg-[var(--theme-border)]'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${onSaleOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-[var(--theme-border-subtle)] flex items-center gap-3 bg-[var(--theme-bg-card)]">
                    <button
                        type="button"
                        onClick={resetAllFilters}
                        className="flex-1 min-h-11 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs rounded-2xl transition-all border border-[var(--theme-border)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer tracking-tight shadow-xs"
                    >
                        <RotateCcw size={14} />
                        <span>{t('pos.resetAll')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 min-h-11 py-3 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-semibold text-xs rounded-2xl transition-all shadow-xs active:scale-95 cursor-pointer tracking-tight flex items-center justify-center"
                    >
                        {t('pos.applyFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSFilterSidebar;
