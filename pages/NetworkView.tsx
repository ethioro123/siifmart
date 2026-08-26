import React, { useState, useMemo } from 'react';
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

export default function NetworkInventory() {
    const { sites, allProducts } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'WAREHOUSE' | 'STORE' | 'LOW_STOCK'>('ALL');
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [siteProductPages, setSiteProductPages] = useState<Record<string, number>>({});
    const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

    const getPageForSite = (siteId: string) => siteProductPages[siteId] || 1;
    const setPageForSite = (siteId: string, page: number) => {
        setSiteProductPages(prev => ({ ...prev, [siteId]: page }));
    };

    // Calculate inventory metrics per site (exclude Admin sites)
    const siteInventory = useMemo(() => {
        const inventorySites = sites.filter(s => {
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
            const outOfStockItems = siteProducts.filter(p => p.stock === 0).length;
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
        if (stock === 0) return 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30';
        if (stock <= minStock) return 'text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-900/30';
        if (stock < 50) return 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/30';
        return 'text-[#2C5E3B] bg-emerald-50 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30';
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Page Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1E3F27] dark:text-white tracking-tight">Network Inventory</h1>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                        Real-time stock visibility and valuation across regional distribution centers and stores
                    </p>
                </div>
            </div>

            {/* Network Summary KPI Cards */}
            <NetworkKPIDeck
                totalWarehouses={totalWarehouses}
                totalStores={totalStores}
                totalNetworkProducts={totalNetworkProducts}
                totalNetworkAssetValue={totalNetworkAssetValue}
                totalPotentialRevenue={totalPotentialRevenue}
            />

            {/* Search & Location Filter Bar */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="relative flex-1 min-w-[260px] max-w-lg">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search any SKU, product name, store, or warehouse..."
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                typeFilter === 'ALL'
                                    ? 'bg-[#2C5E3B] text-white shadow-sm'
                                    : 'bg-[#FAF8F5] dark:bg-black/30 text-stone-600 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]'
                            }`}
                        >
                            All ({siteInventory.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('WAREHOUSE')}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                typeFilter === 'WAREHOUSE'
                                    ? 'bg-[#2C5E3B] text-white shadow-sm'
                                    : 'bg-[#FAF8F5] dark:bg-black/30 text-stone-600 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]'
                            }`}
                        >
                            Warehouses ({totalWarehouses})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('STORE')}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                typeFilter === 'STORE'
                                    ? 'bg-[#2C5E3B] text-white shadow-sm'
                                    : 'bg-[#FAF8F5] dark:bg-black/30 text-stone-600 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]'
                            }`}
                        >
                            Stores ({totalStores})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter(prev => prev === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                typeFilter === 'LOW_STOCK'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 hover:border-amber-500'
                            }`}
                        >
                            <AlertTriangle size={13} />
                            <span>Low Stock Alerts ({totalLowStockAlerts})</span>
                        </button>
                    </div>
                </div>

                {/* Instant Cross-Network SKU Lookup View */}
                {searchTerm && searchTerm.length >= 2 && (
                    <div className="mt-4 bg-[#FAF8F5] dark:bg-black/30 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl p-4 sm:p-5 animate-in fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wider flex items-center gap-2">
                                <Package size={15} />
                                Multi-Site Stock Distribution for "{searchTerm}"
                            </h4>
                            <span className="text-[10px] text-stone-400 font-medium">Click any product to inspect full network breakdown</span>
                        </div>
                        {(() => {
                            const matchingProducts = allProducts.filter(p =>
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
                                return <p className="text-xs text-stone-400 font-medium">No active SKUs found matching "{searchTerm}"</p>;
                            }

                            return (
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                                    {productList.map((product: any, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedProductForModal(product.productRef)}
                                            className="bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B] rounded-2xl p-4 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-2.5">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="font-bold text-xs text-[#1E3F27] dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{product.name}</h5>
                                                        <span className="text-[9px] bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] px-1.5 py-0.5 rounded font-black font-mono">
                                                            View Stock Map
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">{product.sku} • {product.category} • {product.unit}</p>
                                                </div>
                                                <span className="text-xs font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
                                                    {formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {product.locations.map((loc: any, locIdx: number) => (
                                                    <div key={locIdx} className="flex items-center justify-between bg-[#FAF8F5] dark:bg-black/30 rounded-xl px-3 py-1.5 border border-[#E2DCCE]/60 dark:border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            {loc.siteType === 'Warehouse' || loc.siteType === 'Distribution Center' ? (
                                                                <Building size={13} className="text-blue-600 shrink-0" />
                                                            ) : (
                                                                <Store size={13} className="text-emerald-600 shrink-0" />
                                                            )}
                                                            <span className="text-xs text-[#1E3F27] dark:text-white font-bold truncate">{loc.site}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border font-mono shrink-0 ${getStockStatusColor(loc.stock, loc.minStock)}`}>
                                                            {loc.stock} units {loc.stock <= loc.minStock ? '⚠️ Low' : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t border-[#E2DCCE]/60 dark:border-white/5 flex justify-between items-center text-xs">
                                                    <span className="text-stone-400 font-bold text-[10px] uppercase">Network Aggregate:</span>
                                                    <span className="font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
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
                    />
                ))}
            </div>

            {filteredInventory.length === 0 && (
                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-12 text-center shadow-sm">
                    <Package className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-1">No Locations Found</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Try adjusting your search criteria or type filter</p>
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
