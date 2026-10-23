import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, CheckCircle, RotateCcw, Maximize2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { getSellUnit } from '../../../utils/units';
import { PackScannerStatusView } from './PackScannerStatusView';
import { isExactPackQuantity, matchesPackItemScan } from '../../../utils/packScanValidation';

interface PackScannerProps {
    job: WMSJob;
    products: Product[];
    onClose: () => void;
    onConfirmPack: (itemIndex: number, qty: number) => Promise<void>;
    onCompleteJob: () => void;
    isProcessing: boolean;
}

export const PackScanner: React.FC<PackScannerProps> = ({
    job,
    products,
    onClose,
    onConfirmPack,
    onCompleteJob,
    isProcessing
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
    const getProduct = (item: any) => {
        if (!item) return undefined;
        const targetSiteId = job.siteId || (job as any).site_id;
        const isAtJobSite = (product: Product) =>
            !targetSiteId || product.siteId === targetSiteId || product.site_id === targetSiteId;

        if (item.productId) {
            const byId = products.find(p => p.id === item.productId && isAtJobSite(p));
            if (byId) return byId;
        }

        return products.find(p => p.sku === item.sku && isAtJobSite(p));
    };

    const getItemMeasureQty = (item: any, productInfo?: Product | null): number | null => {
        if (!item) return null;
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        const prod = productInfo !== undefined ? productInfo : getProduct(item);
        const customAttrs = prod?.customAttributes || (prod as any)?.custom_attributes;
        const sellBy = customAttrs?.commercial?.sellBy || '';
        const isWeighted = customAttrs?.commercial?.isWeighted === true;

        if (sellBy === 'Weight' || sellBy === 'Volume' || isWeighted) {
            return item.expectedQty || (item as any).quantity || null;
        }
        return null;
    };

    const totalItems = job.lineItems?.length || 0;
    // Items are "done" only if job is Completed, item.packed is true, or item.packedQty meets expected
    const packedItems = useMemo(() =>
        job.lineItems?.filter(i => {
            if (job.status === 'Completed') return true;
            if ((i as any).packed === true) return true;
            const measureQty = getItemMeasureQty(i);
            const required = measureQty || i.expectedQty || 1;
            return ((i as any).packedQty || 0) >= required - 0.001;
        }) || [],
        [job.lineItems, job.status]
    );
    const isFullyPacked = packedItems.length === totalItems && totalItems > 0;

    // Next item needing Pack-phase verification
    const nextUnpackedItem = useMemo(() =>
        job.lineItems?.find(i => {
            if (job.status === 'Completed') return false;
            if ((i as any).packed === true) return false;
            const measureQty = getItemMeasureQty(i);
            const required = measureQty || i.expectedQty || 1;
            return ((i as any).packedQty || 0) < required - 0.001;
        }),
        [job.lineItems, job.status]
    );

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
                    const measureQty = getItemMeasureQty(item);
                    const required = measureQty || item.expectedQty || 1;
                    const isItemDone = job.status === 'Completed' || (item as any).packed === true || ((item as any).packedQty || 0) >= required - 0.001;
                    if (isItemDone) continue;

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
                setErrorMsg('Item not found in this Pack job.');
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
            if (!Number.isFinite(finalQty) || finalQty <= 0) {
                playBeep('error');
                setErrorMsg('Enter the quantity physically packed.');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            if (!isExactPackQuantity(finalQty, expectedCases)) {
                playBeep('error');
                setErrorMsg('The packed quantity does not match this job. Report the difference to a supervisor.');
                setShowError(true);
                setTimeout(() => setShowError(false), 2500);
                return;
            }

            saveLock.current = true;
            setIsSubmitting(true);
            try {
                await onConfirmPack(matchedIndex, finalQty);
                setSuccessMsg(`Packed ${finalQty}x ${matchedItem.name}`);
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
                setErrorMsg(err.message || 'Saving failed');
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

    return (
        <div className="fixed inset-0 z-[200] bg-[var(--theme-bg-app)] flex flex-col transition-colors duration-200">
            {/* Top Bar */}
            <div className="p-3 sm:p-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex justify-between items-center text-[var(--theme-text-primary)]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button onClick={onClose} className="p-2 -ml-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0" aria-label={t('warehouse.dismiss')}>
                        <X size={24} />
                    </button>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm md:text-base uppercase tracking-wider truncate">
                            {step === 'SCAN' ? t('warehouse.scanProductBarcode') : t('warehouse.putaway.progress')}
                        </h3>
                        <p className="text-xs text-[var(--theme-accent)] font-mono tabular-nums font-medium truncate">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono tabular-nums font-semibold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-1 rounded-full text-[var(--theme-text-primary)]">
                        {packedItems.length}/{totalItems}
                    </span>
                    <button
                        onClick={() => {
                            if (document.fullscreenElement) document.exitFullscreen();
                            else document.documentElement.requestFullscreen();
                        }}
                        title="Toggle Fullscreen"
                        aria-label="Toggle Fullscreen"
                        className="p-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 min-w-0 min-h-0 relative w-full overflow-hidden flex flex-col bg-[var(--theme-bg-app)]">
                <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-between gap-2 p-2 sm:p-3 md:p-5 overflow-hidden">

                    {/* Status / content area */}
                    <div className="flex-1 min-w-0 min-h-0 w-full flex items-center justify-center overflow-y-auto">
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
                        />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-2xl shrink-0 relative z-20 group space-y-2">
                        {!isFullyPacked && (
                            <>
                                {step === 'CONFIRM_QTY' ? (
                                    <div className="space-y-2">
                                        <div className="relative flex items-stretch w-full bg-[var(--theme-bg-card)] border-2 border-[var(--theme-accent)] rounded-xl overflow-hidden shadow-sm focus-within:border-[var(--theme-accent)] z-10">
                                            <input
                                                ref={qtyRef}
                                                type="number"
                                                inputMode="decimal"
                                                pattern="[0-9]*"
                                                aria-label="Confirm quantity"
                                                title="Confirm quantity"
                                                value={qtyVal}
                                                onChange={(e) => setQtyVal(e.target.value)}
                                                className="flex-1 min-w-0 bg-transparent py-2.5 px-3 text-center text-3xl sm:text-4xl font-mono tabular-nums font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/30 outline-none"
                                                placeholder="QTY"
                                                autoFocus
                                            />
                                            <div className="bg-[var(--theme-bg-subtle)] text-[var(--theme-accent)] border-l border-[var(--theme-border)] px-3.5 py-2.5 text-xs font-mono font-bold uppercase flex items-center justify-center shrink-0">
                                                {(() => {
                                                    const unitDef = getSellUnit(selectedUnit);
                                                    const sizeStr = matchedProduct?.size || matchedItem?.size;
                                                    const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
                                                    return isWeightVol ? `packs (${sizeStr}${unitDef.shortLabel})` : unitDef.shortLabel.toUpperCase();
                                                })()}
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        aria-label="Scan barcode"
                                        title="Scan barcode"
                                        value={inputVal}
                                        onChange={(e) => setInputVal(e.target.value)}
                                        onKeyDown={scanOnlyHandlers.onKeyDown}
                                        onPaste={scanOnlyHandlers.onPaste}
                                        inputMode="none"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        className="w-full bg-[var(--theme-bg-card)] border-2 rounded-2xl py-3 px-4 text-center text-2xl sm:text-3xl font-mono tabular-nums font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/30 focus:outline-none relative z-10 shadow-sm transition-colors border-[var(--theme-border)] focus:border-[var(--theme-accent)] min-h-[64px] sm:min-h-[72px]"
                                        placeholder="SCAN REQUIRED SKU OR BARCODE"
                                        autoFocus
                                        disabled={isProcessing || isSubmitting || showSuccess}
                                    />
                                )}
                            </>
                        )}

                        {isProcessing && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30">
                                <RotateCcw className="animate-spin text-[var(--theme-text-primary)] opacity-50" size={18} />
                            </div>
                        )}

                        {/* Mobile Action Button */}
                        <button
                            type={isFullyPacked ? 'button' : 'submit'}
                            onClick={isFullyPacked ? onCompleteJob : undefined}
                            disabled={(!isFullyPacked && step === 'SCAN' && !inputVal.trim()) || isProcessing || isSubmitting || showSuccess}
                            className={`w-full py-3.5 md:py-4 px-3 min-h-[56px] rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm border relative z-30 font-bold text-sm md:text-base uppercase tracking-wider ${
                                isProcessing || isSubmitting
                                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/60 cursor-not-allowed'
                                    : isFullyPacked
                                        ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-sm'
                                        : step === 'CONFIRM_QTY'
                                            ? 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white shadow-sm'
                                            : !inputVal.trim()
                                                ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]/40 cursor-not-allowed'
                                                : 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white shadow-sm'
                            }`}
                        >
                            {isProcessing || isSubmitting ? (
                                <RotateCcw size={18} className="animate-spin" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            {isProcessing || isSubmitting
                                ? 'Saving...'
                                : isFullyPacked
                                    ? 'Review carton & seal'
                                    : step === 'CONFIRM_QTY'
                                        ? 'CONFIRM PACK'
                                        : t('warehouse.scanSkuToConfirm')}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};
