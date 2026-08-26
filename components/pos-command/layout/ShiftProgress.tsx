import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { CURRENCY_SYMBOL } from '../../../constants';
import { ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export const ShiftProgress: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { totalRevenue, getShiftSummary, txCount } = usePOSCommand();

    const isManagerOrAdmin = [
        'super_admin',
        'admin',
        'store_manager',
        'operations_manager',
        'ceo'
    ].includes(user?.role?.toLowerCase() || '');

    // For managers: Financial goal (ETB 5,000). For cashiers: Transaction goal (50 Orders).
    const dailyRevenueTarget = 5000;
    const dailyTxTarget = 50;

    const progressPercent = isManagerOrAdmin
        ? Math.min((totalRevenue / dailyRevenueTarget) * 100, 100)
        : Math.min((txCount / dailyTxTarget) * 100, 100);

    return (
        <div className="bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-8 relative overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]">

            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[#2C5E3B]/8 dark:bg-[#2C5E3B]/4 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-amber-600/8 dark:bg-amber-700/3 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
            {/* Top line accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/25 to-transparent" />

            <div className="relative z-10">
                {/* Header row */}
                <div className="flex justify-between items-end mb-7">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse shadow-[0_0_8px_rgba(44,94,59,0.6)]" />
                            <h3 className="text-[#4D6E56] dark:text-[#7A9E83] text-xs font-black uppercase tracking-[0.2em] select-none">
                                {isManagerOrAdmin ? t('posCommand.shiftTarget') : "Shift Order Target"}
                            </h3>
                        </div>
                        <div className="flex items-baseline gap-3">
                            {isManagerOrAdmin ? (
                                <>
                                    <span className="text-4xl font-mono font-black tracking-tighter text-[#1E3F27] dark:text-[#EAE5D9]">
                                        {CURRENCY_SYMBOL} {totalRevenue.toLocaleString()}
                                    </span>
                                    <span className="text-[#4D6E56]/60 dark:text-gray-500 font-mono text-lg font-bold tracking-tighter">
                                        / {CURRENCY_SYMBOL} {dailyRevenueTarget.toLocaleString()}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-4xl font-mono font-black tracking-tighter text-[#1E3F27] dark:text-[#EAE5D9]">
                                        {txCount} Orders
                                    </span>
                                    <span className="text-[#4D6E56]/60 dark:text-gray-500 font-mono text-lg font-bold tracking-tighter">
                                        / {dailyTxTarget} Target
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-[0.2em] mb-1 select-none">Completion</span>
                        <span className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2]">
                            {progressPercent.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Progress bar — warm Woody style */}
                <div className="relative h-4 bg-[#F4F0E6] dark:bg-black/40 rounded-full mb-8 border border-[#E2DCCE] dark:border-white/5 overflow-hidden shadow-inner">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out w-[var(--progress)]"
                        ref={(el) => { if (el) el.style.setProperty('--progress', `${progressPercent}%`); }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3F27] via-[#2C5E3B] to-[#A9CBA2] rounded-full shadow-[0_0_12px_rgba(44,94,59,0.4)]" />
                    </div>
                </div>

                {/* HUD modules */}
                <div className="grid grid-cols-3 gap-4">
                    {isManagerOrAdmin ? (
                        [
                            { label: t('pos.cash'), display: `${CURRENCY_SYMBOL} ${getShiftSummary().cash.toLocaleString()}`, accent: '#2C5E3B' },
                            { label: t('pos.card'), display: `${CURRENCY_SYMBOL} ${getShiftSummary().card.toLocaleString()}`, accent: '#A9CBA2' },
                            { label: t('pos.mobileMoney'), display: `${CURRENCY_SYMBOL} ${getShiftSummary().mobile.toLocaleString()}`, accent: '#2C5E3B' },
                        ].map(({ label, display, accent }) => (
                            <div key={label} className="group/hud relative bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5 hover:border-[#2C5E3B]/30 dark:hover:border-[#2C5E3B]/20 transition-all hover:shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full shadow-sm" ref={(el) => { if (el) el.style.backgroundColor = accent; }} />
                                    <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] uppercase font-black tracking-[0.2em] select-none">{label}</p>
                                </div>
                                <p className="text-xl font-mono font-bold tracking-tight text-[#1E3F27] dark:text-[#A9CBA2]">{display}</p>
                            </div>
                        ))
                    ) : (
                        [
                            { label: "Completed Orders", display: `${txCount} Processed`, icon: CheckCircle2, accent: '#2C5E3B' },
                            { label: "Speed & Pace", display: "On Schedule", icon: Zap, accent: '#A9CBA2' },
                            { label: "Drawer Protocol", display: "Blind Active 🔒", icon: ShieldCheck, accent: '#2C5E3B' },
                        ].map(({ label, display, icon: Icon, accent }) => (
                            <div key={label} className="group/hud relative bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5 hover:border-[#2C5E3B]/30 dark:hover:border-[#2C5E3B]/20 transition-all hover:shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                    <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] uppercase font-black tracking-[0.2em] select-none">{label}</p>
                                </div>
                                <p className="text-sm font-black tracking-tight text-[#1E3F27] dark:text-[#A9CBA2] font-mono">{display}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
