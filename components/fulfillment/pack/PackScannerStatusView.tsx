import React from 'react';
import { AlertTriangle, CheckCircle, Package, ScanLine } from 'lucide-react';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatProductSize, formatPackagingDescription, getSellUnit } from '../../../utils/units';

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
}) => {
    const { t } = useLanguage();
    const item = step === 'CONFIRM_QTY' ? matchedItem : nextUnpackedItem;
    const product = step === 'CONFIRM_QTY' ? matchedProduct : getProduct(item);
    const requiredQty = item?.expectedQty || item?.quantity || 1;
    const unitDefinition = getSellUnit(product?.unit || item?.unit);
    const unitLabel = unitDefinition.category === 'count' && unitDefinition.code !== 'UNIT'
        ? unitDefinition.shortLabel
        : 'packs';

    if (isFullyPacked) {
        return (
            <div className="w-full max-w-3xl rounded-3xl border border-green-500/30 bg-green-500/10 p-5 sm:p-8 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 dark:text-green-400" />
                <h1 className="mt-3 text-2xl sm:text-4xl font-bold text-green-700 dark:text-green-300">All items packed</h1>
                <p className="mt-1 text-sm sm:text-lg text-[var(--theme-text-secondary)]">Continue to carton, weigh and label steps.</p>
                <p className="mt-3 text-sm font-semibold text-green-700 dark:text-green-300">{job.lineItems?.length || 0} job lines verified</p>
            </div>
        );
    }

    return (
        <section className="w-full max-w-5xl min-h-0 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 sm:p-5 md:p-7 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[var(--theme-accent)]">
                    {step === 'CONFIRM_QTY' ? <CheckCircle size={18} /> : <ScanLine size={18} />}
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                        {step === 'CONFIRM_QTY' ? 'Item matched' : 'Pack this item'}
                    </span>
                </div>
                <span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 py-1 text-xs sm:text-sm font-semibold text-[var(--theme-text-secondary)]">
                    {job.lineItems?.filter((line: any) => line.packed || (line.packedQty || 0) >= (line.expectedQty || 1) - 0.001).length || 0} / {job.lineItems?.length || 0} lines
                </span>
            </div>

            <div className="flex min-h-0 items-center gap-3 sm:gap-5 md:gap-7">
                <div className="h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 shrink-0 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-center">
                    {product?.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                        <Package size={36} className="text-[var(--theme-text-secondary)]/50 sm:w-12 sm:h-12" aria-hidden="true" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-sm font-bold uppercase tracking-widest text-[var(--theme-text-secondary)]">
                        {step === 'CONFIRM_QTY' ? 'Verify the required quantity' : 'Scan the displayed SKU or barcode'}
                    </p>
                    <h1 className="mt-1 text-xl sm:text-3xl md:text-5xl leading-tight font-bold text-[var(--theme-text-primary)] line-clamp-2 break-words">
                        {item?.name || product?.name || 'No remaining items'}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 px-2.5 py-1 text-sm sm:text-lg font-mono font-bold text-[var(--theme-accent)] break-all">
                            {item?.sku || product?.sku || 'SKU unavailable'}
                        </span>
                        {product?.barcode && (
                            <span className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-2.5 py-1 text-xs sm:text-base font-mono font-semibold text-[var(--theme-text-secondary)] break-all">
                                {product.barcode}
                            </span>
                        )}
                    </div>
                    {(formatProductSize(product || item) || item?.category) && (
                        <p className="mt-1.5 text-xs sm:text-base font-medium text-[var(--theme-text-secondary)]">
                            {[formatProductSize(product || item), item?.category || product?.category].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-3 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 py-2 sm:px-4 sm:py-3">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">Required quantity</p>
                    <p className="mt-0.5 text-2xl sm:text-4xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {requiredQty} <span className="text-xs sm:text-base font-sans uppercase text-[var(--theme-text-secondary)]">{unitLabel}</span>
                    </p>
                    {formatPackagingDescription(product, requiredQty) && (
                        <p className="text-[10px] sm:text-xs text-[var(--theme-text-secondary)]">{formatPackagingDescription(product, requiredQty)}</p>
                    )}
                </div>
                <div className={`rounded-2xl border px-3 py-2 sm:px-4 sm:py-3 ${showError ? 'border-red-500/30 bg-red-500/10' : showSuccess ? 'border-green-500/30 bg-green-500/10' : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]'}`} role={showError ? 'alert' : 'status'}>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        {showError ? 'Scan issue' : showSuccess ? 'Saved' : 'Packing status'}
                    </p>
                    <p className={`mt-1 text-sm sm:text-lg font-semibold line-clamp-2 ${showError ? 'text-red-600 dark:text-red-400' : showSuccess ? 'text-green-700 dark:text-green-400' : 'text-[var(--theme-text-primary)]'}`}>
                        {showError ? errorMsg : showSuccess ? successMsg : step === 'CONFIRM_QTY' ? `Confirm ${requiredQty} required` : t('warehouse.scanProductBarcode')}
                    </p>
                </div>
            </div>
            {item?.orderedQty && item.orderedQty > requiredQty && (
                <p className="mt-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={16} /> Picked quantity is {requiredQty}; pack only what was picked.
                </p>
            )}
        </section>
    );
};

export default PackScannerStatusView;
