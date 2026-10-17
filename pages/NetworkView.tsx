import React, { useState, useMemo, useEffect } from 'react';
import {
    Building, Store, Package, AlertTriangle, Search
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../constants';
import { Product } from '../types';
import { formatCompactNumber } from '../utils/formatting';
import { NetworkKPIDeck } from '../components/network/NetworkKPIDeck';
import { NetworkSiteCard } from '../components/network/NetworkSiteCard';
import { ProductNetworkStockModal } from '../components/network/ProductNetworkStockModal';
import { productsService } from '../services/products.service';
import { RegionalScopeBanner } from '../components/regional-ops/RegionalScopeBanner';

export default function NetworkInventory() {
    const { sites, allProducts } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'WAREHOUSE' | 'STORE' | 'LOW_STOCK'>('ALL');
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [siteProductPages, setSiteProductPages] = useState<Record<string, number>>({});
    const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
    const [serverSearchResults, setServerSearchResults] = useState<Product[]>([]);

    // RULE 10: On-demand cross-network search capped at 25 records
    useEffect(() => {
        if (!searchTerm || searchTerm.trim().length < 2) {
            setServerSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await productsService.getAll(undefined, 25, 0, { search: searchTerm.trim() }, undefined, false);
                setServerSearchResults(res.data || []);
            } catch {
                // Fall back to local cache
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const getPageForSite = (siteId: string) => siteProductPages[siteId] || 1;
    const setPageForSite = (siteId: string, page: number) => {
        setSiteProductPages(prev => ({ ...prev, [siteId]: page }));
    };

    // Calculate inventory metrics per site (exclude Admin sites)
    const siteInventory = useMemo(() => {
        const inventorySites = sites.filter(s => {
            const isOperationalType = ['Warehouse', 'Distribution Center', 'Store', 'Dark Store', 'Retail'].includes(s.type);
            if (isOperationalType) return true;

            const isAdminByType = s.type === 'Administration' || s.type === 'Administrative';
            const isAdminByName = s.name?.toLowerCase().includes('admin') ||
                s.name?.toLowerCase().includes('headquarters') ||
                s.name?.toLowerCase().includes('administrative');
            return !isAdminByType && !isAdminByName;
        });

        return inventorySites.map(site => {
            const siteProducts = allProducts.filter(p =>
                (p.siteId === site.id || p.site_id === site.id) &&
                (p.status || (p as any).status) !== 'archived'
            );
            const totalValueRetail = siteProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
            const totalValueCost = siteProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || p.price * 0.7)), 0);
            const totalItems = siteProducts.reduce((sum, p) => sum + p.stock, 0);
            const lowStockItems = siteProducts.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10)).length;
            const outOfStockItems = siteProducts.filter(p => p.stock <= 0).length;
            const categories = [...new Set(siteProducts.map(p => p.category))];

            return {
                site,
                products: siteProducts,
                metrics: {
                    totalValue: totalValueCost,
                    totalValueRetail,
                    totalItems,
                    uniqueProducts: siteProducts.length,
                    lowStockItems,
                    outOfStockItems,
                    categories: categories.length
                }
            };
        });
    }, [sites, allProducts]);

    // Total counts
    const totalWarehouses = siteInventory.filter(inv => inv.site.type === 'Warehouse' || inv.site.type === 'Distribution Center').length;
    const totalStores = siteInventory.filter(inv => inv.site.type === 'Store' || inv.site.type === 'Dark Store').length;
    const totalNetworkProducts = siteInventory.reduce((sum, inv) => sum + inv.metrics.uniqueProducts, 0);
    const totalNetworkAssetValue = siteInventory.reduce((sum, inv) => sum + inv.metrics.totalValue, 0);
    const totalPotentialRevenue = siteInventory.reduce((sum, inv) => sum + inv.metrics.totalValueRetail, 0);
    const totalLowStockAlerts = siteInventory.reduce((sum, inv) => sum + inv.metrics.lowStockItems + inv.metrics.outOfStockItems, 0);
    const totalNetworkUnits = siteInventory.reduce((sum, inv) => sum + inv.metrics.totalItems, 0);

    // Unique catalog SKUs across the active network
    const uniqueNetworkSKUs = useMemo(() => {
        const skuSet = new Set<string>();
        siteInventory.forEach(inv => {
            inv.products.forEach(p => {
                const key = (p.sku || p.name || '').trim();
                if (key) skuSet.add(key);
            });
        });
        return skuSet.size;
    }, [siteInventory]);

    // Filter by search & location type
    const filteredInventory = useMemo(() => {
        return siteInventory.filter(inv => {
            const isWarehouse = inv.site.type === 'Warehouse' || inv.site.type === 'Distribution Center';
            const isStore = inv.site.type === 'Store' || inv.site.type === 'Dark Store';

            if (typeFilter === 'WAREHOUSE' && !isWarehouse) return false;
            if (typeFilter === 'STORE' && !isStore) return false;
            if (typeFilter === 'LOW_STOCK' && (inv.metrics.lowStockItems === 0 && inv.metrics.outOfStockItems === 0)) return false;

            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                inv.site.name.toLowerCase().includes(term) ||
                inv.site.address.toLowerCase().includes(term) ||
                (inv.site.manager && inv.site.manager.toLowerCase().includes(term)) ||
                inv.products.some(p => p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term)))
            );
        });
    }, [siteInventory, searchTerm, typeFilter]);

    const toggleSiteExpansion = (siteId: string) => {
        setExpandedSiteId(prev => prev === siteId ? null : siteId);
    };

    const getStockStatusColor = (stock: number, minStock: number = 10) => {
        if (stock <= 0) return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
        if (stock <= minStock) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
        if (stock < 50) return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Page Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">Network Inventory</h1>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 font-normal">
                        Real-time stock visibility and valuation across regional distribution centers and stores
                    </p>
                </div>
            </div>

            {/* Adaptive Regional Territory Lens */}
            <RegionalScopeBanner moduleName="Network Inventory" />

            {/* Network Summary KPI Cards */}
            <NetworkKPIDeck
                totalWarehouses={totalWarehouses}
                totalStores={totalStores}
                totalNetworkProducts={totalNetworkProducts}
                totalNetworkAssetValue={totalNetworkAssetValue}
                totalPotentialRevenue={totalPotentialRevenue}
                uniqueNetworkSKUs={uniqueNetworkSKUs}
                totalNetworkUnits={totalNetworkUnits}
            />

            {/* Search & Location Filter Bar */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="relative flex-1 min-w-[260px] max-w-lg">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] opacity-60" size={16} />
                        <input
                            type="text"
                            placeholder="Search any SKU, product name, store, or warehouse..."
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] font-medium outline-none focus:border-[var(--theme-accent)] transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                typeFilter === 'ALL'
                                    ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                            }`}
                        >
                            All ({siteInventory.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('WAREHOUSE')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                typeFilter === 'WAREHOUSE'
                                    ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                            }`}
                        >
                            Warehouses ({totalWarehouses})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('STORE')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                typeFilter === 'STORE'
                                    ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                            }`}
                        >
                            Stores ({totalStores})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter(prev => prev === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                typeFilter === 'LOW_STOCK'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/15'
                            }`}
                        >
                            <AlertTriangle size={13} />
                            <span>Low Stock Alerts ({totalLowStockAlerts})</span>
                        </button>
                    </div>
                </div>

                {/* Instant Cross-Network SKU Lookup View */}
                {searchTerm && searchTerm.length >= 2 && (
                    <div className="mt-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 animate-in fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                                <Package size={15} className="text-blue-600 dark:text-blue-400" />
                                Multi-Site Stock Distribution for "{searchTerm}"
                            </h4>
                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-normal">Click any product to inspect full network breakdown</span>
                        </div>
                        {(() => {
                            const searchPool = serverSearchResults.length > 0 ? serverSearchResults : allProducts;
                            const matchingProducts = searchPool.filter(p =>
                                (p.status || (p as any).status) !== 'archived' && (
                                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                            );

                            const productGroups = matchingProducts.reduce((acc, product) => {
                                const key = product.sku || product.name;
                                if (!acc[key]) {
                                    acc[key] = {
                                        productRef: product,
                                        name: product.name,
                                        sku: product.sku || 'N/A',
                                        category: product.category,
                                        price: product.price,
                                        unit: product.unit || 'UNIT',
                                        locations: []
                                    };
                                }
                                const site = sites.find(s => s.id === product.siteId || s.id === product.site_id);
                                if (site) {
                                    acc[key].locations.push({
                                        site: site.name,
                                        siteType: site.type,
                                        stock: product.stock,
                                        minStock: product.minStock || 10,
                                        location: product.location,
                                        status: product.status
                                    });
                                }
                                return acc;
                            }, {} as Record<string, any>);

                            const productList = Object.values(productGroups);

                            if (productList.length === 0) {
                                return <p className="text-xs text-[var(--theme-text-secondary)] font-medium">No active SKUs found matching "{searchTerm}"</p>;
                            }

                            return (
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                                    {productList.map((product: any, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedProductForModal(product.productRef)}
                                            className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] rounded-xl p-4 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-2.5">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="font-bold text-xs text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] transition-colors">{product.name}</h5>
                                                        <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-semibold font-mono">
                                                            View Stock Map
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5">{product.sku} • {product.category} • {product.unit}</p>
                                                </div>
                                                <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                                    {formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {product.locations.map((loc: any, locIdx: number) => (
                                                    <div key={locIdx} className="flex items-center justify-between bg-[var(--theme-bg-subtle)] rounded-xl px-3 py-1.5 border border-[var(--theme-border)]">
                                                        <div className="flex items-center gap-2">
                                                            {loc.siteType === 'Warehouse' || loc.siteType === 'Distribution Center' ? (
                                                                <Building size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                                            ) : (
                                                                <Store size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                            )}
                                                            <span className="text-xs text-[var(--theme-text-primary)] font-semibold truncate">{loc.site}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border font-mono shrink-0 ${getStockStatusColor(loc.stock, loc.minStock)}`}>
                                                            {loc.stock} units{loc.stock <= loc.minStock ? ' (Low Stock)' : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t border-[var(--theme-border)] flex justify-between items-center text-xs">
                                                    <span className="text-[var(--theme-text-secondary)] font-semibold text-[10px] uppercase">Network Aggregate:</span>
                                                    <span className="font-bold font-mono text-[var(--theme-accent)] tabular-nums">
                                                        {product.locations.reduce((sum: number, loc: any) => sum + loc.stock, 0)} total units
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Regional Inventory Node Cards Grid */}
            <div className="space-y-4">
                {filteredInventory.map(({ site, products: siteProducts, metrics }) => (
                    <NetworkSiteCard
                        key={site.id}
                        site={site}
                        siteProducts={siteProducts}
                        metrics={metrics}
                        isExpanded={expandedSiteId === site.id || typeFilter === 'LOW_STOCK'}
                        onToggleExpand={() => toggleSiteExpansion(site.id)}
                        currentPage={getPageForSite(site.id)}
                        onPageChange={(page) => setPageForSite(site.id, page)}
                        onSelectProduct={(prod) => setSelectedProductForModal(prod)}
                        isLowStockFilterActive={typeFilter === 'LOW_STOCK'}
                        searchTerm={searchTerm}
                    />
                ))}
            </div>

            {filteredInventory.length === 0 && (
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-12 text-center shadow-sm">
                    <Package className="w-12 h-12 text-[var(--theme-text-secondary)] opacity-40 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-[var(--theme-text-primary)] mb-1">No Locations Found</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)]">Try adjusting your search criteria or type filter</p>
                </div>
            )}

            {/* Clutter-Free Multi-Site Stock Breakdown Modal */}
            <ProductNetworkStockModal
                isOpen={Boolean(selectedProductForModal)}
                onClose={() => setSelectedProductForModal(null)}
                product={selectedProductForModal}
                allProducts={allProducts}
                sites={sites}
            />
        </div>
    );
}
