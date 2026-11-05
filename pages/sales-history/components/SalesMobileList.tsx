import React from 'react';
import {
    Receipt, ChevronRight, Banknote, CreditCard, Smartphone,
    Store as StoreIcon, Clock, CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import { SaleRecord, Site } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';

interface SalesMobileListProps {
    sales: SaleRecord[];
    currencySymbol: string;
    sites: Site[];
    loading: boolean;
    onOpenSaleDetail: (sale: SaleRecord) => void;
}

export const SalesMobileList: React.FC<SalesMobileListProps> = ({
    sales,
    currencySymbol,
    sites,
    loading,
    onOpenSaleDetail
}) => {
    if (!loading && sales.length === 0) {
        return (
            <div className="py-12 px-4 text-center bg-[var(--theme-bg-card)]">
                <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mx-auto mb-3">
                    <Receipt size={22} />
                </div>
                <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                    No sales match this view
                </p>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-xs mx-auto">
                    Try changing the date range, search, or filters to see other transactions.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-[var(--theme-border)] bg-[var(--theme-bg-card)]">
            {sales.map((sale) => {
                const storeName = sites.find(s => s.id === sale.siteId)?.name || 'Primary Store';
                const formattedDate = formatDateTime(sale.date, { showTime: true });
                const receiptNum = sale.receiptNumber || `S${sale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`;
                const itemsCount = sale.itemCount ?? sale.items?.length ?? 0;

                return (
                    <article
                        key={sale.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Sale ${receiptNum}, ${sale.status}, ${currencySymbol} ${sale.total.toLocaleString()}. Open details.`}
                        onClick={() => onOpenSaleDetail(sale)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onOpenSaleDetail(sale);
                            }
                        }}
                        className="p-4 space-y-3 cursor-pointer hover:bg-[var(--theme-table-row-hover)] active:bg-[var(--theme-bg-card-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent)]"
                    >
                        {/* Top: Receipt Number & Status Pill */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                                    <Receipt size={16} />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)] tracking-tight truncate block">
                                        {receiptNum}
                                    </span>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono flex items-center gap-1 mt-0.5">
                                        <Clock size={11} className="shrink-0" />
                                        {formattedDate}
                                    </span>
                                </div>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                                sale.status === 'Completed'
                                    ? 'text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]'
                                    : sale.status === 'Pending'
                                        ? 'text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                                        : 'text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)]'
                            }`}>
                                {sale.status === 'Completed' && <CheckCircle2 size={11} />}
                                {sale.status === 'Pending' && <AlertCircle size={11} />}
                                {sale.status !== 'Completed' && sale.status !== 'Pending' && <XCircle size={11} />}
                                {sale.status}
                            </span>
                        </div>

                        {/* Middle: Store and Cashier Info */}
                        <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] pt-1">
                            <span className="flex items-center gap-1.5 truncate max-w-[55%]">
                                <StoreIcon size={13} className="shrink-0 text-[var(--theme-text-muted)]" />
                                <span className="truncate font-medium">{storeName}</span>
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                                <span className="w-5 h-5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[10px] font-semibold text-[var(--theme-text-primary)]">
                                    {sale.cashierName?.charAt(0) || 'C'}
                                </span>
                                <span className="font-medium text-[var(--theme-text-primary)]">{sale.cashierName || 'Cashier'}</span>
                            </span>
                        </div>

                        {/* Bottom: Payment, Items count, and Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-border-subtle)]">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                    {sale.method === 'Cash' ? (
                                        <Banknote size={12} className="text-[var(--theme-text-secondary)]" />
                                    ) : sale.method === 'Card' ? (
                                        <CreditCard size={12} className="text-[var(--theme-text-secondary)]" />
                                    ) : (
                                        <Smartphone size={12} className="text-[var(--theme-text-secondary)]" />
                                    )}
                                    <span>{sale.method}</span>
                                </span>

                                <span className="text-[11px] font-mono text-[var(--theme-text-muted)]">
                                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                    {currencySymbol} {sale.total.toLocaleString()}
                                </span>
                                <ChevronRight size={15} className="text-[var(--theme-text-muted)] shrink-0" />
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
};
