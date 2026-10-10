import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { ShieldCheck, CheckCircle2, Zap, Play, Lock, Banknote, CreditCard, Smartphone } from 'lucide-react';

export const ShiftProgress: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { settings } = useData();
    const { totalRevenue, getShiftSummary, shiftTxCount, activeShift, setIsStartShiftModalOpen, dateRange } = usePOSCommand();

    const isCentralHQ = [
        'super_admin',
        'ceo',
        'admin',
        'regional_manager',
        'operations_manager',
        'finance_manager',
        'auditor'
    ].includes(user?.role?.toLowerCase() || '');

    // Inactive drawer zero-state for cashiers without an active shift
    if (!activeShift && !isCentralHQ) {
        return (
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs isolate">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Cash Drawer Closed • Daily Shift Inactive
                            </h3>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                            Ready to begin today's register sales?
                        </h2>
                        <p className="text-xs text-[var(--theme-text-secondary)] max-w-xl leading-relaxed">
                            Count physical float cash in the register drawer and submit opening float to start sales. Real-time cash tracking and daily HQ audit reconciliation will activate immediately.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsStartShiftModalOpen(true)}
                        className="px-6 py-3.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold uppercase tracking-wider rounded-2xl shadow-xs transition-all flex items-center gap-2.5 active:scale-95 cursor-pointer shrink-0"
                    >
                        <Play size={15} className="fill-current" />
                        <span>Open Drawer &amp; Start Shift</span>
                    </button>
                </div>
            </div>
        );
    }

    // Targets from Settings, scaled dynamically to the selected time filter
    const rangeStr = String(dateRange);
    const multiplier = rangeStr.includes('Quarter') ? 90 : rangeStr.includes('Month') ? 30 : rangeStr.includes('Year') ? 365 : 1;
    const baseRevenueTarget = settings?.posDailyRevenueTarget || 50000;
    const baseTxTarget = settings?.posDailyTxTarget || 50;
    const dailyRevenueTarget = baseRevenueTarget * multiplier;
    const dailyTxTarget = baseTxTarget * multiplier;

    const progressPercent = isCentralHQ
        ? Math.min((totalRevenue / dailyRevenueTarget) * 100, 100)
        : Math.min((shiftTxCount / dailyTxTarget) * 100, 100);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs isolate">
            <div>
                {/* Header row */}
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)]" />
                            <h3 className="text-[var(--theme-text-secondary)] text-xs font-semibold uppercase tracking-wider select-none">
                                {dateRange} {isCentralHQ ? t('posCommand.shiftTarget') : "Order Target"}
                            </h3>
                        </div>
                        <div className="flex items-baseline gap-3">
                            {isCentralHQ ? (
                                <>
                                    <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tight text-[var(--theme-text-primary)]">
                                        {CURRENCY_SYMBOL} {totalRevenue.toLocaleString()}
                                    </span>
                                    <span className="text-[var(--theme-text-secondary)] font-mono text-base font-semibold">
                                        / {CURRENCY_SYMBOL} {dailyRevenueTarget.toLocaleString()}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tight text-[var(--theme-text-primary)]">
                                        {shiftTxCount} Orders
                                    </span>
                                    <span className="text-[var(--theme-text-secondary)] font-mono text-base font-semibold">
                                        / {dailyTxTarget} Target
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider mb-1 select-none">Completion</span>
                        <span className="text-3xl lg:text-4xl font-bold font-mono text-[var(--theme-text-primary)]">
                            {progressPercent.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Progress bar — Apple Minimal Solid Style */}
                <div className="relative h-2.5 bg-[var(--theme-bg-subtle)] rounded-full mb-6 border border-[var(--theme-border)] overflow-hidden">
                    <div
                        className="h-full bg-[var(--theme-primary)] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* HUD modules */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {isCentralHQ ? (
                        [
                            { label: t('pos.cash'), display: `${CURRENCY_SYMBOL} ${getShiftSummary().cash.toLocaleString()}`, icon: Banknote, color: 'bg-emerald-500/10 text-emerald-500' },
                            { label: t('pos.card'), display: `${CURRENCY_SYMBOL} ${getShiftSummary().card.toLocaleString()}`, icon: CreditCard, color: 'bg-blue-500/10 text-blue-500' },
                            { label: t('pos.mobileMoney'), display: `${CURRENCY_SYMBOL} ${getShiftSummary().mobile.toLocaleString()}`, icon: Smartphone, color: 'bg-purple-500/10 text-purple-500' },
                        ].map(({ label, display, icon: Icon, color }) => (
                            <div key={label} className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 transition-colors hover:bg-[var(--theme-bg-card-hover)] flex items-center gap-3.5 shadow-2xs">
                                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider select-none mb-0.5">{label}</p>
                                    <p className="text-lg font-mono font-bold tracking-tight text-[var(--theme-text-primary)] truncate">{display}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        [
                            { label: "Completed Orders", display: `${shiftTxCount} Processed`, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-500' },
                            { label: "Speed & Pace", display: "On Schedule", icon: Zap, color: 'bg-amber-500/10 text-amber-500' },
                            { label: "Drawer Protocol", display: "Blind Active", icon: Lock, color: 'bg-indigo-500/10 text-indigo-500' },
                        ].map(({ label, display, icon: Icon, color }) => (
                            <div key={label} className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 transition-colors hover:bg-[var(--theme-bg-card-hover)] flex items-center gap-3.5 shadow-2xs">
                                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider select-none mb-0.5">{label}</p>
                                    <p className="text-base font-bold tracking-tight text-[var(--theme-text-primary)] font-mono truncate">{display}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
