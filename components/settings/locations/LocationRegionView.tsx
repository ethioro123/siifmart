import React from 'react';
import { MapPin } from 'lucide-react';
import type { Site, Region } from '../../../types';

interface LocationRegionViewProps {
    sites: Site[];
    regions: Region[];
    renderSiteCard: (site: Site) => React.ReactNode;
}

export const LocationRegionView: React.FC<LocationRegionViewProps> = ({
    sites,
    regions,
    renderSiteCard
}) => {
    const unassignedSites = sites.filter((s: Site) => !s.region_code && !s.regionCode);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {regions.map(region => {
                const regionSites = sites.filter((s: Site) => (s.region_code || s.regionCode) === region.code);
                return (
                    <div
                        key={region.code}
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] shadow-xs"
                    >
                        <div className="flex flex-col gap-1 border-b border-[var(--theme-border)] pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] shrink-0" />
                                <h5 className="text-[var(--theme-text-primary)] font-semibold text-xs tracking-tight truncate" title={region.name}>
                                    {region.name}
                                </h5>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)] font-mono font-semibold shrink-0 ml-auto">
                                    {regionSites.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)]">
                                <span className="font-mono font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">{region.code}</span>
                                {region.city && <span>&bull; {region.city}</span>}
                            </div>
                        </div>

                        {regionSites.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                <MapPin size={16} className="text-[var(--theme-text-muted)] mb-1" />
                                <span className="text-[11px] text-[var(--theme-text-muted)] italic">No locations</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                {regionSites.map((site: Site) => renderSiteCard(site))}
                            </div>
                        )}
                    </div>
                );
            })}

            {unassignedSites.length > 0 && (
                <div
                    key="unassigned"
                    className="bg-[var(--theme-bg-card)] border border-dashed border-[var(--theme-border)] rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] shadow-xs"
                >
                    <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-2.5">
                        <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                        <h5 className="text-[var(--theme-text-primary)] font-semibold text-xs tracking-tight">
                            Unassigned Region
                        </h5>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)] font-mono font-semibold shrink-0 ml-auto">
                            {unassignedSites.length}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {unassignedSites.map((site: Site) => renderSiteCard(site))}
                    </div>
                </div>
            )}
        </div>
    );
};
