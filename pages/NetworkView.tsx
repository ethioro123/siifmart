import React, { useState, useMemo } from 'react';
import {
    Building, Store, Package, MapPin, TrendingUp, AlertTriangle,
    Search, Filter, ChevronDown, ChevronRight,
    ArrowRight, Clock, DollarSign, Activity, Users, Truck, Sparkles, Layers
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../constants';
import { Site, Product } from '../types';
import { formatCompactNumber } from '../utils/formatting';

const PRODUCTS_PER_PAGE = 9;

export default function NetworkInventory() {
    const { sites, allProducts, activeSite } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'WAREHOUSE' | 'STORE'>('ALL');
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [siteProductPages, setSiteProductPages] = useState<Record<string, number>>({});

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
            const lowStockItems = siteProducts.filter(p => p.stock > 0 && p.stock < 10).length;
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

    // Filter by search & location type
    const filteredInventory = useMemo(() => {
        return siteInventory.filter(inv => {
            const isWarehouse = inv.site.type === 'Warehouse' || inv.site.type === 'Distribution Center';
            const isStore = inv.site.type === 'Store' || inv.site.type === 'Dark Store';

            if (typeFilter === 'WAREHOUSE' && !isWarehouse) return false;
            if (typeFilter === 'STORE' && !isStore) return false;

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

    const getStockStatusColor = (stock: number) => {
        if (stock === 0) return 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30';
        if (stock < 10) return 'text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-900/30';
        if (stock < 50) return 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/30';
        return 'text-[#2C5E3B] bg-emerald-50 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30';
    };

    const totalWarehouses = siteInventory.filter(inv => inv.site.type === 'Warehouse' || inv.site.type === 'Distribution Center').length;
    const totalStores = siteInventory.filter(inv => inv.site.type === 'Store' || inv.site.type === 'Dark Store').length;
    const totalNetworkProducts = siteInventory.reduce((sum, inv) => sum + inv.metrics.uniqueProducts, 0);
    const totalNetworkAssetValue = siteInventory.reduce((sum, inv) => sum + inv.metrics.totalValue, 0);
    const totalPotentialRevenue = siteInventory.reduce((sum, inv) => sum + inv.metrics.totalValueRetail, 0);

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                            <Building size={18} />
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Warehouses</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white">{totalWarehouses}</p>
                </div>

                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/30">
                            <Store size={18} />
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Retail Stores</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white">{totalStores}</p>
                </div>

                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                            <Package size={18} />
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total Products</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white">{totalNetworkProducts}</p>
                </div>

                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Asset Value</span>
                    </div>
                    <p className="text-xl font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] truncate">
                        {formatCompactNumber(totalNetworkAssetValue, { currency: CURRENCY_SYMBOL })}
                    </p>
                </div>

                <div className="col-span-2 md:col-span-1 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/30">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Potential Rev</span>
                    </div>
                    <p className="text-xl font-black font-mono text-amber-700 dark:text-amber-400 truncate">
                        {formatCompactNumber(totalPotentialRevenue, { currency: CURRENCY_SYMBOL })}
                    </p>
                </div>
            </div>

            {/* Search & Location Filter Bar */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="relative flex-1 min-w-[260px] max-w-lg">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search locations, products, SKUs, or managers..."
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
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
                    </div>
                </div>

                {/* Instant Cross-Network SKU Lookup View */}
                {searchTerm && searchTerm.length >= 2 && (
                    <div className="mt-4 bg-[#FAF8F5] dark:bg-black/30 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl p-4 sm:p-5 animate-in fade-in">
                        <h4 className="text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package size={15} />
                            Product Availability Across Entire Network
                        </h4>
                        {(() => {
                            const matchingProducts = allProducts.filter(p =>
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                            );

                            const productGroups = matchingProducts.reduce((acc, product) => {
                                const key = product.sku || product.name;
                                if (!acc[key]) {
                                    acc[key] = {
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
                                        location: product.location,
                                        status: product.status
                                    });
                                }
                                return acc;
                            }, {} as Record<string, any>);

                            const productList = Object.values(productGroups);

                            if (productList.length === 0) {
                                return <p className="text-xs text-stone-400 font-medium">No catalog SKUs found matching "{searchTerm}"</p>;
                            }

                            return (
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                                    {productList.map((product: any, idx) => (
                                        <div key={idx} className="bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4">
                                            <div className="flex items-start justify-between mb-2.5">
                                                <div>
                                                    <h5 className="font-bold text-xs text-[#1E3F27] dark:text-white">{product.name}</h5>
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
                                                                <Building size={13} className="text-blue-600" />
                                                            ) : (
                                                                <Store size={13} className="text-emerald-600" />
                                                            )}
                                                            <span className="text-xs text-[#1E3F27] dark:text-white font-bold">{loc.site}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border font-mono ${getStockStatusColor(loc.stock)}`}>
                                                            {loc.stock} units
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
                {filteredInventory.map(({ site, products: siteProducts, metrics }) => {
                    const isWarehouse = site.type === 'Warehouse' || site.type === 'Distribution Center';
                    const isExpanded = expandedSiteId === site.id;

                    return (
                        <div
                            key={site.id}
                            className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-[#2C5E3B]/40"
                        >
                            <div className="p-5 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start sm:items-center gap-3.5 flex-1">
                                        <div
                                            className={`p-3 rounded-2xl border shrink-0 ${
                                                isWarehouse
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/30'
                                                    : 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30'
                                            }`}
                                        >
                                            {isWarehouse ? <Building size={22} /> : <Store size={22} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-black text-[#1E3F27] dark:text-white">{site.name}</h3>
                                                <span className="text-[10px] font-mono bg-stone-100 dark:bg-black/40 text-stone-500 border border-[#E2DCCE] dark:border-white/10 px-1.5 py-0.5 rounded">
                                                    {site.code || site.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-2 mt-1 font-medium">
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {site.address || 'Regional Node'}</span>
                                                {site.manager && (
                                                    <>
                                                        <span className="text-stone-300 dark:text-stone-700">•</span>
                                                        <span className="flex items-center gap-1 text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                                                            <Users size={12} /> {site.manager}
                                                        </span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics Bar */}
                                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E2DCCE]/60 dark:border-white/5">
                                        <div className="text-left sm:text-right">
                                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Products</p>
                                            <p className="text-base sm:text-lg font-black text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">
                                                {metrics.uniqueProducts}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Total Items</p>
                                            <p className="text-base sm:text-lg font-black text-[#1E3F27] dark:text-white font-mono">
                                                {metrics.totalItems.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Asset Value</p>
                                            <p className="text-base sm:text-lg font-black text-[#1E3F27] dark:text-white font-mono">
                                                {formatCompactNumber(metrics.totalValue, { currency: CURRENCY_SYMBOL })}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleSiteExpansion(site.id)}
                                            className="p-2 bg-[#FAF8F5] hover:bg-[#2C5E3B] text-stone-500 hover:text-white dark:bg-black/30 dark:text-stone-400 dark:hover:bg-[#A9CBA2] dark:hover:text-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-2xl transition-all cursor-pointer ml-1"
                                            title={isExpanded ? 'Collapse products list' : 'View products stationed at this location'}
                                        >
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Accordion: Stocked Catalog at this Location */}
                                {isExpanded && (() => {
                                    const currentPage = getPageForSite(site.id);
                                    const totalPages = Math.max(1, Math.ceil(siteProducts.length / PRODUCTS_PER_PAGE));
                                    const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
                                    const paginatedProducts = siteProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

                                    return (
                                        <div className="mt-5 pt-5 border-t border-[#E2DCCE]/60 dark:border-white/5 animate-in fade-in">
                                            {siteProducts.length > 0 ? (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {paginatedProducts.map(product => (
                                                            <div
                                                                key={product.id}
                                                                className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-between"
                                                            >
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <div className="overflow-hidden flex-1">
                                                                        <p className="text-xs font-bold text-[#1E3F27] dark:text-white truncate">{product.name}</p>
                                                                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{product.sku || 'No SKU'}</p>
                                                                    </div>
                                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border font-mono shrink-0 ${getStockStatusColor(product.stock)}`}>
                                                                        {product.stock} units
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2DCCE]/60 dark:border-white/5 text-[11px]">
                                                                    <span className="text-stone-400 font-medium">{product.category}</span>
                                                                    <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                                                                        {formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Pagination Bar */}
                                                    {totalPages > 1 && (
                                                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#E2DCCE]/60 dark:border-white/5 text-xs">
                                                            <span className="text-stone-500 dark:text-stone-400 font-medium">
                                                                Showing {startIdx + 1}-{Math.min(startIdx + PRODUCTS_PER_PAGE, siteProducts.length)} of {siteProducts.length} products
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPageForSite(site.id, currentPage - 1)}
                                                                    disabled={currentPage === 1}
                                                                    className="px-3 py-1 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl font-bold disabled:opacity-40 cursor-pointer"
                                                                >
                                                                    Prev
                                                                </button>
                                                                <span className="font-mono font-bold text-stone-600 dark:text-stone-300 px-1">
                                                                    {currentPage} / {totalPages}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPageForSite(site.id, currentPage + 1)}
                                                                    disabled={currentPage === totalPages}
                                                                    className="px-3 py-1 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl font-bold disabled:opacity-40 cursor-pointer"
                                                                >
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="p-8 text-center bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-dashed border-[#E2DCCE] dark:border-white/10">
                                                    <Package size={24} className="text-stone-300 dark:text-stone-600 mx-auto mb-1.5" />
                                                    <p className="text-xs font-bold text-stone-500">No products stationed at this facility</p>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">Ready for inbound replenishment and stock transfer allocation</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredInventory.length === 0 && (
                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-12 text-center shadow-sm">
                    <Package className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-1">No Locations Found</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Try adjusting your search criteria or type filter</p>
                </div>
            )}
        </div>
    );
}
