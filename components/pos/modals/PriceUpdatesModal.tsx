import React, { useState } from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { CheckCheck, RefreshCw } from 'lucide-react';
import { native } from '../../../utils/native';

const formatMoney = (amount: number) => `${CURRENCY_SYMBOL} ${Number(amount).toLocaleString()}`;

export const PriceUpdatesModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isPriceUpdatesModalOpen,
        setIsPriceUpdatesModalOpen,
        productPriceHistory,
        unreviewedPriceUpdateCount,
        isPriceHistoryLoading,
        isLoadingMorePriceHistory,
        hasMorePriceHistory,
        priceHistoryError,
        retryPriceHistory,
        loadMorePriceHistory,
        markPriceHistoryReviewed
    } = usePOS();
    const { addNotification } = useData();
    const { user } = useStore();
    const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);

    const pendingIds = productPriceHistory.filter(entry => !entry.reviewed_by_me).map(entry => entry.id);

    const handleMarkReviewed = async () => {
        if (!user?.id || pendingIds.length === 0 || isMarkingReviewed) return;
        setIsMarkingReviewed(true);
        try {
            await markPriceHistoryReviewed(pendingIds);
            native.haptic();
            addNotification('success', `Marked ${pendingIds.length} price change${pendingIds.length === 1 ? '' : 's'} as reviewed`);
        } catch {
            addNotification('alert', 'Could not save the price review. Try again.');
        } finally {
            setIsMarkingReviewed(false);
        }
    };

    return (
        <Modal
            isOpen={isPriceUpdatesModalOpen}
            onClose={() => setIsPriceUpdatesModalOpen(false)}
            title="Product Price History"
            size="lg"
        >
            <div className="p-4 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
                    <p>Full history for this store, newest first.</p>
                    <span className="px-2.5 py-1 rounded-full bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)] text-xs font-semibold">
                        {unreviewedPriceUpdateCount} unreviewed in the last 7 days
                    </span>
                </div>

                {priceHistoryError && (
                    <div role="alert" className="p-3 rounded-xl border border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-between gap-3">
                        <span className="text-sm">{priceHistoryError}</span>
                        <button
                            type="button"
                            onClick={retryPriceHistory}
                            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            aria-label="Retry loading product price history"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                )}

                {productPriceHistory.length === 0 ? (
                    <div className="text-center py-10 text-[var(--theme-text-muted)] font-medium">
                        <CheckCheck size={40} className="mx-auto mb-2 opacity-40 text-[var(--theme-primary)]" aria-hidden="true" />
                        <p className="text-sm">{isPriceHistoryLoading ? 'Loading price history…' : 'No price changes have been recorded for this store yet.'}</p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-auto border border-[var(--theme-border)] rounded-xl">
                        <table className="w-full min-w-[760px] text-left bg-transparent">
                            <thead className="bg-[var(--theme-thead-bg)] text-xs uppercase text-[var(--theme-thead-text)] sticky top-0 font-bold border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="p-3 tracking-wider">Product</th>
                                    <th className="p-3 text-right tracking-wider">Previous POS price</th>
                                    <th className="p-3 text-right tracking-wider">New POS price</th>
                                    <th className="p-3 tracking-wider">Changed</th>
                                    <th className="p-3 tracking-wider">Changed by</th>
                                    <th className="p-3 tracking-wider">Review</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {productPriceHistory.map(entry => (
                                    <tr key={entry.id} className="hover:bg-[var(--theme-table-row-hover)]">
                                        <td className="p-3">
                                            <div className="font-bold text-[var(--theme-text-primary)] text-xs">{entry.product_name}</div>
                                            <div className="mt-0.5 text-xs text-[var(--theme-text-secondary)] font-mono">{entry.sku}</div>
                                        </td>
                                        <td className="p-3 text-right text-[var(--theme-text-secondary)] font-mono text-xs tabular-nums">
                                            {formatMoney(entry.old_effective_price)}
                                        </td>
                                        <td className="p-3 text-right text-[var(--theme-text-primary)] font-bold font-mono text-xs tabular-nums">
                                            {formatMoney(entry.new_effective_price)}
                                        </td>
                                        <td className="p-3 text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums whitespace-nowrap">
                                            {new Date(entry.changed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-3 text-xs text-[var(--theme-text-secondary)]">
                                            {entry.actor_name || 'System update'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold uppercase whitespace-nowrap ${entry.reviewed_by_me
                                                ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)]'
                                                : 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)]'}`}>
                                                {entry.reviewed_by_me ? 'Reviewed' : 'New'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--theme-border)]">
                    {hasMorePriceHistory ? (
                        <Button variant="secondary" onClick={loadMorePriceHistory} disabled={isLoadingMorePriceHistory}>
                            {isLoadingMorePriceHistory ? 'Loading…' : 'Load older changes'}
                        </Button>
                    ) : <span className="text-xs text-[var(--theme-text-muted)]">End of price history</span>}
                    <div className="flex gap-3 ml-auto">
                        <Button variant="secondary" onClick={() => setIsPriceUpdatesModalOpen(false)}>
                            {t('common.close')}
                        </Button>
                        {pendingIds.length > 0 && (
                            <Button variant="primary" onClick={handleMarkReviewed} disabled={isMarkingReviewed}>
                                <CheckCheck size={16} />
                                {isMarkingReviewed ? 'Saving…' : 'Mark this page reviewed'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PriceUpdatesModal;
