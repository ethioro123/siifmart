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
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] shadow-xs"
                    >
                        <div className="flex flex-col gap-1 border-b border-[var(--theme-border)] pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--theme-status-warning-bg)] shrink-0" />
                                <h5 className="text-[var(--theme-text-primary)] font-semibold text-xs tracking-tight truncate" title={zone.name}>
                                    {zone.name}
                                </h5>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)] font-mono font-semibold shrink-0 ml-auto">
                                    {zoneSites.length}
                                </span>
                            </div>
                            {zone.description && (
                                <p className="text-[11px] text-[var(--theme-text-secondary)] truncate" title={zone.description}>
                                    {zone.description}
                                </p>
                            )}
                        </div>

                        {zoneSites.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                <MapPin size={16} className="text-[var(--theme-text-muted)] mb-1" />
                                <span className="text-[11px] text-[var(--theme-text-muted)] italic">No locations</span>
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
                className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] shadow-xs"
            >
                <div className="flex flex-col gap-1 border-b border-[var(--theme-border)] pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--theme-bg-card-hover)] shrink-0" />
                        <h5 className="text-[var(--theme-text-primary)] font-semibold text-xs tracking-tight truncate">
                            Unassigned / Free Zone
                        </h5>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)] font-mono font-semibold shrink-0 ml-auto">
                            {unassignedSites.length}
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] truncate">
                        Locations with no zoning restrictions
                    </p>
                </div>

                {unassignedSites.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                        <MapPin size={16} className="text-[var(--theme-text-muted)] mb-1" />
                        <span className="text-[11px] text-[var(--theme-text-muted)] italic">No locations</span>
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
