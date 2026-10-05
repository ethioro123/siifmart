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

    const threshold = settings?.expenseApprovalLimit || 50000;
    const isEscalated = Number(newExpData.amount || 0) > threshold;

    return (
        <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Log Expense Record (Zero-Trust)">
            <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-center gap-3">
                    <ShieldCheck className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                    <p className="text-xs text-blue-700 dark:text-blue-200">
                        Under SIIFMART 4-Eyes Governance, new expense entries enter as <strong>Pending Approval</strong>. The submitter cannot approve their own expense.
                    </p>
                </div>

                <div>
                    <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Description</label>
                    <input
                        aria-label="Expense Description"
                        className="woody-input"
                        value={newExpData.description || ''}
                        onChange={e => setNewExpData({ ...newExpData, description: e.target.value })}
                        placeholder="e.g. Adama Hub Generator Fuel & Maintenance"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Amount ({currencySymbol})</label>
                        <input
                            aria-label="Expense Amount"
                            type="number"
                            className="woody-input font-mono"
                            value={newExpData.amount || ''}
                            onChange={e => setNewExpData({ ...newExpData, amount: parseFloat(e.target.value) })}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Date</label>
                        <input
                            aria-label="Expense Date"
                            type="date"
                            className="woody-input"
                            value={newExpData.date}
                            onChange={e => setNewExpData({ ...newExpData, date: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">Category</label>
                    <select
                        aria-label="Expense Category"
                        className="woody-input"
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

                {isEscalated && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                            Amount exceeds country threshold ({currencySymbol} {threshold.toLocaleString()}). This expense will automatically require <strong>Executive CEO Sign-Off</strong>.
                        </span>
                    </div>
                )}

                <button
                    onClick={handleAddExpense}
                    disabled={isSubmitting || !newExpData.description || !newExpData.amount}
                    className="w-full py-3 woody-btn-primary font-bold rounded-xl mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
                    {isSubmitting ? 'Submitting to HQ...' : 'Submit Expense for Approval'}
                </button>
            </div>
        </Modal>
    );
};

export default AddExpenseModal;
