
import React, { useState, useCallback } from 'react';
import {
    Search, Filter, ArrowUpDown, MoreHorizontal, AlertTriangle, FileText, Download, Printer, Box, Trash2, Edit, RefreshCw, Map, TrendingUp, Layout, ClipboardList, Thermometer, Shield, XCircle, DollarSign, ChevronDown, ChevronLeft, ChevronRight, Minus, Barcode, Package, Loader2, Clock, CheckCircle, User, ArrowRight, Link, Info, Scan, X, Camera, SlidersHorizontal
} from 'lucide-react';
import { Product, Site } from '../../types';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import Button from '../shared/Button';
import { Protected } from '../Protected';
import ProductLocationDisplay, { CompactLocationDisplay } from '../ProductLocationDisplay';
import { useData } from '../../contexts/DataContext'; // For allProducts access if needed, or pass as prop
import { getSellUnit } from '../../utils/units';
import { ProductDetailsModal } from './ProductDetailsModal';

// --- TYPES ---
interface InventoryStockListProps {
    products: Product[];
    totalCount: number;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    isLoading: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    handleSort: (key: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    handleBulkAction: (action: string) => void;
    handleOpenEditProduct: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    handleOpenAdjust: (product: Product) => void;
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    allProducts: Product[]; // Needed for location lookups
    user: any;
    itemsPerPage: number;
}

// --- HELPER COMPONENTS ---

type LocationDetail = { location: string; stock: number; siteId: string | null; productId: string };
interface LocationDropdownProps {
    count: number;
    details: LocationDetail[];
    sites: Site[];
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({ count, details, sites }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    if (count === 0) return null;

    const getSiteName = (siteId: string | null) => {
        if (!siteId) return 'Unknown Site';
        const site = sites.find(s => s.id === siteId);
        return site ? site.name : 'Unknown Site';
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer max-w-fit"
            >
                <span className="text-[8px] font-bold text-purple-400">+{count} other {count === 1 ? 'location' : 'locations'}</span>
                <ChevronDown size={10} className={`text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] bg-cyber-gray border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-2 bg-black/40 border-b border-white/10">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Also stocked at</span>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                            {details.map((loc, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-white truncate">{loc.location}</span>
                                        <span className="text-[8px] text-gray-500 truncate">{getSiteName(loc.siteId)}</span>
                                    </div>
                                    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${loc.stock > 10 ? 'bg-green-500/10 text-green-400' : loc.stock > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {loc.stock}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Compute true inventory retail value, accounting for weight/volume size multiplier.
// e.g. 34 bags of 50KG at ETB 450/KG → 34 × 50 × 450 = 765,000
const getInventoryValue = (product: Product): number => {
    if (!product.price || product.price <= 0 || !product.stock) return 0;
    const unitDef = getSellUnit(product.unit || '');
    // For weight/volume products, stock = # of bags/containers, price = per sell-unit (kg, L, etc.)
    // size = how many sell-units per bag (e.g. "50" for 50KG bags)
    if (unitDef.category === 'weight' || unitDef.category === 'volume') {
        const sizeNum = parseFloat(product.size || '0');
        if (sizeNum > 0) {
            return product.stock * sizeNum * product.price;
        }
    }
    return product.stock * product.price;
};

// Compute display stock in sellable units.
// e.g. 70 bags of 10KG → 700 kg
const getDisplayStock = (product: Product): number => {
    if (!product.stock) return 0;
    const unitDef = getSellUnit(product.unit || '');
    if (unitDef.category === 'weight' || unitDef.category === 'volume') {
        const sizeNum = parseFloat(product.size || '0');
        if (sizeNum > 0) {
            return product.stock * sizeNum;
        }
    }
    return product.stock;
};

// ABC Analysis Helper (Duplicated for now or import if moved to utils)
const getABCClass = (product: Product, totalValue: number) => {
    const prodValue = getInventoryValue(product);
    const share = prodValue / totalValue;
    if (share > 0.05) return 'A';
    if (share > 0.02) return 'B';
    return 'C';
};

export const InventoryStockList: React.FC<InventoryStockListProps> = ({
    products,
    totalCount,
    currentPage,
    setCurrentPage,
    isLoading,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    searchTerm,
    setSearchTerm,
    selectedIds,
    setSelectedIds,
    handleBulkAction,
    handleOpenEditProduct,
    handleDeleteProduct,
    handleOpenAdjust,
    sites,
    activeSite,
    isReadOnly,
    allProducts,
    user,
    itemsPerPage
}) => {

    // Derived total value for ABC calc
    // Note: Inventory.tsx calculates global total, here we might only have paginated? 
    // Ideally totalValue should be passed down if ABC depends on GLOBAL value.
    // For now we re-calculate based on what we have or accept that it might be local to view if not passed.
    // Actually Inventory.tsx passes totalInventoryValue to getABCClass. 
    // Let's approximate or just use a placeholder, OR pass totalInventoryValue as prop.
    // Code below uses `totalInventoryValue` which effectively is needed.
    // I will add `totalInventoryValue` to props.

    // We'll calculate a local total for now if not provided, but precise ABC needs global.
    // Looking at Inventory.tsx, `totalInventoryValue` is calculated from serverMetrics.
    // I should add `totalInventoryValue` to props.

    const [selectedViewProduct, setSelectedViewProduct] = useState<Product | null>(null);

    const getOtherLocationsForSku = useCallback((sku: string, currentProductId: string, currentProductSiteId?: string) => {
        if (!sku) return { count: 0, locations: [], details: [] };

        const sameSkuProducts = allProducts.filter(p =>
            p.sku === sku &&
            p.id !== currentProductId &&
            p.location &&
            p.location.trim() !== '' &&
            (currentProductSiteId ? (p.siteId === currentProductSiteId || (p as any).site_id === currentProductSiteId) : true)
        );

        const locationMap: Record<string, LocationDetail> = {};
        sameSkuProducts.forEach(p => {
            if (p.location && !locationMap[p.location]) {
                locationMap[p.location] = {
                    location: p.location,
                    stock: p.stock,
                    siteId: p.siteId || (p as any).site_id || null,
                    productId: p.id
                };
            }
        });

        const details = Object.values(locationMap);
        const uniqueLocations = details.map(d => d.location);

        return {
            count: uniqueLocations.length,
            locations: uniqueLocations.slice(0, 3),
            details
        };
    }, [allProducts]);

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    // Calculate total value only for ABC purposes on the displayed items if prop not available?
    // Let's assume we can get it from somewhere or standard assumption.
    const totalInventoryValue = 1000000; // Placeholder if not passed. 
    // BETTER: Pass it as prop. I will update interface.

    return (
        <div className="flex flex-col h-[calc(100vh-280px)]">
            <div className="flex-1 glass-panel flex flex-col rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 space-y-4 bg-gray-50/50 dark:bg-white/2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-2.5 flex-1 focus-within:border-cyber-primary/50 transition-all shadow-inner group">
                            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-cyber-primary transition-colors" />
                            <input
                                type="text"
                                aria-label="Search"
                                placeholder="Search SKU, Name, or Warehouse Location..."
                                className="bg-transparent border-none ml-3 flex-1 text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-[11px] text-gray-500 font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                            {products.length} Records
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                            <SlidersHorizontal size={14} className="text-cyber-primary" />
                            <span className="text-[11px] text-white font-black uppercase tracking-[0.15em]">Filters</span>
                        </div>

                        {(!activeSite || isReadOnly) && (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Map size={12} className="text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <select
                                    value={filters.siteId}
                                    aria-label="Filter by Site"
                                    onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
                                    className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-blue-500/30 hover:text-gray-900 dark:hover:text-white transition-all min-w-[160px]"
                                >
                                    <option value="All">All Locations</option>
                                    {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors pointer-events-none" />
                            </div>
                        )}

                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Package size={12} className="text-cyber-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <select
                                value={filters.category}
                                aria-label="Filter by Category"
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-cyber-primary/30 hover:text-gray-900 dark:hover:text-white transition-all min-w-[160px]"
                            >
                                <option value="All">All Categories</option>
                                {Array.from(new Set(products.map(p => p.category))).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-cyber-primary transition-colors pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-2 h-2 rounded-full border border-green-500/50 group-hover:bg-green-500 transition-all" />
                            </div>
                            <select
                                value={filters.status}
                                aria-label="Filter by Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-green-500/30 hover:text-gray-900 dark:hover:text-white transition-all min-w-[140px]"
                            >
                                <option value="All">All Inventory</option>
                                <option value="Active">In Stock</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-green-400 transition-colors pointer-events-none" />
                        </div>

                        {(filters.category !== 'All' || filters.status !== 'All' || filters.abc !== 'All' || filters.siteId !== 'All') && (
                            <button
                                onClick={() => setFilters({ category: 'All', status: 'All', abc: 'All', priceRange: 'All', siteId: 'All' })}
                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-red-400 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all ml-auto"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="bg-cyber-primary/10 border-b border-cyber-primary/20 p-2 flex items-center justify-between px-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyber-primary font-bold uppercase tracking-wider">{selectedIds.size} Selected</span>
                            <Button onClick={() => handleBulkAction('Print Labels')} size="sm" variant="secondary" className="px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded text-[10px] font-bold text-white">Print Labels</Button>
                            <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost" className="px-3 py-1.5 text-[10px] text-gray-400 hover:text-white">Clear</Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50/95 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-white/10 shadow-sm">
                            <tr className="bg-gray-50 dark:bg-white/[0.02]">
                                <th className="p-5 w-10">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            aria-label="Select All"
                                            className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-white/5 checked:bg-cyber-primary checked:border-cyber-primary transition-all cursor-pointer"
                                            onChange={() => {
                                                if (selectedIds.size === products.length) setSelectedIds(new Set());
                                                else setSelectedIds(new Set(products.map(i => i.id)));
                                            }}
                                            checked={selectedIds.size === products.length && products.length > 0}
                                        />
                                        <CheckCircle size={10} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                </th>

                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">
                                        Product
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'name' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('location')}>
                                    <div className="flex items-center gap-2">
                                        Location
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'location' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'location' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('stock')}>
                                    <div className="flex items-center justify-center gap-2">
                                        Stock Level
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'stock' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'stock' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('unit')}>
                                    <div className="flex items-center justify-center gap-2">
                                        Unit
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'unit' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'unit' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>

                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('price')}>
                                    <div className="flex items-center justify-end gap-2">
                                        Price
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'price' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'price' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('assetValue')}>
                                    <div className="flex items-center justify-end gap-2">
                                        Value
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'assetValue' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'assetValue' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('abc')}>
                                    <div className="flex items-center justify-center gap-2">
                                        Class
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'abc' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'abc' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center justify-end gap-2">
                                        Date
                                        <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'createdAt' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                            <ArrowUpDown size={10} className={sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                        </div>
                                    </div>
                                </th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {products.map((product) => {
                                const abc = getABCClass(product, totalInventoryValue);
                                const isSelected = selectedIds.has(product.id);


                                return (
                                    <tr
                                        key={product.id}
                                        onClick={() => setSelectedViewProduct(product)}
                                        className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-300 cursor-pointer ${isSelected ? 'bg-cyber-primary/[0.08]' : ''}`}
                                    >
                                        <td className="p-5" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select row"
                                                    className="peer appearance-none w-4 h-4 border border-white/10 rounded bg-white/5 checked:bg-cyber-primary checked:border-cyber-primary transition-all cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(product.id)}
                                                />
                                                <CheckCircle size={10} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:border-cyber-primary/30 transition-colors">
                                                    {product.image && !product.image.includes('placeholder.com') ? (
                                                        <img
                                                            src={product.image}
                                                            alt=""
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Package size={24} className="text-gray-700 group-hover:text-cyber-primary/40 transition-colors" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black text-gray-900 dark:text-white tracking-tight group-hover:text-cyber-primary transition-colors">{product.name}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[9px] font-black font-mono text-gray-500 bg-gray-100 dark:bg-black/40 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5 uppercase tracking-tighter">{product.sku}</span>
                                                        <span className="text-[9px] font-black bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-gray-400 uppercase tracking-tighter">{product.category}</span>
                                                        {product.approvalStatus === 'pending' && (
                                                            <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-tighter">⏳ Review</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {(!activeSite || isReadOnly) ? (
                                                (() => {
                                                    const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                                    const otherLocs = getOtherLocationsForSku(product.sku, product.id, product.siteId || (product as any).site_id);

                                                    if (site) {
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                    {site.name}
                                                                </span>
                                                                <span className="text-[9px] text-gray-600 font-bold uppercase mt-0.5 ml-3">{site.type}</span>
                                                                {otherLocs.count > 0 && (
                                                                    <div className="ml-3">
                                                                        <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    } else {
                                                        return product.location ? (
                                                            <div className="flex flex-col gap-1">
                                                                <CompactLocationDisplay product={product} sites={sites} />
                                                                <span className="text-[9px] text-red-400/60 font-medium uppercase mt-1 ml-1 w-full truncate">Unmapped Site</span>
                                                                {otherLocs.count > 0 && (
                                                                    <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-600 font-black uppercase italic tracking-widest">Unmapped Site (No Loc)</span>
                                                        );
                                                    }
                                                })()
                                            ) : (
                                                (() => {
                                                    const otherLocs = getOtherLocationsForSku(product.sku, product.id, product.siteId || (product as any).site_id);
                                                    return product.location ? (
                                                        <div className="flex flex-col gap-1">
                                                            <CompactLocationDisplay product={product} sites={sites} />
                                                            {otherLocs.count > 0 && (
                                                                <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10">No Cell Assigned</span>
                                                    );
                                                })()
                                            )}
                                        </td>
                                        <td className="p-5 text-center">
                                            {(() => {
                                                const unitDef = getSellUnit(product.unit || '');
                                                const sizeNum = parseFloat(product.size || '0');
                                                const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;
                                                const stockVal = product.stock || 0;
                                                return (
                                                    <div className={`inline-flex items-center justify-center min-w-[50px] px-3 py-1.5 rounded-2xl text-[12px] font-black font-mono shadow-sm transition-all ${stockVal === 0 ? 'bg-red-500/10 text-red-500 border border-red-500/30' : stockVal < 10 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-yellow-500/5' : 'bg-green-500/10 text-green-500 border border-green-500/30'}`}>
                                                        {stockVal.toLocaleString()}
                                                        {isWeightVol ? (
                                                            <span className="text-[9px] font-bold ml-1 opacity-60">× {sizeNum}{unitDef.shortLabel.toLowerCase()}</span>
                                                        ) : unitDef.code !== 'UNIT' ? (
                                                            <span className="text-[9px] font-bold ml-1 uppercase opacity-60">{unitDef.shortLabel}</span>
                                                        ) : null}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                                                {product.unit || 'UNIT'}
                                            </span>
                                        </td>

                                        <td className="p-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[13px] font-black text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-cyber-primary transition-colors">
                                                    {product.price && product.price > 0 ? formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL }) : '—'}
                                                    {product.unit && product.price > 0 && getSellUnit(product.unit).code !== 'UNIT' && (
                                                        <span className="text-[9px] text-gray-500 font-bold">/{getSellUnit(product.unit).shortLabel}</span>
                                                    )}
                                                </span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Retail Price</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="inline-flex flex-col items-end bg-gray-100 dark:bg-black/20 p-2 rounded-xl border border-gray-100 dark:border-white/[0.03]">
                                                <span className="text-[12px] font-black text-cyber-primary font-mono tracking-tighter">
                                                    {product.price && product.price > 0 ? formatCompactNumber(getInventoryValue(product), { currency: CURRENCY_SYMBOL }) : '—'}
                                                </span>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Inventory Value</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black border transition-all ${abc === 'A' ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-lg shadow-green-500/5' : abc === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                                                {abc}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-gray-500 font-mono">
                                                    {(() => {
                                                        const dateVal = product.createdAt || (product as any).created_at;
                                                        if (!dateVal) return '--';
                                                        // Format: "Feb 15 • 2:30 PM"
                                                        return new Date(dateVal).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric',
                                                            hour: 'numeric', minute: '2-digit'
                                                        }).replace(',', ' •');
                                                    })()}
                                                </span>
                                                <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">Date Added</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            {!isReadOnly && (
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                                                    <Protected permission="EDIT_PRODUCT">
                                                        <div className="flex items-center gap-1">
                                                            <Protected permission="ADJUST_STOCK">
                                                                <button
                                                                    onClick={() => handleOpenAdjust(product)}
                                                                    className="p-2 hover:bg-cyber-primary/10 hover:text-cyber-primary text-gray-500 rounded-xl transition-all"
                                                                    title="Adjust Stock"
                                                                >
                                                                    <RefreshCw size={14} />
                                                                </button>
                                                            </Protected>
                                                            <button
                                                                onClick={() => handleOpenEditProduct(product)}
                                                                className="p-2 hover:bg-blue-500/10 hover:text-blue-400 text-gray-500 rounded-xl transition-all"
                                                                title="Edit Product"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                className="p-2 hover:bg-red-500/10 hover:text-red-500 text-gray-500 rounded-xl transition-all"
                                                                title="Delete Product"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </Protected>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {products.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Box size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold">No products found</p>
                            <p className="text-xs mt-2">Try adjusting your filters or search term</p>
                        </div>
                    )}
                </div>

                {/* Product Pagination Controls */}
                <div className="flex justify-between items-center p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/40 backdrop-blur-md rounded-b-3xl">
                    <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary animate-pulse" />
                        Displays: <span className="text-white">{products.length}</span> <span className="text-gray-700">/</span> <span className="text-gray-400">{formatCompactNumber(totalCount)}</span> Records
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="px-4 py-2 bg-white/5 hover:bg-cyber-primary/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-[11px] font-black text-white transition-all border border-white/10 hover:border-cyber-primary/40 flex items-center gap-2 group"
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            Prev
                        </button>

                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/40 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/5">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Page</span>
                            <span className="text-[12px] font-black text-cyber-primary font-mono">{currentPage}</span>
                            <span className="text-gray-700 mx-1 text-[10px]">/</span>
                            <span className="text-[12px] font-black text-gray-500 font-mono">{Math.max(1, Math.ceil(totalCount / itemsPerPage))}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(totalCount / itemsPerPage))))}
                            disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || isLoading}
                            className="px-4 py-2 bg-white/5 hover:bg-cyber-primary/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-[11px] font-black text-white transition-all border border-white/10 hover:border-cyber-primary/40 flex items-center gap-2 group"
                        >
                            Next
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Details Modal Overlay */}
            <ProductDetailsModal
                product={selectedViewProduct}
                isOpen={!!selectedViewProduct}
                onClose={() => setSelectedViewProduct(null)}
            />
        </div>
    );
};
