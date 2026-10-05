import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { hasPermission } from '../../../utils/permissions';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../../../constants';

export const RecentTransactions: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user } = useStore();
    const { sales } = useData();
    const { filteredSales, txPage, setTxPage, TX_PER_PAGE } = usePOSCommand();
    const canAccessSalesHistory = hasPermission(user?.role, 'ACCESS_SALES');

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)]">
                <h3 className="font-bold text-[var(--theme-text-primary)] tracking-tight">{t('posCommand.recentTransactions')}</h3>
                {canAccessSalesHistory && (
                    <button
                        type="button"
                        onClick={() => navigate('/sales')}
                        className="text-xs font-bold text-[var(--theme-text-primary)] hover:opacity-80 transition-opacity hover:underline underline-offset-2 cursor-pointer"
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
                                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border ${
                                            sale.status === 'Completed'
                                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                                : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                        }`}>
                                            {sale.status === 'Completed' ? t('common.completed') : t('common.pending')}
                                        </span>
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            <div className="px-5 py-4 bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)] flex items-center justify-between">
                <div className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider select-none">
                    {t('common.page')} {txPage} {t('common.of')} {Math.max(1, Math.ceil(filteredSales.length / TX_PER_PAGE))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-[10px] font-bold rounded-xl border border-[var(--theme-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        {t('common.previous')}
                    </button>
                    <button
                        onClick={() => setTxPage(p => Math.min(Math.ceil(filteredSales.length / TX_PER_PAGE), p + 1))}
                        disabled={txPage >= Math.ceil(filteredSales.length / TX_PER_PAGE)}
                        className="px-3.5 py-1.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-[10px] font-bold rounded-xl border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                    >
                        {t('common.next')}
                    </button>
                </div>
            </div>
        </div>
    );
};
