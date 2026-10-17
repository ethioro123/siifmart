import React from 'react';
import { Package, Tag, MapPin, DollarSign, Box, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { formatStockDisplay, getSellUnit } from '../../../utils/units';
import { formatProductDisplayName } from '../../procurement/utils';
import { SmartProductAttributeStrip } from '../../SmartProductAttributeStrip';
import { resolveSmartProductAttributes } from '../../../utils/groceryAttributes';

interface ProductProfileHeaderProps {
    product: Product;
    showCostPrice: boolean;
    currencySymbol?: string;
}

export const ProductProfileHeader: React.FC<ProductProfileHeaderProps> = ({
    product,
    showCostPrice,
    currencySymbol = CURRENCY_SYMBOL
}) => {
    const price = product.price || 0;
    const cost = product.costPrice || (product as any).cost || 0;
    const grossProfit = price - cost;
    const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
    const totalAssetValue = (product.stock || 0) * price;

    const smart = resolveSmartProductAttributes(product, undefined, currencySymbol);
    const sellUnit = product.unit ? getSellUnit(product.unit) : null;

    // Determine status badge
    let statusConfig = {
        label: 'In Stock',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        stockTextClass: 'text-emerald-700 dark:text-emerald-300'
    };

    if (product.stock <= 0) {
        statusConfig = {
            label: 'Out of Stock',
            badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
            dotClass: 'bg-red-500',
            stockTextClass: 'text-red-600 dark:text-red-400'
        };
    } else if (product.minStock && product.stock <= product.minStock) {
        statusConfig = {
            label: 'Low Stock Alert',
            badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
            dotClass: 'bg-amber-500',
            stockTextClass: 'text-amber-700 dark:text-amber-300'
        };
    }

    return (
        <div className="bg-[var(--theme-bg-panel)] p-5 sm:p-6 rounded-3xl border border-[var(--theme-border)] space-y-5">
            {/* Top Identity Row */}
            <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden relative group">
                        {product.image && !product.image.includes('placeholder.com') ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={30} className="text-[var(--theme-text-muted)]" />
                        )}
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--theme-bg-panel)] shadow-xs shrink-0" style={{ backgroundColor: product.stock > 0 ? '#10b981' : '#ef4444' }} />
                    </div>

                    {/* Titles and Badges */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                        {/* Meta Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)]">
                                {smart.subcategory ? `${product.category} › ${smart.subcategory}` : (product.category || 'General Catalog')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                SKU: {product.sku}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${statusConfig.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} animate-pulse`} />
                                {statusConfig.label}
                            </span>
                        </div>

                        {/* Product Title */}
                        <h2 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight leading-tight truncate">
                            {formatProductDisplayName(product) || product.name}
                        </h2>

                        {/* Location Subtext */}
                        <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--theme-text-muted)]">
                            <MapPin size={13} className="text-[var(--theme-text-secondary)] shrink-0" />
                            <span>Primary Bay: <span className="font-mono text-[var(--theme-text-primary)] uppercase font-semibold">{product.location || 'Unassigned Bay'}</span></span>
                            {product.shelfPosition && (
                                <span className="text-[var(--theme-text-muted)]">· Shelf {product.shelfPosition}</span>
                            )}
                        </div>

                        {/* Smart Grocery Attribute Pills */}
                        <SmartProductAttributeStrip
                            item={product}
                            currencySymbol={currencySymbol}
                            maxPills={7}
                            showDomainSpecs={true}
                            showUnitPrice={true}
                            className="pt-1"
                        />
                    </div>
                </div>
            </div>

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {/* 1. Retail Price */}
                <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                        Retail Selling Price
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-mono font-bold text-[var(--theme-text-primary)] tracking-tight">
                            {currencySymbol} {formatPriceValue(product.price)}
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase font-mono">
                            /{sellUnit?.shortLabel || 'unit'}
                        </span>
                    </div>
                    {product.salePrice && product.salePrice > 0 ? (
                        <span className="inline-block mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-300 font-mono">
                            Promo: {currencySymbol} {formatPriceValue(product.salePrice)}
                        </span>
                    ) : smart.unitPriceLabel ? (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[var(--theme-text-secondary)] font-mono">
                            Equiv: {smart.unitPriceLabel}
                        </span>
                    ) : null}
                </div>

                {/* 2. Stock Level */}
                <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                        Available On-Hand
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-lg sm:text-xl font-mono font-black tracking-tight ${statusConfig.stockTextClass}`}>
                            {formatStockDisplay(product.stock, product)}
                        </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] uppercase block mt-1 tracking-wide">
                        {smart.stockBreakdown || smart.packBadge}
                    </span>
                </div>

                {/* 3. Total Asset Value */}
                <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                        Total Stock Value
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-mono font-bold text-[var(--theme-text-primary)] tracking-tight">
                            {currencySymbol} {totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase block mt-1 font-mono">
                        {product.stock} × {formatPriceValue(product.price)}
                    </span>
                </div>

                {/* 4. Margin & Profit (If privileged role) or Reorder Level */}
                {showCostPrice ? (
                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                            Gross Margin
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-mono font-bold text-emerald-600 dark:text-emerald-300 tracking-tight">
                                {marginPct > 0 ? `${marginPct.toFixed(1)}%` : '0%'}
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase block mt-1 font-mono">
                            Cost: {currencySymbol}{formatPriceValue(cost)}
                        </span>
                    </div>
                ) : (
                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                            Min Safety Threshold
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-mono font-bold text-amber-600 dark:text-amber-300 tracking-tight">
                                {product.minStock !== undefined && product.minStock !== null ? `${product.minStock} units` : 'Not Set'}
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase block mt-1">
                            Safety Buffer
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
