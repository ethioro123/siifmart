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
        <div className="fixed inset-0 z-[200] bg-[#FAF8F5] dark:bg-[#1C2620] flex flex-col">
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
                <div className="absolute inset-0 overflow-y-auto flex flex-col items-center p-6 pb-32">

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
                        <div className="text-center z-10 mb-8 bg-green-50 dark:bg-green-500/10 border-2 border-green-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.1)] w-full max-w-md">
                            <p className="text-green-700 dark:text-green-400 text-lg font-bold uppercase tracking-widest mb-4">{t('warehouse.picking.allItemsPicked')}</p>

                            <div className="bg-white dark:bg-black/40 rounded-xl p-4 mb-4 text-left max-h-48 overflow-y-auto border border-gray-200 dark:border-green-500/20 shadow-inner dark:shadow-none">
                                <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-200 dark:border-white/10 pb-2">{t('warehouse.picking.missionSummary')}</h4>
                                <div className="flex flex-col gap-3">
                                    {job.lineItems?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-900 dark:text-[#EAE5D9] text-sm font-bold line-clamp-1">{item.name}</p>
                                                <p className="text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-mono">{item.sku}</p>
                                            </div>
                                            {(() => {
                                                let expected = item.expectedQty || item.quantity || 1;
                                                let picked = item.pickedQty || item.quantity || 1;

                                                const measureQty = getItemMeasureQty(item);
                                                if (measureQty) {
                                                    const prod = getProduct(item);
                                                    const unitDef = prod?.unit ? prod.unit : '';
                                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                                    const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                                    return <span className="text-gray-900 dark:text-white font-bold">{displayPickedCases} x {sizeNum} / {expected} x {sizeNum} <span className="text-[9px] lowercase opacity-80 pl-0.5">{unitDef}</span></span>;
                                                }

                                                return <span className="text-gray-900 dark:text-white font-bold">{picked} / {expected}</span>;
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-white text-sm opacity-80 max-w-[200px] mx-auto">{t('warehouse.picking.finalizeMissionInfo')}</p>
                        </div>
                    ) : step === 'LOCATION' ? (
                        <div className="text-center z-10 mb-8">
                            <div className="text-center mb-8 relative">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">
                                    {t('warehouse.picking.goToSourceBay')}
                                </p>

                                <div className={`relative inline-block px-8 py-4 rounded-xl border-2 transition-all duration-300 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 border-[#2C5E3B] text-[#2C5E3B] dark:text-[#A9CBA2] shadow-[0_0_30px_rgba(44,94,59,0.2)]`}>
                                    <p className={`font-mono font-black tracking-widest ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-4xl md:text-7xl text-[#2C5E3B] dark:text-[#A9CBA2]' : ((currentProduct?.location?.length || 0) > 10 ? 'text-xl md:text-2xl' : 'text-3xl md:text-5xl')}`}>
                                        {isLocationBarcode(inputVal.trim().toUpperCase())
                                            ? decodeLocation(inputVal.trim().toUpperCase())
                                            : (normalizeLocation(inputVal) || currentProduct?.location || t('warehouse.picking.unknownBay'))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : step === 'QUANTITY' ? (
                        <div className="text-center z-10 mb-8">
                            <p className="text-amber-600 dark:text-amber-400 text-lg uppercase tracking-widest font-bold">{t('warehouse.picking.shortPickEnterQty')}</p>
                            <p className="text-gray-900 dark:text-[#EAE5D9] text-2xl font-black mt-2">{currentItem?.name}</p>
                            <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-xl">{currentItem?.sku}</p>
                            <p className="text-gray-550 text-sm mt-2">{t('warehouse.expected')}: <span className="text-gray-900 dark:text-white font-bold">
                                {(() => {
                                    let expected = currentItem?.expectedQty || 1;
                                    const measureQty = getItemMeasureQty(currentItem);
                                    if (measureQty) {
                                        const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                        const sizeNum = currentProduct?.size ? parseFloat(currentProduct.size as string) : 0;
                                        return <>{expected} x {sizeNum} <span className="text-xs uppercase text-gray-500 dark:text-gray-400">{unitDef}</span></>;
                                    }
                                    return expected;
                                })()}
                            </span></p>
                        </div>
                    ) : (
                        <div className="text-center z-10 mb-8">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">{isItemMatched ? t('warehouse.picking.confirmItemPick') : t('warehouse.picking.scanProductToPick')}</p>
                            <p className={`text-2xl font-bold mt-2 transition-colors ${isItemMatched ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {currentItem?.name}
                            </p>
                            <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-xl mt-1">{currentItem?.sku}</p>
                            <p className="text-gray-555 text-xs mt-1">{t('warehouse.expected')}: <span className="font-bold text-gray-900 dark:text-white">{(() => {
                                let expected = currentItem?.expectedQty || 1;
                                const measureQty = getItemMeasureQty(currentItem);
                                if (measureQty) {
                                    const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                    const sizeNum = currentProduct?.size ? parseFloat(currentProduct.size as string) : 0;
                                    return <>{expected} x {sizeNum} <span className="text-[10px] uppercase text-gray-505">{(unitDef as string)}</span></>;
                                }
                                return expected;
                            })()}</span></p>
                            {!isItemMatched && (currentItem?.expectedQty || 1) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShortPickMode(!shortPickMode)}
                                    className={`mt-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${shortPickMode
                                        ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-655 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500/30'
                                        }`}
                                >
                                    {shortPickMode ? t('warehouse.picking.shortPickModeOn') : `⚠ ${t('warehouse.shortPick')}`}
                                </button>
                            )}
                        </div>
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
                    {(() => {
                        const pickedItems = job.lineItems?.filter((i: any) => i.status === 'Picked' || i.status === 'Completed') || [];
                        if (pickedItems.length === 0) return null;
                        return (
                            <div className="w-full max-w-md mt-6 z-10 transition-colors">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h4 className="text-[10px] font-black text-gray-505 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <CheckCircle size={10} className="text-green-500" />
                                        {t('warehouse.picking')}
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
                                                    const measureQty = getItemMeasureQty(item);
                                                    if (measureQty) {
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
                        );
                    })()}

                    <p className="mt-8 text-gray-550 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        {t('warehouse.picking.checksumVerifiedInfo')}
                    </p>
                </div>
            </div>
        </div>
    );
};
