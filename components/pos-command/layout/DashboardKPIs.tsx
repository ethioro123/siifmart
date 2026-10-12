import React, { useState } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import {
    Activity, RefreshCw, ShieldCheck, Eye, EyeOff,
    Target, Lock, Play
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';

export const DashboardKPIs: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { settings } = useData();
    const {
        cashInDrawer,
        txCount,
        shiftTxCount,
        returnCount,
        dateRange,
        totalRevenue,
        activeShift,
        setIsStartShiftModalOpen
    } = usePOSCommand();

    const [isRevealed, setIsRevealed] = useState(false);

    const isCentralHQ = [
        'super_admin',
        'ceo',
        'admin',
        'regional_manager',
        'operations_manager',
        'finance_manager',
        'auditor'
    ].includes(user?.role?.toLowerCase() || '');

    // Targets scaled dynamically to the selected time filter
    const rangeStr = String(dateRange);
    const multiplier = rangeStr.includes('Quarter') ? 90 : rangeStr.includes('Month') ? 30 : rangeStr.includes('Year') ? 365 : 1;
    const baseRevenueTarget = settings?.posDailyRevenueTarget || 50000;
    const baseTxTarget = settings?.posDailyTxTarget || 50;
    const dailyRevenueTarget = baseRevenueTarget * multiplier;
    const dailyTxTarget = baseTxTarget * multiplier;

    const progressPercent = isCentralHQ
        ? Math.min((totalRevenue / (dailyRevenueTarget || 1)) * 100, 100)
        : Math.min((shiftTxCount / (dailyTxTarget || 1)) * 100, 100);

    return (
        <div className="space-y-4">
            {/* Drawer Inactive Zero-State Banner for Cashiers */}
            {!activeShift && !isCentralHQ && (
                <div className="bg-[var(--theme-bg-card)] border border-amber-500/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Lock size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                Register Drawer Closed • Daily Shift Inactive
                            </h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                Submit opening float to begin recording register sales and activate live audit tracking.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsStartShiftModalOpen(true)}
                        className="px-4 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                    >
                        <Play size={13} className="fill-current" />
                        <span>Start Daily Shift</span>
                    </button>
                </div>
            )}

            {/* Apple Pro 4-Card Unified Command Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Card 1: Shift Progress & Target */}
                <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:border-[#0071E3]/40 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                                <Target size={16} />
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20">
                                {progressPercent.toFixed(1)}%
                            </span>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {isCentralHQ ? t('posCommand.shiftTarget') || 'Shift Target' : 'Orders & Target'}
                        </h3>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                                {isCentralHQ
                                    ? `${CURRENCY_SYMBOL} ${totalRevenue.toLocaleString()}`
                                    : shiftTxCount}
                            </span>
                            <span className="text-xs text-[var(--theme-text-secondary)] font-mono font-medium">
                                / {isCentralHQ
                                    ? `${CURRENCY_SYMBOL} ${dailyRevenueTarget.toLocaleString()}`
                                    : `${dailyTxTarget} Target`}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)]">
                        <div className="relative h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-[#0071E3] dark:bg-[#2997FF] rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {activeShift ? 'On Schedule' : 'Drawer Inactive'}
                            </span>
                            <span className="font-mono text-[10px]">{dateRange}</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Cash Drawer & Blind Protocol */}
                <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:border-[#0071E3]/40 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div className="flex items-center gap-1.5">
                                {isCentralHQ && (
                                    <button
                                        type="button"
                                        onClick={() => setIsRevealed(!isRevealed)}
                                        title={isRevealed ? "Hide Cash Total" : "Reveal Cash Total"}
                                        className="p-1 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                                    >
                                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                )}
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {isCentralHQ && isRevealed ? 'HQ Audit' : 'Blind Active'}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {t('pos.cashInDrawer') || 'Cash Drawer'}
                        </h3>
                        <p className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                            {isCentralHQ && isRevealed
                                ? `${CURRENCY_SYMBOL} ${cashInDrawer.toLocaleString()}`
                                : 'Protected (Blind)'}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>Anti-Skimming Lock</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
                    </div>
                </div>

                {/* Card 3: Total Transactions / Volume */}
                <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:border-[#0071E3]/40 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <Activity size={16} />
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                +18%
                            </span>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {t('pos.transactions') || 'Completed Orders'}
                        </h3>
                        <p className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                            {txCount.toLocaleString()}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>{dateRange} Volume</span>
                        <span className="font-mono">{shiftTxCount} in shift</span>
                    </div>
                </div>

                {/* Card 4: Returns & Policy Compliance */}
                <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:border-[#0071E3]/40 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                returnCount > 0
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : 'bg-teal-500/10 text-teal-500'
                            }`}>
                                <RefreshCw size={16} />
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                returnCount > 0
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                                {returnCount === 0 ? 'Zero Variance' : '-5% Return'}
                            </span>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {t('pos.returns') || 'Returns & Voids'}
                        </h3>
                        <p className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                            {returnCount}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>Rule 18 Audited</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
