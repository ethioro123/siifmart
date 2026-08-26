import React from 'react';
import {
    Building, Store, Package, MapPin, AlertTriangle, Users, ChevronDown, ChevronRight
} from 'lucide-react';
import { Site, Product } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';

const PRODUCTS_PER_PAGE = 9;

interface NetworkSiteCardProps {
    site: Site;
    siteProducts: Product[];
    metrics: {
        totalValue: number;
        totalValueRetail: number;
        totalItems: number;
        uniqueProducts: number;
        lowStockItems: number;
        outOfStockItems: number;
        categories: number;
    };
    isExpanded: boolean;
    onToggleExpand: () => void;
    currentPage: number;
    onPageChange: (page: number) => void;
    onSelectProduct: (product: Product) => void;
    isLowStockFilterActive: boolean;
}

export const NetworkSiteCard: React.FC<NetworkSiteCardProps> = ({
    site,
    siteProducts,
    metrics,
    isExpanded,
    onToggleExpand,
    currentPage,
    onPageChange,
    onSelectProduct,
    isLowStockFilterActive
}) => {
    const isWarehouse = site.type === 'Warehouse' || site.type === 'Distribution Center';
    const displayedProducts = isLowStockFilterActive
        ? siteProducts.filter(p => p.stock <= (p.minStock || 10))
        : siteProducts;

    const getStockStatusColor = (stock: number, minStock: number = 10) => {
        if (stock === 0) return 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30';
        if (stock <= minStock) return 'text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-900/30';
        if (stock < 50) return 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/30';
        return 'text-[#2C5E3B] bg-emerald-50 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30';
    };

    const totalPages = Math.max(1, Math.ceil(displayedProducts.length / PRODUCTS_PER_PAGE));
    const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const paginatedProducts = displayedProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

    return (
        <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-[#2C5E3B]/40">
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
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-black text-[#1E3F27] dark:text-white">{site.name}</h3>
                                <span className="text-[10px] font-mono bg-stone-100 dark:bg-black/40 text-stone-500 border border-[#E2DCCE] dark:border-white/10 px-1.5 py-0.5 rounded">
                                    {site.code || site.type}
                                </span>
                                {(metrics.lowStockItems > 0 || metrics.outOfStockItems > 0) && (
                                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <AlertTriangle size={10} />
                                        {metrics.lowStockItems + metrics.outOfStockItems} Low Stock
                                    </span>
                                )}
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
                            onClick={onToggleExpand}
                            className="p-2 bg-[#FAF8F5] hover:bg-[#2C5E3B] text-stone-500 hover:text-white dark:bg-black/30 dark:text-stone-400 dark:hover:bg-[#A9CBA2] dark:hover:text-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-2xl transition-all cursor-pointer ml-1"
                            title={isExpanded ? 'Collapse products list' : 'View products stationed at this location'}
                        >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>

                {/* Accordion: Stocked Catalog at this Location */}
                {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-[#E2DCCE]/60 dark:border-white/5 animate-in fade-in">
                        {displayedProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {paginatedProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => onSelectProduct(product)}
                                            className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B] rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="overflow-hidden flex-1">
                                                    <p className="text-xs font-bold text-[#1E3F27] dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] truncate transition-colors">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">{product.sku || 'No SKU'}</p>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border font-mono shrink-0 ${getStockStatusColor(product.stock, product.minStock)}`}>
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
                                            Showing {startIdx + 1}-{Math.min(startIdx + PRODUCTS_PER_PAGE, displayedProducts.length)} of {displayedProducts.length} products
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onPageChange(currentPage - 1)}
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
                                                onClick={() => onPageChange(currentPage + 1)}
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
                                <p className="text-xs font-bold text-stone-500">No matching products at this facility</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default NetworkSiteCard;
