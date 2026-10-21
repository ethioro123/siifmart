import React from 'react';
import { Thermometer } from 'lucide-react';

interface ZoneOccupancyCardProps {
    warehouseMetrics: any;
    fastMovers: any[];
    t: (key: string) => string;
}

export const ZoneOccupancyCard: React.FC<ZoneOccupancyCardProps> = ({
    warehouseMetrics,
    fastMovers,
    t
}) => {
    const zones = warehouseMetrics?.zone_data || [];

    return (
        <div className="flex flex-col gap-6">
            {/* Spatial Density Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Thermometer size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Spatial Density</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">Zone capacity & automated racking</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {zones.length > 0 ? (
                        zones.slice(0, 4).map((zone: any) => {
                            const capacity = zone.capacity || 100;
                            const occupied = zone.occupied || 0;
                            const percent = Math.min(100, Math.max(0, (occupied / capacity) * 100));
                            let barColor = 'bg-[var(--theme-accent)]';
                            let textColor = 'text-[var(--theme-accent)]';
                            if (percent > 90) {
                                barColor = 'bg-[var(--theme-status-danger)]';
                                textColor = 'text-[var(--theme-status-danger-text)]';
                            } else if (percent > 75) {
                                barColor = 'bg-[var(--theme-status-warning)]';
                                textColor = 'text-[var(--theme-status-warning-text)]';
                            }

                            return (
                                <div key={zone.id} className="group">
                                    <div className="flex justify-between items-baseline mb-1.5 px-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-[var(--theme-text-primary)]">{zone.name}</span>
                                            {zone.temperature && (
                                                <span className="text-[10px] font-mono text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-1.5 py-0.2 rounded-md">
                                                    {zone.temperature}
                                                </span>
                                            )}
                                        </div>
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
                        })
                    ) : (
                        <div className="py-8 text-center text-[var(--theme-text-secondary)] text-xs">
                            <Thermometer size={22} className="mx-auto mb-2 opacity-40 text-[var(--theme-accent)]" />
                            <p className="font-semibold text-[var(--theme-text-primary)]">No Active Storage Zones</p>
                            <p className="text-[11px] mt-0.5">Bays will appear when configured in facility settings</p>
                        </div>
                    )}
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
                                    {item.trend && <span className="text-[10px] font-medium text-[var(--theme-status-success-text)]">{item.trend}</span>}
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
