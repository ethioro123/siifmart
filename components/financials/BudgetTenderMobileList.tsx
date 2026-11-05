import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { TenderReconciliationRecord } from '../../types';

interface BudgetTenderMobileListProps {
    tenderRecords: TenderReconciliationRecord[];
    currencySymbol: string;
}

export const BudgetTenderMobileList: React.FC<BudgetTenderMobileListProps> = ({
    tenderRecords,
    currencySymbol
}) => {
    if (tenderRecords.length === 0) {
        return (
            <div className="py-10 px-4 text-center text-[var(--theme-text-secondary)] font-sans">
                <p className="text-xs">No gateway settlements recorded for this period.</p>
                <p className="text-[11px] mt-0.5">Click "Reconcile Gateway Tender" to log bank or wallet verification.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {tenderRecords.map((t) => {
                const isMatched = t.status === 'Reconciled' || t.status === 'Matched';

                return (
                    <div
                        key={t.id}
                        className="rounded-2xl border border-[var(--theme-border)] p-4 bg-[var(--theme-bg-card)] shadow-xs space-y-3"
                    >
                        {/* Top: Tender & Status */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                    {t.tenderType}
                                </h4>
                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] block mt-0.5">
                                    {t.reconciliationDate}
                                </span>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                isMatched
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                            }`}>
                                {isMatched ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                <span>{t.status.replace(/_/g, ' ')}</span>
                            </span>
                        </div>

                        {/* Financial Amounts Breakdown */}
                        <div className="pt-2.5 border-t border-[var(--theme-border)] grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    POS Reported
                                </span>
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tabular-nums">
                                    {currencySymbol} {t.posReportedAmount.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Statement Amount
                                </span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)] tabular-nums">
                                    {currencySymbol} {t.statementAmount.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Fees Deducted
                                </span>
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tabular-nums">
                                    {currencySymbol} {t.feeDeductions.toLocaleString()}
                                </span>
                            </div>

                            <div className={`p-2 rounded-xl border ${
                                t.variance === 0
                                    ? 'bg-[var(--theme-status-success-bg)]/20 border-[var(--theme-status-success-border)]/40'
                                    : 'bg-[var(--theme-status-danger-bg)]/20 border-[var(--theme-status-danger-border)]/40'
                            }`}>
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Variance
                                </span>
                                <span className={`text-xs font-bold tabular-nums ${
                                    t.variance === 0 ? 'text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-danger-text)]'
                                }`}>
                                    {t.variance > 0 ? '+' : ''}{currencySymbol} {t.variance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
