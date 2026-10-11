import React from 'react';
import { Product } from '../../../types';
import { getSellUnit } from '../../../utils/units';

interface Props {
    product: Product;
    currencySymbol?: string;
}

export const ProfileTab: React.FC<Props> = ({ product, currencySymbol = 'ETB' }) => {
    const unitDef = getSellUnit(product.unit);
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">SKU</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5">{product.sku}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Barcode</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5">{product.barcode || '—'}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Brand / Manufacturer</p>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] mt-0.5">{product.brand || '—'}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Category</p>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] mt-0.5">{product.category}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Current Stock</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{product.stock} {unitDef.shortLabel}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Retail Price</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5">{currencySymbol} {product.price}</p>
                </div>
            </div>

            {product.description && (
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Description</p>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed">{product.description}</p>
                </div>
            )}
        </div>
    );
};

