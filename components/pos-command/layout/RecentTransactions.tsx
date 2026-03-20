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
        <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-white">{t('posCommand.recentTransactions')}</h3>
                <button
                    onClick={() => navigate('/sales')}
                    className="text-xs text-cyber-primary hover:underline"
                >
                    {t('posCommand.viewAllHistory')}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('posCommand.receiptId')}</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('posCommand.method')}</th>
                            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('inventory.price')}</th>
                            <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {(() => {
                            const startIndex = (txPage - 1) * TX_PER_PAGE;
                            const paginatedTx = filteredSales.slice(startIndex, startIndex + TX_PER_PAGE);

                            return paginatedTx.map((sale) => (
                                <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm font-mono text-white">{sale.id.substring(0, 8).toUpperCase()}</td>
                                    <td className="p-4 text-xs text-gray-400">
                                        {sale.method === 'Cash' ? t('pos.cashSales') :
                                            sale.method === 'Card' ? t('pos.cardSales') :
                                                sale.method === 'Mobile Money' ? t('pos.mobileSales') : sale.method}
                                    </td>
                                    <td className="p-4 text-sm font-mono text-white text-right">{CURRENCY_SYMBOL} {sale.total.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${sale.status === 'Completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
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

            {/* Pagination Footer */}
            <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {t('common.page')} {txPage} {t('common.of')} {Math.max(1, Math.ceil(sales.length / TX_PER_PAGE))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        {t('common.previous')}
                    </button>
                    <button
                        onClick={() => setTxPage(p => Math.min(Math.ceil(sales.length / TX_PER_PAGE), p + 1))}
                        disabled={txPage >= Math.ceil(sales.length / TX_PER_PAGE)}
                        className="px-3 py-1 bg-cyber-primary hover:bg-cyber-accent text-black text-[10px] font-bold rounded border border-cyber-primary/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        {t('common.next')}
                    </button>
                </div>
            </div>
        </div >
    );
};
