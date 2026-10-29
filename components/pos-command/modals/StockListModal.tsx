import React, { useMemo } from 'react';
import Modal from '../../Modal';
import { usePOSCommand } from '../POSCommandContext';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { ProductDetailsModal } from '../../inventory/ProductDetailsModal';
import LabelPrintModal from '../../LabelPrintModal';
import { getSellUnit, formatStockDisplay } from '../../../utils/units';
import { formatProductDisplayName } from '../../procurement/utils';
import { resolveSmartProductAttributes } from '../../../utils/groceryAttributes';
import {
    Printer, X, Search
} from 'lucide-react';

type StockFilterMode = 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_SALE' | 'BY_WEIGHT_VOLUME';

export const StockListModal: React.FC = () => {
    const { t } = useLanguage();
    const { isStockListOpen, setIsStockListOpen, stockSearch, setStockSearch } = usePOSCommand();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [activeFilter, setActiveFilter] = React.useState<StockFilterMode>('ALL');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL_CATEGORIES');
    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const [isPrintHubOpen, setIsPrintHubOpen] = React.useState(false);
    const [labelsToPrint, setLabelsToPrint] = React.useState<any[]>([]);
    const { products, activeSite } = useData();
    const { user } = useStore();
    const pageSize = 20;

    const siteProducts = useMemo(() => {
        const siteId = activeSite?.id || user?.siteId;
        return products.filter((p: any) => !siteId || p.siteId === siteId || p.site_id === siteId);
    }, [products, activeSite, user]);

    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        siteProducts.forEach((p: any) => { if (p.category) cats.add(p.category); });
        return Array.from(cats).sort();
    }, [siteProducts]);

    const filterCounts = useMemo(() => {
        let lowStock = 0; let outOfStock = 0; let onSale = 0; let weighted = 0;
        siteProducts.forEach((p: any) => {
            const threshold = p.minStock !== undefined && p.minStock !== null && p.minStock > 0 ? p.minStock : 10;
            const stockVal = p.stock || 0;
            if (stockVal <= 0) outOfStock++; else if (stockVal < threshold) lowStock++;
            if (p.isOnSale) onSale++;
            const sellUnit = getSellUnit(p.unit);
            if (sellUnit.allowDecimal || sellUnit.category === 'weight' || sellUnit.category === 'volume') weighted++;
        });
        return { all: siteProducts.length, lowStock, outOfStock, onSale, weighted };
    }, [siteProducts]);

    const filteredProducts = useMemo(() => {
        return siteProducts.filter((p: any) => {
            if (selectedCategory !== 'ALL_CATEGORIES' && p.category !== selectedCategory) return false;
            const q = stockSearch.trim().toLowerCase();
            if (q) {
                const profile = resolveSmartProductAttributes(p);
                const matchesSearch =
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                    (profile.brand && profile.brand.toLowerCase().includes(q)) ||
                    profile.subcategory.toLowerCase().includes(q) ||
                    (profile.physicalForm && profile.physicalForm.toLowerCase().includes(q)) ||
                    profile.packBadge.toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }
            const threshold = p.minStock !== undefined && p.minStock !== null && p.minStock > 0 ? p.minStock : 10;
            const stockVal = p.stock || 0;
            if (activeFilter === 'LOW_STOCK') return stockVal > 0 && stockVal < threshold;
            if (activeFilter === 'OUT_OF_STOCK') return stockVal <= 0;
            if (activeFilter === 'ON_SALE') return !!p.isOnSale;
            if (activeFilter === 'BY_WEIGHT_VOLUME') { const sellUnit = getSellUnit(p.unit); return sellUnit.allowDecimal || sellUnit.category === 'weight' || sellUnit.category === 'volume'; }
            return true;
        });
    }, [siteProducts, stockSearch, activeFilter, selectedCategory]);

    const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    React.useEffect(() => { setCurrentPage(1); }, [stockSearch, activeFilter, selectedCategory]);

    const filterTabs = useMemo(() => {
        const tabs: Array<{ id: StockFilterMode; label: string; count: number; dotColor?: string; alwaysShow?: boolean }> = [
            { id: 'ALL', label: t('posCommand.filterAll'), count: filterCounts.all, alwaysShow: true },
            { id: 'LOW_STOCK', label: t('posCommand.filterLowStock'), count: filterCounts.lowStock, dotColor: filterCounts.lowStock > 0 ? 'bg-[var(--theme-status-warning)]' : undefined, alwaysShow: true },
            { id: 'OUT_OF_STOCK', label: t('posCommand.filterOutOfStock'), count: filterCounts.outOfStock, dotColor: filterCounts.outOfStock > 0 ? 'bg-[var(--theme-status-danger)]' : undefined, alwaysShow: true },
            { id: 'ON_SALE', label: t('posCommand.filterOnSale'), count: filterCounts.onSale },
            { id: 'BY_WEIGHT_VOLUME', label: t('posCommand.filterWeightedVol'), count: filterCounts.weighted },
        ];
        return tabs.filter(tab => tab.alwaysShow || tab.count > 0 || activeFilter === tab.id);
    }, [t, filterCounts, activeFilter]);

    const hasActiveFilters = activeFilter !== 'ALL' || selectedCategory !== 'ALL_CATEGORIES' || Boolean(stockSearch);

    return (
        <Modal isOpen={isStockListOpen} onClose={() => setIsStockListOpen(false)} title={`${t('posCommand.stockLookupHeader')} — ${activeSite?.name || t('posCommand.currentLocation')}`} size="xl">
            <div className="space-y-3">
                {/* Primary Search & Control Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[220px] min-h-[44px] flex items-center gap-2 bg-[var(--theme-input-bg)] px-3 rounded-xl border border-[var(--theme-border)] focus-within:border-[var(--theme-border-focus)] transition-colors">
                        <Search className="w-4 h-4 text-[var(--theme-text-muted)] shrink-0" />
                        <input
                            type="text"
                            value={stockSearch}
                            onChange={(e) => setStockSearch(e.target.value)}
                            placeholder={t('posCommand.searchStockPlaceholder')}
                            className="flex-1 bg-transparent border-none outline-none text-[var(--theme-text-primary)] text-xs placeholder:text-[var(--theme-text-muted)]"
                            autoFocus
                        />
                        {stockSearch && (
                            <button
                                type="button"
                                onClick={() => setStockSearch('')}
                                title={t('posCommand.resetFilters')}
                                aria-label={t('posCommand.resetFilters')}
                                className="w-6 h-6 rounded-full hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {availableCategories.length > 0 && (
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="min-h-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl px-3 text-xs font-medium text-[var(--theme-text-primary)] outline-none cursor-pointer focus:border-[var(--theme-border-focus)] transition-colors"
                            title={t('posCommand.allCategoriesCount', { count: availableCategories.length })}
                            aria-label={t('posCommand.allCategoriesCount', { count: availableCategories.length })}
                        >
                            <option value="ALL_CATEGORIES">{t('posCommand.allCategoriesCount', { count: availableCategories.length })}</option>
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    )}

                    <button
                        type="button"
                        onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }}
                        title={t('posCommand.printLabels')}
                        aria-label={t('posCommand.printLabels')}
                        className="min-h-[44px] px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        <Printer size={14} className="text-[var(--theme-text-secondary)]" />
                        <span>{t('posCommand.printLabels')}</span>
                    </button>
                </div>

                {/* Streamlined Filter Strip & Inline Unseen Actions */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                        {filterTabs.map(tab => {
                            const isActive = activeFilter === tab.id;
                            const isZero = tab.count === 0 && !isActive;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveFilter(tab.id)}
                                    title={tab.label}
                                    aria-label={`${tab.label} (${tab.count})`}
                                    aria-pressed={isActive}
                                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                        isActive
                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                                            : `bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] ${isZero ? 'opacity-50' : ''}`
                                    }`}
                                >
                                    {tab.dotColor && !isActive && <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor} shrink-0`} />}
                                    <span>{tab.label}</span>
                                    <span className={`text-[11px] font-mono tabular-nums ${isActive ? 'opacity-85' : 'text-[var(--theme-text-muted)]'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={() => { setActiveFilter('ALL'); setSelectedCategory('ALL_CATEGORIES'); setStockSearch(''); }}
                                title={t('posCommand.resetFilters')}
                                aria-label={t('posCommand.resetFilters')}
                                className="h-8 px-2.5 rounded-lg text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            >
                                <X size={13} />
                                <span>{t('posCommand.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Table */}
                <div className="overflow-x-auto rounded-xl border border-[var(--theme-border)] isolate">
                    <table className="w-full text-sm">
                        <thead className="text-[var(--theme-thead-text)] bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="text-left py-2 px-3 font-medium text-[10px] uppercase tracking-wider">{t('inventory.product')}</th>
                                <th className="text-right py-2 px-3 font-medium text-[10px] uppercase tracking-wider">{t('inventory.price')}</th>
                                <th className="text-right py-2 px-3 font-medium text-[10px] uppercase tracking-wider">{t('inventory.stock')}</th>
                                <th className="text-right py-2 px-3 font-medium text-[10px] uppercase tracking-wider">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {paginatedProducts.map(product => {
                                const stock = product.stock || 0;
                                const minimum = product.minStock && product.minStock > 0 ? product.minStock : 10;
                                const stockLabel = stock <= 0 ? t('posCommand.filterOutOfStock') : stock < minimum ? t('posCommand.filterLowStock') : '';
                                const isPendingApproval = ((product.approvalStatus || (product as any).approval_status) || 'approved').toLowerCase() === 'pending';
                                return (
                                    <tr key={product.id} onClick={() => setSelectedProduct(product)} className="hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer">
                                        <td className="py-2 px-3 max-w-[22rem]">
                                            <button type="button" onClick={() => setSelectedProduct(product)} className="text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] w-full" aria-label={`${t('posCommand.productDetails')}: ${product.name}`}>
                                                <span className="flex items-center gap-1.5 font-medium text-[var(--theme-text-primary)]">
                                                    <span className="break-words text-xs font-semibold leading-snug line-clamp-2">{formatProductDisplayName(product) || product.name}</span>
                                                    {isPendingApproval && (
                                                        <span className="px-1.5 py-0.5 rounded bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] text-[10px] font-medium shrink-0">
                                                            {t('posCommand.pendingApproval')}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="block mt-0.5 text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                                    {product.sku}{product.category ? ` · ${product.category}` : ''}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="py-2 px-3 text-right whitespace-nowrap font-mono tabular-nums text-xs font-medium text-[var(--theme-text-primary)]">
                                            {CURRENCY_SYMBOL} {formatPriceValue(product.price)}
                                        </td>
                                        <td className="py-2 px-3 text-right whitespace-nowrap">
                                            <span className="font-mono tabular-nums text-xs text-[var(--theme-text-primary)]">{formatStockDisplay(stock, product)}</span>
                                            {stockLabel && (
                                                <span className={`block mt-0.5 text-[10px] font-medium ${stock <= 0 ? 'text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-status-warning-text)]'}`}>
                                                    {stockLabel}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3" onClick={event => event.stopPropagation()}>
                                            <div className="flex justify-end items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="h-8 px-2.5 rounded-lg border border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] text-xs font-medium text-[var(--theme-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] cursor-pointer"
                                                >
                                                    {t('posCommand.productDetails')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setLabelsToPrint([{ product, quantity: 1 }]); setIsPrintHubOpen(true); }}
                                                    aria-label={`${t('posCommand.printLabels')}: ${product.name}`}
                                                    title={t('posCommand.printLabels')}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] cursor-pointer"
                                                >
                                                    <Printer size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-[var(--theme-text-secondary)] text-xs font-medium">
                                        {hasActiveFilters ? t('posCommand.noProductsMatchingFilters') : t('posCommand.noProductsLocation')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-[var(--theme-text-secondary)] flex items-center gap-2 tabular-nums">
                            <span>{t('common.page')} {currentPage} / {totalPages}</span>
                            <span className="opacity-40">·</span>
                            <span>{filteredProducts.length} {t('inventory.products')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage <= 1}
                                title={t('common.previous')}
                                aria-label={t('common.previous')}
                                className="min-h-[36px] px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xs font-medium rounded-lg border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage >= totalPages}
                                title={t('common.next')}
                                aria-label={t('common.next')}
                                className="min-h-[36px] px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xs font-medium rounded-lg border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ProductDetailsModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
            <LabelPrintModal isOpen={isPrintHubOpen} onClose={() => setIsPrintHubOpen(false)} labels={labelsToPrint} onPrint={() => setIsPrintHubOpen(false)} />
        </Modal>
    );
};
