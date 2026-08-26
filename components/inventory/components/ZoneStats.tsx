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
            <div className="p-4 sm:p-5 bg-white/85 dark:bg-[#18201B]/60 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Active Storage Zones</p>
                    <p className="text-2xl font-black font-mono mt-1 text-[#1E3F27] dark:text-[#EAE5D9]">{zonesCount}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30">
                    <Layers size={20} />
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-white/85 dark:bg-[#18201B]/60 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Storage Capacity Occupancy</p>
                    <p className="text-xl font-black font-mono mt-1 text-[#1E3F27] dark:text-[#EAE5D9]">
                        {totalOccupied.toLocaleString()} <span className="text-xs text-stone-400 font-normal">/ {totalCapacity.toLocaleString()} items</span>
                    </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                    <Box size={20} />
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-white/85 dark:bg-[#18201B]/60 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Global Space Utilization</p>
                    <span className="text-sm font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">{totalUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-black/40 h-2 rounded-full mt-2.5 overflow-hidden border border-[#E2DCCE]/60 dark:border-white/5 relative">
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
