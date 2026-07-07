import React from 'react';
import { Activity, X } from 'lucide-react';

interface SmartReplenishHeaderProps {
    distHubSectorIntegrity: number;
    formatMissionTime: (seconds: number) => string;
    distHubTimer: number;
    renderTabs: () => React.ReactNode;
    onClose: () => void;
}

export const SmartReplenishHeader = ({
    distHubSectorIntegrity,
    formatMissionTime,
    distHubTimer,
    renderTabs,
    onClose
}: SmartReplenishHeaderProps) => {
    return (
        <div className="py-3 px-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-900/10 to-transparent flex flex-row items-center justify-between gap-4 relative z-10 glass-pattern">
            <div className="flex items-center gap-3">
                <Activity className="text-amber-500 animate-pulse shrink-0" size={20} />
                <div className="flex items-baseline gap-2">
                    <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">
                        DISTRIBUTION <span className="text-amber-500">HUB</span>
                    </h2>
                    <span className="text-amber-500/50 font-mono text-[9px] tracking-wider uppercase hidden sm:inline">Tactical Supply Deployment</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-1 bg-black/40 rounded-full border border-amber-500/10 shrink-0">
                    {renderTabs()}
                </div>

                <div className="hidden lg:flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-amber-500/10 text-[10px] font-mono shrink-0">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        ONLINE
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-gray-400">
                        SECTOR INTEGRITY: <span className="text-amber-400 font-bold">{distHubSectorIntegrity.toFixed(1)}%</span>
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-gray-400">
                        TIMER: <span className="text-white font-bold">{formatMissionTime(distHubTimer)}</span>
                    </span>
                </div>

                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    title="Close modal"
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all group shrink-0"
                >
                    <X className="text-gray-400 group-hover:text-red-500 transition-colors" size={16} />
                </button>
            </div>
        </div>
    );
};
