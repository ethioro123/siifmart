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
    Printer, TrendingUp, Package, CheckCheck,
    AlertTriangle, AlertCircle, Sparkles, X, Search, Tag, Scale
} from 'lucide-react';

type StockFilterMode = 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PRICE_UPDATED' | 'STOCK_UPDATED' | 'ON_SALE' | 'BY_WEIGHT_VOLUME' | 'UNSEEN';

function getUpdateFlags(product: any, lastSeen: number): { priceUpdated: boolean; stockUpdated: boolean; isUnseen: boolean } {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const priceTime = product.priceUpdatedAt || product.price_updated_at;
    const stockTime = product.stockUpdatedAt || product.stock_updated_at;
    const updatedAt = (product as any).updatedAt || (product as any).updated_at;
    let priceUpdated = false; let stockUpdated = false; let isUnseen = false;
    if (priceTime && new Date(priceTime).getTime() > cutoff) { priceUpdated = true; if (new Date(priceTime).getTime() > lastSeen) isUnseen = true; }
    if (stockTime && new Date(stockTime).getTime() > cutoff) { stockUpdated = true; if (new Date(stockTime).getTime() > lastSeen) isUnseen = true; }
    if (!priceUpdated && !stockUpdated && updatedAt && new Date(updatedAt).getTime() > cutoff) {
        const updateType = (product.updateType || product.update_type || '').toLowerCase();
        priceUpdated = !updateType || updateType.includes('price');
        stockUpdated = !updateType || updateType.includes('stock');
        if (new Date(updatedAt).getTime() > lastSeen) isUnseen = true;
    }
    return { priceUpdated, stockUpdated, isUnseen };
}

