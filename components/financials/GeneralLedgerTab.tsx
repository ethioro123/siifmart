import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Lock,
    Unlock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Scale,
    ShieldCheck,
    Calendar,
    Layers
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { generalLedgerService } from '../../services/general-ledger.service';
import type { AccountRecord, TrialBalanceRow, FiscalPeriod } from '../../types';
import { FiscalCloseModal } from './FiscalCloseModal';

export const GeneralLedgerTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, addNotification } = useFinance();
    const [accounts, setAccounts] = useState<AccountRecord[]>([]);
    const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
    const [periodStatus, setPeriodStatus] = useState<FiscalPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState<'trial_balance' | 'coa'>('trial_balance');
    const [lockModalOpen, setLockModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const now = new Date();
    const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [activePeriod, setActivePeriod] = useState(currentPeriodKey);

    const canLockPeriod = ['head_of_finance', 'country_managing_director', 'admin', 'cfo', 'super_admin', 'CEO', 'ceo'].includes(user?.role);

    const loadData = async () => {
        setLoading(true);
        try {
            const [coaData, tbData, pStatus] = await Promise.all([
                generalLedgerService.getChartOfAccounts(effectiveCountry),
                generalLedgerService.getTrialBalance(activePeriod, effectiveCountry),
                generalLedgerService.getPeriodStatus(activePeriod, effectiveCountry)
            ]);
            setAccounts(coaData);
            setTrialBalance(tbData);
            setPeriodStatus(pStatus);
        } catch {
            addNotification('alert', 'Failed to load general ledger data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [effectiveCountry, activePeriod]);

    const handleClosePeriod = async (reason: string) => {
        setIsActionLoading(true);
        try {
            const closed = await generalLedgerService.closeFiscalPeriod(
                activePeriod,
                effectiveCountry,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff' },
                reason
            );
            setPeriodStatus(closed);
            setLockModalOpen(false);
            addNotification('success', `Fiscal Period ${activePeriod} locked successfully.`);
        } catch (err: any) {
            addNotification('alert', err?.message || 'Failed to lock period');
        } finally {
            setIsActionLoading(false);
        }
    };

    const totalDebits = trialBalance.reduce((sum, r) => sum + r.debitTotal, 0);
    const totalCredits = trialBalance.reduce((sum, r) => sum + r.creditTotal, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return (
        <div className="space-y-4">
            {/* Header & Governance Bar */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            General Ledger (GL) &amp; Fiscal Period Governance
                        </h3>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                            <ShieldCheck size={12} />
                            <span>Double-Entry Equilibrium</span>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Statutory chart of accounts, trial balance equilibrium, and tamper-evident fiscal close locking.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Period Input */}
                    <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9 text-xs">
                        <Calendar size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                        <span className="text-[var(--theme-text-secondary)] mr-1.5">Period:</span>
                        <input
                            type="month"
                            value={activePeriod}
                            onChange={(e) => setActivePeriod(e.target.value)}
                            className="bg-transparent text-[var(--theme-text-primary)] font-mono outline-none cursor-pointer"
                        />
                    </div>

                    {/* Status Pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                        periodStatus?.status === 'Closed' || periodStatus?.status === 'Locked'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                        {periodStatus?.status === 'Closed' || periodStatus?.status === 'Locked' ? <Lock size={12} /> : <Unlock size={12} />}
                        <span>{periodStatus?.status || 'Open'}</span>
                    </div>

                    {/* Close Period Action */}
                    {periodStatus?.status === 'Open' && canLockPeriod && (
                        <button
                            onClick={() => setLockModalOpen(true)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                        >
                            <Lock size={12} />
                            <span>Close Period</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Trial Balance Health Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Total Debits</span>
                        <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                            {currencySymbol} {totalDebits.toLocaleString()}
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                            Assets &amp; expense postings
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                        <Scale size={18} />
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Total Credits</span>
                        <h4 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                            {currencySymbol} {totalCredits.toLocaleString()}
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                            Liabilities, equity &amp; revenues
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                        <Scale size={18} />
                    </div>
                </div>

                <div className={`rounded-2xl p-4 shadow-xs flex items-center justify-between border ${
                    isBalanced
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
                }`}>
                    <div>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Equilibrium Status</span>
                        <h4 className={`text-base font-semibold mt-1 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isBalanced ? 'Trial Balance Balanced' : 'Unbalanced Variance Detected'}
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 font-mono tabular-nums">
                            Variance: {currencySymbol} {Math.abs(totalDebits - totalCredits).toFixed(2)}
                        </p>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isBalanced ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                        {isBalanced ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </div>
                </div>
            </div>

            {/* Apple Segmented View Toggle */}
            <div className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-1 rounded-xl w-fit shadow-xs">
                <button
                    onClick={() => setSelectedView('trial_balance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedView === 'trial_balance'
                            ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)] font-semibold'
                            : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                >
                    Trial Balance Ledger
                </button>
                <button
                    onClick={() => setSelectedView('coa')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedView === 'coa'
                            ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)] font-semibold'
                            : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                >
                    Chart of Accounts (COA)
                </button>
            </div>

            {/* Table Container */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                {selectedView === 'trial_balance' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono">
                            <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)] font-sans">
                                <tr>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Account Code</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Account Title</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Category</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Debit Total</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Credit Total</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right font-bold">Net Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-[var(--theme-text-secondary)] font-sans">
                                            <Loader2 className="animate-spin inline mr-2 text-[#0071E3] dark:text-[#2997FF]" size={18} />
                                            <span className="text-xs">Loading Trial Balance...</span>
                                        </td>
                                    </tr>
                                ) : (
                                    trialBalance.map((row) => (
                                        <tr key={row.accountCode} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                            <td className="py-3.5 px-4 font-semibold text-xs text-[#0071E3] dark:text-[#2997FF]">
                                                {row.accountCode}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-sans text-[var(--theme-text-primary)] font-medium">
                                                {row.accountName}
                                            </td>
                                            <td className="py-3.5 px-4 font-sans text-xs text-[var(--theme-text-secondary)]">
                                                <span className="px-2 py-0.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[11px]">
                                                    {row.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right text-[var(--theme-text-secondary)] tabular-nums">
                                                {row.debitTotal > 0 ? `${currencySymbol} ${row.debitTotal.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right text-[var(--theme-text-secondary)] tabular-nums">
                                                {row.creditTotal > 0 ? `${currencySymbol} ${row.creditTotal.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right font-semibold text-[var(--theme-text-primary)] tabular-nums">
                                                {currencySymbol} {row.netBalance.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans">
                            <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider font-mono">Code</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Account Title</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Classification</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider font-mono">Normal Balance</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {accounts.map((acc) => (
                                    <tr key={acc.code} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[#0071E3] dark:text-[#2997FF]">
                                            {acc.code}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--theme-text-primary)]">
                                            {acc.name}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--theme-text-secondary)]">
                                            <span className="px-2 py-0.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[11px]">
                                                {acc.category}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-[var(--theme-text-secondary)]">
                                            {acc.normalBalance}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Count */}
                <div className="p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/40 text-xs text-[var(--theme-text-secondary)] flex justify-between items-center">
                    <span>
                        Loaded <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                            {selectedView === 'trial_balance' ? trialBalance.length : accounts.length}
                        </span> {selectedView === 'trial_balance' ? 'ledger rows' : 'accounts'} in period {activePeriod}
                    </span>
                    <span className="text-[11px]">
                        Zero-Trust Ledger Equilibrium Telemetry
                    </span>
                </div>
            </div>

            {/* Modular Close Period Lock Modal */}
            <FiscalCloseModal
                isOpen={lockModalOpen}
                onClose={() => setLockModalOpen(false)}
                onConfirm={handleClosePeriod}
                isActionLoading={isActionLoading}
                activePeriod={activePeriod}
            />
        </div>
    );
};

export default GeneralLedgerTab;
