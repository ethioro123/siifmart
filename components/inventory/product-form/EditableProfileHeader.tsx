import React from 'react';
import { Package, Tag, MapPin, DollarSign, Camera, TrendingUp } from 'lucide-react';
import { formatPriceValue } from '../../../utils/formatting';
import { formatStockDisplay, getSellUnit } from '../../../utils/units';

interface EditableProfileHeaderProps {
    formData: any;
    register: any;
    setValue: (name: string, value: any) => void;
    showCostPrice: boolean;
    currencySymbol: string;
    onOpenImageModal: () => void;
}

export const EditableProfileHeader: React.FC<EditableProfileHeaderProps> = ({
    formData,
    register,
    showCostPrice,
    currencySymbol,
    onOpenImageModal
}) => {
    const price = Number(formData.price) || 0;
    const cost = Number(formData.costPrice) || 0;
    const stock = Number(formData.stock) || 0;
    const minStock = formData.minStock !== null && formData.minStock !== undefined && formData.minStock !== ''
        ? Number(formData.minStock)
        : undefined;
    const salePrice = Number(formData.salePrice) || 0;
    const packQuantity = Number(formData.packQuantity) || 1;

    const grossProfit = price - cost;
    const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
    const totalAssetValue = stock * price;

    const sellUnit = formData.unit ? getSellUnit(formData.unit) : null;

    // Determine status badge based on live values
    let statusConfig = {
        label: 'In Stock',
        badgeClass: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
        dotClass: 'bg-[var(--theme-status-success-bg)]',
        stockTextClass: 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
    };

    if (stock <= 0) {
        statusConfig = {
            label: 'Out of Stock',
            badgeClass: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]',
            dotClass: 'bg-[var(--theme-status-danger-bg)]',
            stockTextClass: 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
        };
    } else if (minStock !== undefined && stock <= minStock) {
        statusConfig = {
            label: 'Low Stock Alert',
            badgeClass: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
            dotClass: 'bg-[var(--theme-status-warning-bg)]',
            stockTextClass: 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]'
        };
    }

    return (
        <div className="bg-[var(--theme-bg-panel)] p-5 sm:p-6 rounded-3xl border border-[var(--theme-border)] space-y-5">
            {/* Top Identity Row */}
            <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Thumbnail with Hover Camera Overlay */}
                    <button
                        type="button"
                        onClick={onOpenImageModal}
                        title="Click to update photo"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer transition-all hover:ring-2 hover:ring-[var(--theme-accent)]"
                    >
                        {formData.image && !formData.image.includes('placeholder.com') ? (
                            <img src={formData.image} alt={formData.name || 'Product'} className="w-full h-full object-cover transition-opacity group-hover:opacity-60" />
                        ) : (
                            <Package size={30} className="text-[var(--theme-text-muted)] group-hover:opacity-40 transition-opacity" />
                        )}
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--theme-bg-panel)] shadow-xs shrink-0" style={{ backgroundColor: stock > 0 ? 'var(--theme-status-success)' : 'var(--theme-status-danger)' }} />
                        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[var(--theme-text-primary)] transition-opacity">
                            <Camera size={18} />
                            <span className="text-[11px] font-bold uppercase tracking-tighter mt-0.5">Edit</span>
                        </div>
                    </button>

                    {/* Titles and Badges */}
                    <div className="space-y-2 min-w-0 flex-1">
                        {/* Meta Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)]">
                                {formData.category || 'General Catalog'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                SKU: {formData.sku || 'PENDING'}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${statusConfig.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} animate-pulse`} />
                                {statusConfig.label}
                            </span>
                        </div>

                        {/* Product Title & Brand Editable Fields */}
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <input
                                {...register('brand')}
                                placeholder="Brand / Maker"
                                className="w-full sm:w-44 px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)] focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                            />
                            <input
                                {...register('name')}
                                placeholder="Product Name *"
                                className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-primary)] transition-all"
                            />
                        </div>

                        {/* Location Subtext */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[var(--theme-text-muted)] pt-0.5">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-[var(--theme-text-secondary)] shrink-0" />
                                <span>Bay:</span>
                                <input
                                    {...register('location')}
                                    placeholder="e.g. A-04-12"
                                    className="px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] font-mono font-semibold uppercase text-[var(--theme-text-primary)] w-28 focus:outline-none focus:border-[var(--theme-primary)]"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>Shelf:</span>
                                <input
                                    {...register('shelfPosition')}
                                    placeholder="e.g. Eye Level"
                                    className="px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-primary)] w-28 focus:outline-none focus:border-[var(--theme-primary)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {/* 1. Retail Selling Price */}
                <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] block mb-1">
                        Retail Selling Price
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">{currencySymbol}</span>
                        <input
                            type="number"
                            step="0.01"
                            {...register('price', { valueAsNumber: true })}
                            className="w-full text-lg sm:text-xl font-mono font-bold text-[var(--theme-text-primary)] bg-transparent border-b border-transparent hover:border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
                        />
                        <span className="text-[11px] font-medium text-[var(--theme-text-muted)] uppercase font-mono">
                            /{sellUnit?.shortLabel || formData.unit || 'unit'}
                        </span>
                    </div>
                    {salePrice > 0 && (
                        <span className="inline-block mt-1 text-[11px] font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-mono">
                            Promo: {currencySymbol} {formatPriceValue(salePrice)}
                        </span>
                    )}
                </div>

                {/* 2. Stock Level */}
                <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] block mb-1">
                        Available On-Hand
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <input
                            type="number"
                            {...register('stock', { valueAsNumber: true })}
                            className={`w-full text-lg sm:text-xl font-mono font-bold bg-transparent border-b border-transparent hover:border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors ${statusConfig.stockTextClass}`}
                        />
                    </div>
                    <span className="text-[11px] font-medium text-[var(--theme-text-muted)] uppercase block mt-1">
                        {packQuantity > 1 ? `Pack of ${packQuantity}` : 'Single Unit'}
                    </span>
                </div>

                {/* 3. Total Asset Value */}
                <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] block mb-1">
                        Total Stock Value
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-mono font-bold text-[var(--theme-text-primary)] tracking-tight tabular-nums">
                            {currencySymbol} {totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--theme-text-muted)] uppercase block mt-1 font-mono">
                        {stock} × {formatPriceValue(price)}
                    </span>
                </div>

                {/* 4. Margin & Profit or Min Safety Threshold */}
                {showCostPrice ? (
                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] block mb-1">
                            Gross Margin
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-mono font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] tracking-tight tabular-nums">
                                {marginPct > 0 ? `${marginPct.toFixed(1)}%` : '0%'}
                            </span>
                        </div>
                        <span className="text-[11px] font-medium text-[var(--theme-text-muted)] uppercase block mt-1 font-mono">
                            Cost: {currencySymbol}{formatPriceValue(cost)}
                        </span>
                    </div>
                ) : (
                    <div className="bg-[var(--theme-bg-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] block mb-1">
                            Min Safety Threshold
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-mono font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] tracking-tight">
                                {minStock !== undefined ? `${minStock} units` : 'Not Set'}
                            </span>
                        </div>
                        <span className="text-[11px] font-medium text-[var(--theme-text-muted)] uppercase block mt-1">
                            Safety Buffer
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
