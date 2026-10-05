import React, { useState, useMemo } from 'react';
import { Filter, Plus, CheckCircle, Clock, AlertCircle, Ban, CreditCard, Check, X, ShieldAlert, Crown } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { formatCompactNumber } from '../../utils/formatting';

export const ExpensesTab: React.FC = () => {
    const {
        localExpenses,
        totalExpensesCount,
        currentExpensesPage,
        setCurrentExpensesPage,
        expensesLoading,
        setIsAddExpenseOpen,
        handleTriggerVoidExpense,
        handleApproveExpense,
        handleRejectExpense,
        isSubmitting,
        user,
        EXPENSES_PER_PAGE,
        currencySymbol
    } = useFinance();

    const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Approved' | 'Voided' | 'Rejected'>('All');

    const canApproveRole = ['finance_manager', 'super_admin', 'operations_manager', 'regional_manager', 'admin', 'CEO', 'ceo'].includes(user?.role);

    const displayedExpenses = useMemo(() => {
        if (statusFilter === 'All') return localExpenses;
        return localExpenses.filter(e => e.status === statusFilter);
    }, [localExpenses, statusFilter]);

    return (
        <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto animate-in fade-in">
            <div className="p-4 border-b border-[#E2DCCE] dark:border-white/5 flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[#1E3F27] dark:text-white">Operational Expenses Ledger</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-mono">
                        Zero-Trust 4-Eyes Hardened
                    </span>
                    <div className="flex items-center bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2.5 py-1.5">
                        <Filter size={14} className="text-stone-400 dark:text-gray-400 mr-2 shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-transparent text-xs text-[#1E3F27] dark:text-gray-200 outline-none cursor-pointer pr-1"
                            aria-label="Filter expenses by status"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending Approval</option>
                            <option value="Approved">Approved</option>
                            <option value="Paid">Paid / Settled</option>
                            <option value="Voided">Voided (Audit)</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="woody-btn-primary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                    <Plus size={16} /> Log Expense Request
                </button>
            </div>
            <table className="w-full text-left">
                <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5">
                    <tr>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Date</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Category</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Description</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Amount</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-center">Status</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Maker (Created)</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Checker (Approved)</th>
                        <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                    {displayedExpenses.length > 0 ? (
                        displayedExpenses.map(exp => {
                            const isCreator = Boolean(
                                (exp.createdById && exp.createdById === (user?.id || user?.employeeId)) ||
                                (exp.createdByName && exp.createdByName === user?.name)
                            );
                            const isCeoEscalated = Boolean(exp.escalatedToCeo);
                            const userIsCeo = ['CEO', 'ceo', 'super_admin'].includes(user?.role);
                            const blockedByEscalation = isCeoEscalated && !userIsCeo;
                            const approveDisabled = isSubmitting || isCreator || blockedByEscalation;

                            return (
                                <tr key={exp.id} className={`hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group ${exp.status === 'Voided' ? 'opacity-50' : ''}`}>
                                    <td className="p-4 text-xs text-[#1E3F27] dark:text-white whitespace-nowrap">{exp.date}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border border-[#E2DCCE] dark:border-white/10 bg-stone-100/80 dark:bg-white/5 text-stone-700 dark:text-gray-300">
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`text-sm text-stone-800 dark:text-gray-200 ${exp.status === 'Voided' ? 'line-through' : ''}`}>
                                                {exp.description}
                                            </span>
                                            {isCeoEscalated && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                                    <Crown size={12} className="text-amber-500 dark:text-amber-400" /> Escalated to CEO (Threshold Exceeded)
                                                </span>
                                            )}
                                            {exp.voidReason && (
                                                <span className="text-[10px] text-rose-600 dark:text-rose-400/90 italic mt-0.5">
                                                    Void Reason: {exp.voidReason}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-mono text-[#1E3F27] dark:text-white text-right font-bold whitespace-nowrap">
                                        {currencySymbol} {exp.amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                            exp.status === 'Paid'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : exp.status === 'Approved'
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                                    : exp.status === 'Pending'
                                                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                                        : exp.status === 'Voided'
                                                            ? 'bg-stone-100 dark:bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-500/20'
                                                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                        }`}>
                                            {exp.status === 'Paid' && <CheckCircle size={10} />}
                                            {exp.status === 'Approved' && <CheckCircle size={10} />}
                                            {exp.status === 'Pending' && <Clock size={10} />}
                                            {exp.status === 'Voided' && <Ban size={10} />}
                                            {exp.status === 'Rejected' && <AlertCircle size={10} />}
                                            {exp.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-stone-500 dark:text-gray-400">
                                        <span className="font-medium text-stone-700 dark:text-gray-300">{exp.createdByName || 'Staff Member'}</span>
                                        {isCreator && <span className="ml-1 text-[9px] text-cyan-600 dark:text-cyan-400 uppercase font-mono">(You)</span>}
                                    </td>
                                    <td className="p-4 text-xs text-stone-500 dark:text-gray-400">
                                        {exp.approvedBy ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{exp.approvedBy}</span>
                                        ) : (
                                            <span className="text-stone-400 dark:text-gray-500 italic">Pending Sign-off</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {exp.status === 'Pending' && canApproveRole && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveExpense(exp.id)}
                                                        disabled={approveDisabled}
                                                        className={`p-1.5 rounded-lg border transition-all ${
                                                            approveDisabled
                                                                ? 'bg-stone-100 dark:bg-white/5 border-[#E2DCCE] dark:border-white/5 text-stone-300 dark:text-gray-600 cursor-not-allowed'
                                                                : 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                        }`}
                                                        title={
                                                            isCreator
                                                                ? 'Maker-Checker Violation: Creator cannot approve their own expense'
                                                                : blockedByEscalation
                                                                    ? 'Escalated to CEO: Requires Executive Sign-off'
                                                                    : 'Approve Expense'
                                                        }
                                                        aria-label="Approve Expense"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectExpense(exp.id)}
                                                        disabled={isSubmitting}
                                                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition-all disabled:opacity-50"
                                                        title="Reject Expense"
                                                        aria-label="Reject Expense"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {exp.status !== 'Voided' && (
                                                <button
                                                    onClick={() => handleTriggerVoidExpense(exp)}
                                                    disabled={isSubmitting}
                                                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
                                                    title="Void Expense (Audit Reason Required)"
                                                    aria-label="Void Expense"
                                                >
                                                    <ShieldAlert size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={8} className="p-20 text-center">
                                <div className="opacity-40 flex flex-col items-center">
                                    <CreditCard size={48} className="mb-4 text-stone-400 dark:text-gray-400" />
                                    <p className="text-sm font-medium text-stone-600 dark:text-gray-300">No expense records found for this period.</p>
                                    <p className="text-xs mt-1 text-stone-400 dark:text-gray-500">Try changing the status filter or logging a new expense.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex justify-between items-center p-4 border-t border-[#E2DCCE] dark:border-white/5 bg-stone-50 dark:bg-black/20">
                <div className="text-xs text-stone-500 dark:text-gray-400">
                    Showing {displayedExpenses.length} of {formatCompactNumber(totalExpensesCount)} records
                    {statusFilter !== 'All' && ` (filtered from ${localExpenses.length} loaded)`}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentExpensesPage(Math.max(1, currentExpensesPage - 1))}
                        disabled={currentExpensesPage === 1 || expensesLoading}
                        className="px-3 py-1 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-[#1E3F27] dark:text-white transition-colors border border-[#E2DCCE] dark:border-white/10"
                    >
                        Previous
                    </button>
                    <span className="flex items-center px-2 text-xs text-stone-500 dark:text-gray-400 font-mono">
                        Page {currentExpensesPage}
                    </span>
                    <button
                        onClick={() => setCurrentExpensesPage(localExpenses.length === EXPENSES_PER_PAGE ? currentExpensesPage + 1 : currentExpensesPage)}
                        disabled={localExpenses.length < EXPENSES_PER_PAGE || expensesLoading}
                        className="px-3 py-1 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-[#1E3F27] dark:text-white transition-colors border border-[#E2DCCE] dark:border-white/10"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpensesTab;
