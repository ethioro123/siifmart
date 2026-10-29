import React from 'react';
import {
    ShieldCheck,
    UserCheck,
    Download,
    Loader2,
    CheckCircle2,
    Clock
} from 'lucide-react';
import type { PayrollRun } from '../../../types';

interface PayrollSummaryCardProps {
    totalSalaries: number;
    totalBonuses: number;
    employeeCount: number;
    currencySymbol: string;
    latestRun: PayrollRun | null;
    pendingSalaryCount: number;
    isSubmitting: boolean;
    onProcessPayroll: () => void;
    onOpenSalaryQueue: () => void;
    onDownloadBankFile: () => void;
}

export const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({
    totalSalaries,
    totalBonuses,
    employeeCount,
    currencySymbol,
    latestRun,
    pendingSalaryCount,
    isSubmitting,
    onProcessPayroll,
    onOpenSalaryQueue,
    onDownloadBankFile
}) => {
    const totalPayout = totalSalaries + totalBonuses;

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 h-fit space-y-5 shadow-sm">
            <div>
                <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                    Payroll Summary
                </h3>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                    Dual-sign-off disbursement controls and summary metrics.
                </p>
            </div>

            <div className="space-y-3">
                {/* Base Salaries */}
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Base Salaries
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-1">
                        {currencySymbol} {totalSalaries.toLocaleString()}
                    </div>
                </div>

                {/* Performance Bonuses */}
                {totalBonuses > 0 && (
                    <div className="p-3.5 bg-[var(--theme-status-success-bg)] rounded-xl border border-[var(--theme-status-success-border)]">
                        <span className="text-[11px] font-medium text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] uppercase tracking-wider block">
                            Performance Bonuses
                        </span>
                        <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-1">
                            +{currencySymbol} {totalBonuses.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-[var(--theme-text-secondary)] mt-1 block">
                            Based on store performance &amp; role distribution
                        </span>
                    </div>
                )}

                {/* Total Monthly Payout */}
                <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider block">
                        Total Monthly Payout
                    </span>
                    <div className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-1">
                        {currencySymbol} {totalPayout.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1.5 block">
                        {employeeCount} Active Employees
                    </span>
                </div>
            </div>

            {/* Dual Control Card */}
            {latestRun && (
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Dual Control Status
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${
                            latestRun.status === 'disbursed'
                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                : latestRun.status === 'approved'
                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                        }`}>
                            {latestRun.status === 'disbursed'
                                ? 'Disbursed'
                                : latestRun.status === 'approved'
                                ? 'Dual Approved'
                                : latestRun.status === 'pending_finance'
                                ? 'Pending Finance'
                                : latestRun.status === 'pending_hr'
                                ? 'Pending HR'
                                : 'Pending Verification'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                        <span className={`flex items-center gap-1 ${
                            latestRun.hrApprovedBy ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold' : 'text-[var(--theme-text-secondary)]'
                        }`}>
                            {latestRun.hrApprovedBy ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {latestRun.hrApprovedBy ? 'HR Certified' : 'HR Pending'}
                        </span>
                        <span className="text-[var(--theme-border)]">|</span>
                        <span className={`flex items-center gap-1 ${
                            latestRun.financeApprovedBy ? 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold' : 'text-[var(--theme-text-secondary)]'
                        }`}>
                            {latestRun.financeApprovedBy ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {latestRun.financeApprovedBy ? 'Finance Authorized' : 'Finance Pending'}
                        </span>
                    </div>
                </div>
            )}

            {/* Primary Action Button */}
            <button
                type="button"
                onClick={onProcessPayroll}
                className="w-full py-2.5 bg-[var(--theme-accent)] hover:bg-[#0077ED] text-white font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
                <ShieldCheck size={16} /> Zero-Trust Payroll Run (HR + Finance)
            </button>

            {/* 4-Eyes Salary Approvals Queue */}
            <button
                type="button"
                onClick={onOpenSalaryQueue}
                className="w-full py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium rounded-xl text-xs uppercase tracking-wider border border-[var(--theme-border)] flex items-center justify-between px-3.5 transition-all cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <UserCheck size={15} className="text-[var(--theme-text-secondary)]" />
                    <span>Salary Approvals (4-Eyes)</span>
                </div>
                {pendingSalaryCount > 0 ? (
                    <span className="bg-[var(--theme-status-warning-bg)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                        {pendingSalaryCount} Pending
                    </span>
                ) : (
                    <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] text-[10px] font-semibold">
                        Queue Clear
                    </span>
                )}
            </button>

            {/* Download Bank File */}
            <button
                type="button"
                onClick={onDownloadBankFile}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium rounded-xl text-xs border border-[var(--theme-border)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                {isSubmitting ? 'Downloading Bank File...' : 'Download Bank File'}
            </button>
        </div>
    );
};

export default PayrollSummaryCard;
