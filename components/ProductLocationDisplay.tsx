import React from 'react';
import { MapPin, Building2, Warehouse, Store, Home } from 'lucide-react';
import { Product, Site } from '../types';
import { getFullLocationInfo, parseLocation, getZoneColor } from '../utils/locationTracking';

interface ProductLocationDisplayProps {
    product: Product;
    sites: Site[];
    showFullPath?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export default function ProductLocationDisplay({
    product,
    sites,
    showFullPath = false,
    size = 'medium'
}: ProductLocationDisplayProps) {
    const locationInfo = getFullLocationInfo(product, sites);

    if (!locationInfo) {
        return (
            <div className="flex items-center gap-2 text-red-400">
                <MapPin size={16} />
                <span className="text-sm">Unknown Location</span>
            </div>
        );
    }

    const getSiteIcon = () => {
        switch (locationInfo.siteType) {
            case 'Warehouse':
            case 'Distribution Center':
                return <Warehouse size={size === 'small' ? 14 : size === 'medium' ? 16 : 20} />;
            case 'Store':
            case 'Dark Store':
                return <Store size={size === 'small' ? 14 : size === 'medium' ? 16 : 20} />;
            case 'Headquarters':
            case 'Administration':
                return <Building2 size={size === 'small' ? 14 : size === 'medium' ? 16 : 20} />;
            default:
                return <Home size={size === 'small' ? 14 : size === 'medium' ? 16 : 20} />;
        }
    };

    const zoneColor = locationInfo.location.isValid
        ? getZoneColor(locationInfo.location.zone)
        : 'bg-gray-500/20 text-gray-400 border-gray-500/50';

    if (size === 'small') {
        return (
            <div className="flex items-center gap-1.5 text-xs">
                {getSiteIcon()}
                <span className="text-gray-300">{locationInfo.shortPath}</span>
            </div>
        );
    }

    if (showFullPath) {
        return (
            <div className="space-y-2">
                {/* Site Information */}
                <div className="flex items-center gap-2">
                    {getSiteIcon()}
                    <div>
                        <p className="font-bold text-white">{locationInfo.siteName}</p>
                        <p className="text-xs text-gray-400">
                            {locationInfo.siteType} • Code: {locationInfo.siteCode}
                        </p>
                    </div>
                </div>

                {/* Location Breadcrumb */}
                {locationInfo.location.isValid && (
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-cyber-primary" />
                        <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded border ${zoneColor} font-mono font-bold`}>
                                Zone {locationInfo.location.zone}
                            </span>
                            <span className="text-gray-500">›</span>
                            <span className="text-gray-300">
                                Aisle {locationInfo.location.aisle}
                            </span>
                            <span className="text-gray-500">›</span>
                            <span className="text-gray-300">
                                Bin {locationInfo.location.bin}
                            </span>
                        </div>
                    </div>
                )}

                {/* Full Path */}
                <div className="text-xs text-gray-500 font-mono">
                    {locationInfo.fullPath}
                </div>
            </div>
        );
    }

    // Medium size (default)
    return (
        <div className="flex items-center gap-3">
            {/* Site Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                {getSiteIcon()}
                <div>
                    <p className="text-xs font-bold text-white">{locationInfo.siteName}</p>
                    <p className="text-[10px] text-gray-400">{locationInfo.siteType}</p>
                </div>
            </div>

            {/* Location Badge */}
            {locationInfo.location.isValid ? (
                <div className={`px-3 py-1.5 rounded-lg border ${zoneColor}`}>
                    <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        <span className="font-mono text-sm font-bold">
                            {locationInfo.location.formatted}
                        </span>
                    </div>
                    <p className="text-[10px] opacity-75 mt-0.5">
                        Zone {locationInfo.location.zone} • Aisle {locationInfo.location.aisle} • Bin {locationInfo.location.bin}
                    </p>
                </div>
            ) : (
                <div className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-lg">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        <span className="text-sm font-bold">
                            {product.location || 'Unassigned'}
                        </span>
                    </div>
                    <p className="text-[10px] opacity-75 mt-0.5">
                        Invalid format
                    </p>
                </div>
            )}
        </div>
    );
}

// Compact version for tables
export function CompactLocationDisplay({ product, sites }: { product: Product; sites: Site[] }) {
    const locationInfo = getFullLocationInfo(product, sites);

    if (!locationInfo) {
        return <span className="text-red-400 text-xs">Unknown</span>;
    }

    const zoneColor = locationInfo.location.isValid
        ? getZoneColor(locationInfo.location.zone)
        : 'bg-gray-500/20 text-gray-400 border-gray-500/50';

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">{locationInfo.siteName}</span>
            {locationInfo.location.isValid ? (
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${zoneColor} w-fit`}>
                    📍 {locationInfo.location.formatted}
                </span>
            ) : (
                <span className="text-xs text-yellow-400">
                    {product.location || 'Unassigned'}
                </span>
            )}
        </div>
    );
}
