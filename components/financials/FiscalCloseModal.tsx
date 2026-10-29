import React, { useState } from 'react';
import { Lock, Loader2, ShieldAlert } from 'lucide-react';
import Modal from '../Modal';

interface FiscalCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    isActionLoading: boolean;
    activePeriod: string;
}

export const FiscalCloseModal: React.FC<FiscalCloseModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isActionLoading,
    activePeriod
}) => {
    const [lockReason, setLockReason] = useState('');

    const handleConfirm = async () => {
        if (lockReason.trim().length < 5) return;
        await onConfirm(lockReason.trim());
        setLockReason('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Lock Fiscal Period: ${activePeriod}`}
            size="md"
        >
            <div className="p-5 space-y-4">
                <div className="p-3.5 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                        <Lock size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            Zero-Trust Immutability Notice
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                            Once locked, all ledger transactions within {activePeriod} are sealed. No backdated adjustments or journal mutations can be posted.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">
                        Period-Close Audit Memo &amp; Sign-off Justification
                    </label>
                    <textarea
                        value={lockReason}
                        onChange={(e) => setLockReason(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl p-3 text-xs focus:outline-none border-[var(--theme-status-danger-border)] transition-colors resize-none h-24 placeholder:text-[var(--theme-text-secondary)]/50"
                        placeholder="Enter period-close reconciliation memo, supervisory sign-off notes, or auditor reference..."
                        aria-label="Period Close Reason"
                    />
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        Minimum 5 characters required. Co-signed with supervisory credentials.
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
                        disabled={lockReason.trim().length < 5 || isActionLoading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isActionLoading && <Loader2 className="animate-spin" size={14} />}
                        <span>Confirm Period Lock</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FiscalCloseModal;
