import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, CheckCircle, RotateCcw, Maximize2, ArrowLeft } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { getSellUnit } from '../../../utils/units';
import { PackScannerStatusView } from './PackScannerStatusView';
import { PackScannerItemTally } from './PackScannerItemTally';
import { isExactPackQuantity, matchesPackItemScan } from '../../../utils/packScanValidation';
import { getProductForItem, getItemMeasureQty as getItemMeasureQtyShared } from './utils/packItemHelpers';

interface PackScannerProps {
    job: WMSJob;
    products: Product[];
    onClose: () => void;
    onConfirmPack: (itemIndex: number, qty: number) => Promise<void>;
    onCompleteJob: () => void;
    isProcessing: boolean;
    onFlagDiscrepancy?: (index: number, quantity: number) => void;
}

export const PackScanner: React.FC<PackScannerProps> = ({
    job,
    products,
    onClose,
    onConfirmPack,
    onCompleteJob,
    isProcessing,
    onFlagDiscrepancy
}) => {
    const { t } = useLanguage();

    // 2-step flow: SCAN → CONFIRM_QTY
    const [step, setStep] = useState<'SCAN' | 'CONFIRM_QTY'>('SCAN');
    const [inputVal, setInputVal] = useState('');
    const [qtyVal, setQtyVal] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<string>('UNIT');
    const [matchedIndex, setMatchedIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const saveLock = useRef(false);

    // Overlays
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const qtyRef = useRef<HTMLInputElement>(null);
    const lastStepChangeRef = useRef<number>(0);

    // Scan-only enforcement for SCAN step
    const scanOnlyHandlers = useScanOnly(setInputVal, {
        onReject: (reason) => {
            setErrorMsg(reason);
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
        }
    });

    // Helpers
    const getProduct = (item: any) => getProductForItem(item, job, products);
    const getItemMeasureQty = (item: any, productInfo?: Product | null): number | null =>
        getItemMeasureQtyShared(item, job, products, productInfo);

    const totalItems = job.lineItems?.length || 0;
    const isLineDone = (i: any) => {
        if (job.status === 'Completed') return true;
        if ((i as any).packed === true) return true;
        const measureQty = getItemMeasureQty(i);
        const required = measureQty || i.expectedQty || 1;
        return ((i as any).packedQty || 0) >= required - 0.001;
    };

    const packedItems = useMemo(
        () => job.lineItems?.filter(isLineDone) || [],
        [job.lineItems, job.status]
    );
    const unpackedItems = useMemo(
        () => job.lineItems?.filter(i => !isLineDone(i)) || [],
        [job.lineItems, job.status]
    );
    const isFullyPacked = packedItems.length === totalItems && totalItems > 0;
    const nextUnpackedItem = unpackedItems[0];

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'CONFIRM_QTY') {
                if (qtyRef.current) qtyRef.current.focus();
            } else {
                if (inputRef.current) inputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    useEffect(() => {
        lastStepChangeRef.current = Date.now();
        setInputVal('');
        if (step === 'SCAN') {
            setQtyVal('');
        }
    }, [step, matchedIndex]);

    const handleResetToScan = () => {
        setStep('SCAN');
        setMatchedIndex(null);
        setQtyVal('');
        setInputVal('');
        setShowError(false);
        scanOnlyHandlers.reset();
    };

    const adjustQty = (delta: number) => {
        const cur = parseFloat(qtyVal) || 0;
        const next = Math.max(0, Number((cur + delta).toFixed(3)));
        setQtyVal(String(next));
        if (qtyRef.current) qtyRef.current.focus();
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Date.now() - lastStepChangeRef.current < 250) return;

        const rawVal = inputVal.trim();
        if (step === 'SCAN' && !rawVal) return;
        if (isProcessing || isSubmitting || showSuccess || saveLock.current) return;

        const val = rawVal.toUpperCase();

        if (step === 'SCAN') {
            let foundIndex = -1;

            if (job.lineItems) {
                for (let index = 0; index < job.lineItems.length; index++) {
                    const item = job.lineItems[index];
                    if (isLineDone(item)) continue;

                    const product = getProduct(item);
                    if (matchesPackItemScan(val, item, product)) {
                        foundIndex = index;
                        break; // Stop at FIRST matching unpacked line item
                    }
                }
            }

            if (foundIndex > -1) {
                setMatchedIndex(foundIndex);
                const matchedItem = job.lineItems![foundIndex];
                const prod = getProduct(matchedItem);
                const effectiveUnit = prod?.unit || matchedItem?.unit || 'UNIT';
                setSelectedUnit(effectiveUnit);
                playBeep('success');
                setStep('CONFIRM_QTY');
                // Count what is physically in the carton before confirming.
                setQtyVal('');
            } else {
                playBeep('error');
                setErrorMsg(t('warehouse.itemNotFound') || 'Item not found in this Pack job.');
                setShowError(true);
                setInputVal('');
                setTimeout(() => {
                    setShowError(false);
                    scanOnlyHandlers.reset();
                }, 2000);
            }
        } else if (step === 'CONFIRM_QTY') {
            const qty = parseFloat(qtyVal);
            if (matchedIndex === null) return;

            const matchedItem = job.lineItems![matchedIndex];
            const expectedCases = matchedItem.expectedQty || 1;
            const finalQty = qty;
            if (!Number.isFinite(finalQty) || finalQty < 0) {
                playBeep('error');
                setErrorMsg(t('warehouse.packing.enterQuantityPacked') || 'Enter the quantity physically packed.');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            if (!isExactPackQuantity(finalQty, expectedCases)) {
                if (onFlagDiscrepancy) { onFlagDiscrepancy(matchedIndex, finalQty); return; }
                playBeep('error');
                setErrorMsg(t('warehouse.packing.packQtyMismatchReportVariance') || 'The packed quantity does not match this job. Report the difference to a supervisor.');
                setShowError(true);
                setTimeout(() => setShowError(false), 2500);
                return;
            }

            saveLock.current = true;
            setIsSubmitting(true);
            try {
                await onConfirmPack(matchedIndex, finalQty);
                setSuccessMsg(`${t('warehouse.packing.packed') || 'Packed'} ${finalQty}x ${matchedItem.name}`);
                setShowSuccess(true);
                playBeep('success');
                setTimeout(() => {
                    setShowSuccess(false);
                    setStep('SCAN');
                    setMatchedIndex(null);
                    scanOnlyHandlers.reset();
                }, 1500);
            } catch (err: any) {
                playBeep('error');
                setErrorMsg(err.message || t('warehouse.savingFailed') || 'Saving failed');
                setShowError(true);
                setTimeout(() => {
                    setShowError(false);
                    setStep('SCAN');
                    setMatchedIndex(null);
                    scanOnlyHandlers.reset();
                }, 2500);
            } finally {
                saveLock.current = false;
                setIsSubmitting(false);
            }
        }
    };

    const matchedItem = matchedIndex !== null ? job.lineItems?.[matchedIndex] : null;
    const matchedProduct = matchedItem ? getProduct(matchedItem) : null;

    const unitLabel = useMemo(() => {
        const unitDef = getSellUnit(selectedUnit);
        const sizeStr = matchedProduct?.size || matchedItem?.size;
        const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
        return isWeightVol ? `packs (${sizeStr}${unitDef.shortLabel})` : unitDef.shortLabel.toUpperCase();
    }, [selectedUnit, matchedProduct, matchedItem]);

    return (
        <div className="fixed inset-0 z-[200] bg-[var(--theme-bg-app)] flex flex-col overflow-hidden max-w-full">
            {/* Mobile-First Top Bar */}
            <div className="px-3 py-2.5 sm:p-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] text-[var(--theme-text-primary)] shrink-0">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors rounded-xl hover:bg-[var(--theme-bg-subtle)] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                            aria-label={t('warehouse.dismiss')}
                        >
                            <X size={22} />
                        </button>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight truncate">
                                {isFullyPacked
                                    ? (t('warehouse.packing.allItemsVerified') || 'All Items Verified')
                                    : step === 'SCAN'
                                        ? t('warehouse.scanProductBarcode')
                                        : t('warehouse.confirmQty')}
                            </h3>
                            <p className="text-xs text-[var(--theme-accent)] font-mono tabular-nums font-bold truncate">
                                {t('warehouse.job') || 'JOB'}: {formatJobId(job)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {!isFullyPacked && (
                            <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-1 rounded-full text-[var(--theme-text-secondary)] whitespace-nowrap">
                                {packedItems.length}/{totalItems} · {step === 'SCAN' ? '1/2' : '2/2'}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                if (document.fullscreenElement) document.exitFullscreen();
                                else document.documentElement.requestFullscreen();
                            }}
                            title={t('warehouse.toggleFullscreen') || 'Toggle Fullscreen'}
                            aria-label={t('warehouse.toggleFullscreen') || 'Toggle Fullscreen'}
                            className="hidden sm:flex p-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div
                    className="mt-2.5 h-2 rounded-full bg-[var(--theme-bg-subtle)] overflow-hidden"
                    role="progressbar"
                    aria-label={t('warehouse.progress') || 'Pack mission progress'}
                    aria-valuenow={packedItems.length}
                    aria-valuemin={0}
                    aria-valuemax={totalItems}
                >
                    <div
                        style={{ width: `${totalItems ? (packedItems.length / totalItems) * 100 : 0}%` }}
                        className={`h-full rounded-full transition-[width] duration-300 ${
                            isFullyPacked ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'
                        }`}
                    />
                </div>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 min-h-0 relative w-full overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col items-center px-2.5 py-2.5 sm:p-5 w-full max-w-full">
                    <PackScannerStatusView
                        step={step}
                        showSuccess={showSuccess}
                        showError={showError}
                        successMsg={successMsg}
                        errorMsg={errorMsg}
                        isFullyPacked={isFullyPacked}
                        matchedItem={matchedItem}
                        matchedProduct={matchedProduct}
                        nextUnpackedItem={nextUnpackedItem}
                        job={job}
                        getProduct={getProduct}
                        onResetToScan={step === 'CONFIRM_QTY' ? handleResetToScan : undefined}
                        unitLabel={unitLabel}
                    />

                    {/* Mobile Manifest Queue & Packed Tally */}
                    {!isFullyPacked && step === 'SCAN' && (
                        <PackScannerItemTally
                            packedItems={packedItems}
                            unpackedItems={unpackedItems}
                            activeItemSku={nextUnpackedItem?.sku}
                            totalItems={totalItems}
                            getItemMeasureQty={getItemMeasureQty}
                            getProduct={getProduct}
                        />
                    )}
                </div>

                {/* Pinned Mobile Thumb-Zone Bottom Dock */}
                <div className="shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6 sm:py-4">
                    <form onSubmit={handleScan} className="mx-auto w-full max-w-2xl relative z-20 space-y-2">
                        {!isFullyPacked && (
                            <>
                                {step === 'CONFIRM_QTY' ? (
                                    <div className="space-y-2">
                                        <div className="relative flex items-stretch w-full bg-[var(--theme-bg-app)] border-2 border-[var(--theme-accent)] rounded-2xl overflow-hidden shadow-xs">
                                            <input
                                                ref={qtyRef}
                                                type="number"
                                                inputMode="decimal"
                                                pattern="[0-9]*"
                                                aria-label={t('warehouse.confirmQty') || 'Confirm quantity'}
                                                title={t('warehouse.confirmQty') || 'Confirm quantity'}
                                                value={qtyVal}
                                                onChange={(e) => setQtyVal(e.target.value)}
                                                className="flex-1 min-w-0 bg-transparent py-2.5 px-3 text-center text-3xl sm:text-4xl font-mono tabular-nums font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/30 outline-none min-h-[58px]"
                                                placeholder={t('warehouse.qty') || 'QTY'}
                                                autoFocus
                                            />
                                            <div className="bg-[var(--theme-bg-subtle)] text-[var(--theme-accent)] border-l border-[var(--theme-border)] px-3.5 py-2.5 text-xs font-mono font-bold uppercase flex items-center justify-center shrink-0">
                                                {unitLabel}
                                            </div>
                                        </div>

                                        {/* Blind-Safe Rapid Thumb Stepper Pills */}
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {[-1, 1, 5, 10].map((delta) => (
                                                <button
                                                    key={delta}
                                                    type="button"
                                                    onClick={() => adjustQty(delta)}
                                                    disabled={isProcessing || isSubmitting}
                                                    className="py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-sm font-bold transition-transform active:scale-95 touch-manipulation min-h-[44px]"
                                                >
                                                    {delta > 0 ? `+${delta}` : delta}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQtyVal('');
                                                    if (qtyRef.current) qtyRef.current.focus();
                                                }}
                                                disabled={isProcessing || isSubmitting}
                                                className="py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 touch-manipulation min-h-[44px]"
                                            >
                                                {t('warehouse.clear') || 'Clear'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        aria-label={t('warehouse.scanBarcode') || 'Scan barcode'}
                                        title={t('warehouse.scanBarcode') || 'Scan barcode'}
                                        value={inputVal}
                                        onChange={(e) => setInputVal(e.target.value)}
                                        onKeyDown={scanOnlyHandlers.onKeyDown}
                                        onPaste={scanOnlyHandlers.onPaste}
                                        inputMode="none"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        className="w-full bg-[var(--theme-bg-app)] border-2 rounded-2xl py-3 px-4 text-center text-xl sm:text-2xl font-mono tabular-nums font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/40 focus:outline-none relative z-10 shadow-xs transition-colors border-[var(--theme-border)] focus:border-[var(--theme-accent)] min-h-[58px] sm:min-h-[64px]"
                                        placeholder={t('warehouse.packing.scanRequiredSkuOrBarcode') || 'SCAN REQUIRED SKU OR BARCODE'}
                                        autoFocus
                                        disabled={isProcessing || isSubmitting || showSuccess}
                                    />
                                )}
                            </>
                        )}

                        {isProcessing && (
                            <div className="absolute right-3 top-4 z-30">
                                <RotateCcw className="animate-spin text-[var(--theme-text-primary)] opacity-50" size={18} />
                            </div>
                        )}

                        {/* Mobile Primary Action Row */}
                        <div className="flex items-center gap-2">
                            {!isFullyPacked && step === 'CONFIRM_QTY' && (
                                <button
                                    type="button"
                                    onClick={handleResetToScan}
                                    disabled={isProcessing || isSubmitting}
                                    className="px-3.5 py-3.5 min-h-[52px] sm:min-h-[56px] rounded-2xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-[0.98]"
                                >
                                    <ArrowLeft size={16} />
                                    <span className="hidden xs:inline">{t('warehouse.packing.rescan') || 'Rescan'}</span>
                                </button>
                            )}

                            <button
                                type={isFullyPacked ? 'button' : 'submit'}
                                onClick={isFullyPacked ? onCompleteJob : undefined}
                                disabled={(!isFullyPacked && step === 'SCAN' && !inputVal.trim()) || isProcessing || isSubmitting || showSuccess}
                                className={`flex-1 py-3.5 px-3 min-h-[52px] sm:min-h-[56px] rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-xs border relative z-30 font-bold text-sm md:text-base uppercase tracking-wider ${
                                    isProcessing || isSubmitting
                                        ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/60 cursor-not-allowed'
                                        : isFullyPacked
                                            ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
                                            : step === 'CONFIRM_QTY'
                                                ? 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white'
                                                : !inputVal.trim()
                                                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/40 cursor-not-allowed'
                                                    : 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white'
                                }`}
                            >
                                {isProcessing || isSubmitting ? (
                                    <RotateCcw size={18} className="animate-spin" />
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                                {isProcessing || isSubmitting
                                    ? (t('warehouse.saving') || 'Saving...')
                                    : isFullyPacked
                                        ? (t('warehouse.packing.reviewCartonAndSeal') || 'Review carton & seal')
                                        : step === 'CONFIRM_QTY'
                                            ? (t('warehouse.packing.confirmPackCaps') || 'CONFIRM PACK')
                                            : t('warehouse.scanSkuToConfirm')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
