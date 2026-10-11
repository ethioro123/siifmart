import React from 'react';
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Building2,
    DollarSign,
    Clock,
    FileText,
    ShieldAlert
} from 'lucide-react';
import type { ArInvoice } from '../../types';
import Modal from '../Modal';

interface ArInvoiceModalProps {
    invoice: ArInvoice | null;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol: string;
}

export const ArInvoiceModal: React.FC<ArInvoiceModalProps> = ({
    invoice,
    isOpen,
    onClose,
    currencySymbol
}) => {
    if (!invoice) return null;

    const isOverdue = invoice.status === 'Overdue';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`B2B Receivable Invoice: ${invoice.invoiceNumber}`}
            size="md"
        >
            <div className="p-5 space-y-4">
                {/* Header Summary */}
                <div className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start justify-between">
                    <div>
                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                            Customer: {invoice.customerName}
                        </span>
                        <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {currencySymbol} {invoice.totalAmount.toLocaleString()}
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 font-mono">
                            Terms: {invoice.paymentTerms.replace(/_/g, ' ')}
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        invoice.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : isOverdue
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    }`}>
                        {invoice.status === 'Paid' && <CheckCircle2 size={12} />}
                        {isOverdue && <AlertCircle size={12} />}
                        {invoice.status === 'Sent' && <Clock size={12} />}
                        <span>{invoice.status}</span>
                    </span>
                </div>

                {/* Overdue Alert Banner */}
                {isOverdue && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <div>
                            <span className="font-semibold">Credit Risk Alert:</span>
                            <span className="ml-1">
                                Invoice is past its maturity date. Collections aging rules apply.
                            </span>
                        </div>
                    </div>
                )}

                {/* Ledger Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <Calendar size={13} />
                            <span>Invoice Date</span>
                        </div>
                        <p className="font-mono tabular-nums font-medium text-[var(--theme-text-primary)]">
                            {invoice.invoiceDate}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <Clock size={13} />
                            <span>Maturity Due Date</span>
                        </div>
                        <p className={`font-mono tabular-nums font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--theme-text-primary)]'}`}>
                            {invoice.dueDate}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <CheckCircle2 size={13} />
                            <span>Amount Remitted</span>
                        </div>
                        <p className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                            {currencySymbol} {invoice.amountPaid.toLocaleString()}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <DollarSign size={13} />
                            <span>Balance Outstanding</span>
                        </div>
                        <p className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                            {currencySymbol} {invoice.balanceDue.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Sovereign Tenancy & Notes */}
                <div className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                        <span>Sovereign Tenancy</span>
                        <span className="font-mono text-[var(--theme-text-primary)] font-medium">
                            {invoice.countryCode} ({invoice.currency})
                        </span>
                    </div>
                    {invoice.siteId && (
                        <div className="flex justify-between items-center text-[var(--theme-text-secondary)] pt-1 border-t border-[var(--theme-border)]">
                            <span>Fulfillment Site</span>
                            <span className="font-mono text-[var(--theme-text-primary)]">
                                {invoice.siteId}
                            </span>
                        </div>
                    )}
                    {invoice.notes && (
                        <div className="pt-1.5 border-t border-[var(--theme-border)]">
                            <span className="text-[11px] text-[var(--theme-text-secondary)] block mb-0.5">Commercial Memo:</span>
                            <p className="text-[var(--theme-text-primary)] italic">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer action */}
                <div className="pt-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold transition-colors shadow-xs"
                    >
                        Dismiss Audit
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ArInvoiceModal;
