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
import { getSellUnit, formatProductSize, formatStockDisplay } from '../../../utils/units';
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
    const [selectedSmartUnitProduct, setSelectedSmartUnitProduct] = React.useState<any>(null);
    const [isPrintHubOpen, setIsPrintHubOpen] = React.useState(false);
    const [labelsToPrint, setLabelsToPrint] = React.useState<any[]>([]);
    const { products, activeSite, employees, movements, orders } = useData();
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
            const matchesSearch = !stockSearch.trim() || p.name.toLowerCase().includes(stockSearch.toLowerCase()) || p.sku.toLowerCase().includes(stockSearch.toLowerCase()) || (p.barcode && p.barcode.toLowerCase().includes(stockSearch.toLowerCase()));
            if (!matchesSearch) return false;
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
        { id: 'ALL', label: 'All', color: 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10', activeColor: 'bg-[#2C5E3B] text-white shadow-sm', count: filterCounts.all },
        { id: 'LOW_STOCK', label: 'Low Stock', icon: <AlertTriangle size={13} />, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20', activeColor: 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/50', count: filterCounts.lowStock },
        { id: 'OUT_OF_STOCK', label: 'Out of Stock', icon: <AlertCircle size={13} />, color: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 hover:bg-red-500/20', activeColor: 'bg-red-600 text-white shadow-sm ring-2 ring-red-500/50', count: filterCounts.outOfStock },
        { id: 'PRICE_UPDATED', label: 'Price Updated', icon: <TrendingUp size={13} />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20', activeColor: 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50', count: filterCounts.priceUpdated },
        { id: 'STOCK_UPDATED', label: 'Stock Updated', icon: <Package size={13} />, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20', activeColor: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50', count: filterCounts.stockUpdated },
        { id: 'ON_SALE', label: 'On Sale', icon: <Tag size={13} />, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20', activeColor: 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/50', count: filterCounts.onSale },
        { id: 'BY_WEIGHT_VOLUME', label: 'Weighted / Vol', icon: <Scale size={13} />, color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20', activeColor: 'bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-400/50', count: filterCounts.weighted },
    ];

    return (
        <Modal isOpen={isStockListOpen} onClose={() => setIsStockListOpen(false)} title={`${t('posCommand.stockLookupHeader')} - ${activeSite?.name || t('posCommand.currentLocation')}`} size="xl">
            <div className="space-y-4">
                {filterCounts.unseen > 0 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">{filterCounts.unseen > 99 ? '99+' : filterCounts.unseen}</span>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-300">{filterCounts.unseen} product{filterCounts.unseen !== 1 ? 's' : ''} updated recently</p>
                        </div>
                        <button type="button" onClick={markUpdatesAsRead} title="Mark all updates as read" aria-label="Mark all updates as read" className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer">
                            <CheckCheck size={13} /><span>Mark all as read</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {filterTabs.map(tab => (
                        <button key={tab.id} type="button" onClick={() => setActiveFilter(tab.id)} title={`Filter by ${tab.label}`} aria-label={`Filter by ${tab.label}`} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeFilter === tab.id ? tab.activeColor : tab.color}`}>
                            {tab.icon}<span>{tab.label}</span><span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-extrabold">{tab.count}</span>
                        </button>
                    ))}
                    {filterCounts.unseen > 0 && (
                        <button type="button" onClick={() => setActiveFilter('UNSEEN')} title="Filter by unseen updates" aria-label="Filter by unseen updates" className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeFilter === 'UNSEEN' ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/50' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'}`}>
                            <Sparkles size={13} className="animate-pulse" /><span>Unseen Updates</span><span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-600 text-white font-extrabold animate-pulse">{filterCounts.unseen}</span>
                        </button>
                    )}
                    {(activeFilter !== 'ALL' || selectedCategory !== 'ALL_CATEGORIES' || stockSearch) && (
                        <button type="button" onClick={() => { setActiveFilter('ALL'); setSelectedCategory('ALL_CATEGORIES'); setStockSearch(''); }} className="px-2.5 py-1.5 bg-stone-200 dark:bg-white/10 hover:bg-stone-300 text-stone-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ml-auto" title="Reset all filters" aria-label="Reset all filters">
                            <X size={13} /><span>Reset</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-black/20 p-2.5 rounded-xl border border-[#E2DCCE] dark:border-white/10 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] transition-colors">
                    <Search className="w-4 h-4 text-stone-400 ml-1 shrink-0" />
                    <input type="text" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder={t('posCommand.searchStockPlaceholder')} className="flex-1 bg-transparent border-none outline-none text-[#1E3F27] dark:text-white px-2 py-1 placeholder:text-stone-400 dark:placeholder:text-gray-500 min-w-[150px]" autoFocus />
                    {stockSearch && (
                        <button type="button" onClick={() => setStockSearch('')} title="Clear search" aria-label="Clear search" className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                    {availableCategories.length > 0 && (
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E3F27] dark:text-white outline-none cursor-pointer focus:border-[#2C5E3B]" title="Filter by Category" aria-label="Filter by Category">
                            <option value="ALL_CATEGORIES">All Categories ({availableCategories.length})</option>
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    )}
                    <button type="button" onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }} title="Open print hub for barcode labels" aria-label="Open print hub for barcode labels" className="px-3.5 py-2 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] dark:hover:bg-[#2C5E3B]/80 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer ml-1">
                        <Printer size={15} /><span>Print Hub</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-stone-500 dark:text-gray-400 border-b border-[#E2DCCE] dark:border-white/10">
                            <tr>
                                <th className="text-left p-3 font-medium uppercase tracking-wider">{t('inventory.product')}</th>
                                <th className="text-left p-3 font-medium uppercase tracking-wider">{t('inventory.category')}</th>
                                <th className="text-right p-3 font-medium uppercase tracking-wider">{t('inventory.price')}</th>
                                <th className="text-right p-3 font-medium uppercase tracking-wider">{t('inventory.stock')}</th>
                                <th className="text-center p-3 font-medium uppercase tracking-wider">{t('inventory.unit')}</th>
                                <th className="text-center p-3 font-medium uppercase tracking-wider">{t('common.status')}</th>
                                <th className="text-right p-3 font-medium uppercase tracking-wider">Last Updated</th>
                                <th className="text-right p-3 font-medium uppercase tracking-wider">Added By</th>
                                <th className="text-center p-3 font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                            {paginatedProducts.map(product => {
                                const flags = getUpdateFlags(product, lastSeenUpdates);
                                return (
                                    <tr key={product.id} onClick={() => setSelectedProduct(product)} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                        <td className="p-3">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-[#1E3F27] dark:text-white truncate">{product.name}</p>
                                                        {flags.isUnseen && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 uppercase flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Updated</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className="text-xs text-stone-400 dark:text-gray-500 font-mono font-bold">{product.sku}</span>
                                                        {product.brand && <span className="text-[9px] font-bold text-stone-600 bg-stone-100 dark:text-stone-300 dark:bg-white/10 px-1.5 py-0.5 rounded border border-stone-200 dark:border-white/5 uppercase">{product.brand}</span>}
                                                        {formatProductSize(product) && <span className="text-[9px] font-black text-amber-700 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">{formatProductSize(product)}</span>}
                                                    </div>
                                                </div>
                                                {(flags.priceUpdated || flags.stockUpdated) && (
                                                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                                        {flags.priceUpdated && <span className="flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30 rounded-md whitespace-nowrap"><TrendingUp size={9} />Price</span>}
                                                        {flags.stockUpdated && <span className="flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 rounded-md whitespace-nowrap"><Package size={9} />Stock</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-stone-600 dark:text-gray-400">{product.category || t('posCommand.uncategorized')}</td>
                                        <td className="p-3 text-right font-medium text-[#1E3F27] dark:text-white">{CURRENCY_SYMBOL} {formatPriceValue(product.price)}</td>
                                        <td className="p-3 text-right">
                                            {(() => {
                                                const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                                const stockVal = product.stock || 0;
                                                const isOutOfStock = stockVal <= 0; const isLowStock = stockVal < threshold;
                                                let colorClass = 'text-[#2C5E3B] dark:text-[#A9CBA2]';
                                                if (isOutOfStock) colorClass = 'text-red-600 dark:text-red-400';
                                                else if (isLowStock) colorClass = 'text-amber-600 dark:text-amber-400';
                                                return <div className={`font-mono font-bold text-xs ${colorClass}`}>{formatStockDisplay(stockVal, product)}</div>;
                                            })()}
                                        </td>
                                        <td className="p-3 text-center"><span className="text-[10px] font-bold font-mono text-stone-600 dark:text-gray-300 uppercase bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded border border-stone-200 dark:border-white/5">{getSellUnit(product.unit).shortLabel}</span></td>
                                        <td className="p-3 text-center">
                                            {(() => {
                                                const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                                const isOutOfStock = product.stock <= 0; const isLowStock = product.stock < threshold;
                                                if (isOutOfStock) return <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-100 dark:border-transparent">{t('common.outOfStock')}</span>;
                                                if (isLowStock) return <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-transparent">{t('common.low')}</span>;
                                                return <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-emerald-50 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-100 dark:border-transparent">{t('common.active')}</span>;
                                            })()}
                                        </td>
                                        <td className="p-3 text-right text-stone-500 dark:text-gray-400 text-xs whitespace-nowrap font-mono">
                                            {(() => {
                                                const dateStr = product.posReceivedAt || product.pos_received_at || (product as any).updatedAt || (product as any).updated_at || product.createdAt || (product as any).created_at;
                                                if (!dateStr) return '—';
                                                try { const d = new Date(dateStr); return isNaN(d.getTime()) ? '—' : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; }
                                            })()}
                                        </td>
                                        <td className="p-3 text-right text-stone-500 dark:text-gray-400 text-[11px] whitespace-nowrap font-medium tracking-wide">
                                             {(() => {
                                                 // 1. Direct Creator / Receiver on product record
                                                 const directUser = product.posReceivedBy || product.pos_received_by || (product as any).receivedBy || (product as any).received_by || product.createdBy || product.created_by || product.approvedBy || product.approved_by || (product as any).author || (product as any).updatedBy || (product as any).updated_by;
                                                 if (directUser && !['system admin', 'system', 'admin', 'unknown'].includes(directUser.toLowerCase())) {
                                                     const emp = employees?.find(e => e.id === directUser || e.email === directUser || e.code === directUser || e.name?.toLowerCase() === directUser.toLowerCase());
                                                     if (emp?.name) return emp.name;
                                                     if (!directUser.includes('-') && directUser.length < 30) return directUser;
                                                 }

                                                 // 2. Stock Movement History for this product/SKU
                                                 const prodMovements = movements?.filter(m => m.productId === product.id || m.productId === product.productId || (m as any).sku === product.sku);
                                                 if (prodMovements && prodMovements.length > 0) {
                                                     const inMove = prodMovements.find(m => (m.type === 'IN' || (m.reason && m.reason.toLowerCase().includes('receiv'))) && m.performedBy && !['system admin', 'system', 'admin', 'unknown'].includes(m.performedBy.toLowerCase()));
                                                     const target = inMove || prodMovements.find(m => m.performedBy && !['system admin', 'system', 'admin', 'unknown'].includes(m.performedBy.toLowerCase()));
                                                     if (target?.performedBy) {
                                                         const emp = employees?.find(e => e.id === target.performedBy || e.email === target.performedBy || e.code === target.performedBy || e.name?.toLowerCase() === target.performedBy.toLowerCase());
                                                         if (emp?.name) return emp.name;
                                                         if (!target.performedBy.includes('-')) return target.performedBy;
                                                     }
                                                 }

                                                 // 3. Purchase Order Receiving
                                                 const matchingPO = orders?.find((po: any) => po.items?.some((i: any) => i.productId === product.id || i.sku === product.sku) && (po as any).receivedBy);
                                                 if (matchingPO && (matchingPO as any).receivedBy) {
                                                     const rec = (matchingPO as any).receivedBy;
                                                     const emp = employees?.find(e => e.id === rec || e.email === rec || e.code === rec || e.name?.toLowerCase() === rec.toLowerCase());
                                                     if (emp?.name) return emp.name;
                                                     if (!rec.includes('-')) return rec;
                                                 }

                                                 // 4. Current Logged-in Operator or Explicit Fallback
                                                 if (user?.name) return user.name;
                                                 return 'HQ Operations';
                                             })()}
                                         </td>
                                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button type="button" onClick={() => { setLabelsToPrint([{ product, quantity: 1 }]); setIsPrintHubOpen(true); }} title="Print Price Tag / Barcode Label" aria-label="Print Price Tag / Barcode Label" className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#2C5E3B]/10 dark:bg-white/5 dark:hover:bg-[#2C5E3B]/20 text-[#2C4D35] dark:text-[#A9CBA2] transition-colors border border-stone-200 dark:border-white/10 cursor-pointer">
                                                    <Printer size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-stone-400 dark:text-gray-500 font-medium">
                                        {activeFilter !== 'ALL' || selectedCategory !== 'ALL_CATEGORIES' ? `No products found matching active filters` : t('posCommand.noProductsLocation')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-[#E2DCCE] dark:border-white/10 pt-4 bg-transparent mt-4">
                        <div className="text-xs text-stone-500 dark:text-gray-450 flex items-center gap-2">
                            <span>{t('common.page')} {currentPage} / {totalPages}</span><span className="opacity-50">|</span><span>{filteredProducts.length} {t('inventory.products')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} title="Previous page" aria-label="Previous page" className="px-3.5 py-1.5 bg-white/80 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-stone-500 dark:text-white text-[10px] font-bold rounded-xl border border-[#E2DCCE] dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer">{t('common.previous')}</button>
                            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} title="Next page" aria-label="Next page" className="px-3.5 py-1.5 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] dark:hover:bg-[#3a7a4d] text-white text-[10px] font-bold rounded-xl border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 cursor-pointer">{t('common.next')}</button>
                        </div>
                    </div>
                )}
            </div>

            <ProductDetailsModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
            <LabelPrintModal isOpen={isPrintHubOpen} onClose={() => setIsPrintHubOpen(false)} labels={labelsToPrint} onPrint={() => setIsPrintHubOpen(false)} />
        </Modal>
    );
};
