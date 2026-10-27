import {formatLocationIdentity} from '../../../../utils/locationIdentity';
import React from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { getProductForItem, getItemMeasureQty as getItemMeasureQtyShared } from '../utils/packItemHelpers';
import { formatProductSize } from '../../../../utils/units';

interface PackJobItemCardProps {
    item: any;
    job: WMSJob;
    products: Product[];
}

export const PackJobItemCard: React.FC<PackJobItemCardProps> = ({
    item,
    job,
    products,
}) => {
    const product = getProductForItem(item, job, products);
    const measureQty = getItemMeasureQtyShared(item, job, products, product);
    const requiredAmount = measureQty || item.expectedQty || 1;
    const packed = (item as any).packedQty ?? 0;
    const isDone = job.status === 'Completed' || (item as any).packed === true || packed >= requiredAmount - 0.001;


    return (
        <div className={`group relative bg-[var(--theme-bg-card)] border ${
            isDone ? 'border-green-500/20 bg-green-500/[0.02]' : 'border-[var(--theme-border)]'
        } rounded-2xl px-3.5 py-3 flex flex-col shadow-sm`}>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Item Thumbnail */}
                    <div className="relative w-11 h-11 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                        {product?.image ? (
                            <img src={product.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)]">
                                <Package size={20} strokeWidth={1.5} />
                            </div>
                        )}
                        {isDone && (
                            <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                <CheckCircle size={18} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Item Info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs font-semibold tracking-tight truncate uppercase leading-snug ${isDone ? 'text-[var(--theme-text-secondary)] opacity-70' : 'text-[var(--theme-text-primary)]'}`}>
                                {item.name || product?.name || 'Unknown SKU'}
                            </h4>
                            {/* Mobile-only status pill in top row */}
                            <span className={`sm:hidden px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
                                isDone
                                    ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}>
                                {isDone ? (
                                    <>
                                        <CheckCircle size={10} /> Packed
                                    </>
                                ) : 'Pending'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] uppercase shrink-0">
                                {item.sku || product?.sku || 'NO SKU'}
                            </span>
                            {formatProductSize(product || item) && (
                                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                                    {formatProductSize(product || item)}
                                </span>
                            )}
                            {(item?.location || product?.location) && (
                                <div className="flex items-center gap-1 text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase font-mono hidden sm:flex shrink-0">

                                    {formatLocationIdentity(item?.location || product?.location)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pack Details / Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--theme-border)]/60 shrink-0">
                    <div className="text-left sm:text-right">
                        <span className={`text-xs font-mono tabular-nums font-semibold ${isDone ? 'text-green-600 dark:text-green-400' : 'text-[var(--theme-text-primary)]'}`}>
                            {packed} <span className="text-[var(--theme-text-secondary)] font-normal">packed</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Desktop-only status badge */}
                        <span className={`hidden sm:flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border items-center gap-1 ${
                            isDone
                                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                            {isDone ? (
                                <>
                                    <CheckCircle size={11} /> Packed
                                </>
                            ) : 'Pending'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
