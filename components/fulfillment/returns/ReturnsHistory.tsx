import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, UserCheck } from 'lucide-react';
import { formatDateTime, formatCompactNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import Pagination from '../../shared/Pagination';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ReturnsHistoryProps {
    sales: any[];
}

const RETURN_HISTORY_PER_PAGE = 10;

export const ReturnsHistory: React.FC<ReturnsHistoryProps> = ({ sales }) => {
    const { t } = useLanguage();
    const [returnHistorySearch, setReturnHistorySearch] = useState('');
    const [returnHistoryPage, setReturnHistoryPage] = useState(1);

    const filteredRefundedSales = useMemo(() => {
        let filtered = sales.filter(s => s.status === 'Refunded' || s.status === 'Partially Refunded');

        if (returnHistorySearch) {
            const query = returnHistorySearch.toLowerCase();
            filtered = filtered.filter(s => {
                const itemsList = s.items || s.lineItems || s.line_items || [];
                const matchesItems = itemsList.some((item: any) => 
                    (item.name || item.productName || item.product_name || '').toLowerCase().includes(query) ||
                    (item.sku || '').toLowerCase().includes(query)
                );

                return (
                    s.id.toLowerCase().includes(query) ||
                    (s.invoice_no && s.invoice_no.toLowerCase().includes(query)) ||
                    (s.invoiceNo && s.invoiceNo.toLowerCase().includes(query)) ||
                    (s.customer_name && s.customer_name.toLowerCase().includes(query)) ||
                    (s.customerName && s.customerName.toLowerCase().includes(query)) ||
                    (s.status && s.status.toLowerCase().includes(query)) ||
                    matchesItems
                );
            });
        }

        return filtered;
    }, [sales, returnHistorySearch]);

    const returnHistoryTotalPages = Math.ceil(filteredRefundedSales.length / RETURN_HISTORY_PER_PAGE);

    const paginatedRefundedSales = useMemo(() => {
        const start = (returnHistoryPage - 1) * RETURN_HISTORY_PER_PAGE;
        return filteredRefundedSales.slice(start, start + RETURN_HISTORY_PER_PAGE);
    }, [filteredRefundedSales, returnHistoryPage]);

    return (
        <div className="flex-1 flex flex-col pt-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2 uppercase tracking-wide">
                        <HistoryIcon size={18} className="text-[var(--theme-text-secondary)]" />
                        Returns History
                    </h4>
                    <p className="text-[var(--theme-text-secondary)] text-[11px]">Recent processed returns and refunds</p>
                </div>

                {/* History Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={15} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={returnHistorySearch}
                        onChange={(e) => setReturnHistorySearch(e.target.value)}
                        className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-primary transition-all touch-manipulation"
                    />
                </div>
            </div>

            <div className="bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-[var(--theme-text-secondary)] border-b border-[var(--theme-border)] uppercase font-semibold tracking-wider bg-[var(--theme-bg-subtle)]">
                                <th className="p-4">Date</th>
                                <th className="p-4">Sale ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Processed By</th>
                                <th className="p-4">Items</th>
                                <th className="p-4 text-right">Total Refund</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[var(--theme-border)]">
                            {paginatedRefundedSales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-[var(--theme-text-secondary)] italic">
                                        No return history found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRefundedSales.map(sale => {
                                    const rawUser = sale.cashier_id || sale.cashierId || sale.processed_by || sale.processedBy || sale.cashier_name || sale.cashierName;
                                    const resolved = resolveFulfillmentWorker({
                                        userId: rawUser,
                                        job: null,
                                        employees: [],
                                        sites: [],
                                        siteId: sale.site_id || sale.siteId
                                    });
                                    const processedBy = resolved.code ? `${resolved.name} (${resolved.code})` : resolved.name;
                                    return (
                                        <tr key={sale.id} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                            <td className="p-4 text-[var(--theme-text-secondary)] font-mono text-[11px] tabular-nums">{formatDateTime(sale.date)}</td>
                                            <td className="p-4 font-mono font-bold text-[var(--theme-text-primary)] text-xs">{sale.id}</td>
                                            <td className="p-4 text-[var(--theme-text-primary)] font-medium text-xs">{sale.customerName || sale.customer_name || 'Walk-in Customer'}</td>
                                            <td className="p-4 text-[var(--theme-text-secondary)] text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <UserCheck size={13} className="text-primary shrink-0" />
                                                    <span className="break-words leading-tight">{processedBy}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-[var(--theme-text-secondary)] text-xs font-mono tabular-nums">{sale.items?.length || 0} Products</td>
                                            <td className="p-4 text-right text-primary font-mono font-bold tabular-nums text-xs">
                                                {formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${sale.status === 'Refunded' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
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
                        className="bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)]"
                    />
                )}
            </div>
        </div>
    );
};
