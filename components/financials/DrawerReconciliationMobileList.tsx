import React from 'react';
import {
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    Clock,
    UserCheck,
    ChevronRight,
    Loader2
} from 'lucide-react';
import type { DrawerReconciliationRecord } from '../../types';

interface DrawerReconciliationMobileListProps {
    shifts: DrawerReconciliationRecord[];
    loading: boolean;
    currencySymbol: string;
    canSignOff: boolean;
    onSelectShift: (shift: DrawerReconciliationRecord) => void;
}

export const DrawerReconciliationMobileList: React.FC<DrawerReconciliationMobileListProps> = ({
    shifts,
    loading,
    currencySymbol,
    canSignOff,
    onSelectShift
}) => {
    if (loading) {
        return (
            <div className="py-16 text-center text-[var(--theme-text-secondary)]">
                <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)]" size={18} />
                <span className="text-xs">Loading drawer reconciliation shifts...</span>
            </div>
        );
    }

    if (shifts.length === 0) {
        return (
            <div className="py-12 px-4 text-center">
                <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                        <ShieldCheck size={22} />
                    </div>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                        No drawer reconciliation records found
                    </p>
                    <p className="text-[11px] mt-0.5">
                        No cashier shifts match the selected filters or criteria.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {shifts.map((s) => {
                const isExcessive = Math.abs(s.variance) > 500;

                return (
                    <div
                        key={s.id}
                        className={`rounded-2xl border p-4 bg-[var(--theme-bg-card)] shadow-xs transition-all ${
                            isExcessive
                                ? 'border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)]/15'
                                : 'border-[var(--theme-border)]'
                        }`}
                    >
                        {/* Top: Shift #, Date, Status */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)]">
                                        Shift #{s.shiftNumber}
                                    </span>
                                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                        {s.siteId}
                                    </span>
                                </div>
                                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                    {s.cashierName}
                                </h4>
                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] block">
                                    {new Date(s.startTime).toLocaleDateString()}
                                </span>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                s.reconciliationStatus === 'Reconciled'
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : s.reconciliationStatus === 'Flagged'
                                        ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                        : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                            }`}>
                                {s.reconciliationStatus === 'Reconciled' && <CheckCircle2 size={11} />}
                                {s.reconciliationStatus === 'Flagged' && <AlertTriangle size={11} />}
                                {s.reconciliationStatus === 'Pending' && <Clock size={11} />}
                                <span>{s.reconciliationStatus}</span>
                            </span>
                        </div>

                        {/* Cash Breakdown */}
                        <div className="mt-3 pt-3 border-t border-[var(--theme-border)] grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block">
                                    Expected
                                </span>
                                <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                    {currencySymbol} {s.expectedCash.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block">
                                    Actual
                                </span>
                                <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                    {currencySymbol} {s.actualCash.toLocaleString()}
                                </span>
                            </div>

                            <div className={`p-2 rounded-xl border ${
                                s.variance === 0
                                    ? 'bg-[var(--theme-status-success-bg)]/30 border-[var(--theme-status-success-border)]'
                                    : isExcessive
                                        ? 'bg-[var(--theme-status-danger-bg)]/40 border-[var(--theme-status-danger-border)]'
                                        : 'bg-[var(--theme-status-warning-bg)]/30 border-[var(--theme-status-warning-border)]'
                            }`}>
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block">
                                    Variance
                                </span>
                                <span className={`text-xs font-bold font-mono tabular-nums ${
                                    s.variance === 0
                                        ? 'text-[var(--theme-status-success-text)]'
                                        : s.variance > 0
                                            ? 'text-[var(--theme-status-info-text)]'
                                            : 'text-[var(--theme-status-danger-text)]'
                                }`}>
                                    {s.variance > 0 ? '+' : ''}{currencySymbol} {s.variance.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Supervisor Attestation */}
                        <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2.5 py-1.5 rounded-xl border border-[var(--theme-border)]">
                            <span className="text-[11px]">Supervisor Sign-off:</span>
                            {s.supervisorName ? (
                                <div className="flex items-center gap-1 font-semibold text-[var(--theme-text-primary)]">
                                    <UserCheck size={12} className="text-[var(--theme-status-success-text)]" />
                                    <span>{s.supervisorName}</span>
                                </div>
                            ) : (
                                <span className="italic text-[var(--theme-text-secondary)]">Unassigned</span>
                            )}
                        </div>

                        {/* Action CTA */}
                        {canSignOff && (
                            <button
                                type="button"
                                onClick={() => onSelectShift(s)}
                                className="mt-3 w-full min-h-[44px] px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-[0.99] touch-manipulation"
                            >
                                <span>Audit Review &amp; Dual Control</span>
                                <ChevronRight size={14} className="text-[var(--theme-text-secondary)]" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
