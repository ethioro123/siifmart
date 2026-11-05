import React from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import type { ChartOfAccount } from '../../types';

interface TrialBalanceRow {
    accountCode: string;
    accountName: string;
    category: string;
    debitTotal: number;
    creditTotal: number;
    netBalance: number;
}

interface GeneralLedgerMobileListProps {
    selectedView: 'trial_balance' | 'coa';
    loading: boolean;
    trialBalance: TrialBalanceRow[];
    accounts: ChartOfAccount[];
    currencySymbol: string;
}

export const GeneralLedgerMobileList: React.FC<GeneralLedgerMobileListProps> = ({
    selectedView,
    loading,
    trialBalance,
    accounts,
    currencySymbol
}) => {
    if (loading) {
        return (
            <div className="py-16 text-center text-[var(--theme-text-secondary)]">
                <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)]" size={18} />
                <span className="text-xs">Loading ledger records...</span>
            </div>
        );
    }

    if (selectedView === 'trial_balance') {
        if (trialBalance.length === 0) {
            return (
                <div className="py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-text-secondary)]">
                        <BookOpen size={22} />
                    </div>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">No trial balance records</p>
                </div>
            );
        }

        return (
            <div className="space-y-3 p-3 font-mono">
                {trialBalance.map((row) => (
                    <div
                        key={row.accountCode}
                        className="rounded-2xl border border-[var(--theme-border)] p-4 bg-[var(--theme-bg-card)] shadow-xs font-sans"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="font-mono text-xs font-bold text-[var(--theme-accent)]">
                                    {row.accountCode}
                                </span>
                                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                    {row.accountName}
                                </h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[11px] text-[var(--theme-text-secondary)]">
                                {row.category}
                            </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[var(--theme-border)] grid grid-cols-3 gap-2 text-center font-mono">
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Debit
                                </span>
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tabular-nums">
                                    {row.debitTotal > 0 ? `${currencySymbol} ${row.debitTotal.toLocaleString()}` : '-'}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Credit
                                </span>
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tabular-nums">
                                    {row.creditTotal > 0 ? `${currencySymbol} ${row.creditTotal.toLocaleString()}` : '-'}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Net
                                </span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)] tabular-nums">
                                    {currencySymbol} {row.netBalance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {accounts.map((acc) => (
                <div
                    key={acc.code}
                    className="rounded-2xl border border-[var(--theme-border)] p-4 bg-[var(--theme-bg-card)] shadow-xs"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="font-mono text-xs font-bold text-[var(--theme-accent)]">
                                {acc.code}
                            </span>
                            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                {acc.name}
                            </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                            Active
                        </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[11px] text-[var(--theme-text-secondary)]">
                            {acc.category}
                        </span>
                        <div className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                            Normal: <strong className="text-[var(--theme-text-primary)]">{acc.normalBalance}</strong>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
