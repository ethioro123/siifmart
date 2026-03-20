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
const CoordBadge = ({ label, value, colorClass, compact = false }: { label: string; value: string; colorClass: string; compact?: boolean }) => (
    <div className={`flex items-center rounded-xl overflow-hidden border ${colorClass.split(' ')[2]} shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}>
        <div className={`px-2.5 py-1.5 ${colorClass.split(' ')[0]} bg-opacity-30 border-r ${colorClass.split(' ')[2]} flex items-center justify-center min-w-[3.5rem]`}>
            <span className={`font-black uppercase tracking-widest opacity-90 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{label}</span>
        </div>
        <div className={`px-3 py-1.5 bg-black/40 backdrop-blur-md flex items-center justify-center min-w-[2.5rem]`}>
            <span className={`font-mono font-black text-white tracking-widest ${compact ? 'text-xs' : 'text-sm'}`}>{value}</span>
        </div>
    </div>
);

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
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 backdrop-blur-sm">
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
                    <div className="flex items-center bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl hover:border-blue-500/30 transition-all">
                        <div className={`px-2 py-1 ${zoneColor.split(' ')[0]} bg-opacity-40 border-r border-white/10 flex items-center gap-1.5`}>
                            <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter">Zone</span>
                            <span className="text-[10px] font-black text-white font-mono">{locationInfo.location.zone}</span>
                        </div>
                        <div className="px-2 py-1 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Aisle</span>
                                <span className="text-[10px] font-mono font-black text-white">{locationInfo.location.aisle}</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Bay</span>
                                <span className="text-[10px] font-mono font-black text-white">{locationInfo.location.bay}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                        <div className="p-1 bg-blue-500/20 rounded shadow-inner text-blue-400">{getSiteIcon()}</div>
                        <span className="text-[10px] font-bold text-gray-400 tracking-tight">{locationInfo.shortPath}</span>
                    </div>
                )}
            </div>
        );
    }

    if (showFullPath || size === 'large') {
        return (
            <div className="relative group max-w-2xl">
                {/* Visual Accent */}
                <div className={`absolute -top-4 -left-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${zoneColor.split(' ')[0]}`} />

                <div className="relative bg-[#0A0A0B]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-blue-400 shadow-xl group-hover:text-blue-300 transition-colors">
                                {getSiteIcon()}
                            </div>
                            <div>
                                <h4 className="text-base font-black text-white uppercase tracking-tight leading-none mb-1.5">{locationInfo.siteName}</h4>
                                <div className="flex items-center gap-2 opacity-60">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{locationInfo.siteType}</span>
                                    <ArrowRight size={10} className="text-gray-600" />
                                    <span className="text-[10px] font-mono text-blue-400 font-black">{locationInfo.siteCode}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 animate-pulse">
                            <Navigation size={18} />
                        </div>
                    </div>

                    {/* Main Display */}
                    <div className="p-8">
                        {locationInfo.location.isValid ? (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    <CoordBadge label="Zone" value={locationInfo.location.zone} colorClass={zoneColor} />
                                    <CoordBadge label="Aisle" value={locationInfo.location.aisle} colorClass="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" />
                                    <CoordBadge label="Bay" value={locationInfo.location.bay} colorClass="bg-cyan-500/20 text-cyan-400 border-cyan-500/30" />
                                </div>

                                <div className="relative p-5 bg-[#0D0D0F] rounded-[2rem] border border-white/5 group-hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Layers size={14} className="text-blue-500/50" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Full System Orientation</span>
                                    </div>
                                    <p className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest leading-relaxed">
                                        {locationInfo.fullPath.split(' > ').map((part, i, arr) => (
                                            <React.Fragment key={part}>
                                                <span className={i === arr.length - 1 ? 'text-white font-black' : ''}>{part}</span>
                                                {i < arr.length - 1 && <span className="mx-2 text-gray-700">/</span>}
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-yellow-500/5 border border-yellow-500/10 rounded-[2rem] flex flex-col items-center text-center">
                                <Grid3X3 size={48} className="text-yellow-500/20 mb-4" />
                                <h5 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-4">Manual Location Override</h5>
                                <div className="px-6 py-3 bg-black/40 border border-white/5 rounded-2xl">
                                    <span className="text-2xl font-mono font-black text-white tracking-widest">{activeLocation || 'MISSING'}</span>
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
            <div className={`p-3 rounded-[2rem] border ${zoneColor} bg-white/[0.03] backdrop-blur-2xl shadow-2xl group-hover:scale-105 transition-all cursor-pointer`}>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center border-r border-white/10 pr-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/80 mb-1.5">Zone</span>
                        <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5">
                            <span className="text-2xl font-mono font-black text-white">{locationInfo.location.zone || '?'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Aisle</span>
                                <div className="px-2.5 py-1 bg-black/40 rounded-lg border border-white/5">
                                    <span className="font-mono text-sm font-black text-white">{locationInfo.location.aisle || '--'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Bay</span>
                                <div className="px-2.5 py-1 bg-black/40 rounded-lg border border-white/5">
                                    <span className="font-mono text-sm font-black text-white">{locationInfo.location.bay || '--'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-40">
                            {getSiteIcon()}
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] truncate w-28">{locationInfo.siteName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact version for tables
export function CompactLocationDisplay({ product, sites }: { product: Product; sites: Site[] }) {
    const locationInfo = getFullLocationInfo(product, sites);

    if (!locationInfo) {
        return <span className="px-3 py-1 bg-gray-500/5 text-gray-500 text-[9px] font-black uppercase rounded-full border border-white/5 opacity-50">Unlinked</span>;
    }

    const zoneColor = locationInfo.location.isValid
        ? getZoneColor(locationInfo.location.zone)
        : 'bg-gray-500/20 text-gray-400 border-gray-500/50';

    return (
        <div className="flex items-center gap-2">
            {locationInfo.location.isValid ? (
                <div className="flex items-center bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl group hover:border-blue-500/30 transition-all">
                    {/* Zone Mini-Badge */}
                    <div className={`px-2.5 py-1.5 ${zoneColor.split(' ')[0]} bg-opacity-30 border-r border-white/10 flex items-center gap-1.5`}>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">Zone</span>
                        <span className="text-[10px] font-black text-white font-mono">{locationInfo.location.zone}</span>
                    </div>
                    {/* Aisle & Bay Verbose */}
                    <div className="px-3 py-1.5 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black text-gray-600 uppercase">Aisle</span>
                            <span className="text-[10px] font-mono font-black text-white">{locationInfo.location.aisle}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black text-gray-600 uppercase">Bay</span>
                            <span className="text-[10px] font-mono font-black text-white">{locationInfo.location.bay}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-0.5">
                    <div className="px-2.5 py-1 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                        <span className="text-[10px] font-mono font-black text-yellow-500 uppercase tracking-widest">
                            {product?.location || 'DIRECT'}
                        </span>
                    </div>
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">{locationInfo.siteCode}</span>
                </div>
            )}
        </div>
    );
}
