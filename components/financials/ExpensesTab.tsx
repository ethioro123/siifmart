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
import { ExpenseMetricRibbon } from './ExpenseMetricRibbon';

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

    const canApproveRole = [
        'country_finance_director',
        'regional_finance_manager',
        'country_operations_director',
        'regional_operations_manager',
        'country_managing_director',
        'managing_director',
        'group_ceo',
        'group_cfo',
        'cfo',
        'super_admin'
    ].includes(user?.role?.toLowerCase() || '');

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
            <ExpenseMetricRibbon stats={stats} currencySymbol={currencySymbol} />

            {/* Table Container */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                {/* Action & Filter Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-card)]">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--theme-text-primary)]">
                                Operational Expenses Ledger
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>Zero-Trust 4-Eyes</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 min-h-11 w-full sm:w-56 focus-within:ring-2 focus-within:ring-[var(--theme-border-focus)]">
                            <Search size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search description, staff..."
                                className="bg-transparent text-sm text-[var(--theme-text-primary)] outline-none w-full min-w-0 placeholder:text-[var(--theme-text-secondary)]/60"
                                aria-label="Search expenses"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 min-h-11 focus-within:ring-2 focus-within:ring-[var(--theme-border-focus)]">
                            <Filter size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-transparent text-sm text-[var(--theme-text-primary)] outline-none cursor-pointer pr-1 min-h-10"
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
                        type="button"
                        className="bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white px-3.5 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-stretch sm:self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
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
                            {expensesLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-sm text-[var(--theme-text-secondary)]" aria-live="polite">
                                        Loading expense vouchers…
                                    </td>
                                </tr>
                            ) : displayedExpenses.length > 0 ? (
                                displayedExpenses.map(exp => {
                                    const isCreator = Boolean(
                                        (exp.createdById && (exp.createdById === user?.id || exp.createdById === user?.employeeId)) ||
                                        (exp.createdByName && exp.createdByName.trim().toLowerCase() === user?.name?.trim().toLowerCase())
                                    );

                                    const isCeoEscalated = Boolean(exp.escalatedToCeo) || exp.amount > 20000000;
                                    const isRegionalEscalated = exp.amount > 2000000 && !isCeoEscalated;
                                    const isRegionalAutonomous = exp.amount <= 2000000;

                                    const userRole = (user?.role || '').toLowerCase();
                                    const userIsCeo = ['group_ceo', 'group_cfo', 'cfo', 'super_admin'].includes(userRole);
                                    const userIsCountryDirector = userIsCeo || [
                                        'country_finance_director',
                                        'country_managing_director',
                                        'country_operations_director',
                                        'managing_director',
                                        'finance_manager'
                                    ].includes(userRole);

                                    // Country Isolation
                                    const userCountry = (user?.countryCode || user?.country || 'ET').toUpperCase();
                                    const expCountry = (exp.countryCode || exp.country_code || 'ET').toUpperCase();
                                    const isCrossBorder = !userIsCeo && userCountry !== expCountry;

                                    const blockedByCeoEscalation = isCeoEscalated && !userIsCeo;
                                    const blockedByRegionalCap = isRegionalEscalated && !userIsCountryDirector;
                                    const approveDisabled = isSubmitting || isCreator || isCrossBorder || blockedByCeoEscalation || blockedByRegionalCap;

                                    const approveTooltip = isCreator
                                        ? 'Maker-Checker Violation: Creator cannot approve their own expense (Zero Self-Approval)'
                                        : isCrossBorder
                                            ? `Country Isolation: Approver in ${userCountry} cannot approve expenses in ${expCountry}`
                                            : blockedByCeoEscalation
                                                ? 'Executive Escalation (> 20M): Requires Group CFO / Group CEO sign-off'
                                                : blockedByRegionalCap
                                                    ? 'Regional Cap Exceeded (> 2M): Requires Country Finance Director sign-off'
                                                    : 'Approve Expense';

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
                                                    {isCeoEscalated ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium mt-0.5">
                                                            <Crown size={12} className="text-[var(--theme-status-warning-text)] shrink-0" />
                                                            <span>Escalated to Group HQ (&gt; 20M)</span>
                                                        </span>
                                                    ) : isRegionalEscalated ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] font-medium mt-0.5">
                                                            <ShieldCheck size={12} className="text-[var(--theme-status-info-text)] shrink-0" />
                                                            <span>Country Sign-Off Required (&gt; 2M)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium mt-0.5">
                                                            <ShieldCheck size={12} className="text-[var(--theme-status-success-text)] shrink-0" />
                                                            <span>Regional Autonomous (≤ 2M)</span>
                                                        </span>
                                                    )}
                                                    {exp.voidReason && (
                                                        <span className="text-[11px] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] italic mt-0.5">
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
                                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                        : exp.status === 'Approved'
                                                            ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
                                                            : exp.status === 'Pending'
                                                                ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                                                : exp.status === 'Voided'
                                                                    ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                                                    : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
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
                                                    <span className="ml-1 text-[10px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-mono font-medium">
                                                        (You)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                                                {exp.approvedBy ? (
                                                    <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium">
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
                                                        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
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
                                                                className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] ${
                                                                    approveDisabled
                                                                        ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/40 cursor-not-allowed'
                                                                        : 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                                }`}
                                                                title={approveTooltip}
                                                                aria-label="Approve Expense"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectExpense(exp.id)}
                                                                disabled={isSubmitting}
                                                                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
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
                                                            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-secondary)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
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
                                                {statusFilter !== 'All' || searchQuery ? 'No matching expense vouchers' : 'No expense vouchers yet'}
                                            </p>
                                            <p className="text-[11px] mt-0.5">
                                                {statusFilter !== 'All' || searchQuery
                                                    ? 'Clear the search or choose another status to see more records.'
                                                    : 'Log an expense request to start the ledger.'}
                                            </p>
                                            {(statusFilter !== 'All' || searchQuery) && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
                                                    className="mt-3 min-h-11 px-3 rounded-lg border border-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
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
                        Showing <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{displayedExpenses.length}</span> on this page · <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{formatCompactNumber(totalExpensesCount)}</span> total
                        {(statusFilter !== 'All' || searchQuery) && ` · filtered from ${localExpenses.length} loaded records`}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentExpensesPage(Math.max(1, currentExpensesPage - 1))}
                            disabled={currentExpensesPage === 1 || expensesLoading}
                            aria-label="Previous expense page"
                            className="min-h-11 px-3 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                        >
                            Previous
                        </button>
                        <span className="px-2 text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">
                            Page {currentExpensesPage}
                        </span>
                        <button
                            onClick={() => setCurrentExpensesPage(localExpenses.length === EXPENSES_PER_PAGE ? currentExpensesPage + 1 : currentExpensesPage)}
                            disabled={localExpenses.length < EXPENSES_PER_PAGE || expensesLoading}
                            aria-label="Next expense page"
                            className="min-h-11 px-3 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
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
