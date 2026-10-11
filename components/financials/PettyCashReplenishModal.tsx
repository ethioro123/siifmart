import React, { useState } from 'react';
import { RefreshCw, Loader2, DollarSign, Building2 } from 'lucide-react';
import Modal from '../Modal';

interface PettyCashReplenishModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string) => Promise<void>;
    isSubmitting: boolean;
    currencySymbol: string;
    currentBalance: number;
    authorizedFloat: number;
}

export const PettyCashReplenishModal: React.FC<PettyCashReplenishModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    currencySymbol,
    currentBalance,
    authorizedFloat
}) => {
    const recommendedTopUp = Math.max(0, authorizedFloat - currentBalance);
    const [amount, setAmount] = useState(recommendedTopUp > 0 ? recommendedTopUp.toString() : '');

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) return;
        await onSubmit(amount);
        setAmount('');
    };

    const inputBase = "w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors placeholder:text-[var(--theme-text-secondary)]/50";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Treasury Float Replenishment"
            size="md"
        >
            <div className="p-5 space-y-4">
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                        <RefreshCw size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            Branch Imprest Top-Up Protocol
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                            Float requests are cross-verified against recorded vouchers before Treasury bank disbursement.
                        </p>
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between text-xs">
                    <div>
                        <span className="text-[var(--theme-text-secondary)] block text-[11px]">Authorized Float Target</span>
                        <span className="font-mono font-semibold text-[var(--theme-text-primary)]">
                            {currencySymbol} {authorizedFloat.toLocaleString()}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[var(--theme-text-secondary)] block text-[11px]">Current Physical Cash</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {currencySymbol} {currentBalance.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                            Top-Up Request Amount ({currencySymbol})
                        </label>
                        {recommendedTopUp > 0 && (
                            <button
                                type="button"
                                onClick={() => setAmount(recommendedTopUp.toString())}
                                className="text-[11px] text-[#0071E3] dark:text-[#2997FF] hover:underline font-mono"
                            >
                                Fill deficit ({currencySymbol} {recommendedTopUp.toLocaleString()})
                            </button>
                        )}
                    </div>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className={`${inputBase} font-mono tabular-nums`}
                        aria-label="Top-Up Amount"
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
                        disabled={isSubmitting || !amount || Number(amount) <= 0}
                        className="px-4 py-2 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                        <span>Submit Top-Up to Treasury</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PettyCashReplenishModal;
