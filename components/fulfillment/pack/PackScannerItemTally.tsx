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
                <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <CheckCircle size={11} className="text-green-500" />
                    Packed Items
                </h4>
                <span className="text-[10px] font-mono font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
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
                            className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm"
                        >
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {product?.image ? (
                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={16} className="text-gray-400" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 dark:text-[#EAE5D9] text-xs font-bold truncate leading-tight">{item.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[9px] font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-stone-100 dark:bg-black/30 px-1.5 py-0.5 rounded uppercase">{item.sku}</span>
                                    {product?.category && (
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">{product.category}</span>
                                    )}
                                    {product?.size && (
                                        <span className="text-[9px] text-gray-400 font-mono">{product.size}{product.unit ? product.unit.toLowerCase() : ''}</span>
                                    )}
                                </div>
                            </div>

                            {/* Qty & Status */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                    isDone
                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                }`}>
                                    {packed} / {expected}
                                </span>
                                {isDone && (
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-green-500 flex items-center gap-0.5">
                                        <CheckCircle size={8} /> Done
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
