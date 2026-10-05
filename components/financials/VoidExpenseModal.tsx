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
            <div className="p-6 space-y-5">
                <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full shrink-0">
                        <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#1E3F27] dark:text-white">Immutable Void Action</h3>
                        <p className="text-amber-800 dark:text-amber-200/80 text-xs mt-0.5">
                            Under SIIFMART Zero-Trust Financial Governance, hard deletion is prohibited. Voided records remain permanently in the audit trail.
                        </p>
                    </div>
                </div>

                {expenseToVoid && (
                    <div className="bg-stone-100/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500 dark:text-gray-400">Expense ID:</span>
                            <span className="font-mono text-[#1E3F27] dark:text-white">#{expenseToVoid.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500 dark:text-gray-400">Amount &amp; Category:</span>
                            <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                                {currencySymbol} {expenseToVoid.amount.toLocaleString()} ({expenseToVoid.category})
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500 dark:text-gray-400">Description:</span>
                            <span className="text-stone-700 dark:text-gray-300 italic truncate max-w-[240px]">{expenseToVoid.description}</span>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-2 block flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                        Select or Enter Mandatory Void Reason
                    </label>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {quickReasons.map(qr => (
                            <button
                                key={qr}
                                type="button"
                                onClick={() => handleSelectQuickReason(qr)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                                    selectedQuickReason === qr
                                        ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-300'
                                        : 'bg-stone-100 dark:bg-white/5 border-[#E2DCCE] dark:border-white/10 text-stone-600 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white'
                                }`}
                            >
                                {qr}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="woody-input resize-none h-20"
                        placeholder="Provide detailed justification for supervisory audit..."
                        aria-label="Void Reason"
                    />
                    <span className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 block">
                        Minimum 5 characters required. Logged with timestamp, user ID, and GPS coordinates.
                    </span>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-[#E2DCCE] dark:border-white/5">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={reason.trim().length < 5 || isSubmitting}
                        className="px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                        {isSubmitting ? 'Recording Void...' : 'Confirm Void'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default VoidExpenseModal;
