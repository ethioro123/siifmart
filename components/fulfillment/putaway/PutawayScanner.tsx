import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Map as MapIcon, X, Maximize2, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';

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
    expectedPrefix
}) => {
    const [step, setStep] = useState<'LOCATION' | 'ITEM'>('LOCATION');
    const [inputVal, setInputVal] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [awaitingOccupancyConfirmation, setAwaitingOccupancyConfirmation] = useState(false);
    const [awaitingMismatchConfirmation, setAwaitingMismatchConfirmation] = useState(false);
    const [lastCheckedLocation, setLastCheckedLocation] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scanLockRef = useRef(false);

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
                if (recommendation?.type === 'ASSIGNED' && normalizedAssigned && targetLoc !== normalizedAssigned && !awaitingMismatchConfirmation) {
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
                try {
                    await onScanItem(val);
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
            console.error("Scan failed:", err);
            setInputVal('');
            setAwaitingOccupancyConfirmation(false);
        } finally {
            scanLockRef.current = false;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col transition-colors duration-500">
            {/* Top Bar */}
            <div className="p-4 bg-[#FAF8F5] dark:bg-[#1C2620]/80 border-b border-[#E2DCCE]/60 dark:border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all shadow-sm active:scale-95" aria-label="Close Scanner">
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase tracking-tight">{step === 'LOCATION' ? 'Scan Location' : 'Confirm Item'}</h3>
                        <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest mt-0.5">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[#E2DCCE]/30 dark:bg-white/10 px-3 py-1.5 rounded-full text-slate-750 dark:text-gray-300 border border-[#E2DCCE]/60 dark:border-white/10">
                        STEP {step === 'LOCATION' ? '1' : '2'}
                    </span>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col">
                <div className={`absolute inset-0 opacity-10 blur-[100px] transition-colors duration-1000 pointer-events-none ${step === 'LOCATION' ? 'bg-[#2C5E3B]' : 'bg-emerald-600'} `} />

                <div className="absolute inset-0 overflow-y-auto flex flex-col items-center p-6 pb-32 transition-all">
                    {/* Status Orb */}
                    <div className={`w-32 h-32 rounded-[2.5rem] border-4 flex items-center justify-center mb-10 shadow-2xl z-10 transition-all duration-700 ${showSuccess
                        ? 'border-emerald-400 bg-emerald-400/20 shadow-emerald-500/40 scale-110'
                        : showError
                            ? 'border-rose-500 bg-rose-500/20 shadow-rose-500/40 scale-110 animate-shake'
                            : step === 'LOCATION'
                                ? 'border-[#2C5E3B] bg-[#2C5E3B]/10 shadow-[#2C5E3B]/20'
                                : 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20'
                        }`}>
                        {showSuccess ? (
                            <CheckCircle size={64} className="text-emerald-400 animate-bounce" />
                        ) : showError ? (
                            <AlertTriangle size={64} className="text-rose-500" />
                        ) : step === 'LOCATION' ? (
                            <MapIcon size={64} className="text-[#2C5E3B] dark:text-[#A9CBA2] drop-shadow-[0_0_15px_rgba(44,94,59,0.5)]" />
                        ) : (
                            <Box size={64} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        )}
                    </div>

                    <h1 className={`text-4xl md:text-5xl font-black text-gray-900 dark:text-white text-center uppercase tracking-tight mb-4 z-10 transition-all duration-700 ${isStrictlyValid ? 'text-[#2C5E3B] dark:text-[#A9CBA2] scale-105' : showError ? 'text-rose-500' : ''}`}>
                        {showSuccess ? 'Success!' : showError ? 'Error' : step === 'LOCATION' ? (isStrictlyValid ? 'Location Found' : 'Scan Location') : 'Verify Item'}
                    </h1>

                    {showSuccess ? (
                        <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-emerald-500 text-xl font-black uppercase tracking-widest drop-shadow-sm">{successMsg}</p>
                        </div>
                    ) : showError ? (
                        <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-rose-500 text-xl font-black uppercase tracking-widest drop-shadow-sm">{errorMsg}</p>
                        </div>
                    ) : step === 'LOCATION' ? (
                        <div className="text-center z-10 mb-10 w-full max-w-sm">
                            <div className="text-center mb-8 relative">
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                    {recommendation?.type === 'ASSIGNED' ? 'Assigned Location' : recommendation?.type === 'SUGGESTED' ? 'Suggested Location' : 'Awaiting Scan'}
                                </p>

                                <div className={`relative inline-block px-10 py-6 rounded-3xl border-2 transition-all duration-700 ${recommendation?.type === 'ASSIGNED'
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-400 shadow-xl shadow-amber-500/10'
                                    : recommendation?.type === 'SUGGESTED'
                                        ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 border-[#2C5E3B]/30 dark:border-[#A9CBA2]/50 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-xl shadow-[#2C5E3B]/10'
                                        : 'bg-[#FAF8F5] dark:bg-white/5 border-[#E2DCCE]/60 dark:border-white/10 text-gray-900 dark:text-white'
                                    }`}>
                                    <p className={`font-mono font-black tracking-[0.1em] leading-none ${isStrictlyValid ? 'text-6xl md:text-7xl text-[#2C5E3B] dark:text-[#A9CBA2]' : (recommendation?.location?.length || 0) > 10 ? 'text-2xl' : 'text-5xl'}`}>
                                        {isStrictlyValid
                                            ? decodeLocation(inputVal.trim().toUpperCase())
                                            : (normalizeLocation(inputVal) || recommendation?.location || currentProduct?.location || '—')}
                                    </p>

                                    {recommendation?.type === 'SUGGESTED' && !normalizeLocation(inputVal) && (
                                        <div className="mt-4 border-t-2 border-[#E2DCCE]/60 dark:border-white/5 pt-3">
                                            <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest mb-1">
                                                {currentProduct?.category || 'General Inventory'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {currentOccupants.length > 0 && (
                                <div className="mt-8 p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border-2 border-amber-100 dark:border-amber-500/20 text-left animate-in slide-in-from-top-4 duration-700 shadow-lg shadow-amber-500/5">
                                    <div className="flex items-center gap-3 mb-4 border-b border-amber-200 dark:border-amber-500/10 pb-3">
                                        <Box size={16} className="text-amber-500" />
                                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500/80 tracking-widest">Existing Stock Alert ({currentOccupants.length})</span>
                                    </div>
                                    <div className="space-y-4">
                                        {currentOccupants.slice(0, 2).map((occ: Product) => (
                                            <div key={occ.id} className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                                                    <Info size={14} className="text-amber-600 dark:text-amber-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-amber-900 dark:text-amber-100 truncate uppercase tracking-tight">{occ.name}</p>
                                                    <p className="text-[10px] font-black font-mono text-amber-600/50 truncate uppercase tracking-widest">{occ.sku}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center z-10 mb-10 w-full max-w-sm">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Item Verification</p>
                            <div className="bg-emerald-50 dark:bg-emerald-500/5 border-2 border-emerald-400/30 rounded-3xl p-8 mb-8 shadow-xl shadow-emerald-500/5">
                                <p className="text-3xl text-gray-900 dark:text-white font-black uppercase tracking-tight leading-none mb-4">
                                    {currentItem?.name}
                                </p>
                                <div className="inline-block px-4 py-2 bg-emerald-500 text-white font-black font-mono text-lg rounded-xl shadow-lg shadow-emerald-500/20 tracking-widest mb-4">
                                    {currentItem?.sku}
                                </div>
                                
                                {currentOccupants.length > 0 && (
                                    <div className="mt-4 space-y-4 pt-6 border-t-2 border-emerald-400/20 text-left">
                                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400/60 tracking-widest block mb-1">Items at Location ({currentOccupants.length})</span>
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
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B] to-[#1E3B24] rounded-3xl blur-[20px] opacity-10 group-focus-within:opacity-30 transition-opacity" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={step === 'ITEM' ? scanOnlyHandlers.onKeyDown : undefined}
                            onPaste={scanOnlyHandlers.onPaste}
                            className={`w-full bg-white dark:bg-gray-900/90 border-4 rounded-3xl py-8 px-6 text-center text-4xl font-black font-mono text-gray-900 dark:text-white placeholder:text-gray-200 dark:placeholder:text-gray-800 focus:outline-none relative z-10 shadow-2xl transition-all duration-300 ${awaitingOccupancyConfirmation || awaitingMismatchConfirmation ? 'border-amber-400 shadow-amber-500/30' : 'border-[#E2DCCE]/60 dark:border-white/10 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]/50'}`}
                            placeholder={step === 'LOCATION' ? 'SCAN BAY' : 'SCAN SKU'}
                            autoFocus
                            disabled={isProcessing}
                        />

                        {step === 'LOCATION' && inputVal.trim() && (
                            <div className="mt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center gap-3">
                                    {isStrictlyValid ? `DETECTED: ${decodeLocation(inputVal.trim().toUpperCase())}` : 'Scan a location barcode'}
                                </p>
                            </div>
                        )}

                        {/* OCCUPANCY WARNING */}
                        {awaitingOccupancyConfirmation && !isPlacementBlocked && (
                            <div className="mt-8 p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-400/50 animate-in zoom-in duration-500 shadow-xl shadow-amber-500/5">
                                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
                                    <AlertTriangle size={24} className="stroke-[3]" />
                                    <span className="font-black uppercase tracking-widest text-sm">Stock Merge Required</span>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-200/80 font-bold leading-relaxed text-left">
                                    Existing stock of this item is already at this location. Scan again to confirm and merge.
                                </p>
                            </div>
                        )}

                        {/* STRICT BLOCK WARNING */}
                        {isPlacementBlocked && (
                            <div className="mt-8 p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border-4 border-rose-500 animate-in zoom-in duration-500 shadow-2xl shadow-rose-500/10">
                                <div className="flex items-center gap-4 text-rose-600 dark:text-rose-500 mb-4">
                                    <X size={32} className="stroke-[4]" />
                                    <span className="font-black uppercase tracking-[0.1em] text-lg border-b-4 border-rose-600/30 dark:border-rose-500/30 pb-1">Placement Blocked</span>
                                </div>
                                <p className="text-sm font-black text-rose-800 dark:text-rose-200 leading-relaxed text-left mb-4 uppercase tracking-tight">
                                    Incompatible inventory detected: <span className="text-white bg-rose-600 px-2 py-0.5 rounded-lg shadow-lg font-mono">{conflictingOccupants[0]?.sku}</span>
                                </p>
                                <div className="flex items-center gap-3 bg-rose-600/10 p-3 rounded-2xl text-[10px] font-black uppercase text-rose-600 dark:text-rose-300 tracking-widest border border-rose-600/20">
                                    <AlertTriangle size={14} />
                                    <span>Mixed SKU storage is not allowed at this location.</span>
                                </div>
                            </div>
                        )}

                        {/* MOBILE ACTION BUTTON */}
                        <button
                            type="submit"
                            disabled={!inputVal.trim() || isProcessing || isPlacementBlocked}
                            className={`mt-10 w-full py-8 rounded-3xl flex items-center justify-center gap-4 transition-all duration-700 active:scale-95 shadow-2xl border-4 relative z-30 pointer-events-auto ${!inputVal.trim() || isProcessing
                                ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-700 opacity-60 cursor-not-allowed'
                                : isPlacementBlocked
                                    ? 'bg-rose-50 dark:bg-rose-600/20 border-rose-200 dark:border-rose-500/50 text-rose-500 cursor-not-allowed'
                                    : !isStrictlyValid
                                        ? 'bg-gray-900 border-transparent text-white'
                                        : awaitingOccupancyConfirmation || awaitingMismatchConfirmation
                                            ? 'bg-amber-500 border-amber-300 text-white font-black uppercase tracking-[0.2em] shadow-amber-500/40 animate-pulse'
                                            : 'bg-[#2C5E3B] hover:bg-[#1E3B24] border-[#2C5E3B] text-white font-black uppercase tracking-[0.2em] shadow-md'
                                }`}
                        >
                            {isProcessing ? (
                                <RotateCcw size={28} className="animate-spin" />
                            ) : isPlacementBlocked ? (
                                <X size={28} className="stroke-[3]" />
                            ) : (
                                <CheckCircle size={28} className="stroke-[3]" />
                            )}
                            <span className="text-xs font-black">
                                {isProcessing ? 'Processing...' : isPlacementBlocked ? 'BLOCKED' : awaitingOccupancyConfirmation ? 'CONFIRM MERGE' : awaitingMismatchConfirmation ? 'CONFIRM LOCATION' : 'SUBMIT'}
                            </span>
                        </button>
                    </form>

                    <p className="mt-12 text-gray-400 dark:text-gray-600 text-[10px] font-black font-mono uppercase tracking-[0.4em] z-10 text-center opacity-40">
                        Warehouse Scanner • Secure Connection
                    </p>
                </div>
            </div>
        </div>
    );
};
