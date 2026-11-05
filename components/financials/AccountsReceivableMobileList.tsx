import React from 'react';
import {
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Loader2
} from 'lucide-react';
import type { ArInvoice } from '../../types';

interface AccountsReceivableMobileListProps {
    invoices: ArInvoice[];
    loading: boolean;
    currencySymbol: string;
    canManageCredit: boolean;
    onSelectInvoice: (invoice: ArInvoice) => void;
}

export const AccountsReceivableMobileList: React.FC<AccountsReceivableMobileListProps> = ({
    invoices,
    loading,
    currencySymbol,
    canManageCredit,
    onSelectInvoice
}) => {
    if (loading) {
        return (
            <div className="py-16 text-center text-[var(--theme-text-secondary)]">
                <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)]" size={18} />
                <span className="text-xs">Loading Accounts Receivable invoices...</span>
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="py-12 px-4 text-center">
                <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                        <CreditCard size={22} />
                    </div>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                        No B2B receivables found
                    </p>
                    <p className="text-[11px] mt-0.5">
                        No invoices match the selected status or search term.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {invoices.map((inv) => {
                const isOverdue = inv.status === 'Overdue';
                const isPaid = inv.status === 'Paid';

                return (
                    <div
                        key={inv.id}
                        className={`rounded-2xl border p-4 bg-[var(--theme-bg-card)] shadow-xs transition-all ${
                            isOverdue
                                ? 'border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)]/20'
                                : 'border-[var(--theme-border)]'
                        }`}
                    >
                        {/* Header: Invoice # & Status */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)]">
                                    {inv.invoiceNumber}
                                </span>
                                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                    {inv.customerName}
                                </h4>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isPaid
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : isOverdue
                                        ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                        : 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
                            }`}>
                                {isPaid && <CheckCircle2 size={11} />}
                                {isOverdue && <AlertCircle size={11} />}
                                {!isPaid && !isOverdue && <Clock size={11} />}
                                <span>{inv.status.replace(/_/g, ' ')}</span>
                            </span>
                        </div>

                        {/* Terms and Dates */}
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--theme-text-secondary)]">
                            <span className="px-2 py-0.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[11px] text-[var(--theme-text-primary)] font-sans">
                                {inv.paymentTerms.replace(/_/g, ' ')}
                            </span>

                            <div className="text-[11px] text-right">
                                <div>Date: {inv.invoiceDate}</div>
                                <div className={isOverdue ? 'text-[var(--theme-status-danger-text)] font-semibold' : ''}>
                                    Due: {inv.dueDate}
                                </div>
                            </div>
                        </div>

                        {/* Financial Amounts Breakdown */}
                        <div className="mt-3 pt-3 border-t border-[var(--theme-border)] grid grid-cols-2 gap-3">
                            <div className="bg-[var(--theme-bg-subtle)] p-2.5 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block">
                                    Total Invoiced
                                </span>
                                <span className="text-sm font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                    {currencySymbol} {inv.totalAmount.toLocaleString()}
                                </span>
                            </div>

                            <div className={`p-2.5 rounded-xl border ${
                                inv.balanceDue > 0
                                    ? isOverdue
                                        ? 'bg-[var(--theme-status-danger-bg)]/40 border-[var(--theme-status-danger-border)]'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                                    : 'bg-[var(--theme-status-success-bg)]/30 border-[var(--theme-status-success-border)]'
                            }`}>
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block">
                                    Balance Due
                                </span>
                                <span className={`text-sm font-bold font-mono tabular-nums ${
                                    inv.balanceDue > 0 && isOverdue
                                        ? 'text-[var(--theme-status-danger-text)]'
                                        : 'text-[var(--theme-text-primary)]'
                                }`}>
                                    {currencySymbol} {inv.balanceDue.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Action CTA */}
                        <button
                            type="button"
                            onClick={() => onSelectInvoice(inv)}
                            className="mt-3 w-full min-h-[44px] px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-[0.99] touch-manipulation"
                        >
                            <span>
                                {canManageCredit && !isPaid ? 'Manage Credit & Settle' : 'Inspect Invoice Record'}
                            </span>
                            <ChevronRight size={14} className="text-[var(--theme-text-secondary)]" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
