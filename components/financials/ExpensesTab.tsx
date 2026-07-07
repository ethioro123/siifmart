import React from 'react';
import { Filter, Plus, CheckCircle, Clock, AlertCircle, Trash2, CreditCard } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';

export const ExpensesTab: React.FC = () => {
    const {
        localExpenses,
        totalExpensesCount,
        currentExpensesPage,
        setCurrentExpensesPage,
        expensesLoading,
        setIsAddExpenseOpen,
        handleDeleteExpense,
        EXPENSES_PER_PAGE
    } = useFinance();

    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-x-auto animate-in fade-in">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-white">Operational Expenses</h3>
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                        <Filter size={14} className="text-gray-400 mr-2" />
                        <span className="text-xs text-gray-400">Filter: All Categories</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyber-accent transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Log Expense
                </button>
            </div>
            <table className="w-full text-left">
                <thead className="bg-black/20 border-b border-white/5">
                    <tr>
                        <th className="p-4 text-xs text-gray-500 uppercase">Date</th>
                        <th className="p-4 text-xs text-gray-500 uppercase">Category</th>
                        <th className="p-4 text-xs text-gray-500 uppercase">Description</th>
                        <th className="p-4 text-xs text-gray-500 uppercase text-right">Amount</th>
                        <th className="p-4 text-xs text-gray-500 uppercase text-center">Status</th>
                        <th className="p-4 text-xs text-gray-500 uppercase">Approved By</th>
                        <th className="p-4 text-xs text-gray-500 uppercase"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {localExpenses.length > 0 ? (
                        localExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 text-xs text-white">{exp.date}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border border-white/10 bg-white/5 text-gray-300">
                                        {exp.category}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-300">{exp.description}</td>
                                <td className="p-4 text-sm font-mono text-white text-right font-bold">{CURRENCY_SYMBOL} {exp.amount.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        exp.status === 'Paid'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : exp.status === 'Pending'
                                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                        {exp.status === 'Paid' && <CheckCircle size={10} />}
                                        {exp.status === 'Pending' && <Clock size={10} />}
                                        {exp.status === 'Overdue' && <AlertCircle size={10} />}
                                        {exp.status}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-500">{exp.approvedBy}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-600 hover:text-red-400" aria-label="Delete Expense">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="p-20 text-center">
                                <div className="opacity-30 flex flex-col items-center">
                                    <CreditCard size={48} className="mb-4 text-gray-400" />
                                    <p className="text-sm font-medium">No expense records found for this period.</p>
                                    <p className="text-xs mt-1">Try changing the date filter or logging a new expense.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
                <div className="text-xs text-gray-400">
                    Showing {localExpenses.length} of {formatCompactNumber(totalExpensesCount)} records
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentExpensesPage(Math.max(1, currentExpensesPage - 1))}
                        disabled={currentExpensesPage === 1 || expensesLoading}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                    >
                        Previous
                    </button>
                    <span className="flex items-center px-2 text-xs text-gray-400 font-mono">
                        Page {currentExpensesPage}
                    </span>
                    <button
                        onClick={() => setCurrentExpensesPage(localExpenses.length === EXPENSES_PER_PAGE ? currentExpensesPage + 1 : currentExpensesPage)}
                        disabled={localExpenses.length < EXPENSES_PER_PAGE || expensesLoading}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ExpensesTab;
