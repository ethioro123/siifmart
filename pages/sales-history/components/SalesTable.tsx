import React from 'react';
import {
    Receipt, ChevronRight, Banknote, CreditCard, Smartphone
} from 'lucide-react';
import { SaleRecord, Site } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';

interface SalesTableProps {
    sales: SaleRecord[];
    currencySymbol: string;
    sites: Site[];
    loading: boolean;
    onOpenSaleDetail: (sale: SaleRecord) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
    sales,
    currencySymbol,
    sites,
    loading,
    onOpenSaleDetail
}) => {
    return (
        <table className="w-full text-left">
            <thead>
                <tr className="bg-[var(--theme-thead-bg)] border-b border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-3.5 px-4">Receipt ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Store</th>
                    <th className="py-3.5 px-4">Cashier</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Items</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th aria-label="Open transaction details" className="py-3.5 px-4 w-10"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border)]">
                {sales.map((sale) => (
                    <tr
                        key={sale.id}
                        tabIndex={0}
                        aria-label={`Sale ${sale.receiptNumber || sale.id}, ${sale.status}, ${currencySymbol} ${sale.total.toLocaleString()}. Open details.`}
                        onClick={() => onOpenSaleDetail(sale)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onOpenSaleDetail(sale);
                            }
                        }}
                        className="hover:bg-[var(--theme-table-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent)] transition-colors cursor-pointer group text-[var(--theme-text-primary)]"
                    >
                        <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-[var(--theme-bg-subtle)] group-hover:bg-[var(--theme-status-info-bg)] text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-accent)] flex items-center justify-center shrink-0 transition-colors">
                                    <Receipt size={14} />
                                </div>
                                <span className="text-xs sm:text-sm font-mono tabular-nums text-[var(--theme-text-primary)] font-semibold group-hover:text-[var(--theme-accent)] transition-colors">
                                    {sale.receiptNumber || `S${sale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}
                                </span>
                            </div>
                        </td>
                        <td className="py-3.5 px-4">
                            <div className="text-xs text-[var(--theme-text-primary)] font-medium">
                                {formatDateTime(sale.date, { showTime: true }).split(', ')[0]}
                            </div>
                            <div className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                {formatDateTime(sale.date, { showTime: true }).split(', ')[1] || ''}
                            </div>
                        </td>
                        <td className="py-3.5 px-4">
                            <span className="text-xs text-[var(--theme-text-primary)] font-medium">
                                {sites.find(s => s.id === sale.siteId)?.name || 'Primary Store'}
                            </span>
                        </td>
                        <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[11px] font-semibold text-[var(--theme-text-primary)]">
                                    {sale.cashierName?.charAt(0) || 'C'}
                                </div>
                                <span className="text-xs text-[var(--theme-text-primary)] font-medium">
                                    {sale.cashierName || 'Cashier'}
                                </span>
                            </div>
                        </td>
                        <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-secondary)] font-medium">
                                {sale.method === 'Cash' ? (
                                    <Banknote size={12} className="text-[var(--theme-text-secondary)]" />
                                ) : sale.method === 'Card' ? (
                                    <CreditCard size={12} className="text-[var(--theme-text-secondary)]" />
                                ) : (
                                    <Smartphone size={12} className="text-[var(--theme-text-secondary)]" />
                                )}
                                <span>{sale.method}</span>
                            </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-[var(--theme-text-secondary)] text-right font-medium">
                            {sale.itemCount ?? sale.items.length}
                        </td>
                        <td className="py-3.5 px-4 text-sm font-mono tabular-nums text-[var(--theme-text-primary)] font-semibold text-right">
                            {currencySymbol} {sale.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                sale.status === 'Completed'
                                    ? 'text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]'
                                    : sale.status === 'Pending'
                                        ? 'text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                                        : 'text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)]'
                            }`}>
                                {sale.status}
                            </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                            <ChevronRight size={15} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] group-hover:translate-x-0.5 transition-all" />
                        </td>
                    </tr>
                ))}
                {!loading && sales.length === 0 && (
                    <tr>
                        <td colSpan={9} className="py-16 px-4">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-3">
                                    <Receipt size={22} />
                                </div>
                                <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                    No sales match this view
                                </p>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-sm">
                                    Try changing the date range, search, or filters to see other transactions.
                                </p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};
