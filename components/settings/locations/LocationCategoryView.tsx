import React from 'react';
import { MapPin } from 'lucide-react';
import type { Site } from '../../../types';

interface CategoryConfig {
    types: string[];
    label: string;
    desc: string;
    dotColor: string;
    shadowColor: string;
}

const LOCATION_CATEGORIES: CategoryConfig[] = [
    {
        types: ['Administration', 'Administrative', 'Central Operations', 'HQ', 'Headquarters'],
        label: 'Administration',
        desc: 'Central Operations',
        dotColor: 'bg-purple-500',
        shadowColor: 'shadow-[0_0_8px_rgba(168,85,247,0.3)]',
    },
    {
        types: ['Warehouse'],
        label: 'Warehouse',
        desc: 'Storage & Fulfillment',
        dotColor: 'bg-blue-500',
        shadowColor: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]',
    },
    {
        types: ['Distribution Center'],
        label: 'Distribution Center',
        desc: 'Regional Hub',
        dotColor: 'bg-cyan-500',
        shadowColor: 'shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    },
    {
        types: ['Store'],
        label: 'Retail Store',
        desc: 'Customer-facing',
        dotColor: 'bg-emerald-600',
        shadowColor: 'shadow-[0_0_8px_rgba(44,94,59,0.3)]',
    },
    {
        types: ['Dark Store'],
        label: 'Online Store',
        desc: 'Online Fulfillment',
        dotColor: 'bg-amber-600',
        shadowColor: 'shadow-[0_0_8px_rgba(217,119,6,0.3)]',
    }
];

interface LocationCategoryViewProps {
    sites: Site[];
    renderSiteCard: (site: Site) => React.ReactNode;
}

export const LocationCategoryView: React.FC<LocationCategoryViewProps> = ({
    sites,
    renderSiteCard
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
            {LOCATION_CATEGORIES.map(cat => {
                const catSites = sites.filter((s: Site) => cat.types.includes(s.type));

                return (
                    <div
                        key={cat.label}
                        className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-[#2C5E3B]/30 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-2 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-2.5">
                            <span className={`w-2 h-2 rounded-full ${cat.dotColor} ${cat.shadowColor} shrink-0`} />
                            <h5 className="text-[#1E3F27] dark:text-white font-black text-xs uppercase tracking-wider truncate" title={cat.label}>
                                {cat.label}s
                            </h5>
                            <span className="text-[10px] text-stone-600 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded-lg border border-[#E2DCCE] dark:border-white/10 font-mono font-bold shrink-0 ml-auto">
                                {catSites.length}
                            </span>
                        </div>

                        {catSites.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                <MapPin size={16} className="text-stone-400 mb-1" />
                                <span className="text-[10px] text-stone-500 italic">No locations</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                {catSites.map((site: Site) => renderSiteCard(site))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
