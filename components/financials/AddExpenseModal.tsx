import React from 'react';
import { Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import Modal from '../Modal';

export const AddExpenseModal: React.FC = () => {
    const {
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        isSubmitting,
        newExpData,
        setNewExpData,
        handleAddExpense
    } = useFinance();

    return (
        <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Log Expense">
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Description</label>
                    <input
                        aria-label="Expense Description"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                        value={newExpData.description || ''}
                        onChange={e => setNewExpData({ ...newExpData, description: e.target.value })}
                        placeholder="e.g. Office Supplies"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Amount</label>
                        <input
                            aria-label="Expense Amount"
                            type="number"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary font-mono"
                            value={newExpData.amount || ''}
                            onChange={e => setNewExpData({ ...newExpData, amount: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Date</label>
                        <input
                            aria-label="Expense Date"
                            type="date"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                            value={newExpData.date}
                            onChange={e => setNewExpData({ ...newExpData, date: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Category</label>
                        <select
                            aria-label="Expense Category"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                            value={newExpData.category}
                            onChange={e => setNewExpData({ ...newExpData, category: e.target.value as any })}
                        >
                            <option>Rent</option>
                            <option>Utilities</option>
                            <option>Marketing</option>
                            <option>Maintenance</option>
                            <option>Software</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Status</label>
                        <select
                            aria-label="Expense Status"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                            value={newExpData.status}
                            onChange={e => setNewExpData({ ...newExpData, status: e.target.value as any })}
                        >
                            <option>Paid</option>
                            <option>Pending</option>
                            <option>Overdue</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleAddExpense}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl mt-2 hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null} {isSubmitting ? 'Saving...' : 'Save Record'}
                </button>
            </div>
        </Modal>
    );
};
export default AddExpenseModal;
