import React, { useState, useMemo } from 'react';
import { MapPin, Building2, Package, TrendingUp, AlertTriangle, CheckCircle, Search, ArrowRight, LayoutGrid, Layers } from 'lucide-react';
import { Product, Site } from '../types';
import { getLocationStats, findProductsByLocation, parseLocation, getZoneColor } from '../utils/locationTracking';

interface LocationManagementPanelProps {
    products: Product[];
    sites: Site[];
    currentSiteId: string;
}

export default function LocationManagementPanel({ products, sites, currentSiteId }: LocationManagementPanelProps) {
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedAisle, setSelectedAisle] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const currentSite = sites.find(s => s.id === currentSiteId);
    const stats = useMemo(() => getLocationStats(products, currentSiteId), [products, currentSiteId]);

    const zones = Object.keys(stats.zoneDistribution).sort();

    // Filter products for search
    const filteredProducts = useMemo(() => {
        let result = products.filter(p => p.siteId === currentSiteId);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.location && p.location.toLowerCase().includes(q))
            );
        } else if (selectedZone) {
            result = findProductsByLocation(products, currentSiteId, selectedZone, selectedAisle || undefined);
        } else {
            return []; // Show nothing if no zone selected and no search
        }
        return result;
    }, [products, currentSiteId, selectedZone, selectedAisle, searchQuery]);

    const aisles = useMemo(() => {
        if (!selectedZone) return [];
        const zoneProducts = findProductsByLocation(products, currentSiteId, selectedZone);
        const aisleSet = new Set<string>();
        zoneProducts.forEach(product => {
            const location = parseLocation(product.location);
            if (location.isValid) {
                aisleSet.add(location.aisle);
            }
        });
        return Array.from(aisleSet).sort();
    }, [selectedZone, products, currentSiteId]);

    const StatCard = ({ icon: Icon, label, value, color, subValue }: any) => (
        <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] backdrop-blur-sm rounded-xl p-4 flex items-center justify-between group hover:border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)] transition-all">
            <div>
                <p className="text-xs font-medium text-[var(--theme-text-muted)] mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
                    {subValue && <span className="text-xs text-[var(--theme-text-secondary)]">{subValue}</span>}
                </div>
            </div>
            <div className={`p-3 rounded-lg bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] ${color.replace('text-', 'bg-').replace('400', '500')}/20 group-hover:scale-110 transition-transform`}>
                <Icon size={20} className={color} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-cyber-gray/50 backdrop-blur-md border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyber-primary/20 to-[var(--theme-status-info)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shadow-inner">
                        <Building2 className="text-cyber-primary" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">Location Directory</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-muted)] border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                                {currentSite?.type || 'WAREHOUSE'}
                            </span>
                            <span className="text-sm text-[var(--theme-text-muted)]">{currentSite?.name}</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-auto relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="text-[var(--theme-text-secondary)] group-focus-within:text-cyber-primary transition-colors" size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search product, SKU, or bay..."
                        className="w-full md:w-80 bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--theme-text-primary)] focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Package} label="Total Inventory" value={stats.totalProducts} color="text-[var(--theme-text-primary)]" subValue="items" />
                <StatCard icon={CheckCircle} label="Assigned Locations" value={stats.productsWithLocation} color="text-[var(--theme-status-success-text)]" subValue={`${((stats.productsWithLocation / stats.totalProducts) * 100).toFixed(0)}%`} />
                <StatCard icon={AlertTriangle} label="Unassigned" value={stats.productsWithoutLocation} color="text-[var(--theme-status-warning-text)]" subValue="Attn. Req" />
                <StatCard icon={TrendingUp} label="Space Utilization" value={`${stats.utilizationRate.toFixed(1)}%`} color="text-cyber-primary" subValue="capacity" />
            </div>

            {/* Main Content Area - Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">

                {/* Left Panel: Zone Navigation */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-cyber-gray/30 backdrop-blur-md border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl p-4 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MapPin size={14} /> Zone Map
                        </h3>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            {zones.map(zone => {
                                const count = stats.zoneDistribution[zone];
                                const isSelected = selectedZone === zone && !searchQuery;
                                return (
                                    <button
                                        key={zone}
                                        onClick={() => {
                                            setSelectedZone(isSelected ? null : zone);
                                            setSelectedAisle(null);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected
                                            ? 'bg-cyber-primary/10 border-cyber-primary/50 shadow-[0_0_15px_rgba(0,255,157,0.1)]'
                                            : 'bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-cyber-primary text-[var(--theme-text-primary)]' : 'bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-muted)]'
                                                }`}>
                                                {zone}
                                            </div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-muted)]'}`}>Zone {zone}</span>
                                        </div>
                                        <span className="text-xs text-[var(--theme-text-secondary)] font-mono">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content / Aisles / Products */}
                <div className="lg:col-span-9">
                    <div className="bg-cyber-gray/30 backdrop-blur-md border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl h-full overflow-hidden flex flex-col">
                        {/* Toolbar */}
                        {(selectedZone || searchQuery) ? (
                            <div className="p-4 border-b border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {searchQuery ? (
                                        <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                                            <Search size={18} className="text-cyber-primary" />
                                            Search Results: "{searchQuery}"
                                        </h3>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                                                <Layers size={18} className="text-[var(--theme-accent)]" />
                                                Zone {selectedZone}
                                            </h3>
                                            <div className="h-4 w-px bg-[var(--theme-border)]"></div>
                                            <div className="flex gap-2 overflow-x-auto">
                                                <button
                                                    onClick={() => setSelectedAisle(null)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${!selectedAisle ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'}`}
                                                >
                                                    All Aisles
                                                </button>
                                                {aisles.map(aisle => (
                                                    <button
                                                        key={aisle}
                                                        onClick={() => setSelectedAisle(aisle)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${selectedAisle === aisle ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'}`}
                                                    >
                                                        {aisle}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <span className="text-xs text-[var(--theme-text-secondary)] font-mono">{filteredProducts.length} items found</span>
                            </div>
                        ) : (
                            // Empty State
                            <div className="flex-1 flex flex-col items-center justify-center text-[var(--theme-text-secondary)] p-12">
                                <div className="w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] flex items-center justify-center mb-4">
                                    <LayoutGrid size={32} className="opacity-50" />
                                </div>
                                <p className="text-lg font-medium text-[var(--theme-text-muted)]">Select a Zone to view contents</p>
                                <p className="text-sm opacity-50">or use the search bar above</p>
                            </div>
                        )}

                        {/* Product Grid */}
                        {(selectedZone || searchQuery) && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                {filteredProducts.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filteredProducts.map(product => {
                                            const location = parseLocation(product.location);
                                            return (
                                                <div key={product.id} className="p-3 bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] rounded-xl hover:border-cyber-primary/30 transition-all group">
                                                    <div className="flex gap-3">
                                                        <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] rounded-lg shrink-0 overflow-hidden">
                                                            <img src={product.image || '/placeholder.png'} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-[var(--theme-text-primary)] text-sm truncate pr-2" title={product.name}>{product.name}</h4>
                                                                {location.formatted ? (
                                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 whitespace-nowrap">
                                                                        {location.formatted}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">NO LOC</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-[var(--theme-text-secondary)] truncate mt-0.5">{product.sku}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-xs text-[var(--theme-text-muted)]">Stock: <span className="text-[var(--theme-text-primary)] font-mono">{product.stock}</span></span>
                                                                <span className="text-[10px] text-[var(--theme-text-secondary)]">{product.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--theme-text-secondary)]">
                                        <p>No products found in this location.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
