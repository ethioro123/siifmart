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
            {/* Spatial Density Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                        <Thermometer size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Spatial Density</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">Zone capacity & automated racking</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {(warehouseMetrics?.zone_data?.length > 0 ? warehouseMetrics.zone_data : mockZones).slice(0, 4).map((zone: any) => {
                        const percent = Math.min(100, Math.max(0, (zone.occupied / zone.capacity) * 100));
                        let barColor = 'bg-[#0071E3] dark:bg-[#2997FF]';
                        let textColor = 'text-[#0071E3] dark:text-[#2997FF]';
                        if (percent > 90) {
                            barColor = 'bg-[#FF3B30] dark:bg-[#FF453A]';
                            textColor = 'text-[#FF3B30] dark:text-[#FF453A]';
                        } else if (percent > 75) {
                            barColor = 'bg-[#FF9500] dark:bg-[#FF9F0A]';
                            textColor = 'text-[#FF9500] dark:text-[#FF9F0A]';
                        }

                        return (
                            <div key={zone.id} className="group">
                                <div className="flex justify-between items-baseline mb-1.5 px-0.5">
                                    <span className="text-xs font-medium text-[var(--theme-text-primary)]">{zone.name}</span>
                                    <span className={`text-xs font-semibold font-mono ${textColor}`}>
                                        {percent.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full h-2 overflow-hidden p-0.5">
                                    <div
                                        className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Velocity Ranking Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">Velocity Ranking</h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)]">Fastest moving SKUs</p>
                </div>
                <div className="space-y-2.5">
                    {fastMovers.length > 0 ? fastMovers.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] transition-colors hover:bg-[var(--theme-bg-card)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-bg-card)] flex items-center justify-center font-semibold text-xs text-[var(--theme-text-secondary)] border border-[var(--theme-border)] shrink-0 font-mono">
                                    0{i + 1}
                                </div>
                                <div className="truncate">
                                    <span className="text-xs font-medium text-[var(--theme-text-primary)] truncate block">{item.name}</span>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">SKU Fast-Tracked</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-right shrink-0">
                                <div>
                                    <span className="block text-xs font-semibold font-mono text-[var(--theme-text-primary)]">{item.moved}</span>
                                    {item.trend && <span className="text-[10px] font-medium text-[#34C759] dark:text-[#30D158]">{item.trend}</span>}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs text-[var(--theme-text-secondary)] text-center py-4">Scanning Network...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ZoneOccupancyCard;
