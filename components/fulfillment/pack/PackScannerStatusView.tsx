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
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 shadow-2xl z-10 transition-all duration-500 ${
                showSuccess
                    ? 'border-green-400 bg-green-400/20 shadow-green-400/40 scale-110'
                    : showError
                        ? 'border-red-500 bg-red-500/20 shadow-red-500/40 scale-110 animate-shake'
                        : isFullyPacked
                            ? 'border-green-500 bg-green-500/10 shadow-green-500/20'
                            : step === 'CONFIRM_QTY'
                                ? 'border-[#A9CBA2] bg-[#A9CBA2]/10 shadow-[#A9CBA2]/40'
                                : 'border-[#2C5E3B] bg-[#2C5E3B]/10 shadow-[#2C5E3B]/20'
            }`}>
                {showSuccess ? (
                    <CheckCircle size={64} className="text-green-400 animate-bounce" />
                ) : showError ? (
                    <AlertTriangle size={64} className="text-red-500" />
                ) : isFullyPacked ? (
                    <CheckCircle size={64} className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                ) : step === 'CONFIRM_QTY' ? (
                    <Package size={64} className="text-[#A9CBA2] drop-shadow-[0_0_15px_rgba(169,203,162,0.6)]" />
                ) : (
                    <ScanLine size={64} className="text-[#2C5E3B] dark:text-[#A9CBA2] drop-shadow-[0_0_10px_rgba(44,94,59,0.5)]" />
                )}
            </div>

            {/* Instruction / Status heading */}
            <h1 className={`text-4xl md:text-5xl font-black text-gray-900 dark:text-[#EAE5D9] text-center uppercase italic tracking-tight mb-2 z-10 transition-all duration-300 ${
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
                <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                    <p className="text-green-400 text-xl font-bold uppercase tracking-widest">{successMsg}</p>
                </div>
            ) : showError ? (
                <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                    <p className="text-red-500 text-xl font-bold uppercase tracking-widest">{errorMsg}</p>
                </div>
            ) : isFullyPacked ? (
                /* COMPLETION VIEW */
                <div className="text-center z-10 mb-8 bg-green-500/10 border-2 border-green-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.1)] w-full max-w-md">
                    <p className="text-green-600 dark:text-green-400 text-lg font-bold uppercase tracking-widest mb-4">All Items Verified!</p>
                    <div className="bg-white dark:bg-black/40 rounded-xl p-4 mb-4 text-left max-h-48 overflow-y-auto border border-green-500/20 shadow-inner">
                        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-white/10 pb-2">Pack Summary</h4>
                        <div className="flex flex-col gap-3">
                            {job.lineItems?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-900 dark:text-[#EAE5D9] text-sm font-bold line-clamp-1">{item.name}</p>
                                        <p className="text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-mono">{item.sku}</p>
                                    </div>
                                    <div className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-sm font-black font-mono whitespace-nowrap ml-4 border border-green-500/10">
                                        {(() => {
                                            const expected = item.expectedQty || 1;
                                            const picked = item.pickedQty || 0;
                                            const measureQty = getItemMeasureQty(item);
                                            if (measureQty !== null && measureQty !== undefined) {
                                                const prod = getProduct(item);
                                                const unitDef = prod?.unit || '';
                                                const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                                const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                                return <>{displayPickedCases} x {sizeNum} / {expected} x {sizeNum} <span className="text-[9px] lowercase opacity-80 pl-0.5">{unitDef}</span></>;
                                            }
                                            return <>{picked} / {expected}</>;
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-gray-650 dark:text-white text-sm opacity-80 max-w-[200px] mx-auto">Tap below to complete packing and seal this shipment.</p>
                </div>
            ) : step === 'CONFIRM_QTY' && matchedItem ? (
                /* CONFIRM QUANTITY VIEW */
                <div className="text-center z-10 mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                            {matchedProduct?.image ? (
                                <img src={matchedProduct.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Package size={32} className="text-gray-400 dark:text-gray-605" />
                            )}
                        </div>
                    </div>
                    <p className="text-gray-900 dark:text-[#EAE5D9] text-2xl font-bold mt-1">{matchedItem.name}</p>
                    <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-xl mt-1">{matchedItem.sku}</p>
                    <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="text-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">{t('warehouse.expected')}</span>
                            <span className="text-3xl font-mono font-black text-gray-900 dark:text-white">
                                {(() => {
                                    const measureQty = getItemMeasureQty(matchedItem, matchedProduct);
                                    if (measureQty !== null && measureQty !== undefined) {
                                        const expected = matchedItem.expectedQty || 1;
                                        const unitDef = matchedProduct?.unit || '';
                                        const sizeNum = matchedProduct?.size ? parseFloat(matchedProduct.size as string) : 0;
                                        return <>{expected} x {sizeNum} <span className="text-sm uppercase text-gray-400">{unitDef}</span></>;
                                    }
                                    return matchedItem.expectedQty || 1;
                                })()}
                            </span>
                        </div>
                        <div className="text-gray-600 text-2xl">&rarr;</div>
                        <div className="text-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">{t('warehouse.packed') || 'Packed'}</span>
                            <span className="text-3xl font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2]">
                                {(() => {
                                    const expected = matchedItem.expectedQty || 1;
                                    const picked = matchedItem.pickedQty || 0;
                                    const measureQty = getItemMeasureQty(matchedItem, matchedProduct);
                                    if (measureQty !== null && measureQty !== undefined) {
                                        const unitDef = matchedProduct?.unit || '';
                                        const sizeNum = matchedProduct?.size ? parseFloat(matchedProduct.size as string) : 0;
                                        const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                        return <>{displayPickedCases} x {sizeNum} <span className="text-sm uppercase opacity-60">{unitDef}</span></>;
                                    }
                                    return picked;
                                })()}
                            </span>
                        </div>
                    </div>
                    {matchedItem.orderedQty && matchedItem.orderedQty > (matchedItem.expectedQty || 0) && (
                        <p className="text-amber-400 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                            <AlertTriangle size={12} /> Short Picked — Originally ordered: {matchedItem.orderedQty}
                        </p>
                    )}
                </div>
            ) : (
                /* SCAN VIEW — show next unpacked item as guidance */
                <div className="text-center z-10 mb-8">
                    <p className="text-gray-400 text-lg">{t('warehouse.scanProductBarcode')}</p>
                    {nextUnpackedItem && (
                        <>
                            <p className="text-gray-900 dark:text-[#EAE5D9] text-2xl font-bold mt-2">{nextUnpackedItem.name}</p>
                            <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-xl mt-1">{nextUnpackedItem.sku}</p>
                            <p className="text-gray-400 dark:text-gray-505 text-xs mt-1">Qty: {(() => {
                                const measureQty = getItemMeasureQty(nextUnpackedItem);
                                if (measureQty !== null && measureQty !== undefined) {
                                    const expected = nextUnpackedItem.expectedQty || 1;
                                    const prod = getProduct(nextUnpackedItem);
                                    const unitDef = prod?.unit || '';
                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                    return <>{expected} x {sizeNum} <span className="text-[10px] uppercase text-gray-400 dark:text-gray-505">{unitDef}</span></>;
                                }
                                return nextUnpackedItem.expectedQty || 1;
                            })()}</p>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default PackScannerStatusView;
