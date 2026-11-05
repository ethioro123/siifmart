import React from 'react';
import {
    FileText,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    ChevronRight,
    Loader2
} from 'lucide-react';
import type { VendorInvoice } from '../../types';

interface AccountsPayableMobileListProps {
    invoices: VendorInvoice[];
    loading: boolean;
    currencySymbol: string;
    selectedInvoiceIds: string[];
    canCreatePaymentRun: boolean;
    toggleSelect: (invoiceId: string) => void;
    onSelectInvoice: (invoice: VendorInvoice) => void;
}

export const AccountsPayableMobileList: React.FC<AccountsPayableMobileListProps> = ({
    invoices,
    loading,
    currencySymbol,
    selectedInvoiceIds,
    canCreatePaymentRun,
    toggleSelect,
    onSelectInvoice
}) => {
    if (loading) {
        return (
            <div className="py-16 text-center text-[var(--theme-text-secondary)]">
                <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)]" size={18} />
                <span className="text-xs">Loading Accounts Payable invoices...</span>
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="py-12 px-4 text-center">
                <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                        <FileText size={22} />
                    </div>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                        No vendor invoices recorded
                    </p>
                    <p className="text-[11px] mt-0.5">
                        No invoices match the active filters or search terms.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {invoices.map((inv) => {
                const isMatched = inv.matchStatus === 'Matched' || inv.matchStatus === 'Manual_Override';
                const isDiscrepant = inv.matchStatus.startsWith('Discrepancy');
                const canSelect = canCreatePaymentRun && isMatched && inv.status !== 'Paid';
                const isSelected = selectedInvoiceIds.includes(inv.id);

                return (
                    <div
                        key={inv.id}
                        className={`rounded-2xl border transition-all p-4 bg-[var(--theme-bg-card)] shadow-xs ${
                            isSelected
                                ? 'border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]'
                                : 'border-[var(--theme-border)]'
                        }`}
                    >
                        {/* Top Row: Select / Invoice # / Status */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                {canSelect && (
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(inv.id)}
                                        aria-label={`Select invoice ${inv.invoiceNumber}`}
                                        className="h-4 w-4 rounded text-[var(--theme-accent)] focus:ring-0 cursor-pointer"
                                    />
                                )}
                                <div>
                                    <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)]">
                                        {inv.invoiceNumber}
                                    </span>
                                    <p className="text-xs font-medium text-[var(--theme-text-secondary)] mt-0.5">
                                        {inv.vendorName}
                                    </p>
                                </div>
                            </div>

                            <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full border ${
                                inv.status === 'Paid'
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                            }`}>
                                {inv.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        {/* Middle Row: Amount & 3-Way Match Pill */}
                        <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex items-end justify-between gap-2">
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block">
                                    Total Amount
                                </span>
                                <span className="text-base font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                    {currencySymbol} {inv.totalAmount.toLocaleString()}
                                </span>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                inv.matchStatus === 'Matched'
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : inv.matchStatus === 'Manual_Override'
                                        ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
                                        : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                            }`}>
                                {inv.matchStatus === 'Matched' && <CheckCircle2 size={11} />}
                                {inv.matchStatus === 'Manual_Override' && <ShieldAlert size={11} />}
                                {isDiscrepant && <AlertTriangle size={11} />}
                                <span>{inv.matchStatus.replace(/_/g, ' ')}</span>
                            </span>
                        </div>

                        {/* Refs Row */}
                        {(inv.poNumber || inv.receivingManifestNumber) && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2.5 py-1.5 rounded-xl">
                                {inv.poNumber && <span>PO: <strong className="text-[var(--theme-text-primary)]">{inv.poNumber}</strong></span>}
                                {inv.poNumber && inv.receivingManifestNumber && <span>·</span>}
                                {inv.receivingManifestNumber && <span>GRN: <strong className="text-[var(--theme-text-primary)]">{inv.receivingManifestNumber}</strong></span>}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="button"
                            onClick={() => onSelectInvoice(inv)}
                            className="mt-3 w-full min-h-[44px] px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-[0.99] touch-manipulation"
                        >
                            <span>Inspect Invoice &amp; 3-Way Diff</span>
                            <ChevronRight size={14} className="text-[var(--theme-text-secondary)]" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
