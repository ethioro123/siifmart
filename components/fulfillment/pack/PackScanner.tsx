import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, CheckCircle, RotateCcw, Maximize2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { isWeightBased, isVolumeBased } from '../../../utils/units';
import { PackScannerStatusView } from './PackScannerStatusView';
import { PackScannerItemTally } from './PackScannerItemTally';

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
    const [matchedIndex, setMatchedIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        const targetSiteId = job.siteId || (job as any).site_id;
        return products.find(p =>
            (p.id === item.productId || p.sku === item.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        );
    };

    const getItemMeasureQty = (item: any, productInfo?: Product | null): number | null => {
        if (!item) return null;
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        const prod = productInfo || getProduct(item);
        if (prod) {
            const unit = prod.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = prod.size ? parseFloat(prod.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                return expected * sizeNum;
            }
        }
        return null;
    };

    const totalItems = job.lineItems?.length || 0;
    const packedItems = useMemo(() =>
        job.lineItems?.filter(i => {
            const isDone = i.status === 'Completed' || (i.status === 'Picked' && (job as any).type !== 'PACK');
            const requiredAmount = getItemMeasureQty(i) || i.expectedQty || 1;
            return isDone || (i.pickedQty || 0) >= requiredAmount;
        }) || [],
        [job.lineItems]
    );
    const isFullyPacked = packedItems.length === totalItems && totalItems > 0;

    const nextUnpackedItem = useMemo(() =>
        job.lineItems?.find(i => {
            const isDone = i.status === 'Completed' || (i.status === 'Picked' && (job as any).type !== 'PACK');
            const requiredAmount = getItemMeasureQty(i) || i.expectedQty || 1;
            return !isDone && (i.pickedQty || 0) < requiredAmount;
        }),
        [job.lineItems]
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
        setQtyVal('');
    }, [step, matchedIndex]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Date.now() - lastStepChangeRef.current < 250) return;

        const rawVal = inputVal.trim();
        if (step === 'SCAN' && !rawVal) return;
        if (isProcessing || isSubmitting) return;

        const val = rawVal.toUpperCase();

        if (step === 'SCAN') {
            let foundIndex = -1;

            job.lineItems?.forEach((item, index) => {
                const measureQty = getItemMeasureQty(item);
                const requiredAmount = measureQty || item.expectedQty || 1;
                if (item.status === 'Completed' || (item.pickedQty || 0) >= requiredAmount) return;

                const product = getProduct(item);
                if (
                    item.sku?.toUpperCase() === val ||
                    product?.sku?.toUpperCase() === val ||
                    product?.barcode?.toUpperCase() === val
                ) {
                    foundIndex = index;
                }
            });

            if (foundIndex > -1) {
                setMatchedIndex(foundIndex);
                const matchedItem = job.lineItems![foundIndex];
                const measureQty = getItemMeasureQty(matchedItem);
                playBeep('success');
                setStep('CONFIRM_QTY');
                setQtyVal(measureQty !== null ? measureQty.toString() : (matchedItem.expectedQty || 1).toString());
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
            const prod = getProduct(matchedItem);
            const measureQty = getItemMeasureQty(matchedItem, prod);
            const displayMax = measureQty !== null ? measureQty : (matchedItem.expectedQty || 1);

            if (isNaN(qty) || qty <= 0 || qty > displayMax) {
                playBeep('error');
                setErrorMsg(`Invalid Quantity (1-${displayMax})`);
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            if (qty < displayMax) {
                const confirmed = window.confirm(`Discrepancy detected. You entered ${qty} but expected ${displayMax}. Are you sure?`);
                if (!confirmed) return;
            }

            setIsSubmitting(true);
            try {
                await onConfirmPack(matchedIndex, qty);
                setSuccessMsg(`Packed ${qty}x ${matchedItem.name}`);
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
                setIsSubmitting(false);
            }
        }
    };

    const matchedItem = matchedIndex !== null ? job.lineItems?.[matchedIndex] : null;
    const matchedProduct = matchedItem ? getProduct(matchedItem) : null;

    return (
        <div className="fixed inset-0 z-[200] bg-[#FAF8F5] dark:bg-[#1C2620] flex flex-col transition-colors duration-500">
            {/* Top Bar */}
            <div className="p-4 bg-[#EAE5D9] dark:bg-[#1C2620]/80 border-b border-[#E2DCCE] dark:border-[#A9CBA2]/10 flex justify-between items-center text-gray-900 dark:text-[#EAE5D9]">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 dark:text-[#A9CBA2]/70 hover:text-gray-900 dark:hover:text-[#EAE5D9]" aria-label={t('warehouse.dismiss')}>
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider">
                            {step === 'SCAN' ? t('warehouse.scanProductBarcode') : t('warehouse.putaway.progress')}
                        </h3>
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#E2DCCE] dark:bg-[#2C5E3B]/20 px-2 py-1 rounded text-gray-700 dark:text-[#A9CBA2]">
                        {packedItems.length}/{totalItems}
                    </span>
                    <button
                        onClick={() => {
                            if (document.fullscreenElement) document.exitFullscreen();
                            else document.documentElement.requestFullscreen();
                        }}
                        title="Toggle Fullscreen"
                        aria-label="Toggle Fullscreen"
                        className="p-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-xl text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col">
                <div className={`absolute inset-0 opacity-20 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'CONFIRM_QTY' ? 'bg-[#A9CBA2]' : 'bg-[#2C5E3B]'}`} />

                <div className="absolute inset-0 overflow-y-auto flex flex-col items-center p-6 pb-32">

                    {/* Status / content area */}
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
                        getItemMeasureQty={getItemMeasureQty}
                        getProduct={getProduct}
                    />

                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2] rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />

                        {!isFullyPacked && (
                            <>
                                {step === 'CONFIRM_QTY' ? (
                                    <input
                                        ref={qtyRef}
                                        type="number"
                                        inputMode="decimal"
                                        pattern="[0-9]*"
                                        aria-label="Confirm quantity"
                                        title="Confirm quantity"
                                        value={qtyVal}
                                        onChange={(e) => setQtyVal(e.target.value)}
                                        className="w-full bg-[#FAF8F5] dark:bg-[#1C2620]/90 border-2 rounded-2xl py-6 px-4 text-center text-5xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-300 dark:placeholder:text-[#A9CBA2]/30 focus:outline-none relative z-10 shadow-xl transition-all border-[#2C5E3B] dark:border-[#A9CBA2]/40 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                        placeholder="QTY"
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                    />
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
                                        className="w-full bg-[#FAF8F5] dark:bg-[#1C2620]/90 border-2 rounded-2xl py-6 px-4 text-center text-3xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-300 dark:placeholder:text-[#A9CBA2]/30 focus:outline-none relative z-10 shadow-xl transition-all border-[#E2DCCE] dark:border-[#A9CBA2]/10 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]/40"
                                        placeholder="SCAN BARCODE"
                                        autoFocus
                                        disabled={isProcessing}
                                    />
                                )}

                                {step === 'CONFIRM_QTY' && (
                                    <div className="mb-4 text-center mt-2 animate-in fade-in duration-300">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2]">
                                            {t('warehouse.expected')}: {(() => {
                                                const measureQty = getItemMeasureQty(matchedItem, matchedProduct);
                                                if (measureQty !== null && measureQty !== undefined) {
                                                    const expected = matchedItem?.expectedQty || 1;
                                                    const unitDef = matchedProduct?.unit || '';
                                                    const sizeNum = matchedProduct?.size ? parseFloat(matchedProduct.size as string) : 0;
                                                    return <>{expected} x {sizeNum} {unitDef}</>;
                                                }
                                                return matchedItem?.expectedQty || 1;
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {isProcessing && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
                                <RotateCcw className="animate-spin text-gray-900 dark:text-white opacity-50" size={24} />
                            </div>
                        )}

                        {/* Mobile Action Button */}
                        <button
                            type={isFullyPacked ? 'button' : 'submit'}
                            onClick={isFullyPacked ? onCompleteJob : undefined}
                            disabled={(!isFullyPacked && step === 'SCAN' && !inputVal.trim()) || isProcessing || isSubmitting}
                            className={`mt-6 w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-2xl border-2 relative z-30 ${
                                isProcessing || isSubmitting
                                    ? 'bg-gray-100 dark:bg-[#1C2620]/50 border-gray-200 dark:border-white/5 text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
                                    : isFullyPacked
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-105'
                                        : step === 'CONFIRM_QTY'
                                            ? 'bg-[#2C5E3B] border-[#A9CBA2]/40 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(44,94,59,0.3)]'
                                            : !inputVal.trim()
                                                ? 'bg-gray-200 dark:bg-[#1C2620]/50 border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-600 grayscale opacity-50 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#2C5E3B] to-[#3a7a4d] border-gray-200 dark:border-white/20 text-white font-black uppercase tracking-widest shadow-[#2C5E3B]/20'
                            }`}
                        >
                            {isProcessing || isSubmitting ? (
                                <RotateCcw size={24} className="animate-spin" />
                            ) : (
                                <CheckCircle size={24} className={isFullyPacked ? 'animate-bounce' : ''} />
                            )}
                            {isProcessing || isSubmitting
                                ? 'Saving...'
                                : isFullyPacked
                                    ? t('warehouse.completed')
                                    : step === 'CONFIRM_QTY'
                                        ? 'CONFIRM PACK'
                                        : t('warehouse.scanSkuToConfirm')}
                        </button>
                    </form>

                    {/* Running tally of packed items */}
                    {!isFullyPacked && (
                        <PackScannerItemTally
                            packedItems={packedItems}
                            totalItems={totalItems}
                            getItemMeasureQty={getItemMeasureQty}
                            getProduct={getProduct}
                        />
                    )}

                    <p className="mt-8 text-gray-500 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        Scan &amp; Verify Protocol
                    </p>
                </div>
            </div>
        </div>
    );
};
