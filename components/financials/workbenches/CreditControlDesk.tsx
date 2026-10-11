import React, { useState } from 'react';
import {
    UserX,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Lock,
    Unlock,
    Send,
    Users,
    CheckCircle2,
    Check
} from 'lucide-react';
import { useFinance } from '../FinanceContext';

interface CreditControlDeskProps {
    currencySymbol: string;
}

export const CreditControlDesk: React.FC<CreditControlDeskProps> = ({
    currencySymbol
}) => {
    const { user, addNotification } = useFinance();
    const isManager = Boolean(user?.role && ['finance_manager', 'super_admin', 'CEO', 'ceo'].includes(user.role));

    const [holdReleaseStatus, setHoldReleaseStatus] = useState<'locked' | 'submitted' | 'unlocked'>('locked');
    const [remindersSent, setRemindersSent] = useState(false);

    const handleStaffSubmitHoldRelease = () => {
        setHoldReleaseStatus('submitted');
        addNotification?.('info', 'Credit hold release proposal submitted to Finance Manager for authorization.');
    };

    const handleManagerAuthorizeHoldRelease = () => {
        setHoldReleaseStatus('unlocked');
        addNotification?.('success', 'Credit limit exception authorized. Wholesale sales order lock lifted.');
    };

    const handleBatchReminders = () => {
        setRemindersSent(true);
        addNotification?.('info', 'Automated SMS and email debt reminders dispatched to 8 wholesale accounts.');
    };

    return (
        <div className="space-y-5 animate-in fade-in">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <UserX size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            B2B Credit Limits &amp; Collections Risk Workbench
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Monitors wholesale customer credit ceilings, payment velocity, and enforces automated orders lock on breach.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold font-mono">
                        CREDIT POLICY ENFORCED
                    </span>
                    {isManager ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
                            <ShieldAlert size={12} />
                            <span>Checker • Limit Sign-Off Authority</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 text-[11px] font-semibold">
                            <Clock size={12} />
                            <span>Maker • Collections Sentinel</span>
                        </span>
                    )}
                </div>
            </div>

            {/* 3 Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Accounts on Credit Hold
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
                        {holdReleaseStatus === 'unlocked' ? '2 Accounts' : '3 Accounts'}
                    </div>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block">
                        {holdReleaseStatus === 'unlocked'
                            ? '1 account granted temporary exception'
                            : 'Overdue > 60 days • Sales locked'}
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Near-Limit Accounts (&gt;85%)
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                        5 Accounts
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                        Credit warning dispatched
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Average Collection Days (DSO)
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        26 Days
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                        Target: &le; 30 Days (On Target)
                    </span>
                </div>
            </div>

            {/* At-Risk Accounts Sentinel Table */}
            <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Wholesale Customer Exposure Watchlist
                        </h5>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Accounts requiring immediate collections follow-up or ceiling intervention.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBatchReminders}
                            disabled={remindersSent}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                remindersSent
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
                                    : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] cursor-pointer'
                            }`}
                        >
                            {remindersSent ? <CheckCircle2 size={13} /> : <Send size={13} />}
                            {remindersSent ? 'Reminders Dispatched' : 'Batch Reminders'}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-[var(--theme-border)] text-xs">
                    {/* Account 1: Bole Express Mart - Locked / Overdue */}
                    <div className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                holdReleaseStatus === 'unlocked'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                                {holdReleaseStatus === 'unlocked' ? <Unlock size={16} /> : <Lock size={16} />}
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Bole Express Mart (B2B-1082)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Overdue by 64 days • {holdReleaseStatus === 'unlocked' ? 'Temporary supervisory waiver active' : 'Automated wholesale fulfillment lock active'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className={`font-mono tabular-nums font-bold text-sm block ${
                                    holdReleaseStatus === 'unlocked' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                    {currencySymbol} 95,000 / 80,000
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    holdReleaseStatus === 'unlocked'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                }`}>
                                    {holdReleaseStatus === 'unlocked' ? 'OVERRIDE GRANTED' : '118% LIMIT EXCEEDED'}
                                </span>
                            </div>

                            {/* Maker-Checker Action */}
                            {isManager ? (
                                holdReleaseStatus !== 'unlocked' && (
                                    <button
                                        type="button"
                                        onClick={handleManagerAuthorizeHoldRelease}
                                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                        title="Finance Manager supervisory authority to grant temporary credit release"
                                    >
                                        <Check size={13} />
                                        Authorize Hold Release (Sign-Off)
                                    </button>
                                )
                            ) : (
                                holdReleaseStatus === 'locked' ? (
                                    <button
                                        type="button"
                                        onClick={handleStaffSubmitHoldRelease}
                                        className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Clock size={13} />
                                        Submit Release Request
                                    </button>
                                ) : holdReleaseStatus === 'submitted' ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        <Clock size={12} /> Pending Manager Review
                                    </span>
                                ) : null
                            )}
                        </div>
                    </div>

                    {/* Account 2: Ethio Supermarket Hub - Near Limit */}
                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Ethio Supermarket Hub (B2B-0419)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Due in 4 days • Electronic payment statement dispatched
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 text-sm block">
                                {currencySymbol} 180,000 / 200,000
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                90% UTILIZATION
                            </span>
                        </div>
                    </div>

                    {/* Account 3: Rift Valley Grocers - In Good Standing */}
                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Users size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Rift Valley Grocers (B2B-0155)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Net-30 Terms • Prompt payment score 98/100
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-mono tabular-nums font-bold text-[var(--theme-text-primary)] text-sm block">
                                {currencySymbol} 45,000 / 50,000
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                CURRENT &bull; 90%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditControlDesk;
