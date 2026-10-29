import React from 'react';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useFinance } from './FinanceContext';
import Modal from '../Modal';

export const AddExpenseModal: React.FC = () => {
    const {
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        isSubmitting,
        newExpData,
        setNewExpData,
        handleAddExpense,
        currencySymbol,
        settings
    } = useFinance();

    const regionalLimit = 2000000;
    const countryLimit = settings?.expenseApprovalLimit || 20000000;
    const amountVal = Number(newExpData.amount || 0);
    const isEscalatedToCeo = amountVal > countryLimit;
    const isRegionalEscalated = amountVal > regionalLimit && !isEscalatedToCeo;

    const inputBase = "w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[var(--theme-border-focus)] dark:focus:border-[var(--theme-border-focus)] transition-colors placeholder:text-[var(--theme-text-secondary)]/50";
    const labelBase = "text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block";

    return (
        <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Log Expense Record (Zero-Trust)">
            <div className="space-y-4">
                <div className="p-3 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-xl flex items-center gap-3">
                    <ShieldCheck className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" size={18} />
                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                        Under SIIFMART 4-Eyes Governance, new entries enter as <strong className="text-[var(--theme-text-primary)] font-semibold">Pending Approval</strong>. The submitter cannot approve their own expense.
                    </p>
                </div>

                <div>
                    <label className={labelBase}>Description</label>
                    <input
                        aria-label="Expense Description"
                        className={inputBase}
                        value={newExpData.description || ''}
                        onChange={e => setNewExpData({ ...newExpData, description: e.target.value })}
                        placeholder="e.g. Adama Hub Generator Fuel & Maintenance"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelBase}>Amount ({currencySymbol})</label>
                        <input
                            aria-label="Expense Amount"
                            type="number"
                            className={`${inputBase} font-mono tabular-nums`}
                            value={newExpData.amount || ''}
                            onChange={e => setNewExpData({ ...newExpData, amount: parseFloat(e.target.value) })}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className={labelBase}>Date</label>
                        <input
                            aria-label="Expense Date"
                            type="date"
                            className={`${inputBase} font-mono`}
                            value={newExpData.date}
                            onChange={e => setNewExpData({ ...newExpData, date: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelBase}>Category</label>
                    <select
                        aria-label="Expense Category"
                        className={`${inputBase} cursor-pointer`}
                        value={newExpData.category}
                        onChange={e => setNewExpData({ ...newExpData, category: e.target.value as any })}
                    >
                        <option value="Rent">Rent</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Software">Software</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Legal_Audit">Legal & Audit</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {isEscalatedToCeo && (
                    <div className="p-3 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl flex items-center gap-2.5 text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                        <AlertCircle size={16} className="shrink-0 text-[var(--theme-status-warning-text)]" />
                        <span>
                            Amount exceeds country autonomous limit ({currencySymbol} {countryLimit.toLocaleString()}). Requires <strong className="font-semibold">Group CFO / Group CEO Executive Sign-Off</strong>.
                        </span>
                    </div>
                )}

                {isRegionalEscalated && (
                    <div className="p-3 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-xl flex items-center gap-2.5 text-xs text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]">
                        <AlertCircle size={16} className="shrink-0 text-[var(--theme-status-info-text)]" />
                        <span>
                            Amount exceeds regional autonomous limit ({currencySymbol} {regionalLimit.toLocaleString()}). Requires <strong className="font-semibold">Country Finance Director Sign-Off</strong>.
                        </span>
                    </div>
                )}

                <button
                    onClick={handleAddExpense}
                    disabled={isSubmitting || !newExpData.description || !newExpData.amount}
                    className="w-full py-2.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white font-semibold text-xs rounded-xl mt-2 flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                    {isSubmitting ? 'Submitting to HQ...' : 'Submit Expense for Approval'}
                </button>
            </div>
        </Modal>
    );
};

export default AddExpenseModal;
