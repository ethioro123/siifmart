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
            const q = countHistorySearch.toLowerCase();
            const product = products.find(p => p.id === m.productId);
            return (
                m.id.toLowerCase().includes(q) ||
                (m.reason || '').toLowerCase().includes(q) ||
                (product?.name || '').toLowerCase().includes(q) ||
                (product?.sku || '').toLowerCase().includes(q)
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle size={18} />
                        </div>
                        <h4 className="text-[var(--theme-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('warehouse.inventoryAccuracy')}</h4>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">98.5%</p>
                    <p className="text-[11px] text-green-600 dark:text-green-400 mt-1 font-medium">{t('warehouse.varianceFromLastMonth')}</p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <h4 className="text-[var(--theme-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('warehouse.netVarianceValue')}</h4>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {formatCompactNumber(movements
                             .filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment'))
                             .reduce((sum, m) => {
                                 const product = products.find(p => p.id === m.productId);
                                 const value = m.quantity * (product?.price || 0);
                                 return sum + (m.type === 'IN' ? value : -value);
                             }, 0), { currency: CURRENCY_SYMBOL })}
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 font-medium">{t('warehouse.totalAdjustmentValue')}</p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-[var(--theme-bg-subtle)] text-[var(--theme-accent)] border border-[var(--theme-border)] rounded-xl flex items-center justify-center shrink-0">
                            <RotateCcw size={18} />
                        </div>
                        <h4 className="text-[var(--theme-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('warehouse.cycleCountsYTD')}</h4>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {movements.filter(m => m.reason.includes('Cycle Count')).length}
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 font-medium">{t('warehouse.itemsCountedThisYear')}</p>
                </div>
            </div>

            {/* COUNT History Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2 uppercase tracking-wide">
                            <HistoryIcon size={18} className="text-[var(--theme-text-secondary)]" />
                            {t('warehouse.countHistory')}
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{t('warehouse.recentVarianceAdjustments')}</p>
                    </div>

                    {/* History Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={14} />
                        <input
                            type="text"
                            placeholder={t('warehouse.searchHistory')}
                            aria-label="Search count history"
                            title="Search count history"
                            value={countHistorySearch}
                            onChange={(e) => setCountHistorySearch(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 pl-9 pr-3 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/50 outline-none transition-colors min-h-[44px]"
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
                                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 hover:border-[var(--theme-accent)]/40 transition-colors shadow-sm cursor-pointer flex flex-col justify-between gap-3"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-xs font-mono tabular-nums text-[var(--theme-accent)] font-semibold break-words">
                                                {m.id.slice(0, 10)}
                                            </span>
                                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase font-semibold border ${
                                                m.type === 'IN'
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                            }`}>
                                                {m.type}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end gap-2 pt-2 border-t border-[var(--theme-border)]">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-[var(--theme-text-primary)] break-words leading-tight">
                                                    {product?.name || 'Unknown Item'}
                                                </p>
                                                <p className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)] mt-0.5">
                                                    {formatDateTime(m.date)}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                                    {m.quantity}
                                                </span>
                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-normal ml-1">
                                                    {t('warehouse.units')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-2">
                            <Pagination
                                currentPage={countHistoryPage}
                                totalPages={countHistoryTotalPages}
                                totalItems={filteredCountHistory.length}
                                itemsPerPage={COUNT_HISTORY_PER_PAGE}
                                onPageChange={setCountHistoryPage}
                                itemName="history"
                            />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 px-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm">
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium">{t('warehouse.noMatchingHistory')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountHistory;
