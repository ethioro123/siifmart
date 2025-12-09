/**
 * Network Map Component
 * Interactive map showing all sites with Leaflet
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Site, Product } from '../types';
import { Building, Store, Package, AlertTriangle, MapPin } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface NetworkMapProps {
    sites: Site[];
    products: Product[];
    onSiteClick?: (site: Site) => void;
}

// Component to fit bounds to all markers
function FitBounds({ sites }: { sites: Site[] }) {
    const map = useMap();

    useEffect(() => {
        if (sites.length > 0) {
            const bounds = sites
                .filter(s => s.latitude && s.longitude)
                .map(s => [s.latitude!, s.longitude!] as [number, number]);

            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [sites, map]);

    return null;
}

export default function NetworkMap({ sites, products, onSiteClick }: NetworkMapProps) {
    // Calculate site metrics
    const siteMetrics = sites.map(site => {
        const siteProducts = products.filter(p => p.siteId === site.id || p.site_id === site.id);
        const totalValue = siteProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const lowStockCount = siteProducts.filter(p => p.stock < 10).length;
        const outOfStockCount = siteProducts.filter(p => p.stock === 0).length;

        return {
            site,
            totalValue,
            productCount: siteProducts.length,
            lowStockCount,
            outOfStockCount,
            hasAlerts: lowStockCount > 0 || outOfStockCount > 0
        };
    });

    // Filter sites with coordinates
    const mappableSites = siteMetrics.filter(m => m.site.latitude && m.site.longitude);

    // Default center (if no sites have coordinates, center on a default location)
    const defaultCenter: [number, number] = [0, 0];
    const center: [number, number] = mappableSites.length > 0
        ? [mappableSites[0].site.latitude!, mappableSites[0].site.longitude!]
        : defaultCenter;

    // Create custom icons
    const createIcon = (type: string, hasAlerts: boolean) => {
        const color = hasAlerts ? '#ef4444' : type === 'Store' ? '#10b981' : '#3b82f6';
        const letter = type === 'Store' ? 'S' : type === 'Headquarters' ? 'H' : 'W';
        const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
          ${letter}
        </text>
      </svg>
    `;

        return new Icon({
            iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    };

    if (mappableSites.length === 0) {
        return (
            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Location Data</h3>
                <p className="text-gray-400">
                    Sites need latitude and longitude coordinates to be displayed on the map.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Add coordinates in Settings → Sites to enable map view.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden h-[600px]">
            <MapContainer
                center={center}
                zoom={6}
                className="z-0 h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds sites={mappableSites.map(m => m.site)} />

                {mappableSites.map(({ site, totalValue, productCount, lowStockCount, outOfStockCount, hasAlerts }) => (
                    <Marker
                        key={site.id}
                        position={[site.latitude!, site.longitude!]}
                        icon={createIcon(site.type, hasAlerts)}
                        eventHandlers={{
                            click: () => onSiteClick?.(site)
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 min-w-[250px]">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                    {site.type === 'Warehouse' ? (
                                        <Building className="text-blue-500" size={20} />
                                    ) : (
                                        <Store className="text-green-500" size={20} />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900">{site.name}</h3>
                                        <p className="text-xs text-gray-500">{site.address}</p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Products</p>
                                        <p className="text-lg font-bold text-gray-900">{productCount}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Value</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {CURRENCY_SYMBOL}{(totalValue / 1000).toFixed(0)}K
                                        </p>
                                    </div>
                                </div>

                                {/* Alerts */}
                                {hasAlerts && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
                                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                        <div className="text-xs">
                                            {outOfStockCount > 0 && (
                                                <p className="text-red-700 font-bold">{outOfStockCount} out of stock</p>
                                            )}
                                            {lowStockCount > 0 && (
                                                <p className="text-orange-700">{lowStockCount} low stock</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${site.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        site.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {site.status}
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                <p className="text-xs font-bold text-gray-700 mb-2">Legend</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600">Warehouse</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-600">Store</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-xs text-gray-600">Has Alerts</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
