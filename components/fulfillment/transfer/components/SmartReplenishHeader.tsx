import React from 'react';
import { Layers, X, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

interface SmartReplenishHeaderProps {
    distHubSectorIntegrity: number;
    criticalCount?: number;
    stagedCount?: number;
    renderTabs: () => React.ReactNode;
    onClose: () => void;
}

export const SmartReplenishHeader: React.FC<SmartReplenishHeaderProps> = ({
    distHubSectorIntegrity,
    criticalCount = 0,
    stagedCount = 0,
    renderTabs,
    onClose
}) => {
    return (
        <div className="py-3 px-4 md:px-6 border-b border-[#E2DCCE] dark:border-white/10 bg-[#FAF8F5] dark:bg-[#151D18] flex flex-row items-center justify-between gap-4 relative z-10 shrink-0">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Layers className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-black text-stone-900 dark:text-white tracking-tight uppercase">
                            DISTRIBUTION <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">HUB</span>
                        </h2>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[9px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest">
                            <Sparkles size={10} /> Smart Replenish
                        </span>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest hidden md:block">
                        Multi-Store Stock Rebalancing & Transfer Deployment
                    </p>
                </div>
            </div>

            {/* Mode Tabs & Metrics */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center bg-stone-100 dark:bg-black/40 p-1 rounded-xl border border-[#E2DCCE]/80 dark:border-white/10 shrink-0">
                    {renderTabs()}
                </div>

                {/* Health & Staged Pills */}
                <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                        <span className="text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider text-[9px]">Stock Health:</span>
                        <span className={`font-black tabular-nums ${distHubSectorIntegrity >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {distHubSectorIntegrity.toFixed(0)}%
                        </span>
                    </div>

                    {criticalCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 shadow-xs">
                            <ShieldAlert size={12} className="animate-pulse" />
                            <span className="font-black tabular-nums">{criticalCount} Critical</span>
                        </div>
                    )}

                    {stagedCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30 text-[#2C5E3B] dark:text-[#A9CBA2] font-black shadow-xs">
                            <CheckCircle size={12} />
                            <span>{stagedCount} Staged</span>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    title="Close modal"
                    className="w-9 h-9 rounded-xl bg-white/80 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-[#E2DCCE] dark:border-white/10 flex items-center justify-center transition-all group shrink-0 active:scale-95 shadow-xs"
                >
                    <X className="text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors" size={16} />
                </button>
            </div>
        </div>
    );
};

