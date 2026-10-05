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
    const isDone = item.status === 'Completed' || item.status === 'Picked' || (item as any).packed === true || (item.pickedQty || 0) >= requiredAmount - 0.001;
    const isScanningThis = scannedItemIndex === idx;

    const expected = item.expectedQty || (item as any).quantity || 0;
    const picked = item.pickedQty || 0;
    const packDesc = formatPackagingDescription(product, expected);
    const unitDef = getSellUnit(product?.unit || item.unit);
    const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

    return (
        <div className={`group relative bg-white dark:bg-white/[0.02] border ${isScanningThis ? 'border-[#2C5E3B] dark:border-[#A9CBA2] bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/10 shadow-lg shadow-[#2C5E3B]/5 dark:shadow-[#A9CBA2]/5' :
            isDone ? 'border-green-200 dark:border-green-500/20 bg-green-50/60 dark:bg-green-500/[0.02]' : 'border-[#E2DCCE]/60 dark:border-white/5'
            } rounded-xl px-3 py-2.5 flex flex-col hover:bg-[#FAF8F5] dark:hover:bg-white/[0.04] transition-all duration-200 shadow-sm`}>

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Item Thumbnail */}
                    <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-lg bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {product?.image ? (
                            <img src={product.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-white/20">
                                <Package size={18} strokeWidth={1.5} />
                            </div>
                        )}
                        {isDone && (
                            <div className="absolute inset-0 bg-green-200/80 dark:bg-green-500/40 flex items-center justify-center">
                                <CheckCircle size={16} className="text-green-700 dark:text-green-300" />
                            </div>
                        )}
                    </div>

                    {/* Item Info */}
                    <div className="min-w-0">
                        <h4 className={`text-xs font-bold tracking-tight truncate uppercase leading-snug ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]'}`}>
                            {item.name || product?.name || 'Unknown SKU'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-mono font-bold text-gray-600 dark:text-[#A9CBA2] bg-stone-100 dark:bg-black/40 px-1.5 py-0.2 rounded border border-[#E2DCCE]/60 dark:border-white/5 uppercase tracking-tighter">
                                {item.sku || product?.sku || 'NO SKU'}
                            </span>
                            {formatProductSize(product || item) && (
                                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                    {formatProductSize(product || item)}
                                </span>
                            )}
                            {product?.barcode && (
                                <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase tracking-widest hidden sm:flex">
                                    <Barcode size={9} />
                                    {product.barcode}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pack Details */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                        <span className={`text-xs font-mono font-black ${isDone ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {picked} <span className="text-gray-400 font-normal">/ {expected} {unitLabel}</span>
                        </span>
                        {packDesc && (
                            <span className="text-[8px] text-teal-600 dark:text-teal-400 font-extrabold uppercase block leading-none mt-0.5">
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
                                    className="px-2.5 py-1 rounded-lg bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <span>Pack</span>
                                    <ArrowRight size={10} />
                                </button>
                            )}
                            {onPrintItemLabel && (
                                <button
                                    type="button"
                                    onClick={() => onPrintItemLabel(item, product, boxSize)}
                                    title="Print label"
                                    className="p-1 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-all cursor-pointer"
                                >
                                    <Printer size={12} />
                                </button>
                            )}
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${isDone ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                {isDone ? '✓ Packed' : 'Pending'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation UI (Expanded) */}
            {isScanningThis && (
                <div className="mt-2 pt-2 border-t border-[#E2DCCE]/60 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2 justify-between">
                    <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-bold flex items-center gap-1.5">
                        <CheckCircle size={12} /> {t('warehouse.packing.confirmQty')}
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="flex items-center bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-white/20 rounded-lg overflow-hidden shrink-0">
                            <button
                                type="button"
                                onClick={() => setConfirmQty(String(Math.max(1, parseInt(confirmQty || '1') - 1)))}
                                className="px-2.5 py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold text-xs"
                            >-</button>
                            <input
                                type="number"
                                inputMode="decimal"
                                pattern="[0-9]*"
                                aria-label="Confirm Quantity"
                                title="Confirm Quantity"
                                value={confirmQty}
                                onChange={e => setConfirmQty(e.target.value)}
                                className="w-12 bg-transparent text-center text-gray-900 dark:text-white font-mono font-bold outline-none text-xs"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && submitQtyConfirm()}
                            />
                            <button
                                type="button"
                                onClick={() => setConfirmQty(String((parseInt(confirmQty || '0')) + 1))}
                                className="px-2.5 py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold text-xs"
                            >+</button>
                        </div>
                        <button
                            onClick={submitQtyConfirm}
                            className="px-4 py-1 rounded-lg bg-[#2C5E3B] hover:bg-[#1B3520] dark:bg-[#EAE5D9] dark:hover:bg-[#DFD9CA] text-white dark:text-[#1E3B24] font-bold text-xs uppercase tracking-wider shadow-sm"
                        >OK</button>
                        <button
                            onClick={() => setScannedItemIndex(null)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 font-bold text-xs border border-gray-200 dark:border-white/10"
                        >X</button>
                    </div>
                </div>
            )}
        </div>
    );
};
