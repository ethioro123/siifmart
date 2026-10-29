import React, { useState } from 'react';
import { Plus, Loader2, DollarSign, ShieldCheck } from 'lucide-react';
import Modal from '../Modal';

interface PettyCashVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (voucher: {
        category: 'Local_Transit' | 'Cleaning_Supplies' | 'Emergency_Repairs' | 'Water_Tea' | 'Other';
        description: string;
        amount: string;
        paidTo: string;
        receiptAttached: boolean;
    }) => Promise<void>;
    isSubmitting: boolean;
    currencySymbol: string;
}

export const PettyCashVoucherModal: React.FC<PettyCashVoucherModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    currencySymbol
}) => {
    const [voucher, setVoucher] = useState({
        category: 'Local_Transit' as const,
        description: '',
        amount: '',
        paidTo: '',
        receiptAttached: true
    });

    const handleSubmit = async () => {
        if (!voucher.description || !voucher.amount || !voucher.paidTo) return;
        await onSubmit(voucher);
        setVoucher({
            category: 'Local_Transit',
            description: '',
            amount: '',
            paidTo: '',
            receiptAttached: true
        });
    };

    const inputBase = "w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[var(--theme-border-focus)] dark:focus:border-[var(--theme-border-focus)] transition-colors placeholder:text-[var(--theme-text-secondary)]/50";
    const labelBase = "text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Issue Petty Cash Disbursement Voucher"
            size="md"
        >
            <div className="p-5 space-y-4">
                <div className="p-3.5 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            Zero-Trust Cash Custody Rule
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                            Disbursements require verified vendor recipient name and immediate physical receipt retention.
                        </p>
                    </div>
                </div>

                <div>
                    <label className={labelBase}>Paid To (Recipient / Vendor)</label>
                    <input
                        type="text"
                        value={voucher.paidTo}
                        onChange={(e) => setVoucher({ ...voucher, paidTo: e.target.value })}
                        placeholder="e.g. TotalEnergies Fuel Station / Express Transit"
                        className={inputBase}
                        aria-label="Paid To"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelBase}>Disbursement Category</label>
                        <select
                            value={voucher.category}
                            onChange={(e) => setVoucher({ ...voucher, category: e.target.value as any })}
                            className={`${inputBase} cursor-pointer`}
                            aria-label="Disbursement Category"
                        >
                            <option value="Local_Transit">Local Transit / Dispatch</option>
                            <option value="Cleaning_Supplies">Cleaning Supplies</option>
                            <option value="Emergency_Repairs">Emergency Repairs</option>
                            <option value="Water_Tea">Water &amp; Refreshments</option>
                            <option value="Other">Other Operational</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelBase}>Amount ({currencySymbol})</label>
                        <input
                            type="number"
                            value={voucher.amount}
                            onChange={(e) => setVoucher({ ...voucher, amount: e.target.value })}
                            placeholder="0.00"
                            className={`${inputBase} font-mono tabular-nums`}
                            aria-label="Amount"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelBase}>Purpose / Operational Description</label>
                    <input
                        type="text"
                        value={voucher.description}
                        onChange={(e) => setVoucher({ ...voucher, description: e.target.value })}
                        placeholder="e.g. Fuel for dispatch tricycle emergency stock delivery"
                        className={inputBase}
                        aria-label="Description"
                    />
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !voucher.description || !voucher.amount || !voucher.paidTo}
                        className="px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                        <span>Disburse Cash Voucher</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PettyCashVoucherModal;
