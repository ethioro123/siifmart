import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, AlertTriangle, RotateCcw, History as HistoryIcon } from 'lucide-react';
import { StockMovement, Product } from '../../../types';
import { formatCompactNumber, formatDateTime } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import Pagination from '../../shared/Pagination';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CountHistoryProps {
    movements: StockMovement[];
    products: Product[];
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
}

const COUNT_HISTORY_PER_PAGE = 20;

export const CountHistory: React.FC<CountHistoryProps> = ({
    movements,
    products,
    setSelectedJob,
    setIsDetailsOpen
}) => {
    const { t } = useLanguage();
    const [countHistorySearch, setCountHistorySearch] = useState('');
    const [countHistoryPage, setCountHistoryPage] = useState(1);

    const filteredCountHistory = useMemo(() => {
        const countMoves = movements.filter(m => m.reason.toLowerCase().includes('count') || m.reason.toLowerCase().includes('adjustment'));
        return countMoves.filter(m => {
            if (!countHistorySearch) return true;
            const product = products.find(p => p.id === m.productId);
            return (
                m.id.toLowerCase().includes(countHistorySearch.toLowerCase()) ||
                product?.name.toLowerCase().includes(countHistorySearch.toLowerCase()) ||
                product?.sku.toLowerCase().includes(countHistorySearch.toLowerCase())
            );
        });
    }, [movements, products, countHistorySearch]);

    const countHistoryTotalPages = Math.ceil(filteredCountHistory.length / COUNT_HISTORY_PER_PAGE);
    const paginatedCountHistory = useMemo(() => {
        const start = (countHistoryPage - 1) * COUNT_HISTORY_PER_PAGE;
        return filteredCountHistory.slice(start, start + COUNT_HISTORY_PER_PAGE);
    }, [filteredCountHistory, countHistoryPage]);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <CheckCircle size={20} />
                        </div>
                        <h4 className="text-stone-500 dark:text-stone-400 text-sm font-bold uppercase">{t('warehouse.inventoryAccuracy')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">98.5%</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('warehouse.varianceFromLastMonth')}</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                        <h4 className="text-stone-500 dark:text-stone-400 text-sm font-bold uppercase">{t('warehouse.netVarianceValue')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        {formatCompactNumber(movements
                             .filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment'))
                             .reduce((sum, m) => {
                                 const product = products.find(p => p.id === m.productId);
                                 const value = m.quantity * (product?.price || 0);
                                 return sum + (m.type === 'IN' ? value : -value);
                             }, 0), { currency: CURRENCY_SYMBOL })}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('warehouse.totalAdjustmentValue')}</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <RotateCcw size={20} />
                        </div>
                        <h4 className="text-stone-500 dark:text-stone-400 text-sm font-bold uppercase">{t('warehouse.cycleCountsYTD')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        {movements.filter(m => m.reason.includes('Cycle Count')).length}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('warehouse.itemsCountedThisYear')}</p>
                </div>
            </div>

            {/* COUNT History Section */}
            <div className="border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] mt-10 pt-8 pb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 uppercase tracking-wide">
                            <HistoryIcon size={18} className="text-stone-500 dark:text-stone-400" />
                            {t('warehouse.countHistory')}
                        </h4>
                        <p className="text-stone-500 dark:text-stone-400 text-[10px]">{t('warehouse.recentVarianceAdjustments')}</p>
                    </div>

                    {/* History Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={14} />
                        <input
                            type="text"
                            placeholder={t('warehouse.searchHistory')}
                            aria-label="Search count history"
                            title="Search count history"
                            value={countHistorySearch}
                            onChange={(e) => setCountHistorySearch(e.target.value)}
                            className="woody-input pl-9 text-xs py-2"
                        />
                    </div>
                </div>

                {paginatedCountHistory.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {paginatedCountHistory.map((m: any) => {
                                const product = products.find(p => p.id === m.productId);
                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => {
                                            setSelectedJob(m);
                                            setIsDetailsOpen(true);
                                        }}
                                        className="glass-panel rounded-2xl p-3 hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 transition-all group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{m.id.slice(0, 8)}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${m.type === 'IN' ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2]' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                {m.type}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[100px]">{product?.name || 'Unknown Item'}</p>
                                                <p className="text-[9px] text-stone-400 dark:text-stone-500 mt-0.5">{formatDateTime(m.date)}</p>
                                            </div>
                                            <div className="text-right text-stone-900 dark:text-stone-100 font-bold text-xs">
                                                {m.quantity} <span className="text-[9px] text-stone-500 dark:text-stone-400 font-normal">{t('warehouse.units')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Pagination
                            currentPage={countHistoryPage}
                            totalPages={countHistoryTotalPages}
                            totalItems={filteredCountHistory.length}
                            itemsPerPage={COUNT_HISTORY_PER_PAGE}
                            onPageChange={setCountHistoryPage}
                            itemName="history"
                        />
                    </>
                ) : (
                    <div className="text-center py-10 bg-stone-50/10 dark:bg-[#1C2620]/10 rounded-2xl border border-dashed border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]">
                        <p className="text-stone-500 dark:text-stone-400 text-xs">{t('warehouse.noMatchingHistory')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
