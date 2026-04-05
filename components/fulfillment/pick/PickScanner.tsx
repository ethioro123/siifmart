import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Map as MapIcon, X, Maximize2, RotateCcw, Info, AlertTriangle, Package } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';

const normalizeSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();

interface PickScannerProps {
    job: WMSJob;
    currentItem: any;
    currentProduct?: Product;
    onClose: () => void;
    onScanLocation: (location: string) => void;
    onScanItem: (barcode: string, quantity?: number) => void;
    onCompleteJob?: (job: WMSJob) => void;
    isProcessing: boolean;
    expectedPrefix?: string;
}

export const PickScanner: React.FC<PickScannerProps> = ({
    job,
    currentItem,
    currentProduct,
    onClose,
    onScanLocation,
    onScanItem,
    onCompleteJob,
    isProcessing,
    expectedPrefix
}) => {
    const [step, setStep] = useState<'LOCATION' | 'ITEM' | 'QUANTITY'>('LOCATION');
    const [inputVal, setInputVal] = useState('');
    const [qtyVal, setQtyVal] = useState('');
    const [shortPickMode, setShortPickMode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isItemMatched, setIsItemMatched] = useState(false);
    const [matchedBarcode, setMatchedBarcode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastStepChangeRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const qtyRef = useRef<HTMLInputElement>(null);
    const lastKeyTime = useRef<number>(Date.now());

    const scanOnlyHandlers = useScanOnly(setInputVal, {
        onReject: (reason) => {
            setErrorMsg(reason);
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'QUANTITY') {
                if (qtyRef.current) qtyRef.current.focus();
            } else {
                if (inputRef.current) inputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    useEffect(() => {
        lastStepChangeRef.current = Date.now();
    }, [step]);

    useEffect(() => {
        setInputVal('');
        setQtyVal('');
        setIsItemMatched(false);
        setMatchedBarcode('');
        setShowSuccess(false);
        setShowError(false);
        setShortPickMode(false);
        if (step !== 'LOCATION') {
            setStep('LOCATION');
        }
    }, [currentItem?.sku]);

    const isStrictlyValid = useMemo(() => {
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, step]);

    useEffect(() => {
        if (!inputVal || isProcessing) return;

        const rawVal = inputVal.trim().toUpperCase();

        if (step === 'LOCATION' && expectedPrefix) {
            const requiredLength = expectedPrefix.length === 4 ? 15 : 14;
            if (rawVal.length === requiredLength) {
                const scanPrefix = extractPrefixFromBarcode(rawVal);
                if (scanPrefix && expectedPrefix !== scanPrefix) {
                    playBeep('error');
                    setErrorMsg(`WRONG SITE: ${scanPrefix} (Expected ${expectedPrefix})`);
                    setShowError(true);
                    setInputVal('');
                    setTimeout(() => setShowError(false), 2000);
                } else {
                    const decoded = decodeLocation(rawVal);
                    const expectedLoc = currentProduct?.location;
                    const normalizedExpected = expectedLoc ? (normalizeLocation(expectedLoc) || expectedLoc.trim().toUpperCase()) : null;

                    if (decoded && normalizedExpected && decoded !== normalizedExpected) {
                        playBeep('error');
                        setErrorMsg(`WRONG BAY. Expected ${expectedLoc}`);
                        setShowError(true);
                        setInputVal('');
                        setTimeout(() => setShowError(false), 2000);
                    } else if (decoded) {
                        onScanLocation(decoded);
                        setStep('ITEM');
                        setInputVal('');
                        playBeep('success');
                    }
                }
            }
        }
    }, [inputVal, step, expectedPrefix, isProcessing, currentProduct, onScanLocation]);

    useEffect(() => {
        if (step !== 'ITEM' || !inputVal || isProcessing || isItemMatched || isSubmitting) return;

        const val = inputVal.trim().toUpperCase();
        const normalizedVal = normalizeSku(val);
        const skuMatch = val === currentItem?.sku || val === currentProduct?.barcode || val === currentProduct?.sku ||
            normalizedVal === normalizeSku(currentItem?.sku || '') ||
            normalizedVal === normalizeSku(currentProduct?.barcode || '') ||
            normalizedVal === normalizeSku(currentProduct?.sku || '');
        if (skuMatch) {
            setMatchedBarcode(val);
            setIsItemMatched(true);

            const expected = currentItem?.expectedQty || 1;
            const picked = currentItem?.pickedQty || 0;
            const remaining = expected - picked;

            if (shortPickMode) {
                setStep('QUANTITY');
                setQtyVal('');
                setInputVal('');
                playBeep('success');
            } else {
                handleConfirmPickImmediately(val, remaining || 1);
            }
        }
    }, [inputVal, step, currentItem, currentProduct, isProcessing, isItemMatched, isSubmitting, shortPickMode]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isProcessing || isSubmitting) return;

        if (!currentItem) {
            if (onCompleteJob) {
                onCompleteJob({ ...job, notes: (job.notes ? job.notes + ' ' : '') + '[STRICT_SCAN]' });
            }
            return;
        }

        const rawVal = inputVal.trim();
        const val = rawVal.toUpperCase();

        if (step === 'LOCATION') {
            if (!rawVal) return;
            if (!isLocationBarcode(val)) {
                playBeep('error');
                setErrorMsg('ENCODED BARCODE REQUIRED');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
            const decoded = decodeLocation(val);
            if (decoded) {
                await onScanLocation(decoded);
                setStep('ITEM');
                setInputVal('');
                playBeep('success');
            }
        } else if (step === 'QUANTITY') {
            if (Date.now() - lastStepChangeRef.current < 400) return;

            const qty = parseInt(qtyVal);
            if (isNaN(qty) || qty <= 0) {
                playBeep('error');
                setErrorMsg('Enter valid quantity');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
            handleConfirmPickImmediately(matchedBarcode, qty);
        } else if (step === 'ITEM') {
            if (!rawVal || isItemMatched) return;

            const normalizedVal = normalizeSku(val);
            const skuMatch = val === currentItem?.sku || val === currentProduct?.barcode || val === currentProduct?.sku ||
                normalizedVal === normalizeSku(currentItem?.sku || '') ||
                normalizedVal === normalizeSku(currentProduct?.barcode || '') ||
                normalizedVal === normalizeSku(currentProduct?.sku || '');
            if (skuMatch) {
                return;
            } else {
                playBeep('error');
                setErrorMsg('Incorrect Item Scanned');
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2500);
            }
        }
    };

    const handleConfirmPickImmediately = async (barcode: string, quantity: number = 1) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onScanItem(barcode, quantity);
            const itemName = currentItem?.name || 'Item';
            setSuccessMsg(`Picked ${quantity}x ${itemName}`);
            setShowSuccess(true);
            playBeep('success');
            setInputVal('');
            setQtyVal('');

            setTimeout(() => {
                setShowSuccess(false);
                setIsItemMatched(false);
                setMatchedBarcode('');
                setStep('LOCATION'); 
                scanOnlyHandlers.reset();
            }, 1500);
        } catch (err: any) {
            playBeep('error');
            setErrorMsg(err.message || 'Error saving pick');
            setShowError(true);
            setIsItemMatched(false);
            setStep('ITEM');
            setTimeout(() => {
                setShowError(false);
                scanOnlyHandlers.reset(); 
            }, 2500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col">
            {/* Top Bar */}
            <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 flex justify-between items-center text-gray-900 dark:text-white transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="Close Scanner">
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider">{step === 'LOCATION' ? 'Verify Source Bay' : 'Scan Item to Pick'}</h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-mono font-black">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-gray-200 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                        {step === 'LOCATION' ? '1/3' : step === 'ITEM' ? '2/3' : '3/3'}
                    </span>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col transition-colors">
                {/* Background Decoration */}
                <div className={`absolute inset-0 opacity-[0.05] dark:opacity-20 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'LOCATION' ? 'bg-purple-500' : 'bg-violet-500'}`} />

                {/* Scrollable Content Container */}
                <div className="absolute inset-0 overflow-y-auto flex flex-col items-center p-6 pb-32">

                    {/* Icon Circle */}
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 shadow-2xl z-10 transition-all duration-500 bg-white dark:bg-transparent ${showSuccess
                        ? 'border-green-400 dark:bg-green-400/20 shadow-green-400/40 scale-110'
                        : showError
                            ? 'border-red-500 dark:bg-red-500/20 shadow-red-500/40 scale-110 animate-shake'
                            : step === 'LOCATION'
                                ? 'border-purple-500 dark:bg-purple-500/10 shadow-purple-500/20'
                                : 'border-violet-500 dark:bg-violet-500/10 shadow-violet-500/40'
                        }`}>
                        {showSuccess ? (
                            <CheckCircle size={64} className="text-green-500 dark:text-green-400 animate-bounce" />
                        ) : showError ? (
                            <AlertTriangle size={64} className="text-red-500" />
                        ) : step === 'LOCATION' ? (
                            <MapIcon size={64} className="text-purple-600 dark:text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        ) : (
                            <Package size={64} className="text-purple-600 dark:text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
                        )}
                    </div>

                    {/* Instruction */}
                    <h1 className={`text-3xl md:text-5xl font-black text-gray-900 dark:text-white text-center uppercase italic tracking-tight mb-2 z-10 transition-all duration-300 ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-purple-600 dark:text-purple-400 scale-105' : showError ? 'text-red-600 dark:text-red-500 animate-pulse' : ''}`}>
                        {showSuccess ? 'Success!' : showError ? 'Error!' : !currentItem ? 'Mission Complete' : step === 'LOCATION' ? (isLocationBarcode(inputVal.trim().toUpperCase()) ? 'Location Identified' : 'Locate Bay') : step === 'QUANTITY' ? 'Confirm Quantity' : 'Verify Item'}
                    </h1>

                    {showSuccess ? (
                        <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-green-600 dark:text-green-400 text-xl font-bold uppercase tracking-widest">{successMsg}</p>
                        </div>
                    ) : showError ? (
                        <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-red-600 dark:text-red-500 text-xl font-bold uppercase tracking-widest">{errorMsg}</p>
                        </div>
                    ) : !currentItem ? (
                        <div className="text-center z-10 mb-8 bg-green-50 dark:bg-green-500/10 border-2 border-green-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.1)] w-full max-w-md">
                            <p className="text-green-700 dark:text-green-400 text-lg font-bold uppercase tracking-widest mb-4">All Items Picked!</p>

                            <div className="bg-white dark:bg-black/40 rounded-xl p-4 mb-4 text-left max-h-48 overflow-y-auto border border-gray-200 dark:border-green-500/20 shadow-inner dark:shadow-none">
                                <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-200 dark:border-white/10 pb-2">Mission Summary</h4>
                                <div className="flex flex-col gap-3">
                                    {job.lineItems?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-900 dark:text-white text-sm font-bold line-clamp-1">{item.name}</p>
                                                <p className="text-purple-600 dark:text-purple-400 text-xs font-mono">{item.sku}</p>
                                            </div>
                                            {(() => {
                                                let expected = item.expectedQty || item.quantity || 1;
                                                let picked = item.pickedQty || item.quantity || 1;

                                                if ((item as any).requestedMeasureQty) {
                                                    const requestedMeasure = (item as any).requestedMeasureQty;
                                                    let displayPicked = 0;
                                                    if (expected > 0) {
                                                        const fillRatio = picked / expected;
                                                        displayPicked = requestedMeasure * fillRatio;
                                                    }
                                                    const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                                    return <span className="text-gray-900 dark:text-white font-bold">{displayPicked} / {requestedMeasure} <span className="text-[9px] lowercase opacity-80 pl-0.5">{unitDef}</span></span>;
                                                }

                                                return <span className="text-gray-900 dark:text-white font-bold">{picked} / {expected}</span>;
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-white text-sm opacity-80 max-w-[200px] mx-auto">Click below to finalize this mission and create the Pack job.</p>
                        </div>
                    ) : step === 'LOCATION' ? (
                        <div className="text-center z-10 mb-8">
                            <div className="text-center mb-8 relative">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">
                                    Go to source bay
                                </p>

                                <div className={`relative inline-block px-8 py-4 rounded-xl border-2 transition-all duration-300 bg-purple-50 dark:bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]`}>
                                    <p className={`font-mono font-black tracking-widest ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-4xl md:text-7xl text-purple-600 dark:text-purple-300' : ((currentProduct?.location?.length || 0) > 10 ? 'text-xl md:text-2xl' : 'text-3xl md:text-5xl')}`}>
                                        {isLocationBarcode(inputVal.trim().toUpperCase())
                                            ? decodeLocation(inputVal.trim().toUpperCase())
                                            : (normalizeLocation(inputVal) || currentProduct?.location || 'UNKNOWN BAY')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : step === 'QUANTITY' ? (
                        <div className="text-center z-10 mb-8">
                            <p className="text-amber-600 dark:text-amber-400 text-lg uppercase tracking-widest font-bold">Short Pick — Enter Actual Qty</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-black mt-2">{currentItem?.name}</p>
                            <p className="text-purple-600 dark:text-purple-400 font-mono text-xl">{currentItem?.sku}</p>
                            <p className="text-gray-500 text-sm mt-2">Expected: <span className="text-gray-900 dark:text-white font-bold">
                                {(() => {
                                    let expected = currentItem?.expectedQty || 1;
                                    if ((currentItem as any)?.requestedMeasureQty) {
                                        const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                        return <>{(currentItem as any).requestedMeasureQty} <span className="text-xs uppercase text-gray-500 dark:text-gray-400">{unitDef}</span></>;
                                    }
                                    return expected;
                                })()}
                            </span></p>
                        </div>
                    ) : (
                        <div className="text-center z-10 mb-8">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">{isItemMatched ? 'Confirm item pick:' : 'Scan product barcode to pick:'}</p>
                            <p className={`text-2xl font-bold mt-2 transition-colors ${isItemMatched ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {currentItem?.name}
                            </p>
                            <p className="text-purple-600 dark:text-purple-400 font-mono text-xl mt-1">{currentItem?.sku}</p>
                            <p className="text-gray-500 text-xs mt-1">Expected: <span className="font-bold text-gray-900 dark:text-white">{(() => {
                                let expected = currentItem?.expectedQty || 1;
                                if ((currentItem as any)?.requestedMeasureQty) {
                                    const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                    return <>{(currentItem as any).requestedMeasureQty} <span className="text-[10px] uppercase text-gray-500">{(unitDef as string)}</span></>;
                                }
                                return expected;
                            })()}</span></p>
                            {!isItemMatched && (currentItem?.expectedQty || 1) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShortPickMode(!shortPickMode)}
                                    className={`mt-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${shortPickMode
                                        ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500/30'
                                        }`}
                                >
                                    {shortPickMode ? '✓ Short Pick Mode ON' : '⚠ Short Pick'}
                                </button>
                            )}
                        </div>
                    )}


                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-400 dark:from-purple-600 dark:to-violet-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                        {currentItem && (
                            <>
                                {step === 'QUANTITY' ? (
                                    <input
                                        ref={qtyRef}
                                        type="number"
                                        value={qtyVal}
                                        onChange={(e) => setQtyVal(e.target.value)}
                                        className="w-full bg-white/90 dark:bg-gray-900/90 border-2 rounded-2xl py-6 px-4 text-center text-5xl font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none relative z-10 shadow-xl transition-all border-purple-400 dark:border-purple-500 focus:border-purple-600 dark:focus:border-purple-300"
                                        placeholder="QTY"
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                    />
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputVal}
                                        onChange={(e) => setInputVal(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (step === 'LOCATION') {
                                                const now = Date.now();
                                                if (now - lastKeyTime.current > 300 && e.key !== 'Enter') {
                                                    lastKeyTime.current = now;
                                                    return;
                                                }
                                                lastKeyTime.current = now;
                                            } else {
                                                scanOnlyHandlers.onKeyDown(e);
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            playBeep('error');
                                            setErrorMsg('SCAN ONLY — NO PASTING');
                                            setShowError(true);
                                            setTimeout(() => setShowError(false), 2000);
                                        }}
                                        className={`w-full bg-white/90 dark:bg-gray-900/90 border-2 rounded-2xl py-6 px-4 text-center text-xl md:text-3xl font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none relative z-10 shadow-xl transition-all border-gray-300 dark:border-white/10 focus:border-purple-500 dark:focus:border-white/30`}
                                        placeholder={step === 'LOCATION' ? 'SCAN 15-DIGIT BARCODE' : 'SCAN SKU BARCODE'}
                                        autoFocus
                                        disabled={isProcessing}
                                    />
                                )}

                                {step === 'LOCATION' && inputVal.trim() && (
                                    <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-1 duration-300 mt-2">
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400 flex items-center justify-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                            {isLocationBarcode(inputVal.trim().toUpperCase()) ? `IDENTIFIED: ${decodeLocation(inputVal.trim().toUpperCase())}` : 'Encoded Barcode Protocol Required'}
                                        </p>
                                    </div>
                                )}
                                {step === 'QUANTITY' && (
                                    <div className="mb-4 text-center mt-2 animate-in fade-in duration-300">
                                        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Expected: {(() => {
                                            let expected = currentItem?.expectedQty || 1;
                                            if ((currentItem as any)?.requestedMeasureQty) {
                                                const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                                return <>{(currentItem as any).requestedMeasureQty} {unitDef}</>;
                                            }
                                            return expected;
                                        })()}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {isProcessing && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
                                <RotateCcw className="animate-spin text-gray-500 dark:text-white opacity-50" size={24} />
                            </div>
                        )}

                        {/* MOBILE ACTION BUTTON */}
                        <button
                            type="submit"
                            disabled={(step === 'LOCATION' && !inputVal.trim() && !!currentItem) || isProcessing}
                            className={`mt-6 w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-2xl border-2 relative z-30 pointer-events-auto ${((!inputVal.trim() && !isItemMatched && !!currentItem)) || isProcessing
                                ? 'bg-gray-200 dark:bg-zinc-800/50 border-gray-300 dark:border-white/5 text-gray-400 dark:text-zinc-600 grayscale opacity-50 cursor-not-allowed'
                                : (!currentItem)
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-105'
                                    : (isItemMatched)
                                        ? 'bg-green-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.3)]'
                                        : !isStrictlyValid
                                            ? 'bg-red-50 dark:bg-zinc-700 border-red-500/50 text-red-600 dark:text-red-400'
                                            : 'bg-gradient-to-r from-purple-500 to-violet-500 dark:from-purple-600 dark:to-violet-600 border-purple-400 dark:border-white/20 text-white font-black uppercase tracking-widest shadow-purple-500/20'
                                }`}
                        >
                            {isProcessing ? (
                                <RotateCcw size={24} className="animate-spin" />
                            ) : (isItemMatched || !currentItem) ? (
                                <CheckCircle size={24} className="animate-bounce" />
                            ) : (
                                <CheckCircle size={24} />
                            )}
                            {isProcessing ? 'Validating...' : !currentItem ? 'FINISH MISSION' : step === 'QUANTITY' ? 'CONFIRM PICK' : isItemMatched ? 'COMPLETE PICK' : 'Confirm Scan'}
                        </button>
                    </form>

                    {/* PICKED SO FAR */}
                    {(() => {
                        const pickedItems = job.lineItems?.filter((i: any) => i.status === 'Picked' || i.status === 'Completed') || [];
                        if (pickedItems.length === 0) return null;
                        return (
                            <div className="w-full max-w-md mt-6 z-10 transition-colors">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <CheckCircle size={10} className="text-green-500" />
                                        Picked So Far
                                    </h4>
                                    <span className="text-[10px] font-mono font-black text-green-600 dark:text-green-500/60 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/20">
                                        {pickedItems.length}/{job.lineItems?.length || 0}
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-sm dark:shadow-none">
                                    {pickedItems.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <p className="text-gray-900 dark:text-white text-sm font-bold truncate">{item.name}</p>
                                                <p className="text-gray-500 text-[10px] font-mono">{item.sku}</p>
                                            </div>
                                            <span className="bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-mono font-black px-2 py-1 rounded-lg border border-green-200 dark:border-green-500/20 whitespace-nowrap">
                                                {(() => {
                                                    let expected = item.expectedQty || 1;
                                                    let picked = item.pickedQty || 0;
                                                    if ((item as any).requestedMeasureQty) {
                                                        const requestedMeasure = (item as any).requestedMeasureQty;
                                                        let displayPicked = 0;
                                                        if (expected > 0) {
                                                            const fillRatio = picked / expected;
                                                            displayPicked = requestedMeasure * fillRatio;
                                                        }
                                                        return <>{displayPicked} / {requestedMeasure}</>;
                                                    }
                                                    return <>{picked} / {expected}</>;
                                                })()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    <p className="mt-8 text-gray-500 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        15-Digit Encoded Protocol • Checksum Verified
                    </p>
                </div>
            </div>
        </div>
    );
};
