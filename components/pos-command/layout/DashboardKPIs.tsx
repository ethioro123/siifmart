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

    const isCentralHQ = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_finance_director', 'auditor'].includes(user?.role?.toLowerCase() || '');

    // Compare period revenue with a target that covers the same calendar period.
    const rangeStr = String(dateRange);
    const now = new Date();
    let targetDays: number | null = null;
    if (rangeStr === 'This Month') {
        targetDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    } else if (rangeStr === 'Last Month') {
        targetDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    } else if (rangeStr === 'This Quarter') {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
        const quarterEnd = new Date(now.getFullYear(), quarterMonth + 3, 0);
        targetDays = Math.round((quarterEnd.getTime() - quarterStart.getTime()) / 86400000) + 1;
    } else if (rangeStr === 'This Year' || rangeStr === 'Last Year') {
        const year = now.getFullYear() - (rangeStr === 'Last Year' ? 1 : 0);
        targetDays = (new Date(year + 1, 0, 1).getTime() - new Date(year, 0, 1).getTime()) / 86400000;
    }
    const baseRevenueTarget = settings?.posDailyRevenueTarget || 50000;
    const baseTxTarget = settings?.posDailyTxTarget || 50;
    const periodRevenueTarget = targetDays === null ? null : baseRevenueTarget * targetDays;
    const metricTarget = isCentralHQ ? periodRevenueTarget : baseTxTarget;
    const metricValue = isCentralHQ ? totalRevenue : shiftTxCount;
    const progressPercent = metricTarget && metricTarget > 0
        ? Math.min((metricValue / metricTarget) * 100, 100)
        : null;

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
                                {t('posCommand.drawerClosedBannerTitle')}
                            </h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                {t('posCommand.drawerClosedBannerDesc')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsStartShiftModalOpen(true)}
                        className="px-4 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                    >
                        <Play size={13} className="fill-current" />
                        <span>{t('posCommand.startDailyShift')}</span>
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
                                {progressPercent === null ? '—' : `${progressPercent.toFixed(1)}%`}
                            </span>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {isCentralHQ ? t('posCommand.shiftTarget') || 'Shift Target' : t('posCommand.ordersAndTarget')}
                        </h3>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                                {isCentralHQ
                                    ? `${CURRENCY_SYMBOL} ${totalRevenue.toLocaleString()}`
                                    : shiftTxCount}
                            </span>
                            <span className="text-xs text-[var(--theme-text-secondary)] font-mono font-medium">
                                / {isCentralHQ
                                    ? periodRevenueTarget === null
                                        ? t('posCommand.targetNotSet')
                                        : `${CURRENCY_SYMBOL} ${periodRevenueTarget.toLocaleString()}`
                                    : t('posCommand.targetCount', { count: baseTxTarget })}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)]">
                        <div className="relative h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden mb-2">
                            <div
                                role="progressbar"
                                aria-label={isCentralHQ ? 'Revenue target progress' : 'Shift transaction target progress'}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={progressPercent ?? undefined}
                                aria-valuetext={progressPercent === null ? 'No target defined for this period' : `${progressPercent.toFixed(1)} percent`}
                                className="h-full bg-[#0071E3] dark:bg-[#2997FF] rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent ?? 0}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                            <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-[var(--theme-status-success)]' : 'bg-[var(--theme-text-muted)]'}`} />
                                {progressPercent === null
                                    ? rangeStr === 'All Time' ? t('posCommand.noAllTimeTarget') : t('posCommand.noPeriodTarget')
                                    : activeShift ? t('posCommand.shiftOpen') : t('posCommand.noActiveShift')}
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
                                        aria-label={isRevealed ? 'Hide cash total' : 'Reveal cash total'}
                                        aria-pressed={isRevealed}
                                        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                                    >
                                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                )}
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {isCentralHQ && isRevealed ? t('posCommand.visibleToHQ') : t('posCommand.blindView')}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {t('pos.cashInDrawer') || 'Cash Drawer'}
                        </h3>
                        <p className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                            {isCentralHQ && isRevealed
                                ? `${CURRENCY_SYMBOL} ${cashInDrawer.toLocaleString()}`
                                : t('posCommand.protectedBlind')}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>{t('posCommand.cashVisibility')}</span>
                        <span className="font-medium text-[var(--theme-text-primary)]">
                            {isCentralHQ && isRevealed ? t('posCommand.revealed') : t('posCommand.hidden')}
                        </span>
                    </div>
                </div>

                {/* Card 3: Total Transactions / Volume */}
                <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:border-[#0071E3]/40 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <Activity size={16} />
                            </div>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {t('pos.transactions') || 'Completed Orders'}
                        </h3>
                        <p className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                            {txCount.toLocaleString()}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>{dateRange}</span>
                        <span className="font-mono">{shiftTxCount} {t('posCommand.inShift')}</span>
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
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                            {t('pos.returns') || 'Refunded Orders'}
                        </h3>
                        <p className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)]">
                            {returnCount}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>{dateRange}</span>
                        <span>{t('posCommand.refundedOrPartial')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
