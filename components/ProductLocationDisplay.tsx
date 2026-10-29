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
    const bgPart = colorClass.split(' ')[0] || 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_20%,transparent)]';
    const borderPart = colorClass.split(' ')[2] || 'border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)]';

    return (
        <div className={`flex items-center rounded-2xl overflow-hidden border ${borderPart} border-[var(--theme-status-success-border)] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-[var(--theme-border)]/40 dark:hover:border-[var(--theme-border)]/30`}>
            <div className={`px-3 py-2 ${bgPart} bg-opacity-25 border-r ${borderPart} border-[var(--theme-status-success-border)] flex items-center justify-center min-w-[3.8rem]`}>
                <span className={`font-black uppercase tracking-widest text-[var(--theme-text-primary)] ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{label}</span>
            </div>
            <div className={`px-4 py-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] dark:bg-[var(--theme-bg-panel)]/40 backdrop-blur-md flex items-center justify-center min-w-[2.8rem]`}>
                <span className={`font-mono font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] tracking-widest ${compact ? 'text-xs' : 'text-sm'}`}>{value}</span>
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
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-2xl text-[var(--theme-status-danger-text)] backdrop-blur-sm">
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
        : 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_20%,transparent)] text-[var(--theme-text-muted)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]';

    if (size === 'small') {
        return (
            <div className="flex items-center gap-2 group cursor-pointer">
                {locationInfo.location.isValid ? (
                    <div className="flex items-center bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] dark:bg-[var(--theme-bg-panel)]/55 backdrop-blur-xl border border-[var(--theme-border)] dark:border-[var(--theme-border)]/10 rounded-xl overflow-hidden shadow-md hover:border-[var(--theme-border)]/30 transition-all">
                        <div className={`px-2 py-1.5 ${zoneColor.split(' ')[0]} bg-opacity-20 border-r border-[var(--theme-border)] border-[var(--theme-status-success-border)] flex items-center gap-1.5`}>
                            <span className="text-[8px] font-black text-[var(--theme-text-muted)] text-[color-mix(in_srgb,var(--theme-text-primary)_40%,transparent)] uppercase tracking-tighter">Zone</span>
                            <span className="text-[10px] font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-mono">{locationInfo.location.zone}</span>
                        </div>
                        <div className="px-2.5 py-1.5 flex items-center gap-2.5">
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-tighter">Aisle</span>
                                <span className="text-[10px] font-mono font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{locationInfo.location.aisle}</span>
                            </div>
                            <div className="w-px h-3 bg-[var(--theme-bg-app)] dark:bg-[var(--theme-primary-muted)]/10" />
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-tighter">Bay</span>
                                <span className="text-[10px] font-mono font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{locationInfo.location.bay}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-3 py-1.5 bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] dark:bg-[var(--theme-bg-panel)]/55 border border-[var(--theme-border)] dark:border-[var(--theme-border)]/10 rounded-xl flex items-center gap-2 shadow-sm">
                        <div className="p-1 bg-[var(--theme-primary)]/10 rounded shadow-inner text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">{getSiteIcon()}</div>
                        <span className="text-[10px] font-extrabold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] tracking-tight">{locationInfo.shortPath}</span>
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

                <div className="relative bg-[color-mix(in_srgb,var(--theme-bg-card)_85%,transparent)] dark:bg-[var(--theme-bg-panel)]/60 border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-[2rem] overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] backdrop-blur-2xl transition-all duration-300">
                    {/* Header */}
                    <div className="p-6 border-b border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-gradient-to-b from-[var(--theme-accent)] from-[var(--theme-accent)] to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] rounded-2xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] shadow-sm text-[var(--theme-status-info-text)] transition-colors">
                                {getSiteIcon()}
                            </div>
                            <div>
                                <h4 className="text-base font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] uppercase tracking-tight leading-none mb-1.5">{locationInfo.siteName}</h4>
                                <div className="flex items-center gap-2 opacity-60">
                                    <span className="text-[10px] font-black text-[var(--theme-text-secondary)] uppercase tracking-[0.2em]">{locationInfo.siteType}</span>
                                    <ArrowRight size={10} className="text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)]" />
                                    <span className="text-[10px] font-mono text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-black">{locationInfo.siteCode}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] rounded-full border border-[var(--theme-status-success-border)] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                            <Navigation size={18} />
                        </div>
                    </div>

                    {/* Main Display */}
                    <div className="p-8">
                        {locationInfo.location.isValid ? (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    <CoordBadge label="Zone" value={locationInfo.location.zone} colorClass={zoneColor} />
                                    <CoordBadge label="Aisle" value={locationInfo.location.aisle} colorClass="bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border-[var(--theme-border-accent)]" />
                                    <CoordBadge label="Bay" value={locationInfo.location.bay} colorClass="bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]" />
                                </div>

                                <div className="relative p-5 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] rounded-2xl border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Layers size={14} className="text-[var(--theme-status-success-text)]" />
                                        <span className="text-[10px] font-black text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-[0.3em]">Full System Orientation</span>
                                    </div>
                                    <p className="text-xs font-mono font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] uppercase tracking-widest leading-relaxed">
                                        {locationInfo.fullPath.split(' > ').map((part, i, arr) => (
                                            <React.Fragment key={part}>
                                                <span className={i === arr.length - 1 ? 'text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-black' : ''}>{part}</span>
                                                {i < arr.length - 1 && <span className="mx-2 text-[var(--theme-text-muted)] text-[var(--theme-text-primary)]">/</span>}
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex flex-col items-center text-center">
                                <Grid3X3 size={48} className="text-[var(--theme-status-warning-text)] mb-4" />
                                <h5 className="text-[10px] font-black text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] uppercase tracking-[0.4em] mb-4">Manual Location Override</h5>
                                <div className="px-6 py-3 bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-2xl">
                                    <span className="text-2xl font-mono font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] tracking-widest">{activeLocation || 'MISSING'}</span>
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
            <div className={`p-4 rounded-[2rem] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] bg-[color-mix(in_srgb,var(--theme-bg-card)_85%,transparent)] dark:bg-[var(--theme-bg-panel)]/55 backdrop-blur-2xl shadow-xl hover:shadow-2xl group-hover:scale-[1.02] transition-all cursor-pointer`}>
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center border-r border-[var(--theme-border)] dark:border-[var(--theme-border)]/10 pr-5">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] mb-2.5">Zone</span>
                        <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] flex items-center justify-center border border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-sm">
                            <span className="text-2xl font-mono font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">{locationInfo.location.zone || '?'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-[0.2em] mb-1">Aisle</span>
                                <div className="px-3.5 py-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] rounded-xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-sm">
                                    <span className="font-mono text-sm font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{locationInfo.location.aisle || '--'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-[0.2em] mb-1">Bay</span>
                                <div className="px-3.5 py-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_90%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_90%,transparent)] rounded-xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-sm">
                                    <span className="font-mono text-sm font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{locationInfo.location.bay || '--'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <div className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">{getSiteIcon()}</div>
                            <p className="text-[9px] font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] uppercase tracking-[0.15em] truncate w-28">{locationInfo.siteName}</p>
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_5%,transparent)] text-[var(--theme-text-muted)] text-[9px] font-black uppercase rounded-lg border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] opacity-50 tracking-wider">
                Unlinked
            </span>
        );
    }

    const zoneColor = locationInfo.location.isValid
        ? getZoneColor(locationInfo.location.zone)
        : 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_20%,transparent)] text-[var(--theme-text-muted)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]';

    return (
        <div className="flex items-center gap-2">
            {locationInfo.location.isValid ? (
                <div className="flex items-center bg-[color-mix(in_srgb,var(--theme-bg-card)_75%,transparent)] dark:bg-[var(--theme-bg-panel)]/40 backdrop-blur-xl border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(44,94,59,0.02)] hover:border-[var(--theme-border)]/40 dark:hover:border-[var(--theme-border)]/30 transition-all select-none">
                    {/* Zone Mini-Badge */}
                    <div className={`px-3 py-2 ${zoneColor.split(' ')[0]} bg-opacity-20 border-r border-[var(--theme-border)] border-[var(--theme-status-success-border)] flex items-center gap-1.5`}>
                        <span className="text-[8px] font-black text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] uppercase tracking-widest">Zone</span>
                        <span className="text-xs font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-mono leading-none">{locationInfo.location.zone}</span>
                    </div>
                    {/* Aisle & Bay */}
                    <div className="px-3.5 py-2 flex items-center gap-4">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[8px] font-black text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-widest">Aisle</span>
                            <span className="text-xs font-mono font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] leading-none">{locationInfo.location.aisle}</span>
                        </div>
                        <div className="w-px h-3.5 bg-[var(--theme-bg-app)] bg-[var(--theme-status-success-bg)]" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-[8px] font-black text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-widest">Bay</span>
                            <span className="text-xs font-mono font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] leading-none">{locationInfo.location.bay}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <div className="px-3 py-1.5 bg-[var(--theme-bg-app)]/80 bg-[color-mix(in_srgb,var(--theme-overlay)_25%,transparent)] border border-[var(--theme-border)] dark:border-[var(--theme-border)]/10 rounded-xl shadow-sm flex items-center gap-1.5">
                        <MapPin size={10} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
                        <span className="text-[10px] font-mono font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] tracking-widest">
                            {product?.location || 'DIRECT'}
                        </span>
                    </div>
                    {locationInfo.siteCode && (
                        <span className="text-[8px] font-black text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase tracking-[0.25em] ml-1.5">{locationInfo.siteCode}</span>
                    )}
                </div>
            )}
        </div>
    );
}
