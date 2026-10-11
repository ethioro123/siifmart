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
        <div className="py-3 px-4 md:px-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex flex-row items-center justify-between gap-4 relative z-10 shrink-0">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
                    <Layers className="text-primary" size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">
                            Distribution <span className="text-primary">Hub</span>
                        </h2>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary uppercase tracking-wider">
                            <Sparkles size={11} /> Smart Replenish
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider hidden md:block">
                        Multi-Store Stock Rebalancing & Transfer Deployment
                    </p>
                </div>
            </div>

            {/* Mode Tabs & Metrics */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center bg-[var(--theme-bg-card)] p-1 rounded-xl border border-[var(--theme-border)] shrink-0">
                    {renderTabs()}
                </div>

                {/* Health & Staged Pills */}
                <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider text-[11px]">Stock Health:</span>
                        <span className={`font-bold tabular-nums ${distHubSectorIntegrity >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                            {distHubSectorIntegrity.toFixed(0)}%
                        </span>
                    </div>

                    {criticalCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-xs font-bold tabular-nums">
                            <ShieldAlert size={14} className="animate-pulse" />
                            <span>{criticalCount} Critical</span>
                        </div>
                    )}

                    {stagedCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold shadow-xs">
                            <CheckCircle size={14} />
                            <span>{stagedCount} Staged</span>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    title="Close modal"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center transition-all group shrink-0 active:scale-95 shadow-xs touch-manipulation text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};
