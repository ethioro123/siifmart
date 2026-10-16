import React from 'react';
import { Package, CheckCircle, Barcode, Printer, ArrowRight } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { getProductForItem, getItemMeasureQty as getItemMeasureQtyShared } from '../utils/packItemHelpers';
import { getSellUnit, formatProductSize, formatPackagingDescription } from '../../../../utils/units';

interface PackJobItemCardProps {
    item: any;
    idx: number;
    job: WMSJob;
    products: Product[];
    boxSize: string;
    scannedItemIndex: number | null;
    confirmQty: string;
    setConfirmQty: (val: string) => void;
    setScannedItemIndex: (idx: number | null) => void;
    submitQtyConfirm: () => void;
    onPrintItemLabel?: (item: any, product?: any, boxSize?: string) => void;
    t: (key: string) => string;
}

export const PackJobItemCard: React.FC<PackJobItemCardProps> = ({
    item,
    idx,
    job,
    products,
    boxSize,
    scannedItemIndex,
    confirmQty,
    setConfirmQty,
    setScannedItemIndex,
    submitQtyConfirm,
    onPrintItemLabel,
    t,
}) => {
    const product = getProductForItem(item, job, products);
    const measureQty = getItemMeasureQtyShared(item, job, products, product);
    const requiredAmount = measureQty || item.expectedQty || 1;
    const packed = (item as any).packedQty ?? 0;
    const isDone = job.status === 'Completed' || (item as any).packed === true || packed >= requiredAmount - 0.001;
    const isScanningThis = scannedItemIndex === idx;

    const expected = item.expectedQty || (item as any).quantity || 0;
    const packDesc = formatPackagingDescription(product, expected);
    const unitDef = getSellUnit(product?.unit || item.unit);
    const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

    return (
        <div className={`group relative bg-[var(--theme-bg-card)] border ${
            isScanningThis
                ? 'border-[var(--theme-accent)] shadow-md'
                : isDone
                    ? 'border-green-500/20 bg-green-500/[0.02]'
                    : 'border-[var(--theme-border)]'
        } rounded-2xl px-3.5 py-3 flex flex-col hover:border-[var(--theme-accent)]/30 transition-all duration-200 shadow-sm`}>

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
                            <h4 className={`text-xs font-semibold tracking-tight truncate uppercase leading-snug ${isDone ? 'line-through text-[var(--theme-text-secondary)] opacity-60' : 'text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)]'}`}>
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
                            {product?.barcode && (
                                <div className="flex items-center gap-1 text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase font-mono hidden sm:flex shrink-0">
                                    <Barcode size={11} />
                                    {product.barcode}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pack Details / Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--theme-border)]/60 shrink-0">
                    <div className="text-left sm:text-right">
                        <span className={`text-xs font-mono tabular-nums font-semibold ${isDone ? 'text-green-600 dark:text-green-400' : 'text-[var(--theme-text-primary)]'}`}>
                            {packed} <span className="text-[var(--theme-text-secondary)] font-normal">/ {expected} {unitLabel}</span>
                        </span>
                        {packDesc && (
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block leading-none mt-0.5">
                                ({packDesc})
                            </span>
                        )}
                    </div>

                    {!isScanningThis && (
                        <div className="flex items-center gap-1.5">
                            {!isDone && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScannedItemIndex(idx);
                                        setConfirmQty(String(item.expectedQty || 1));
                                    }}
                                    className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer touch-manipulation"
                                >
                                    <span>Pack</span>
                                    <ArrowRight size={12} />
                                </button>
                            )}
                            {onPrintItemLabel && (
                                <button
                                    type="button"
                                    onClick={() => onPrintItemLabel(item, product, boxSize)}
                                    title="Print label"
                                    className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
                                >
                                    <Printer size={14} />
                                </button>
                            )}
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
                    )}
                </div>
            </div>

            {/* Confirmation UI (Expanded) */}
            {isScanningThis && (
                <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex flex-col sm:flex-row items-center gap-2 justify-between">
                    <p className="text-xs text-[var(--theme-accent)] font-semibold flex items-center gap-1.5">
                        <CheckCircle size={14} /> {t('warehouse.packing.confirmQty')}
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl overflow-hidden shrink-0">
                            <button
                                type="button"
                                onClick={() => setConfirmQty(String(Math.max(1, parseInt(confirmQty || '1') - 1)))}
                                className="px-3 py-1.5 hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-bold text-sm min-h-[36px]"
                            >-</button>
                            <input
                                type="number"
                                inputMode="decimal"
                                pattern="[0-9]*"
                                aria-label="Confirm Quantity"
                                title="Confirm Quantity"
                                value={confirmQty}
                                onChange={e => setConfirmQty(e.target.value)}
                                className="w-12 bg-transparent text-center text-[var(--theme-text-primary)] font-mono font-semibold outline-none text-xs"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && submitQtyConfirm()}
                            />
                            <button
                                type="button"
                                onClick={() => setConfirmQty(String((parseInt(confirmQty || '0')) + 1))}
                                className="px-3 py-1.5 hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-bold text-sm min-h-[36px]"
                            >+</button>
                        </div>
                        <button
                            onClick={submitQtyConfirm}
                            className="px-4 py-2 min-h-[36px] rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs uppercase tracking-wider transition-opacity cursor-pointer"
                        >OK</button>
                        <button
                            onClick={() => setScannedItemIndex(null)}
                            className="px-3 py-2 min-h-[36px] rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs border border-[var(--theme-border)] cursor-pointer"
                        >X</button>
                    </div>
                </div>
            )}
        </div>
    );
};
