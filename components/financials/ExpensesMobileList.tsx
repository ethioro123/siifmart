import React from 'react';
import {
    CheckCircle2, Clock, AlertCircle, Ban, Check, X,
    Crown, ShieldCheck, FileText, ArrowUpRight
} from 'lucide-react';
import { ExpenseRecord } from '../../types/expense';

interface ExpensesMobileListProps {
    expenses: ExpenseRecord[];
    expensesLoading: boolean;
    currencySymbol: string;
    user: any;
    canApproveRole: boolean;
    isSubmitting: boolean;
    onInspectExpense: (exp: ExpenseRecord) => void;
    onApproveExpense: (id: string) => void;
    onRejectExpense: (id: string) => void;
    onTriggerVoidExpense: (exp: ExpenseRecord) => void;
}

export const ExpensesMobileList: React.FC<ExpensesMobileListProps> = ({
    expenses,
    expensesLoading,
    currencySymbol,
    user,
    canApproveRole,
    isSubmitting,
    onInspectExpense,
    onApproveExpense,
    onRejectExpense,
    onTriggerVoidExpense
}) => {
    if (expensesLoading) {
        return (
            <div className="p-8 text-center text-sm text-[var(--theme-text-secondary)]">
                Loading expense vouchers…
            </div>
        );
    }

    if (expenses.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-[var(--theme-text-secondary)]">
                No expense vouchers match the current filters.
            </div>
        );
    }

    return (
        <div className="divide-y divide-[var(--theme-border)]">
            {expenses.map((exp) => {
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

                const userCountry = (user?.countryCode || user?.country || 'ET').toUpperCase();
                const expCountry = (exp.countryCode || exp.country_code || 'ET').toUpperCase();
                const isCrossBorder = !userIsCeo && userCountry !== expCountry;

                const blockedByCeoEscalation = isCeoEscalated && !userIsCeo;
                const blockedByRegionalCap = isRegionalEscalated && !userIsCountryDirector;
                const approveDisabled = isSubmitting || isCreator || isCrossBorder || blockedByCeoEscalation || blockedByRegionalCap;

                const approveTooltip = isCreator
                    ? 'Maker-Checker: Creator cannot self-approve'
                    : isCrossBorder
                        ? `Country Isolation: Cannot approve cross-border`
                        : blockedByCeoEscalation
                            ? 'Requires Group CFO / CEO sign-off'
                            : blockedByRegionalCap
                                ? 'Requires Country Finance Director sign-off'
                                : 'Approve Expense';

                return (
                    <article
                        key={exp.id}
                        className={`p-4 space-y-3 ${exp.status === 'Voided' ? 'opacity-55' : ''}`}
                    >
                        {/* Header: Date, Category and Status Pill */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-[var(--theme-text-secondary)]">
                                    {exp.date}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]">
                                    {exp.category}
                                </span>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                                exp.status === 'Paid'
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : exp.status === 'Approved'
                                        ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
                                        : exp.status === 'Pending'
                                            ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                            : exp.status === 'Voided'
                                                ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                                : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                            }`}>
                                {exp.status === 'Paid' && <CheckCircle2 size={11} />}
                                {exp.status === 'Approved' && <CheckCircle2 size={11} />}
                                {exp.status === 'Pending' && <Clock size={11} />}
                                {exp.status === 'Voided' && <Ban size={11} />}
                                {exp.status === 'Rejected' && <AlertCircle size={11} />}
                                <span>{exp.status}</span>
                            </span>
                        </div>

                        {/* Description & Amount */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                                <p className={`text-xs font-medium text-[var(--theme-text-primary)] leading-relaxed ${exp.status === 'Voided' ? 'line-through text-[var(--theme-text-secondary)]' : ''}`}>
                                    {exp.description}
                                </p>
                                {isCeoEscalated ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--theme-status-warning-text)] font-medium">
                                        <Crown size={11} className="shrink-0" />
                                        <span>HQ Escalation (&gt; 20M)</span>
                                    </span>
                                ) : isRegionalEscalated ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--theme-status-info-text)] font-medium">
                                        <ShieldCheck size={11} className="shrink-0" />
                                        <span>Country Sign-Off (&gt; 2M)</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--theme-status-success-text)] font-medium">
                                        <ShieldCheck size={11} className="shrink-0" />
                                        <span>Regional Autonomous (≤ 2M)</span>
                                    </span>
                                )}
                                {exp.voidReason && (
                                    <p className="text-[10px] text-[var(--theme-status-danger-text)] italic">
                                        Void: {exp.voidReason}
                                    </p>
                                )}
                            </div>

                            <div className="text-right shrink-0">
                                <span className="text-sm font-mono font-bold text-[var(--theme-text-primary)] tabular-nums block">
                                    {currencySymbol} {exp.amount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Maker / Checker Attribution */}
                        <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)] pt-1">
                            <div>
                                <span className="text-[var(--theme-text-muted)]">Maker: </span>
                                <span className="font-medium text-[var(--theme-text-primary)]">
                                    {exp.createdByName || 'Staff'} {isCreator && '(You)'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[var(--theme-text-muted)]">Checker: </span>
                                <span className="font-medium text-[var(--theme-text-primary)]">
                                    {exp.approvedBy || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-border-subtle)] gap-2">
                            <button
                                type="button"
                                onClick={() => onInspectExpense(exp)}
                                className="min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-primary)] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] transition-colors"
                            >
                                <FileText size={13} />
                                <span>Inspect Voucher</span>
                            </button>

                            <div className="flex items-center gap-2">
                                {exp.status === 'Pending' && canApproveRole && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onApproveExpense(exp.id)}
                                            disabled={approveDisabled}
                                            className={`min-h-11 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] ${
                                                approveDisabled
                                                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/40 cursor-not-allowed'
                                                    : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                            }`}
                                            title={approveTooltip}
                                        >
                                            <Check size={14} />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onRejectExpense(exp.id)}
                                            disabled={isSubmitting}
                                            className="min-h-11 px-3 rounded-xl text-xs font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                                            title="Reject Expense"
                                        >
                                            <X size={14} />
                                            <span>Reject</span>
                                        </button>
                                    </>
                                )}

                                {exp.status !== 'Voided' && (
                                    <button
                                        type="button"
                                        onClick={() => onTriggerVoidExpense(exp)}
                                        disabled={isSubmitting}
                                        className="min-h-11 px-2.5 rounded-xl text-xs font-medium bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] flex items-center gap-1 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                                        title="Audit Void"
                                    >
                                        <Ban size={13} />
                                        <span>Void</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
};
