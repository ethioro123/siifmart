import React from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    Barcode,
    CheckCircle,
    Package,
    ScanLine,
    ThermometerSnowflake,
} from 'lucide-react';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatProductSize } from '../../../utils/units';

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
    getProduct: (item: any) => Product | undefined;
    onResetToScan?: () => void;
    unitLabel?: string;
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
    getProduct,
    onResetToScan,
    unitLabel,
}) => {
    const { t } = useLanguage();
    const item = step === 'CONFIRM_QTY' ? matchedItem : nextUnpackedItem;
    const product = step === 'CONFIRM_QTY' ? matchedProduct : item ? getProduct(item) : undefined;

    const totalLines = job.lineItems?.length || 0;
    const packedCount =
        job.lineItems?.filter(
            (line: any) =>
                line.packed || (line.packedQty || 0) >= (line.expectedQty || 1) - 0.001
        ).length || 0;

    if (isFullyPacked) {
        return (
            <div className="w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-8 text-center">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="mt-3 text-xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    All items packed
                </h1>
                <p className="mt-1 text-xs sm:text-base text-[var(--theme-text-secondary)]">
                    Continue to carton, weigh and label steps.
                </p>
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-xs sm:text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle size={14} />
                    {totalLines} job lines verified
                </p>
            </div>
        );
    }

    const category = item?.category || product?.category || '';
    const isCold = ['Frozen', 'Dairy'].some(c => category.includes(c));
    const isFragile = ['Electronics', 'Glass', 'Beverages'].some(c => category.includes(c));
    const sizeText = formatProductSize(product || item);

    return (
        <section className="w-full max-w-3xl min-h-0 rounded-2xl sm:rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 sm:p-5 shadow-xs space-y-3">
            {/* Live Feedback Banner (Prominent on Mobile) */}
            {(showError || showSuccess) && (
                <div
                    role={showError ? 'alert' : 'status'}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                        showError
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    }`}
                >
                    {showError ? (
                        <AlertTriangle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
                    ) : (
                        <CheckCircle size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {showError ? 'Scan issue' : 'Saved'}
                        </p>
                        <p className="text-xs sm:text-sm font-bold leading-snug break-words">
                            {showError ? errorMsg : successMsg}
                        </p>
                    </div>
                </div>
            )}

            {/* Card Top Status Strip */}
            <div className="flex items-center justify-between gap-2">
                <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                        step === 'CONFIRM_QTY'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-[var(--theme-accent)]/25 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]'
                    }`}
                >
                    {step === 'CONFIRM_QTY' ? <CheckCircle size={15} /> : <ScanLine size={15} />}
                    <span>{step === 'CONFIRM_QTY' ? 'Item matched' : 'Pack this item'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    {step === 'CONFIRM_QTY' && onResetToScan && (
                        <button
                            type="button"
                            onClick={onResetToScan}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] px-2.5 py-1 text-[11px] font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[32px]"
                        >
                            <ArrowLeft size={12} />
                            Rescan
                        </button>
                    )}
                    <span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-2.5 py-1 text-[11px] sm:text-xs font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)]">
                        {packedCount} / {totalLines} lines
                    </span>
                </div>
            </div>

            {/* Product Hero Row */}
            <div className="flex min-h-0 items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-center">
                    {product?.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                        <Package
                            size={28}
                            className="text-[var(--theme-text-secondary)]/50 sm:w-10 sm:h-10"
                            aria-hidden="true"
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        {step === 'CONFIRM_QTY'
                            ? 'Count the physical quantity in the carton'
                            : 'Scan the displayed SKU or barcode'}
                    </p>
                    <h1 className="mt-0.5 text-lg sm:text-2xl md:text-3xl leading-snug font-bold text-[var(--theme-text-primary)] line-clamp-2 break-words">
                        {item?.name || product?.name || 'No remaining items'}
                    </h1>

                    {/* Identifiers & Attributes */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-lg border border-[var(--theme-accent)]/25 bg-[var(--theme-accent)]/10 px-2 py-0.5 text-xs sm:text-sm font-mono tabular-nums font-bold text-[var(--theme-accent)] break-all">
                            {item?.sku || product?.sku || 'SKU unavailable'}
                        </span>
                        {product?.barcode && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 text-xs sm:text-sm font-mono tabular-nums font-semibold text-[var(--theme-text-secondary)] break-all">
                                <Barcode size={12} className="shrink-0" />
                                {product.barcode}
                            </span>
                        )}
                        {sizeText && (
                            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                                {sizeText}
                            </span>
                        )}
                        {category && (
                            <span className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--theme-text-secondary)]">
                                {category}
                            </span>
                        )}
                        {isCold && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                                <ThermometerSnowflake size={12} />
                                Cold Chain
                            </span>
                        )}
                        {isFragile && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                <AlertTriangle size={12} />
                                Fragile
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Contextual Action Strip */}
            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        {step === 'CONFIRM_QTY' ? 'Blind Carton Verification' : 'Scanner Ready'}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] truncate">
                        {step === 'CONFIRM_QTY'
                            ? 'Enter what is physically in the carton'
                            : t('warehouse.scanProductBarcode')}
                    </p>
                </div>
                {step === 'CONFIRM_QTY' && unitLabel && (
                    <span className="shrink-0 rounded-lg border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 px-2.5 py-1 text-xs font-mono font-bold uppercase text-[var(--theme-accent)]">
                        Count in {unitLabel}
                    </span>
                )}
            </div>
        </section>
    );
};

export default PackScannerStatusView;
