import React, { useState, useMemo } from 'react';
import {
    Filter,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    Ban,
    CreditCard,
    Check,
    X,
    ShieldAlert,
    Crown,
    Search,
    FileText,
    ShieldCheck,
    ArrowUpRight
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { formatCompactNumber } from '../../utils/formatting';
import { ExpenseRecord } from '../../types/expense';
import { ExpenseVoucherModal } from './ExpenseVoucherModal';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [inspectingExpense, setInspectingExpense] = useState<ExpenseRecord | null>(null);

    const canApproveRole = ['head_of_finance', 'finance_head', 'finance_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_manager', 'country_managing_director', 'admin', 'super_admin', 'CEO', 'ceo'].includes(user?.role);

    // Summary metrics
    const stats = useMemo(() => {
        let totalOutlay = 0;
        let pendingCount = 0;
        let approvedOrPaidCount = 0;
        let voidedCount = 0;

        for (const exp of localExpenses) {
            if (exp.status !== 'Voided') {
                totalOutlay += Number(exp.amount) || 0;
            }
            if (exp.status === 'Pending') pendingCount++;
            if (exp.status === 'Approved' || exp.status === 'Paid') approvedOrPaidCount++;
            if (exp.status === 'Voided') voidedCount++;
        }

        return { totalOutlay, pendingCount, approvedOrPaidCount, voidedCount };
    }, [localExpenses]);

    const displayedExpenses = useMemo(() => {
        return localExpenses.filter(exp => {
            const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query ||
                (exp.description && exp.description.toLowerCase().includes(query)) ||
                (exp.category && exp.category.toLowerCase().includes(query)) ||
                (exp.createdByName && exp.createdByName.toLowerCase().includes(query)) ||
                (exp.id && exp.id.toLowerCase().includes(query));

            return matchesStatus && matchesSearch;
        });
    }, [localExpenses, statusFilter, searchQuery]);

    return (
        <div className="space-y-4">
            {/* Executive Metric Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        Active Period Outlays
                    </span>
                    <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                        {currencySymbol} {stats.totalOutlay.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Excluding soft-voided vouchers
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Pending 4-Eyes
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
                        {stats.pendingCount}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Awaiting supervisory sign-off
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Settled / Approved
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {stats.approvedOrPaidCount}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Verified disbursement ledger
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Voided Audit Trail
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] flex items-center justify-center">
                            <ShieldAlert size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                        {stats.voidedCount}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Permanent compliance trail
                    </p>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                {/* Action & Filter Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-card)]">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--theme-text-primary)]">
                                Operational Expenses Ledger
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>Zero-Trust 4-Eyes</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9 w-56">
                            <Search size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search description, staff..."
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none w-full placeholder:text-[var(--theme-text-secondary)]/60"
                                aria-label="Search expenses"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9">
                            <Filter size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none cursor-pointer pr-1"
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
                        className="bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start md:self-auto"
                    >
                        <Plus size={15} />
                        <span>Log Expense Request</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Date</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Category</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Description</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Maker (Created)</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Checker (Approved)</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
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
                                        <tr
                                            key={exp.id}
                                            className={`hover:bg-[var(--theme-bg-subtle)]/40 transition-colors group ${
                                                exp.status === 'Voided' ? 'opacity-55' : ''
                                            }`}
                                        >
                                            <td className="py-3.5 px-4 text-xs font-mono text-[var(--theme-text-secondary)] whitespace-nowrap">
                                                {exp.date}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]">
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col max-w-md">
                                                    <span className={`text-xs text-[var(--theme-text-primary)] font-medium ${
                                                        exp.status === 'Voided' ? 'line-through text-[var(--theme-text-secondary)]' : ''
                                                    }`}>
                                                        {exp.description}
                                                    </span>
                                                    {isCeoEscalated && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                                            <Crown size={12} className="text-amber-500 shrink-0" />
                                                            <span>Escalated to CEO (Threshold Exceeded)</span>
                                                        </span>
                                                    )}
                                                    {exp.voidReason && (
                                                        <span className="text-[11px] text-rose-500 dark:text-rose-400 italic mt-0.5">
                                                            Void Reason: {exp.voidReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono font-semibold text-[var(--theme-text-primary)] text-right tabular-nums whitespace-nowrap">
                                                {currencySymbol} {exp.amount.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                                    exp.status === 'Paid'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : exp.status === 'Approved'
                                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                            : exp.status === 'Pending'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                                : exp.status === 'Voided'
                                                                    ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                }`}>
                                                    {exp.status === 'Paid' && <CheckCircle2 size={11} />}
                                                    {exp.status === 'Approved' && <CheckCircle2 size={11} />}
                                                    {exp.status === 'Pending' && <Clock size={11} />}
                                                    {exp.status === 'Voided' && <Ban size={11} />}
                                                    {exp.status === 'Rejected' && <AlertCircle size={11} />}
                                                    <span>{exp.status}</span>
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-[var(--theme-text-secondary)] whitespace-nowrap">
                                                <span className="font-medium text-[var(--theme-text-primary)]">
                                                    {exp.createdByName || 'Staff Member'}
                                                </span>
                                                {isCreator && (
                                                    <span className="ml-1 text-[10px] text-[#0071E3] dark:text-[#2997FF] font-mono font-medium">
                                                        (You)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                                                {exp.approvedBy ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {exp.approvedBy}
                                                    </span>
                                                ) : (
                                                    <span className="text-[var(--theme-text-secondary)] italic">
                                                        Pending Sign-off
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Voucher Inspect Button */}
                                                    <button
                                                        onClick={() => setInspectingExpense(exp)}
                                                        className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors"
                                                        title="Inspect Voucher Audit Trail"
                                                        aria-label="Inspect Voucher"
                                                    >
                                                        <FileText size={14} />
                                                    </button>

                                                    {/* Maker-Checker Approval Actions */}
                                                    {exp.status === 'Pending' && canApproveRole && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveExpense(exp.id)}
                                                                disabled={approveDisabled}
                                                                className={`p-1.5 rounded-lg border transition-all ${
                                                                    approveDisabled
                                                                        ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/40 cursor-not-allowed'
                                                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
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
                                                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all disabled:opacity-50"
                                                                title="Reject Expense"
                                                                aria-label="Reject Expense"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Soft Void Trigger */}
                                                    {exp.status !== 'Voided' && (
                                                        <button
                                                            onClick={() => handleTriggerVoidExpense(exp)}
                                                            disabled={isSubmitting}
                                                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-[var(--theme-text-secondary)] hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
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
                                    <td colSpan={8} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                                                <CreditCard size={22} />
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                                No expense vouchers found
                                            </p>
                                            <p className="text-[11px] mt-0.5">
                                                Try adjusting the status or search filter, or log a new zero-trust entry.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/40 gap-3">
                    <div className="text-xs text-[var(--theme-text-secondary)]">
                        Showing <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{displayedExpenses.length}</span> of <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{formatCompactNumber(totalExpensesCount)}</span> records
                        {statusFilter !== 'All' && ` (filtered from ${localExpenses.length} loaded)`}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentExpensesPage(Math.max(1, currentExpensesPage - 1))}
                            disabled={currentExpensesPage === 1 || expensesLoading}
                            className="px-3 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs"
                        >
                            Previous
                        </button>
                        <span className="px-2 text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">
                            Page {currentExpensesPage}
                        </span>
                        <button
                            onClick={() => setCurrentExpensesPage(localExpenses.length === EXPENSES_PER_PAGE ? currentExpensesPage + 1 : currentExpensesPage)}
                            disabled={localExpenses.length < EXPENSES_PER_PAGE || expensesLoading}
                            className="px-3 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Inspect Voucher Modal */}
            <ExpenseVoucherModal
                expense={inspectingExpense}
                isOpen={Boolean(inspectingExpense)}
                onClose={() => setInspectingExpense(null)}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

export default ExpensesTab;
