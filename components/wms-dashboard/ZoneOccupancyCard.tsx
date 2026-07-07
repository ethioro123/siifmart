import React from 'react';
import { Thermometer } from 'lucide-react';

interface ZoneOccupancyCardProps {
    warehouseMetrics: any;
    mockZones: any[];
    fastMovers: any[];
    t: (key: string) => string;
}

export const ZoneOccupancyCard: React.FC<ZoneOccupancyCardProps> = ({
    warehouseMetrics,
    mockZones,
    fastMovers,
    t
}) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-5 sm:p-8 lg:p-10 flex-1 shadow-sm transition-colors duration-500">
                <h3 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-8 flex items-center gap-4">
                    <Thermometer className="text-[#2C5E3B] dark:text-[#A9CBA2] opacity-80" size={20} />
                    Spatial Density
                </h3>
                <div className="space-y-7">
                    {(warehouseMetrics?.zone_data?.length > 0 ? warehouseMetrics.zone_data : mockZones).slice(0, 4).map((zone: any) => {
                        const percent = (zone.occupied / zone.capacity) * 100;
                        let colorClass = 'from-[#2C5E3B] to-emerald-500 dark:from-[#A9CBA2] dark:to-emerald-400';
                        if (percent > 90) colorClass = 'from-red-600 to-orange-500';
                        else if (percent > 75) colorClass = 'from-amber-600 to-yellow-500';

                        return (
                            <div key={zone.id} className="group cursor-help">
                                <div className="flex justify-between items-end mb-2.5 px-0.5">
                                    <div>
                                        <span className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">{zone.name}</span>
                                        <p className="text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-widest mt-0.5 opacity-60">Automated Racking</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[11px] font-bold ${percent > 90 ? 'text-red-600 dark:text-red-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>{percent.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE]/40 dark:border-white/[0.04] rounded-full h-2 overflow-hidden p-0.5">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(44,94,59,0.15)]`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm transition-colors duration-500">
                <h4 className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-[0.3em] mb-6">Velocity Ranking</h4>
                <div className="space-y-4">
                    {fastMovers.length > 0 ? fastMovers.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/45 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/15 group hover:bg-[#FAF8F5] hover:dark:bg-[#1C2620]/80 transition-all cursor-pointer">
                            <div className="flex items-center gap-5 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/25 flex items-center justify-center font-bold text-[#4D6E56] dark:text-[#7A9E83] text-[10px] border border-[#E2DCCE] dark:border-emerald-950/25 group-hover:text-[#2C5E3B] group-hover:dark:text-[#A9CBA2] group-hover:border-[#2C5E3B]/25 group-hover:dark:border-[#A9CBA2]/25 transition-colors">
                                    0{i + 1}
                                </div>
                                <div className="truncate">
                                    <span className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate block group-hover:text-[#2C5E3B] group-hover:dark:text-[#A9CBA2] transition-colors">{item.name}</span>
                                    <p className="text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-tighter mt-0.5 opacity-60">SKU Fast-Tracked</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-right shrink-0">
                                <div className="text-right">
                                    <span className="block text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9]">{item.moved}</span>
                                    {item.trend && <span className="text-[9px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{item.trend}</span>}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest text-center py-4">Scanning Network...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ZoneOccupancyCard;
