import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import Modal from '../Modal';

interface InvoiceOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    isActionLoading: boolean;
    invoiceNumber: string;
}

export const InvoiceOverrideModal: React.FC<InvoiceOverrideModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isActionLoading,
    invoiceNumber
}) => {
    const [overrideReason, setOverrideReason] = useState('');

    const handleConfirm = async () => {
        if (overrideReason.trim().length < 10) return;
        await onConfirm(overrideReason.trim());
        setOverrideReason('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Supervisory Override (Rule 18)"
            size="md"
        >
            <div className="p-5 space-y-4">
                <div className="p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            3-Way Discrepancy Override ({invoiceNumber})
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                            Overriding warehouse discrepancy requires supervisory co-attribution and permanent audit logging.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">
                        Mandatory Audit Justification (Minimum 10 chars)
                    </label>
                    <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl p-3 text-xs focus:outline-none border-[var(--theme-status-warning-border)] transition-colors resize-none h-24 placeholder:text-[var(--theme-text-secondary)]/50"
                        placeholder="State supplier contract clause, approved adjustment, transit loss memo, or shipment justification..."
                        aria-label="Override Justification"
                    />
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        Recorded with supervisor ID, timestamp, and device fingerprint.
                    </span>
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                        onClick={onClose}
                        disabled={isActionLoading}
                        className="px-3.5 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={overrideReason.trim().length < 10 || isActionLoading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isActionLoading && <Loader2 className="animate-spin" size={14} />}
                        <span>Confirm Supervisory Override</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceOverrideModal;
