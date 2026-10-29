import React, { useState } from 'react';
import {
    Coins,
    CheckCircle2,
    Clock,
    Download,
    RefreshCw,
    Building2,
    Smartphone,
    ShieldCheck,
    Send,
    Check,
    ArrowUpRight
} from 'lucide-react';
import { useFinance } from '../FinanceContext';

interface TreasuryDeskProps {
    currencySymbol: string;
    effectiveCountry: string;
}

export const TreasuryDesk: React.FC<TreasuryDeskProps> = ({
    currencySymbol,
    effectiveCountry
}) => {
    const { user, addNotification } = useFinance();
    const isManager = Boolean(user?.role && ['country_finance_director', 'treasury_officer', 'country_managing_director', 'group_ceo'].includes(user.role));

    const [transitStatus, setTransitStatus] = useState<'pending' | 'submitted' | 'authorized'>('pending');
    const [sweepBatchStatus, setSweepBatchStatus] = useState<'draft' | 'submitted' | 'authorized'>('draft');

    const handleStaffSubmitSweep = () => {
        setSweepBatchStatus('submitted');
        addNotification?.('info', 'Daily vault sweep package submitted to Country Finance Director for bank clearance sign-off.');
    };

    const handleStaffSubmitTransit = () => {
        setTransitStatus('submitted');
        addNotification?.('info', 'Branch vault replenishment request submitted to Country Finance Director for disbursement approval.');
    };

    const handleManagerAuthorizeSweep = () => {
        setSweepBatchStatus('authorized');
        addNotification?.('success', 'Daily vault sweep authorized and signed off for commercial clearing bank settlement.');
    };

    const handleManagerAuthorizeTransit = () => {
        setTransitStatus('authorized');
        addNotification?.('success', 'Branch vault replenishment release authorized and signed off.');
    };

    return (
        <div className="space-y-5 animate-in fade-in">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                        <Coins size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Daily Cash Sweeps &amp; Electronic Settlement Desk
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Consolidated view of branch vaults, Telebirr / M-Pesa digital float sweeps, and commercial bank clearing accounts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-[11px] font-semibold font-mono">
                        {effectiveCountry} SOVEREIGN LEDGER
                    </span>
                    {isManager ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border border-[var(--theme-border-accent)] text-[11px] font-semibold">
                            <ShieldCheck size={12} />
                            <span>Checker • Manager Sign-Off</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20 text-[11px] font-semibold">
                            <Clock size={12} />
                            <span>Maker • Staff Draft</span>
                        </span>
                    )}
                </div>
            </div>

            {/* 3 Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Vault Cash Balance
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-1">
                        {currencySymbol} 485,000
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        Across 8 verified retail store vaults
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Pending Float Sweeps
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-1">
                        {currencySymbol} 25,000
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        {transitStatus === 'authorized'
                            ? 'All branch floats authorized & released'
                            : transitStatus === 'submitted'
                            ? '1 replenishment request awaiting manager sign-off'
                            : '1 replenishment draft pending preparation'}
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Gateway Settlement Status
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mt-1">
                        99.8% Matched
                    </div>
                    <span className="text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-1 block">
                        Zero anomalous leakage detected
                    </span>
                </div>
            </div>

            {/* Sweep Breakdowns & Clearing Channels */}
            <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Vault &amp; Digital Float Liquidity Distribution
                        </h5>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Real-time channel breakdown between physical cash reserves and mobile wallets.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isManager ? (
                            <button
                                type="button"
                                onClick={handleManagerAuthorizeSweep}
                                disabled={sweepBatchStatus === 'authorized'}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                    sweepBatchStatus === 'authorized'
                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] opacity-70 cursor-not-allowed'
                                        : 'bg-[var(--theme-accent)] hover:bg-[#0077ED] text-[var(--theme-text-primary)] cursor-pointer'
                                }`}
                            >
                                <Check size={13} />
                                {sweepBatchStatus === 'authorized' ? 'Sweeps Authorized (Signed Off)' : 'Authorize & Release Sweeps'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStaffSubmitSweep}
                                disabled={sweepBatchStatus !== 'draft'}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                    sweepBatchStatus === 'draft'
                                        ? 'bg-[var(--theme-accent)] hover:bg-[#0077ED] text-[var(--theme-text-primary)] cursor-pointer'
                                        : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] opacity-80 cursor-not-allowed'
                                }`}
                            >
                                <Send size={13} />
                                {sweepBatchStatus === 'draft' ? 'Submit Sweep for Manager Review' : 'Submitted for Sign-Off'}
                            </button>
                        )}

                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-all flex items-center gap-1.5"
                        >
                            <Download size={13} /> Export Ledger
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-[var(--theme-border)] text-xs">
                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                                <Building2 size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Retail Central Vault Reserves (HQ)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Insured physical vault holdings • Addis Ababa / Nairobi
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-mono tabular-nums font-bold text-[var(--theme-text-primary)] text-sm block">
                                {currencySymbol} 320,000
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                <CheckCircle2 size={11} /> Reconciled
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                                <Smartphone size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Digital Float Sweeps (Telebirr / M-Pesa Merchant)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Mobile money API gateway balance • 10-minute settlement cadence
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-mono tabular-nums font-bold text-[var(--theme-text-primary)] text-sm block">
                                {currencySymbol} 140,000
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                <RefreshCw size={11} /> Real-Time Synced
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                                <Coins size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Branch Vault Transit Floats
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Cash in transit / scheduled bank deposit sweeps
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="font-mono tabular-nums font-bold text-[var(--theme-text-primary)] text-sm block">
                                    {currencySymbol} 25,000
                                </span>
                                {transitStatus === 'authorized' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                        <CheckCircle2 size={11} /> Authorized &amp; Released
                                    </span>
                                ) : transitStatus === 'submitted' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                        <Clock size={11} /> Pending Manager Sign-Off
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]">
                                        <Clock size={11} /> Reconciled In-Store
                                    </span>
                                )}
                            </div>

                            {/* Row Action based on role */}
                            {isManager ? (
                                transitStatus !== 'authorized' && (
                                    <button
                                        type="button"
                                        onClick={handleManagerAuthorizeTransit}
                                        className="px-2.5 py-1 rounded-lg bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-[11px] font-semibold transition-all cursor-pointer"
                                    >
                                        Authorize Release
                                    </button>
                                )
                            ) : (
                                transitStatus === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={handleStaffSubmitTransit}
                                        className="px-2.5 py-1 rounded-lg bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-[11px] font-semibold transition-all cursor-pointer"
                                    >
                                        Request Top-Up
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreasuryDesk;
