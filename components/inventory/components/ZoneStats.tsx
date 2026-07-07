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
            <div className="p-4 bg-white/70 dark:bg-[#18201B]/30 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider">Active Zones</p>
                    <p className="text-2xl font-black font-mono mt-1 text-[#1E3F27] dark:text-[#EAE5D9]">{zonesCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <Layers size={20} />
                </div>
            </div>
            <div className="p-4 bg-white/70 dark:bg-[#18201B]/30 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider">Global Capacity Utilization</p>
                    <p className="text-2xl font-black font-mono mt-1 text-[#1E3F27] dark:text-[#EAE5D9]">
                        {totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()}
                    </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Box size={20} />
                </div>
            </div>
            <div className="p-4 bg-white/70 dark:bg-[#18201B]/30 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider">Average Capacity Filled</p>
                    <span className="text-sm font-black font-mono text-[#1E3F27] dark:text-[#EAE5D9]">{totalUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-stone-250 dark:bg-black/45 h-2.5 rounded-full mt-2.5 overflow-hidden border border-[#E2DCCE]/50 dark:border-white/5 relative">
                    <div 
                        className={`h-full transition-all duration-1000 ${totalUtilization > 90 ? 'bg-red-500' : totalUtilization > 70 ? 'bg-amber-500' : 'bg-[#2C5E3B]'}`}
                        style={{ width: `${Math.min(100, totalUtilization)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
export default ZoneStats;
