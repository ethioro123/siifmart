import React from 'react';
import { MapPin, Building2, Warehouse, Store, Home, Navigation, Layers, Grid3X3, ArrowRight } from 'lucide-react';
import { Product, Site } from '../types';
import { getFullLocationInfo, parseLocation, getZoneColor } from '../utils/locationTracking';

interface ProductLocationDisplayProps {
    product?: Product;
    location?: string;
    sites: Site[];
    showFullPath?: boolean;
    size?: 'small' | 'medium' | 'large';
}

/**
 * Premium coordinate badge for Zone, Aisle, or Bay
 */
const CoordBadge = ({ label, value, colorClass, compact = false }: { label: string; value: string; colorClass: string; compact?: boolean }) => {
    const bgPart = colorClass.split(' ')[0] || 'bg-gray-500/20';
    const borderPart = colorClass.split(' ')[2] || 'border-gray-500/30';
    
    return (
        <div className={`flex items-center rounded-2xl overflow-hidden border ${borderPart} dark:border-emerald-950/20 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30`}>
            <div className={`px-3 py-2 ${bgPart} bg-opacity-25 border-r ${borderPart} dark:border-emerald-950/20 flex items-center justify-center min-w-[3.8rem]`}>
                <span className={`font-black uppercase tracking-widest text-[#2C4D35] dark:text-[#A9CBA2] ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{label}</span>
            </div>
            <div className={`px-4 py-2 bg-white/80 dark:bg-[#18201B]/40 backdrop-blur-md flex items-center justify-center min-w-[2.8rem]`}>
                <span className={`font-mono font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-widest ${compact ? 'text-xs' : 'text-sm'}`}>{value}</span>
            </div>
        </div>
    );
};

export default function ProductLocationDisplay({
    product,
    location: locationOverride,
    sites,
    showFullPath = false,
    size = 'medium'
}: ProductLocationDisplayProps) {
    const activeLocation = locationOverride || product?.location;
    const locationInfo = product
        ? getFullLocationInfo(product, sites)
        : activeLocation
            ? {
                location: parseLocation(activeLocation),
                siteName: 'Direct Input',
                siteType: 'N/A',
                siteCode: 'N/A',
                fullPath: activeLocation,
                shortPath: activeLocation
            }
            : null;

    if (!locationInfo) {
        return (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-500 backdrop-blur-sm">
                <MapPin size={16} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Unmapped Segment</span>
            </div>
        );
    }

    const getSiteIcon = () => {
        const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 22;
        switch (locationInfo.siteType) {
            case 'Warehouse':
            case 'Distribution Center':
                return <Warehouse size={iconSize} />;
            case 'Store':
            case 'Dark Store':
                return <Store size={iconSize} />;
            case 'Headquarters':
            case 'Administration':
                return <Building2 size={iconSize} />;
            default:
                return <Home size={iconSize} />;
        }
    };

    const zoneColor = locationInfo.location.isValid
        ? getZoneColor(locationInfo.location.zone)
        : 'bg-gray-500/20 text-gray-400 border-gray-500/50';

    if (size === 'small') {
        return (
            <div className="flex items-center gap-2 group cursor-pointer">
                {locationInfo.location.isValid ? (
                    <div className="flex items-center bg-white/80 dark:bg-[#18201B]/55 backdrop-blur-xl border border-[#E2DCCE] dark:border-[#A9CBA2]/10 rounded-xl overflow-hidden shadow-md hover:border-[#2C5E3B]/30 transition-all">
                        <div className={`px-2 py-1.5 ${zoneColor.split(' ')[0]} bg-opacity-20 border-r border-[#E2DCCE] dark:border-emerald-950/15 flex items-center gap-1.5`}>
                            <span className="text-[8px] font-black text-stone-400 dark:text-white/40 uppercase tracking-tighter">Zone</span>
                            <span className="text-[10px] font-black text-[#1E3F27] dark:text-white font-mono">{locationInfo.location.zone}</span>
                        </div>
                        <div className="px-2.5 py-1.5 flex items-center gap-2.5">
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-tighter">Aisle</span>
                                <span className="text-[10px] font-mono font-black text-[#1E3F27] dark:text-[#EAE5D9]">{locationInfo.location.aisle}</span>
                            </div>
                            <div className="w-px h-3 bg-[#E2DCCE] dark:bg-[#A9CBA2]/10" />
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-tighter">Bay</span>
                                <span className="text-[10px] font-mono font-black text-[#1E3F27] dark:text-[#EAE5D9]">{locationInfo.location.bay}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-3 py-1.5 bg-white/80 dark:bg-[#18201B]/55 border border-[#E2DCCE] dark:border-[#A9CBA2]/10 rounded-xl flex items-center gap-2 shadow-sm">
                        <div className="p-1 bg-[#2C5E3B]/10 rounded shadow-inner text-[#2C5E3B] dark:text-[#A9CBA2]">{getSiteIcon()}</div>
                        <span className="text-[10px] font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">{locationInfo.shortPath}</span>
                    </div>
                )}
            </div>
        );
    }

    if (showFullPath || size === 'large') {
        return (
            <div className="relative group max-w-2xl">
                {/* Visual Ambient Glow */}
                <div className={`absolute -top-4 -left-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${zoneColor.split(' ')[0]}`} />

                <div className="relative bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[2rem] overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] backdrop-blur-2xl transition-all duration-300">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-gray-50/50 dark:from-white/5 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/90 dark:bg-black/25 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm group-hover:text-blue-400 transition-colors">
                                {getSiteIcon()}
                            </div>
                            <div>
                                <h4 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-tight leading-none mb-1.5">{locationInfo.siteName}</h4>
                                <div className="flex items-center gap-2 opacity-60">
                                    <span className="text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-[0.2em]">{locationInfo.siteType}</span>
                                    <ArrowRight size={10} className="text-gray-400 dark:text-gray-600" />
                                    <span className="text-[10px] font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-black">{locationInfo.siteCode}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full border border-emerald-500/20 text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <Navigation size={18} />
                        </div>
                    </div>

                    {/* Main Display */}
                    <div className="p-8">
                        {locationInfo.location.isValid ? (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    <CoordBadge label="Zone" value={locationInfo.location.zone} colorClass={zoneColor} />
                                    <CoordBadge label="Aisle" value={locationInfo.location.aisle} colorClass="bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border-indigo-500/30" />
                                    <CoordBadge label="Bay" value={locationInfo.location.bay} colorClass="bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 border-cyan-500/30" />
                                </div>

                                <div className="relative p-5 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Layers size={14} className="text-emerald-500/50" />
                                        <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">Full System Orientation</span>
                                    </div>
                                    <p className="text-xs font-mono font-bold text-[#1E3F27] dark:text-gray-300 uppercase tracking-widest leading-relaxed">
                                        {locationInfo.fullPath.split(' > ').map((part, i, arr) => (
                                            <React.Fragment key={part}>
                                                <span className={i === arr.length - 1 ? 'text-gray-900 dark:text-white font-black' : ''}>{part}</span>
                                                {i < arr.length - 1 && <span className="mx-2 text-gray-300 dark:text-gray-700">/</span>}
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl flex flex-col items-center text-center">
                                <Grid3X3 size={48} className="text-yellow-500/20 mb-4" />
                                <h5 className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.4em] mb-4">Manual Location Override</h5>
                                <div className="px-6 py-3 bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl">
                                    <span className="text-2xl font-mono font-black text-gray-900 dark:text-white tracking-widest">{activeLocation || 'MISSING'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Medium size (default / popup style)
    return (
        <div className="flex items-center gap-2 group">
            <div className={`p-4 rounded-[2rem] border border-[#E2DCCE] dark:border-emerald-950/25 bg-white/85 dark:bg-[#18201B]/55 backdrop-blur-2xl shadow-xl hover:shadow-2xl group-hover:scale-[1.02] transition-all cursor-pointer`}>
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center border-r border-[#E2DCCE] dark:border-[#A9CBA2]/10 pr-5">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2C5E3B] dark:text-[#A9CBA2] mb-2.5">Zone</span>
                        <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-black/35 flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                            <span className="text-2xl font-mono font-black text-[#1E3F27] dark:text-white">{locationInfo.location.zone || '?'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-1">Aisle</span>
                                <div className="px-3.5 py-2 bg-white/90 dark:bg-black/35 rounded-xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                                    <span className="font-mono text-sm font-black text-gray-800 dark:text-[#EAE5D9]">{locationInfo.location.aisle || '--'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-1">Bay</span>
                                <div className="px-3.5 py-2 bg-white/90 dark:bg-black/35 rounded-xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                                    <span className="font-mono text-sm font-black text-gray-800 dark:text-[#EAE5D9]">{locationInfo.location.bay || '--'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <div className="text-[#2C5E3B] dark:text-[#A9CBA2]">{getSiteIcon()}</div>
                            <p className="text-[9px] font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-[0.15em] truncate w-28">{locationInfo.siteName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact version for tables (highly polished, clean design)
export function CompactLocationDisplay({ product, sites }: { product: Product; sites: Site[] }) {
    const locationInfo = getFullLocationInfo(product, sites);

    if (!locationInfo) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-500/5 text-gray-400 text-[9px] font-black uppercase rounded-lg border border-gray-200 dark:border-white/5 opacity-50 tracking-wider">
                Unlinked
            </span>
        );
    }

    const zoneColor = locationInfo.location.isValid
        ? getZoneColor(locationInfo.location.zone)
        : 'bg-gray-500/20 text-gray-400 border-gray-500/50';

    return (
        <div className="flex items-center gap-2">
            {locationInfo.location.isValid ? (
                <div className="flex items-center bg-white/75 dark:bg-[#18201B]/40 backdrop-blur-xl border border-[#E2DCCE] dark:border-emerald-950/25 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(44,94,59,0.02)] hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 transition-all select-none">
                    {/* Zone Mini-Badge */}
                    <div className={`px-3 py-2 ${zoneColor.split(' ')[0]} bg-opacity-20 border-r border-[#E2DCCE] dark:border-emerald-950/25 flex items-center gap-1.5`}>
                        <span className="text-[8px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">Zone</span>
                        <span className="text-xs font-black text-[#1E3F27] dark:text-white font-mono leading-none">{locationInfo.location.zone}</span>
                    </div>
                    {/* Aisle & Bay */}
                    <div className="px-3.5 py-2 flex items-center gap-4">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Aisle</span>
                            <span className="text-xs font-mono font-black text-gray-800 dark:text-[#EAE5D9] leading-none">{locationInfo.location.aisle}</span>
                        </div>
                        <div className="w-px h-3.5 bg-[#E2DCCE] dark:bg-emerald-950/25" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Bay</span>
                            <span className="text-xs font-mono font-black text-gray-800 dark:text-[#EAE5D9] leading-none">{locationInfo.location.bay}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <div className="px-3 py-1.5 bg-[#FAF8F5]/80 dark:bg-black/25 border border-[#E2DCCE] dark:border-[#A9CBA2]/10 rounded-xl shadow-sm flex items-center gap-1.5">
                        <MapPin size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="text-[10px] font-mono font-black text-gray-900 dark:text-white tracking-widest">
                            {product?.location || 'DIRECT'}
                        </span>
                    </div>
                    {locationInfo.siteCode && (
                        <span className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.25em] ml-1.5">{locationInfo.siteCode}</span>
                    )}
                </div>
            )}
        </div>
    );
}
