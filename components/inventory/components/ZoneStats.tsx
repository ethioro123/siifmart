import React from 'react';
import { Layers, Box } from 'lucide-react';

interface ZoneStatsProps {
    zonesCount: number;
    totalCapacity: number;
    totalOccupied: number;
    totalUtilization: number;
}

export const ZoneStats: React.FC<ZoneStatsProps> = ({
    zonesCount,
    totalCapacity,
    totalOccupied,
    totalUtilization
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs flex items-center justify-between text-left">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Active Storage Zones</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{zonesCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                    <Layers size={18} />
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs flex items-center justify-between text-left">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Capacity Occupancy</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {totalOccupied.toLocaleString()} <span className="text-xs text-[var(--theme-text-secondary)] font-normal">/ {totalCapacity.toLocaleString()} items</span>
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)]/10 text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]/20 flex items-center justify-center shrink-0">
                    <Box size={18} />
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs flex flex-col justify-between text-left">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Space Utilization</p>
                    <span className="text-sm font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{totalUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[var(--theme-bg-subtle)] h-2 rounded-full mt-3 overflow-hidden border border-[var(--theme-border)] relative">
                    <div
                        className={`h-full transition-all duration-700 ${totalUtilization > 90 ? 'bg-[var(--theme-status-danger-bg)]' : totalUtilization > 70 ? 'bg-[var(--theme-status-warning-bg)]' : 'bg-[var(--theme-status-success-bg)]'}`}
                        style={{ width: `${Math.min(100, totalUtilization)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
export default ZoneStats;
