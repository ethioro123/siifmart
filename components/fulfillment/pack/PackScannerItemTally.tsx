import {formatLocationIdentity} from '../../../utils/locationIdentity';
import React from 'react';
import { CheckCircle, Clock, Package } from 'lucide-react';
import { Product } from '../../../types';
import { formatProductSize } from '../../../utils/units';

interface PackScannerItemTallyProps {
    packedItems: any[];
    unpackedItems?: any[];
    activeItemSku?: string;
    totalItems: number;
    getItemMeasureQty: (item: any, product?: Product | null) => number | null;
    getProduct: (item: any) => Product | undefined;
}

export const PackScannerItemTally: React.FC<PackScannerItemTallyProps> = ({
    packedItems,
    unpackedItems = [],
    activeItemSku,
    totalItems,
    getProduct,
}) => {
    const queuedItems = unpackedItems.filter(
        (item, index) => index > 0 || (activeItemSku && item?.sku !== activeItemSku)
    );

    if (packedItems.length === 0 && queuedItems.length === 0) return null;

    return (
        <div className="w-full max-w-3xl mt-3 z-10 space-y-3">
            {/* Additional Unpacked Queue (can be scanned in any order) */}
            {queuedItems.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-1.5 px-1">
                        <h4 className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-[var(--theme-accent)]" />
                            Up Next in Tote (Scan Any Order)
                        </h4>
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                            {queuedItems.length} more
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {queuedItems.map((item: any, idx: number) => {
                            const product = getProduct(item);
                            const sizeLabel = formatProductSize(product || item);

                            return (
                                <div
                                    key={`queued-${item.sku || idx}-${idx}`}
                                    className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                        {product?.image ? (
                                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={15} className="text-[var(--theme-text-secondary)]/50" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[var(--theme-text-primary)] text-xs font-semibold truncate leading-tight">
                                            {item.name || product?.name || 'Item'}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded uppercase">
                                                {item.sku || product?.sku}
                                            </span>
                                            {(item?.location || product?.location) && (
                                                <span className="text-[10px] font-mono tabular-nums text-[var(--theme-text-secondary)] flex items-center gap-1">

                                                    {formatLocationIdentity(item?.location || product?.location)}
                                                </span>
                                            )}
                                            {sizeLabel && (
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                                    {sizeLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                                        Scan Ready
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Packed & Verified Items */}
            {packedItems.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-1.5 px-1">
                        <h4 className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle size={13} className="text-emerald-500" />
                            Packed Items
                        </h4>
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            {packedItems.length} / {totalItems}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {packedItems.map((item: any, idx: number) => {
                            const product = getProduct(item);
                            const packed = (item as any).packedQty ?? 0;
                            const expected = item.expectedQty || 1;
                            const isDone = (item as any).packed === true || packed >= expected - 0.001;
                            const sizeLabel = formatProductSize(product || item);

                            return (
                                <div
                                    key={`packed-${item.sku || idx}-${idx}`}
                                    className="bg-[var(--theme-bg-card)] border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0">
                                        {product?.image ? (
                                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={15} className="text-emerald-600 dark:text-emerald-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[var(--theme-text-primary)] text-xs font-semibold truncate leading-tight">
                                            {item.name || product?.name}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[11px] font-mono tabular-nums font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded uppercase">
                                                {item.sku}
                                            </span>
                                            {sizeLabel && (
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                                    {sizeLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1.5">
                                        <span className={`text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                            isDone
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        }`}>
                                            {packed} packed
                                        </span>
                                        {isDone && (
                                            <CheckCircle size={15} className="text-emerald-500 shrink-0" aria-label="Done" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackScannerItemTally;
