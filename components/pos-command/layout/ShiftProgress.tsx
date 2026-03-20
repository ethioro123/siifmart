import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';

export const ShiftProgress: React.FC = () => {
    const { t } = useLanguage();
    const { totalRevenue, getShiftSummary } = usePOSCommand();

    const dailyTarget = 5000;
    const progressPercent = Math.min((totalRevenue / dailyTarget) * 100, 100);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Background Tech Details */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyber-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-end mb-8 relative">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                            <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">{t('posCommand.shiftTarget')}</h3>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-mono text-white font-black tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                {CURRENCY_SYMBOL} {totalRevenue.toLocaleString()}
                            </span>
                            <span className="text-gray-500 font-mono text-xl font-bold tracking-tighter">
                                / {CURRENCY_SYMBOL} {dailyTarget.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1 drop-shadow-md">Completion</span>
                        <div className="relative">
                            <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-blue-400 font-mono drop-shadow-[0_0_20px_rgba(0,255,157,0.3)]">
                                {progressPercent.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cyber Progress Gauge */}
                <div className="relative h-6 bg-black/80 rounded-sm mb-8 border border-white/10 overflow-hidden shadow-inner">
                    {/* Glowing Bar */}
                    <div
                        className="h-full relative transition-all duration-1000 ease-out z-10 w-[var(--progress)]"
                        ref={(el) => { if (el) el.style.setProperty('--progress', `${progressPercent}%`); }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyber-primary to-cyber-primary shadow-[0_0_20px_rgba(0,255,157,0.6)]" />
                    </div>
                </div>

                {/* HUD Data Modules */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Cash Module */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent p-[1px] rounded-2xl overflow-hidden group/hud">
                        <div className="bg-black/60 backdrop-blur-md p-5 rounded-2xl h-full border text-left border-white/5 group-hover/hud:bg-white/[0.02] transition-colors relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500/50 rounded-tl-xl opacity-0 group-hover/hud:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">{t('pos.cash')}</p>
                            </div>
                            <p className="text-2xl font-mono text-green-400 font-bold tracking-tight">{CURRENCY_SYMBOL} {getShiftSummary().cash.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Card Module */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent p-[1px] rounded-2xl overflow-hidden group/hud">
                        <div className="bg-black/60 backdrop-blur-md p-5 rounded-2xl h-full border text-left border-white/5 group-hover/hud:bg-white/[0.02] transition-colors relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-xl opacity-0 group-hover/hud:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">{t('pos.card')}</p>
                            </div>
                            <p className="text-2xl font-mono text-blue-400 font-bold tracking-tight">{CURRENCY_SYMBOL} {getShiftSummary().card.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Mobile Module */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent p-[1px] rounded-2xl overflow-hidden group/hud">
                        <div className="bg-black/60 backdrop-blur-md p-5 rounded-2xl h-full border text-left border-white/5 group-hover/hud:bg-white/[0.02] transition-colors relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/50 rounded-tl-xl opacity-0 group-hover/hud:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">{t('pos.mobileMoney')}</p>
                            </div>
                            <p className="text-2xl font-mono text-purple-400 font-bold tracking-tight">{CURRENCY_SYMBOL} {getShiftSummary().mobile.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
