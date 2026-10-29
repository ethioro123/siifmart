import React, { useState } from 'react';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useFinance } from './FinanceContext';
import Modal from '../Modal';

export const VoidExpenseModal: React.FC = () => {
    const {
        isVoidExpenseModalOpen = false,
        setIsVoidExpenseModalOpen,
        expenseToVoid,
        handleConfirmVoidExpense,
        isSubmitting,
        currencySymbol
    } = useFinance();

    const [reason, setReason] = useState('');
    const [selectedQuickReason, setSelectedQuickReason] = useState<string>('');

    const quickReasons = [
        'Duplicate Entry Recorded',
        'Incorrect Vendor Amount Billed',
        'Unauthorized Expense Submission',
        'Vendor Invoice Cancelled',
        'Wrong Accounting Category Assigned'
    ];

    const handleSelectQuickReason = (qr: string) => {
        setSelectedQuickReason(qr);
        setReason(qr);
    };

    const handleClose = () => {
        setReason('');
        setSelectedQuickReason('');
        if (setIsVoidExpenseModalOpen) {
            setIsVoidExpenseModalOpen(false);
        }
    };

    const handleConfirm = async () => {
        if (!reason || reason.trim().length < 5) return;
        if (handleConfirmVoidExpense) {
            await handleConfirmVoidExpense(reason.trim());
        }
        handleClose();
    };

    return (
        <Modal
            isOpen={isVoidExpenseModalOpen}
            onClose={handleClose}
            title="Zero-Trust Expense Void Audit"
            size="md"
        >
            <div className="p-5 space-y-4">
                <div className="flex items-center gap-3.5 p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl">
                    <div className="p-2.5 bg-[var(--theme-status-warning-bg)] rounded-xl shrink-0 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">Immutable Soft Void Action</h4>
                        <p className="text-[var(--theme-text-secondary)] text-xs mt-0.5 leading-relaxed">
                            Under SIIFMART Zero-Trust Financial Governance, hard deletion is prohibited. Voided records remain permanently in the audit trail.
                        </p>
                    </div>
                </div>

                {expenseToVoid && (
                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--theme-text-secondary)]">Voucher ID:</span>
                            <span className="font-mono text-[var(--theme-text-primary)] font-medium">#{expenseToVoid.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--theme-text-secondary)]">Amount &amp; Category:</span>
                            <span className="font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                                {currencySymbol} {expenseToVoid.amount.toLocaleString()} ({expenseToVoid.category})
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--theme-text-secondary)]">Description:</span>
                            <span className="text-[var(--theme-text-primary)] truncate max-w-[220px]">{expenseToVoid.description}</span>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs text-[var(--theme-text-secondary)] font-medium mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-[var(--theme-status-warning-text)]" />
                        <span>Select or Enter Mandatory Void Reason</span>
                    </label>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {quickReasons.map(qr => (
                            <button
                                key={qr}
                                type="button"
                                onClick={() => handleSelectQuickReason(qr)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                                    selectedQuickReason === qr
                                        ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {qr}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl p-3 text-xs focus:outline-none border-[var(--theme-status-warning-border)] transition-colors resize-none h-20 placeholder:text-[var(--theme-text-secondary)]/50"
                        placeholder="Provide detailed justification for supervisory audit..."
                        aria-label="Void Reason"
                    />
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        Minimum 5 characters required. Logged with timestamp, user ID, and GPS coordinates.
                    </span>
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                        onClick={handleClose}
                        className="px-3.5 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={reason.trim().length < 5 || isSubmitting}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-white dark:text-black disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                        <span>{isSubmitting ? 'Recording Void...' : 'Confirm Void'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default VoidExpenseModal;
