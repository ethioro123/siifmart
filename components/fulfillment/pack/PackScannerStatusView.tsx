import React from 'react';
import { CheckCircle, AlertTriangle, ScanLine, Package } from 'lucide-react';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PackScannerStatusViewProps {
    step: 'SCAN' | 'CONFIRM_QTY';
    showSuccess: boolean;
    showError: boolean;
    successMsg: string;
    errorMsg: string;
    isFullyPacked: boolean;
    matchedItem: any | null;
    matchedProduct: Product | null | undefined;
    nextUnpackedItem: any | null | undefined;
    job: any;
    getItemMeasureQty: (item: any, product?: Product | null) => number | null;
    getProduct: (item: any) => Product | undefined;
}

export const PackScannerStatusView: React.FC<PackScannerStatusViewProps> = ({
    step,
    showSuccess,
    showError,
    successMsg,
    errorMsg,
    isFullyPacked,
    matchedItem,
    matchedProduct,
    nextUnpackedItem,
    job,
    getItemMeasureQty,
    getProduct,
}) => {
    const { t } = useLanguage();

    return (
        <>
            {/* Icon Circle */}
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center mb-2 shadow-md z-10 transition-all duration-300 ${
                showSuccess
                    ? 'border-green-400 bg-green-400/20 shadow-green-400/30 scale-105'
                    : showError
                        ? 'border-red-500 bg-red-500/20 shadow-red-500/30 scale-105 animate-shake'
                        : isFullyPacked
                            ? 'border-green-500 bg-green-500/10 shadow-green-500/20'
                            : step === 'CONFIRM_QTY'
                                ? 'border-[#A9CBA2] bg-[#A9CBA2]/10 shadow-[#A9CBA2]/30'
                                : 'border-[#2C5E3B] bg-[#2C5E3B]/10 shadow-[#2C5E3B]/20'
            }`}>
                {showSuccess ? (
                    <CheckCircle size={28} className="text-green-400 animate-bounce" />
                ) : showError ? (
                    <AlertTriangle size={28} className="text-red-500" />
                ) : isFullyPacked ? (
                    <CheckCircle size={28} className="text-green-400" />
                ) : step === 'CONFIRM_QTY' ? (
                    <Package size={28} className="text-[#A9CBA2]" />
                ) : (
                    <ScanLine size={28} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                )}
            </div>

            {/* Instruction / Status heading */}
            <h1 className={`text-xl md:text-2xl font-black text-gray-900 dark:text-[#EAE5D9] text-center uppercase italic tracking-tight mb-1 z-10 transition-all duration-300 ${
                showError ? 'text-red-500 animate-pulse' : ''
            }`}>
                {showSuccess ? 'Packed!' : showError ? 'Error!' : isFullyPacked
                    ? t('warehouse.completed')
                    : step === 'CONFIRM_QTY'
                        ? 'Confirm Qty'
                        : t('warehouse.scanBarcode').split(' ')[0]}
            </h1>

            {/* Status sub-content */}
            {showSuccess ? (
                <div className="text-center z-10 mb-4 animate-in fade-in zoom-in duration-300">
                    <p className="text-green-400 text-sm font-bold uppercase tracking-widest">{successMsg}</p>
                </div>
            ) : showError ? (
                <div className="text-center z-10 mb-4 animate-in fade-in zoom-in duration-300">
                    <p className="text-red-500 text-sm font-bold uppercase tracking-widest">{errorMsg}</p>
                </div>
            ) : isFullyPacked ? (
                /* COMPLETION VIEW */
                <div className="text-center z-10 mb-4 bg-green-500/10 border border-green-500/40 p-4 rounded-xl shadow-sm w-full max-w-md">
                    <p className="text-green-600 dark:text-green-400 text-sm font-bold uppercase tracking-widest mb-3">All Items Verified!</p>
                    <div className="bg-white dark:bg-black/40 rounded-lg p-3 mb-3 text-left max-h-40 overflow-y-auto border border-green-500/20">
                        <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 border-b border-gray-100 dark:border-white/10 pb-1">Pack Summary</h4>
                        <div className="flex flex-col gap-2">
                            {job.lineItems?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-900 dark:text-[#EAE5D9] font-bold truncate">{item.name}</span>
                                    <span className="text-green-600 dark:text-green-400 font-mono font-bold shrink-0 ml-2">
                                        {item.pickedQty || 0} / {item.expectedQty || 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : step === 'CONFIRM_QTY' && matchedItem ? (
                /* CONFIRM QUANTITY VIEW — Rich Full-Detail Product Card */
                <div className="z-10 mb-3 w-full max-w-md">
                    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-md flex flex-col gap-3 text-left">
                        {/* Header: Thumbnail + Name + Category + SKU */}
                        <div className="flex items-start gap-3.5">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {matchedProduct?.image ? (
                                    <img src={matchedProduct.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={28} className="text-gray-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-gray-900 dark:text-[#EAE5D9] text-base font-bold leading-snug truncate uppercase">{matchedItem.name}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-stone-100 dark:bg-black/40 px-2 py-0.5 rounded border border-[#E2DCCE]/60 dark:border-white/5 uppercase">
                                        SKU: {matchedItem.sku}
                                    </span>
                                    {matchedProduct?.barcode && (
                                        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
                                            BARCODE: {matchedProduct.barcode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-gray-100 dark:border-white/5 text-xs">
                            <div className="bg-stone-50 dark:bg-black/20 p-2 rounded-lg border border-stone-200/60 dark:border-white/5">
                                <span className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest block leading-none mb-1">Category</span>
                                <span className="text-gray-900 dark:text-white font-bold truncate block">{matchedProduct?.category || 'Pantry & Dry Goods'}</span>
                            </div>
                            <div className="bg-stone-50 dark:bg-black/20 p-2 rounded-lg border border-stone-200/60 dark:border-white/5">
                                <span className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest block leading-none mb-1">Unit / Size</span>
                                <span className="text-gray-900 dark:text-white font-bold truncate block">
                                    {matchedProduct?.size ? `${matchedProduct.size}${matchedProduct.unit ? matchedProduct.unit.toLowerCase() : ''}` : matchedItem.unit || 'Unit'}
                                </span>
                            </div>
                            <div className="bg-stone-50 dark:bg-black/20 p-2 rounded-lg border border-stone-200/60 dark:border-white/5">
                                <span className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest block leading-none mb-1">Location</span>
                                <span className="text-gray-900 dark:text-white font-bold truncate block">
                                    {(matchedProduct as any)?.shelf || (matchedProduct as any)?.location || 'On Order'}
                                </span>
                            </div>
                        </div>

                        {/* Expected vs Packed Large Number Banner */}
                        <div className="bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-white/10 p-2.5 rounded-xl flex items-center justify-around text-center">
                            <div>
                                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest block leading-none mb-0.5">{t('warehouse.expected')}</span>
                                <span className="text-2xl font-mono font-black text-gray-900 dark:text-white leading-none">
                                    {matchedItem.expectedQty || 1}
                                </span>
                            </div>
                            <div className="text-gray-400 text-lg font-bold">&rarr;</div>
                            <div>
                                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest block leading-none mb-0.5">{t('warehouse.packed') || 'Packed'}</span>
                                <span className="text-2xl font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] leading-none">
                                    {matchedItem.pickedQty || 0}
                                </span>
                            </div>
                        </div>

                        {/* Warnings / Flags */}
                        {matchedItem.orderedQty && matchedItem.orderedQty > (matchedItem.expectedQty || 0) && (
                            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-500 text-[10px] font-bold flex items-center gap-1.5">
                                <AlertTriangle size={12} /> Short Picked — Originally ordered: {matchedItem.orderedQty}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* SCAN VIEW — guidance without repeating */
                <div className="text-center z-10 mb-4">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('warehouse.scanProductBarcode')}</p>
                    {nextUnpackedItem && (
                        <div className="mt-2 bg-white/60 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 inline-flex items-center gap-3">
                            <span className="text-gray-900 dark:text-[#EAE5D9] text-xs font-bold">{nextUnpackedItem.name}</span>
                            <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-[10px] font-bold bg-stone-100 dark:bg-black/40 px-2 py-0.5 rounded">{nextUnpackedItem.sku}</span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default PackScannerStatusView;
