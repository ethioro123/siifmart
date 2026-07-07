import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Map as MapIcon, X, Maximize2, RotateCcw, Info, AlertTriangle, Package } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { isWeightBased, isVolumeBased, getSellUnit } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';
import { PickScannerPickedList } from './components/PickScannerPickedList';
import { PickScannerSummary } from './components/PickScannerSummary';
import { PickScannerInstructionPanel } from './components/PickScannerInstructionPanel';


const normalizeSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();

interface PickScannerProps {
    job: WMSJob;
    currentItem: any;
    currentProduct?: Product;
    products?: Product[];
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
    products = [],
    onClose,
    onScanLocation,
    onScanItem,
    onCompleteJob,
    isProcessing,
    expectedPrefix
}) => {
    const { t } = useLanguage();
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

    const getProduct = (item: any) => {
        const targetSiteId = job.siteId || (job as any).site_id;
        return products?.find(p =>
            (p.id === item.productId || p.sku === item.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        ) || currentProduct;
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
        setInputVal('');
        setQtyVal('');
    }, [currentItem?.id, step]);

    useEffect(() => {
        if (step !== 'LOCATION' || !inputVal || isProcessing || !expectedPrefix) return;
        const rawVal = inputVal.trim().toUpperCase();
        const requiredLength = expectedPrefix.length === 4 ? 15 : 14;

        if (rawVal.length >= requiredLength) {
            const scanPrefix = extractPrefixFromBarcode(rawVal);
            if (scanPrefix && expectedPrefix !== scanPrefix) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.wrongSite').replace('{site}', scanPrefix));
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
            }
        }
    }, [inputVal, step, expectedPrefix, isProcessing]);

    const isStrictlyValid = useMemo(() => {
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, step]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (Date.now() - lastStepChangeRef.current < 250) {
            return;
        }

        // If there are no items left to pick, clicking the button completes the job
        if (!currentItem) {
            if (onCompleteJob) {
                onCompleteJob(job);
            }
            return;
        }

        const rawVal = inputVal.trim();
        if (step !== 'QUANTITY' && !rawVal) return;
        if (isProcessing) return;

        const val = rawVal.toUpperCase();

        if (step === 'LOCATION') {
            if (!isLocationBarcode(val)) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.encodedBarcodeRequired'));
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
            const scanPrefix = extractPrefixFromBarcode(val);
            const isMatch = expectedPrefix === scanPrefix;
            if (expectedPrefix && !isMatch) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.wrongSite').replace('{site}', scanPrefix || ''));
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
        }

        if (step === 'LOCATION') {
            const targetLoc = currentProduct?.location || '';
            const normalizedTarget = normalizeLocation(targetLoc) || targetLoc.trim().toUpperCase();
            const decodedScanned = decodeLocation(val);

            if (!decodedScanned) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.corruptLocationData'));
                setShowError(true);
                return;
            }

            if (decodedScanned !== normalizedTarget) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.bayMismatch').replace('{location}', normalizedTarget));
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            await onScanLocation(decodedScanned);
            setStep('ITEM');
            setInputVal('');
            playBeep('success');
        } else if (step === 'ITEM') {
            const product = getProduct(currentItem);
            const targetSku = currentItem.sku ? normalizeSku(currentItem.sku) : '';
            const scannedVal = normalizeSku(val);
            
            const matchesSku = scannedVal === targetSku;
            const matchesBarcode = product?.barcode && normalizeSku(product.barcode) === scannedVal;

            if (!matchesSku && !matchesBarcode) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.incorrectItemScanned'));
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            playBeep('success');
            if (shortPickMode) {
                setIsItemMatched(true);
                setMatchedBarcode(val);
                setStep('QUANTITY');
            } else {
                await executePick(val);
            }
        } else if (step === 'QUANTITY') {
            const qty = parseFloat(qtyVal);
            const maxExpected = currentItem?.expectedQty || 1;
            const prod = getProduct(currentItem);
            const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
            const unitDef = prod?.unit ? getSellUnit(prod.unit) : null;
            const isWeightVol = unitDef && (unitDef.category === 'weight' || unitDef.category === 'volume');
            const expectedMeasureQty = getItemMeasureQty(currentItem, prod);

            const displayMax = isWeightVol && sizeNum > 0 ? expectedMeasureQty : maxExpected;

            if (isNaN(qty) || qty <= 0 || qty > displayMax) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.invalidQuantityRange').replace('{max}', String(displayMax)));
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            if (qty < displayMax) {
                const confirmed = window.confirm(t('warehouse.picking.shortPickConfirmPrompt').replace('{qty}', String(qty)).replace('{expected}', String(displayMax)));
                if (!confirmed) return;
            }

            await executePick(matchedBarcode, qty);
        }
    };

    const executePick = async (barcode: string, quantity?: number) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onScanItem(barcode, quantity);
            const itemName = currentItem?.name || 'Item';
            setSuccessMsg(`Picked ${quantity || 1}x ${itemName}`);
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
        <div className="fixed inset-0 z-[200] bg-[#FAF8F5] dark:bg-[#1C2620] flex flex-col overflow-hidden max-w-full">
            {/* Top Bar */}
            <div className="p-4 bg-[#EAE5D9] dark:bg-[#1C2620]/80 border-b border-[#E2DCCE] dark:border-[#A9CBA2]/10 flex justify-between items-center text-gray-900 dark:text-[#EAE5D9] transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 dark:text-[#A9CBA2]/70 hover:text-gray-900 dark:hover:text-[#EAE5D9] transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider">{step === 'LOCATION' ? t('warehouse.putaway.confirmLocation') : t('warehouse.scanProductBarcode')}</h3>
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-black">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#E2DCCE] dark:bg-[#2C5E3B]/20 px-2 py-1 rounded text-gray-600 dark:text-[#A9CBA2]">
                        {step === 'LOCATION' ? '1/3' : step === 'ITEM' ? '2/3' : '3/3'}
                    </span>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col transition-colors">
                {/* Background Decoration */}
                <div className={`absolute inset-0 opacity-[0.05] dark:opacity-20 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'LOCATION' ? 'bg-[#2C5E3B]' : 'bg-[#A9CBA2]'}`} />

                {/* Scrollable Content Container */}
                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center p-6 pb-32 w-full">

                    {/* Icon Circle */}
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 shadow-2xl z-10 transition-all duration-500 bg-white dark:bg-transparent ${showSuccess
                        ? 'border-green-400 dark:bg-green-400/20 shadow-green-400/40 scale-110'
                        : showError
                            ? 'border-red-500 dark:bg-red-500/20 shadow-red-500/40 scale-110 animate-shake'
                            : step === 'LOCATION'
                                ? 'border-[#2C5E3B] dark:bg-[#2C5E3B]/10 shadow-[#2C5E3B]/20'
                                : 'border-[#A9CBA2] dark:bg-[#A9CBA2]/10 shadow-[#A9CBA2]/40'
                        }`}>
                        {showSuccess ? (
                            <CheckCircle size={64} className="text-green-500 dark:text-green-400 animate-bounce" />
                        ) : showError ? (
                            <AlertTriangle size={64} className="text-red-500" />
                        ) : step === 'LOCATION' ? (
                            <MapIcon size={64} className="text-[#2C5E3B] dark:text-[#A9CBA2] drop-shadow-[0_0_10px_rgba(44,94,59,0.5)]" />
                        ) : (
                            <Package size={64} className="text-[#2C5E3B] dark:text-[#A9CBA2] drop-shadow-[0_0_15px_rgba(169,203,162,0.6)]" />
                        )}
                    </div>

                    {/* Instruction */}
                    <h1 className={`text-3xl md:text-5xl font-black text-gray-900 dark:text-[#EAE5D9] text-center uppercase italic tracking-tight mb-2 z-10 transition-all duration-300 ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-[#2C5E3B] dark:text-[#A9CBA2] scale-105' : showError ? 'text-red-600 dark:text-red-500 animate-pulse' : ''}`}>
                        {showSuccess ? t('warehouse.picking.successCaps') : showError ? t('warehouse.picking.errorCaps') : !currentItem ? t('warehouse.picking.missionComplete') : step === 'LOCATION' ? (isLocationBarcode(inputVal.trim().toUpperCase()) ? t('warehouse.picking.locationIdentified') : t('warehouse.scanLocation')) : step === 'QUANTITY' ? t('warehouse.confirmQty') : t('warehouse.scanSkuToConfirm')}
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
                        <PickScannerSummary
                            job={job}
                            getProduct={getProduct}
                            getItemMeasureQty={getItemMeasureQty}
                            t={t}
                        />
                    ) : (
                        <PickScannerInstructionPanel
                            step={step}
                            inputVal={inputVal}
                            currentItem={currentItem}
                            currentProduct={currentProduct}
                            isItemMatched={isItemMatched}
                            shortPickMode={shortPickMode}
                            setShortPickMode={setShortPickMode}
                            getItemMeasureQty={getItemMeasureQty}
                            t={t}
                        />
                    )}


                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2] dark:from-[#2C5E3B] dark:to-[#A9CBA2] rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                        {currentItem && (
                            <>
                                {step === 'QUANTITY' ? (
                                    <input
                                        ref={qtyRef}
                                        type="number"
                                        inputMode="decimal"
                                        pattern="[0-9]*"
                                        aria-label="Pick quantity"
                                        title="Pick quantity"
                                        value={qtyVal}
                                        onChange={(e) => setQtyVal(e.target.value)}
                                        className="w-full bg-white/90 dark:bg-[#1C2620]/90 border-2 rounded-2xl py-6 px-4 text-center text-5xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none relative z-10 shadow-xl transition-all border-[#2C5E3B] dark:border-[#A9CBA2]/40 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
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
                                            setErrorMsg(t('warehouse.picking.scanOnlyNoPasting'));
                                            setShowError(true);
                                            setTimeout(() => setShowError(false), 2000);
                                        }}
                                        className={`w-full bg-white/90 dark:bg-[#1C2620]/90 border-2 rounded-2xl py-6 px-4 text-center text-xl md:text-3xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none relative z-10 shadow-xl transition-all border-[#E2DCCE] dark:border-[#A9CBA2]/10 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]/40`}
                                        placeholder={step === 'LOCATION' ? t('warehouse.picking.scan15DigitBarcode') : t('warehouse.picking.scanSkuBarcode')}
                                        autoFocus
                                        disabled={isProcessing}
                                    />
                                )}

                                {step === 'LOCATION' && inputVal.trim() && (
                                    <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-1 duration-300 mt-2">
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-ping" />
                                            {isLocationBarcode(inputVal.trim().toUpperCase()) ? `IDENTIFIED: ${decodeLocation(inputVal.trim().toUpperCase())}` : t('warehouse.picking.encodedBarcodeProtocolRequired')}
                                        </p>
                                    </div>
                                )}
                                {step === 'QUANTITY' && (
                                    <div className="mb-4 text-center mt-2 animate-in fade-in duration-300">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2]">
                                            {t('warehouse.expected')}: {(() => {
                                                const measureQty = getItemMeasureQty(currentItem);
                                                if (measureQty) {
                                                    const expected = currentItem?.expectedQty || 1;
                                                    const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                                    const sizeNum = currentProduct?.size ? parseFloat(currentProduct.size as string) : 0;
                                                    return <>{expected} x {sizeNum} {unitDef}</>;
                                                }
                                                return currentItem?.expectedQty || 1;
                                            })()}
                                        </p>
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
                                ? 'bg-gray-200 dark:bg-[#1C2620]/50 border-gray-300 dark:border-white/5 text-gray-400 dark:text-gray-600 grayscale opacity-50 cursor-not-allowed'
                                : (!currentItem)
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-105'
                                    : (isItemMatched)
                                        ? 'bg-green-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.3)]'
                                        : !isStrictlyValid
                                            ? 'bg-red-50 dark:bg-[#1C2620] border-red-500/50 text-red-600 dark:text-red-400'
                                            : 'bg-gradient-to-r from-[#2C5E3B] to-[#3a7a4d] dark:from-[#2C5E3B] dark:to-[#3a7a4d] border-[#2C5E3B] dark:border-[#A9CBA2]/20 text-white font-black uppercase tracking-widest shadow-[#2C5E3B]/20'
                                }`}
                        >
                            {isProcessing ? (
                                <RotateCcw size={24} className="animate-spin" />
                            ) : (isItemMatched || !currentItem) ? (
                                <CheckCircle size={24} className="animate-bounce" />
                            ) : (
                                <CheckCircle size={24} />
                            )}
                            {isProcessing ? t('warehouse.picking.validating') : !currentItem ? t('warehouse.completed') : step === 'QUANTITY' ? t('warehouse.picking.confirmPick') : isItemMatched ? t('warehouse.picking.completePick') : t('warehouse.picking.confirmScan')}
                    </button>
                    </form>

                    {/* PICKED SO FAR */}
                    <PickScannerPickedList
                        job={job}
                        getProduct={getProduct}
                        getItemMeasureQty={getItemMeasureQty}
                        t={t}
                    />

                    <p className="mt-8 text-gray-550 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        {t('warehouse.picking.checksumVerifiedInfo')}
                    </p>
                </div>
            </div>
        </div>
    );
};
