import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, Unlock, CheckCircle2, AlertCircle, Loader2, Scale } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { generalLedgerService } from '../../services/general-ledger.service';
import type { AccountRecord, TrialBalanceRow, FiscalPeriod } from '../../types';

export const GeneralLedgerTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, addNotification } = useFinance();
    const [accounts, setAccounts] = useState<AccountRecord[]>([]);
    const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
    const [periodStatus, setPeriodStatus] = useState<FiscalPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState<'coa' | 'trial_balance'>('trial_balance');
    const [lockModalOpen, setLockModalOpen] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const now = new Date();
    const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [activePeriod, setActivePeriod] = useState(currentPeriodKey);

    const canLockPeriod = ['finance_manager', 'super_admin', 'CEO', 'ceo'].includes(user?.role);

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

    const handleClosePeriod = async () => {
        if (!lockReason || lockReason.trim().length < 5) return;
        setIsActionLoading(true);
        try {
            const closed = await generalLedgerService.closeFiscalPeriod(
                activePeriod,
                effectiveCountry,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff' },
                lockReason.trim()
            );
            setPeriodStatus(closed);
            setLockModalOpen(false);
            setLockReason('');
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
        <div className="space-y-6 animate-in fade-in">
            {/* Header & Controls */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                        <BookOpen className="text-emerald-600 dark:text-emerald-400" size={18} />
                        General Ledger (GL) &amp; Fiscal Period Governance
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                        Double-entry chart of accounts, trial balance equilibrium, and period close locking.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                        <span className="text-stone-500 dark:text-gray-400 mr-2">Fiscal Period:</span>
                        <input
                            type="month"
                            value={activePeriod}
                            onChange={(e) => setActivePeriod(e.target.value)}
                            className="bg-transparent text-[#1E3F27] dark:text-white font-mono outline-none cursor-pointer"
                        />
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase ${
                        periodStatus?.status === 'Closed' || periodStatus?.status === 'Locked'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    }`}>
                        {periodStatus?.status === 'Closed' || periodStatus?.status === 'Locked' ? <Lock size={12} /> : <Unlock size={12} />}
                        {periodStatus?.status || 'Open'}
                    </div>

                    {periodStatus?.status === 'Open' && canLockPeriod && (
                        <button
                            onClick={() => setLockModalOpen(true)}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                            <Lock size={12} /> Close Period
                        </button>
                    )}
                </div>
            </div>

            {/* Trial Balance Health Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold block">Total Debits</span>
                        <span className="text-lg font-bold font-mono text-[#1E3F27] dark:text-white mt-1 block">
                            {currencySymbol} {totalDebits.toLocaleString()}
                        </span>
                    </div>
                    <Scale className="text-blue-600 dark:text-blue-400" size={24} />
                </div>

                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold block">Total Credits</span>
                        <span className="text-lg font-bold font-mono text-[#1E3F27] dark:text-white mt-1 block">
                            {currencySymbol} {totalCredits.toLocaleString()}
                        </span>
                    </div>
                    <Scale className="text-blue-600 dark:text-blue-400" size={24} />
                </div>

                <div className={`border rounded-2xl p-4 flex items-center justify-between ${
                    isBalanced
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                }`}>
                    <div>
                        <span className="text-xs text-stone-600 dark:text-gray-300 uppercase font-bold block">Trial Balance Equilibrium</span>
                        <span className={`text-base font-bold mt-1 block ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {isBalanced ? 'Balanced (Debits = Credits)' : 'Unbalanced Variance Detected'}
                        </span>
                    </div>
                    {isBalanced ? <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} /> : <AlertCircle className="text-rose-600 dark:text-rose-400" size={24} />}
                </div>
            </div>

            {/* Sub-tab view toggle */}
            <div className="flex gap-2 border-b border-[#E2DCCE] dark:border-white/5 pb-2">
                <button
                    onClick={() => setSelectedView('trial_balance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedView === 'trial_balance'
                            ? 'bg-stone-200/80 dark:bg-white/10 text-[#1E3F27] dark:text-white border border-[#E2DCCE] dark:border-white/10'
                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white'
                    }`}
                >
                    Trial Balance Ledger
                </button>
                <button
                    onClick={() => setSelectedView('coa')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedView === 'coa'
                            ? 'bg-stone-200/80 dark:bg-white/10 text-[#1E3F27] dark:text-white border border-[#E2DCCE] dark:border-white/10'
                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white'
                    }`}
                >
                    Chart of Accounts (COA)
                </button>
            </div>

            {/* Table */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto">
                {selectedView === 'trial_balance' ? (
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5 font-sans uppercase text-stone-500 dark:text-gray-500">
                            <tr>
                                <th className="p-4">Account Code</th>
                                <th className="p-4">Account Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Debit Total</th>
                                <th className="p-4 text-right">Credit Total</th>
                                <th className="p-4 text-right font-bold">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-stone-400 dark:text-gray-400 font-sans">
                                        <Loader2 className="animate-spin inline mr-2" size={18} /> Loading Trial Balance...
                                    </td>
                                </tr>
                            ) : (
                                trialBalance.map((row) => (
                                    <tr key={row.accountCode} className="hover:bg-stone-50 dark:hover:bg-white/5">
                                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{row.accountCode}</td>
                                        <td className="p-4 text-[#1E3F27] dark:text-white font-sans">{row.accountName}</td>
                                        <td className="p-4 text-stone-500 dark:text-gray-400 font-sans uppercase text-[10px]">{row.category}</td>
                                        <td className="p-4 text-right text-stone-600 dark:text-gray-300">
                                            {row.debitTotal > 0 ? `${currencySymbol} ${row.debitTotal.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-stone-600 dark:text-gray-300">
                                            {row.creditTotal > 0 ? `${currencySymbol} ${row.creditTotal.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-4 text-right font-bold text-[#1E3F27] dark:text-white">
                                            {currencySymbol} {row.netBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5 uppercase text-stone-500 dark:text-gray-500 font-sans">
                            <tr>
                                <th className="p-4 font-mono">Code</th>
                                <th className="p-4">Account Title</th>
                                <th className="p-4">Classification</th>
                                <th className="p-4">Normal Balance</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5 font-sans">
                            {accounts.map((acc) => (
                                <tr key={acc.code} className="hover:bg-stone-50 dark:hover:bg-white/5">
                                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{acc.code}</td>
                                    <td className="p-4 text-[#1E3F27] dark:text-white font-medium">{acc.name}</td>
                                    <td className="p-4 text-stone-500 dark:text-gray-400 uppercase text-[10px]">{acc.category}</td>
                                    <td className="p-4 font-mono text-stone-600 dark:text-gray-300">{acc.normalBalance}</td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Close Period Lock Modal */}
            {lockModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 border border-[#E2DCCE] dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                            <Lock className="text-rose-600 dark:text-rose-400" size={18} />
                            Lock Fiscal Period {activePeriod}
                        </h4>
                        <p className="text-xs text-rose-700 dark:text-rose-200/90 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl">
                            <strong>Zero-Trust Immutability Notice:</strong> Once closed, all transactions within {activePeriod} are permanently locked. No backdated records can be posted.
                        </p>
                        <textarea
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            className="woody-input resize-none h-24"
                            placeholder="Enter period-close audit memo and sign-off justification..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setLockModalOpen(false)}
                                className="px-4 py-2 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClosePeriod}
                                disabled={lockReason.trim().length < 5 || isActionLoading}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {isActionLoading && <Loader2 className="animate-spin" size={14} />}
                                Confirm Period Lock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralLedgerTab;
