import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, AlertTriangle, RotateCcw, History as HistoryIcon } from 'lucide-react';
import { StockMovement, Product } from '../../../types';
import { formatCompactNumber, formatDateTime } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import Pagination from '../../shared/Pagination';

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
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                            <CheckCircle size={20} />
                        </div>
                        <h4 className="text-gray-400 text-sm font-bold uppercase">Inventory Accuracy</h4>
                    </div>
                    <p className="text-3xl font-bold text-white">98.5%</p>
                    <p className="text-xs text-green-400 mt-1">↑ 1.2% from last month</p>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                        <h4 className="text-gray-400 text-sm font-bold uppercase">Net Variance Value</h4>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {formatCompactNumber(movements
                            .filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment'))
                            .reduce((sum, m) => {
                                const product = products.find(p => p.id === m.productId);
                                const value = m.quantity * (product?.price || 0);
                                return sum + (m.type === 'IN' ? value : -value);
                            }, 0), { currency: CURRENCY_SYMBOL })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total value of adjustments</p>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <RotateCcw size={20} />
                        </div>
                        <h4 className="text-gray-400 text-sm font-bold uppercase">Cycle Counts YTD</h4>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {movements.filter(m => m.reason.includes('Cycle Count')).length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Items counted this year</p>
                </div>
            </div>

            {/* COUNT History Section */}
            <div className="border-t border-white/10 mt-10 pt-8 pb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                            <HistoryIcon size={18} className="text-gray-400" />
                            Count History
                        </h4>
                        <p className="text-gray-500 text-[10px]">Recent variance and cycle count adjustments</p>
                    </div>

                    {/* History Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={countHistorySearch}
                            onChange={(e) => setCountHistorySearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
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
                                        className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-mono text-cyber-primary font-bold">{m.id.slice(0, 8)}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${m.type === 'IN' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {m.type}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{product?.name || 'Unknown Item'}</p>
                                                <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(m.date)}</p>
                                            </div>
                                            <div className="text-right text-white font-bold text-xs">
                                                {m.quantity} <span className="text-[9px] text-gray-500 font-normal">units</span>
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
                    <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                        <p className="text-gray-500 text-xs">No matching history found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
