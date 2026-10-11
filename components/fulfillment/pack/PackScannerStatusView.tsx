import React from 'react';
import { CheckCircle, AlertTriangle, ScanLine, Package } from 'lucide-react';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatProductSize, formatPackagingDescription } from '../../../utils/units';

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
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center mb-2 shadow-sm z-10 transition-colors duration-200 ${
                showSuccess
                    ? 'border-green-500 bg-green-500/10 scale-105'
                    : showError
                        ? 'border-red-500 bg-red-500/10 scale-105 animate-shake'
                        : isFullyPacked
                            ? 'border-green-500 bg-green-500/10'
                            : step === 'CONFIRM_QTY'
                                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                                : 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
            }`}>
                {showSuccess ? (
                    <CheckCircle size={28} className="text-green-500 animate-bounce" />
                ) : showError ? (
                    <AlertTriangle size={28} className="text-red-500" />
                ) : isFullyPacked ? (
                    <CheckCircle size={28} className="text-green-500" />
                ) : step === 'CONFIRM_QTY' ? (
                    <Package size={28} className="text-[var(--theme-accent)]" />
                ) : (
                    <ScanLine size={28} className="text-[var(--theme-accent)]" />
                )}
            </div>

            {/* Instruction / Status heading */}
            <h1 className={`text-xl md:text-2xl font-bold text-[var(--theme-text-primary)] text-center uppercase tracking-tight mb-1 z-10 transition-colors duration-200 ${
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
                    <p className="text-green-500 text-xs font-semibold uppercase tracking-wider">{successMsg}</p>
                </div>
            ) : showError ? (
                <div className="text-center z-10 mb-4 animate-in fade-in zoom-in duration-300">
                    <p className="text-red-500 text-xs font-semibold uppercase tracking-wider">{errorMsg}</p>
                </div>
            ) : isFullyPacked ? (
                /* COMPLETION VIEW */
                <div className="text-center z-10 mb-4 bg-green-500/10 border border-green-500/30 p-4 rounded-2xl shadow-sm w-full max-w-md">
                    <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-3">All Items Verified!</p>
                    <div className="bg-[var(--theme-bg-card)] rounded-xl p-3 mb-3 text-left max-h-40 overflow-y-auto border border-[var(--theme-border)]">
                        <h4 className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider mb-2 border-b border-[var(--theme-border)] pb-1">Pack Summary</h4>
                        <div className="flex flex-col gap-2">
                            {job.lineItems?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--theme-text-primary)] font-medium truncate">{item.name}</span>
                                    <span className="text-green-600 dark:text-green-400 font-mono tabular-nums font-semibold shrink-0 ml-2">
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
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm flex flex-col gap-3 text-left">
                        {/* Header: Thumbnail + Name + Category + SKU */}
                        <div className="flex items-start gap-3.5">
                            <div className="w-16 h-16 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                {matchedProduct?.image ? (
                                    <img src={matchedProduct.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={28} className="text-[var(--theme-text-secondary)]/50" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-[var(--theme-text-primary)] text-base font-semibold leading-snug truncate uppercase">{matchedItem.name}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded border border-[var(--theme-border)] uppercase">
                                        SKU: {matchedItem.sku}
                                    </span>
                                    {matchedProduct?.barcode && (
                                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider">
                                            BARCODE: {matchedProduct.barcode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[var(--theme-border)] text-xs">
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block leading-none mb-1">Category</span>
                                <span className="text-[var(--theme-text-primary)] font-medium truncate block">{matchedProduct?.category || 'Pantry & Dry Goods'}</span>
                            </div>
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block leading-none mb-1">Unit / Size</span>
                                <span className="text-[var(--theme-text-primary)] font-medium truncate block">
                                    {formatProductSize(matchedProduct) || matchedItem.unit || 'Unit'}
                                </span>
                            </div>
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block leading-none mb-1">Location</span>
                                <span className="text-[var(--theme-text-primary)] font-medium truncate block">
                                    {(matchedProduct as any)?.shelf || (matchedProduct as any)?.location || 'On Order'}
                                </span>
                            </div>
                        </div>

                        {/* Expected vs Packed Large Number Banner */}
                        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-3 rounded-xl flex items-center justify-around text-center">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block leading-none mb-1">{t('warehouse.expected')}</span>
                                <span className="text-2xl font-mono tabular-nums font-bold text-[var(--theme-text-primary)] leading-none">
                                    {matchedItem.expectedQty || 1}
                                </span>
                                {formatPackagingDescription(matchedProduct, matchedItem.expectedQty || 1) && (
                                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] block mt-1">
                                        ({formatPackagingDescription(matchedProduct, matchedItem.expectedQty || 1)})
                                    </span>
                                )}
                            </div>
                            <div className="text-[var(--theme-text-secondary)] text-lg font-bold">&rarr;</div>
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block leading-none mb-1">{t('warehouse.packed') || 'Packed'}</span>
                                <span className="text-2xl font-mono tabular-nums font-bold text-[var(--theme-accent)] leading-none">
                                    {matchedItem.pickedQty || 0}
                                </span>
                                {formatPackagingDescription(matchedProduct, matchedItem.pickedQty || 0) && (
                                    <span className="text-[11px] font-mono text-[var(--theme-accent)] block mt-1">
                                        ({formatPackagingDescription(matchedProduct, matchedItem.pickedQty || 0)})
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Warnings / Flags */}
                        {matchedItem.orderedQty && matchedItem.orderedQty > (matchedItem.expectedQty || 0) && (
                            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-500 text-[11px] font-semibold flex items-center gap-1.5">
                                <AlertTriangle size={14} /> Short Picked — Originally ordered: {matchedItem.orderedQty}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* SCAN VIEW — guidance without repeating */
                <div className="text-center z-10 mb-4 w-full max-w-md px-2">
                    <p className="text-[var(--theme-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('warehouse.scanProductBarcode')}</p>
                    {nextUnpackedItem && (
                        <div className="mt-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 sm:px-4 py-2 flex items-center justify-center gap-2 sm:gap-3 max-w-full">
                            <span className="text-[var(--theme-text-primary)] text-xs font-medium truncate max-w-[200px]">{nextUnpackedItem.name}</span>
                            <span className="text-[var(--theme-accent)] font-mono tabular-nums text-[11px] font-semibold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded shrink-0">{nextUnpackedItem.sku}</span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default PackScannerStatusView;