export const StockListModal: React.FC = () => {
    const { t } = useLanguage();
    const { isStockListOpen, setIsStockListOpen, stockSearch, setStockSearch, lastSeenUpdates, markUpdatesAsRead } = usePOSCommand();
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
        let lowStock = 0; let outOfStock = 0; let priceUpdated = 0; let stockUpdated = 0; let onSale = 0; let weighted = 0; let unseen = 0;
        siteProducts.forEach((p: any) => {
            const threshold = p.minStock !== undefined && p.minStock !== null && p.minStock > 0 ? p.minStock : 10;
            const stockVal = p.stock || 0;
            if (stockVal <= 0) outOfStock++; else if (stockVal < threshold) lowStock++;
            const flags = getUpdateFlags(p, lastSeenUpdates);
            if (flags.priceUpdated) priceUpdated++; if (flags.stockUpdated) stockUpdated++; if (flags.isUnseen) unseen++;
            if (p.isOnSale) onSale++;
            const sellUnit = getSellUnit(p.unit);
            if (sellUnit.allowDecimal || sellUnit.category === 'weight' || sellUnit.category === 'volume') weighted++;
        });
        return { all: siteProducts.length, lowStock, outOfStock, priceUpdated, stockUpdated, onSale, weighted, unseen };
    }, [siteProducts, lastSeenUpdates]);

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
            const flags = getUpdateFlags(p, lastSeenUpdates);
            if (activeFilter === 'LOW_STOCK') return stockVal > 0 && stockVal < threshold;
            if (activeFilter === 'OUT_OF_STOCK') return stockVal <= 0;
            if (activeFilter === 'PRICE_UPDATED') return flags.priceUpdated;
            if (activeFilter === 'STOCK_UPDATED') return flags.stockUpdated;
            if (activeFilter === 'ON_SALE') return !!p.isOnSale;
            if (activeFilter === 'BY_WEIGHT_VOLUME') { const sellUnit = getSellUnit(p.unit); return sellUnit.allowDecimal || sellUnit.category === 'weight' || sellUnit.category === 'volume'; }
            if (activeFilter === 'UNSEEN') return flags.isUnseen;
            return true;
        });
    }, [siteProducts, stockSearch, activeFilter, selectedCategory, lastSeenUpdates]);

    const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    React.useEffect(() => { setCurrentPage(1); }, [stockSearch, activeFilter, selectedCategory]);

    const filterTabs: Array<{ id: StockFilterMode; label: string; icon?: React.ReactNode; color: string; activeColor: string; count: number }> = [
        { id: 'ALL', label: 'All', color: 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)]', activeColor: 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs', count: filterCounts.all },
        { id: 'LOW_STOCK', label: 'Low Stock', icon: <AlertTriangle size={13} />, color: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20', activeColor: 'bg-amber-500 text-white shadow-xs', count: filterCounts.lowStock },
        { id: 'OUT_OF_STOCK', label: 'Out of Stock', icon: <AlertCircle size={13} />, color: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20', activeColor: 'bg-red-600 text-white shadow-xs', count: filterCounts.outOfStock },
        { id: 'PRICE_UPDATED', label: 'Price Updated', icon: <TrendingUp size={13} />, color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20', activeColor: 'bg-blue-600 text-white shadow-xs', count: filterCounts.priceUpdated },
        { id: 'STOCK_UPDATED', label: 'Stock Updated', icon: <Package size={13} />, color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20', activeColor: 'bg-emerald-600 text-white shadow-xs', count: filterCounts.stockUpdated },
        { id: 'ON_SALE', label: 'On Sale', icon: <Tag size={13} />, color: 'bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20', activeColor: 'bg-purple-600 text-white shadow-xs', count: filterCounts.onSale },
        { id: 'BY_WEIGHT_VOLUME', label: 'Weighted / Vol', icon: <Scale size={13} />, color: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500/20', activeColor: 'bg-cyan-600 text-white shadow-xs', count: filterCounts.weighted },
    ];

    return (
        <Modal isOpen={isStockListOpen} onClose={() => setIsStockListOpen(false)} title={`${t('posCommand.stockLookupHeader')} - ${activeSite?.name || t('posCommand.currentLocation')}`} size="xl">
            <div className="space-y-4">
                {filterCounts.unseen > 0 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{filterCounts.unseen > 99 ? '99+' : filterCounts.unseen}</span>
                            <p className="text-xs font-semibold text-amber-500">{filterCounts.unseen} product{filterCounts.unseen !== 1 ? 's' : ''} updated recently</p>
                        </div>
                        <button type="button" onClick={markUpdatesAsRead} title="Mark all updates as read" aria-label="Mark all updates as read" className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer">
                            <CheckCheck size={13} className="text-emerald-300" /><span>Mark all as read</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {filterTabs.map(tab => (
                        <button key={tab.id} type="button" onClick={() => setActiveFilter(tab.id)} title={`Filter by ${tab.label}`} aria-label={`Filter by ${tab.label}`} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeFilter === tab.id ? tab.activeColor : tab.color}`}>
                            {tab.icon}<span>{tab.label}</span><span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 dark:bg-white/15 font-bold">{tab.count}</span>
                        </button>
                    ))}
                    {filterCounts.unseen > 0 && (
                        <button type="button" onClick={() => setActiveFilter('UNSEEN')} title="Filter by unseen updates" aria-label="Filter by unseen updates" className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeFilter === 'UNSEEN' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'}`}>
                            <Sparkles size={13} /><span>Unseen Updates</span><span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-bold">{filterCounts.unseen}</span>
                        </button>
                    )}
                    {(activeFilter !== 'ALL' || selectedCategory !== 'ALL_CATEGORIES' || stockSearch) && (
                        <button type="button" onClick={() => { setActiveFilter('ALL'); setSelectedCategory('ALL_CATEGORIES'); setStockSearch(''); }} className="px-2.5 py-1.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-full text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer ml-auto" title="Reset all filters" aria-label="Reset all filters">
                            <X size={13} /><span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Apple Liquid Glass Product Search Bar */}
                <div className="flex flex-wrap items-center gap-2.5 bg-[var(--theme-input-bg)] p-1.5 pl-2.5 rounded-2xl border border-[var(--theme-border)] focus-within:border-[var(--theme-border-focus)] transition-all shadow-2xs">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <input type="text" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder={t('posCommand.searchStockPlaceholder')} className="flex-1 bg-transparent border-none outline-none text-[var(--theme-text-primary)] px-1 py-1 text-xs placeholder:text-[var(--theme-text-muted)] min-w-[150px]" autoFocus />
                    {stockSearch && (
                        <button type="button" onClick={() => setStockSearch('')} title="Clear search" aria-label="Clear search" className="w-6 h-6 rounded-full hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors cursor-pointer mr-1">
                            <X size={13} />
                        </button>
                    )}
                    {availableCategories.length > 0 && (
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer focus:border-[var(--theme-border-focus)] shadow-2xs" title="Filter by Category" aria-label="Filter by Category">
                            <option value="ALL_CATEGORIES">All Categories ({availableCategories.length})</option>
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    )}
                    <button type="button" onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }} title="Print product barcode and price labels" aria-label="Print product barcode and price labels" className="px-3.5 py-1.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer shadow-xs">
                        <Printer size={13} className="opacity-90" /><span>Print Labels</span>
                    </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)] isolate">
                    <table className="w-full text-sm">
                        <thead className="text-[var(--theme-thead-text)] bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="text-left p-3 font-semibold uppercase tracking-wider text-[10px]">{t('inventory.product')}</th>
                                <th className="text-right p-3 font-semibold uppercase tracking-wider text-[10px]">{t('inventory.price')}</th>
                                <th className="text-right p-3 font-semibold uppercase tracking-wider text-[10px]">{t('inventory.stock')}</th>
                                <th className="text-right p-3 font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {paginatedProducts.map(product => {
                                const stock = product.stock || 0;
                                const minimum = product.minStock && product.minStock > 0 ? product.minStock : 10;
                                const stockLabel = stock <= 0 ? 'Out of stock' : stock < minimum ? 'Low stock' : '';
                                return <tr key={product.id} onClick={() => setSelectedProduct(product)} className="hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer">
                                    <td className="p-3 max-w-[22rem]">
                                        <button type="button" onClick={() => setSelectedProduct(product)} className="text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label={`View details for ${product.name}`}>
                                            <span className="block font-medium text-[var(--theme-text-primary)]">{formatProductDisplayName(product) || product.name}</span>
                                            <span className="block mt-1 text-xs font-mono text-[var(--theme-text-secondary)]">{product.sku}</span>
                                        </button>
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap font-mono tabular-nums text-[var(--theme-text-primary)]">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}</td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        <span className="font-mono tabular-nums text-[var(--theme-text-primary)]">{formatStockDisplay(stock, product)}</span>
                                        {stockLabel && <span className="block mt-1 text-xs text-[var(--theme-text-secondary)]">{stockLabel}</span>}
                                    </td>
                                    <td className="p-3" onClick={event => event.stopPropagation()}>
                                        <div className="flex justify-end items-center gap-2">
                                            <button type="button" onClick={() => setSelectedProduct(product)} className="min-h-[44px] px-3 rounded-lg border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Details</button>
                                            <button type="button" onClick={() => { setLabelsToPrint([{ product, quantity: 1 }]); setIsPrintHubOpen(true); }} aria-label={`Print label for ${product.name}`} title="Print label" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"><Printer size={16}/></button>
                                        </div>
                                    </td>
                                </tr>;
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-[var(--theme-text-secondary)] font-medium">
                                        {activeFilter !== 'ALL' || selectedCategory !== 'ALL_CATEGORIES' ? `No products found matching active filters` : t('posCommand.noProductsLocation')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length > 0 && (
                    <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-4 bg-transparent mt-4">
                        <div className="text-xs text-[var(--theme-text-secondary)] flex items-center gap-2">
                            <span>{t('common.page')} {currentPage} / {totalPages}</span><span className="opacity-50">|</span><span>{filteredProducts.length} {t('inventory.products')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage <= 1} title="Previous page" aria-label="Previous page" className="px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-[10px] font-bold rounded-xl border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer">{t('common.previous')}</button>
                            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} title="Next page" aria-label="Next page" className="px-3.5 py-1.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 text-[10px] font-bold rounded-xl border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer">{t('common.next')}</button>
                        </div>
                    </div>
                )}
            </div>

            <ProductDetailsModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
            <LabelPrintModal isOpen={isPrintHubOpen} onClose={() => setIsPrintHubOpen(false)} labels={labelsToPrint} onPrint={() => setIsPrintHubOpen(false)} />
        </Modal>
    );
};
