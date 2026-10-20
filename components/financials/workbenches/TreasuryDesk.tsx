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
    const isManager = Boolean(user?.role && ['head_of_finance', 'finance_head', 'finance_manager', 'treasury_officer', 'country_managing_director', 'admin', 'super_admin', 'CEO', 'ceo'].includes(user.role));

    const [transitStatus, setTransitStatus] = useState<'pending' | 'submitted' | 'authorized'>('pending');
    const [sweepBatchStatus, setSweepBatchStatus] = useState<'draft' | 'submitted' | 'authorized'>('draft');

    const handleStaffSubmitSweep = () => {
        setSweepBatchStatus('submitted');
        addNotification?.('info', 'Daily vault sweep package submitted to Finance Manager for bank clearance sign-off.');
    };

    const handleStaffSubmitTransit = () => {
        setTransitStatus('submitted');
        addNotification?.('info', 'Branch vault replenishment request submitted to Finance Manager for disbursement approval.');
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
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold font-mono">
                        {effectiveCountry} SOVEREIGN LEDGER
                    </span>
                    {isManager ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
                            <ShieldCheck size={12} />
                            <span>Checker • Manager Sign-Off</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 text-[11px] font-semibold">
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
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
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
                    <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
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
                    <div className="text-xl font-bold font-mono tabular-nums text-[#0071E3] dark:text-[#2997FF] mt-1">
                        99.8% Matched
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
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
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 opacity-70 cursor-not-allowed'
                                        : 'bg-[#0071E3] hover:bg-[#0077ED] text-white cursor-pointer'
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
                                        ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white cursor-pointer'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 opacity-80 cursor-not-allowed'
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
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={11} /> Reconciled
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
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
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0071E3] dark:text-[#2997FF]">
                                <RefreshCw size={11} /> Real-Time Synced
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
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
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 size={11} /> Authorized &amp; Released
                                    </span>
                                ) : transitStatus === 'submitted' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                        <Clock size={11} /> Pending Manager Sign-Off
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
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
                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all cursor-pointer"
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
