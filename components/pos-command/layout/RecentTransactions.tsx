import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { hasPermission } from '../../../utils/permissions';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Receipt } from 'lucide-react';

export const RecentTransactions: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user } = useStore();
    const { sales } = useData();
    const { filteredSales, txPage, setTxPage, TX_PER_PAGE } = usePOSCommand();
    const canAccessSalesHistory = hasPermission(user?.role, 'ACCESS_SALES');

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs isolate">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[var(--theme-text-primary)] tracking-tight">{t('posCommand.recentTransactions')}</h3>
                </div>
                {canAccessSalesHistory && (
                    <button
                        type="button"
                        onClick={() => navigate('/sales')}
                        className="min-h-11 inline-flex items-center px-3 rounded-lg text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors hover:underline underline-offset-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                    >
                        {t('posCommand.viewAllHistory')}
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]">
                        <tr>
                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('posCommand.receiptId')}</th>
                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('posCommand.method')}</th>
                            <th className="px-5 py-3.5 text-right text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('inventory.price')}</th>
                            <th className="px-5 py-3.5 text-center text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('common.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {(() => {
                            if (filteredSales.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-xs text-[var(--theme-text-muted)] font-medium">
                                            {t('posCommand.noTransactionsFound') || 'No transactions found in this period.'}
                                        </td>
                                    </tr>
                                );
                            }

                            const startIndex = (txPage - 1) * TX_PER_PAGE;
                            const paginatedTx = filteredSales.slice(startIndex, startIndex + TX_PER_PAGE);

                            return paginatedTx.map((sale) => (
                                <tr key={sale.id} className="hover:bg-[var(--theme-bg-card-hover)] transition-colors">
                                    <td className="px-5 py-4 text-sm font-mono font-bold text-[var(--theme-text-primary)]">{sale.id.substring(0, 8).toUpperCase()}</td>
                                    <td className="px-5 py-4 text-xs text-[var(--theme-text-secondary)]">
                                        {sale.method === 'Cash' ? t('pos.cashSales') :
                                            sale.method === 'Card' ? t('pos.cardSales') :
                                                sale.method === 'Mobile Money' ? t('pos.mobileSales') : sale.method}
                                    </td>
                                    <td className="px-5 py-4 text-sm font-mono font-bold text-[var(--theme-text-primary)] text-right">{CURRENCY_SYMBOL} {sale.total.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                                            sale.status === 'Completed'
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                : sale.status === 'Pending'
                                                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                                                    : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                            {sale.status === 'Completed'
                                                ? t('common.completed')
                                                : sale.status === 'Pending'
                                                    ? t('common.pending')
                                                    : sale.status === 'Partially Refunded'
                                                        ? 'Partially refunded'
                                                        : 'Refunded'}
                                        </span>
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            <div className="px-5 py-3.5 bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)] flex items-center justify-between">
                <div className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider select-none">
                    {t('common.page')} {txPage} {t('common.of')} {Math.max(1, Math.ceil(filteredSales.length / TX_PER_PAGE))}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage <= 1}
                        aria-label="Previous transaction page"
                        className="min-h-11 px-3.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                    >
                        {t('common.previous')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTxPage(p => Math.min(Math.max(1, Math.ceil(filteredSales.length / TX_PER_PAGE)), p + 1))}
                        disabled={txPage >= Math.max(1, Math.ceil(filteredSales.length / TX_PER_PAGE))}
                        aria-label="Next transaction page"
                        className="min-h-11 px-3.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold rounded-xl border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                    >
                        {t('common.next')}
                    </button>
                </div>
            </div>
        </div>
    );
};
