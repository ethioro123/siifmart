import React from 'react';
import Modal from '../../Modal';
import { usePOSCommand } from '../POSCommandContext';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { ProductDetailsModal } from '../../inventory/ProductDetailsModal';
import { getSellUnit } from '../../../utils/units';

export const StockListModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isStockListOpen, setIsStockListOpen, stockSearch, setStockSearch
    } = usePOSCommand();

    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);

    const { products, activeSite } = useData();
    const { user } = useStore();

    const filteredProducts = products.filter(p => {
        const siteId = activeSite?.id || user?.siteId;
        const matchesSite = !siteId || p.siteId === siteId || p.site_id === siteId;
        const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(stockSearch.toLowerCase());
        return matchesSite && matchesSearch;
    });

    return (
        <Modal
            isOpen={isStockListOpen}
            onClose={() => setIsStockListOpen(false)}
            title={`${t('posCommand.stockLookupHeader')} - ${activeSite?.name || t('posCommand.currentLocation')}`}
            size="xl"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/10">
                    <input
                        type="text"
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        placeholder={t('posCommand.searchStockPlaceholder')}
                        className="flex-1 bg-transparent border-none outline-none text-white px-2 py-1 placeholder:text-gray-500"
                        autoFocus
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-gray-400 border-b border-white/10">
                            <tr>
                                <th className="text-left p-3 font-medium uppercase tracking-wider">{t('inventory.product')}</th>
                                <th className="text-left p-3 font-medium uppercase tracking-wider">{t('inventory.category')}</th>
                                <th className="text-right p-3 font-medium uppercase tracking-wider">{t('inventory.price')}</th>
                                <th className="text-right p-3 font-medium uppercase tracking-wider">{t('inventory.stock')}</th>
                                <th className="text-center p-3 font-medium uppercase tracking-wider">{t('inventory.unit')}</th>
                                <th className="text-center p-3 font-medium uppercase tracking-wider">{t('common.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProducts.map(product => {
                                const unit = getSellUnit(product.unit);
                                return (
                                    <tr
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="p-3">
                                            <p className="font-medium text-white">{product.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                                        </td>
                                        <td className="p-3 text-gray-400">
                                            {product.category || t('posCommand.uncategorized')}
                                        </td>
                                        <td className="p-3 text-right font-medium text-white">
                                            {CURRENCY_SYMBOL}{product.price.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className={`font-medium ${product.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-gray-400 uppercase text-[10px] font-bold">
                                            {unit.shortLabel}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${product.stock > 10 ? 'bg-green-500/10 text-green-500' :
                                                product.stock > 0 ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {product.stock > 10 ? t('common.active') :
                                                    product.stock > 0 ? t('common.low') :
                                                        t('common.outOfStock')}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        {t('posCommand.noProductsLocation')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductDetailsModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </Modal>
    );
};
