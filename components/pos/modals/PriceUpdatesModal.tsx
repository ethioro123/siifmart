import React from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { getSellUnit } from '../../../utils/units';
import { native } from '../../../utils/native';
import { CheckCircle, CheckCheck, Plus } from 'lucide-react';
import { getEffectiveRetailPrice, getPriceUpdateTimestamp, getUnseenPriceUpdates } from '../utils/priceUpdates';

export const PriceUpdatesModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isPriceUpdatesModalOpen,
        setIsPriceUpdatesModalOpen,
        priceUpdatedProducts,
        lastSeenPriceUpdate,
        markPriceUpdatesAsRead,
        addToCart
    } = usePOS();

    const { addNotification } = useData();

    // Filter products with price changes that are unseen
    const unseenPriceChanges = getUnseenPriceUpdates(priceUpdatedProducts, lastSeenPriceUpdate || 0);

    const handleAcknowledge = () => {
        const count = unseenPriceChanges.length;
        markPriceUpdatesAsRead();
        setIsPriceUpdatesModalOpen(false);
        native.haptic();
        addNotification('success', count > 0 ? `Marked ${count} product price update${count !== 1 ? 's' : ''} as reviewed` : 'Price updates marked as reviewed');
    };

    return (
        <Modal
            isOpen={isPriceUpdatesModalOpen}
            onClose={() => setIsPriceUpdatesModalOpen(false)}
            title="Recent Product Price Changes"
            size="lg"
        >
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center text-sm text-[var(--theme-text-secondary)] font-medium mb-2">
                    <span>Changes from the last 7 days</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{priceUpdatedProducts.length} changes found</span>
                </div>

                {priceUpdatedProducts.length === 0 ? (
                    <div className="text-center py-10 text-[var(--theme-text-muted)] font-medium">
                        <CheckCircle size={44} className="mx-auto mb-2 opacity-30 text-[var(--theme-primary)]" />
                        <p className="text-xs">No price changes in the last 7 days.</p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-auto border border-[var(--theme-border)] rounded-xl">
                        <table className="w-full min-w-[680px] text-left bg-transparent">
                            <thead className="bg-[var(--theme-thead-bg)] text-xs uppercase text-[var(--theme-thead-text)] sticky top-0 font-bold border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="p-3 text-xs uppercase font-bold tracking-wider">Product</th>
                                    <th className="p-3 text-xs uppercase font-bold tracking-wider text-center">Unit</th>
                                    <th className="p-3 text-xs uppercase font-bold tracking-wider text-right">Old Price</th>
                                    <th className="p-3 text-xs uppercase font-bold tracking-wider text-right">Current POS Price</th>
                                    <th className="p-3 text-xs uppercase font-bold tracking-wider text-right">Update Time</th>
                                    <th className="p-3 text-xs uppercase font-bold tracking-wider text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {priceUpdatedProducts.map((p: any) => {
                                    const priceTime = getPriceUpdateTimestamp(p);
                                    const isUnseen = priceTime !== null && priceTime > (lastSeenPriceUpdate || 0);
                                    return (
                                        <tr key={p.id} className="hover:bg-[var(--theme-table-row-hover)] transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-[var(--theme-text-primary)] text-xs">{p.name}</div>
                                                    {isUnseen && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-400/30 uppercase">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                            New Price
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-[var(--theme-text-secondary)] font-mono font-semibold">{p.sku}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="text-xs font-bold text-[var(--theme-text-secondary)] bg-[var(--theme-pill-bg)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded uppercase">
                                                    {getSellUnit(p.unit).shortLabel}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-[var(--theme-text-muted)] font-mono text-xs">
                                                {p.oldPrice !== undefined && p.oldPrice !== null ? `${Number(p.oldPrice).toLocaleString()} ${CURRENCY_SYMBOL}` : p.old_price !== undefined && p.old_price !== null ? `${Number(p.old_price).toLocaleString()} ${CURRENCY_SYMBOL}` : '-'}
                                            </td>
                                            <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-bold font-mono text-xs">
                                                {getEffectiveRetailPrice(p).toLocaleString()} {CURRENCY_SYMBOL}{getSellUnit(p.unit).code !== 'UNIT' ? `/${getSellUnit(p.unit).shortLabel}` : ''}
                                            </td>
                                            <td className="p-3 text-right text-xs text-[var(--theme-text-secondary)] font-medium font-mono tabular-nums">
                                                {priceTime !== null ? new Date(priceTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        addToCart(p);
                                                        native.haptic();
                                                        addNotification('info', `Added ${p.name} at updated price ${CURRENCY_SYMBOL} ${getEffectiveRetailPrice(p)}`);
                                                    }}
                                                    className="px-2.5 py-1 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-primary)] text-[var(--theme-text-primary)] hover:text-[var(--theme-primary-text)] border border-[var(--theme-border)] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                                    title="Add to cart at new price"
                                                >
                                                    <Plus size={12} />
                                                    <span>Add</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsPriceUpdatesModalOpen(false);
                        }}
                    >
                        {t('common.close')}
                    </Button>
                    {unseenPriceChanges.length > 0 && (
                        <Button variant="primary" onClick={handleAcknowledge}>
                            <CheckCheck size={16} />
                            Mark reviewed
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
export default PriceUpdatesModal;
