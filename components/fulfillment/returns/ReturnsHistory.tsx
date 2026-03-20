import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search } from 'lucide-react';
import { formatDateTime, formatCompactNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import Pagination from '../../shared/Pagination';

interface ReturnsHistoryProps {
    sales: any[];
}

const RETURN_HISTORY_PER_PAGE = 10;

export const ReturnsHistory: React.FC<ReturnsHistoryProps> = ({ sales }) => {
    const [returnHistorySearch, setReturnHistorySearch] = useState('');
    const [returnHistoryPage, setReturnHistoryPage] = useState(1);

    const filteredRefundedSales = useMemo(() => {
        let filtered = sales.filter(s => s.status === 'Refunded' || s.status === 'Partially Refunded');

        if (returnHistorySearch) {
            const query = returnHistorySearch.toLowerCase();
            filtered = filtered.filter(s =>
                s.id.toLowerCase().includes(query) ||
                (s.customer_name && s.customer_name.toLowerCase().includes(query)) ||
                (s.customerName && s.customerName.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [sales, returnHistorySearch]);

    const returnHistoryTotalPages = Math.ceil(filteredRefundedSales.length / RETURN_HISTORY_PER_PAGE);

    const paginatedRefundedSales = useMemo(() => {
        const start = (returnHistoryPage - 1) * RETURN_HISTORY_PER_PAGE;
        return filteredRefundedSales.slice(start, start + RETURN_HISTORY_PER_PAGE);
    }, [filteredRefundedSales, returnHistoryPage]);

    return (
        <div className="flex-1 flex flex-col pt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-1">
                <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-gray-400" />
                        Returns History
                    </h4>
                    <p className="text-gray-500 text-[10px]">Recent processed returns and refunds</p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={returnHistorySearch}
                        onChange={(e) => setReturnHistorySearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                    />
                </div>
            </div>

            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-400 border-b border-white/10 uppercase font-black tracking-widest">
                                <th className="p-4">Date</th>
                                <th className="p-4">Sale ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Items</th>
                                <th className="p-4">Total Refund</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {paginatedRefundedSales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 italic">
                                        No return history found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRefundedSales.map(sale => (
                                    <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-gray-300 font-mono text-[10px]">{formatDateTime(sale.date)}</td>
                                        <td className="p-4 font-bold text-white">{sale.id}</td>
                                        <td className="p-4 text-gray-400">{sale.customerName || sale.customer_name || 'Walk-in Customer'}</td>
                                        <td className="p-4 text-gray-400">{sale.items?.length || 0} Products</td>
                                        <td className="p-4 text-blue-400 font-mono font-bold">
                                            {formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sale.status === 'Refunded' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredRefundedSales.length > 0 && (
                    <Pagination
                        currentPage={returnHistoryPage}
                        totalPages={returnHistoryTotalPages}
                        totalItems={filteredRefundedSales.length}
                        itemsPerPage={RETURN_HISTORY_PER_PAGE}
                        onPageChange={setReturnHistoryPage}
                        isLoading={false}
                        itemName="returns"
                        className="bg-black/40 border-t border-white/10"
                    />
                )}
            </div>
        </div>
    );
};
