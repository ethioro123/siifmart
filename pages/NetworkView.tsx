import React, { useState, useMemo } from 'react';
import {
    Building, Store, Package, MapPin, TrendingUp, AlertTriangle,
    Search, Filter, ChevronDown, ChevronRight,
    ArrowRight, Clock, DollarSign, Activity, Users, Truck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../constants';
import { Site, Product } from '../types';
import { formatCompactNumber } from '../utils/formatting';

const PRODUCTS_PER_PAGE = 10;

export default function NetworkInventory() {
    const { sites, allProducts, activeSite } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [siteProductPages, setSiteProductPages] = useState<Record<string, number>>({});

    // Get current page for a site (default to 1)
    const getPageForSite = (siteId: string) => siteProductPages[siteId] || 1;

    // Set page for a specific site
    const setPageForSite = (siteId: string, page: number) => {
        setSiteProductPages(prev => ({ ...prev, [siteId]: page }));
    };

    // Calculate inventory metrics per site (exclude Admin - administrative offices don't hold inventory)
    const siteInventory = useMemo(() => {
        // Filter out Admin sites - they are administrative and don't hold physical inventory
        // Check both type and name to catch any database inconsistencies
        const inventorySites = sites.filter(s => {
            // Check type - 'Administration' or 'Administrative' are both Admin types
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
            const lowStockItems = siteProducts.filter(p => p.stock < 10).length;
            const outOfStockItems = siteProducts.filter(p => p.stock === 0).length;
            const categories = [...new Set(siteProducts.map(p => p.category))];

            return {
                site,
                products: siteProducts,
                metrics: {
                    totalValue: totalValueCost, // Use Cost as primary
                    totalValueRetail,
                    totalItems,
                    uniqueProducts: siteProducts.length,
                    lowStockItems,
                    outOfStockItems,
                    categories: categories.length,
                    utilizationPercent: site.type === 'Warehouse'
                        ? Math.min(100, (totalItems / (site.capacity || 1000)) * 100)
                        : Math.min(100, (siteProducts.length / 100) * 100)
                }
            };
        });
    }, [sites, allProducts]);

    // Filter by search
    const filteredInventory = useMemo(() => {
        if (!searchTerm) return siteInventory;
        const term = searchTerm.toLowerCase();
        return siteInventory.filter(inv =>
            inv.site.name.toLowerCase().includes(term) ||
            inv.site.address.toLowerCase().includes(term) ||
            inv.products.some(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
        );
    }, [siteInventory, searchTerm]);

    // Toggle site expansion - accordion style (only one at a time)
    const toggleSiteExpansion = (siteId: string) => {
        setExpandedSiteId(prev => prev === siteId ? null : siteId);
    };

    const getStockStatusColor = (stock: number) => {
        if (stock === 0) return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (stock < 10) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        if (stock < 50) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        return 'text-green-400 bg-green-500/10 border-green-500/30';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Network Inventory</h1>
                    <p className="text-gray-400">Real-time visibility across all warehouses and stores</p>
                </div>
            </div>

            {/* Network Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Building className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Warehouses</p>
                            <p className="text-2xl font-bold text-white">
                                {siteInventory.filter(inv => inv.site.type === 'Warehouse' || inv.site.type === 'Distribution Center').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Store className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Retail Stores</p>
                            <p className="text-2xl font-bold text-white">
                                {siteInventory.filter(inv => inv.site.type === 'Store' || inv.site.type === 'Dark Store').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Package className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Total Products</p>
                            <p className="text-2xl font-bold text-white">
                                {siteInventory.reduce((sum, inv) => sum + inv.metrics.uniqueProducts, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <DollarSign className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Network Asset Value</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCompactNumber(siteInventory.reduce((sum, inv) => sum + inv.metrics.totalValue, 0), { currency: CURRENCY_SYMBOL })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <TrendingUp className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Potential Revenue</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCompactNumber(siteInventory.reduce((sum, inv) => sum + inv.metrics.totalValueRetail, 0), { currency: CURRENCY_SYMBOL })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search locations, products, SKUs..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyber-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setSelectedSite(null)}
                        className="bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 px-6 py-3 rounded-xl font-bold hover:bg-cyber-primary/20 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        <Package size={20} />
                        Product Lookup
                    </button>
                </div>

                {/* Product Lookup Results */}
                {searchTerm && searchTerm.length >= 2 && (
                    <div className="mt-4 bg-black/30 border border-cyber-primary/30 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-cyber-primary mb-3 flex items-center gap-2">
                            <Package size={16} />
                            Product Availability Across Network
                        </h4>
                        {(() => {
                            // Find all products matching search
                            const matchingProducts = allProducts.filter(p =>
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                p.sku.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            // Group by product (same SKU)
                            const productGroups = matchingProducts.reduce((acc, product) => {
                                const key = product.sku;
                                if (!acc[key]) {
                                    acc[key] = {
                                        name: product.name,
                                        sku: product.sku,
                                        category: product.category,
                                        price: product.price,
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
                                return <p className="text-sm text-gray-400">No products found matching "{searchTerm}"</p>;
                            }

                            return (
                                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                    {productList.map((product: any, idx) => (
                                        <div key={idx} className="bg-cyber-gray border border-white/10 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h5 className="font-bold text-white">{product.name}</h5>
                                                    <p className="text-xs text-gray-500 font-mono mt-1">{product.sku} • {product.category}</p>
                                                </div>
                                                <span className="text-sm font-bold text-cyber-primary">{formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Available at {product.locations.length} location(s):</p>
                                                {product.locations.map((loc: any, locIdx: number) => (
                                                    <div key={locIdx} className="flex items-center justify-between bg-black/30 rounded-lg p-2">
                                                        <div className="flex items-center gap-2">
                                                            {loc.siteType === 'Warehouse' ?
                                                                <Building size={14} className="text-blue-400" /> :
                                                                <Store size={14} className="text-green-400" />
                                                            }
                                                            <span className="text-sm text-white font-medium">{loc.site}</span>
                                                            {loc.location && (
                                                                <span className="text-xs text-gray-500 font-mono">📍 {loc.location}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${getStockStatusColor(loc.stock)}`}>
                                                            {loc.stock} units
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                                    <span className="text-xs text-gray-500">Network Total:</span>
                                                    <span className="text-sm font-bold text-cyber-primary">
                                                        {product.locations.reduce((sum: number, loc: any) => sum + loc.stock, 0)} units
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

            {/* Inventory List */}
            <div className="space-y-4">
                {filteredInventory.map(({ site, products: siteProducts, metrics }) => (
                    <div key={site.id} className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-3 rounded-xl ${site.type === 'Warehouse' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {site.type === 'Warehouse' ? <Building size={28} /> : <Store size={28} />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-1">{site.name}</h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-2">
                                            <MapPin size={14} /> {site.address}
                                            <span className="mx-2">•</span>
                                            <Users size={14} /> {site.manager}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Products</p>
                                        <p className="text-2xl font-bold text-cyber-primary">{metrics.uniqueProducts}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Total Items</p>
                                        <p className="text-2xl font-bold text-white">{metrics.totalItems.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Value</p>
                                        <p className="text-2xl font-bold text-white">{formatCompactNumber(metrics.totalValue, { currency: CURRENCY_SYMBOL })}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleSiteExpansion(site.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        title={expandedSiteId === site.id ? "Collapse products" : "Expand products"}
                                    >
                                        {expandedSiteId === site.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            {expandedSiteId === site.id && (() => {
                                const currentPage = getPageForSite(site.id);
                                const totalPages = Math.ceil(siteProducts.length / PRODUCTS_PER_PAGE);
                                const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
                                const paginatedProducts = siteProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

                                return (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {paginatedProducts.map(product => (
                                                <div key={product.id} className="bg-black/20 border border-white/5 rounded-lg p-4 hover:border-cyber-primary/30 transition-colors">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-white mb-1">{product.name}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${getStockStatusColor(product.stock)}`}>
                                                            {product.stock}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                                        <span className="text-xs text-gray-400">{product.category}</span>
                                                        <span className="text-sm font-bold text-white">{formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                                                <span className="text-xs text-gray-500">
                                                    Showing {startIdx + 1}-{Math.min(startIdx + PRODUCTS_PER_PAGE, siteProducts.length)} of {siteProducts.length}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setPageForSite(site.id, currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${currentPage === 1
                                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                            : 'bg-white/10 text-white hover:bg-cyber-primary/20 hover:text-cyber-primary'}`}
                                                    >
                                                        Prev
                                                    </button>
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        {currentPage}/{totalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setPageForSite(site.id, currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${currentPage === totalPages
                                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                            : 'bg-white/10 text-white hover:bg-cyber-primary/20 hover:text-cyber-primary'}`}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ))}
            </div>

            {filteredInventory.length === 0 && (
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-12 text-center">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
                    <p className="text-gray-400">Try adjusting your search terms</p>
                </div>
            )}
        </div>
    );
}
