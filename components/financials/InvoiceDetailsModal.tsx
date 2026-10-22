import React from 'react';
import {
    FileText,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Building2,
    Boxes,
    Receipt,
    Calendar,
    ArrowUpRight,
    Clock
} from 'lucide-react';
import type { VendorInvoice } from '../../types';
import Modal from '../Modal';

interface InvoiceDetailsModalProps {
    invoice: VendorInvoice | null;
    isOpen: boolean;
    onClose: () => void;
    onOpenOverride: () => void;
    canOverride: boolean;
    currencySymbol: string;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
    invoice,
    isOpen,
    onClose,
    onOpenOverride,
    canOverride,
    currencySymbol
}) => {
    if (!invoice) return null;

    const isMatched = invoice.matchStatus === 'Matched' || invoice.matchStatus === 'Manual_Override';
    const isDiscrepant = invoice.matchStatus.startsWith('Discrepancy');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`3-Way Match Verification: ${invoice.invoiceNumber}`}
            size="lg"
        >
            <div className="p-5 space-y-4">
                {/* Header Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Vendor Name</span>
                        <span className="font-semibold text-[var(--theme-text-primary)] text-xs mt-0.5 block truncate">
                            {invoice.vendorName}
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Purchase Order</span>
                        <span className="font-mono text-[var(--theme-text-primary)] text-xs mt-0.5 block">
                            {invoice.poNumber || 'N/A'}
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Dock Manifest (GRN)</span>
                        <span className="font-mono text-[var(--theme-text-primary)] text-xs mt-0.5 block truncate">
                            {invoice.receivingManifestNumber || 'Pending Dock'}
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Billed Total</span>
                        <span className="font-mono font-semibold text-[var(--theme-text-primary)] text-xs mt-0.5 block tabular-nums">
                            {currencySymbol} {invoice.totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Match Discrepancy Diagnostics */}
                {invoice.matchDiscrepancyNotes && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold block mb-0.5">Discrepancy Diagnostics:</span>
                            <p className="leading-relaxed text-[var(--theme-text-secondary)]">
                                {invoice.matchDiscrepancyNotes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Line Item Match Table */}
                <div className="overflow-x-auto max-h-72 border border-[var(--theme-border)] rounded-xl bg-[var(--theme-bg-card)]">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider sticky top-0 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="p-3">SKU / Item</th>
                                <th className="p-3 text-right">PO Qty</th>
                                <th className="p-3 text-right">Dock Recv</th>
                                <th className="p-3 text-right">Invoiced</th>
                                <th className="p-3 text-right">Unit Price</th>
                                <th className="p-3 text-right">Variance %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)] font-mono">
                            {(invoice.items || []).map((item) => (
                                <tr key={item.id} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                    <td className="p-3 text-[var(--theme-text-primary)] font-sans font-medium">
                                        {item.itemName}
                                    </td>
                                    <td className="p-3 text-right text-[var(--theme-text-secondary)] tabular-nums">
                                        {item.poQuantity}
                                    </td>
                                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                                        {item.receivedQuantity}
                                    </td>
                                    <td className="p-3 text-right text-[var(--theme-text-primary)] font-semibold tabular-nums">
                                        {item.invoicedQuantity}
                                    </td>
                                    <td className="p-3 text-right text-[var(--theme-text-secondary)] tabular-nums">
                                        {currencySymbol} {item.invoicedUnitPrice.toLocaleString()}
                                    </td>
                                    <td className={`p-3 text-right font-semibold tabular-nums ${
                                        item.matchVariancePct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {item.matchVariancePct > 0 ? `+${item.matchVariancePct}%` : '0%'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center pt-2 border-t border-[var(--theme-border)]">
                    {isDiscrepant && (
                        canOverride ? (
                            <button
                                onClick={onOpenOverride}
                                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                                <ShieldAlert size={14} />
                                <span>Supervisory Override (Rule 18)</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium">
                                <Clock size={13} className="shrink-0" />
                                <span>Discrepancy Flagged — Awaiting Country Finance Director Supervisory Override</span>
                            </div>
                        )
                    )}
                    {!isDiscrepant && <div />}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceDetailsModal;
