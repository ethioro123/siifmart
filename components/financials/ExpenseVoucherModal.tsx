import React from 'react';
import {
    Receipt,
    ShieldCheck,
    Clock,
    CheckCircle2,
    Ban,
    AlertCircle,
    UserCheck,
    Building2,
    Calendar,
    Crown
} from 'lucide-react';
import { ExpenseRecord } from '../../types/expense';
import { formatCompactNumber } from '../../utils/formatting';
import Modal from '../Modal';

interface ExpenseVoucherModalProps {
    expense: ExpenseRecord | null;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol: string;
}

export const ExpenseVoucherModal: React.FC<ExpenseVoucherModalProps> = ({
    expense,
    isOpen,
    onClose,
    currencySymbol
}) => {
    if (!expense) return null;

    const isCeoEscalated = Boolean(expense.escalatedToCeo) || expense.amount > 20000000;
    const isCountrySignoff = expense.amount > 2000000 && !isCeoEscalated;
    const isRegionalAutonomous = expense.amount <= 2000000;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Operational Expense Voucher Audit"
            size="md"
        >
            <div className="p-5 space-y-4">
                {/* Voucher Header Card */}
                <div className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start justify-between">
                    <div>
                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                            Voucher #{expense.id.slice(0, 8).toUpperCase()}
                        </span>
                        <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">
                            {currencySymbol} {expense.amount.toLocaleString()}
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                            {expense.description}
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        expense.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : expense.status === 'Approved'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : expense.status === 'Pending'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : expense.status === 'Voided'
                                        ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                        {expense.status === 'Paid' && <CheckCircle2 size={12} />}
                        {expense.status === 'Approved' && <CheckCircle2 size={12} />}
                        {expense.status === 'Pending' && <Clock size={12} />}
                        {expense.status === 'Voided' && <Ban size={12} />}
                        {expense.status === 'Rejected' && <AlertCircle size={12} />}
                        <span>{expense.status}</span>
                    </span>
                </div>

                {/* Tier & Governance Banners */}
                {isCeoEscalated && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                        <Crown size={16} className="text-amber-500 shrink-0" />
                        <div>
                            <span className="font-semibold">Group Executive Authorization Required:</span>
                            <span className="ml-1">
                                Amount exceeds country autonomous limit (20,000,000 {currencySymbol}). Requires Group CFO or Group CEO sign-off.
                            </span>
                        </div>
                    </div>
                )}

                {isCountrySignoff && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
                        <ShieldCheck size={16} className="text-blue-500 shrink-0" />
                        <div>
                            <span className="font-semibold">Country Sign-Off Required:</span>
                            <span className="ml-1">
                                Amount exceeds regional limit (2,000,000 {currencySymbol}). Requires Country Finance Director or Country Managing Director sign-off.
                            </span>
                        </div>
                    </div>
                )}

                {/* Void Audit Details */}
                {expense.status === 'Voided' && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                            <Ban size={14} />
                            <span>Zero-Trust Soft Void Record</span>
                        </div>
                        <p className="text-[var(--theme-text-secondary)]">
                            Reason: {expense.voidReason || 'No justification entered.'}
                        </p>
                        {expense.voidedByName && (
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">
                                Voided By: {expense.voidedByName} {expense.voidedAt ? `at ${new Date(expense.voidedAt).toLocaleString()}` : ''}
                            </p>
                        )}
                    </div>
                )}

                {/* Ledger Metadata Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <Calendar size={13} />
                            <span>Accounting Date</span>
                        </div>
                        <p className="font-medium text-[var(--theme-text-primary)] font-mono tabular-nums">
                            {expense.date}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <Receipt size={13} />
                            <span>Category</span>
                        </div>
                        <p className="font-medium text-[var(--theme-text-primary)]">
                            {expense.category}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <Building2 size={13} />
                            <span>Origin Site</span>
                        </div>
                        <p className="font-medium text-[var(--theme-text-primary)] font-mono">
                            {expense.siteId || 'Global HQ'}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                            <ShieldCheck size={13} />
                            <span>Payment Reference</span>
                        </div>
                        <p className="font-medium text-[var(--theme-text-primary)] font-mono truncate">
                            {expense.paymentRef || 'Electronic Ledger'}
                        </p>
                    </div>
                </div>

                {/* 4-Eyes Dual Handshake Flow */}
                <div className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-2">
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Dual Handshake Verification
                    </span>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--theme-border)]">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[var(--theme-bg-subtle)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                                <Receipt size={12} />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--theme-text-primary)]">
                                    {expense.createdByName || 'Staff Member'}
                                </p>
                                <p className="text-[10px] text-[var(--theme-text-secondary)]">Maker (Logged Entry)</p>
                            </div>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                            {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : expense.date}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--theme-border)]">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                expense.approvedBy
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-amber-500/10 text-amber-600'
                            }`}>
                                <UserCheck size={12} />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--theme-text-primary)]">
                                    {expense.approvedBy || 'Pending Supervisory Sign-off'}
                                </p>
                                <p className="text-[10px] text-[var(--theme-text-secondary)]">Checker (Verified Sign-off)</p>
                            </div>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                            {expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : 'Awaiting'}
                        </span>
                    </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold transition-colors shadow-xs"
                    >
                        Close Voucher
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ExpenseVoucherModal;
