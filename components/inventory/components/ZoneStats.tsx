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
            <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Active Storage Zones</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-[var(--theme-text-primary)]">{zonesCount}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                    <Layers size={20} />
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Storage Capacity Occupancy</p>
                    <p className="text-xl font-bold font-mono mt-1 text-[var(--theme-text-primary)]">
                        {totalOccupied.toLocaleString()} <span className="text-xs text-[var(--theme-text-muted)] font-normal">/ {totalCapacity.toLocaleString()} items</span>
                    </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Box size={20} />
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Global Space Utilization</p>
                    <span className="text-sm font-bold font-mono text-[var(--theme-text-primary)]">{totalUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[var(--theme-bg-subtle)] h-2 rounded-full mt-2.5 overflow-hidden border border-[var(--theme-border)] relative">
                    <div 
                        className={`h-full transition-all duration-1000 ${totalUtilization > 90 ? 'bg-red-500' : totalUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, totalUtilization)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
export default ZoneStats;
