import React from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { getSellUnit } from '../../../utils/units';
import { CheckCircle } from 'lucide-react';

export const PriceUpdatesModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isPriceUpdatesModalOpen,
        setIsPriceUpdatesModalOpen,
        priceUpdatedProducts,
    } = usePOS();

    const { products } = useData();

    return (
        <Modal
            isOpen={isPriceUpdatesModalOpen}
            onClose={() => setIsPriceUpdatesModalOpen(false)}
            title="Recent Price Changes (24h)"
            size="lg"
        >
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center text-sm text-stone-700 dark:text-gray-300 font-medium mb-2">
                    <span>Checking {products.length} products...</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{priceUpdatedProducts.length} changes found</span>
                </div>

                {priceUpdatedProducts.length === 0 ? (
                    <div className="text-center py-10 text-stone-600 dark:text-gray-400 font-medium">
                        <CheckCircle size={48} className="mx-auto mb-2 opacity-30 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <p>No price changes in the last 24 hours.</p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto border border-[#E2DCCE] dark:border-white/10 rounded-xl">
                        <table className="w-full text-left bg-white/50 dark:bg-black/20">
                            <thead className="bg-stone-200/70 dark:bg-white/5 text-xs uppercase text-stone-700 dark:text-gray-300 sticky top-0 backdrop-blur-md font-bold">
                                <tr>
                                    <th className="p-3">Product</th>
                                    <th className="p-3 text-center">Unit</th>
                                    <th className="p-3 text-right">Old Price</th>
                                    <th className="p-3 text-right">New Price</th>
                                    <th className="p-3 text-right">Update Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                                {priceUpdatedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-3">
                                            <div className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{p.name}</div>
                                            <div className="text-xs text-[#4D6E56] dark:text-gray-400 font-medium">{p.sku}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-[10px] font-bold text-stone-700 dark:text-gray-300 bg-stone-200/80 dark:bg-white/10 px-1.5 py-0.5 rounded uppercase">
                                                {getSellUnit(p.unit).shortLabel}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-stone-600 dark:text-gray-400 font-mono text-sm">
                                            {p.oldPrice !== undefined && p.oldPrice !== null ? `${Number(p.oldPrice).toLocaleString()} ${CURRENCY_SYMBOL}` : '-'}
                                        </td>
                                        <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">
                                            {p.price.toLocaleString()} {CURRENCY_SYMBOL}{getSellUnit(p.unit).code !== 'UNIT' ? `/${getSellUnit(p.unit).shortLabel}` : ''}
                                        </td>
                                        <td className="p-3 text-right text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold">
                                            {new Date(p.priceUpdatedAt || p.price_updated_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2DCCE] dark:border-white/10">
                    <Button
                        variant="secondary"
                        onClick={() => setIsPriceUpdatesModalOpen(false)}
                    >
                        {t('common.close')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setIsPriceUpdatesModalOpen(false);
                        }}
                    >
                        {t('pos.acknowledgeUpdates')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
