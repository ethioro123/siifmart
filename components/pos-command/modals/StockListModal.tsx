import React from 'react';
import Modal from '../../Modal';
import { usePOSCommand } from '../POSCommandContext';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { ProductDetailsModal } from '../../inventory/ProductDetailsModal';
import { getSellUnit } from '../../../utils/units';

export const StockListModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isStockListOpen, setIsStockListOpen, stockSearch, setStockSearch
    } = usePOSCommand();

    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 20;

    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const { products, activeSite } = useData();
    const { user } = useStore();

    const filteredProducts = products.filter((p: any) => {
        const siteId = activeSite?.id || user?.siteId;
        const matchesSite = !siteId || p.siteId === siteId || p.site_id === siteId;
        const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(stockSearch.toLowerCase());
        return matchesSite && matchesSearch;
    });

    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [stockSearch]);

    return (
        <Modal
            isOpen={isStockListOpen}
            onClose={() => setIsStockListOpen(false)}
            title={`${t('posCommand.stockLookupHeader')} - ${activeSite?.name || t('posCommand.currentLocation')}`}
            size="xl"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2.5 rounded-xl border border-[#E2DCCE] dark:border-white/10 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] transition-colors">
                    <input
                        type="text"
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        placeholder={t('posCommand.searchStockPlaceholder')}
                        className="flex-1 bg-transparent border-none outline-none text-[#1E3F27] dark:text-white px-2 py-1 placeholder:text-stone-400 dark:placeholder:text-gray-500"
                        autoFocus
                    />
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                            {paginatedProducts.map(product => {
                                const unit = getSellUnit(product.unit);
                                return (
                                    <tr
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="p-3">
                                            <p className="font-medium text-[#1E3F27] dark:text-white">{product.name}</p>
                                            <p className="text-xs text-stone-400 dark:text-gray-500 font-mono">{product.sku}</p>
                                        </td>
                                        <td className="p-3 text-stone-600 dark:text-gray-400">
                                            {product.category || t('posCommand.uncategorized')}
                                        </td>
                                        <td className="p-3 text-right font-medium text-[#1E3F27] dark:text-white">
                                            {CURRENCY_SYMBOL} {formatPriceValue(product.price)}
                                        </td>
                                        <td className="p-3 text-right">
                                            {(() => {
                                                const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                                const isOutOfStock = product.stock <= 0;
                                                const isLowStock = product.stock < threshold;
                                                
                                                let colorClass = 'text-[#2C5E3B] dark:text-[#A9CBA2]'; // Green
                                                if (isOutOfStock) {
                                                    colorClass = 'text-red-650 dark:text-red-400';
                                                } else if (isLowStock) {
                                                    colorClass = 'text-amber-600 dark:text-amber-400'; // Yellow/Amber
                                                }
                                                return (
                                                    <div className={`font-medium ${colorClass}`}>
                                                        {product.stock}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-3 text-center text-stone-500 dark:text-gray-400 uppercase text-[10px] font-bold">
                                            {unit.shortLabel}
                                        </td>
                                        <td className="p-3 text-center">
                                            {(() => {
                                                const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                                const isOutOfStock = product.stock <= 0;
                                                const isLowStock = product.stock < threshold;

                                                if (isOutOfStock) {
                                                    return (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-100 dark:border-transparent">
                                                            {t('common.outOfStock')}
                                                        </span>
                                                    );
                                                } else if (isLowStock) {
                                                    return (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-transparent">
                                                            {t('common.low')}
                                                        </span>
                                                    );
                                                } else {
                                                    return (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-emerald-50 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-100 dark:border-transparent">
                                                            {t('common.active')}
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </td>
                                        <td className="p-3 text-right text-stone-500 dark:text-gray-400 text-xs whitespace-nowrap font-mono">
                                            {(() => {
                                                const dateStr = product.posReceivedAt || product.pos_received_at || product.createdAt || product.created_at;
                                                if (!dateStr) return '—';
                                                try {
                                                    const d = new Date(dateStr);
                                                    if (isNaN(d.getTime())) return '—';
                                                    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                                } catch (e) {
                                                    return '—';
                                                }
                                            })()}
                                        </td>
                                        <td className="p-3 text-right text-stone-500 dark:text-gray-400 text-[11px] whitespace-nowrap font-medium tracking-wide">
                                            {product.posReceivedBy || product.pos_received_by || product.createdBy || product.created_by || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-stone-400 dark:text-gray-500">
                                        {t('posCommand.noProductsLocation')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-[#E2DCCE] dark:border-white/10 pt-4 bg-transparent mt-4">
                        <div className="text-xs text-stone-500 dark:text-gray-450 flex items-center gap-2">
                            <span>{t('common.page')} {currentPage} / {totalPages}</span>
                            <span className="opacity-50">|</span>
                            <span>{filteredProducts.length} {t('inventory.products')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3.5 py-1.5 bg-white/80 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-stone-500 dark:text-white text-[10px] font-bold rounded-xl border border-[#E2DCCE] dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3.5 py-1.5 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] dark:hover:bg-[#3a7a4d] text-white text-[10px] font-bold rounded-xl border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ProductDetailsModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </Modal>
    );
};
