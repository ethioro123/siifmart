import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Package, X, Maximize2, AlertTriangle, ScanLine, RotateCcw } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { isWeightBased, isVolumeBased } from '../../../utils/units';

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
    const lastKeyTime = useRef<number>(Date.now());

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

    const getItemMeasureQty = (item: any, productInfo?: Product | null) => {
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

    // The next unpacked item (for guidance)
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

    // Track step transitions so we don't double scan
    useEffect(() => {
        lastStepChangeRef.current = Date.now();
        setInputVal('');
        setQtyVal('');
    }, [step, matchedIndex]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();

        // Anti-bounce guard
        if (Date.now() - lastStepChangeRef.current < 250) {
            return;
        }

        const rawVal = inputVal.trim();
        if (step === 'SCAN' && !rawVal) return;
        if (isProcessing || isSubmitting) return;

        const val = rawVal.toUpperCase();

        if (step === 'SCAN') {
            let foundIndex = -1;

            job.lineItems?.forEach((item, index) => {
                const measureQty = getItemMeasureQty(item);
                const requiredAmount = measureQty || item.expectedQty || 1;
                // If already packed, skip
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
                const expected = matchedItem.expectedQty || 1;
                const measureQty = getItemMeasureQty(matchedItem);

                // Open Confirmation Overlay
                playBeep('success');
                setStep('CONFIRM_QTY');
                if (measureQty !== null) {
                    setQtyVal(measureQty.toString());
                } else {
                    setQtyVal(expected.toString());
                }
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
            const maxExpected = matchedItem.expectedQty || 1;
            const prod = getProduct(matchedItem);
            const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
            const measureQty = getItemMeasureQty(matchedItem, prod);

            const displayMax = measureQty !== null ? measureQty : maxExpected;

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
                {/* Background Decoration — Forest Green theme */}
                <div className={`absolute inset-0 opacity-20 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'CONFIRM_QTY' ? 'bg-[#A9CBA2]' : 'bg-[#2C5E3B]'
                    }`} />

                {/* Scrollable Content */}
                <div className="absolute inset-0 overflow-y-auto flex flex-col items-center p-6 pb-32">

                    {/* Icon Circle */}
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 shadow-2xl z-10 transition-all duration-500 ${showSuccess
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

                    {/* Instruction / Status */}
                    <h1 className={`text-4xl md:text-5xl font-black text-gray-900 dark:text-[#EAE5D9] text-center uppercase italic tracking-tight mb-2 z-10 transition-all duration-300 ${showError ? 'text-red-500 animate-pulse' : ''
                        }`}>
                        {showSuccess ? 'Packed!' : showError ? 'Error!' : isFullyPacked ? t('warehouse.completed') : step === 'CONFIRM_QTY' ? 'Confirm Qty' : t('warehouse.scanBarcode').split(' ')[0]}
                    </h1>

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
                                                    let expected = item.expectedQty || 1;
                                                    let picked = item.pickedQty || 0;

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
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">{t('warehouse.picking')}</span>
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

                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2] rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />

                        {!isFullyPacked && (
                            <>
                                {step === 'CONFIRM_QTY' ? (
                                    <input
                                        ref={qtyRef}
                                        type="number"
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
                            className={`mt-6 w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-2xl border-2 relative z-30 ${isProcessing || isSubmitting
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

                    {/* PACKED SO FAR — running tally */}
                    {packedItems.length > 0 && !isFullyPacked && (
                        <div className="w-full max-w-md mt-6 z-10">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <CheckCircle size={10} className="text-green-500" />
                                    {t('warehouse.picking')}
                                </h4>
                                <span className="text-[10px] font-mono font-black text-green-600 dark:text-green-500/60 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                    {packedItems.length}/{totalItems}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-inner">
                                {packedItems.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className="text-gray-900 dark:text-white text-sm font-bold truncate">{item.name}</p>
                                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-mono">{item.sku}</p>
                                        </div>
                                        <span className="bg-green-500/10 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-mono font-black px-2 py-1 rounded-lg border border-green-500/20 whitespace-nowrap">
                                            {(() => {
                                                let expected = item.expectedQty || 1;
                                                let picked = item.pickedQty || 0;

                                                const measureQty = getItemMeasureQty(item);
                                                if (measureQty !== null && measureQty !== undefined) {
                                                    const prod = getProduct(item);
                                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                                    const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                                    return <>{displayPickedCases} x {sizeNum} / {expected} x {sizeNum}</>;
                                                }
                                                return <>{picked} / {expected}</>;
                                            })()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="mt-8 text-gray-500 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        Scan & Verify Protocol
                    </p>
                </div>
            </div>
        </div>
    );
};
