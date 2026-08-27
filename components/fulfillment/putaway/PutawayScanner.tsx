import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Map as MapIcon, X, Maximize2, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode, extractSkuFromScan } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { logger } from '../../../utils/logger';
import { PutawayScannerLocationCard } from './components/PutawayScannerLocationCard';

const normalizeSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();

interface PutawayScannerProps {
    job: WMSJob;
    currentItem: any;
    currentProduct?: Product;
    onClose: () => void;
    onScanLocation: (location: string) => void;
    onScanItem: (barcode: string) => void;
    isProcessing: boolean;
    recommendation?: {
        location: string;
        type: 'ASSIGNED' | 'SUGGESTED';
        label: string;
    } | null;
    occupants?: Product[];
    allProducts: Product[];
    activeSiteId?: string;
    expectedPrefix?: string;
    t: (key: string) => string;
}

export const PutawayScanner: React.FC<PutawayScannerProps> = ({
    job,
    currentItem,
    currentProduct,
    onClose,
    onScanLocation,
    onScanItem,
    isProcessing,
    recommendation,
    occupants = [],
    allProducts,
    activeSiteId,
    expectedPrefix,
    t
}) => {
    const [step, setStep] = useState<'LOCATION' | 'ITEM'>('LOCATION');
    const [inputVal, setInputVal] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [awaitingOccupancyConfirmation, setAwaitingOccupancyConfirmation] = useState(false);
    const [awaitingMismatchConfirmation, setAwaitingMismatchConfirmation] = useState(false);
    const [isOverflowMode, setIsOverflowMode] = useState(false);
    const [lastCheckedLocation, setLastCheckedLocation] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scanLockRef = useRef(false);

    const existingSkuLocations = useMemo(() => {
        if (!currentItem?.sku) return [];
        const targetSiteId = activeSiteId || job.siteId || (job as any).site_id;
        const normSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();
        const targetNormSku = normSku(currentItem.sku);

        return allProducts.filter(p => 
            p.sku && normSku(p.sku) === targetNormSku &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId) &&
            p.location &&
            p.location !== 'On Order' &&
            p.location !== 'Receiving Dock'
        );
    }, [currentItem, allProducts, activeSiteId, job]);

    const handleSelectLocation = async (loc: string) => {
        const norm = normalizeLocation(loc) || loc.trim().toUpperCase();
        await onScanLocation(norm);
        setStep('ITEM');
        setInputVal('');
        setIsOverflowMode(false);
        setAwaitingOccupancyConfirmation(false);
        setAwaitingMismatchConfirmation(false);
        setLastCheckedLocation(null);
        playBeep('success');
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
            if (inputRef.current) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    useEffect(() => {
        setInputVal('');
    }, [currentItem?.id, step]);

    useEffect(() => {
        setAwaitingOccupancyConfirmation(false);
        setAwaitingMismatchConfirmation(false);
        setLastCheckedLocation(null);
    }, [step]);

    useEffect(() => {
        const normalized = normalizeLocation(inputVal);
        const canonLoc = normalized || inputVal.trim().toUpperCase();
        if (canonLoc !== lastCheckedLocation) {
            setAwaitingOccupancyConfirmation(false);
            setAwaitingMismatchConfirmation(false);
        }
    }, [inputVal, lastCheckedLocation]);

    const currentOccupants = useMemo(() => {
        const targetSiteId = activeSiteId || job.siteId || (job as any).site_id;
        const normalized = isLocationBarcode(inputVal.trim().toUpperCase())
            ? decodeLocation(inputVal.trim().toUpperCase())
            : (normalizeLocation(inputVal) || inputVal.trim().toUpperCase());
        const canonLoc = normalized;
        if (!canonLoc) return [];

        return allProducts.filter(p => {
            const pLoc = p.location || '';
            const normalizedPLoc = normalizeLocation(pLoc) || pLoc.trim().toUpperCase();
            return normalizedPLoc === canonLoc &&
                (p.siteId === targetSiteId || p.site_id === targetSiteId) &&
                p.id !== currentProduct?.id &&
                (p.stock || 0) > 0;
        });
    }, [inputVal, allProducts, activeSiteId, job.siteId, currentProduct]);

    const isStrictlyValid = useMemo(() => {
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, step]);

    const conflictingOccupants = useMemo(() => {
        if (!currentOccupants.length || !currentItem?.sku) return [];
        return currentOccupants.filter(p => p.sku !== currentItem.sku);
    }, [currentOccupants, currentItem]);

    const isPlacementBlocked = conflictingOccupants.length > 0;

    useEffect(() => {
        if (step !== 'LOCATION' || !inputVal || isProcessing || !expectedPrefix) return;
        const rawVal = inputVal.trim().toUpperCase();
        const requiredLength = expectedPrefix.length === 4 ? 15 : 14;

        if (rawVal.length >= requiredLength) {
            const scanPrefix = extractPrefixFromBarcode(rawVal);
            if (scanPrefix && expectedPrefix !== scanPrefix) {
                playBeep('error');
                setErrorMsg(`WRONG SITE: ${scanPrefix}`);
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
            }
        }
    }, [inputVal, step, expectedPrefix, isProcessing]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawVal = inputVal.trim();
        if (!rawVal || isProcessing || scanLockRef.current) return;
        const val = rawVal.toUpperCase();

        if (step === 'LOCATION') {
            if (!isLocationBarcode(val)) {
                playBeep('error');
                setErrorMsg('ENCODED BARCODE REQUIRED');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
            const scanPrefix = extractPrefixFromBarcode(val);
            const isMatch = expectedPrefix === scanPrefix;
            if (expectedPrefix && !isMatch) {
                playBeep('error');
                setErrorMsg(`WRONG SITE: ${scanPrefix}`);
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
        }

        scanLockRef.current = true;
        try {
            if (step === 'LOCATION') {
                const decoded = decodeLocation(val);
                if (!decoded) {
                    playBeep('error');
                    setErrorMsg('Corrupt Location Data');
                    setShowError(true);
                    return;
                }
                const targetLoc = decoded;
                const normalizedAssigned = recommendation?.location ? (normalizeLocation(recommendation.location) || recommendation.location.trim().toUpperCase()) : null;

                if (isPlacementBlocked) { playBeep('error'); return; }
                if (currentOccupants.length > 0 && !awaitingOccupancyConfirmation) {
                    setLastCheckedLocation(targetLoc);
                    setAwaitingOccupancyConfirmation(true);
                    playBeep('warning');
                    return;
                }
                if (!isOverflowMode && recommendation?.type === 'ASSIGNED' && normalizedAssigned && targetLoc !== normalizedAssigned && !awaitingMismatchConfirmation) {
                    setLastCheckedLocation(targetLoc);
                    setAwaitingMismatchConfirmation(true);
                    playBeep('warning');
                    return;
                }

                await onScanLocation(targetLoc);
                setStep('ITEM');
                setInputVal('');
                setAwaitingOccupancyConfirmation(false);
                setAwaitingMismatchConfirmation(false);
                setLastCheckedLocation(null);
                playBeep('success');
            } else {
                const itemName = currentItem?.name || 'Item';
                const decodedSku = extractSkuFromScan(val);
                try {
                    await onScanItem(decodedSku);
                } catch (err: any) {
                    playBeep('error');
                    setErrorMsg('Incorrect Item Scanned');
                    setShowError(true);
                    setInputVal('');
                    setTimeout(() => setShowError(false), 2500);
                    return;
                }
                setSuccessMsg(`Relocated ${itemName}`);
                setShowSuccess(true);
                playBeep('success');
                setInputVal('');
                setTimeout(() => {
                    setShowSuccess(false);
                    setStep('LOCATION');
                }, 2000);
            }
        } catch (err) {
            logger.error('PutawayScanner', "Scan failed:", err);
            setInputVal('');
            setAwaitingOccupancyConfirmation(false);
        } finally {
            scanLockRef.current = false;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-stone-50 dark:bg-black flex flex-col transition-colors duration-500 overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="p-3.5 sm:p-4 bg-[#FAF8F5]/90 dark:bg-[#1C2620]/90 border-b border-[#E2DCCE]/60 dark:border-white/10 flex justify-between items-center backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-1 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-all rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 active:scale-95" aria-label={t('warehouse.dismiss')}>
                        <X size={22} />
                    </button>
                    <div>
                        <h3 className="font-black text-stone-900 dark:text-white text-base sm:text-lg uppercase tracking-tight">
                            {step === 'LOCATION' ? t('warehouse.scanLocation') : t('warehouse.scanSkuToConfirm')}
                        </h3>
                        <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest">
                            JOB: {formatJobId(job)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-stone-200/70 dark:bg-white/10 px-3 py-1.5 rounded-full text-stone-700 dark:text-stone-300 border border-stone-300/40 dark:border-white/10">
                        STEP {step === 'LOCATION' ? '1' : '2'} OF 2
                    </span>
                </div>
            </div>

            {/* Main View Area */}
            <div className="flex-1 relative w-full overflow-y-auto custom-scrollbar">
                <div className={`absolute inset-0 opacity-10 blur-[100px] transition-colors duration-1000 pointer-events-none ${step === 'LOCATION' ? 'bg-[#2C5E3B]' : 'bg-emerald-600'} `} />

                <div className="relative min-h-full flex flex-col items-center justify-start p-4 sm:p-6 pb-32 max-w-lg mx-auto">
                    {/* Status Orb - Responsive height */}
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-3xl sm:rounded-[2rem] border-3 sm:border-4 flex items-center justify-center mb-3 sm:mb-4 shadow-lg transition-all duration-500 shrink-0 ${
                        showSuccess 
                            ? 'border-emerald-400 bg-emerald-400/20 shadow-emerald-500/30 scale-105' 
                            : showError 
                                ? 'border-rose-500 bg-rose-500/20 shadow-rose-500/30 scale-105 animate-shake' 
                                : step === 'LOCATION' 
                                    ? 'border-[#2C5E3B] bg-[#2C5E3B]/10 dark:border-[#A9CBA2] dark:bg-[#A9CBA2]/10 shadow-[#2C5E3B]/20' 
                                    : 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20'
                    }`}>
                        {showSuccess ? (
                            <CheckCircle size={36} className="text-emerald-400 animate-bounce" />
                        ) : showError ? (
                            <AlertTriangle size={36} className="text-rose-500" />
                        ) : step === 'LOCATION' ? (
                            <MapIcon size={36} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        ) : (
                            <Box size={36} className="text-emerald-500" />
                        )}
                    </div>

                    <h1 className={`text-xl sm:text-2xl md:text-3xl font-black text-stone-900 dark:text-white text-center uppercase tracking-tight mb-3 sm:mb-4 transition-all duration-300 ${isStrictlyValid ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : showError ? 'text-rose-500' : ''}`}>
                        {showSuccess ? 'Success!' : showError ? 'Scan Error' : step === 'LOCATION' ? (isStrictlyValid ? t('warehouse.putaway.confirmLocation') : t('warehouse.scanLocation')) : t('warehouse.scanSkuToConfirm')}
                    </h1>

                    {showSuccess ? (
                        <div className="text-center mb-6 animate-in fade-in zoom-in duration-300">
                            <p className="text-emerald-500 text-lg font-black uppercase tracking-widest drop-shadow-sm">{successMsg}</p>
                        </div>
                    ) : showError ? (
                        <div className="text-center mb-6 animate-in fade-in zoom-in duration-300">
                            <p className="text-rose-500 text-lg font-black uppercase tracking-widest drop-shadow-sm">{errorMsg}</p>
                        </div>
                    ) : step === 'LOCATION' ? (
                        <div className="w-full mb-6">
                            <PutawayScannerLocationCard
                                isStrictlyValid={isStrictlyValid}
                                inputVal={inputVal}
                                recommendation={recommendation}
                                currentProduct={currentProduct}
                                currentItem={currentItem}
                                isOverflowMode={isOverflowMode}
                                setIsOverflowMode={setIsOverflowMode}
                                setAwaitingMismatchConfirmation={setAwaitingMismatchConfirmation}
                                existingSkuLocations={existingSkuLocations}
                                handleSelectLocation={handleSelectLocation}
                                currentOccupants={currentOccupants}
                                t={t}
                            />
                        </div>
                    ) : (
                        <div className="text-center mb-6 w-full max-w-md">
                            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{t('warehouse.putaway.itemVerification')}</p>
                            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border-2 border-emerald-400/40 rounded-3xl p-6 shadow-lg">
                                <p className="text-2xl text-stone-900 dark:text-white font-black uppercase tracking-tight leading-snug mb-3">
                                    {currentItem?.name || currentItem?.productName}
                                </p>
                                <div className="inline-block px-4 py-2 bg-emerald-600 text-white font-black font-mono text-base rounded-xl shadow-md shadow-emerald-600/20 tracking-widest mb-3">
                                    {currentItem?.sku}
                                </div>
                                
                                {currentOccupants.length > 0 && (
                                    <div className="mt-4 space-y-4 pt-6 border-t-2 border-emerald-400/20 text-left">
                                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400/60 tracking-widest block mb-1">{t('warehouse.putaway.locationOccupants')} ({currentOccupants.length})</span>
                                        {currentOccupants.slice(0, 3).map((occ: Product) => (
                                            <div key={occ.id} className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-white/5 border border-emerald-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                                    <Box size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{occ.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group space-y-4">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                aria-label="Scan location or SKU barcode"
                                title="Scan location or SKU barcode"
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                onKeyDown={scanOnlyHandlers.onKeyDown}
                                onPaste={scanOnlyHandlers.onPaste}
                                className={`w-full bg-white dark:bg-[#1C2620] border-2 sm:border-3 rounded-2xl py-4 sm:py-5 px-4 text-center text-2xl sm:text-3xl font-black font-mono text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none shadow-xl transition-all duration-300 ${
                                    awaitingOccupancyConfirmation || awaitingMismatchConfirmation 
                                        ? 'border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/30' 
                                        : 'border-[#E2DCCE] dark:border-white/10 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]'
                                }`}
                                placeholder={step === 'LOCATION' ? t('warehouse.putaway.scanLocationPlaceholder') : t('warehouse.putaway.scanSkuPlaceholder')}
                                autoFocus
                                disabled={isProcessing}
                            />
                        </div>

                        {step === 'LOCATION' && inputVal.trim() && (
                            <div className="text-center animate-in fade-in slide-in-from-bottom-1 duration-200">
                                <p className="text-[10px] font-black uppercase tracking-wider text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center gap-2">
                                    {isStrictlyValid ? `DETECTED: ${decodeLocation(inputVal.trim().toUpperCase())}` : 'Scan a location barcode'}
                                </p>
                            </div>
                        )}

                        {/* Occupancy Warning */}
                        {awaitingOccupancyConfirmation && !isPlacementBlocked && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-400/50 animate-in zoom-in-95 duration-300 shadow-sm text-left">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                                    <AlertTriangle size={18} className="shrink-0 stroke-[2.5]" />
                                    <span className="font-black uppercase tracking-wider text-xs">{t('warehouse.putaway.stockMergeRequired')}</span>
                                </div>
                                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                                    {t('warehouse.putaway.stockMergeInstruction')}
                                </p>
                            </div>
                        )}

                        {/* Mismatch Warning */}
                        {awaitingMismatchConfirmation && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-400/50 animate-in zoom-in-95 duration-300 shadow-sm text-left">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                                    <AlertTriangle size={18} className="shrink-0 stroke-[2.5]" />
                                    <span className="font-black uppercase tracking-wider text-xs">{t('warehouse.putaway.alternateLocationScanned')}</span>
                                </div>
                                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                                    {t('warehouse.putaway.alternateLocationInstruction')}
                                </p>
                            </div>
                        )}

                        {/* Strict Block Warning */}
                        {isPlacementBlocked && (
                            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 animate-in zoom-in-95 duration-300 shadow-md text-left">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
                                    <X size={20} className="shrink-0 stroke-[3]" />
                                    <span className="font-black uppercase tracking-wider text-sm">{t('warehouse.putaway.placementBlocked')}</span>
                                </div>
                                <p className="text-xs font-black text-rose-900 dark:text-rose-200 leading-relaxed mb-2">
                                    Incompatible inventory detected: <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg font-mono">{conflictingOccupants[0]?.sku}</span>
                                </p>
                                <p className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold tracking-wider">
                                    {t('warehouse.putaway.mixedSkuNotAllowed')}
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={!inputVal.trim() || isProcessing || isPlacementBlocked}
                            className={`w-full py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 min-h-[52px] active:scale-[0.98] shadow-lg border-2 ${
                                !inputVal.trim() || isProcessing
                                    ? 'bg-stone-200 dark:bg-stone-800 border-stone-300/40 dark:border-white/5 text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-70'
                                    : isPlacementBlocked
                                        ? 'bg-rose-500 border-rose-400 text-white cursor-not-allowed'
                                        : awaitingOccupancyConfirmation || awaitingMismatchConfirmation
                                            ? 'bg-amber-600 hover:bg-amber-700 border-amber-500 text-white font-black uppercase tracking-wider shadow-amber-500/30 animate-pulse'
                                            : 'bg-[#2C5E3B] hover:bg-[#1E3B24] border-[#2C5E3B] text-white font-black uppercase tracking-wider shadow-[#2C5E3B]/20'
                            }`}
                        >
                            {isProcessing ? (
                                <RotateCcw size={22} className="animate-spin" />
                            ) : (
                                <CheckCircle size={22} className="stroke-[2.5]" />
                            )}
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                                {isProcessing 
                                    ? 'Processing...' 
                                    : isPlacementBlocked 
                                        ? 'BLOCKED' 
                                        : awaitingOccupancyConfirmation 
                                            ? 'CONFIRM MERGE' 
                                            : awaitingMismatchConfirmation 
                                                ? 'CONFIRM LOCATION' 
                                                : 'SUBMIT'}
                            </span>
                        </button>
                    </form>

                    <p className="mt-8 text-stone-400 dark:text-stone-600 text-[10px] font-black font-mono uppercase tracking-[0.3em] text-center opacity-60">
                        Warehouse Scanner • Active Mode
                    </p>
                </div>
            </div>
        </div>
    );
};
