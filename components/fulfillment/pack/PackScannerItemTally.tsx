import React from 'react';
import { CheckCircle, Package } from 'lucide-react';
import { Product } from '../../../types';

interface PackScannerItemTallyProps {
    packedItems: any[];
    totalItems: number;
    getItemMeasureQty: (item: any, product?: Product | null) => number | null;
    getProduct: (item: any) => Product | undefined;
}

export const PackScannerItemTally: React.FC<PackScannerItemTallyProps> = ({
    packedItems,
    totalItems,
    getProduct,
}) => {
    if (packedItems.length === 0) return null;

    return (
        <div className="w-full max-w-md mt-3 z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-green-500" />
                    Packed Items
                </h4>
                <span className="text-[11px] font-mono tabular-nums font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                    {packedItems.length} / {totalItems}
                </span>
            </div>

            {/* Item Cards */}
            <div className="flex flex-col gap-2">
                {packedItems.map((item: any, idx: number) => {
                    const product = getProduct(item);
                    const packed = item.pickedQty ?? item.packedQty ?? 0;
                    const expected = item.expectedQty || 1;
                    const isDone = packed >= expected - 0.001;

                    return (
                        <div
                            key={idx}
                            className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3 flex items-center gap-3 shadow-sm"
                        >
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                {product?.image ? (
                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={16} className="text-[var(--theme-text-secondary)]/50" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[var(--theme-text-primary)] text-xs font-semibold truncate leading-tight">{item.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[11px] font-mono tabular-nums font-medium text-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded uppercase">{item.sku}</span>
                                    {product?.category && (
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider truncate">{product.category}</span>
                                    )}
                                    {product?.size && (
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">{product.size}{product.unit ? product.unit.toLowerCase() : ''}</span>
                                    )}
                                </div>
                            </div>

                            {/* Qty & Status */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                                <span className={`text-xs font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                    isDone
                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                }`}>
                                    {packed} / {expected}
                                </span>
                                {isDone && (
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-green-500 flex items-center gap-1">
                                        <CheckCircle size={12} /> Done
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PackScannerItemTally;
