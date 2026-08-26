import React from 'react';
import { Package, Tag, MapPin, DollarSign, Box, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { formatStockDisplay, getSellUnit } from '../../../utils/units';

interface ProductProfileHeaderProps {
    product: Product;
    showCostPrice: boolean;
}

export const ProductProfileHeader: React.FC<ProductProfileHeaderProps> = ({
    product,
    showCostPrice
}) => {
    const price = product.price || 0;
    const cost = product.costPrice || (product as any).cost || 0;
    const grossProfit = price - cost;
    const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
    const totalAssetValue = (product.stock || 0) * price;

    const brandAlreadyInName = product.brand && product.name.toLowerCase().startsWith(product.brand.toLowerCase());
    const sellUnit = product.unit ? getSellUnit(product.unit) : null;

    // Determine status badge
    let statusConfig = {
        label: 'In Stock',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        stockTextClass: 'text-emerald-700 dark:text-emerald-400'
    };

    if (product.stock <= 0) {
        statusConfig = {
            label: 'Out of Stock',
            badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
            dotClass: 'bg-red-500',
            stockTextClass: 'text-red-600 dark:text-red-400'
        };
    } else if (product.minStock && product.stock <= product.minStock) {
        statusConfig = {
            label: 'Low Stock Alert',
            badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
            dotClass: 'bg-amber-500',
            stockTextClass: 'text-amber-700 dark:text-amber-400'
        };
    }

    return (
        <div className="bg-gradient-to-br from-stone-50 via-white to-stone-50/80 dark:from-[#18201B] dark:via-[#1C2620] dark:to-[#141A16] p-5 sm:p-6 rounded-3xl border border-[#E2DCCE]/80 dark:border-[#2C5E3B]/20 shadow-sm space-y-5">
            {/* Top Identity Row */}
            <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                        {product.image && !product.image.includes('placeholder.com') ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={30} className="text-[#2C5E3B]/40 dark:text-[#A9CBA2]/40" />
                        )}
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-black shadow-xs shrink-0" style={{ backgroundColor: product.stock > 0 ? '#10b981' : '#ef4444' }} />
                    </div>

                    {/* Titles and Badges */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                        {/* Meta Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                {product.category || 'General Catalog'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider bg-stone-200/70 dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-stone-300/50 dark:border-white/10">
                                SKU: {product.sku}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusConfig.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} animate-pulse`} />
                                {statusConfig.label}
                            </span>
                        </div>

                        {/* Product Title */}
                        <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight leading-tight truncate">
                            {product.brand && !brandAlreadyInName && (
                                <span className="text-[#2C5E3B] dark:text-[#A9CBA2] mr-2">{product.brand}</span>
                            )}
                            {product.name}
                        </h2>

                        {/* Location Subtext */}
                        <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                            <MapPin size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                            <span>Primary Bay: <span className="font-mono text-stone-800 dark:text-stone-200 uppercase font-black">{product.location || 'Unassigned Bay'}</span></span>
                            {product.shelfPosition && (
                                <span className="text-stone-400 dark:text-stone-500">· Shelf {product.shelfPosition}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {/* 1. Retail Price */}
                <div className="bg-white/90 dark:bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-[#E2DCCE]/70 dark:border-white/5 shadow-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 block mb-1">
                        Retail Selling Price
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] tracking-tight">
                            {CURRENCY_SYMBOL} {formatPriceValue(product.price)}
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">
                            /{sellUnit?.shortLabel || 'unit'}
                        </span>
                    </div>
                    {product.salePrice && product.salePrice > 0 && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                            Promo: {CURRENCY_SYMBOL} {formatPriceValue(product.salePrice)}
                        </span>
                    )}
                </div>

                {/* 2. Stock Level */}
                <div className="bg-white/90 dark:bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-[#E2DCCE]/70 dark:border-white/5 shadow-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 block mb-1">
                        Available On-Hand
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-lg sm:text-xl font-mono font-black tracking-tight ${statusConfig.stockTextClass}`}>
                            {formatStockDisplay(product.stock, product)}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-stone-400 uppercase block mt-1">
                        {product.packQuantity && product.packQuantity > 1 ? `Pack of ${product.packQuantity}` : 'Single Unit'}
                    </span>
                </div>

                {/* 3. Total Asset Value */}
                <div className="bg-white/90 dark:bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-[#E2DCCE]/70 dark:border-white/5 shadow-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 block mb-1">
                        Total Stock Value
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-mono font-black text-stone-900 dark:text-white tracking-tight">
                            {CURRENCY_SYMBOL} {totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-stone-400 uppercase block mt-1 font-mono">
                        {product.stock} × {formatPriceValue(product.price)}
                    </span>
                </div>

                {/* 4. Margin & Profit (If privileged role) or Reorder Level */}
                {showCostPrice ? (
                    <div className="bg-white/90 dark:bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-[#E2DCCE]/70 dark:border-white/5 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 block mb-1">
                            Gross Margin
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-mono font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                                {marginPct > 0 ? `${marginPct.toFixed(1)}%` : '0%'}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-stone-400 uppercase block mt-1 font-mono">
                            Cost: {CURRENCY_SYMBOL}{formatPriceValue(cost)}
                        </span>
                    </div>
                ) : (
                    <div className="bg-white/90 dark:bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-[#E2DCCE]/70 dark:border-white/5 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 block mb-1">
                            Min Safety Threshold
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-mono font-black text-amber-600 dark:text-amber-400 tracking-tight">
                                {product.minStock !== undefined && product.minStock !== null ? `${product.minStock} units` : 'Not Set'}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-stone-400 uppercase block mt-1">
                            Safety Buffer
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
