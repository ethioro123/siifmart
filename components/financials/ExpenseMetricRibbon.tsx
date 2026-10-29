import React from 'react';
import { Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ExpenseMetricRibbonProps {
    stats: {
        totalOutlay: number;
        pendingCount: number;
        approvedOrPaidCount: number;
        voidedCount: number;
    };
    currencySymbol: string;
}

export const ExpenseMetricRibbon: React.FC<ExpenseMetricRibbonProps> = ({
    stats,
    currencySymbol
}) => {
    return (
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
                    <div className="w-6 h-6 rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center">
                        <Clock size={13} />
                    </div>
                </div>
                <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-mono tabular-nums mt-1">
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
                    <div className="w-6 h-6 rounded-lg bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center justify-center">
                        <CheckCircle2 size={13} />
                    </div>
                </div>
                <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono tabular-nums mt-1">
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
    );
};
