import React from 'react';
import { MapPin } from 'lucide-react';
import type { Site, LogisticsZone } from '../../../types';

interface LocationZoneViewProps {
    sites: Site[];
    logisticsZones: LogisticsZone[];
    renderSiteCard: (site: Site) => React.ReactNode;
}

export const LocationZoneView: React.FC<LocationZoneViewProps> = ({
    sites,
    logisticsZones,
    renderSiteCard
}) => {
    const unassignedSites = sites.filter((s: Site) => !s.logisticsZoneId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {logisticsZones.map(zone => {
                const zoneSites = sites.filter((s: Site) => s.logisticsZoneId === zone.id);
                return (
                    <div
                        key={zone.id}
                        className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-[#2C5E3B]/30 transition-colors shadow-sm"
                    >
                        <div className="flex flex-col gap-1 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
                                <h5 className="text-[#1E3F27] dark:text-white font-black text-xs uppercase tracking-wider truncate" title={zone.name}>
                                    {zone.name}
                                </h5>
                                <span className="text-[10px] text-stone-600 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded-lg border border-[#E2DCCE] dark:border-white/10 font-mono font-bold shrink-0 ml-auto">
                                    {zoneSites.length}
                                </span>
                            </div>
                            {zone.description && (
                                <p className="text-[10px] text-stone-500 dark:text-gray-400 truncate" title={zone.description}>
                                    {zone.description}
                                </p>
                            )}
                        </div>

                        {zoneSites.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                <MapPin size={16} className="text-stone-400 mb-1" />
                                <span className="text-[10px] text-stone-500 italic">No locations</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                {zoneSites.map((site: Site) => renderSiteCard(site))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Unassigned / Free Zone */}
            <div
                key="unassigned"
                className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-[#2C5E3B]/30 transition-colors shadow-sm"
            >
                <div className="flex flex-col gap-1 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                        <h5 className="text-[#1E3F27] dark:text-white font-black text-xs uppercase tracking-wider truncate">
                            Unassigned / Free Zone
                        </h5>
                        <span className="text-[10px] text-stone-600 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded-lg border border-[#E2DCCE] dark:border-white/10 font-mono font-bold shrink-0 ml-auto">
                            {unassignedSites.length}
                        </span>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 truncate">
                        Locations with no zoning restrictions
                    </p>
                </div>

                {unassignedSites.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                        <MapPin size={16} className="text-stone-400 mb-1" />
                        <span className="text-[10px] text-stone-500 italic">No locations</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {unassignedSites.map((site: Site) => renderSiteCard(site))}
                    </div>
                )}
            </div>
        </div>
    );
};
