import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../../../constants';

export const RecentTransactions: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { sales } = useData();
    const { filteredSales, txPage, setTxPage, TX_PER_PAGE } = usePOSCommand();

    return (
        <div className="bg-white/85 dark:bg-[#18201B]/60 backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] overflow-hidden shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 flex justify-between items-center bg-[#FAF8F5]/60 dark:bg-black/10">
                <h3 className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">{t('posCommand.recentTransactions')}</h3>
                <button
                    onClick={() => navigate('/sales')}
                    className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white transition-colors hover:underline underline-offset-2"
                >
                    {t('posCommand.viewAllHistory')}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#F4F0E6]/80 dark:bg-white/[0.03] border-b border-[#E2DCCE]/60 dark:border-emerald-950/20">
                        <tr>
                            <th className="px-5 py-3.5 text-left text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">{t('posCommand.receiptId')}</th>
                            <th className="px-5 py-3.5 text-left text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">{t('posCommand.method')}</th>
                            <th className="px-5 py-3.5 text-right text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">{t('inventory.price')}</th>
                            <th className="px-5 py-3.5 text-center text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">{t('common.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-emerald-950/20">
                        {(() => {
                            const startIndex = (txPage - 1) * TX_PER_PAGE;
                            const paginatedTx = filteredSales.slice(startIndex, startIndex + TX_PER_PAGE);

                            return paginatedTx.map((sale) => (
                                <tr key={sale.id} className="hover:bg-[#2C5E3B]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4 text-sm font-mono font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{sale.id.substring(0, 8).toUpperCase()}</td>
                                    <td className="px-5 py-4 text-xs text-[#4D6E56] dark:text-[#7A9E83]">
                                        {sale.method === 'Cash' ? t('pos.cashSales') :
                                            sale.method === 'Card' ? t('pos.cardSales') :
                                                sale.method === 'Mobile Money' ? t('pos.mobileSales') : sale.method}
                                    </td>
                                    <td className="px-5 py-4 text-sm font-mono font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-right">{CURRENCY_SYMBOL} {sale.total.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border ${
                                            sale.status === 'Completed'
                                                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20'
                                                : 'text-amber-700 dark:text-yellow-400 bg-amber-50 dark:bg-yellow-400/10 border-amber-200 dark:border-yellow-400/20'
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
            <div className="px-5 py-4 bg-[#FAF8F5]/60 dark:bg-black/10 border-t border-[#E2DCCE]/60 dark:border-emerald-950/20 flex items-center justify-between">
                <div className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-wider select-none">
                    {t('common.page')} {txPage} {t('common.of')} {Math.max(1, Math.ceil(sales.length / TX_PER_PAGE))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="px-3.5 py-1.5 bg-white/80 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-[#2C4D35] dark:text-white text-[10px] font-bold rounded-xl border border-[#E2DCCE] dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        {t('common.previous')}
                    </button>
                    <button
                        onClick={() => setTxPage(p => Math.min(Math.ceil(sales.length / TX_PER_PAGE), p + 1))}
                        disabled={txPage >= Math.ceil(sales.length / TX_PER_PAGE)}
                        className="px-3.5 py-1.5 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] dark:hover:bg-[#3a7a4d] text-white text-[10px] font-bold rounded-xl border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {t('common.next')}
                    </button>
                </div>
            </div>
        </div>
    );
};
